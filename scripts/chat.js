/**
 * @file chat.js
 * @description Manages the chat widget and user interactions.
 */
(function () {
  const namespace = (window.ElectIQ = window.ElectIQ || {});
  const STORAGE_KEY = "electiq-chat-history";
  const VOICE_PANEL_ID = "voice-mode-panel";
  const QUICK_PROMPTS = [
    "How do I register to vote?",
    "What happens on Election Day?",
    "Explain the nomination process",
    "What is NOTA?",
    "How are votes counted?"
  ];

  /**
   * Escapes HTML entities to prevent XSS.
   * @param {string} value - The input string.
   * @returns {string} The escaped string.
   */
  function escapeHtmlEntities(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Sanitizes text input.
   * @param {string} value - The input string.
   * @returns {string} The sanitized string.
   */
  function sanitizeText(value) {
    if (window.DOMPurify) {
      return window.DOMPurify.sanitize(String(value || ""));
    }
    return escapeHtmlEntities(String(value || ""));
  }

  /**
   * Renders HTML content safely using DOMPurify if available.
   * @param {HTMLElement} wrapper - The container element.
   * @param {string} rawHtml - The raw HTML string.
   */
  function renderHTML(wrapper, rawHtml) {
    if (!wrapper) return;
    if (window.DOMPurify) {
      wrapper.innerHTML = window.DOMPurify.sanitize(rawHtml);
    } else {
      wrapper.textContent = rawHtml;
    }
  }

  /**
   * Gets the appropriate storage mechanism.
   * @param {Storage} storage - Optional storage object.
   * @returns {Storage} Local storage or fallback.
   */
  function getStorage(storage) {
    return storage || window.localStorage;
  }

  /**
   * Saves chat history to local storage.
   * @param {Object[]} messages - Array of message objects.
   * @param {Storage} [storage] - Optional storage object.
   */
  function saveChatHistory(messages, storage) {
    getStorage(storage).setItem(STORAGE_KEY, JSON.stringify(messages || []));
  }

  /**
   * Loads chat history from local storage.
   * @param {Storage} [storage] - Optional storage object.
   * @returns {Object[]} Array of message objects.
   */
  function loadChatHistory(storage) {
    try {
      const raw = getStorage(storage).getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Announces text to screen readers.
   * @param {string} text - The text to announce.
   */
  function announce(text) {
    const liveRegion = document.getElementById("sr-live");
    if (liveRegion) {
      liveRegion.textContent = text;
    }
  }

  /**
   * Formats a timestamp value into a short time string.
   * @param {number|Date} value - The timestamp.
   * @returns {string} Formatted time string.
   */
  function timestampLabel(value) {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  /**
   * Builds the formatted text for downloading chat history.
   * @param {Object[]} messages - Array of message objects.
   * @returns {string} Formatted download text.
   */
  function buildDownloadText(messages) {
    return (messages || [])
      .map((message) => \`[\${timestampLabel(message.timestamp)}] \${message.role.toUpperCase()}: \${message.content}\`)
      .join("\n\n");
  }

  /**
   * Creates an icon button element.
   * @param {string} label - The aria-label text.
   * @param {string} iconName - Material symbol icon name.
   * @param {string} [extraClass] - Additional CSS class.
   * @returns {HTMLButtonElement} The created button.
   */
  function createIconButton(label, iconName, extraClass) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = extraClass || "mini-button";
    button.setAttribute("aria-label", label);
    button.textContent = label;
    if (iconName) {
      button.innerHTML = \`<span class="material-symbols-outlined" aria-hidden="true">\${iconName}</span>\`;
      button.title = label;
    }
    return button;
  }

  /**
   * Creates a message DOM element wrapper.
   * @param {string} message - The message content.
   * @param {string} role - The message role ('user' or 'assistant').
   * @param {number} [isFinalized] - Timestamp if finalized, else undefined.
   * @returns {Object} Object containing DOM references for the message.
   */
  function createMessageElement(message, role, isFinalized) {
    const wrapper = document.createElement("article");
    wrapper.className = "message " + role;

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    
    if (role === "user") {
      bubble.textContent = message;
    } else {
      renderHTML(bubble, message);
    }

    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.innerHTML = "";

    const timestamp = document.createElement("span");
    timestamp.textContent = isFinalized ? timestampLabel(isFinalized) : "Streaming...";
    meta.appendChild(timestamp);

    const tools = document.createElement("div");
    tools.className = "message-tools";

    if (role === "assistant" && isFinalized) {
      const copyButton = createIconButton("Copy", "content_copy");
      const shareButton = createIconButton("Share", "share");
      tools.append(copyButton, shareButton);
      meta.appendChild(tools);
      wrapper.dataset.message = message;
    }

    bubble.appendChild(meta);
    wrapper.appendChild(bubble);

    return { wrapper, bubble, meta, tools };
  }

  /**
   * Creates the welcome card for the chat.
   * @param {Function} prefill - Callback to prefill the chat input.
   * @returns {HTMLElement} The card element.
   */
  function createWelcomeCard(prefill) {
    const card = document.createElement("section");
    card.className = "welcome-card";
    card.innerHTML =
      "<h3>Ask anything about elections</h3><p>Try a starter question or type your own. ElectIQ stays neutral and education-first.</p>";

    const chips = document.createElement("div");
    chips.className = "chip-row";
    QUICK_PROMPTS.forEach((prompt) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = prompt;
      button.addEventListener("click", () => prefill(prompt, true));
      chips.appendChild(button);
    });
    card.appendChild(chips);
    return card;
  }

  /**
   * Creates the voice control panel within the chat.
   * @returns {Object} Panel, hold button, and transcript elements.
   */
  function createVoicePanel() {
    const panel = document.createElement("section");
    panel.id = VOICE_PANEL_ID;
    panel.className = "voice-mode-panel";
    panel.innerHTML =
      '<h3>Voice mode</h3><p>Click the red mic for always-on listening, or hold the button below for push-to-talk.</p>';

    const visualizer = document.createElement("div");
    visualizer.className = "voice-visualizer";
    visualizer.innerHTML =
      '<div class="voice-circle" aria-hidden="true"></div><div class="voice-bars" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>';

    const toolbar = document.createElement("div");
    toolbar.className = "voice-toolbar";

    const holdButton = document.createElement("button");
    holdButton.type = "button";
    holdButton.className = "ghost-button";
    holdButton.textContent = "Hold to talk";

    const transcript = document.createElement("div");
    transcript.className = "transcript-box";
    transcript.textContent = "Your live transcript will appear here.";

    panel.append(visualizer, toolbar, transcript);
    toolbar.appendChild(holdButton);

    return { panel, holdButton, transcript };
  }

  /**
   * Creates a typing indicator element.
   * @returns {HTMLElement} The indicator element.
   */
  function createTypingIndicator() {
    const wrapper = document.createElement("div");
    wrapper.className = "typing-indicator";
    wrapper.setAttribute("aria-label", "ElectIQ is typing");
    wrapper.innerHTML = "<span></span><span></span><span></span>";
    return wrapper;
  }

  /**
   * Initializes the Chat Widget behavior.
   * @param {Object} options - Configuration options, like requestAI callback.
   * @returns {Object} Public chat control methods.
   */
  function createChatWidget(options) {
    const config = options || {};
    const launcher = document.getElementById("chat-launcher");
    const chatWindow = document.getElementById("chat-window");
    const closeButton = document.getElementById("close-chat");
    const fullscreenToggle = document.getElementById("fullscreen-toggle");
    const chatScroll = document.getElementById("chat-scroll");
    const clearButton = document.getElementById("clear-chat");
    const downloadButton = document.getElementById("download-chat");
    const form = document.getElementById("chat-form");
    const input = document.getElementById("chat-input");
    const status = document.getElementById("input-status");
    const voiceStatus = document.getElementById("voice-status");
    const micToggle = document.getElementById("mic-toggle");
    const voiceModeToggle = document.getElementById("voice-mode-toggle");
    const apiKeyToggle = document.getElementById("api-key-toggle");
    const personaSelect = document.getElementById("persona-select");

    const requiredElements = [launcher, chatWindow, closeButton, fullscreenToggle, chatScroll, clearButton, downloadButton, form, input, status, voiceStatus, micToggle, voiceModeToggle, personaSelect];
    if (requiredElements.some(el => !el)) return null;

    const messages = loadChatHistory();
    let isOpen = false;
    let isStreaming = false;
    let voiceModeEnabled = false;
    let voicePanel = null;
    let micStartWatchdog = 0;

    const voiceController = namespace.voice.createVoiceController({
      onTranscript: (text) => {
        if (voicePanel) {
          voicePanel.transcript.textContent = text || "Listening for your question...";
        }
      },
      onFinalTranscript: (text) => {
        if (!voiceModeEnabled || !text || isStreaming) return;
        input.value = text;
        sendQuestion(text);
      },
      onSpeakingChange: (speaking) => {
        voiceStatus.textContent = speaking ? "AI is speaking..." : voiceModeEnabled ? "Voice mode on" : "Voice mode off";
      },
      onStateChange: (state) => {
        micToggle.classList.toggle("is-listening", Boolean(state.listening));
        micToggle.classList.toggle("is-starting", Boolean(state.starting));
        micToggle.setAttribute("aria-pressed", state.listening ? "true" : "false");

        if (state.error && voiceModeEnabled) {
          voiceStatus.textContent = namespace.voice.friendlyError(state.error);
          micToggle.title = voiceStatus.textContent;
        } else if (!state.supported) {
          voiceStatus.textContent = namespace.voice.friendlyError("unsupported");
          micToggle.title = voiceStatus.textContent;
        } else if (state.starting || state.status === "starting") {
          voiceStatus.textContent = "Starting microphone...";
          micToggle.title = "Starting microphone...";
        } else if (state.status === "permission-pending") {
          voiceStatus.textContent = "Waiting for microphone permission...";
          micToggle.title = "Allow microphone access to use voice notes.";
        } else if (state.status === "no-speech") {
          voiceStatus.textContent = "Listening... speak your question.";
          micToggle.title = "Listening for your question.";
        } else if (state.listening) {
          voiceStatus.textContent = "Listening... speak your question.";
          micToggle.title = "Listening for your question.";
        } else if (voiceModeEnabled) {
          voiceStatus.textContent = state.speaking ? "AI is speaking..." : "Voice mode on";
          micToggle.title = "Click to start listening.";
        } else {
          voiceStatus.textContent = "Voice mode off";
          micToggle.title = "Click to enable voice mode and start listening.";
        }
      }
    });

    /** Save messages to local storage */
    function persist() {
      saveChatHistory(messages);
    }

    /** Smooth scroll to bottom of chat */
    function scrollToBottom() {
      window.requestAnimationFrame(() => {
        chatScroll.scrollTop = chatScroll.scrollHeight;
      });
    }

    /**
     * Prefills chat input and optionally sends it.
     * @param {string} text - The query.
     * @param {boolean} autoSend - True to send immediately.
     */
    function prefill(text, autoSend) {
      input.value = text || "";
      open();
      input.focus();
      if (autoSend) {
        sendQuestion(text);
      }
    }

    /**
     * Binds click events to copy and share buttons.
     * @param {HTMLElement} wrapper - Message wrapper.
     * @param {string} promptText - The user prompt.
     * @param {string} answerText - The assistant response.
     */
    function attachAssistantTools(wrapper, promptText, answerText) {
      const toolButtons = wrapper.querySelectorAll(".mini-button");
      if (toolButtons.length < 2) return;
      
      const copyButton = toolButtons[0];
      const shareButton = toolButtons[1];

      copyButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(answerText);
          status.textContent = "Answer copied to clipboard.";
        } catch (e) {
          console.error(e);
        }
      });

      shareButton.addEventListener("click", async () => {
        const shareText = ["ElectIQ AI Assistant", "", "Question: " + promptText, "", "Answer:", answerText].join("\n");
        try {
          await navigator.clipboard.writeText(shareText);
          status.textContent = "Branded answer snippet copied.";
        } catch (e) {
          console.error(e);
        }
      });
    }

    /** Renders the current chat history list */
    function renderMessages() {
      chatScroll.innerHTML = "";

      if (voiceModeEnabled) {
        ensureVoicePanel();
      }

      if (!messages.length) {
        chatScroll.appendChild(createWelcomeCard(prefill));
      }

      for (let index = 0; index < messages.length; index += 1) {
        const message = messages[index];
        const element = createMessageElement(message.content, message.role, message.timestamp);
        chatScroll.appendChild(element.wrapper);
        if (message.role === "assistant") {
          const question = index > 0 ? messages[index - 1].content : "Election question";
          attachAssistantTools(element.wrapper, question, message.content);
        }
      }
      scrollToBottom();
    }

    /** Ensure voice panel is prepended in the chat UI */
    function ensureVoicePanel() {
      if (voicePanel && document.getElementById(VOICE_PANEL_ID)) {
        chatScroll.prepend(voicePanel.panel);
        return;
      }

      voicePanel = createVoicePanel();
      chatScroll.prepend(voicePanel.panel);
      voicePanel.holdButton.addEventListener("pointerdown", () => voiceController.startPushToTalk());
      voicePanel.holdButton.addEventListener("pointerup", () => voiceController.stopPushToTalk());
      voicePanel.holdButton.addEventListener("pointerleave", () => voiceController.stopPushToTalk());
    }

    /** Removes voice panel from the DOM */
    function removeVoicePanel() {
      const existing = document.getElementById(VOICE_PANEL_ID);
      if (existing) existing.remove();
    }

    /**
     * Appends a message manually to the DOM.
     * @param {string} role - "user" or "assistant"
     * @param {string} content - Message content
     * @returns {Object} Message DOM wrappers
     */
    function appendMessage(role, content) {
      const record = {
        role,
        content: sanitizeText(content),
        timestamp: Date.now()
      };
      messages.push(record);
      persist();
      const element = createMessageElement(record.content, role, record.timestamp);
      chatScroll.appendChild(element.wrapper);
      scrollToBottom();
      announce(role === "assistant" ? "ElectIQ answered your question." : "Your message was added to the chat.");
      return element;
    }

    /**
     * Sends a question to the AI handler and handles stream/display.
     * @param {string} rawQuestion - Unsanitized user query.
     */
    async function sendQuestion(rawQuestion) {
      const question = sanitizeText(String(rawQuestion || "").slice(0, 500).trim());
      if (!question || isStreaming) return;

      const history = messages.slice();
      appendMessage("user", question);
      input.value = "";
      status.textContent = "ElectIQ is thinking...";
      isStreaming = true;

      const assistantWrapper = document.createElement("article");
      assistantWrapper.className = "message assistant";
      const assistantBubble = document.createElement("div");
      assistantBubble.className = "message-bubble";
      const assistantText = document.createElement("div");
      assistantText.textContent = "";
      const meta = document.createElement("div");
      meta.className = "message-meta";
      const streamLabel = document.createElement("span");
      streamLabel.textContent = "Streaming...";
      meta.appendChild(streamLabel);
      assistantBubble.append(assistantText, meta);
      assistantWrapper.appendChild(assistantBubble);
      chatScroll.appendChild(assistantWrapper);

      const typingIndicator = createTypingIndicator();
      chatScroll.appendChild(typingIndicator);
      scrollToBottom();

      let accumulated = "";
      try {
        const responseText = await config.requestAI({
          history,
          message: question,
          persona: personaSelect.value,
          onChunk: (_chunk, fullText) => {
            accumulated = sanitizeText(fullText);
            assistantText.textContent = accumulated;
            scrollToBottom();
          }
        });

        typingIndicator.remove();
        assistantText.textContent = sanitizeText(responseText);
        meta.innerHTML = "";
        const timestamp = document.createElement("span");
        timestamp.textContent = timestampLabel(Date.now());
        meta.appendChild(timestamp);
        const tools = document.createElement("div");
        tools.className = "message-tools";
        const copyButton = createIconButton("Copy", "content_copy");
        const shareButton = createIconButton("Share", "share");
        tools.append(copyButton, shareButton);
        meta.appendChild(tools);
        attachAssistantTools(assistantWrapper, question, sanitizeText(responseText));

        messages.push({
          role: "assistant",
          content: sanitizeText(responseText),
          timestamp: Date.now()
        });
        persist();
        if (voiceModeEnabled) {
          voiceController.speak(responseText);
        }
        status.textContent = "Ready for your next question.";
        announce("ElectIQ streamed a new answer.");
      } catch (error) {
        typingIndicator.remove();
        assistantWrapper.remove();
        if (error && (error.code === "api_key_revoked" || error.code === "api_key_invalid")) {
          namespace.gemini.clearApiKey();
        }
        const errorMessage =
          error && error.retryAfter
            ? \`Please wait \${Math.ceil(error.retryAfter / 1000)} more second(s) before sending another question.\`
            : error.message || "Something went wrong while contacting Gemini.";
        appendMessage("assistant", errorMessage);
        status.textContent = errorMessage;
      } finally {
        isStreaming = false;
      }
    }

    /** Clears chat history */
    function clearChat() {
      messages.length = 0;
      persist();
      renderMessages();
      status.textContent = "Chat history cleared.";
    }

    /** Downloads chat history */
    function downloadChat() {
      const blob = new Blob([buildDownloadText(messages)], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "electiq-chat-history.txt";
      link.click();
      URL.revokeObjectURL(url);
      status.textContent = "Chat export prepared.";
    }

    /** Opens chat panel */
    function open() {
      isOpen = true;
      chatWindow.classList.add("is-open");
      launcher.setAttribute("aria-expanded", "true");
      input.focus();
      scrollToBottom();
    }

    /** Closes chat panel */
    function close() {
      isOpen = false;
      chatWindow.classList.remove("is-open");
      launcher.setAttribute("aria-expanded", "false");
      voiceController.stopSpeaking();
    }

    // Bind UI actions
    launcher.addEventListener("click", () => isOpen ? close() : open());
    closeButton.addEventListener("click", close);
    fullscreenToggle.addEventListener("click", () => chatWindow.classList.toggle("is-fullscreen"));

    const charCounter = document.getElementById("char-counter");
    if (charCounter) {
      input.addEventListener("input", () => {
        charCounter.textContent = \`\${input.value.length} / 500\`;
      });
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      sendQuestion(input.value);
    });

    clearButton.addEventListener("click", clearChat);
    downloadButton.addEventListener("click", downloadChat);

    if (apiKeyToggle) {
      apiKeyToggle.addEventListener("click", () => {
        const popover = document.getElementById("api-key-popover");
        if (popover) {
          popover.style.display = popover.style.display === "none" ? "block" : "none";
          const popoverInput = document.getElementById("popover-api-key-input");
          if (popoverInput && popover.style.display === "block") {
            popoverInput.value = namespace.gemini.getApiKey() || "";
            popoverInput.focus();
          }
        }
      });
    }

    const popoverSave = document.getElementById("popover-api-key-save");
    if (popoverSave) {
      popoverSave.addEventListener("click", () => {
        const popoverInput = document.getElementById("popover-api-key-input");
        const popoverSuccess = document.getElementById("popover-api-key-success");
        if (popoverInput && popoverSuccess) {
          const val = popoverInput.value.trim();
          if (val) {
            namespace.gemini.setApiKey(val);
            popoverSuccess.style.display = "block";
            status.textContent = "API key saved. Gemini answers are enabled.";
            
            setTimeout(() => {
              popoverSuccess.style.display = "none";
              const popover = document.getElementById("api-key-popover");
              if (popover) popover.style.display = "none";
            }, 1500);
          }
        }
      });
    }

    voiceModeToggle.addEventListener("click", () => {
      voiceModeEnabled = !voiceModeEnabled;
      voiceController.setVoiceMode(voiceModeEnabled);
      voiceModeToggle.classList.toggle("is-active", voiceModeEnabled);
      if (voiceModeEnabled) ensureVoicePanel();
      else removeVoicePanel();
      status.textContent = voiceModeEnabled ? "Voice mode enabled." : "Voice mode disabled.";
      renderMessages();
    });

    micToggle.addEventListener("click", () => {
      if (!voiceModeEnabled) {
        voiceModeEnabled = true;
        voiceController.setVoiceMode(true);
        voiceModeToggle.classList.add("is-active");
        renderMessages();
      }
      status.textContent = "Starting voice note. Allow microphone access if your browser asks.";
      const started = voiceController.toggleAlwaysOn();
      if (!started) {
        input.focus();
        status.textContent = "Voice input is unavailable here. Type your question and press send.";
        return;
      }
      window.clearTimeout(micStartWatchdog);
      micStartWatchdog = window.setTimeout(() => {
        const voiceState = voiceController.getState();
        if (voiceModeEnabled && !voiceState.listening && !voiceState.starting) {
          const message = namespace.voice.friendlyError(voiceState.error || "not-started");
          voiceStatus.textContent = message;
          micToggle.title = message;
          status.textContent = "Voice did not start. You can type your question, or allow microphone access and try again.";
        }
      }, 2200);
    });

    renderMessages();
    if (!namespace.gemini.hasApiKey()) {
      status.textContent = "Using built-in election knowledge. Add a Gemini key for live AI.";
    }

    return {
      open,
      close,
      prefill,
      sendQuestion,
      clearChat,
      getMessages: () => messages.slice(),
      setVoiceModeEnabled: (enabled) => {
        voiceModeEnabled = Boolean(enabled);
        voiceController.setVoiceMode(voiceModeEnabled);
        renderMessages();
      }
    };
  }

  namespace.chat = {
    STORAGE_KEY,
    QUICK_PROMPTS,
    escapeHtmlEntities,
    sanitizeText,
    saveChatHistory,
    loadChatHistory,
    createChatWidget
  };
})();
