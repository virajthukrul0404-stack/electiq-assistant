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
  const feedbackTray = document.querySelector("#goog-gt-vt");
  if (feedbackTray) {
    feedbackTray.style.display = "none";
  }
  const tooltipTray = document.querySelector("#goog-gt-tt");
  if (tooltipTray) {
    tooltipTray.style.display = "none";
  }
  const downButton = document.querySelector("#goog-gt-thumbDownButton");
  if (downButton) {
    downButton.style.display = "none";
  }
  const upButton = document.querySelector("#goog-gt-thumbUpButton");
  if (upButton) {
    upButton.style.display = "none";
  }
  document.querySelectorAll(".goog-text-highlight").forEach((node) => {
    node.classList.remove("goog-text-highlight");
    node.removeAttribute("style");
  });
  document.body.style.top = "0px";
}

/**
 * Keeps late-injected Google Translate artifacts hidden.
 * @returns {void} No return value.
 */
function watchGoogleTranslateArtifacts() {
  const observer = new MutationObserver(() => {
    onGoogleTranslateReady();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class"]
  });
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
  window.setTimeout(onGoogleTranslateReady, 1200);
  watchGoogleTranslateArtifacts();
};
