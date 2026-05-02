/**
 * Pushes analytics events into the GA4 data layer.
 * @returns {void} No return value.
 */
function gtag() {
  window.dataLayer.push(arguments);
}

/**
 * Hides the injected Google Translate banner so it cannot shift the page.
 * @returns {void} No return value.
 */
function onGoogleTranslateReady() {
  const frame = document.querySelector(".goog-te-banner-frame");
  if (frame) {
    frame.style.display = "none";
  }
  document.body.style.top = "0px";
}

window.dataLayer = window.dataLayer || [];
gtag("js", new Date());
gtag("config", "G-ELECTIQ2026");

/**
 * Initializes the inline Google Translate widget and applies containment fixes.
 * @returns {void} No return value.
 */
window.googleTranslateElementInit = function () {
  if (!window.google || !window.google.translate || !window.google.translate.TranslateElement) {
    return;
  }
  new window.google.translate.TranslateElement(
    {
      pageLanguage: "en",
      layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
    },
    "google_translate_element"
  );
  window.setTimeout(onGoogleTranslateReady, 500);
};
