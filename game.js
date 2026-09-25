(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const screens = {
    start: $("screen-start"),
    question: $("screen-question"),
    end: $("screen-end"),
  };

  const els = {
    roundLength: $("round-length"),
    btnPlay: $("btn-play"),
    btnNext: $("btn-next"),
    btnAgain: $("btn-again"),
    btnHome: $("btn-home"),
    progressBar: $("progress-bar"),
    qProgress: $("q-progress"),
    score: $("score"),
    streak: $("streak"),
    qType: $("q-type"),
    qPrompt: $("q-prompt"),
    choices: $("choices"),
    endEmoji: $("end-emoji"),
    endMessage: $("end-message"),
    finalCorrect: $("final-correct"),
    finalTotal: $("final-total"),
    finalStreak: $("final-streak"),
  };

  const state = {
    questions: [],
    index: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    answered: false,
    autoTimer: null,
  };

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
      const on = key === name;
      el.classList.toggle("active", on);
      el.hidden = !on;
    });
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickDistractors(correct, pool, key, count) {
    const others = pool.filter((c) => c[key] !== correct[key]);
    return shuffle(others).slice(0, count);
  }

  function buildQuestions(n) {
    const pool = shuffle(COUNTRIES);
    const picked = pool.slice(0, Math.min(n, pool.length));
    return picked.map((country, i) => {
      // Alternate capital / flag, slight randomness for variety
      const type = Math.random() < 0.5 ? "capital" : "flag";
      if (type === "capital") {
        const distractors = pickDistractors(country, COUNTRIES, "capital", 3);
        const options = shuffle([
          country.capital,
          ...distractors.map((d) => d.capital),
        ]);
        return {
          type: "capital",
          country,
          promptHtml: `What is the capital of<br><span class="country-name">${country.name} ${country.flag}</span>?`,
          options,
          answer: country.capital,
        };
      }
      // flag: show flag, ask which country — or show country, pick flag
      const askCountry = Math.random() < 0.5;
      if (askCountry) {
        const distractors = pickDistractors(country, COUNTRIES, "name", 3);
        const options = shuffle([
          country.name,
          ...distractors.map((d) => d.name),
        ]);
        return {
          type: "flag",
          country,
          promptHtml: `<span class="flag-big">${country.flag}</span>Which country is this?`,
          options,
          answer: country.name,
          optionKind: "text",
        };
      }
      const distractors = pickDistractors(country, COUNTRIES, "flag", 3);
      const flagOpts = shuffle([country, ...distractors]);
      return {
        type: "flag",
        country,
        promptHtml: `Which flag belongs to<br><span class="country-name">${country.name}</span>?`,
        options: flagOpts.map((c) => c.flag),
        answer: country.flag,
        optionKind: "flag",
        flagMeta: flagOpts, // for accessibility labels
      };
    });
  }

  function clearAuto() {
    if (state.autoTimer) {
      clearTimeout(state.autoTimer);
      state.autoTimer = null;
    }
  }

  function updateHud() {
    const total = state.questions.length;
    const cur = Math.min(state.index + 1, total);
    els.qProgress.textContent = `${cur} / ${total}`;
    els.score.textContent = String(state.correct);
    els.streak.textContent = String(state.streak);
    const pct = total ? (state.index / total) * 100 : 0;
    els.progressBar.style.width = `${pct}%`;
  }

  function renderQuestion() {
    clearAuto();
    state.answered = false;
    els.btnNext.hidden = true;

    const q = state.questions[state.index];
    if (!q) return finishRound();

    els.qType.textContent = q.type === "capital" ? "Capital" : "Flag";
    els.qType.classList.toggle("flag", q.type === "flag");
    els.qPrompt.innerHTML = q.promptHtml;

    els.choices.innerHTML = "";
    els.choices.classList.toggle("flag-choices", q.optionKind === "flag");
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.dataset.value = opt;

      if (q.optionKind === "flag") {
        const meta = q.flagMeta[i];
        btn.classList.add("flag-only");
        btn.dataset.country = meta.name;
        // Flags only — country names would spoil the answer
        btn.innerHTML = `<span class="flag-opt" aria-hidden="true">${opt}</span><span class="flag-label" hidden></span>`;
        btn.setAttribute("aria-label", `Flag option ${i + 1}`);
      } else {
        btn.textContent = opt;
      }

      btn.addEventListener("click", () => onAnswer(btn, opt));
      els.choices.appendChild(btn);
    });

    updateHud();
  }

  function onAnswer(btn, value) {
    if (state.answered) return;
    state.answered = true;

    const q = state.questions[state.index];
    const isCorrect = value === q.answer;
    const buttons = [...els.choices.querySelectorAll(".choice")];

    buttons.forEach((b) => {
      b.disabled = true;
      const v = b.dataset.value;
      if (v === q.answer) b.classList.add("correct");
      else if (b === btn && !isCorrect) b.classList.add("wrong");
      else if (v !== q.answer) b.classList.add("dim");

      // After answering flag picks, reveal country names
      if (q.optionKind === "flag" && b.dataset.country) {
        const label = b.querySelector(".flag-label");
        if (label) {
          label.hidden = false;
          label.textContent = b.dataset.country;
        }
        b.setAttribute("aria-label", `${b.dataset.country} flag`);
        b.classList.remove("flag-only");
        b.classList.add("flag-revealed");
      }
    });

    if (isCorrect) {
      state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
    } else {
      state.streak = 0;
    }

    updateHud();
    els.btnNext.hidden = false;

    state.autoTimer = setTimeout(() => {
      goNext();
    }, 1100);
  }

  function goNext() {
    clearAuto();
    if (!state.answered && state.questions[state.index]) return;
    state.index += 1;
    if (state.index >= state.questions.length) {
      // fill progress to 100%
      els.progressBar.style.width = "100%";
      finishRound();
    } else {
      renderQuestion();
    }
  }

  function finishRound() {
    clearAuto();
    const total = state.questions.length;
    const score = state.correct;
    const pct = total ? score / total : 0;

    let emoji = "🌟";
    let msg = "Nice try — play again to beat your score!";
    if (pct === 1) {
      emoji = "🏆";
      msg = "Perfect! Geography champion!";
    } else if (pct >= 0.8) {
      emoji = "🎉";
      msg = "Awesome job!";
    } else if (pct >= 0.5) {
      emoji = "👍";
      msg = "Good work — keep practicing!";
    }

    els.endEmoji.textContent = emoji;
    els.endMessage.textContent = msg;
    els.finalCorrect.textContent = String(score);
    els.finalTotal.textContent = String(total);
    els.finalStreak.textContent = String(state.bestStreak);
    showScreen("end");
  }

  function startGame() {
    const n = parseInt(els.roundLength.value, 10) || 10;
    state.questions = buildQuestions(n);
    state.index = 0;
    state.correct = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.answered = false;
    showScreen("question");
    renderQuestion();
  }

  els.btnPlay.addEventListener("click", startGame);
  els.btnNext.addEventListener("click", goNext);
  els.btnAgain.addEventListener("click", startGame);
  els.btnHome.addEventListener("click", () => {
    clearAuto();
    showScreen("start");
  });

  showScreen("start");
})();
