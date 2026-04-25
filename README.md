# ElectIQ 🗳️ — AI-Powered Election Education Assistant

## Chosen Vertical
Election Process Education

## Live Demo
[GitHub Repository](https://github.com/virajthukrul0404-stack/electiq-assistant)

## Features
- 🧠 Gemini-powered election assistant with streaming responses, persona switching, session caching, and rate limiting
- 🗓️ Interactive election timeline with seven expandable phases and AI follow-up shortcuts
- 🎙️ Voice assistant mode with speech recognition, live transcript display, and spoken responses
- ✅ Ten-question election quiz with card-flip answers, progress tracking, confetti, and Gemini study tips
- 🌍 Google Translate widget for multilingual exploration
- ♿ Accessibility controls for theme, contrast, font size, visible focus rings, keyboard navigation, and screen-reader announcements
- ⏳ Election countdown timer and a fast voting eligibility checker
- 📥 Chat export, answer copy/share tools, local chat history, and browser-based test suite

## Approach & Logic
ElectIQ is built as a static, production-oriented single-page app so it can run without any backend setup. The interface is intentionally dark-mode first with premium civic-tech styling, but the JavaScript remains lean and framework-free.

The app is organized by feature area:
- `index.html` provides the accessible page shell and third-party service hooks.
- `styles/` separates global layout, chat interactions, and timeline/quiz visuals.
- `scripts/gemini.js` handles prompt construction, SSE streaming, request throttling, and session caching.
- `scripts/chat.js`, `scripts/voice.js`, `scripts/timeline.js`, and `scripts/quiz.js` own isolated UI behaviors.
- `scripts/app.js` initializes data, countdowns, eligibility logic, theme/accessibility state, and cross-feature orchestration.

## Google Services Used
- Gemini 1.5 Flash API (AI conversations)
- Google Fonts (Space Grotesk, Inter, JetBrains Mono)
- Google Material Icons
- Google Analytics GA4 (`G-ELECTIQ2026`)
- Google Translate Widget

## How It Works
1. Open `index.html` in a modern browser.
2. ElectIQ loads election content from `data/election-data.json` and falls back to embedded JSON if file loading is restricted.
3. The timeline, FAQ hub, glossary, eligibility checker, countdown, and quiz render on the page.
4. The chatbot sends a structured prompt plus recent chat history to Gemini and streams the answer back into the UI.
5. If voice mode is enabled, the browser captures speech with Web Speech API and reads the answer aloud with speech synthesis.

```text
User action
   |
   v
ElectIQ UI (chat / timeline / quiz / voice)
   |
   v
App logic + local state + safety guards
   |
   v
Gemini 1.5 Flash streaming endpoint
   |
   v
Progressive answer rendering + optional text-to-speech
```

## Tech Stack
- HTML5
- CSS3
- Vanilla JavaScript
- Google Gemini REST API
- Web Speech API
- DOMPurify
- canvas-confetti
- Google Fonts
- Google Material Icons
- Google Analytics
- Google Translate Widget

## Setup & Run
Open `index.html` in a modern browser such as Chrome.

For the included browser tests, open `tests/test.html`. If your browser blocks local JSON fetches on `file://`, run a tiny local static server and load both pages through `http://localhost`.

## Assumptions
- The app is primarily educational and non-partisan, not a legal advice tool.
- Indian general election workflows are the main reference model, with brief notes for other democracies.
- A client-side Gemini key is acceptable for this assignment because no backend was requested.
- Demo numbers in the hero ticker and countdown are illustrative and not official live election feeds.

## Security Measures
- User text is sanitized and rendered via safe text handling
- Gemini output is sanitized before display
- AI requests are rate-limited to one every two seconds
- Chat input is capped at 500 characters
- A CSP meta tag limits script, style, frame, and network origins
- No `eval()` usage and no sensitive data is stored in localStorage

## Accessibility
- Skip link for keyboard users
- Semantic headings, labels, and `aria-label` coverage for controls
- Screen-reader live region for chat updates
- Keyboard-activatable buttons and visible focus rings
- Contrast-aware theme tokens plus high-contrast mode
- Font size controls persisted in localStorage
- Motion kept below flash-risk thresholds and reduced-motion friendly
