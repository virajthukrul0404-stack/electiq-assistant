const ELECTIQ_CONFIG = {
  GEMINI_API_KEY: "",
  GEMINI_MODEL: "gemini-2.5-flash",
  RATE_LIMIT_MS: 2000
};

// On load, read a session-only key if the user supplied one through the UI.
(function() {
  const saved = sessionStorage.getItem("electiq_gemini_key");
  if (saved) ELECTIQ_CONFIG.GEMINI_API_KEY = saved;
})();
