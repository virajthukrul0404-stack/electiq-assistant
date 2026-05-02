/**
 * Render the voting eligibility checker section.
 * @returns {string} Eligibility section HTML.
 */
export function eligibilityTemplate() {
  return `
    <div class="section-heading">
      <div>
        <h2>Check Your Voting Eligibility</h2>
        <p class="section-subtitle">
          This quick checker gives a friendly, high-level answer for civic learning. Always confirm with your official election authority.
        </p>
      </div>
    </div>
    <div class="eligibility-layout">
      <article class="eligibility-panel">
        <h3>Eligibility Checker</h3>
        <p>Enter your age and country to get an instant, educational eligibility snapshot.</p>
        <form class="eligibility-form" id="eligibility-form">
          <div class="field-grid">
            <div class="field-group">
              <label for="eligibility-age">Age</label>
              <input id="eligibility-age" name="age" type="number" min="0" max="120" inputmode="numeric" required aria-label="Enter your age" />
            </div>
            <div class="field-group">
              <label for="eligibility-country">Country</label>
              <select id="eligibility-country" name="country" aria-label="Select your country">
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
              </select>
            </div>
          </div>
          <button class="primary-button" type="submit">
            <span class="material-symbols-outlined" aria-hidden="true">how_to_vote</span>
            Check Now
          </button>
        </form>
      </article>
      <article class="fact-panel">
        <h3>Eligibility Result</h3>
        <div class="feedback-panel" id="eligibility-result" aria-live="polite">
          <strong>Ready when you are</strong>
          <p>ElectIQ will show whether the sample age is likely eligible, plus what to verify next.</p>
        </div>
        <div class="feedback-pill-row" id="eligibility-pills"></div>
        <div class="resource-list" id="official-links"></div>
      </article>
    </div>
  `;
}

/**
 * Mount the eligibility section into its container.
 * @param {HTMLElement} containerEl - The container receiving the eligibility shell.
 * @returns {void} No return value.
 */
export default function mount(containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = eligibilityTemplate();
}
