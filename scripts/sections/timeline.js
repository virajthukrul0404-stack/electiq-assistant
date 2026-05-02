/**
 * Render the interactive election timeline section shell.
 * @returns {string} Timeline section HTML.
 */
export function timelineTemplate() {
  return `
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
}

/**
 * Mount the timeline section into its container.
 * @param {HTMLElement} containerEl - The container receiving the timeline shell.
 * @returns {void} No return value.
 */
export default function mount(containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = timelineTemplate();
}
