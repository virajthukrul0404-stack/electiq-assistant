/**
 * @file voice.js
 * @description Manages voice recognition and speech synthesis.
 */
(function () {
  const namespace = (window.ElectIQ = window.ElectIQ || {});

  /**
   * Debounces a function call.
   * @param {Function} callback - The function to debounce.
   * @param {number} wait - The wait time in ms.
   * @returns {Function} The debounced function.
   */
  function debounce(callback, wait) {
    let timeoutId = 0;
    return function (...args) {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        callback.apply(this, args);
      }, wait);
    };
  }

  /**
   * Gets the speech recognition constructor if supported.
   * @returns {Function|null} The constructor or null.
   */
  function getRecognitionConstructor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  /**
   * Checks if speech recognition is supported.
   * @returns {boolean} True if supported.
   */
  function supportsSpeechRecognition() {
    return Boolean(getRecognitionConstructor());
  }

  /**
   * Provides friendly error messages for speech recognition errors.
   * @param {string} errorCode - The error code string.
   * @returns {string} User-friendly error message.
   */
  function friendlyError(errorCode) {
    const code = String(errorCode || "");
    if (code === "unsupported") return "Speech recognition is not supported in this browser. Chrome or Edge works best; you can still type your question.";
    if (code === "not-allowed" || code === "service-not-allowed") return "Microphone permission was blocked. Allow microphone access in the browser and click the mic again.";
    if (code === "audio-capture") return "No microphone was detected. Connect or enable a microphone, then try again.";
    if (code === "network") return "Speech recognition service is unavailable right now. You can still type your question.";
    if (code === "not-started") return "The browser did not start voice listening. Check microphone permission, use Chrome or Edge, or type your question.";
    if (code === "no-speech") return "I did not hear speech. Click the mic and try again.";
    if (code === "aborted") return "Voice listening stopped.";
    return code || "Speech recognition could not start in this browser.";
  }

  /**
   * Creates a voice controller.
   * @param {Object} options - Options containing event callbacks.
   * @returns {Object} Public voice control methods.
   */
  function createVoiceController(options) {
    const config = options || {};
    const onTranscript = typeof config.onTranscript === "function" ? config.onTranscript : () => {};
    const onFinalTranscript = typeof config.onFinalTranscript === "function" ? config.onFinalTranscript : () => {};
    const onStateChange = typeof config.onStateChange === "function" ? config.onStateChange : () => {};
    const onSpeakingChange = typeof config.onSpeakingChange === "function" ? config.onSpeakingChange : () => {};

    const Recognition = getRecognitionConstructor();
    let recognition = null;
    let voiceMode = false;
    let desiredContinuous = false;
    let isListening = false;
    let isStarting = false;
    let isSpeaking = false;
    let latestTranscript = "";
    let restartTimer = 0;
    let startTimer = 0;
    let lastError = "";
    let utterance = null;

    /**
     * Publishes the current state.
     * @param {Object} [extra] - Extra state properties.
     */
    const publishState = (extra) => {
      onStateChange(
        Object.assign(
          {
            supported: Boolean(Recognition),
            voiceMode,
            listening: isListening,
            starting: isStarting,
            speaking: isSpeaking,
            transcript: latestTranscript,
            error: lastError
          },
          extra || {}
        )
      );
    };

    const publishInterim = debounce((text) => {
      latestTranscript = text;
      onTranscript(text);
      publishState();
    }, 300);

    if (Recognition) {
      recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onstart = () => {
        window.clearTimeout(startTimer);
        isStarting = false;
        isListening = true;
        lastError = "";
        publishState();
      };

      recognition.onresult = (event) => {
        let interimText = "";
        let finalText = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const transcript = event.results[index][0].transcript.trim();
          if (event.results[index].isFinal) {
            finalText += transcript + " ";
          } else {
            interimText += transcript + " ";
          }
        }

        if (interimText.trim()) publishInterim(interimText.trim());

        if (finalText.trim()) {
          latestTranscript = finalText.trim();
          onTranscript(latestTranscript);
          onFinalTranscript(latestTranscript);
          publishState();
        }
      };

      recognition.onend = () => {
        const wasStarting = isStarting;
        window.clearTimeout(startTimer);
        isStarting = false;
        isListening = false;

        if (wasStarting && !lastError) {
          lastError = "not-started";
          publishState({ error: lastError });
          return;
        }

        publishState();

        if (voiceMode && desiredContinuous && lastError !== "not-allowed" && lastError !== "service-not-allowed") {
          restartTimer = window.setTimeout(() => {
            try {
              isStarting = true;
              publishState({ status: "restarting" });
              recognition.start();
            } catch (error) {
              isStarting = false;
              lastError = error.message;
              publishState({ error: lastError });
            }
          }, 250);
        }
      };

      recognition.onerror = (event) => {
        window.clearTimeout(startTimer);
        isStarting = false;
        isListening = false;
        lastError = event.error || "speech-error";
        if (lastError === "no-speech" && desiredContinuous) {
          publishState({ status: "no-speech" });
          return;
        }
        publishState({ error: lastError });
      };
    }

    /**
     * Starts listening for speech.
     * @param {boolean} continuous - Whether to listen continuously.
     * @returns {boolean} True if starting.
     */
    function startListening(continuous) {
      if (!recognition) {
        lastError = "unsupported";
        publishState({ error: "Speech recognition is not supported in this browser." });
        return false;
      }

      if (isListening || isStarting) return true;

      desiredContinuous = Boolean(continuous);
      window.clearTimeout(restartTimer);
      window.clearTimeout(startTimer);
      lastError = "";
      isStarting = true;
      publishState({ status: "starting" });
      try {
        recognition.start();
        startTimer = window.setTimeout(() => {
          if (isStarting && !isListening) {
            publishState({ status: "permission-pending" });
          }
        }, 1500);
        return true;
      } catch (error) {
        isStarting = false;
        lastError = error.message;
        publishState({ error: lastError });
        return false;
      }
    }

    /** Stops listening for speech. */
    function stopListening() {
      desiredContinuous = false;
      window.clearTimeout(restartTimer);
      window.clearTimeout(startTimer);
      if (recognition && isListening) recognition.stop();
      isStarting = false;
      isListening = false;
      publishState();
    }

    /**
     * Toggles continuous listening.
     * @returns {boolean} True if started.
     */
    function toggleAlwaysOn() {
      if (isListening && desiredContinuous) {
        stopListening();
        return false;
      }
      return startListening(true);
    }

    /** Stops speech synthesis. */
    function stopSpeaking() {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      utterance = null;
      isSpeaking = false;
      onSpeakingChange(false);
      publishState();
    }

    // Prevent GC bug in Chrome
    window.utterances = window.utterances || [];

    /**
     * Speaks text using speech synthesis.
     * @param {string} text - The text to speak.
     */
    function speak(text) {
      if (!voiceMode || !window.speechSynthesis || !text) return;

      stopSpeaking();
      utterance = new SpeechSynthesisUtterance(String(text));
      window.utterances.push(utterance); // Prevent GC

      utterance.rate = 1.02;
      utterance.pitch = 1;
      utterance.lang = "en-IN";
      utterance.onstart = () => {
        isSpeaking = true;
        onSpeakingChange(true);
        publishState();
      };
      utterance.onend = () => {
        isSpeaking = false;
        onSpeakingChange(false);
        publishState();
        const index = window.utterances.indexOf(utterance);
        if (index > -1) window.utterances.splice(index, 1);
      };
      utterance.onerror = () => {
        isSpeaking = false;
        onSpeakingChange(false);
        publishState({ error: "Speech synthesis failed." });
        const index = window.utterances.indexOf(utterance);
        if (index > -1) window.utterances.splice(index, 1);
      };
      window.speechSynthesis.speak(utterance);
    }

    /**
     * Enables or disables voice mode.
     * @param {boolean} enabled - True to enable.
     */
    function setVoiceMode(enabled) {
      voiceMode = Boolean(enabled);
      if (!voiceMode) {
        stopListening();
        stopSpeaking();
        latestTranscript = "";
        lastError = "";
        onTranscript("");
      }
      publishState();
    }

    publishState();

    return {
      setVoiceMode,
      startPushToTalk: () => startListening(false),
      stopPushToTalk: stopListening,
      toggleAlwaysOn,
      stopListening,
      speak,
      stopSpeaking,
      getFriendlyError: friendlyError,
      getState: () => ({
        supported: Boolean(Recognition),
        voiceMode,
        listening: isListening,
        starting: isStarting,
        speaking: isSpeaking,
        transcript: latestTranscript,
        error: lastError
      })
    };
  }

  /**
   * Test-friendly start helper that reports microphone-blocked states without throwing.
   * @param {Object} [options] - Optional controller callbacks.
   * @returns {Object} Voice state summary.
   */
  function startVoice(options) {
    const states = [];
    const controller = createVoiceController(
      Object.assign({}, options || {}, {
        onStateChange: (state) => {
          states.push(state);
          if (options && typeof options.onStateChange === "function") {
            options.onStateChange(state);
          }
        }
      })
    );
    try {
      const started = controller.toggleAlwaysOn();
      const state = controller.getState();
      if (!started || state.error === "unsupported" || state.error === "not-allowed") {
        return { state: "mic-blocked", details: state, history: states };
      }
      return { state: state.listening || state.starting ? "listening" : "idle", details: state, history: states };
    } catch (error) {
      return { state: "mic-blocked", error: error.message, history: states };
    }
  }

  /**
   * Converts speech recognition events into stable UI state names for tests.
   * @param {string} errorCode - Speech recognition error code.
   * @returns {Object} Normalized state.
   */
  function normalizeVoiceEvent(errorCode) {
    if (errorCode === "no-speech") return { state: "idle" };
    if (errorCode === "not-allowed" || errorCode === "service-not-allowed") return { state: "mic-blocked" };
    return { state: "idle" };
  }

  namespace.voice = {
    debounce,
    friendlyError,
    supportsSpeechRecognition,
    createVoiceController,
    startVoice,
    normalizeVoiceEvent
  };
})();
