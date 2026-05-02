(function () {
  const namespace = (window.ElectIQ = window.ElectIQ || {});

  function calculateScore(selectedAnswers, questions) {
    if (typeof selectedAnswers === "number" && typeof questions === "number") {
      return Math.round((selectedAnswers / questions) * 100) || 0;
    }
    return (selectedAnswers || []).reduce(function (total, answer, index) {
      if (!questions[index]) {
        return total;
      }
      return total + (answer === questions[index].correctIndex ? 1 : 0);
    }, 0);
  }

  function buildWrongAnswerSummary(selectedAnswers, questions) {
    return (questions || [])
      .map(function (question, index) {
        const selected = selectedAnswers[index];
        if (selected === question.correctIndex) {
          return null;
        }
        return {
          question: question.question,
          yourAnswer: typeof selected === "number" ? question.options[selected] : "No answer",
          correctAnswer: question.options[question.correctIndex]
        };
      })
      .filter(Boolean);
  }

  function animateScoreBar(bar, value) {
    bar.style.width = value + "%";
  }

  function fireConfetti() {
    if (typeof window.confetti !== "function") {
      return;
    }
    window.confetti({ particleCount: 120, spread: 72, origin: { y: 0.6 } });
    window.setTimeout(function () {
      window.confetti({ particleCount: 80, spread: 90, origin: { x: 0.8, y: 0.58 } });
    }, 220);
  }

  function createQuiz(container, questions, options) {
    const config = options || {};
    const selectedAnswers = [];
    let currentIndex = 0;
    let flipped = false;
    let lockedChoice = null;

    function renderQuestion() {
      const question = questions[currentIndex];
      const score = calculateScore(selectedAnswers, questions);
      const progress = (currentIndex / questions.length) * 100;

      container.innerHTML = "";

      const header = document.createElement("div");
      header.className = "quiz-header";
      header.innerHTML =
        '<div class="quiz-progress"><strong>Question ' +
        (currentIndex + 1) +
        " of " +
        questions.length +
        '</strong><div class="progress-shell"><div class="progress-bar"></div></div></div><div class="score-chip"><span class="material-symbols-outlined" aria-hidden="true">workspace_premium</span>Score ' +
        score +
        " / " +
        questions.length +
        "</div>";
      container.appendChild(header);
      const progressBar = header.querySelector(".progress-bar");
      if (progressBar) {
        animateScoreBar(progressBar, progress);
      }

      const cardWrap = document.createElement("div");
      cardWrap.className = "quiz-card-wrap";
      const card = document.createElement("div");
      card.className = "quiz-card" + (flipped ? " is-flipped" : "");

      const front = document.createElement("section");
      front.className = "quiz-face";
      const questionTitle = document.createElement("h3");
      questionTitle.className = "quiz-question";
      questionTitle.textContent = question.question;
      front.appendChild(questionTitle);

      const optionsWrap = document.createElement("div");
      optionsWrap.className = "quiz-options";
      question.options.forEach(function (option, optionIndex) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quiz-option";
        button.textContent = option;
        button.addEventListener("click", function () {
          if (flipped) {
            return;
          }
          lockedChoice = optionIndex;
          selectedAnswers[currentIndex] = optionIndex;
          flipped = true;
          renderQuestion();
        });
        optionsWrap.appendChild(button);
      });
      front.appendChild(optionsWrap);

      const back = document.createElement("section");
      back.className = "quiz-face quiz-face--back";
      const feedback = document.createElement("div");
      feedback.className = "quiz-feedback";

      const isCorrect = lockedChoice === question.correctIndex;
      const badge = document.createElement("div");
      badge.className = "score-chip";
      badge.innerHTML =
        '<span class="material-symbols-outlined" aria-hidden="true">' +
        (isCorrect ? "task_alt" : "tips_and_updates") +
        "</span>" +
        (isCorrect ? "Correct answer" : "Review this concept");
      feedback.appendChild(badge);

      const responseTitle = document.createElement("h3");
      responseTitle.textContent = isCorrect ? "Nice work." : "Almost there.";
      feedback.appendChild(responseTitle);

      const explanation = document.createElement("p");
      explanation.textContent = question.explanation;
      feedback.appendChild(explanation);

      const answerList = document.createElement("div");
      answerList.className = "quiz-summary";

      const yourAnswer = document.createElement("div");
      yourAnswer.className = "quiz-summary-item";
      yourAnswer.textContent =
        "Your answer: " + (typeof lockedChoice === "number" ? question.options[lockedChoice] : "No answer selected");
      answerList.appendChild(yourAnswer);

      const correctAnswer = document.createElement("div");
      correctAnswer.className = "quiz-summary-item";
      correctAnswer.textContent = "Correct answer: " + question.options[question.correctIndex];
      answerList.appendChild(correctAnswer);
      feedback.appendChild(answerList);

      const nextButton = document.createElement("button");
      nextButton.type = "button";
      nextButton.className = "primary-button";
      nextButton.innerHTML =
        '<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>' +
        (currentIndex === questions.length - 1 ? "See results" : "Next question");
      nextButton.addEventListener("click", function () {
        flipped = false;
        lockedChoice = null;
        if (currentIndex === questions.length - 1) {
          renderResults();
          return;
        }
        currentIndex += 1;
        renderQuestion();
      });
      feedback.appendChild(nextButton);
      back.appendChild(feedback);

      card.append(front, back);
      cardWrap.appendChild(card);
      container.appendChild(cardWrap);

      if (flipped) {
        const optionButtons = card.querySelectorAll(".quiz-option");
        optionButtons.forEach(function (button, optionIndex) {
          if (optionIndex === question.correctIndex) {
            button.classList.add("is-correct");
          }
          if (optionIndex === lockedChoice && optionIndex !== question.correctIndex) {
            button.classList.add("is-wrong");
          }
        });
      }
    }

    async function renderResults() {
      const total = questions.length;
      const score = calculateScore(selectedAnswers, questions);
      const scorePercent = Math.round((score / total) * 100);
      const wrongAnswers = buildWrongAnswerSummary(selectedAnswers, questions);

      container.innerHTML = "";
      const summary = document.createElement("section");
      summary.className = "quiz-feedback";
      summary.innerHTML =
        "<h3>Your result</h3><p>You scored <strong>" +
        score +
        " out of " +
        total +
        "</strong>. Review your weak spots and ask ElectIQ for a refresher.</p>";
      container.appendChild(summary);

      const barShell = document.createElement("div");
      barShell.className = "progress-shell";
      const bar = document.createElement("div");
      bar.className = "progress-bar";
      barShell.appendChild(bar);
      summary.appendChild(barShell);
      animateScoreBar(bar, scorePercent);

      const list = document.createElement("div");
      list.className = "quiz-summary";
      if (!wrongAnswers.length) {
        const perfect = document.createElement("div");
        perfect.className = "quiz-summary-item";
        perfect.textContent = "Perfect score. You are ready to explain the election lifecycle to someone else.";
        list.appendChild(perfect);
        fireConfetti();
      } else {
        wrongAnswers.forEach(function (item) {
          const panel = document.createElement("div");
          panel.className = "quiz-summary-item";
          panel.textContent =
            item.question + " | Your answer: " + item.yourAnswer + " | Correct answer: " + item.correctAnswer;
          list.appendChild(panel);
        });
      }
      summary.appendChild(list);

      const aiPanel = document.createElement("div");
      aiPanel.className = "quiz-summary-item";
      aiPanel.textContent = "Generating personalized study tips...";
      summary.appendChild(aiPanel);

      const restart = document.createElement("button");
      restart.type = "button";
      restart.className = "ghost-button";
      restart.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">restart_alt</span> Retake quiz';
      restart.addEventListener("click", function () {
        currentIndex = 0;
        flipped = false;
        lockedChoice = null;
        selectedAnswers.length = 0;
        renderQuestion();
      });
      summary.appendChild(restart);

      try {
        const feedbackText =
          typeof config.getPersonalizedFeedback === "function"
            ? await config.getPersonalizedFeedback({
                score: score,
                total: total,
                wrongAnswers: wrongAnswers
              })
            : "Review voter registration, election-day procedures, and vote counting. Those topics improve overall election literacy quickly.";
        aiPanel.textContent = String(feedbackText || "Study tips were unavailable. Try asking ElectIQ in the chat.");
      } catch (error) {
        aiPanel.textContent = "Study tips were unavailable. Try asking ElectIQ in the chat.";
      }
    }

    renderQuestion();

    return {
      getSelectedAnswers: function () {
        return selectedAnswers.slice();
      },
      calculateScore: function () {
        return calculateScore(selectedAnswers, questions);
      }
    };
  }

  namespace.quiz = {
    calculateScore: calculateScore,
    buildWrongAnswerSummary: buildWrongAnswerSummary,
    createQuiz: createQuiz
  };
})();
