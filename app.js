(function () {
  "use strict";

  const DATA = window.READINESS_DATA;
  const Scoring = window.Scoring;
  const STORAGE_KEY = "lmrs.v1";

  const stage = document.getElementById("stage");
  const progressRegion = document.getElementById("progress-region");
  const progressFill = document.getElementById("progress-fill");
  const progressBar = document.getElementById("progress");
  const progressLabel = document.getElementById("progress-label");
  const progressTitle = document.getElementById("progress-title");
  const statusEl = document.getElementById("status");

  // Steps: 0 = project intro, 1..N = question groups, N+1 = results.
  const RESULTS_STEP = DATA.groups.length + 1;
  const TOTAL_INPUT_STEPS = RESULTS_STEP; // intro + groups

  let state = { name: "", sector: "", answers: {}, step: 0 };

  /* ---------- Storage (never throws) ---------- */
  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return;
      state = {
        name: typeof saved.name === "string" ? saved.name.slice(0, 80) : "",
        sector: DATA.sectors.some((s) => s.id === saved.sector) ? saved.sector : "",
        answers: saved.answers && typeof saved.answers === "object" ? saved.answers : {},
        step: Number.isInteger(saved.step) && saved.step >= 0 && saved.step <= RESULTS_STEP ? saved.step : 0,
      };
      if (state.step > 0 && !(state.name.trim() && state.sector)) state.step = 0;
    } catch (e) {
      /* storage blocked or corrupt: start fresh */
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage blocked: the app keeps working in memory */
    }
  }

  function clearState() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  /* ---------- Helpers ---------- */
  function esc(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function announce(message) {
    statusEl.textContent = "";
    // Re-set on next frame so repeated identical messages are still announced.
    window.requestAnimationFrame(() => {
      statusEl.textContent = message;
    });
  }

  function sectorLabel() {
    const s = DATA.sectors.find((x) => x.id === state.sector);
    return s ? s.label : "";
  }

  function setStep(step, options) {
    state.step = step;
    saveState();
    render(options);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  /* ---------- Progress ---------- */
  function updateProgress() {
    if (state.step === RESULTS_STEP) {
      progressRegion.hidden = true;
      return;
    }
    progressRegion.hidden = false;
    const pct = Math.round((state.step / TOTAL_INPUT_STEPS) * 100);
    progressFill.style.width = pct + "%";
    progressBar.setAttribute("aria-valuenow", String(pct));
    progressBar.setAttribute("aria-valuetext", `Step ${state.step + 1} of ${TOTAL_INPUT_STEPS}`);
    progressLabel.textContent = `Step ${state.step + 1} of ${TOTAL_INPUT_STEPS}`;
    progressTitle.textContent = state.step === 0 ? "Project" : DATA.groups[state.step - 1].title;
  }

  /* ---------- Screens ---------- */
  function renderIntro() {
    const options = DATA.sectors
      .map((s) => `<option value="${esc(s.id)}"${s.id === state.sector ? " selected" : ""}>${esc(s.label)}</option>`)
      .join("");
    stage.innerHTML = `
      <section class="card" aria-labelledby="step-title">
        <p class="eyebrow">Deep-tech commercialization</p>
        <h1 id="step-title" tabindex="-1">Score your lab-to-market readiness</h1>
        <p class="lede">Answer a short questionnaire about your technology, manufacturing and commercial traction. You get TRL and MRL scores, your biggest gap, and next milestones. It takes about five minutes and your answers stay in your browser.</p>
        <form id="intro-form" novalidate>
          <div class="field">
            <label for="project-name">Project or technology name</label>
            <input id="project-name" name="name" type="text" maxlength="80" autocomplete="off" required value="${esc(state.name)}" aria-describedby="name-error">
            <p class="field-error" id="name-error" hidden>Enter a project name to continue.</p>
          </div>
          <div class="field">
            <label for="sector">Sector</label>
            <select id="sector" name="sector" required aria-describedby="sector-error">
              <option value="">Choose a sector…</option>${options}
            </select>
            <p class="field-error" id="sector-error" hidden>Choose a sector to continue.</p>
          </div>
          <div class="actions">
            <span></span>
            <button type="submit" class="btn btn-primary">Start questionnaire</button>
          </div>
        </form>
      </section>`;

    const form = document.getElementById("intro-form");
    const nameInput = document.getElementById("project-name");
    const sectorSelect = document.getElementById("sector");
    nameInput.addEventListener("input", () => {
      state.name = nameInput.value;
      saveState();
    });
    sectorSelect.addEventListener("change", () => {
      state.sector = sectorSelect.value;
      saveState();
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameOk = nameInput.value.trim().length > 0;
      const sectorOk = sectorSelect.value !== "";
      toggleError(nameInput, "name-error", !nameOk);
      toggleError(sectorSelect, "sector-error", !sectorOk);
      if (!nameOk) return nameInput.focus();
      if (!sectorOk) return sectorSelect.focus();
      state.name = nameInput.value.trim();
      state.sector = sectorSelect.value;
      setStep(1);
    });
  }

  function toggleError(input, errorId, show) {
    document.getElementById(errorId).hidden = !show;
    if (show) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function renderGroup(index) {
    const group = DATA.groups[index];
    const isLast = index === DATA.groups.length - 1;
    const questions = group.questions
      .map((q) => {
        const value = state.answers[q.id];
        const helpId = `${q.id}-help`;
        return `
        <fieldset class="question" aria-describedby="${helpId}">
          <legend>${esc(q.text)}</legend>
          <p class="help" id="${helpId}">${esc(q.help)}</p>
          <div class="choices">
            <label class="choice"><input type="radio" name="${esc(q.id)}" value="yes"${value === "yes" ? " checked" : ""}><span>Yes</span></label>
            <label class="choice"><input type="radio" name="${esc(q.id)}" value="no"${value === "no" ? " checked" : ""}><span>Not yet</span></label>
          </div>
        </fieldset>`;
      })
      .join("");

    stage.innerHTML = `
      <section class="card" aria-labelledby="step-title">
        <p class="eyebrow">${esc(DATA.dimensionLabels[group.dimension])}</p>
        <h1 id="step-title" tabindex="-1">${esc(group.title.replace(/^[^:]+:\s*/, "").replace(/^./, (c) => c.toUpperCase()) || group.title)}</h1>
        <p class="lede">${esc(group.intro)}</p>
        <form id="group-form">${questions}
          <div class="actions">
            <button type="button" class="btn btn-secondary" id="back">Back</button>
            <button type="submit" class="btn btn-primary">${isLast ? "See my results" : "Next"}</button>
          </div>
        </form>
      </section>`;

    const form = document.getElementById("group-form");
    form.addEventListener("change", (e) => {
      if (e.target && e.target.type === "radio") {
        state.answers[e.target.name] = e.target.value;
        saveState();
      }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      setStep(state.step + 1);
    });
    document.getElementById("back").addEventListener("click", () => setStep(state.step - 1));
  }

  function stepBar(label, level, max) {
    let cells = "";
    for (let i = 1; i <= max; i++) {
      const cls = i < level ? "filled" : i === level ? "filled current" : "";
      cells += `<li class="${cls}"></li>`;
    }
    return `<ol class="stepbar" role="img" aria-label="${esc(label)} ${level} of ${max}" style="--n:${max}">${cells}</ol>
      <div class="stepbar-scale" aria-hidden="true"><span>1</span><span>${max}</span></div>`;
  }

  function scoreCard(dimension, level, detail) {
    const scale = DATA.scales[dimension];
    const info = Scoring.levelInfo(dimension, level);
    const warn = detail.beyondGate.length
      ? `<p class="inline-note">You answered Yes to ${detail.beyondGate.length === 1 ? "a higher level" : "higher levels"} than your score. Each level needs every lower level confirmed, so the score stops at the first gap.</p>`
      : "";
    return `
      <article class="score-card" aria-labelledby="${dimension}-heading">
        <h3 id="${dimension}-heading" class="score-kicker">${esc(scale.name)}</h3>
        <p class="score-number" aria-label="${esc(scale.abbr)} ${level}"><span class="abbr">${esc(scale.abbr)}</span> ${level}<span class="of"> / ${scale.max}</span></p>
        ${stepBar(scale.abbr, level, scale.max)}
        <p class="level-title">${esc(info.title)}</p>
        <p class="level-def">${esc(info.definition)}</p>
        <p class="source">${esc(scale.source)} definition</p>
        ${warn}
      </article>`;
  }

  function renderResults() {
    const a = state.answers;
    const trlDetail = Scoring.scoreDimension("trl", a);
    const mrlDetail = Scoring.scoreDimension("mrl", a);
    const trl = trlDetail.level;
    const mrl = mrlDetail.level;
    const biz = Scoring.scoreBusiness(a);
    const gap = Scoring.findBiggestGap(trl, mrl, biz.count, biz.total);
    const milestones = Scoring.pickMilestones(trl, mrl, state.sector, a);
    const summary = Scoring.buildSummary({ name: state.name, sector: state.sector, trl, mrl, answers: a });

    const bizItems = DATA.groups
      .filter((g) => g.dimension === "biz")
      .flatMap((g) => g.questions)
      .map((q) => {
        const done = a[q.id] === "yes";
        return `<li class="${done ? "done" : "open"}"><span class="mark" aria-hidden="true">${done ? "✓" : "○"}</span><span>${esc(q.label.charAt(0).toUpperCase() + q.label.slice(1))}<span class="sr-only">${done ? ": in place" : ": not yet"}</span></span></li>`;
      })
      .join("");

    const gapTitle = gap.balanced ? "Well balanced" : DATA.dimensionLabels[gap.dimension];
    const milestoneItems = milestones
      .map((m) => {
        const tag =
          m.dimension === "biz"
            ? "Business"
            : `${DATA.scales[m.dimension].abbr} ${m.from} → ${m.to}`;
        return `<li><span class="tag tag-${m.dimension}">${esc(tag)}</span><span class="m-text">${esc(m.text)}</span></li>`;
      })
      .join("");

    stage.innerHTML = `
      <section class="results" aria-labelledby="step-title">
        <div class="results-head">
          <p class="eyebrow">${esc(sectorLabel())} · Readiness report</p>
          <h1 id="step-title" tabindex="-1">${esc(state.name)}</h1>
        </div>

        <div class="score-grid">
          ${scoreCard("trl", trl, trlDetail)}
          ${scoreCard("mrl", mrl, mrlDetail)}
        </div>

        <div class="two-col">
          <aside class="callout" aria-labelledby="gap-heading">
            <p class="eyebrow">Biggest gap</p>
            <h2 id="gap-heading">${esc(gapTitle)}</h2>
            <p>${esc(Scoring.gapMessage(gap, trl, mrl, biz))}</p>
          </aside>
          <section class="card card-flat" aria-labelledby="biz-heading">
            <p class="eyebrow">Business readiness</p>
            <h2 id="biz-heading">${biz.count} of ${biz.total} markers in place</h2>
            <ul class="biz-list">${bizItems}</ul>
          </section>
        </div>

        <section class="card card-flat" aria-labelledby="ms-heading">
          <p class="eyebrow">Next steps</p>
          <h2 id="ms-heading">Recommended next milestones</h2>
          <ol class="milestones">${milestoneItems}</ol>
        </section>

        <section class="card card-flat" aria-labelledby="sum-heading">
          <p class="eyebrow">Pitch-ready</p>
          <h2 id="sum-heading">Summary</h2>
          <p id="summary-text" class="summary">${esc(summary)}</p>
        </section>

        <div class="actions results-actions no-print">
          <button type="button" class="btn btn-secondary" id="edit">Review answers</button>
          <div class="btn-row">
            <button type="button" class="btn btn-secondary" id="copy">Copy summary</button>
            <button type="button" class="btn btn-secondary" id="print">Print / Save as PDF</button>
            <button type="button" class="btn btn-primary" id="restart">Start over</button>
          </div>
        </div>
      </section>`;

    document.getElementById("edit").addEventListener("click", () => setStep(1));
    document.getElementById("print").addEventListener("click", () => window.print());
    document.getElementById("restart").addEventListener("click", startOver);
    document.getElementById("copy").addEventListener("click", () => copyText(summary));
  }

  /* ---------- Actions ---------- */
  function copyText(text) {
    const done = () => announce("Summary copied to clipboard.");
    const fail = () => announce("Copy failed. Select the summary text and copy it manually.");
    function fallback() {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        ok ? done() : fail();
      } catch (e) {
        fail();
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
    const btn = document.getElementById("copy");
    if (btn) {
      const original = btn.textContent;
      btn.textContent = "Copied ✓";
      window.setTimeout(() => {
        btn.textContent = original;
      }, 1800);
    }
  }

  function startOver() {
    if (!window.confirm("Start over? This clears your answers.")) return;
    clearState();
    state = { name: "", sector: "", answers: {}, step: 0 };
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  /* ---------- About panel ---------- */
  function renderAbout() {
    const body = ["trl", "mrl"]
      .map((key) => {
        const s = DATA.scales[key];
        const rows = s.levels
          .map((l) => `<tr><th scope="row" class="lvl">${l.level}</th><td><strong>${esc(l.title)}</strong><br>${esc(l.definition)}</td><td class="plain">${esc(l.plain)}</td></tr>`)
          .join("");
        return `
        <div class="scale-block">
          <h3>${esc(s.name)} (${esc(s.abbr)}), ${s.min} to ${s.max}</h3>
          ${s.about.map((p) => `<p>${esc(p)}</p>`).join("")}
          <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(s.abbr)} reference table">
            <table>
              <caption class="sr-only">${esc(s.name)} levels and definitions (${esc(s.source)})</caption>
              <thead><tr><th scope="col">Level</th><th scope="col">Official definition</th><th scope="col">In plain terms</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`;
      })
      .join("");
    document.getElementById("about-body").innerHTML = body;
  }

  /* ---------- Render ---------- */
  function render(options) {
    updateProgress();
    if (state.step === 0) renderIntro();
    else if (state.step === RESULTS_STEP) renderResults();
    else renderGroup(state.step - 1);

    if (!(options && options.noFocus)) {
      const h = document.getElementById("step-title");
      if (h) h.focus({ preventScroll: true });
    }
  }

  function init() {
    loadState();
    renderAbout();
    // Open the About panel when the header link is used.
    document.getElementById("about-link").addEventListener("click", () => {
      document.getElementById("about-details").open = true;
    });
    if (window.location.hash === "#about") document.getElementById("about-details").open = true;
    render({ noFocus: true });
  }

  init();
})();
