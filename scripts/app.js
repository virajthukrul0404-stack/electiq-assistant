(function () {
  const namespace = (window.ElectIQ = window.ElectIQ || {});
  const STORAGE_KEYS = {
    theme: "electiq-theme",
    contrast: "electiq_high_contrast",
    fontScale: "electiq_font_scale"
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

  function normalizeQuery(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }

  function textIncludesAny(text, words) {
    return words.some(function (word) {
      return text.indexOf(word) !== -1;
    });
  }

  function createLocalAssistant(data) {
    const phases = data.phases || [];
    const faqs = data.faqs || [];
    const glossary = data.glossary || [];

    function findPhase(query) {
      return phases.find(function (phase) {
        const haystack = normalizeQuery([phase.title, phase.description, phase.id].join(" "));
        return normalizeQuery(phase.title).split(" ").some(function (word) {
          return word.length > 3 && query.indexOf(word) !== -1;
        }) || haystack.indexOf(query) !== -1;
      });
    }

    function findFaq(query) {
      return faqs.find(function (faq) {
        const question = normalizeQuery(faq.question);
        return query && (question.indexOf(query) !== -1 || query.split(" ").some(function (word) {
          return word.length > 4 && question.indexOf(word) !== -1;
        }));
      });
    }

    function findTerm(query) {
      return glossary.find(function (item) {
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
      if (phase) {
        return phaseAnswer(phase);
      }

      if (textIncludesAny(query, ["nota", "none of the above"])) {
        return "NOTA means None of the Above. It lets a voter record that they do not support any listed candidate while still participating in the election. In India, NOTA is available on EVMs, but the candidate with the highest valid votes still wins under current rules.";
      }

      if (textIncludesAny(query, ["count", "counted", "counting", "verification", "vvpat"])) {
        return phaseAnswer(phases.find(function (item) { return item.id === "counting"; }) || phases[4]);
      }

      if (textIncludesAny(query, ["register", "registration", "voter list", "electoral roll", "form 6"])) {
        return phaseAnswer(phases.find(function (item) { return item.id === "registration"; }) || phases[0]);
      }

      if (textIncludesAny(query, ["nomination", "candidate", "affidavit"])) {
        return phaseAnswer(phases.find(function (item) { return item.id === "nomination"; }) || phases[1]);
      }

      if (textIncludesAny(query, ["election day", "polling", "vote", "voting"])) {
        return phaseAnswer(phases.find(function (item) { return item.id === "polling"; }) || phases[3]);
      }

      const faq = findFaq(query);
      if (faq) {
        return faq.answer;
      }

      const term = findTerm(query);
      if (term) {
        return term.term + ": " + term.definition;
      }

      return [
        "Here is the simple election-process view:",
        "",
        "1. Voters register and verify their name on the electoral roll.",
        "2. Candidates file nominations and officials check eligibility.",
        "3. Campaigning happens under conduct and spending rules.",
        "4. Voters cast a secret ballot on polling day.",
        "5. Votes are counted, verified, and results are officially declared.",
        "",
        "Ask me about registration, nomination, NOTA, EVM/VVPAT, polling day, counting, or government formation for a more focused answer."
      ].join("\n");
    }

    return { respond: respond };
  }

  async function streamLocalAnswer(text, onChunk) {
    const answer = String(text || "");
    let built = "";
    for (let index = 0; index < answer.length; index += 1) {
      built += answer[index];
      if (typeof onChunk === "function") {
        onChunk(answer[index], built);
      }
      await new Promise(function (resolve) {
        window.setTimeout(resolve, 3);
      });
    }
    return answer;
  }

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
      eligible: eligible,
      valid: true,
      title: eligible ? "Likely eligible to vote" : "Not eligible yet",
      message: eligible
        ? "In " + normalizedCountry + ", the usual voting age is " + requiredAge + "+. Next, confirm citizenship, residence, and registration status with the official election authority."
        : "In " + normalizedCountry + ", the usual voting age is " + requiredAge + "+. You can still learn the process now and register when you meet the official requirements.",
      pills: [
        normalizedCountry,
        "Voting age: " + requiredAge + "+",
        eligible ? "Registration check next" : "Learn before registration"
      ]
    };
  }

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

  function setupEligibilityChecker() {
    const form = $("eligibility-form");
    const ageInput = $("eligibility-age");
    const countrySelect = $("eligibility-country");
    const resultPanel = $("eligibility-result");
    const pillsHost = $("eligibility-pills");

    if (!form || !ageInput || !countrySelect || !resultPanel || !pillsHost) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const result = evaluateEligibility(ageInput.value, countrySelect.value);
      resultPanel.classList.toggle("is-success", result.valid && result.eligible);
      resultPanel.classList.toggle("is-warning", result.valid && !result.eligible);
      resultPanel.innerHTML = "";

      const title = document.createElement("strong");
      title.textContent = result.title;
      const message = document.createElement("p");
      message.textContent = result.message;
      resultPanel.append(title, message);

      pillsHost.innerHTML = "";
      result.pills.forEach(function (pill) {
        const item = document.createElement("span");
        item.textContent = pill;
        pillsHost.appendChild(item);
      });

      if (namespace.chatInstance) {
        const prompt = "Explain voting eligibility and registration next steps in " + countrySelect.value + ".";
        const askButton = document.createElement("button");
        askButton.type = "button";
        askButton.className = "ghost-button";
        askButton.textContent = "Ask ElectIQ about next steps";
        askButton.addEventListener("click", function () {
          namespace.chatInstance.prefill(prompt, true);
        });
        pillsHost.appendChild(askButton);
      }
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
    localStorage.removeItem("electiq_gemini_key");
    const saved = sessionStorage.getItem("electiq_gemini_key");
    if (saved && typeof ELECTIQ_CONFIG !== "undefined") {
      ELECTIQ_CONFIG.GEMINI_API_KEY = saved;
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

    const localAssistant = createLocalAssistant(data);
    const chatWidget = namespace.chat.createChatWidget({
      requestAI: function (payload) {
        return namespace.gemini.streamGenerate(payload).catch(function (error) {
          if (error && (error.code === "api_key_revoked" || error.code === "api_key_invalid" || error.code === "api_key_forbidden")) {
            namespace.gemini.clearApiKey();
          }
          const answer = localAssistant.respond(payload.message);
          return streamLocalAnswer(answer, payload.onChunk);
        });
      }
    });
    namespace.chatInstance = chatWidget;

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
            return "Focus on voter registration, nomination checks, election-day voting steps, and how counting leads to official declaration. Review any wrong answers, then ask ElectIQ for that topic again.";
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
    evaluateEligibility: evaluateEligibility,
    createLocalAssistant: createLocalAssistant
  };
})();
