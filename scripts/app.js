/**
 * @file app.js
 * @description Main application logic for ElectIQ.
 */
(function () {
  const namespace = (window.ElectIQ = window.ElectIQ || {});
  const c = namespace.constants;

  /**
   * Normalizes a query string by removing special characters and lowercasing.
   * @param {string} value - The input string.
   * @returns {string} The normalized string.
   */
  function normalizeQuery(value) {
    if (!value) return "";
    return String(value).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }

  /**
   * Checks if a text includes any of the specified words.
   * @param {string} text - The text to search within.
   * @param {string[]} words - The words to search for.
   * @returns {boolean} True if any word is found, false otherwise.
   */
  function textIncludesAny(text, words) {
    if (!text || !words) return false;
    return words.some((word) => text.indexOf(word) !== -1);
  }

  /**
   * Creates the local assistant handler.
   * @param {Object} data - The election data containing phases, faqs, glossary.
   * @returns {Object} An object with a respond method.
   */
  function createLocalAssistant(data) {
    const phases = data.phases || [];
    const faqs = data.faqs || [];
    const glossary = data.glossary || [];

    function findPhase(query) {
      return phases.find((phase) => {
        const haystack = normalizeQuery([phase.title, phase.description, phase.id].join(" "));
        return normalizeQuery(phase.title).split(" ").some((word) => {
          return word.length > 3 && query.indexOf(word) !== -1;
        }) || haystack.indexOf(query) !== -1;
      });
    }

    function findFaq(query) {
      return faqs.find((faq) => {
        const question = normalizeQuery(faq.question);
        return query && (question.indexOf(query) !== -1 || query.split(" ").some((word) => {
          return word.length > 4 && question.indexOf(word) !== -1;
        }));
      });
    }

    function findTerm(query) {
      return glossary.find((item) => {
        return query.indexOf(normalizeQuery(item.term)) !== -1;
      });
    }

    function phaseAnswer(phase) {
      return [
        phase.title + " is " + phase.description,
        "",
        "Key points:",
        "1. " + (phase.keyFacts && phase.keyFacts[0] ? phase.keyFacts[0] : "This phase keeps the process orderly and transparent."),
        "2. " + (phase.keyFacts && phase.keyFacts[1] ? phase.keyFacts[1] : "Officials follow written procedures to protect fairness."),
        "3. " + (phase.keyFacts && phase.keyFacts[2] ? phase.keyFacts[2] : "Rules can vary by country, so official guidance matters."),
        "",
        "What to remember: " + (phase.details && phase.details[0] ? phase.details[0] : "Check official election instructions early.")
      ].join("\n");
    }

    function respond(message) {
      const query = normalizeQuery(message);
      const phase = findPhase(query);
      if (phase) return phaseAnswer(phase);

      if (textIncludesAny(query, ["nota", "none of the above"])) {
        return c.FALLBACK_ANSWERS.NOTA;
      }

      if (textIncludesAny(query, ["count", "counted", "counting", "verification", "vvpat"])) {
        return phaseAnswer(phases.find((item) => item.id === "counting") || phases[4] || {});
      }

      if (textIncludesAny(query, ["register", "registration", "voter list", "electoral roll", "form 6"])) {
        return phaseAnswer(phases.find((item) => item.id === "registration") || phases[0] || {});
      }

      if (textIncludesAny(query, ["nomination", "candidate", "affidavit"])) {
        return phaseAnswer(phases.find((item) => item.id === "nomination") || phases[1] || {});
      }

      if (textIncludesAny(query, ["election day", "polling", "vote", "voting"])) {
        return phaseAnswer(phases.find((item) => item.id === "polling") || phases[3] || {});
      }

      const faq = findFaq(query);
      if (faq) return faq.answer;

      const term = findTerm(query);
      if (term) return term.term + ": " + term.definition;

      return c.FALLBACK_ANSWERS.DEFAULT;
    }

    return { respond };
  }

  /**
   * Streams a local answer back character by character.
   * @param {string} text - The answer text.
   * @param {Function} onChunk - Callback executed per chunk.
   * @returns {Promise<string>} Resolves with the full answer.
   */
  async function streamLocalAnswer(text, onChunk) {
    const answer = String(text || "");
    let built = "";
    for (let index = 0; index < answer.length; index += 1) {
      built += answer[index];
      if (typeof onChunk === "function") {
        onChunk(answer[index], built);
      }
      await new Promise((resolve) => window.setTimeout(resolve, 3));
    }
    return answer;
  }

  /**
   * Evaluates if a user is eligible to vote based on age and country.
   * @param {string|number} age - The user's age.
   * @param {string} country - The user's country.
   * @returns {Object} Object containing eligibility status and message.
   */
  function evaluateEligibility(age, country) {
    const normalizedCountry = String(country || "India");
    const votingAges = {
      India: 18,
      "United States": 18,
      "United Kingdom": 18,
      Canada: 18,
      Australia: 18,
      Brazil: 16
    };
    const requiredAge = votingAges[normalizedCountry] || 18;
    const numericAge = Number(age);

    if (!Number.isFinite(numericAge) || numericAge < 0 || numericAge > 120) {
      return {
        eligible: false,
        valid: false,
        title: "Enter a valid age",
        message: "Use an age between 0 and 120 so ElectIQ can give a useful learning snapshot.",
        pills: ["Educational only", "Check official rules"]
      };
    }

    const eligible = numericAge >= requiredAge;
    return {
      eligible,
      valid: true,
      title: eligible ? "Likely eligible to vote" : "Not eligible yet",
      message: eligible
        ? `In ${normalizedCountry}, the usual voting age is ${requiredAge}+. Next, confirm citizenship, residence, and registration status with the official election authority.`
        : `In ${normalizedCountry}, the usual voting age is ${requiredAge}+. You can still learn the process now and register when you meet the official requirements.`,
      pills: [
        normalizedCountry,
        `Voting age: ${requiredAge}+`,
        eligible ? "Registration check next" : "Learn before registration"
      ]
    };
  }

  /**
   * Utility for getting DOM element by ID.
   * @param {string} id - The ID of the element.
   * @returns {HTMLElement|null} The DOM element.
   */
  function $(id) {
    return document.getElementById(id);
  }

  /**
   * Escapes text before using it in HTML template strings.
   * @param {string} value - Raw text value.
   * @returns {string} Escaped HTML-safe text.
   */
  function sanitize(value) {
    if (namespace.utils && typeof namespace.utils.sanitize === "function") {
      return namespace.utils.sanitize(String(value || ""));
    }
    const node = document.createElement("div");
    node.textContent = String(value || "");
    return node.innerHTML;
  }

  /**
   * Mounts page sections from ES modules into the thin HTML shell.
   * @returns {Promise<void>} Resolves when section templates are mounted.
   */
  async function renderPageSections() {
    const [
      heroSection,
      eligibilitySection,
      timelineSection,
      quizSection,
      googleServicesSection,
      resourcesSection
    ] = await Promise.all([
      import("./sections/hero.js"),
      import("./sections/eligibility.js"),
      import("./sections/timeline.js"),
      import("./sections/quiz.js"),
      import("./sections/google-services.js"),
      import("./sections/resources.js")
    ]);

    const heroHost = $("top");
    if (heroHost) heroHost.innerHTML = heroSection.heroTemplate();

    const eligibilityHost = $("eligibility-section");
    if (eligibilityHost) eligibilityHost.innerHTML = eligibilitySection.eligibilityTemplate();

    const timelineHost = $("timeline-section");
    if (timelineHost) timelineHost.innerHTML = timelineSection.timelineTemplate();

    const quizHost = $("quiz-section");
    if (quizHost) quizHost.innerHTML = quizSection.quizTemplate();

    const googleHost = $("google-services-section");
    if (googleHost) googleHost.innerHTML = googleServicesSection.googleServicesTemplate();

    const resources = resourcesSection.resourcesTemplate();
    const knowledgeHost = $("knowledge-section");
    if (knowledgeHost) knowledgeHost.innerHTML = resources.knowledge;

    const footerHost = $("footer");
    if (footerHost) footerHost.innerHTML = resources.footer;
  }

  /**
   * Loads all JSON election data required for the app.
   * @returns {Promise<Object>} An object combining general, quiz, and timeline data.
   */
  async function loadElectionData() {
    try {
      const [dataRes, quizRes, timelineRes] = await Promise.all([
        fetch("data/election-data.json"),
        fetch("data/quiz.json"),
        fetch("data/timeline.json")
      ]);
      if (!dataRes.ok || !quizRes.ok || !timelineRes.ok) {
        throw new Error("Unable to load data JSON files.");
      }
      const data = await dataRes.json();
      const quiz = await quizRes.json();
      const phases = await timelineRes.json();
      return { ...data, quiz, phases };
    } catch (error) {
      console.error(error);
      const fallback = $("electiq-data-fallback");
      return fallback ? JSON.parse(fallback.textContent) : {};
    }
  }

  /**
   * Applies the selected font scale to the document.
   * @param {string} scaleValue - The font scale factor.
   * @returns {string} The applied scale.
   */
  function applyFontScale(scaleValue) {
    const value = String(scaleValue || "1");
    document.documentElement.style.setProperty("--font-scale", value);
    window.localStorage.setItem(c.STORAGE_KEYS.fontScale, value);
    return value;
  }

  /**
   * Applies the selected theme (dark or light) to the document.
   * @param {string} theme - 'dark' or 'light'.
   * @returns {string} The applied theme.
   */
  function applyTheme(theme) {
    const normalized = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = normalized;
    window.localStorage.setItem(c.STORAGE_KEYS.theme, normalized);
    const themeToggle = $("theme-toggle");
    if (themeToggle) {
      themeToggle.innerHTML =
        '<span class="material-symbols-outlined" aria-hidden="true">' +
        (normalized === "light" ? "light_mode" : "dark_mode") +
        "</span>";
    }
    return normalized;
  }

  /**
   * Applies high contrast mode to the document.
   * @param {boolean} enabled - True to enable high contrast.
   * @returns {boolean} The applied boolean state.
   */
  function applyContrast(enabled) {
    const active = Boolean(enabled);
    document.documentElement.dataset.contrast = active ? "high" : "normal";
    document.body.classList.toggle("high-contrast", active);
    window.localStorage.setItem(c.STORAGE_KEYS.contrast, active ? "high" : "normal");
    return active;
  }

  /**
   * Updates font control button active states.
   * @param {string} value - The currently active font scale.
   */
  function updateFontControlState(value) {
    document.querySelectorAll("[data-font]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.font === String(value));
    });
  }

  /**
   * Seeds the hero stat cards.
   */
  function seedHeroStats() {
    const host = $("hero-stats");
    if (!host) return;
    host.innerHTML = "";
    c.HERO_STATS.forEach((stat) => {
      const card = document.createElement("article");
      card.className = "stat-card";
      card.innerHTML =
        '<span class="material-symbols-outlined" aria-hidden="true">' +
        sanitize(stat.icon) +
        "</span><strong>" +
        sanitize(stat.value) +
        "</strong><span>" +
        sanitize(stat.label) +
        "</span>";
      host.appendChild(card);
    });
  }

  /**
   * Starts the hero ticker animation with duplicate elements.
   */
  function startTicker() {
    const ticker = $("vote-ticker");
    if (!ticker) return;
    const values = c.TICKER_VALUES.concat(c.TICKER_VALUES);
    values.forEach((item) => {
      const span = document.createElement("span");
      span.textContent = item;
      ticker.appendChild(span);
    });
  }

  /**
   * Renders official links in designated containers.
   */
  function renderOfficialLinks() {
    const host = $("official-links");
    const footerHost = $("footer-links");
    [host, footerHost].forEach((container) => {
      if (!container) return;
      container.innerHTML = "";
      c.OFFICIAL_LINKS.forEach((linkData) => {
        const anchor = document.createElement("a");
        anchor.href = linkData.href;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.innerHTML =
          '<span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>' + sanitize(linkData.label);
        container.appendChild(anchor);
      });
    });
  }

  /**
   * Renders the FAQ list into its container.
   * @param {Object[]} faqs - The FAQ objects array.
   */
  function renderFAQs(faqs) {
    const host = $("faq-list");
    if (!host) return;
    host.innerHTML = "";
    faqs.slice(0, 8).forEach((faq) => {
      const item = document.createElement("details");
      item.className = "faq-item";
      const summary = document.createElement("summary");
      summary.innerHTML =
        "<span>" + sanitize(faq.question) + '</span><span class="material-symbols-outlined" aria-hidden="true">expand_more</span>';
      const answer = document.createElement("p");
      answer.textContent = faq.answer;
      item.append(summary, answer);
      host.appendChild(item);
    });
  }

  /**
   * Renders the glossary terms grid.
   * @param {Object[]} terms - The array of glossary items.
   */
  function renderGlossary(terms) {
    const host = $("glossary-grid");
    if (!host) return;
    host.innerHTML = "";
    terms.forEach((term) => {
      const card = document.createElement("article");
      card.className = "glossary-card";
      card.innerHTML = "<strong>" + sanitize(term.term) + "</strong><span>" + sanitize(term.definition) + "</span>";
      host.appendChild(card);
    });
  }

  /**
   * Renders the India calendar snapshot sidebar.
   * @param {Object[]} steps - The array of timeline steps.
   */
  function renderIndiaCalendar(steps) {
    const host = $("india-calendar");
    if (!host) return;
    host.innerHTML = "";
    steps.forEach((step) => {
      const card = document.createElement("article");
      card.className = "calendar-step";
      card.innerHTML = "<strong>" + sanitize(step.step) + "</strong><span>" + sanitize(step.note) + "</span>";
      host.appendChild(card);
    });
  }

  /**
   * Formats a date for Google Calendar links.
   * @param {string|Date} date - The date to format.
   * @returns {string} The formatted date string.
   */
  function formatCalendarDate(date) {
    return new Date(date)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  }

  /**
   * Builds the Google Calendar event URL.
   * @param {Object} event - The event object details.
   * @returns {string} The constructed URL.
   */
  function buildGoogleCalendarUrl(event) {
    const start = new Date(event.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: "ElectIQ reminder: " + event.name,
      dates: formatCalendarDate(start) + "/" + formatCalendarDate(end),
      details: event.note + " Created from ElectIQ, an AI-powered election education assistant.",
      location: "India"
    });
    return "https://calendar.google.com/calendar/render?" + params.toString();
  }

  /**
   * Renders the list of Google Calendar reminders.
   */
  function renderGoogleCalendarReminders() {
    const host = $("calendar-reminder-list");
    if (!host) return;

    host.innerHTML = "";
    c.DEMO_ELECTIONS.forEach((event) => {
      const link = document.createElement("a");
      link.href = buildGoogleCalendarUrl(event);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "calendar-reminder";

      const date = new Date(event.date);
      const icon = document.createElement("span");
      icon.className = "material-symbols-outlined";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "event";

      const copy = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = event.name;
      const meta = document.createElement("small");
      meta.textContent = date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) + " - Add to Google Calendar";
      copy.append(title, meta);

      link.append(icon, copy);
      host.appendChild(link);
    });
  }

  /**
   * Renders the Google Service grid of cards.
   */
  function renderGoogleServiceGrid() {
    const host = $("google-service-grid");
    if (!host) return;

    host.innerHTML = "";
    c.GOOGLE_SERVICE_CARDS.forEach((service) => {
      const card = document.createElement("article");
      card.className = "google-service-card";

      const icon = document.createElement("span");
      icon.className = "material-symbols-outlined";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = service.icon;

      const title = document.createElement("strong");
      title.textContent = service.title;

      const detail = document.createElement("p");
      detail.textContent = service.detail;

      card.append(icon, title, detail);
      host.appendChild(card);
    });
  }

  /**
   * Draws the Google Charts visualization.
   */
  function drawGoogleCivicChart() {
    const chartHost = $("google-civic-chart");
    const fallback = $("google-chart-fallback");
    if (!chartHost) return;

    if (!window.google || !google.visualization || !google.visualization.DataTable) {
      chartHost.textContent = "Google Charts is unavailable.";
      if (fallback) fallback.hidden = false;
      return;
    }

    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn("string", "Metric");
    dataTable.addColumn("number", "Scale");
    dataTable.addRows([
      ["Eligible voters (millions)", 968],
      ["Polling stations (ten-thousands)", 105],
      ["Turnout benchmark", 67.4],
      ["Civic access hours", 24]
    ]);

    const options = {
      backgroundColor: "transparent",
      legend: { position: "none" },
      chartArea: { left: 170, top: 24, width: "68%", height: "72%" },
      colors: ["#3b82f6"],
      hAxis: {
        textStyle: { color: getComputedStyle(document.documentElement).getPropertyValue("--text-muted").trim() || "#94a3b8" },
        gridlines: { color: "rgba(148, 163, 184, 0.12)" },
        baselineColor: "rgba(148, 163, 184, 0.2)"
      },
      vAxis: {
        textStyle: { color: getComputedStyle(document.documentElement).getPropertyValue("--text-primary").trim() || "#f1f5f9" }
      },
      animation: {
        startup: true,
        duration: 800,
        easing: "out"
      }
    };

    const chart = new google.visualization.BarChart(chartHost);
    chart.draw(dataTable, options);
  }

  /**
   * Initializes the Google Charts loader.
   */
  function initGoogleCharts() {
    const chartHost = $("google-civic-chart");
    if (!chartHost) return;

    if (!window.google || !google.charts) {
      drawGoogleCivicChart();
      return;
    }

    google.charts.load("current", { packages: ["corechart"] });
    google.charts.setOnLoadCallback(drawGoogleCivicChart);
    window.addEventListener("resize", () => {
      window.clearTimeout(initGoogleCharts.resizeTimer);
      initGoogleCharts.resizeTimer = window.setTimeout(drawGoogleCivicChart, 200);
    });
  }

  /**
   * Updates the UI countdown ticker based on the nearest demo election.
   */
  function updateCountdown() {
    const card = $("countdown-card");
    if (!card) return;
    const now = new Date();
    const upcoming = c.DEMO_ELECTIONS.find((entry) => new Date(entry.date) > now) || c.DEMO_ELECTIONS[0];
    const target = new Date(upcoming.date);
    const diff = Math.max(0, target.getTime() - now.getTime());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    card.innerHTML =
      '<div class="countdown-header"><div><strong>Election countdown</strong><p>' +
      sanitize(upcoming.name) +
      "</p></div><span class=\"phase-chip\">Demo clock</span></div>" +
      '<div class="countdown-grid">' +
      [
        { label: "Days", value: days },
        { label: "Hours", value: hours },
        { label: "Minutes", value: minutes },
        { label: "Seconds", value: seconds }
      ]
        .map((unit) => {
          return (
            '<div class="countdown-unit"><strong>' +
            String(unit.value).padStart(2, "0") +
            "</strong><span>" +
            unit.label +
            "</span></div>"
          );
        })
        .join("") +
      "</div><p>" +
      sanitize(upcoming.note) +
      "</p>";
  }

  /**
   * Binds events and logic to the eligibility checker form.
   */
  function setupEligibilityChecker() {
    const form = $("eligibility-form");
    const ageInput = $("eligibility-age");
    const countrySelect = $("eligibility-country");
    const resultPanel = $("eligibility-result");
    const pillsHost = $("eligibility-pills");

    if (!form || !ageInput || !countrySelect || !resultPanel || !pillsHost) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      let sanitizedAge = ageInput.value;
      let sanitizedCountry = countrySelect.value;

      if (window.DOMPurify) {
        sanitizedAge = window.DOMPurify.sanitize(sanitizedAge);
        sanitizedCountry = window.DOMPurify.sanitize(sanitizedCountry);
      }

      const result = evaluateEligibility(sanitizedAge, sanitizedCountry);
      resultPanel.classList.toggle("is-success", result.valid && result.eligible);
      resultPanel.classList.toggle("is-warning", result.valid && !result.eligible);
      resultPanel.innerHTML = "";

      const title = document.createElement("strong");
      title.textContent = result.title;
      const message = document.createElement("p");
      message.textContent = result.message;
      resultPanel.append(title, message);

      pillsHost.innerHTML = "";
      result.pills.forEach((pill) => {
        const item = document.createElement("span");
        item.textContent = pill;
        pillsHost.appendChild(item);
      });

      if (namespace.chatInstance) {
        const prompt = `Explain voting eligibility and registration next steps in ${sanitizedCountry}.`;
        const askButton = document.createElement("button");
        askButton.type = "button";
        askButton.className = "ghost-button";
        askButton.textContent = "Ask ElectIQ about next steps";
        askButton.addEventListener("click", () => {
          namespace.chatInstance.prefill(prompt, true);
        });
        pillsHost.appendChild(askButton);
      }
    });
  }

  /**
   * Binds accessibility and theme toggle controls.
   */
  function setupThemeAndAccessibility() {
    const storedTheme = window.localStorage.getItem(c.STORAGE_KEYS.theme) || "dark";
    const storedContrast = window.localStorage.getItem(c.STORAGE_KEYS.contrast) === "high";
    const storedFont = window.localStorage.getItem(c.STORAGE_KEYS.fontScale) || "1";

    applyTheme(storedTheme);
    applyContrast(storedContrast);
    applyFontScale(storedFont);
    updateFontControlState(storedFont);

    const contrastToggle = $("contrast-toggle");
    if (contrastToggle) {
      contrastToggle.classList.toggle("is-active", storedContrast);
      contrastToggle.addEventListener("click", function () {
        const next = document.documentElement.dataset.contrast !== "high";
        applyContrast(next);
        this.classList.toggle("is-active", next);
      });
    }

    const themeToggle = $("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
        applyTheme(nextTheme);
      });
    }

    document.querySelectorAll("[data-font]").forEach((button) => {
      button.addEventListener("click", function () {
        const value = applyFontScale(this.dataset.font);
        updateFontControlState(value);
      });
    });
  }

  /**
   * Main initializer function. Runs on DOMContentLoaded.
   */
  async function init() {
    await renderPageSections();

    localStorage.removeItem("electiq_gemini_key");
    const saved = sessionStorage.getItem("electiq_gemini_key");
    if (saved && typeof ELECTIQ_CONFIG !== "undefined") {
      ELECTIQ_CONFIG.GEMINI_API_KEY = saved;
    }

    if (!$("hero-stats") || !$("timeline-track") || !$("quiz-app")) {
      return;
    }

    let data;
    try {
      data = await loadElectionData();
    } catch (e) {
      console.warn("Failed to load election data", e);
      return;
    }

    seedHeroStats();
    startTicker();
    renderOfficialLinks();
    renderFAQs(data.faqs || []);
    renderGlossary(data.glossary || []);
    renderIndiaCalendar(data.timeline_india || []);
    renderGoogleCalendarReminders();
    renderGoogleServiceGrid();
    initGoogleCharts();
    setupEligibilityChecker();
    setupThemeAndAccessibility();
    updateCountdown();
    window.setInterval(updateCountdown, 1000);

    const localAssistant = createLocalAssistant(data);
    const chatWidget = namespace.chat.createChatWidget({
      requestAI: async function (payload) {
        try {
          return await namespace.gemini.streamGenerate(payload);
        } catch (error) {
          if (error && (error.code === "api_key_revoked" || error.code === "api_key_invalid" || error.code === "api_key_forbidden")) {
            namespace.gemini.clearApiKey();
          }
          const answer = localAssistant.respond(payload.message);
          return streamLocalAnswer(answer, payload.onChunk);
        }
      }
    });
    namespace.chatInstance = chatWidget;

    namespace.timeline.renderTimeline($("timeline-track"), data.phases || [], {
      onAskAI: function (question) {
        chatWidget.prefill(question, false);
      }
    });

    const openChatHero = $("open-chat-hero");
    if (openChatHero) {
      openChatHero.addEventListener("click", () => chatWidget.open());
    }

    const askTimelineOverview = $("ask-timeline-overview");
    if (askTimelineOverview) {
      askTimelineOverview.addEventListener("click", () => {
        chatWidget.prefill("Give me a phase-by-phase overview of the election timeline.", true);
      });
    }

    const voiceShortcut = $("voice-shortcut");
    if (voiceShortcut) {
      voiceShortcut.addEventListener("click", () => {
        chatWidget.open();
        chatWidget.setVoiceModeEnabled(true);
      });
    }

    namespace.quiz.createQuiz($("quiz-app"), data.quiz || [], {
      getPersonalizedFeedback: async function (result) {
        const message = [
          "A learner finished the ElectIQ election quiz.",
          `Score: ${result.score} out of ${result.total}.`,
          "Wrong answers: " +
            (result.wrongAnswers.length
              ? result.wrongAnswers
                  .map((item) => `${item.question} | Correct answer: ${item.correctAnswer}`)
                  .join(" || ")
              : "None."),
          "Give short, practical study tips in a warm neutral tone."
        ].join("\n");

        try {
          return await namespace.gemini.streamGenerate({
            history: [],
            message: message,
            persona: "professor"
          });
        } catch (e) {
          return "Focus on voter registration, nomination checks, election-day voting steps, and how counting leads to official declaration. Review any wrong answers, then ask ElectIQ for that topic again.";
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  // Expose methods to namespace for tests and other files
  namespace.app = {
    loadElectionData,
    applyFontScale,
    applyTheme,
    applyContrast,
    evaluateEligibility,
    buildGoogleCalendarUrl,
    renderGoogleServiceGrid,
    renderPageSections,
    createLocalAssistant
  };
})();
