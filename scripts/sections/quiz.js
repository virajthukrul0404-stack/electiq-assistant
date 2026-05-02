/**
 * Render the election quiz section shell.
 * @returns {string} Quiz section HTML.
 */
export function quizTemplate() {
  return `
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
}

/**
 * Mount the quiz section into its container.
 * @param {HTMLElement} containerEl - The container receiving the quiz shell.
 * @returns {void} No return value.
 */
export default function mount(containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = quizTemplate();
}
