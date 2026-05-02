/**
 * @file footer.js
 * @description Footer component
 */
(function () {
  const namespace = (window.ElectIQ = window.ElectIQ || {});
  namespace.components = namespace.components || {};

  namespace.components.renderFooter = function (container) {
    if (!container) return;
    container.innerHTML = `
      <div class="footer-shell footer-grid">
        <article class="footer-card">
          <h3>Translate & Explore</h3>
          <p>Use the Google Translate widget for multilingual support and visit trusted, official election resources.</p>
          <div class="translate-slot" id="google_translate_element" aria-label="Google Translate widget"></div>
          <div class="resource-list" id="footer-links"></div>
        </article>
        <article class="footer-card">
          <h3>Election Facts</h3>
          <p id="footer-stats">
            India regularly conducts one of the world's largest democratic exercises, with millions of polling personnel, observers, and support staff working together.
          </p>
          <p class="mono-note">Stat cards are educational demo values and do not represent live official reporting.</p>
        </article>
        <article class="footer-card">
          <h3>Accessibility Controls</h3>
          <p>Adjust font size or boost contrast. Your settings are saved on this device.</p>
          <div class="accessibility-controls" id="font-controls" aria-label="Font size controls">
            <button class="control-chip" data-font="0.9" type="button" aria-label="Set small font size">A-</button>
            <button class="control-chip is-active" data-font="1.0" type="button" aria-label="Set medium font size">A</button>
            <button class="control-chip" data-font="1.15" type="button" aria-label="Set large font size">A+</button>
            <button class="control-chip" id="contrast-toggle" type="button" aria-label="Toggle high contrast mode">High Contrast</button>
          </div>
        </article>
      </div>
      <div class="footer-meta">
        <span>Built as a non-partisan educational assistant for election literacy.</span>
        <span>Made with vanilla HTML, CSS, JavaScript, and Google Gemini.</span>
      </div>
    `;
  };
})();
