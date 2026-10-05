/*
 * Pure scoring functions. No DOM, no storage, no side effects, so they can be
 * unit tested with `node --test`. All content comes from data/questions.js.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./data/questions.js"));
  } else {
    root.Scoring = factory(root.READINESS_DATA);
  }
})(typeof self !== "undefined" ? self : this, function (DATA) {
  "use strict";

  const BUSINESS_QUESTIONS = DATA.groups.filter((g) => g.dimension === "biz").flatMap((g) => g.questions);

  function questionsFor(dimension) {
    return DATA.groups.filter((g) => g.dimension === dimension).flatMap((g) => g.questions);
  }

  function isYes(value) {
    return value === "yes" || value === true;
  }

  function safeAnswers(answers) {
    return answers && typeof answers === "object" ? answers : {};
  }

  /**
   * Gated scoring: a level only counts if every lower level is also a Yes.
   * Missing or non-"yes" answers count as No. Returns the level reached plus
   * any Yes answers above the first gap, which the UI can flag.
   */
  function scoreDimension(dimension, answers) {
    const a = safeAnswers(answers);
    const scale = DATA.scales[dimension];
    const ordered = questionsFor(dimension).slice().sort((x, y) => x.level - y.level);
    let level = scale.min;
    let firstGap = null;
    for (const q of ordered) {
      if (isYes(a[q.id])) {
        level = q.level;
      } else {
        firstGap = q;
        break;
      }
    }
    const beyondGate = firstGap ? ordered.filter((q) => q.level > firstGap.level && isYes(a[q.id])).map((q) => q.id) : [];
    return { level, firstGap, beyondGate };
  }

  function scoreTRL(answers) {
    return scoreDimension("trl", answers).level;
  }

  function scoreMRL(answers) {
    return scoreDimension("mrl", answers).level;
  }

  function scoreBusiness(answers) {
    const a = safeAnswers(answers);
    const have = BUSINESS_QUESTIONS.filter((q) => isYes(a[q.id]));
    const missing = BUSINESS_QUESTIONS.filter((q) => !isYes(a[q.id]));
    return { count: have.length, total: BUSINESS_QUESTIONS.length, have, missing };
  }

  function levelInfo(dimension, level) {
    const scale = DATA.scales[dimension];
    return scale.levels.find((l) => l.level === level) || scale.levels[0];
  }

  /** Normalise each dimension to 0..1 so they can be compared. */
  function normalised(trl, mrl, bizCount, bizTotal) {
    return {
      trl: (trl - DATA.scales.trl.min) / (DATA.scales.trl.max - DATA.scales.trl.min),
      mrl: (mrl - DATA.scales.mrl.min) / (DATA.scales.mrl.max - DATA.scales.mrl.min),
      biz: bizTotal ? bizCount / bizTotal : 0,
    };
  }

  const TIE_ORDER = ["mrl", "biz", "trl"]; // manufacturing usually lags for lab spin-outs

  function rankDimensions(scores) {
    return TIE_ORDER.slice().sort((a, b) => scores[a] - scores[b]);
  }

  /** Which dimension lags most. `balanced` when the spread is under 0.15. */
  function findBiggestGap(trl, mrl, bizCount, bizTotal) {
    const total = bizTotal == null ? BUSINESS_QUESTIONS.length : bizTotal;
    const scores = normalised(trl, mrl, bizCount, total);
    const ranked = rankDimensions(scores);
    const spread = scores[ranked[ranked.length - 1]] - scores[ranked[0]];
    return { dimension: ranked[0], balanced: spread < 0.15, scores, ranked };
  }

  function bandFor(bands, level) {
    return bands.find((b) => level <= b.max) || bands[bands.length - 1];
  }

  function sectorKey(sector) {
    return DATA.sectors.some((s) => s.id === sector) ? sector : "other";
  }

  /**
   * Choose 3 to 5 next milestones for the current levels and sector.
   * The most lagging dimension is listed first and gets the extra slot.
   * Returns [{ dimension, text, from, to }]; from/to are levels for trl/mrl.
   */
  function pickMilestones(trl, mrl, sector, answers) {
    const key = sectorKey(sector);
    const t = Math.min(Math.max(Math.round(trl) || 1, 1), DATA.scales.trl.max);
    const m = Math.min(Math.max(Math.round(mrl) || 1, 1), DATA.scales.mrl.max);
    const biz = scoreBusiness(answers);

    const techBand = bandFor(DATA.techBands, t);
    const mfgBand = bandFor(DATA.mfgBands, m);

    const lists = {
      trl: techBand.sector[key].map((text) => ({ dimension: "trl", text, from: t, to: Math.min(t + 1, 9) })),
      mrl: [{ dimension: "mrl", text: mfgBand.sector[key], from: m, to: Math.min(m + 1, 10) }],
      biz: biz.missing.map((q) => ({ dimension: "biz", text: q.milestone })),
    };
    const extras = {
      trl: techBand.generic.map((text) => ({ dimension: "trl", text, from: t, to: Math.min(t + 1, 9) })),
      mrl: [{ dimension: "mrl", text: mfgBand.generic, from: m, to: Math.min(m + 1, 10) }],
      biz: [],
    };

    const gap = findBiggestGap(t, m, biz.count, biz.total);
    const order = gap.ranked;
    const result = [];

    // Round 1: lead with the first item from each dimension in lag order,
    // keeping technology's second item in the pool because that is the
    // primary milestone pair for the current TRL.
    const queue = [];
    for (const d of order) if (lists[d][0]) queue.push(lists[d][0]);
    if (lists.trl[1]) queue.push(lists.trl[1]);

    // Extra slot for the lagging dimension.
    const lagging = order[0];
    const extra = lagging === "biz" ? lists.biz[1] : extras[lagging][0];
    if (extra) queue.push(extra);

    const seen = new Set();
    for (const item of queue) {
      if (seen.has(item.text)) continue;
      seen.add(item.text);
      result.push(item);
      if (result.length === 5) break;
    }
    return result;
  }

  function lowerFirst(text) {
    return text ? text.charAt(0).toLowerCase() + text.slice(1) : "";
  }

  function stripPeriod(text) {
    return String(text).replace(/\.\s*$/, "");
  }

  function joinList(items) {
    if (items.length <= 1) return items.join("");
    if (items.length === 2) return items.join(" and ");
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
  }

  function fill(template, values) {
    return template.replace(/\{(\w+)\}/g, (_, k) => (values[k] == null ? "" : String(values[k])));
  }

  /** Plain-language paragraph a founder can paste into a pitch deck. */
  function buildSummary(input) {
    const S = DATA.summary;
    const name = (input.name || "").trim() || "This project";
    const sector = DATA.sectors.find((s) => s.id === sectorKey(input.sector));
    const trl = input.trl;
    const mrl = input.mrl;
    const biz = scoreBusiness(input.answers);
    const gap = findBiggestGap(trl, mrl, biz.count, biz.total);
    const milestones = pickMilestones(trl, mrl, input.sector, input.answers).slice(0, 3);

    const parts = [];
    parts.push(
      fill(S.main, {
        name,
        sector: (/^[aeiou]/i.test(sector.phrase) ? "an " : "a ") + sector.phrase,
        trl,
        trlDef: lowerFirst(stripPeriod(levelInfo("trl", trl).definition)),
        mrl,
        mrlDef: lowerFirst(stripPeriod(levelInfo("mrl", mrl).definition)),
      })
    );

    const have = joinList(biz.have.map((q) => q.label));
    if (biz.count === 0) parts.push(S.business.none);
    else if (biz.count === biz.total) parts.push(fill(S.business.all, { have }));
    else parts.push(fill(S.business.some, { have }));

    parts.push(gap.balanced ? S.gapBalanced : fill(S.gap, { gapLabel: DATA.dimensionLabels[gap.dimension].toLowerCase() }));

    if (milestones.length) {
      const next = milestones.map((m, i) => `(${i + 1}) ${lowerFirst(stripPeriod(m.text))}`).join("; ");
      parts.push(fill(S.next, { next }) + ".");
    }
    parts.push(S.disclaimer);
    return parts.join(" ");
  }

  function gapMessage(gap, trl, mrl, biz) {
    if (gap.balanced) return DATA.gapMessages.balanced;
    return fill(DATA.gapMessages[gap.dimension], { trl, mrl, biz: biz.count, bizTotal: biz.total });
  }

  return {
    scoreTRL,
    scoreMRL,
    scoreDimension,
    scoreBusiness,
    findBiggestGap,
    pickMilestones,
    buildSummary,
    gapMessage,
    levelInfo,
  };
});
