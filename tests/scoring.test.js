"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");

const DATA = require("../data/questions.js");
const S = require("../scoring.js");

const allQuestions = DATA.groups.flatMap((g) => g.questions);
const answerAll = (value) => Object.fromEntries(allQuestions.map((q) => [q.id, value]));

test("all No answers give TRL 1 and MRL 1", () => {
  const a = answerAll("no");
  assert.equal(S.scoreTRL(a), 1);
  assert.equal(S.scoreMRL(a), 1);
});

test("all Yes answers give TRL 9 and MRL 10", () => {
  const a = answerAll("yes");
  assert.equal(S.scoreTRL(a), 9);
  assert.equal(S.scoreMRL(a), 10);
  assert.equal(S.scoreBusiness(a).count, 5);
});

test("mixed realistic case: lab-validated, early manufacturing", () => {
  const a = { trl1: "yes", trl2: "yes", trl3: "yes", trl4: "yes", trl5: "no", mrl2: "yes", mrl3: "yes", mrl4: "no",
    "biz-discovery": "yes", "biz-ip": "yes" };
  assert.equal(S.scoreTRL(a), 4);
  assert.equal(S.scoreMRL(a), 3);
  assert.equal(S.scoreBusiness(a).count, 2);
});

test("levels are gated: a Yes above a gap does not raise the score and is reported", () => {
  const a = { trl1: "yes", trl2: "yes", trl3: "no", trl6: "yes" };
  const d = S.scoreDimension("trl", a);
  assert.equal(d.level, 2);
  assert.deepEqual(d.beyondGate, ["trl6"]);
});

test("missing, empty and malformed answers do not crash", () => {
  for (const bad of [undefined, null, {}, [], "x", 42, { trl1: undefined, trl2: null }]) {
    assert.equal(S.scoreTRL(bad), 1);
    assert.equal(S.scoreMRL(bad), 1);
    assert.equal(S.scoreBusiness(bad).count, 0);
    assert.ok(S.pickMilestones(1, 1, "energy", bad).length >= 3);
  }
});

test("biggest gap finds the lagging dimension and detects balance", () => {
  assert.equal(S.findBiggestGap(7, 2, 3, 5).dimension, "mrl");
  assert.equal(S.findBiggestGap(2, 8, 4, 5).dimension, "trl");
  assert.equal(S.findBiggestGap(7, 8, 0, 5).dimension, "biz");
  assert.equal(S.findBiggestGap(9, 10, 5, 5).balanced, true);
});

test("pickMilestones returns 3 to 5 sector-specific items for every sector and level", () => {
  for (const sector of DATA.sectors.map((s) => s.id)) {
    for (let trl = 1; trl <= 9; trl++) {
      for (let mrl = 1; mrl <= 10; mrl++) {
        const m = S.pickMilestones(trl, mrl, sector, {});
        assert.ok(m.length >= 3 && m.length <= 5, `${sector} TRL${trl} MRL${mrl} gave ${m.length}`);
        assert.equal(new Set(m.map((x) => x.text)).size, m.length, "no duplicates");
        m.forEach((x) => assert.ok(x.text && x.dimension));
      }
    }
  }
});

test("TRL 4 energy project is told to build a relevant-environment prototype and find a test site", () => {
  const text = S.pickMilestones(4, 4, "energy", {}).map((m) => m.text.toLowerCase()).join(" | ");
  assert.match(text, /relevant-environment prototype/);
  assert.match(text, /utility or national lab test site/);
});

test("milestones differ by sector and unknown sectors fall back to Other", () => {
  const energy = S.pickMilestones(4, 4, "energy", {}).map((m) => m.text).join();
  const quantum = S.pickMilestones(4, 4, "quantum", {}).map((m) => m.text).join();
  assert.notEqual(energy, quantum);
  assert.deepEqual(S.pickMilestones(4, 4, "nonsense", {}), S.pickMilestones(4, 4, "other", {}));
});

test("business milestones only list items not yet done", () => {
  const a = { "biz-ip": "yes", "biz-lead": "yes", "biz-funding": "yes", "biz-discovery": "yes" };
  const biz = S.pickMilestones(5, 5, "energy", a).filter((m) => m.dimension === "biz");
  assert.equal(biz.length, 1);
  assert.match(biz[0].text, /pilot customer/i);
});

test("summary mentions name, levels and sector, and survives empty input", () => {
  const s = S.buildSummary({ name: "Acme Cell", sector: "energy", trl: 4, mrl: 3, answers: { "biz-ip": "yes" } });
  assert.match(s, /Acme Cell/);
  assert.match(s, /TRL 4/);
  assert.match(s, /MRL 3/);
  assert.match(s, /energy/);
  assert.match(s, /IP filed/);
  assert.doesNotMatch(s, /undefined|\{/);
  assert.doesNotThrow(() => S.buildSummary({ trl: 1, mrl: 1 }));
});

test("every level has a definition and the data tables are complete", () => {
  assert.equal(DATA.scales.trl.levels.length, 9);
  assert.equal(DATA.scales.mrl.levels.length, 10);
  DATA.scales.trl.levels.forEach((l, i) => assert.equal(l.level, i + 1));
  DATA.scales.mrl.levels.forEach((l, i) => assert.equal(l.level, i + 1));
  for (const band of DATA.techBands) for (const s of DATA.sectors) assert.equal(band.sector[s.id].length, 2);
  for (const band of DATA.mfgBands) for (const s of DATA.sectors) assert.ok(band.sector[s.id]);
});
