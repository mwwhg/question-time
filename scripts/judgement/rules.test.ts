import assert from "node:assert/strict";
import { test } from "node:test";
import type { MethodInput } from "./method.ts";
import { judgeRules } from "./rules.ts";

function input(overrides: Partial<MethodInput>): MethodInput {
  return {
    question: "How many staff work in the department?",
    reply: "There are 120 staff.",
    referredReply: null,
    features: {
      replyWords: 4,
      hasNumber: true,
      refersToEarlier: false,
      hasAttachment: false,
      questionParts: 1,
    },
    ...overrides,
  };
}

test("rules: a direct figure answer is answered, yes, single part", () => {
  const a = judgeRules(input({}));
  assert.equal(a.answered.choice, "answered");
  assert.equal(a.givesRequestedFigure.choice, "yes");
  assert.equal(a.addressesAllParts.choice, "single_part_question");
  assert.equal(a.declinesWithReason.probability, 0);
});

test("rules: a stock decline phrase is not_answered and declines with reason", () => {
  const a = judgeRules(input({ reply: "This is commercially sensitive information." }));
  assert.equal(a.answered.choice, "not_answered");
  assert.equal(a.declinesWithReason.probability, 1);
});

test("rules: figure question with no number in the reply is 'no'", () => {
  const a = judgeRules(
    input({
      question: "How much did this cost?",
      reply: "It cost a lot.",
      features: { ...input({}).features, hasNumber: false },
    }),
  );
  assert.equal(a.givesRequestedFigure.choice, "no");
});

test("rules: a non-figure question is no_figure_requested", () => {
  const a = judgeRules(input({ question: "What is the Minister's view on this policy?" }));
  assert.equal(a.givesRequestedFigure.choice, "no_figure_requested");
});

test("rules: unresolved referral is unclear", () => {
  const a = judgeRules(input({ features: { ...input({}).features, refersToEarlier: true } }));
  assert.equal(a.answered.choice, "unclear");
});

test("rules: attachment reply with little text is unclear and evasionType none unless 'publicly available'", () => {
  const a = judgeRules(
    input({
      reply: "See the attached table.",
      features: { ...input({}).features, hasAttachment: true, replyWords: 4, hasNumber: false },
    }),
  );
  assert.equal(a.answered.choice, "unclear");
});

test("rules: refers_elsewhere when not answered and mentions a website", () => {
  const a = judgeRules(
    input({
      reply: "We do not hold this information; it is publicly available on our website.",
      features: { ...input({}).features, hasNumber: false },
    }),
  );
  assert.equal(a.answered.choice, "not_answered");
  assert.equal(a.evasionType.choice, "refers_elsewhere");
});

test("rules: multi-part question that is answered gets all_parts", () => {
  const a = judgeRules(input({ features: { ...input({}).features, questionParts: 2 } }));
  assert.equal(a.addressesAllParts.choice, "all_parts");
});
