/**
 * @file google-services.js
 * @description Google Services integration component
 */
(function () {
  const namespace = (window.ElectIQ = window.ElectIQ || {});
  namespace.components = namespace.components || {};

  namespace.components.renderGoogleServices = function (container) {
    if (!container) return;
    container.innerHTML = `
      <div class="section-heading">
        <div>
          <h2>Google Services Intelligence Layer</h2>
          <p class="section-subtitle">
            ElectIQ uses Google services actively, not decoratively: Gemini for answers, Translate for multilingual access,
            Analytics for product learning, Charts for civic statistics, Calendar for reminders, and Cloud Run for hosting.
          </p>
        </div>
      </div>
      <div class="google-service-layout">
        <article class="google-chart-card">
          <div class="service-card-heading">
            <span class="material-symbols-outlined" aria-hidden="true">monitoring</span>
            <div>
              <h3>Google Charts Civic Dashboard</h3>
              <p>Live-rendered visual summary of election scale and learning metrics.</p>
            </div>
          </div>
          <div id="google-civic-chart" class="google-civic-chart" role="img" aria-label="Google Charts election statistics visualization">
            Loading Google Charts civic dashboard...
          </div>
          <p class="chart-fallback" id="google-chart-fallback" hidden>
            Google Charts could not load, so ElectIQ keeps the same civic facts available in the hero stats and knowledge hub.
          </p>
        </article>
        <article class="google-calendar-card">
          <div class="service-card-heading">
            <span class="material-symbols-outlined" aria-hidden="true">event_available</span>
            <div>
              <h3>Google Calendar Reminders</h3>
              <p>Add demo election milestones to Google Calendar for practical planning.</p>
            </div>
          </div>
          <div class="calendar-reminder-list" id="calendar-reminder-list"></div>
        </article>
      </div>
      <div class="google-service-grid" id="google-service-grid" aria-label="Google services used by ElectIQ"></div>
    `;
  };
})();
