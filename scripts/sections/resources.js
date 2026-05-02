/**
 * Render knowledge hub and footer resource sections.
 * @returns {{knowledge: string, footer: string}} Knowledge and footer HTML strings.
 */
export function resourcesTemplate() {
  return {
    knowledge: `
      <div class="section-heading">
        <div>
          <h2>Election Knowledge Hub</h2>
          <p class="section-subtitle">
            Quick answers, essential terms, and an India-specific calendar snapshot for civic learners, first-time voters, and curious citizens.
          </p>
        </div>
      </div>
      <div class="knowledge-layout">
        <article class="faq-shell">
          <div class="section-heading">
            <div>
              <h2>Frequently Asked Questions</h2>
              <p>Common election questions answered in neutral, simple language.</p>
            </div>
          </div>
          <div class="faq-list" id="faq-list"></div>
        </article>
        <aside class="faq-shell">
          <div class="section-heading">
            <div>
              <h2>India Election Snapshot</h2>
              <p>How a typical Indian election schedule unfolds after dates are announced.</p>
            </div>
          </div>
          <div class="india-calendar" id="india-calendar"></div>
        </aside>
      </div>
      <div class="section-heading mt-large">
        <div>
          <h2>Glossary</h2>
          <p>Thirty key terms to help you decode election news and official notices.</p>
        </div>
      </div>
      <div class="glossary-grid" id="glossary-grid"></div>
    `,
    footer: `
      <div class="footer-shell footer-grid">
        <article class="footer-card">
          <h3>Translate & Explore</h3>
          <p>Use the Google Translate widget for multilingual support and visit trusted, official election resources.</p>
          <div class="translate-wrapper">
            <div class="translate-slot" id="google_translate_element" aria-label="Google Translate widget"></div>
          </div>
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
    `
  };
}

/**
 * Mount the knowledge hub portion of the resources module.
 * @param {HTMLElement} containerEl - The container receiving the knowledge markup.
 * @returns {void} No return value.
 */
export default function mount(containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = resourcesTemplate().knowledge;
}

/**
 * Mount the footer portion of the resources module.
 * @param {HTMLElement} containerEl - The footer container receiving the footer markup.
 * @returns {void} No return value.
 */
export function mountFooter(containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = resourcesTemplate().footer;
}
