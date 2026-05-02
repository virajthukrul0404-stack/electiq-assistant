# Contributing to ElectIQ

We welcome contributions to ElectIQ! Please follow these guidelines to help keep the project structured and secure.

## Code Standards
- **JavaScript**: Use modern JS features (`const`/`let`, `async`/`await`, arrow functions). Include JSDoc comments for all functions. Ensure strict null-checks before accessing DOM elements.
- **CSS**: Use variables for colors and spacing. Group related styles under clear section comments. Do not use inline styles.
- **HTML**: Maintain semantic structure. Ensure accessibility (`aria-labels`, `role` attributes, focus states) on interactive elements.

## Security
- Always sanitize dynamic HTML content using `DOMPurify`.
- Do not commit API keys or sensitive data.
- Ensure all external links include `rel="noopener noreferrer"`.
- Validate changes against the Content Security Policy (CSP).

## Testing
- Add tests to `tests/test.html` for any new logic or components.
- Ensure the existing test suite passes before submitting a pull request.

## Submitting Changes
1. Fork the repository.
2. Create a feature branch.
3. Commit your changes with descriptive messages.
4. Run the test suite (`tests/test.html`).
5. Open a Pull Request detailing the purpose and scope of your changes.
