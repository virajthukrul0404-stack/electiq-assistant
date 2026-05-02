# ElectIQ - AI-Powered Election Education Assistant

![ElectIQ hero dashboard preview](assets/readme/hero-preview.svg)

<p align="center">
  <img src="assets/readme/assistant-preview.svg" alt="ElectIQ chatbot and voice assistant preview" width="49%">
  <img src="assets/readme/timeline-quiz-preview.svg" alt="ElectIQ timeline and quiz preview" width="49%">
</p>

## Chosen Vertical
Election Process Education.

ElectIQ is a non-partisan civic learning assistant focused on election processes, voter registration, polling, vote counting, and democratic participation. The content is India-first, with notes that rules vary across democracies.

## Problem Statement Alignment
ElectIQ is built for the Google H2S Virtual PromptWars challenge vertical: Election Process Education, with a focus on using Google technologies to create a smart, dynamic, practical civic assistant.

The civic education gap ElectIQ solves is that election information is often scattered across official portals, legal notices, media explainers, and school-level civics material. A first-time voter may know voting matters but still feel unsure about registration, nomination, polling-day rules, counting, NOTA, EVM/VVPAT verification, or where to find official reminders. ElectIQ turns that fragmented process into a guided, neutral, multilingual learning experience with voice, quiz practice, timeline exploration, and always-available fallback answers.

| Feature | Google Technology | Civic Education Gap Addressed |
| --- | --- | --- |
| Streaming election assistant | Gemini Flash API | Converts complex election procedures into simple, neutral explanations. |
| Multilingual footer support | Google Translate Widget | Helps learners who prefer Indian languages beyond English. |
| Civic stats dashboard | Google Charts | Makes election scale and turnout concepts easier to understand visually. |
| Election reminder links | Google Calendar | Helps citizens remember registration and election-cycle milestones. |
| Learning analytics hook | Google Analytics GA4 | Supports product iteration around real learning flows. |
| Premium typography and icons | Google Fonts and Material Symbols | Makes civic education feel approachable instead of bureaucratic. |
| Production hosting | Google Cloud Run | Provides a reliable public URL for evaluators and learners. |
| Voice-ready interaction | Web Speech API in Chrome | Supports hands-free civic Q&A and accessibility-friendly learning. |

## Live Demo
Live app: [ElectIQ on Google Cloud Run](https://electiq-assistant-5acpuyx6fa-el.a.run.app)

Public repository: [electiq-assistant](https://github.com/virajthukrul0404-stack/electiq-assistant)

## Features
- AI-style chatbot with Gemini streaming support and a built-in offline election knowledge fallback.
- Voice assistant mode using Web Speech API speech recognition and speech synthesis.
- Interactive seven-phase election timeline with focused "Ask AI" prompts.
- Ten-question election quiz with score tracking, answer reveal animation, and study tips.
- Voting eligibility checker for India and several other democracies.
- Persona switcher: Professor, Gen Z Guide, and News Anchor.
- Google Translate widget, Google Fonts, Google Material Icons, and GA4 snippet.
- Accessibility controls for font size, high contrast, keyboard navigation, and screen-reader announcements.
- Dark/light theme with premium civic-tech styling.

## Approach & Logic
The app uses a modular, component-based architecture relying exclusively on vanilla HTML, CSS, and JavaScript. Core civic data is split across specialized JSON files (`data/election-data.json`, `data/quiz.json`, `data/timeline.json`), which are loaded concurrently. Page sections are isolated into ES modules within `scripts/sections/` (hero, timeline, quiz, eligibility, Google services, and resources), maintaining a clean separation of concerns without requiring a build step.

Gemini is optional at runtime because public client-side keys can be revoked or restricted. If no valid key is saved, ElectIQ still answers using the local election knowledge base. This keeps the assistant usable during evaluation while preserving support for real Gemini streaming when the evaluator adds a fresh key through the key button in the chat header.

## Google Services Used
- Gemini Flash API via `generativelanguage.googleapis.com` for live AI answers when a valid key is provided.
- Google Cloud Run hosts the production app with a small containerized static server.
- Google Charts renders the in-app civic statistics dashboard from election-scale metrics.
- Google Calendar reminder links let learners add election milestone reminders to their own calendar.
- Google Translate Widget in the footer provides multilingual support across Indian languages.
- Google Analytics GA4 with measurement ID `G-ELECTIQ2026` tracks learning-product usage signals.
- Google Fonts: Space Grotesk, Inter, and JetBrains Mono.
- Google Material Symbols provide consistent action icons throughout the UI.

## How It Works
```text
User input
   |
   v
Chat / Voice / Timeline / Quiz UI
   |
   +--> Gemini streamGenerateContent API if a valid browser-saved key exists
   |
   +--> Local election knowledge fallback if Gemini is unavailable
   |
   +--> Google Charts dashboard + Google Calendar reminder links
   |
   v
Sanitized answer rendered in chat, optionally read aloud by SpeechSynthesis
```

## Tech Stack
- Vanilla HTML, CSS, and JavaScript with modular namespace components
- Google Gemini REST streaming endpoint
- Web Speech API
- DOMPurify CDN for strict HTML input sanitization
- Canvas Confetti CDN for perfect quiz scores
- Browser localStorage for non-sensitive preferences and chat history
- Browser sessionStorage for an optional user-provided Gemini key during the current tab session

## Setup & Run
1. Clone the repository.
2. Start a static server from the project root:
   ```bash
   python -m http.server 8080
   ```
3. Open `http://localhost:8080`.
4. Optional: click the key icon in the chat header and save a fresh Gemini API key from Google AI Studio for live Gemini responses.

The app also includes an embedded data fallback so the main page can still render when opened directly as `index.html`, though a local server is recommended for browser tests and JSON loading.

## Assumptions
- The user has a modern browser; Chrome or Edge is best for voice recognition.
- Eligibility results are educational snapshots, not legal advice.
- Gemini keys should not be committed to a public repository; users provide their own key locally if needed.
- Local fallback answers are scoped to election and civic education topics.

## Security Measures
- No active secret API key is committed.
- Chat input is capped at 500 characters.
- User messages are rendered with `textContent`.
- Assistant HTML is sanitized with DOMPurify.
- Gemini calls are rate-limited client-side.
- CSP meta tag limits allowed script and network sources.
- localStorage stores only non-sensitive preferences and chat history. Optional Gemini keys are session-only and are not committed.

## Accessibility
- Skip link to main content.
- Visible focus rings on interactive controls.
- ARIA labels and live regions for chat and dynamic status.
- Font scaling controls and high contrast mode.
- Semantic sections, forms, buttons, and keyboard-friendly interactions.

## Testing
Run the browser test suite at:

```text
http://localhost:8080/tests/test.html
```

The suite validates JSON structure, quiz data, timeline phases, sanitization, rate limiting, localStorage, voice fallback behavior, font scaling, Gemini prompt construction, and quiz score calculation.
