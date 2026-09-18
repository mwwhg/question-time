import assert from "node:assert/strict";
import { test } from "node:test";
import { computeFeatures } from "./features.ts";

test("questionParts: a single ask with no connectors is 1", () => {
  const f = computeFeatures({ questionText: "What is the budget for X?", replyText: "$5m." });
  assert.equal(f.questionParts, 1);
});

test("questionParts: '; if so' joins a follow-up ask", () => {
  const f = computeFeatures({
    questionText: "Does the Minister agree with the report; if so, what action will he take?",
    replyText: "Yes.",
  });
  assert.equal(f.questionParts, 2);
});

test("questionParts: 'broken down by' does not add a part", () => {
  const f = computeFeatures({
    questionText: "How many staff are employed, broken down by region?",
    replyText: "120.",
  });
  assert.equal(f.questionParts, 1);
});

test("questionParts: a lettered list counts each item", () => {
  const f = computeFeatures({
    questionText: "What is (a) the cost and (b) the timeline and (c) the contractor?",
    replyText: "See below.",
  });
  assert.equal(f.questionParts, 3);
});

test("hasNumber: true for a digit sequence", () => {
  const f = computeFeatures({ questionText: "q", replyText: "There were 42 cases." });
  assert.equal(f.hasNumber, true);
});

test("hasNumber: true for spelled 'nil'/'none'/'zero'", () => {
  assert.equal(computeFeatures({ questionText: "q", replyText: "Nil." }).hasNumber, true);
  assert.equal(computeFeatures({ questionText: "q", replyText: "None." }).hasNumber, true);
  assert.equal(computeFeatures({ questionText: "q", replyText: "Zero." }).hasNumber, true);
});

test("hasNumber: false with no digits or spelled numbers", () => {
  const f = computeFeatures({ questionText: "q", replyText: "This is an ongoing matter." });
  assert.equal(f.hasNumber, false);
});

test("stockPhrases: matches case-insensitively and returns the matched phrases", () => {
  const f = computeFeatures({
    questionText: "q",
    replyText: "This is Commercially Sensitive and I Am Advised it will remain so.",
  });
  assert.deepEqual(f.stockPhrases, ["commercially sensitive", "I am advised"]);
});
