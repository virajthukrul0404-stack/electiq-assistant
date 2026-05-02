/**
 * @file constants.js
 * @description Application-wide constants for ElectIQ.
 */

window.ElectIQ = window.ElectIQ || {};

window.ElectIQ.constants = {
  STORAGE_KEYS: {
    theme: "electiq-theme",
    contrast: "electiq_high_contrast",
    fontScale: "electiq_font_scale"
  },

  DEMO_ELECTIONS: [
    { name: "Bihar Assembly Election", date: "2026-10-28T08:00:00+05:30", note: "Demo date for the next major state-level election cycle." },
    { name: "Delhi Municipal Cycle", date: "2027-04-18T08:00:00+05:30", note: "Hardcoded reminder to keep the countdown relevant." }
  ],

  HERO_STATS: [
    { icon: "groups", value: "968M", label: "Eligible voters (demo)" },
    { icon: "lan", value: "1.05M", label: "Polling stations (demo)" },
    { icon: "how_to_vote", value: "67.4%", label: "Turnout benchmark" },
    { icon: "school", value: "24/7", label: "Civic learning access" }
  ],

  TICKER_VALUES: [
    "Registered voters: 968,000,000",
    "Polling stations mapped: 1,050,000",
    "EVMs prepared: 5,200,000",
    "Demo turnout tracker: 67.4%",
    "Observers deployed: 4,200",
    "Assistance desks active: 11,800"
  ],

  OFFICIAL_LINKS: [
    { label: "Election Commission of India", href: "https://eci.gov.in/" },
    { label: "Voter Helpline", href: "https://voters.eci.gov.in/" },
    { label: "National Voters' Service Portal", href: "https://www.nvsp.in/" }
  ],

  GOOGLE_SERVICE_CARDS: [
    {
      icon: "auto_awesome",
      title: "Gemini Flash",
      detail: "Streams neutral election explanations and quiz study tips with an offline civic fallback."
    },
    {
      icon: "translate",
      title: "Google Translate",
      detail: "Footer widget supports Indian languages including Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, and Urdu."
    },
    {
      icon: "analytics",
      title: "GA4 Analytics",
      detail: "Measurement ID G-ELECTIQ2026 is wired for product analytics and learning-flow insights."
    },
    {
      icon: "monitoring",
      title: "Google Charts",
      detail: "Renders the civic statistics dashboard from local election metrics at runtime."
    },
    {
      icon: "event",
      title: "Google Calendar",
      detail: "Creates reminder links for demo election milestones so learners can plan civic actions."
    },
    {
      icon: "cloud_done",
      title: "Google Cloud Run",
      detail: "Production deployment is live on Cloud Run with a small static container."
    },
    {
      icon: "font_download",
      title: "Google Fonts",
      detail: "Space Grotesk, Inter, and JetBrains Mono shape the premium civic-tech interface."
    },
    {
      icon: "category",
      title: "Material Symbols",
      detail: "Google iconography powers recognizable actions across timeline, quiz, voice, and accessibility controls."
    }
  ],

  FALLBACK_ANSWERS: {
    NOTA: "NOTA means None of the Above. It lets a voter record that they do not support any listed candidate while still participating in the election. In India, NOTA is available on EVMs, but the candidate with the highest valid votes still wins under current rules.",
    DEFAULT: [
      "Here is the simple election-process view:",
      "",
      "1. Voters register and verify their name on the electoral roll.",
      "2. Candidates file nominations and officials check eligibility.",
      "3. Campaigning happens under conduct and spending rules.",
      "4. Voters cast a secret ballot on polling day.",
      "5. Votes are counted, verified, and results are officially declared.",
      "",
      "Ask me about registration, nomination, NOTA, EVM/VVPAT, polling day, counting, or government formation for a more focused answer."
    ].join("\n")
  }
};
