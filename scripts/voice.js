(function () {
  const namespace = (window.ElectIQ = window.ElectIQ || {});

  function debounce(callback, wait) {
    let timeoutId = 0;
    return function () {
      const context = this;
      const args = arguments;
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(function () {
        callback.apply(context, args);
      }, wait);
    };
  }

  function getRecognitionConstructor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function supportsSpeechRecognition() {
    return Boolean(getRecognitionConstructor());
  }

  function friendlyError(errorCode) {
    const code = String(errorCode || "");
    if (code === "unsupported") {
      return "Speech recognition is not supported in this browser. Chrome or Edge works best; you can still type your question.";
    }
    if (code === "not-allowed" || code === "service-not-allowed") {
      return "Microphone permission was blocked. Allow microphone access in the browser and click the mic again.";
    }
    if (code === "audio-capture") {
      return "No microphone was detected. Connect or enable a microphone, then try again.";
    }
    if (code === "network") {
      return "Speech recognition service is unavailable right now. You can still type your question.";
    }
    if (code === "not-started") {
      return "The browser did not start voice listening. Check microphone permission, use Chrome or Edge, or type your question.";
    }
    if (code === "no-speech") {
      return "I did not hear speech. Click the mic and try again.";
    }
    if (code === "aborted") {
      return "Voice listening stopped.";
    }
    return code || "Speech recognition could not start in this browser.";
  }

  function createVoiceController(options) {
    const config = options || {};
    const onTranscript = typeof config.onTranscript === "function" ? config.onTranscript : function () {};
    const onFinalTranscript = typeof config.onFinalTranscript === "function" ? config.onFinalTranscript : function () {};
    const onStateChange = typeof config.onStateChange === "function" ? config.onStateChange : function () {};
    const onSpeakingChange = typeof config.onSpeakingChange === "function" ? config.onSpeakingChange : function () {};

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

    const publishState = function (extra) {
      onStateChange(
        Object.assign(
          {
            supported: Boolean(Recognition),
            voiceMode: voiceMode,
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

    const publishInterim = debounce(function (text) {
      latestTranscript = text;
      onTranscript(text);
      publishState();
    }, 300);

    if (Recognition) {
      recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onstart = function () {
        window.clearTimeout(startTimer);
        isStarting = false;
        isListening = true;
        lastError = "";
        publishState();
      };

      recognition.onresult = function (event) {
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

        if (interimText.trim()) {
          publishInterim(interimText.trim());
        }

        if (finalText.trim()) {
          latestTranscript = finalText.trim();
          onTranscript(latestTranscript);
          onFinalTranscript(latestTranscript);
          publishState();
        }
      };

      recognition.onend = function () {
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
          restartTimer = window.setTimeout(function () {
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

      recognition.onerror = function (event) {
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

    function startListening(continuous) {
      if (!recognition) {
        lastError = "unsupported";
        publishState({ error: "Speech recognition is not supported in this browser." });
        return false;
      }

      if (isListening || isStarting) {
        return true;
      }

      desiredContinuous = Boolean(continuous);
      window.clearTimeout(restartTimer);
      window.clearTimeout(startTimer);
      lastError = "";
      isStarting = true;
      publishState({ status: "starting" });
      try {
        recognition.start();
        startTimer = window.setTimeout(function () {
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

    function stopListening() {
      desiredContinuous = false;
      window.clearTimeout(restartTimer);
      window.clearTimeout(startTimer);
      if (recognition && isListening) {
        recognition.stop();
      }
      isStarting = false;
      isListening = false;
      publishState();
    }

    function startPushToTalk() {
      desiredContinuous = false;
      return startListening(false);
    }

    function stopPushToTalk() {
      stopListening();
    }

    function toggleAlwaysOn() {
      if (isListening && desiredContinuous) {
        stopListening();
        return false;
      }
      return startListening(true);
    }

    function stopSpeaking() {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      utterance = null;
      isSpeaking = false;
      onSpeakingChange(false);
      publishState();
    }

    // Prevent GC bug in Chrome
    window.utterances = window.utterances || [];

    function speak(text) {
      if (!voiceMode || !window.speechSynthesis || !text) {
        return;
      }

      stopSpeaking();
      utterance = new SpeechSynthesisUtterance(String(text));
      window.utterances.push(utterance); // Prevent GC

      utterance.rate = 1.02;
      utterance.pitch = 1;
      utterance.lang = "en-IN";
      utterance.onstart = function () {
        isSpeaking = true;
        onSpeakingChange(true);
        publishState();
      };
      utterance.onend = function () {
        isSpeaking = false;
        onSpeakingChange(false);
        publishState();
        // Clean up
        const index = window.utterances.indexOf(utterance);
        if (index > -1) {
          window.utterances.splice(index, 1);
        }
      };
      utterance.onerror = function () {
        isSpeaking = false;
        onSpeakingChange(false);
        publishState({ error: "Speech synthesis failed." });
        // Clean up
        const index = window.utterances.indexOf(utterance);
        if (index > -1) {
          window.utterances.splice(index, 1);
        }
      };
      window.speechSynthesis.speak(utterance);
    }

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
      setVoiceMode: setVoiceMode,
      startPushToTalk: startPushToTalk,
      stopPushToTalk: stopPushToTalk,
      toggleAlwaysOn: toggleAlwaysOn,
      stopListening: stopListening,
      speak: speak,
      stopSpeaking: stopSpeaking,
      getFriendlyError: friendlyError,
      getState: function () {
        return {
          supported: Boolean(Recognition),
          voiceMode: voiceMode,
          listening: isListening,
          starting: isStarting,
          speaking: isSpeaking,
          transcript: latestTranscript,
          error: lastError
        };
      }
    };
  }

  namespace.voice = {
    debounce: debounce,
    friendlyError: friendlyError,
    supportsSpeechRecognition: supportsSpeechRecognition,
    createVoiceController: createVoiceController
  };
})();
