(() => {
  "use strict";

  const MAX_QUESTIONS = 50;
  const NAME_MAX = 20;
  const LB_KEY = "cfq-leaderboard-v1";
  const LB_STORE = 20;
  const LB_SHOW = 10;

  const DIFF_NAMES = { easy: "Tourist", medium: "Globetrotter", hard: "Cartographer" };
  const DIFF_HINTS = {
    easy: "Well-known countries and clearer choices.",
    medium: "Mixed familiarity and somewhat similar choices.",
    hard: "Less familiar countries and trickier choices.",
    random: "Picks Tourist, Globetrotter, or Cartographer once for the whole round.",
  };

  const $ = (id) => document.getElementById(id);

  const screens = {
    start: $("screen-start"),
    question: $("screen-question"),
    end: $("screen-end"),
  };

  const els = {
    roundLength: $("round-length"),
    lengthHint: $("length-hint"),
    diffHint: $("diff-hint"),
    btnPlay: $("btn-play"),
    btnNext: $("btn-next"),
    btnAgain: $("btn-again"),
    btnHome: $("btn-home"),
    progressBar: $("progress-bar"),
    qProgress: $("q-progress"),
    hudDiff: $("hud-diff"),
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
    endMeta: $("end-meta"),
    endCapNote: $("end-cap-note"),
    reviewList: $("review-list"),
    saveForm: $("save-form"),
    playerName: $("player-name"),
    saveError: $("save-error"),
    saveDone: $("save-done"),
    saveButton: $("btn-save"),
    lbStart: $("lb-start"),
    lbEnd: $("lb-end"),
    lbYours: $("lb-yours"),
  };

  const state = {
    questions: [],
    index: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    answered: false,
    autoTimer: null,
    pick: "easy",
    difficulty: "easy",
    requested: 10,
    saved: false,
    savedId: null,
  };

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
      const on = key === name;
      el.classList.toggle("active", on);
      el.hidden = !on;
    });
    window.scrollTo(0, 0);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function selectedPick() {
    const el = document.querySelector('input[name="difficulty"]:checked');
    return el ? el.value : "easy";
  }

  function diffLabel(level, viaRandom) {
    const name = DIFF_NAMES[level] || "Tourist";
    return viaRandom ? `${name} · Random` : name;
  }

  function resolveDifficulty(pick) {
    if (pick !== "random") return pick;
    return shuffle(["easy", "medium", "hard"])[0];
  }

  function syncDiffUI() {
    document.querySelectorAll(".diff-option").forEach((label) => {
      const input = label.querySelector("input");
      label.classList.toggle("is-selected", Boolean(input && input.checked));
    });
    const pick = selectedPick();
    els.diffHint.textContent = DIFF_HINTS[pick] || "";
    updateLengthHint();
  }

  function updateLengthHint() {
    const pick = selectedPick();
    const requested = parseInt(els.roundLength.value, 10) || 10;
    const easyN = difficultyPool("easy").length;
    if (pick !== "random") {
      const poolN = difficultyPool(pick).length;
      if (requested > poolN) {
        els.lengthHint.hidden = false;
        els.lengthHint.textContent = `${DIFF_NAMES[pick]} has ${poolN} countries, so this round will be ${Math.min(poolN, MAX_QUESTIONS)} questions.`;
        return;
      }
    } else if (requested > easyN) {
      els.lengthHint.hidden = false;
      els.lengthHint.textContent = `Random picks one level for the whole round. Tourist has ${easyN} countries, so a Tourist roll plays ${easyN}.`;
      return;
    }
    els.lengthHint.hidden = true;
    els.lengthHint.textContent = "";
  }

  function planTypes(n) {
    const types = [];
    const capitals = Math.ceil(n / 2);
    const flags = n - capitals;
    const whichCountry = Math.ceil(flags / 2);
    const whichFlag = flags - whichCountry;
    for (let i = 0; i < capitals; i++) types.push("capital");
    for (let i = 0; i < whichCountry; i++) types.push("which-country");
    for (let i = 0; i < whichFlag; i++) types.push("which-flag");
    return shuffle(types);
  }

  function makeQuestion(country, kind, difficulty) {
    const distractors = pickDistractors(country, difficulty, 3);
    const options = shuffle([country, ...distractors]);

    if (kind === "capital") {
      return {
        kind,
        type: "capital",
        optionKind: "text",
        promptHtml: `What is the capital of<br><span class="country-name">${escapeHtml(country.name)} ${country.flag}</span>?`,
        promptLabel: `Capital of ${country.name} ${country.flag}`,
        options: options.map((c) => c.capital),
        optionLabels: options.map((c) => c.capital),
        answer: country.capital,
        answerLabel: country.capital,
        flagMeta: null,
      };
    }

    if (kind === "which-country") {
      return {
        kind,
        type: "flag",
        optionKind: "text",
        promptHtml: `<span class="flag-big">${country.flag}</span>Which country is this?`,
        promptLabel: `Which country is ${country.flag}`,
        options: options.map((c) => c.name),
        optionLabels: options.map((c) => c.name),
        answer: country.name,
        answerLabel: country.name,
        flagMeta: null,
      };
    }

    return {
      kind: "which-flag",
      type: "flag",
      optionKind: "flag",
      promptHtml: `Which flag belongs to<br><span class="country-name">${escapeHtml(country.name)}</span>?`,
      promptLabel: `Which flag is ${country.name}`,
      options: options.map((c) => c.flag),
      optionLabels: options.map((c) => `${c.flag} ${c.name}`),
      answer: country.flag,
      answerLabel: `${country.flag} ${country.name}`,
      flagMeta: options,
    };
  }

  function buildQuestions(pool, n, difficulty) {
    const picked = shuffle(pool).slice(0, n);
    const types = planTypes(n);
    return picked.map((country, i) => makeQuestion(country, types[i], difficulty));
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
    els.hudDiff.textContent = diffLabel(state.difficulty, state.pick === "random");
    els.hudDiff.classList.remove("easy", "medium", "hard");
    if (state.difficulty) els.hudDiff.classList.add(state.difficulty);
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
      btn.dataset.index = String(i);

      if (q.optionKind === "flag") {
        const meta = q.flagMeta[i];
        btn.classList.add("flag-only");
        btn.dataset.country = meta.name;
        btn.innerHTML = `<span class="flag-opt" aria-hidden="true">${opt}</span><span class="flag-label" hidden></span>`;
        btn.setAttribute("aria-label", `Flag option ${i + 1}`);
      } else {
        btn.textContent = opt;
      }

      btn.addEventListener("click", () => onAnswer(btn, opt, i));
      els.choices.appendChild(btn);
    });

    updateHud();
  }

  function onAnswer(btn, value, optionIndex) {
    if (state.answered) return;
    state.answered = true;

    const q = state.questions[state.index];
    const isCorrect = value === q.answer;
    q.picked = value;
    q.pickedLabel = q.optionLabels[optionIndex] || value;
    q.wasCorrect = isCorrect;

    const buttons = [...els.choices.querySelectorAll(".choice")];
    buttons.forEach((b) => {
      b.disabled = true;
      const v = q.options[Number(b.dataset.index)];
      if (v === q.answer) b.classList.add("correct");
      else if (b === btn && !isCorrect) b.classList.add("wrong");
      else if (v !== q.answer) b.classList.add("dim");

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
      els.progressBar.style.width = "100%";
      finishRound();
    } else {
      renderQuestion();
    }
  }

  function renderReview() {
    els.reviewList.innerHTML = "";
    state.questions.forEach((q) => {
      const li = document.createElement("li");
      li.className = `review-item ${q.wasCorrect ? "ok" : "bad"}`;

      const top = document.createElement("div");
      top.className = "review-top";

      const label = document.createElement("span");
      label.className = "review-q";
      label.textContent = q.promptLabel;

      const mark = document.createElement("span");
      mark.className = "review-mark";
      mark.textContent = q.wasCorrect ? "Correct" : "Wrong";

      top.append(label, mark);
      li.append(top);

      if (!q.wasCorrect) {
        const picked = document.createElement("p");
        picked.className = "review-detail you-picked";
        picked.textContent = `You picked: ${q.pickedLabel}`;
        li.append(picked);
      }

      const ans = document.createElement("p");
      ans.className = "review-detail";
      ans.textContent = `Answer: ${q.answerLabel}`;
      li.append(ans);
      els.reviewList.append(li);
    });
  }

  function sanitizeName(raw) {
    const cleaned = String(raw)
      .replace(/<[^>]*>/g, "")
      .replace(/[<>]/g, "")
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return [...cleaned].slice(0, NAME_MAX).join("");
  }

  function isEntry(e) {
    return Boolean(
      e &&
        typeof e.id === "string" &&
        typeof e.name === "string" &&
        Number.isFinite(e.correct) &&
        Number.isFinite(e.total) &&
        e.total > 0 &&
        ["easy", "medium", "hard"].includes(e.difficulty) &&
        typeof e.date === "string"
    );
  }

  function loadBoard() {
    try {
      const raw = localStorage.getItem(LB_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isEntry).sort(compareScores);
    } catch (err) {
      return [];
    }
  }

  function compareScores(a, b) {
    const pa = a.correct / a.total;
    const pb = b.correct / b.total;
    if (pb !== pa) return pb - pa;
    if (b.total !== a.total) return b.total - a.total;
    if (b.correct !== a.correct) return b.correct - a.correct;
    return new Date(b.date) - new Date(a.date);
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function scoreMeta(e) {
    const pct = Math.round((e.correct / e.total) * 100);
    const diff = diffLabel(e.difficulty, Boolean(e.viaRandom));
    const when = formatDate(e.date);
    return `${e.correct}/${e.total} (${pct}%) · ${diff} · ${e.total} questions · ${when}`;
  }

  function renderBoard(listEl, noteEl, highlightId) {
    const entries = loadBoard().slice(0, LB_SHOW);
    listEl.replaceChildren();
    if (!entries.length) {
      const li = document.createElement("li");
      li.className = "lb-empty";
      li.textContent = "No scores yet. Finish a round to save one on this device.";
      listEl.append(li);
    } else {
      entries.forEach((e) => {
        const li = document.createElement("li");
        li.className = "lb-item";
        if (highlightId && e.id === highlightId) li.classList.add("is-new");

        const name = document.createElement("span");
        name.className = "lb-name";
        name.textContent = sanitizeName(e.name) || "Player";

        const meta = document.createElement("span");
        meta.className = "lb-meta";
        meta.textContent = scoreMeta(e);

        li.append(name, meta);
        listEl.append(li);
      });
    }

    if (noteEl) {
      const onBoard = highlightId && entries.some((e) => e.id === highlightId);
      noteEl.hidden = !highlightId || onBoard;
      if (!noteEl.hidden) {
        noteEl.textContent = "Your score is saved on this device. It is outside the top 10.";
      }
    }
  }

  function renderLeaderboards(highlightId) {
    renderBoard(els.lbStart, null, null);
    renderBoard(els.lbEnd, els.lbYours, highlightId || null);
  }

  function resetSaveForm() {
    state.saved = false;
    state.savedId = null;
    els.saveForm.hidden = false;
    els.saveDone.hidden = true;
    els.saveError.hidden = true;
    els.saveError.textContent = "";
    els.saveButton.disabled = false;
  }

  function saveScore(event) {
    event.preventDefault();
    if (state.saved) return;

    const name = sanitizeName(els.playerName.value);
    if (!name) {
      els.saveError.hidden = false;
      els.saveError.textContent = "Enter a display name.";
      els.playerName.focus();
      return;
    }

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      correct: state.correct,
      total: state.questions.length,
      difficulty: state.difficulty,
      viaRandom: state.pick === "random",
      date: new Date().toISOString(),
    };

    try {
      const next = loadBoard().concat(entry).sort(compareScores).slice(0, LB_STORE);
      localStorage.setItem(LB_KEY, JSON.stringify(next));
    } catch (err) {
      els.saveError.hidden = false;
      els.saveError.textContent = "Couldn't save on this browser.";
      return;
    }

    state.saved = true;
    state.savedId = entry.id;
    els.playerName.value = name;
    els.saveForm.hidden = true;
    els.saveDone.hidden = false;
    els.saveDone.textContent = `Saved as "${name}" on this device.`;
    renderLeaderboards(entry.id);
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
    els.endMeta.textContent = `${diffLabel(state.difficulty, state.pick === "random")} · ${total} questions`;

    if (state.requested > total) {
      els.endCapNote.hidden = false;
      els.endCapNote.textContent = `Round shortened from ${state.requested} to ${total} so each country is asked only once.`;
    } else {
      els.endCapNote.hidden = true;
      els.endCapNote.textContent = "";
    }

    resetSaveForm();
    renderReview();
    renderLeaderboards(null);
    showScreen("end");
  }

  function startGame() {
    clearAuto();
    const pick = selectedPick();
    const difficulty = resolveDifficulty(pick);
    const requested = parseInt(els.roundLength.value, 10) || 10;
    const pool = difficultyPool(difficulty);
    const n = Math.min(requested, pool.length, MAX_QUESTIONS);
    if (n < 1) return;

    state.pick = pick;
    state.difficulty = difficulty;
    state.requested = requested;
    state.questions = buildQuestions(pool, n, difficulty);
    state.index = 0;
    state.correct = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.answered = false;
    showScreen("question");
    renderQuestion();
  }

  document.querySelectorAll('input[name="difficulty"]').forEach((input) => {
    input.addEventListener("change", syncDiffUI);
  });
  els.roundLength.addEventListener("change", updateLengthHint);
  els.btnPlay.addEventListener("click", startGame);
  els.btnNext.addEventListener("click", goNext);
  els.btnAgain.addEventListener("click", startGame);
  els.btnHome.addEventListener("click", () => {
    clearAuto();
    renderLeaderboards(null);
    showScreen("start");
  });
  els.saveForm.addEventListener("submit", saveScore);
  els.playerName.addEventListener("input", () => {
    els.saveError.hidden = true;
  });

  syncDiffUI();
  renderLeaderboards(null);
  showScreen("start");
})();
