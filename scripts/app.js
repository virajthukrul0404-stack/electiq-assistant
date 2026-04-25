(function () {
  const namespace = (window.ElectIQ = window.ElectIQ || {});
  const STORAGE_KEYS = {
    theme: "electiq-theme",
    contrast: "electiq-contrast",
    fontScale: "electiq-font-scale"
  };
  const DEMO_ELECTIONS = [
    { name: "Bihar Assembly Election", date: "2026-10-28T08:00:00+05:30", note: "Demo date for the next major state-level election cycle." },
    { name: "Delhi Municipal Cycle", date: "2027-04-18T08:00:00+05:30", note: "Hardcoded reminder to keep the countdown relevant." }
  ];
  const HERO_STATS = [
    { icon: "groups", value: "968M", label: "Eligible voters (demo)" },
    { icon: "lan", value: "1.05M", label: "Polling stations (demo)" },
    { icon: "how_to_vote", value: "67.4%", label: "Turnout benchmark" },
    { icon: "school", value: "24/7", label: "Civic learning access" }
  ];
  const TICKER_VALUES = [
    "Registered voters: 968,000,000",
    "Polling stations mapped: 1,050,000",
    "EVMs prepared: 5,200,000",
    "Demo turnout tracker: 67.4%",
    "Observers deployed: 4,200",
    "Assistance desks active: 11,800"
  ];
  const OFFICIAL_LINKS = [
    { label: "Election Commission of India", href: "https://eci.gov.in/" },
    { label: "Voter Helpline", href: "https://voters.eci.gov.in/" },
    { label: "National Voters' Service Portal", href: "https://www.nvsp.in/" }
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function loadElectionData() {
    return fetch("data/election-data.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Unable to load election-data.json");
        }
        return response.json();
      })
      .catch(function () {
        const fallback = $("electiq-data-fallback");
        return fallback ? JSON.parse(fallback.textContent) : {};
      });
  }

  function applyFontScale(scaleValue) {
    const value = String(scaleValue || "1");
    document.documentElement.style.setProperty("--font-scale", value);
    window.localStorage.setItem(STORAGE_KEYS.fontScale, value);
    return value;
  }

  function applyTheme(theme) {
    const normalized = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = normalized;
    window.localStorage.setItem(STORAGE_KEYS.theme, normalized);
    const themeToggle = $("theme-toggle");
    if (themeToggle) {
      themeToggle.innerHTML =
        '<span class="material-symbols-outlined" aria-hidden="true">' +
        (normalized === "light" ? "light_mode" : "dark_mode") +
        "</span>";
    }
    return normalized;
  }

  function applyContrast(enabled) {
    const active = Boolean(enabled);
    document.documentElement.dataset.contrast = active ? "high" : "normal";
    document.body.classList.toggle("high-contrast", active);
    window.localStorage.setItem(STORAGE_KEYS.contrast, active ? "high" : "normal");
    return active;
  }

  function updateFontControlState(value) {
    document.querySelectorAll("[data-font]").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.font === String(value));
    });
  }

  function seedHeroStats() {
    const host = $("hero-stats");
    host.innerHTML = "";
    HERO_STATS.forEach(function (stat) {
      const card = document.createElement("article");
      card.className = "stat-card";
      card.innerHTML =
        '<span class="material-symbols-outlined" aria-hidden="true">' +
        stat.icon +
        "</span><strong>" +
        stat.value +
        "</strong><span>" +
        stat.label +
        "</span>";
      host.appendChild(card);
    });
  }

  function startTicker() {
    const ticker = $("vote-ticker");
    const values = TICKER_VALUES.concat(TICKER_VALUES);
    values.forEach(function (item) {
      const span = document.createElement("span");
      span.textContent = item;
      ticker.appendChild(span);
    });
  }

  function renderOfficialLinks() {
    const host = $("official-links");
    const footerHost = $("footer-links");
    [host, footerHost].forEach(function (container) {
      if (!container) {
        return;
      }
      container.innerHTML = "";
      OFFICIAL_LINKS.forEach(function (linkData) {
        const anchor = document.createElement("a");
        anchor.href = linkData.href;
        anchor.target = "_blank";
        anchor.rel = "noreferrer";
        anchor.innerHTML =
          '<span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>' + linkData.label;
        container.appendChild(anchor);
      });
    });
  }

  function renderFAQs(faqs) {
    const host = $("faq-list");
    host.innerHTML = "";
    faqs.slice(0, 8).forEach(function (faq) {
      const item = document.createElement("details");
      item.className = "faq-item";
      const summary = document.createElement("summary");
      summary.innerHTML =
        "<span>" + faq.question + '</span><span class="material-symbols-outlined" aria-hidden="true">expand_more</span>';
      const answer = document.createElement("p");
      answer.textContent = faq.answer;
      item.append(summary, answer);
      host.appendChild(item);
    });
  }

  function renderGlossary(terms) {
    const host = $("glossary-grid");
    host.innerHTML = "";
    terms.forEach(function (term) {
      const card = document.createElement("article");
      card.className = "glossary-card";
      card.innerHTML = "<strong>" + term.term + "</strong><span>" + term.definition + "</span>";
      host.appendChild(card);
    });
  }

  function renderIndiaCalendar(steps) {
    const host = $("india-calendar");
    host.innerHTML = "";
    steps.forEach(function (step) {
      const card = document.createElement("article");
      card.className = "calendar-step";
      card.innerHTML = "<strong>" + step.step + "</strong><span>" + step.note + "</span>";
      host.appendChild(card);
    });
  }

  function updateCountdown() {
    const card = $("countdown-card");
    const now = new Date();
    const upcoming = DEMO_ELECTIONS.find(function (entry) {
      return new Date(entry.date) > now;
    }) || DEMO_ELECTIONS[0];
    const target = new Date(upcoming.date);
    const diff = Math.max(0, target.getTime() - now.getTime());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    card.innerHTML =
      '<div class="countdown-header"><div><strong>Election countdown</strong><p>' +
      upcoming.name +
      "</p></div><span class=\"phase-chip\">Demo clock</span></div>" +
      '<div class="countdown-grid">' +
      [
        { label: "Days", value: days },
        { label: "Hours", value: hours },
        { label: "Minutes", value: minutes },
        { label: "Seconds", value: seconds }
      ]
        .map(function (unit) {
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
      upcoming.note +
      "</p>";
  }

  function evaluateEligibility(age, country) {
    const minimumAge = {
      India: 18,
      "United States": 18,
      "United Kingdom": 18,
      Canada: 18,
      Australia: 18
    };
    const requiredAge = minimumAge[country] || 18;
    const numericAge = Number(age);
    const eligible = numericAge >= requiredAge;

    return {
      eligible: eligible,
      title: eligible ? "Likely eligible to vote" : "Likely not eligible yet",
      summary: eligible
        ? "At " + numericAge + ", you meet the sample voting-age threshold for " + country + "."
        : "At " + numericAge + ", you are below the sample voting-age threshold for " + country + ".",
      pills: eligible
        ? ["Verify registration status", "Check local ID rules", "Confirm polling location"]
        : ["Track registration age rules", "Review residency rules", "Follow official election updates"],
      nextStep: eligible
        ? "Next, confirm that your name appears on the official voter list and check your constituency details."
        : "Next, review the official registration rules for your country so you know when and how to enroll."
    };
  }

  function setupEligibilityChecker() {
    const form = $("eligibility-form");
    const result = $("eligibility-result");
    const pillsHost = $("eligibility-pills");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(form);
      const age = formData.get("age");
      const country = formData.get("country");
      const evaluation = evaluateEligibility(age, country);

      result.innerHTML =
        "<strong>" + evaluation.title + "</strong><p>" + evaluation.summary + "</p><p>" + evaluation.nextStep + "</p>";
      pillsHost.innerHTML = "";
      evaluation.pills.forEach(function (pill) {
        const badge = document.createElement("span");
        badge.className = "feedback-pill";
        badge.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">task_alt</span>' + pill;
        pillsHost.appendChild(badge);
      });
    });
  }

  function setupThemeAndAccessibility() {
    const storedTheme = window.localStorage.getItem(STORAGE_KEYS.theme) || "dark";
    const storedContrast = window.localStorage.getItem(STORAGE_KEYS.contrast) === "high";
    const storedFont = window.localStorage.getItem(STORAGE_KEYS.fontScale) || "1";

    applyTheme(storedTheme);
    applyContrast(storedContrast);
    applyFontScale(storedFont);
    updateFontControlState(storedFont);
    $("contrast-toggle").classList.toggle("is-active", storedContrast);

    $("theme-toggle").addEventListener("click", function () {
      const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      applyTheme(nextTheme);
    });

    $("contrast-toggle").addEventListener("click", function () {
      const next = document.documentElement.dataset.contrast !== "high";
      applyContrast(next);
      this.classList.toggle("is-active", next);
    });

    document.querySelectorAll("[data-font]").forEach(function (button) {
      button.addEventListener("click", function () {
        const value = applyFontScale(this.dataset.font);
        updateFontControlState(value);
      });
    });
  }

  async function init() {
    const savedKey = localStorage.getItem("electiq_gemini_key");
    if (savedKey && typeof ELECTIQ_CONFIG !== "undefined") {
      ELECTIQ_CONFIG.GEMINI_API_KEY = savedKey;
    }

    if (!$("hero-stats") || !$("timeline-track") || !$("quiz-app")) {
      return;
    }

    const data = await loadElectionData();
    seedHeroStats();
    startTicker();
    renderOfficialLinks();
    renderFAQs(data.faqs || []);
    renderGlossary(data.glossary || []);
    renderIndiaCalendar(data.timeline_india || []);
    setupEligibilityChecker();
    setupThemeAndAccessibility();
    updateCountdown();
    window.setInterval(updateCountdown, 1000);

    const chatWidget = namespace.chat.createChatWidget({
      requestAI: function (payload) {
        return namespace.gemini.streamGenerate(payload);
      }
    });

    namespace.timeline.renderTimeline($("timeline-track"), data.phases || [], {
      onAskAI: function (question) {
        chatWidget.prefill(question, false);
      }
    });

    $("open-chat-hero").addEventListener("click", function () {
      chatWidget.open();
    });
    $("ask-timeline-overview").addEventListener("click", function () {
      chatWidget.prefill("Give me a phase-by-phase overview of the election timeline.", true);
    });
    $("voice-shortcut").addEventListener("click", function () {
      chatWidget.open();
      chatWidget.setVoiceModeEnabled(true);
    });

    namespace.quiz.createQuiz($("quiz-app"), data.quiz || [], {
      getPersonalizedFeedback: function (result) {
        const message = [
          "A learner finished the ElectIQ election quiz.",
          "Score: " + result.score + " out of " + result.total + ".",
          "Wrong answers: " +
            (result.wrongAnswers.length
              ? result.wrongAnswers
                  .map(function (item) {
                    return item.question + " | Correct answer: " + item.correctAnswer;
                  })
                  .join(" || ")
              : "None."),
          "Give short, practical study tips in a warm neutral tone."
        ].join("\n");

        return namespace.gemini
          .streamGenerate({
            history: [],
            message: message,
            persona: "professor"
          })
          .catch(function () {
            return "Focus on voter registration, nomination checks, election-day voting steps, and how counting leads to official declaration.";
          });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  namespace.app = {
    STORAGE_KEYS: STORAGE_KEYS,
    loadElectionData: loadElectionData,
    applyFontScale: applyFontScale,
    applyTheme: applyTheme,
    applyContrast: applyContrast,
    evaluateEligibility: evaluateEligibility
  };
})();
