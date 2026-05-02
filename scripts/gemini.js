/**
 * @file gemini.js
 * @description Manages interactions with the Google Gemini API.
 */
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
  let lastRequestTime = 0;
  let activeModel = MODEL_CANDIDATES[0];

  /**
   * Normalizes text by trimming and standardizing whitespace.
   * @param {string} value - The text to normalize.
   * @returns {string} The normalized text.
   */
  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  /**
   * Delays execution for a specified number of milliseconds.
   * @param {number} ms - The number of milliseconds to delay.
   * @returns {Promise<void>}
   */
  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  /**
   * Gets the complete system prompt for a given persona.
   * @param {string} persona - The selected persona.
   * @returns {string} The complete prompt.
   */
  function getSystemPrompt(persona) {
    const personaPrompt = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.professor;
    return `${BASE_SYSTEM_PROMPT}\n\n${personaPrompt}`;
  }

  /**
   * Builds the formatted message history for the Gemini API.
   * @param {Object[]} history - Array of previous messages.
   * @returns {Object[]} The formatted history array.
   */
  function buildHistoryMessages(history) {
    return (history || [])
      .filter((item) => item && (item.role === "user" || item.role === "assistant") && normalizeText(item.content))
      .slice(-10)
      .map((item) => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: normalizeText(item.content) }]
      }));
  }

  /**
   * Builds the payload to send to the Gemini API.
   * @param {Object[]} history - The conversation history.
   * @param {string} message - The new user message.
   * @param {string} persona - The active persona.
   * @returns {Object} The complete payload.
   */
  function buildRequestPayload(history, message, persona) {
    const prompt = getSystemPrompt(persona);
    return {
      contents: [
        { role: "user", parts: [{ text: prompt }] },
        ...buildHistoryMessages(history),
        { role: "user", parts: [{ text: normalizeText(message) }] }
      ],
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

  /**
   * Extracts text from the Gemini API response payload.
   * @param {Object} payload - The API response payload.
   * @returns {string} The extracted text.
   */
  function extractTextFromPayload(payload) {
    if (!payload || !payload.candidates || !payload.candidates.length) return "";
    return payload.candidates
      .map((candidate) => {
        const parts = (candidate && candidate.content && candidate.content.parts) || [];
        return parts.map((part) => (part && part.text ? part.text : "")).join("");
      })
      .join("");
  }

  /**
   * Builds a cache key for the current request.
   * @param {Object[]} history - Conversation history.
   * @param {string} message - User message.
   * @param {string} persona - Active persona.
   * @returns {string} The generated JSON string cache key.
   */
  function buildCacheKey(history, message, persona) {
    return JSON.stringify({
      persona: persona || "professor",
      history: (history || []).map((item) => ({ role: item.role, content: normalizeText(item.content) })),
      message: normalizeText(message)
    });
  }

  /**
   * Checks if a new request can be made without hitting rate limits.
   * @returns {boolean} True if a request can be made.
   */
  function canMakeRequest() {
    const now = Date.now();
    if (now - lastRequestTime >= 2000) {
      lastRequestTime = now;
      return true;
    }
    return false;
  }

  /** Resets rate limiting for test purposes. */
  function resetRateLimitForTests() {
    lastRequestTime = 0;
  }

  /**
   * Gets the preferred storage mechanism.
   * @param {Storage} [storage] - Optional storage object.
   * @returns {Storage} Session storage or fallback.
   */
  function getStorage(storage) {
    return storage || window.sessionStorage;
  }

  /**
   * Checks if a key string appears valid.
   * @param {string} value - The key.
   * @returns {boolean} True if usable.
   */
  function isUsableKey(value) {
    const normalized = String(value || "").trim();
    return normalized && normalized !== "YOUR_GEMINI_API_KEY_HERE";
  }

  /**
   * Retrieves the Gemini API key from storage or config.
   * @param {Storage} [storage] - Optional storage object.
   * @returns {string} The active API key.
   */
  function getApiKey(storage) {
    const storedKey = getStorage(storage).getItem(API_KEY_STORAGE);
    if (isUsableKey(storedKey)) return String(storedKey).trim();

    const configKey = typeof ELECTIQ_CONFIG !== "undefined" ? ELECTIQ_CONFIG.GEMINI_API_KEY : "";
    if (isUsableKey(configKey)) return String(configKey).trim();

    return "";
  }

  /**
   * Saves the Gemini API key.
   * @param {string} value - The new API key.
   * @param {Storage} [storage] - Optional storage object.
   * @returns {string} The normalized key.
   */
  function setApiKey(value, storage) {
    const normalized = String(value || "").trim();
    if (normalized) {
      getStorage(storage).setItem(API_KEY_STORAGE, normalized);
      if (window.localStorage) window.localStorage.removeItem(API_KEY_STORAGE);
    } else {
      getStorage(storage).removeItem(API_KEY_STORAGE);
    }
    if (typeof ELECTIQ_CONFIG !== "undefined") {
      ELECTIQ_CONFIG.GEMINI_API_KEY = normalized;
    }
    return normalized;
  }

  /**
   * Clears the active Gemini API key.
   * @param {Storage} [storage] - Optional storage object.
   */
  function clearApiKey(storage) {
    getStorage(storage).removeItem(API_KEY_STORAGE);
    if (window.localStorage) window.localStorage.removeItem(API_KEY_STORAGE);
    if (typeof ELECTIQ_CONFIG !== "undefined") ELECTIQ_CONFIG.GEMINI_API_KEY = "";
  }

  /**
   * Checks if a valid API key exists.
   * @param {Storage} [storage] - Optional storage object.
   * @returns {boolean} True if an API key is present.
   */
  function hasApiKey(storage) {
    return isUsableKey(getApiKey(storage));
  }

  /**
   * Builds the API endpoint URL for streaming requests.
   * @param {string} modelName - The Gemini model.
   * @param {string} apiKey - The API key.
   * @returns {string} The constructed URL.
   */
  function buildEndpoint(modelName, apiKey) {
    return `${API_ROOT}${encodeURIComponent(modelName)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
  }

  /**
   * Safely parses JSON error objects.
   * @param {string} errorText - The raw error string.
   * @returns {Object|null} Parsed object or null.
   */
  function parseApiError(errorText) {
    try {
      return JSON.parse(errorText);
    } catch {
      return null;
    }
  }

  /**
   * Decides whether to try the next model candidate on failure.
   * @param {number} statusCode - The HTTP status code.
   * @param {string} errorText - The error body.
   * @returns {boolean} True if it should fallback to the next model.
   */
  function shouldTryNextModel(statusCode, errorText) {
    if (statusCode !== 404 && statusCode !== 400) return false;
    return /not found|not supported|unsupported/i.test(String(errorText || ""));
  }

  /**
   * Constructs user-friendly API error objects.
   * @param {number} statusCode - HTTP status code.
   * @param {string} errorText - Error response text.
   * @returns {Error} The detailed error.
   */
  function buildUserFacingApiError(statusCode, errorText) {
    const apiError = parseApiError(errorText);
    const apiMessage = apiError && apiError.error && apiError.error.message ? apiError.error.message : String(errorText || "");
    const friendlyError = new Error(`Gemini request failed: ${apiMessage}`);
    friendlyError.statusCode = statusCode;

    if (/reported as leaked|use another api key/i.test(apiMessage)) {
      friendlyError.code = "api_key_revoked";
      friendlyError.message = "This Gemini API key was revoked by Google. Open API Key settings in the chat and save a new key.";
    } else if (/api key not valid|invalid api key/i.test(apiMessage)) {
      friendlyError.code = "api_key_invalid";
      friendlyError.message = "This Gemini API key is invalid. Open API Key settings in the chat and save a valid key.";
    } else if (statusCode === 403) {
      friendlyError.code = "api_key_forbidden";
      friendlyError.message = "Gemini rejected this API key. Check that it is active and allowed to use the Gemini Developer API.";
    } else if (statusCode === 429) {
      friendlyError.code = "rate_limited_remote";
      friendlyError.message = "Gemini is rate-limiting this key right now. Wait a moment and try again.";
    }
    return friendlyError;
  }

  /**
   * Simulates a streaming response from the cache.
   * @param {string} text - Full text to stream.
   * @param {Function} onChunk - Chunk callback.
   * @returns {Promise<string>} The full text.
   */
  async function simulateStream(text, onChunk) {
    let aggregate = "";
    const response = String(text || "");
    for (let index = 0; index < response.length; index += 1) {
      aggregate += response[index];
      if (typeof onChunk === "function") onChunk(response[index], aggregate);
      await delay(6);
    }
    return aggregate;
  }

  /**
   * Performs the streaming generation request to the Gemini API.
   * @param {Object} options - Generation options containing history, message, persona, onChunk.
   * @returns {Promise<string>} The fully assembled response.
   */
  async function streamGenerate(options) {
    const history = options?.history || [];
    const message = normalizeText(options?.message);
    const persona = options?.persona || "professor";
    const onChunk = options?.onChunk;

    if (!message) throw new Error("Please enter a question before sending.");

    const cacheKey = buildCacheKey(history, message, persona);
    if (sessionCache.has(cacheKey)) return simulateStream(sessionCache.get(cacheKey), onChunk);

    if (!canMakeRequest()) {
      const rateLimitError = new Error("Please wait a moment before sending another question.");
      rateLimitError.retryAfter = 2000;
      throw rateLimitError;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      const missingKeyError = new Error("Add your Gemini API key in the chat settings to enable AI answers.");
      missingKeyError.code = "api_key_required";
      throw missingKeyError;
    }

    const payload = buildRequestPayload(history, message, persona);
    lastRequestTime = Date.now();

    const modelsToTry = [activeModel, ...MODEL_CANDIDATES.filter((name) => name !== activeModel)];
    let response = null;
    let lastErrorText = "";
    let attemptedModel = activeModel;

    for (const model of modelsToTry) {
      attemptedModel = model;
      response = await fetch(buildEndpoint(attemptedModel, apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        lastErrorText || `No compatible Gemini Flash model responded successfully after trying ${modelsToTry.join(", ")}.`
      );
    }

    if (!response.body || !response.body.getReader) {
      const json = await response.json();
      const fallbackText = extractTextFromPayload(json);
      sessionCache.set(cacheKey, fallbackText);
      if (typeof onChunk === "function") onChunk(fallbackText, fallbackText);
      return fallbackText;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let assembled = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/g);
      buffer = events.pop() || "";

      for (const eventChunk of events) {
        const lines = eventChunk.split(/\r?\n/g).map((line) => line.trim()).filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;

          const payloadText = line.slice(5).trim();
          if (!payloadText || payloadText === "[DONE]") continue;

          try {
            const parsed = JSON.parse(payloadText);
            const streamedText = extractTextFromPayload(parsed);
            if (!streamedText) continue;

            const delta = streamedText.startsWith(assembled) ? streamedText.slice(assembled.length) : streamedText;
            assembled = streamedText.startsWith(assembled) ? streamedText : assembled + streamedText;

            if (delta && typeof onChunk === "function") onChunk(delta, assembled);
          } catch (error) {
            console.warn("ElectIQ stream chunk parse issue", error);
          }
        }
      }
    }

    if (!assembled && buffer.trim()) {
      const trailingLines = buffer.split(/\r?\n/g).map((line) => line.trim()).filter(Boolean);
      for (const line of trailingLines) {
        if (!line.startsWith("data:")) continue;
        try {
          const parsed = JSON.parse(line.slice(5).trim());
          assembled += extractTextFromPayload(parsed);
        } catch {}
      }
    }

    sessionCache.set(cacheKey, assembled);
    return assembled;
  }

  namespace.gemini = {
    API_KEY_STORAGE,
    API_ROOT,
    MODEL: () => activeModel,
    MODEL_CANDIDATES: [...MODEL_CANDIDATES],
    BASE_SYSTEM_PROMPT,
    PERSONA_PROMPTS,
    sessionCache,
    buildEndpoint,
    buildRequestPayload,
    clearApiKey,
    extractTextFromPayload,
    getApiKey,
    getActiveModel: () => activeModel,
    getSystemPrompt,
    hasApiKey,
    canMakeRequest,
    resetRateLimitForTests,
    setApiKey,
    shouldTryNextModel,
    streamGenerate
  };
})();
