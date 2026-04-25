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

  function escapeHtmlEntities(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizeText(value) {
    const unsafe = String(value || "");
    if (window.DOMPurify) {
      return window.DOMPurify.sanitize(unsafe, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
      });
    }
    return escapeHtmlEntities(unsafe);
  }

  function getStorage(storage) {
    return storage || window.localStorage;
  }

  function saveChatHistory(messages, storage) {
    getStorage(storage).setItem(STORAGE_KEY, JSON.stringify(messages || []));
  }

  function loadChatHistory(storage) {
    try {
      const raw = getStorage(storage).getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function announce(text) {
    const liveRegion = document.getElementById("sr-live");
    if (liveRegion) {
      liveRegion.textContent = text;
    }
  }

  function timestampLabel(value) {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function buildDownloadText(messages) {
    return (messages || [])
      .map(function (message) {
        return "[" + timestampLabel(message.timestamp) + "] " + message.role.toUpperCase() + ": " + message.content;
      })
      .join("\n\n");
  }

  function createIconButton(label, iconName, extraClass) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = extraClass || "mini-button";
    button.setAttribute("aria-label", label);
    button.textContent = label;
    if (iconName) {
      button.textContent = label;
    }
    return button;
  }

  function createMessageElement(message, role, isFinalized) {
    const wrapper = document.createElement("article");
    wrapper.className = "message " + role;

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = sanitizeText(message);

    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.innerHTML = "";

    const timestamp = document.createElement("span");
    timestamp.textContent = isFinalized ? timestampLabel(isFinalized) : "Streaming...";
    meta.appendChild(timestamp);

    const tools = document.createElement("div");
    tools.className = "message-tools";

    if (role === "assistant" && isFinalized) {
      const copyButton = createIconButton("Copy");
      const shareButton = createIconButton("Share");
      tools.append(copyButton, shareButton);
      meta.appendChild(tools);
      wrapper.dataset.message = message;
    }

    bubble.appendChild(meta);
    wrapper.appendChild(bubble);

    return {
      wrapper: wrapper,
      bubble: bubble,
      meta: meta,
      tools: tools
    };
  }

  function createWelcomeCard(prefill) {
    const card = document.createElement("section");
    card.className = "welcome-card";
    card.innerHTML =
      "<h3>Ask anything about elections</h3><p>Try a starter question or type your own. ElectIQ stays neutral and education-first.</p>";

    const chips = document.createElement("div");
    chips.className = "chip-row";
    QUICK_PROMPTS.forEach(function (prompt) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = prompt;
      button.addEventListener("click", function () {
        prefill(prompt, true);
      });
      chips.appendChild(button);
    });
    card.appendChild(chips);
    return card;
  }

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

    return {
      panel: panel,
      holdButton: holdButton,
      transcript: transcript
    };
  }

  function createTypingIndicator() {
    const wrapper = document.createElement("div");
    wrapper.className = "typing-indicator";
    wrapper.setAttribute("aria-label", "ElectIQ is typing");
    wrapper.innerHTML = "<span></span><span></span><span></span>";
    return wrapper;
  }

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
    const personaSelect = document.getElementById("persona-select");

    const messages = loadChatHistory();
    let isOpen = false;
    let isStreaming = false;
    let voiceModeEnabled = false;
    let voicePanel = null;

    const voiceController = namespace.voice.createVoiceController({
      onTranscript: function (text) {
        if (voicePanel) {
          voicePanel.transcript.textContent = text || "Listening for your question...";
        }
      },
      onFinalTranscript: function (text) {
        if (!voiceModeEnabled || !text || isStreaming) {
          return;
        }
        input.value = text;
        sendQuestion(text);
      },
      onSpeakingChange: function (speaking) {
        voiceStatus.textContent = speaking ? "AI is speaking..." : voiceModeEnabled ? "Voice mode on" : "Voice mode off";
      },
      onStateChange: function (state) {
        micToggle.classList.toggle("is-listening", Boolean(state.listening));
        if (state.error && voiceModeEnabled) {
          voiceStatus.textContent = state.error;
        } else if (!state.supported) {
          voiceStatus.textContent = "Speech recognition is unavailable in this browser.";
        } else if (state.listening) {
          voiceStatus.textContent = "Listening...";
        } else if (voiceModeEnabled) {
          voiceStatus.textContent = state.speaking ? "AI is speaking..." : "Voice mode on";
        } else {
          voiceStatus.textContent = "Voice mode off";
        }
      }
    });

    function persist() {
      saveChatHistory(messages);
    }

    function scrollToBottom() {
      window.requestAnimationFrame(function () {
        chatScroll.scrollTop = chatScroll.scrollHeight;
      });
    }

    function prefill(text, autoSend) {
      input.value = text || "";
      open();
      input.focus();
      if (autoSend) {
        sendQuestion(text);
      }
    }

    function attachAssistantTools(wrapper, promptText, answerText) {
      const toolButtons = wrapper.querySelectorAll(".mini-button");
      if (toolButtons.length < 2) {
        return;
      }
      const copyButton = toolButtons[0];
      const shareButton = toolButtons[1];

      copyButton.addEventListener("click", function () {
        navigator.clipboard.writeText(answerText).then(function () {
          status.textContent = "Answer copied to clipboard.";
        });
      });

      shareButton.addEventListener("click", function () {
        const shareText = ["ElectIQ AI Assistant", "", "Question: " + promptText, "", "Answer:", answerText].join("\n");
        navigator.clipboard.writeText(shareText).then(function () {
          status.textContent = "Branded answer snippet copied.";
        });
      });
    }

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

    function ensureVoicePanel() {
      if (voicePanel && document.getElementById(VOICE_PANEL_ID)) {
        chatScroll.prepend(voicePanel.panel);
        return;
      }

      voicePanel = createVoicePanel();
      chatScroll.prepend(voicePanel.panel);
      voicePanel.holdButton.addEventListener("pointerdown", function () {
        voiceController.startPushToTalk();
      });
      voicePanel.holdButton.addEventListener("pointerup", function () {
        voiceController.stopPushToTalk();
      });
      voicePanel.holdButton.addEventListener("pointerleave", function () {
        voiceController.stopPushToTalk();
      });
    }

    function removeVoicePanel() {
      const existing = document.getElementById(VOICE_PANEL_ID);
      if (existing) {
        existing.remove();
      }
    }

    function appendMessage(role, content) {
      const record = {
        role: role,
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

    async function sendQuestion(rawQuestion) {
      const question = sanitizeText(String(rawQuestion || "").slice(0, 500).trim());
      if (!question || isStreaming) {
        return;
      }

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
          history: history,
          message: question,
          persona: personaSelect.value,
          onChunk: function (_chunk, fullText) {
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
        const copyButton = createIconButton("Copy");
        const shareButton = createIconButton("Share");
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
        const errorMessage =
          error && error.retryAfter
            ? "Please wait " + Math.ceil(error.retryAfter / 1000) + " more second(s) before sending another question."
            : error.message || "Something went wrong while contacting Gemini.";
        appendMessage("assistant", errorMessage);
        status.textContent = errorMessage;
      } finally {
        isStreaming = false;
      }
    }

    function clearChat() {
      messages.length = 0;
      persist();
      renderMessages();
      status.textContent = "Chat history cleared.";
    }

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

    function open() {
      isOpen = true;
      chatWindow.classList.add("is-open");
      launcher.setAttribute("aria-expanded", "true");
      input.focus();
      scrollToBottom();
    }

    function close() {
      isOpen = false;
      chatWindow.classList.remove("is-open");
      launcher.setAttribute("aria-expanded", "false");
      voiceController.stopSpeaking();
    }

    launcher.addEventListener("click", function () {
      if (isOpen) {
        close();
      } else {
        open();
      }
    });

    closeButton.addEventListener("click", close);
    fullscreenToggle.addEventListener("click", function () {
      chatWindow.classList.toggle("is-fullscreen");
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      sendQuestion(input.value);
    });

    clearButton.addEventListener("click", clearChat);
    downloadButton.addEventListener("click", downloadChat);
    voiceModeToggle.addEventListener("click", function () {
      voiceModeEnabled = !voiceModeEnabled;
      voiceController.setVoiceMode(voiceModeEnabled);
      voiceModeToggle.classList.toggle("is-active", voiceModeEnabled);
      if (voiceModeEnabled) {
        ensureVoicePanel();
      } else {
        removeVoicePanel();
      }
      status.textContent = voiceModeEnabled ? "Voice mode enabled." : "Voice mode disabled.";
      renderMessages();
    });

    micToggle.addEventListener("click", function () {
      if (!voiceModeEnabled) {
        voiceModeEnabled = true;
        voiceController.setVoiceMode(true);
        renderMessages();
      }
      voiceController.toggleAlwaysOn();
    });

    renderMessages();

    return {
      open: open,
      close: close,
      prefill: prefill,
      sendQuestion: sendQuestion,
      clearChat: clearChat,
      getMessages: function () {
        return messages.slice();
      },
      setVoiceModeEnabled: function (enabled) {
        voiceModeEnabled = Boolean(enabled);
        voiceController.setVoiceMode(voiceModeEnabled);
        renderMessages();
      }
    };
  }

  namespace.chat = {
    STORAGE_KEY: STORAGE_KEY,
    QUICK_PROMPTS: QUICK_PROMPTS,
    escapeHtmlEntities: escapeHtmlEntities,
    sanitizeText: sanitizeText,
    saveChatHistory: saveChatHistory,
    loadChatHistory: loadChatHistory,
    createChatWidget: createChatWidget
  };
})();

