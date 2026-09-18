import assert from "node:assert/strict";
import { test } from "node:test";
import type { Question } from "../question/question.ts";
import { methodInput } from "./method.ts";

const FEATURES = {
  version: "f1" as const,
  replyChars: 10,
  replyWords: 3,
  hasNumber: true,
  stockPhrases: [],
  questionParts: 2,
};

function question(overrides: Partial<Question>): Question {
  return {
    id: "2024-1" as Question["id"],
    year: 2024,
    number: 1,
    parliament: 54,
    source: { docId: "d", url: "u", rawFile: "r", retrievedAt: "t" },
    status: "answered",
    statusIdRaw: 2,
    dateAsked: "2024-01-01",
    askedBy: "Someone",
    askedById: "id",
    portfolio: "Health",
    portfolioId: "p",
    minister: "Minister",
    text: "How many staff are there?",
    reply: { kind: "text", text: "120 staff.", corrected: false },
    attachment: null,
    duplicateGroup: "g",
    features: FEATURES,
    ...overrides,
  };
}

test("methodInput: text reply has no referredReply and refersToEarlier is false", () => {
  const input = methodInput(question({}));
  assert.equal(input.referredReply, null);
  assert.equal(input.features.refersToEarlier, false);
  assert.equal(input.reply, "120 staff.");
});

test("methodInput: referral reply carries the resolved text and refersToEarlier is true", () => {
  const input = methodInput(
    question({
      reply: {
        kind: "referral",
        text: "See reply 1 (2024).",
        corrected: false,
        referral: { chain: ["2024-1" as Question["id"]], resolvedText: "Earlier answer." },
      },
    }),
  );
  assert.equal(input.referredReply, "Earlier answer.");
  assert.equal(input.features.refersToEarlier, true);
});

test("methodInput: referral with no resolved text passes referredReply as null", () => {
  const input = methodInput(
    question({
      reply: {
        kind: "referral",
        text: "See reply 999 (2024).",
        corrected: false,
        referral: { chain: [], resolvedText: null },
      },
    }),
  );
  assert.equal(input.referredReply, null);
  assert.equal(input.features.refersToEarlier, true);
});

test("methodInput: attachment-only reply sets hasAttachment from the question's attachment", () => {
  const input = methodInput(
    question({
      reply: {
        kind: "attachment-only",
        text: "See attached table.",
        corrected: false,
        attachment: { id: "a1", name: "table.pdf", size: 100 },
      },
      attachment: { id: "a1", name: "table.pdf", size: 100 },
    }),
  );
  assert.equal(input.features.hasAttachment, true);
  assert.equal(input.referredReply, null);
});

test("methodInput: throws for a reply of kind none", () => {
  assert.throws(() => methodInput(question({ reply: { kind: "none" } })));
});
