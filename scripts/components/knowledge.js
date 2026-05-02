/**
 * @file knowledge.js
 * @description Knowledge section component
 */
(function () {
  const namespace = (window.ElectIQ = window.ElectIQ || {});
  namespace.components = namespace.components || {};

  namespace.components.renderKnowledge = function (container) {
    if (!container) return;
    container.innerHTML = `
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
    `;
  };
})();
