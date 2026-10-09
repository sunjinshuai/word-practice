import test from "node:test";
import assert from "node:assert/strict";
import { vocabulary, ariaAudio } from "../src/data/content.js";
import { accepts, scheduleReview, reviewPool } from "../src/domain/practice.js";
import { deriveLearning } from "../src/services/history.js";
test("158 stable IDs and local audio for every item", () => {
  assert.equal(vocabulary.length, 158);
  assert.equal(new Set(vocabulary.map((v) => v.id)).size, 158);
  for (const v of vocabulary)
    assert(ariaAudio[v.en.replace("look/stand", "look")], v.en);
});
test("case, whitespace, punctuation, aliases and Chinese alternatives", () => {
  assert(accepts({ en: "take photos", zh: "拍照" }, " TAKE   PHOTOS! ", "en"));
  assert(accepts({ en: "stamp", zh: "盖章；印章" }, "印章", "zh"));
  assert(!accepts({ en: "art", zh: "艺术" }, "arts", "en"));
});
test("spaced review preserves early due dates, advances due answers and resets failures", () => {
  const first = scheduleReview(null, true, 0);
  assert.equal(first.due, 300000);
  const early = scheduleReview(first, true, 100);
  assert.equal(early.due, first.due);
  assert.equal(scheduleReview(first, true, first.due).stage, 1);
  assert.equal(scheduleReview({ ...first, stage: 8 }, false, 400000).stage, 0);
  const items = [{ id: "a" }, { id: "b" }];
  assert.deepEqual(reviewPool(items, { "en:a": first }, "en", 300000), {
    due: [items[0]],
    fresh: [items[1]],
  });
});
test("historical events restore reviews and explicit mistake removal", () => {
  const review = scheduleReview(null, false, 0),
    events = [
      {
        id: "a",
        occurred_at: "2026-10-07T00:00:00Z",
        kind: "answer",
        payload: { item_id: "u1:art", direction: "en", correct: false, review },
      },
      {
        id: "b",
        occurred_at: "2026-10-08T00:00:00Z",
        kind: "mistake",
        payload: { item_id: "u1:art", active: false },
      },
    ];
  assert.deepEqual(deriveLearning(events), {
    reviews: { "en:u1:art": review },
    mistakes: {},
  });
});

import {
  analyzePhonics,
  compareSplit,
  cutsFor,
} from "../src/domain/phonics.js";
test("teaching splits keep single syllables intact and distinguish references from trials", () => {
  assert.deepEqual(analyzePhonics("more").reference, ["more"]);
  assert.equal(analyzePhonics("more").candidate, null);
  for (const [word, parts] of [
    ["letter", ["let", "ter"]],
    ["student", ["stu", "dent"]],
    ["lettuce", ["let", "tuce"]],
  ]) {
    const result = analyzePhonics(word);
    assert.deepEqual(result.reference, parts);
    assert.deepEqual(result.candidate, parts);
    assert.equal(compareSplit(result, cutsFor(parts)).matches, true);
    assert.equal(compareSplit(result, [1]).matches, false);
  }
  assert.match(analyzePhonics("lettuce").note, /ɪs/);
  assert.equal(compareSplit(analyzePhonics("unknownword"), [3]).matches, null);
  assert.equal(
    analyzePhonics("interesting").reference,
    null,
    "hide reference when segment count conflicts with the dictionary",
  );
});
