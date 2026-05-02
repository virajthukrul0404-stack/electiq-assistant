/**
 * @file config.js
 * @description Centralized configuration settings for ElectIQ.
 */

/**
 * @typedef {Object} ElectIQConfig
 * @property {string} GEMINI_API_KEY - The active Gemini API key.
 * @property {string} GEMINI_MODEL - The default Gemini model to use.
 * @property {number} RATE_LIMIT_MS - The minimum time in ms between API requests.
 */

/** @type {ElectIQConfig} */
const ELECTIQ_CONFIG = {
  GEMINI_API_KEY: "",
  GEMINI_MODEL: "gemini-2.5-flash",
  RATE_LIMIT_MS: 2000
};

// On load, read a session-only key if the user supplied one through the UI.
(function() {
  try {
    const saved = sessionStorage.getItem("electiq_gemini_key");
    if (saved) {
      ELECTIQ_CONFIG.GEMINI_API_KEY = saved;
    }
  } catch (error) {
    console.warn("Could not read from sessionStorage.", error);
  }
})();
