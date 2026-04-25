# ElectIQ — AI-Powered Election Education Assistant

ElectIQ is a non-partisan, AI-driven educational tool designed to demystify complex electoral systems. From voter registration to government formation, ElectIQ guides users through the core processes of a functional democracy.

## Chosen Vertical: Election Process Education
This project specifically focuses on educating users about the phases and logistics of elections (with special depth on Indian democratic processes, while remaining adaptable to others).

## Live Demo: [link]
*(Add Vercel/Netlify live deployment link here once deployed)*

## Features
- 🧠 **AI Chatbot**: Real-time answers powered by Gemini 1.5 Flash.
- 🎙️ **Voice Mode**: Speak your questions to the assistant with live speech-to-text.
- 🚦 **Interactive Timeline**: Learn the 7 crucial phases of the election lifecycle.
- 🎯 **Eligibility Checker**: Find out if you meet the requirements to vote in various democracies.
- 🗣️ **Multilingual**: Google Translate widget to read content in any language.
- 📚 **Glossary & FAQs**: Browse top questions and key terms instantly.
- ♿ **Accessible**: A-/A/A+ scaling, contrast toggles, and screen reader-friendly roles.
- 👩‍🏫 **Custom Personas**: Switch AI personalities (Professor, Gen Z Guide, News Anchor).

## Google Services Used
- **Google Gemini API**: Provides the core generative AI chat responses (`gemini-1.5-flash`).
- **Google Cloud Translate**: Embedded widget for instant UI translation.
- **Google Analytics / Tag Manager**: (Analytics IDs included for demonstration/tracking).

## Quick Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/virajthukrul0404-stack/electiq-assistant.git
   cd electiq-assistant
   ```
2. Configuration:
   - Duplicate `scripts/config.example.js` and rename it to `scripts/config.js`.
   - Add your Gemini API Key in `scripts/config.js` or via the `🔑` icon in the Web UI.
3. Start a local server:
   ```bash
   python -m http.server 8080
   # or npx serve
   ```
4. Open `http://localhost:8080` in Chrome/Edge/Safari.

## How It Works
```text
  [ USER ] <----(UI interactions)----> [ VaniIla JS Frontend App ]
                                           |      |      |
                    (DOM Updates & A11Y) --+      |      +-- (Voice API)
                                                  |
                                            [ gemini.js ]
                                                  | (REST / SSE)
                                       [ Google Gemini API ]
```

## Tech Stack
- HTML5 / CSS3 (Vanilla)
- Vanilla JavaScript
- Google Gemini API (`generativelanguage.googleapis.com`)
- DOMPurify
- Web Speech API (SpeechRecognition & SpeechSynthesis)
- Canvas Confetti

## Security Measures
- **No Hardcoded Keys**: API keys are injected via `config.js` and ignored by Git. LocalStorage is strictly scoped for local caching.
- **XSS Protection**: User messages use strict `textContent`. Gemini HTML responses are scrubbed and sanitized via DOMPurify before being pushed to `innerHTML`.
- **Content Security Policy (CSP)**: Blocks unverified scripts from executing.
- **Rate Limiting**: Built-in 2000ms delay between consecutive requests to prevent API spam.
- **Input Validation**: `maxlength="500"` character cap on the chat input box.

## Accessibility (WCAG 2.1 AA)
- Semantic HTML tags (`<nav>`, `<header>`, `<footer>`, `<main>`).
- `<a href="#main-content" class="skip-link">Skip to main content</a>` available to keyboard users.
- Live Aria Regions for dynamic content updates (e.g. Chatbot Speech).
- Custom toggle variables: High-contrast mode and variable CSS font scaling (A- / A / A+).

## Assumptions Made
- Users will open the app using modern browsers (Chrome/Edge for full Web Speech Support).
- Application requires a static local server due to browser security restrictions around importing non-module scripts and fetching `.json` data over the `file://` protocol.
- Gemini rate limiting accounts for free-tier constraints.

## Testing
Run the 10-suite unit test natively in the browser:
1. Start your local server at the project root.
2. Navigate to `http://localhost:8080/tests/test.html`.
3. Assertions will validate JSON payloads, Quiz structure, LocalStorage mechanics, DOMPurify sanitization, and the Gemini Rate Limiter sequentially.
