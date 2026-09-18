import assert from "node:assert/strict";
import { test } from "node:test";
import type { QuestionId } from "./question.ts";
import { questionId } from "./question.ts";
import type { ReferralTarget } from "./referral.ts";
import { isReferralReply, parseReferralTargets, resolveReferral } from "./referral.ts";

test("parseReferralTargets: 'reply number N (YYYY)'", () => {
  assert.deepEqual(parseReferralTargets("I refer the Member to reply number 13 (2024)", 2024), [
    questionId(2024, 13),
  ]);
});

test("parseReferralTargets: 'my answer to written question N (YYYY)'", () => {
  assert.deepEqual(
    parseReferralTargets("I refer the member to my answer to written question 1234 (2024)", 2024),
    [questionId(2024, 1234)],
  );
});

test("parseReferralTargets: 'WQ N (YYYY)'", () => {
  assert.deepEqual(parseReferralTargets("See WQ 1234 (2024) for detail.", 2024), [
    questionId(2024, 1234),
  ]);
});

test("parseReferralTargets: 'reply to question No. N' with an implied year", () => {
  assert.deepEqual(parseReferralTargets("I refer the Member to reply to question No. 1234", 2025), [
    questionId(2025, 1234),
  ]);
});

test("parseReferralTargets: no target in an unrelated mention of 'question'", () => {
  assert.deepEqual(
    parseReferralTargets("I refer the Member to Oral Question No. 9 on 1 February 2024.", 2024),
    [],
  );
});

test("isReferralReply: true for a short pure referral, false once it stops being short or referral-shaped", () => {
  assert.equal(isReferralReply("I refer the Member to reply number 13 (2024)"), true);
  assert.equal(
    isReferralReply("Corrected reply: I refer the Member to reply number 13 (2024)"),
    true,
  );
  assert.equal(isReferralReply("Yes, that is correct."), false);
});

test("isReferralReply: a long substantive reply that merely mentions another question stays text", () => {
  const long =
    "The information sought by the Member is provided as part of the Ministry for the " +
    "Environment's Annual Review submission. I refer the Member to the Ministry's response " +
    "to Question 174 of the 2021/2022 Annual Review submission, available on the Ministry's website.";
  assert.equal(isReferralReply(long), false);
});

function lookupOf(map: ReadonlyMap<QuestionId, ReferralTarget>) {
  return (id: QuestionId) => map.get(id);
}

test("resolveReferral: follows a chain of two hops to the final text", () => {
  const q1 = questionId(2024, 1);
  const q2 = questionId(2024, 2);
  const q3 = questionId(2024, 3);
  const lookup = lookupOf(
    new Map([
      [q1, { text: "refer to 2", targets: [q2] }],
      [q2, { text: "refer to 3", targets: [q3] }],
      [q3, { text: "the actual answer", targets: [] }],
    ]),
  );
  assert.deepEqual(resolveReferral(q1, lookup), {
    chain: [q2, q3],
    resolvedText: "the actual answer",
  });
});

test("resolveReferral: a cycle resolves to null text", () => {
  const q1 = questionId(2024, 1);
  const q2 = questionId(2024, 2);
  const lookup = lookupOf(
    new Map([
      [q1, { text: "refer to 2", targets: [q2] }],
      [q2, { text: "refer to 1", targets: [q1] }],
    ]),
  );
  const result = resolveReferral(q1, lookup);
  assert.equal(result.resolvedText, null);
  assert.deepEqual(result.chain, [q2, q1]);
});

test("resolveReferral: a missing target resolves to null text", () => {
  const q1 = questionId(2024, 1);
  const q2 = questionId(2024, 2);
  const lookup = lookupOf(new Map([[q1, { text: "refer to 2", targets: [q2] }]]));
  const result = resolveReferral(q1, lookup);
  assert.equal(result.resolvedText, null);
  assert.deepEqual(result.chain, [q2]);
});

test("resolveReferral: stops at the depth cap of 5 hops", () => {
  // A straight chain of 8 questions, each referring to the next: q0 -> q1 -> ... -> q7 (final text).
  const q0 = questionId(2024, 0);
  const q1 = questionId(2024, 1);
  const q2 = questionId(2024, 2);
  const q3 = questionId(2024, 3);
  const q4 = questionId(2024, 4);
  const q5 = questionId(2024, 5);
  const q6 = questionId(2024, 6);
  const q7 = questionId(2024, 7);
  const entries = new Map<QuestionId, ReferralTarget>([
    [q0, { text: "refer to 1", targets: [q1] }],
    [q1, { text: "refer to 2", targets: [q2] }],
    [q2, { text: "refer to 3", targets: [q3] }],
    [q3, { text: "refer to 4", targets: [q4] }],
    [q4, { text: "refer to 5", targets: [q5] }],
    [q5, { text: "refer to 6", targets: [q6] }],
    [q6, { text: "refer to 7", targets: [q7] }],
    [q7, { text: "final", targets: [] }],
  ]);
  const result = resolveReferral(q0, lookupOf(entries));
  assert.equal(result.resolvedText, null);
  assert.equal(result.chain.length, 5);
});

test("isReferralReply: a substantive reply that says it is also the answer to another question is not a referral", () => {
  assert.equal(
    isReferralReply(
      "No, I do not have a policy in my office on whether minutes should be taken. This is also my answer to written parliamentary question 422 (2024).",
    ),
    false,
  );
});
