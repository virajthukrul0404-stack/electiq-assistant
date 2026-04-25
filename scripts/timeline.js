(function () {
  const namespace = (window.ElectIQ = window.ElectIQ || {});

  function createList(items, ordered) {
    const list = document.createElement(ordered ? "ol" : "ul");
    (items || []).forEach(function (item) {
      const entry = document.createElement("li");
      entry.textContent = item;
      list.appendChild(entry);
    });
    return list;
  }

  function buildDetails(phase) {
    const detailsWrap = document.createElement("div");
    detailsWrap.className = "timeline-details-inner";

    const facts = document.createElement("section");
    facts.className = "timeline-facts";
    const factsTitle = document.createElement("h4");
    factsTitle.textContent = "Key facts";
    facts.append(factsTitle, createList(phase.keyFacts, false));

    const steps = document.createElement("section");
    steps.className = "timeline-steps";
    const stepsTitle = document.createElement("h4");
    stepsTitle.textContent = "What usually happens";
    steps.append(stepsTitle, createList(phase.details, true));

    detailsWrap.append(facts, steps);
    return detailsWrap;
  }

  function renderTimeline(container, phases, options) {
    const config = options || {};
    container.innerHTML = "";

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            function (entries) {
              entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                  entry.target.classList.add("is-visible");
                  observer.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.18 }
          )
        : null;

    (phases || []).forEach(function (phase) {
      const card = document.createElement("article");
      card.className = "timeline-card";

      const header = document.createElement("div");
      header.className = "timeline-header";

      const badge = document.createElement("div");
      badge.className = "timeline-badge";
      badge.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">' + phase.icon + "</span>";

      const titleGroup = document.createElement("div");
      const titleRow = document.createElement("div");
      titleRow.className = "timeline-title-row";
      const title = document.createElement("h3");
      title.textContent = phase.title;
      const chip = document.createElement("span");
      chip.className = "phase-chip";
      chip.textContent = phase.badge;
      titleRow.append(title, chip);

      const meta = document.createElement("div");
      meta.className = "timeline-meta";
      meta.textContent = phase.duration;
      titleGroup.append(titleRow, meta);

      const expandButton = document.createElement("button");
      expandButton.type = "button";
      expandButton.className = "ghost-button timeline-expand";
      expandButton.setAttribute("aria-expanded", "false");
      expandButton.innerHTML =
        '<span class="material-symbols-outlined" aria-hidden="true">expand_more</span> Explore details';

      header.append(badge, titleGroup, expandButton);

      const summary = document.createElement("p");
      summary.className = "timeline-summary";
      summary.textContent = phase.description;

      const actions = document.createElement("div");
      actions.className = "timeline-actions";

      const askButton = document.createElement("button");
      askButton.type = "button";
      askButton.className = "pill-button";
      askButton.innerHTML =
        '<span class="material-symbols-outlined" aria-hidden="true">psychology</span> Ask AI about this phase';
      askButton.addEventListener("click", function () {
        if (typeof config.onAskAI === "function") {
          config.onAskAI("Explain the " + phase.title + " phase in the election process.");
        }
      });

      actions.appendChild(askButton);

      const details = document.createElement("div");
      details.className = "timeline-details";
      details.hidden = false;

      let rendered = false;
      expandButton.addEventListener("click", function () {
        const isExpanded = expandButton.getAttribute("aria-expanded") === "true";
        if (isExpanded) {
          details.style.maxHeight = "0px";
          expandButton.setAttribute("aria-expanded", "false");
          return;
        }

        if (!rendered) {
          details.appendChild(buildDetails(phase));
          rendered = true;
        }

        details.style.maxHeight = details.scrollHeight + 18 + "px";
        expandButton.setAttribute("aria-expanded", "true");
      });

      card.append(header, summary, actions, details);
      container.appendChild(card);

      if (observer) {
        observer.observe(card);
      } else {
        card.classList.add("is-visible");
      }
    });
  }

  namespace.timeline = {
    renderTimeline: renderTimeline
  };
})();

