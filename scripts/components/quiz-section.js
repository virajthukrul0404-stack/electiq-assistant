/**
 * @file quiz-section.js
 * @description Quiz section shell component
 */
(function () {
  const namespace = (window.ElectIQ = window.ElectIQ || {});
  namespace.components = namespace.components || {};

  namespace.components.renderQuizSection = function (container) {
    if (!container) return;
    container.innerHTML = `
      <div class="section-heading">
        <div>
          <h2>Test Your Knowledge</h2>
          <p class="section-subtitle">
            Answer ten curated questions and get AI-powered study tips based on the questions you miss.
          </p>
        </div>
      </div>
      <div class="quiz-shell" id="quiz-app"></div>
    `;
  };
})();
