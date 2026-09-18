import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { FEATURES_VERSION } from "../question/features.ts";
import type { Question } from "../question/question.ts";
import type { Method } from "./method.ts";
import { QUESTION_SET_HASH } from "./qs-v1.ts";
import { readJudgements, runMethod } from "./run.ts";
import { probability } from "./vocabulary.ts";

const FEATURES = {
  version: "f1" as const,
  replyChars: 5,
  replyWords: 1,
  hasNumber: false,
  stockPhrases: [],
  questionParts: 1,
};

function question(id: string): Question {
  return {
    id: id as Question["id"],
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
    text: "What is the total?",
    reply: { kind: "text", text: "42.", corrected: false },
    attachment: null,
    duplicateGroup: "g",
    features: FEATURES,
  };
}

const DEGENERATE_ANSWERS = {
  answered: {
    kind: "choice" as const,
    choice: "answered" as const,
    probabilities: {
      answered: probability(1),
      partly_answered: probability(0),
      not_answered: probability(0),
      unclear: probability(0),
    },
    confidence: probability(1),
  },
  givesRequestedFigure: {
    kind: "choice" as const,
    choice: "yes" as const,
    probabilities: { yes: probability(1), no: probability(0), no_figure_requested: probability(0) },
    confidence: probability(1),
  },
  addressesAllParts: {
    kind: "choice" as const,
    choice: "single_part_question" as const,
    probabilities: {
      all_parts: probability(0),
      some_parts: probability(0),
      no_parts: probability(0),
      single_part_question: probability(1),
    },
    confidence: probability(1),
  },
  declinesWithReason: { kind: "noul" as const, probability: probability(0) },
  evasionType: {
    kind: "choice" as const,
    choice: "none" as const,
    probabilities: {
      related_topic: probability(0),
      restates_policy: probability(0),
      refers_elsewhere: probability(0),
      none: probability(1),
    },
    confidence: probability(1),
  },
};

function withTmpDir(fn: (dir: string) => Promise<void> | void) {
  const dir = mkdtempSync(join(tmpdir(), "run-"));
  return Promise.resolve(fn(dir)).finally(() => rmSync(dir, { recursive: true, force: true }));
}

test("runMethod: resumes and skips already-judged ids", () =>
  withTmpDir(async (dir) => {
    const out = join(dir, "judgements.jsonl");
    const method: Method = {
      id: "rules",
      version: "rules-1",
      async judge() {
        return {
          answers: DEGENERATE_ANSWERS,
          usage: { inputTokens: 0, outputTokens: 0, latencyMs: 0 },
        };
      },
    };
    const first = await runMethod(method, [question("2024-1"), question("2024-2")], { out });
    assert.deepEqual(first, { done: 2, skipped: 0, failed: 0 });

    const second = await runMethod(
      method,
      [question("2024-1"), question("2024-2"), question("2024-3")],
      { out },
    );
    assert.deepEqual(second, { done: 1, skipped: 2, failed: 0 });
    assert.equal(readJudgements(out).length, 3);
  }));

test("runMethod: retries a transient failure then succeeds", () =>
  withTmpDir(async (dir) => {
    const out = join(dir, "judgements.jsonl");
    let calls = 0;
    const method: Method = {
      id: "rules",
      version: "rules-1",
      async judge() {
        calls++;
        if (calls === 1) throw Object.assign(new Error("server error"), { status: 503 });
        return {
          answers: DEGENERATE_ANSWERS,
          usage: { inputTokens: 0, outputTokens: 0, latencyMs: 0 },
        };
      },
    };
    const result = await runMethod(method, [question("2024-1")], { out, concurrency: 1 });
    assert.deepEqual(result, { done: 1, skipped: 0, failed: 0 });
    assert.equal(calls, 2);
    const [judgement] = readJudgements(out);
    assert.equal(judgement?.kind, "judged");
  }));

test("runMethod: an immediate 4xx failure is recorded without retrying", () =>
  withTmpDir(async (dir) => {
    const out = join(dir, "judgements.jsonl");
    let calls = 0;
    const method: Method = {
      id: "rules",
      version: "rules-1",
      async judge() {
        calls++;
        throw Object.assign(new Error("bad request"), { status: 400 });
      },
    };
    const result = await runMethod(method, [question("2024-1")], { out, concurrency: 1 });
    assert.deepEqual(result, { done: 0, skipped: 0, failed: 1 });
    assert.equal(calls, 1);
  }));

test("runMethod: refuses to resume onto a mismatched header", () =>
  withTmpDir(async (dir) => {
    const out = join(dir, "judgements.jsonl");
    writeFileSync(
      out,
      `${JSON.stringify({
        id: "abc",
        method: "rules",
        methodVersion: "rules-0",
        questionSetHash: QUESTION_SET_HASH,
        featuresVersion: FEATURES_VERSION,
        startedAt: "t",
        gitCommit: "g",
      })}\n`,
    );
    const method: Method = {
      id: "rules",
      version: "rules-1",
      async judge() {
        return {
          answers: DEGENERATE_ANSWERS,
          usage: { inputTokens: 0, outputTokens: 0, latencyMs: 0 },
        };
      },
    };
    await assert.rejects(() => runMethod(method, [question("2024-1")], { out }));
  }));
