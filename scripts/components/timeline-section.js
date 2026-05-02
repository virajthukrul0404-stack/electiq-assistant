/**
 * @file timeline-section.js
 * @description Timeline section shell component
 */
(function () {
  const namespace = (window.ElectIQ = window.ElectIQ || {});
  namespace.components = namespace.components || {};

  namespace.components.renderTimelineSection = function (container) {
    if (!container) return;
    container.innerHTML = `
      <div class="section-heading">
        <div>
          <h2>Interactive Election Timeline</h2>
          <p class="section-subtitle">
            Explore each major election phase in a guided sequence. Expand any phase for details and send a focused follow-up straight to the AI assistant.
          </p>
        </div>
        <button class="ghost-button" type="button" id="ask-timeline-overview">
          <span class="material-symbols-outlined" aria-hidden="true">forum</span>
          Ask AI for a timeline overview
        </button>
      </div>
      <div class="timeline-shell">
        <div class="timeline-track" id="timeline-track"></div>
      </div>
    `;

    const askTimeline = document.getElementById("ask-timeline-overview");
    if (askTimeline && namespace.chatInstance) {
      askTimeline.addEventListener("click", function () {
        namespace.chatInstance.prefill("Give me a phase-by-phase overview of the election timeline.", true);
      });
    }
  };
})();
