(function () {
  const namespace = (window.ElectIQ = window.ElectIQ || {});
  const API_KEY_STORAGE = "electiq_gemini_key";
  const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models/";
  const MODEL_CANDIDATES = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-001", "gemini-1.5-flash-latest"];
  const BASE_SYSTEM_PROMPT = [
    "You are ElectIQ, a friendly and knowledgeable AI assistant specializing in election processes, democratic systems, voting procedures, and civic education.",
    "",
    "Your personality: Approachable, clear, non-partisan, educational, encouraging.",
    "",
    "Your capabilities:",
    "- Explain voter registration steps and eligibility",
    "- Walk through election timelines phase by phase",
    "- Describe how votes are cast, collected, and counted",
    "- Explain roles: Election Commission, Returning Officers, Polling Agents, Observers",
    "- Discuss different voting systems (FPTP, PR, EVM, postal voting, etc.)",
    "- Answer questions about election laws and rights",
    "- Provide general civic education",
    "",
    "Rules:",
    "- Always be non-partisan and neutral",
    "- Never favor any political party, candidate, or ideology",
    "- Keep explanations simple and accessible (aim for Grade 8 reading level)",
    "- Use numbered steps and bullet points for processes",
    "- If asked about a specific country, ask which country first for accuracy",
    "- For Indian elections specifically, you have deep knowledge of ECI, EVMs, VVPAT, MCC",
    "- Always encourage civic participation and voting",
    "- If asked something outside elections/civics, politely redirect back to your purpose"
  ].join("\n");

  const PERSONA_PROMPTS = {
    professor:
      "Persona mode: Professor. Use a calm, formal, detailed tone. Define terms clearly and explain why each election step matters.",
    genz:
      "Persona mode: Gen Z Guide. Stay neutral, but sound warm, modern, and relatable. Use plain language and short examples.",
    anchor:
      "Persona mode: News Anchor. Be authoritative, concise, and structured. Lead with key facts, then add context."
  };

  const sessionCache = new Map();
  let lastRequestAt = 0;
  let activeModel = MODEL_CANDIDATES[0];

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function getSystemPrompt(persona) {
    const personaPrompt = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.professor;
    return BASE_SYSTEM_PROMPT + "\n\n" + personaPrompt;
  }

  function buildHistoryMessages(history) {
    return (history || [])
      .filter(function (item) {
        return item && (item.role === "user" || item.role === "assistant") && normalizeText(item.content);
      })
      .slice(-10)
      .map(function (item) {
        return {
          role: item.role === "assistant" ? "model" : "user",
          parts: [{ text: normalizeText(item.content) }]
        };
      });
  }

  function buildRequestPayload(history, message, persona) {
    const prompt = getSystemPrompt(persona);
    return {
      contents: [{ role: "user", parts: [{ text: prompt }] }]
        .concat(buildHistoryMessages(history))
        .concat([{ role: "user", parts: [{ text: normalizeText(message) }] }]),
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        maxOutputTokens: 1024
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
      ]
    };
  }

  function extractTextFromPayload(payload) {
    if (!payload || !payload.candidates || !payload.candidates.length) {
      return "";
    }

    return payload.candidates
      .map(function (candidate) {
        const content = candidate && candidate.content;
        const parts = (content && content.parts) || [];
        return parts
          .map(function (part) {
            return part && part.text ? part.text : "";
          })
          .join("");
      })
      .join("");
  }

  function buildCacheKey(history, message, persona) {
    return JSON.stringify({
      persona: persona || "professor",
      history: (history || []).map(function (item) {
        return { role: item.role, content: normalizeText(item.content) };
      }),
      message: normalizeText(message)
    });
  }

  function isRateLimited(now) {
    const comparison = typeof now === "number" ? now : Date.now();
    return comparison - lastRequestAt < 2000;
  }

  function resetRateLimitForTests() {
    lastRequestAt = 0;
  }

  function getStorage(storage) {
    return storage || window.localStorage;
  }

  function getApiKey(storage) {
    const savedKey = getStorage(storage).getItem(API_KEY_STORAGE);
    if (savedKey) {
      ELECTIQ_CONFIG.GEMINI_API_KEY = savedKey;
      return savedKey.trim();
    }
    const configKey = typeof ELECTIQ_CONFIG !== 'undefined' ? ELECTIQ_CONFIG.GEMINI_API_KEY : "";
    if (configKey && configKey.trim() !== "YOUR_GEMINI_API_KEY_HERE") {
      return String(configKey).trim();
    }
    return "";
  }

  function setApiKey(value, storage) {
    const normalized = String(value || "").trim();
    if (normalized) {
      getStorage(storage).setItem(API_KEY_STORAGE, normalized);
    } else {
      getStorage(storage).removeItem(API_KEY_STORAGE);
    }
    return normalized;
  }

  function clearApiKey(storage) {
    getStorage(storage).removeItem(API_KEY_STORAGE);
  }

  function hasApiKey(storage) {
    const key = getApiKey(storage);
    return key && key.trim() !== "" && key !== "YOUR_GEMINI_API_KEY_HERE";
  }

  function buildEndpoint(modelName, apiKey) {
    return API_ROOT + encodeURIComponent(modelName) + ":streamGenerateContent?alt=sse&key=" + encodeURIComponent(apiKey);
  }

  function parseApiError(errorText) {
    try {
      return JSON.parse(errorText);
    } catch (error) {
      return null;
    }
  }

  function shouldTryNextModel(statusCode, errorText) {
    if (statusCode !== 404 && statusCode !== 400) {
      return false;
    }

    return /not found|not supported|unsupported/i.test(String(errorText || ""));
  }

  function buildUserFacingApiError(statusCode, errorText) {
    const apiError = parseApiError(errorText);
    const apiMessage = apiError && apiError.error && apiError.error.message ? apiError.error.message : String(errorText || "");
    const friendlyError = new Error("Gemini request failed: " + apiMessage);
    friendlyError.statusCode = statusCode;

    if (/reported as leaked|use another api key/i.test(apiMessage)) {
      friendlyError.code = "api_key_revoked";
      friendlyError.message = "This Gemini API key was revoked by Google. Open API Key settings in the chat and save a new key.";
      return friendlyError;
    }

    if (/api key not valid|invalid api key/i.test(apiMessage)) {
      friendlyError.code = "api_key_invalid";
      friendlyError.message = "This Gemini API key is invalid. Open API Key settings in the chat and save a valid key.";
      return friendlyError;
    }

    if (statusCode === 403) {
      friendlyError.code = "api_key_forbidden";
      friendlyError.message = "Gemini rejected this API key. Check that it is active and allowed to use the Gemini Developer API.";
      return friendlyError;
    }

    if (statusCode === 429) {
      friendlyError.code = "rate_limited_remote";
      friendlyError.message = "Gemini is rate-limiting this key right now. Wait a moment and try again.";
      return friendlyError;
    }

    return friendlyError;
  }

  async function simulateStream(text, onChunk) {
    let aggregate = "";
    const response = String(text || "");
    for (let index = 0; index < response.length; index += 1) {
      aggregate += response[index];
      if (typeof onChunk === "function") {
        onChunk(response[index], aggregate);
      }
      await delay(6);
    }
    return aggregate;
  }

  async function streamGenerate(options) {
    const history = options && options.history ? options.history : [];
    const message = normalizeText(options && options.message);
    const persona = (options && options.persona) || "professor";
    const onChunk = options && options.onChunk;

    if (!message) {
      throw new Error("Please enter a question before sending.");
    }

    const cacheKey = buildCacheKey(history, message, persona);
    if (sessionCache.has(cacheKey)) {
      return simulateStream(sessionCache.get(cacheKey), onChunk);
    }

    if (isRateLimited()) {
      const retryAfter = Math.max(0, 2000 - (Date.now() - lastRequestAt));
      const rateLimitError = new Error("Please wait a moment before sending another question.");
      rateLimitError.retryAfter = retryAfter;
      throw rateLimitError;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      const missingKeyError = new Error("Add your Gemini API key in the chat settings to enable AI answers.");
      missingKeyError.code = "api_key_required";
      throw missingKeyError;
    }

    const payload = buildRequestPayload(history, message, persona);
    lastRequestAt = Date.now();

    const modelsToTry = [activeModel]
      .concat(
        MODEL_CANDIDATES.filter(function (modelName) {
          return modelName !== activeModel;
        })
      )
      .filter(Boolean);

    let response = null;
    let lastErrorText = "";
    let attemptedModel = activeModel;

    for (let index = 0; index < modelsToTry.length; index += 1) {
      attemptedModel = modelsToTry[index];
      response = await fetch(buildEndpoint(attemptedModel, apiKey), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        activeModel = attemptedModel;
        break;
      }

      lastErrorText = await response.text();
      if (!shouldTryNextModel(response.status, lastErrorText)) {
        throw buildUserFacingApiError(response.status, lastErrorText);
      }
    }

    if (!response || !response.ok) {
      throw buildUserFacingApiError(
        response ? response.status : 500,
        lastErrorText || "No compatible Gemini Flash model responded successfully after trying " + modelsToTry.join(", ") + "."
      );
    }

    if (!response.body || !response.body.getReader) {
      const json = await response.json();
      const fallbackText = extractTextFromPayload(json);
      sessionCache.set(cacheKey, fallbackText);
      if (typeof onChunk === "function") {
        onChunk(fallbackText, fallbackText);
      }
      return fallbackText;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let assembled = "";

    while (true) {
      const result = await reader.read();
      if (result.done) {
        break;
      }

      buffer += decoder.decode(result.value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/g);
      buffer = events.pop() || "";

      events.forEach(function (eventChunk) {
        const lines = eventChunk
          .split(/\r?\n/g)
          .map(function (line) {
            return line.trim();
          })
          .filter(Boolean);

        lines.forEach(function (line) {
          if (!line.startsWith("data:")) {
            return;
          }

          const payloadText = line.slice(5).trim();
          if (!payloadText || payloadText === "[DONE]") {
            return;
          }

          try {
            const parsed = JSON.parse(payloadText);
            const streamedText = extractTextFromPayload(parsed);
            if (!streamedText) {
              return;
            }

            const delta = streamedText.startsWith(assembled) ? streamedText.slice(assembled.length) : streamedText;
            assembled = streamedText.startsWith(assembled) ? streamedText : assembled + streamedText;

            if (delta && typeof onChunk === "function") {
              onChunk(delta, assembled);
            }
          } catch (error) {
            console.warn("ElectIQ stream chunk parse issue", error);
          }
        });
      });
    }

    if (!assembled && buffer.trim()) {
      const trailingLines = buffer
        .split(/\r?\n/g)
        .map(function (line) {
          return line.trim();
        })
        .filter(Boolean);

      trailingLines.forEach(function (line) {
        if (!line.startsWith("data:")) {
          return;
        }
        const parsed = JSON.parse(line.slice(5).trim());
        assembled += extractTextFromPayload(parsed);
      });
    }

    sessionCache.set(cacheKey, assembled);
    return assembled;
  }

  namespace.gemini = {
    API_KEY_STORAGE: API_KEY_STORAGE,
    API_ROOT: API_ROOT,
    MODEL: function () {
      return activeModel;
    },
    MODEL_CANDIDATES: MODEL_CANDIDATES.slice(),
    BASE_SYSTEM_PROMPT: BASE_SYSTEM_PROMPT,
    PERSONA_PROMPTS: PERSONA_PROMPTS,
    sessionCache: sessionCache,
    buildEndpoint: buildEndpoint,
    buildRequestPayload: buildRequestPayload,
    clearApiKey: clearApiKey,
    extractTextFromPayload: extractTextFromPayload,
    getApiKey: getApiKey,
    getActiveModel: function () {
      return activeModel;
    },
    getSystemPrompt: getSystemPrompt,
    hasApiKey: hasApiKey,
    isRateLimited: isRateLimited,
    resetRateLimitForTests: resetRateLimitForTests,
    setApiKey: setApiKey,
    shouldTryNextModel: shouldTryNextModel,
    streamGenerate: streamGenerate
  };
})();
