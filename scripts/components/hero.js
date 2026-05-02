/**
 * @file hero.js
 * @description Hero component
 */
(function () {
  const namespace = (window.ElectIQ = window.ElectIQ || {});
  namespace.components = namespace.components || {};

  /**
   * Renders the Hero section
   * @param {HTMLElement} container - The container element
   */
  namespace.components.renderHero = function (container) {
    if (!container) return;
    container.innerHTML = `
      <div class="section-shell hero-grid">
        <div class="hero-copy">
          <div class="eyebrow">
            <span class="material-symbols-outlined" aria-hidden="true">verified</span>
            Neutral civic education powered by Gemini Flash
          </div>
          <h1>Elect<span>IQ</span></h1>
          <p class="tagline">Your AI Guide to the Democratic Process</p>
          <p>
            Understand every stage of elections, ask neutral questions in plain language, practice with
            interactive quizzes, and explore how Indian general elections compare with other democracies.
          </p>
          <div class="hero-actions">
            <a class="primary-button" href="#timeline-section">
              <span class="material-symbols-outlined" aria-hidden="true">school</span>
              Start Learning
            </a>
            <button class="secondary-button" id="open-chat-hero" type="button" aria-label="Open the ElectIQ AI chatbot">
              <span class="material-symbols-outlined" aria-hidden="true">chat</span>
              Ask AI
            </button>
          </div>
          <div class="hero-stats" id="hero-stats" aria-label="Key ElectIQ statistics"></div>
        </div>

        <div class="hero-side">
          <div class="hero-panel">
            <div class="visual-stage" aria-hidden="true">
              <div class="ballot-orb">
                <div class="spark-star"></div>
                <img src="assets/icons/ballot-ai.svg" alt="" />
              </div>
              <div class="ticker-wrap" aria-label="Live vote counter ticker">
                <div class="ticker-track" id="vote-ticker"></div>
              </div>
            </div>
          </div>
          <div class="countdown-card" id="countdown-card" aria-live="polite"></div>
          <div class="panel-grid">
            <article>
              <strong>AI persona switch</strong>
              <p>Swap between Professor, Gen Z Guide, and News Anchor voices without losing your chat history.</p>
            </article>
            <article>
              <strong>Voice-ready learning</strong>
              <p>Speak your question, watch the live transcript, and hear the answer read aloud.</p>
            </article>
          </div>
        </div>
      </div>
    `;

    const openChatHero = document.getElementById("open-chat-hero");
    if (openChatHero && namespace.chatInstance) {
      openChatHero.addEventListener("click", function () {
        namespace.chatInstance.open();
      });
    }
  };
})();
