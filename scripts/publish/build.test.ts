import assert from "node:assert/strict";
import { test } from "node:test";
import type { Run } from "../judgement/run.ts";
import type { Answers, Judgement } from "../judgement/vocabulary.ts";
import { probability } from "../judgement/vocabulary.ts";
import type { Question } from "../question/question.ts";
import type { BuildInput } from "./build.ts";
import { activeAndPaused, aggregate, questionOpenerGroup } from "./build.ts";

function question(overrides: Omit<Partial<Question>, "id"> & { id: string }): Question {
  return {
    year: 2024,
    number: 1,
    parliament: 54,
    source: {
      docId: "d",
      url: "https://example/q",
      rawFile: "r",
      retrievedAt: "2026-01-01T00:00:00Z",
    },
    status: "answered",
    statusIdRaw: 2,
    dateAsked: "2024-03-15",
    askedBy: "Someone MP",
    askedById: "m1",
    portfolio: "Minister of Finance",
    portfolioId: "p1",
    minister: "Minister Name",
    text: "What is the number?",
    reply: { kind: "text", text: "The number is 42.", corrected: false },
    attachment: null,
    duplicateGroup: overrides.id,
    features: {
      version: "f1",
      replyChars: 18,
      replyWords: 4,
      hasNumber: true,
      stockPhrases: [],
      questionParts: 1,
    },
    ...overrides,
    id: overrides.id as Question["id"],
  } as Question;
}

function choice<O extends string>(opts: readonly O[], picked: O, confidence: number) {
  const probabilities = Object.fromEntries(
    opts.map((o) => [
      o,
      probability(o === picked ? confidence : (1 - confidence) / (opts.length - 1)),
    ]),
  ) as Record<O, ReturnType<typeof probability>>;
  return {
    kind: "choice" as const,
    choice: picked,
    probabilities,
    confidence: probability(confidence),
  };
}

function answers(
  overrides: Partial<Answers> & {
    answeredConfidence?: number;
    answeredChoice?: Answers["answered"]["choice"];
  },
): Answers {
  return {
    answered: choice(
      ["answered", "partly_answered", "not_answered", "unclear"] as const,
      overrides.answeredChoice ?? "answered",
      overrides.answeredConfidence ?? 0.9,
    ),
    givesRequestedFigure: choice(["yes", "no", "no_figure_requested"] as const, "yes", 0.9),
    addressesAllParts: choice(
      ["all_parts", "some_parts", "no_parts", "single_part_question"] as const,
      "single_part_question",
      0.9,
    ),
    declinesWithReason: { kind: "noul", probability: probability(0.02) },
    evasionType: choice(
      ["related_topic", "restates_policy", "refers_elsewhere", "none"] as const,
      "none",
      0.9,
    ),
    ...overrides,
  };
}

function judged(id: string, a: Answers, at = "2026-01-01T00:00:00Z"): Judgement {
  return {
    kind: "judged",
    id: id as Question["id"],
    runId: "run1" as Judgement["runId"],
    at,
    answers: a,
    usage: { inputTokens: 100, outputTokens: 20, latencyMs: 200 },
  };
}

const RUN_HEADER: Run = {
  id: "run1" as Run["id"],
  method: "jev",
  methodVersion: "jev-1.13.0",
  questionSetHash: "hash1",
  featuresVersion: "f1",
  startedAt: "2026-01-01T00:00:00Z",
  gitCommit: "abc1234",
};

/**
 * 8 answered questions plus 2 excluded (awaiting/withdrawn) covering: unsure -> unclear collapse,
 * every noReadingReason, truncation at 1200 chars, distinctQuestions dedup by lowest number,
 * and a portfolio-slug collision ("Minister for ACC" vs "Minister of ACC" both slug to "acc").
 */
function fixture(): BuildInput {
  const longReply = `word${" more"} `.repeat(400); // > 1200 chars, forces replyTruncated
  const longReferred = "y".repeat(1300);

  const q1 = question({ id: "2024-1", number: 1, duplicateGroup: "dup-a", askedBy: "Alice MP" }); // answered, confident
  const q2 = question({
    id: "2024-2",
    number: 2,
    duplicateGroup: "dup-a", // same group as q1, higher number
    text: "What is the number? (duplicate)",
    askedBy: "Alice MP",
  });
  const q3 = question({
    id: "2024-3",
    number: 3,
    duplicateGroup: "2024-3",
    askedBy: "Bob MP",
    reply: {
      kind: "attachment-only",
      text: "See attached table.",
      corrected: false,
      attachment: { id: "att1", name: "table.pdf", size: 100 },
    },
  });
  const q4 = question({
    id: "2024-4",
    number: 4,
    duplicateGroup: "2024-4",
    askedBy: "Bob MP",
    dateAsked: "2024-03-16",
  }); // benchmark hold-out
  const q5 = question({
    id: "2024-5",
    number: 5,
    duplicateGroup: "2024-5",
    askedBy: "", // never judged; also exercises the "skip empty askedBy" rule for civics.askers
    dateAsked: "2024-03-16",
  });
  const q6 = question({
    id: "2024-6",
    number: 6,
    duplicateGroup: "2024-6",
    askedBy: "Alice MP",
    dateAsked: "2024-03-16",
    reply: {
      kind: "referral",
      text: "See reply 1 (2024).",
      corrected: false,
      referral: { chain: ["2024-1" as Question["id"]], resolvedText: longReferred },
    },
  });
  const q7 = question({
    id: "2024-7",
    number: 7,
    duplicateGroup: "2024-7",
    askedBy: "Carol MP",
    dateAsked: "2024-03-17",
    portfolio: "Minister for ACC",
    reply: { kind: "text", text: longReply, corrected: false },
  });
  const q8 = question({
    id: "2024-8",
    number: 8,
    duplicateGroup: "2024-8",
    askedBy: "Carol MP",
    dateAsked: "2024-03-17",
    portfolio: "Minister of ACC",
  });
  const qAwaiting = question({
    id: "2024-9",
    number: 9,
    duplicateGroup: "2024-9",
    status: "awaiting",
    statusIdRaw: 1,
    reply: { kind: "none" },
  });
  const qWithdrawn = question({
    id: "2024-10",
    number: 10,
    duplicateGroup: "2024-10",
    status: "other",
    statusIdRaw: 3,
    reply: { kind: "none" },
  });

  const judgements: Judgement[] = [
    judged("2024-1", answers({ answeredChoice: "answered", answeredConfidence: 0.9 })),
    judged("2024-2", answers({ answeredChoice: "answered", answeredConfidence: 0.4 })), // unsure -> unclear
    judged("2024-3", answers({})), // attachment-only: must still be excluded from published reading
    judged("2024-4", answers({})), // benchmark hold-out: must still be excluded from published reading
    // 2024-5: no judgement at all -> model_error
    judged("2024-6", answers({})),
    judged("2024-7", answers({})),
    judged("2024-8", answers({})),
  ];

  return {
    questions: [q1, q2, q3, q4, q5, q6, q7, q8, qAwaiting, qWithdrawn],
    judgements,
    benchmarkIds: ["2024-4"],
    runHeader: RUN_HEADER,
    generatedAt: "2026-01-01T00:00:00.000Z",
  };
}

test("aggregate: excludes awaiting and withdrawn from every output", () => {
  const result = aggregate(fixture());
  assert.equal(result.excludedCount, 2);
  const ids = result.questionBlocks.flatMap((b) => b.items.map((i) => i.number));
  assert.equal(ids.includes(9), false);
  assert.equal(ids.includes(10), false);
});

test("aggregate: unsure confidence collapses the published label to unclear", () => {
  const result = aggregate(fixture());
  const block = result.questionBlocks.find((b) => b.year === 2024 && b.block === 0);
  assert.ok(block !== undefined);
  const q1 = block.items.find((i) => i.number === 1);
  const q2 = block.items.find((i) => i.number === 2);
  assert.equal(q1?.reading?.answered.choice, "answered");
  assert.equal(q2?.reading?.answered.choice, "unclear");
  assert.equal(q2?.reading?.answered.unsure, true);
});

test("aggregate: every noReadingReason is produced correctly", () => {
  const result = aggregate(fixture());
  const items = result.questionBlocks.flatMap((b) => b.items);
  const byNumber = new Map(items.map((i) => [i.number, i]));
  assert.equal(byNumber.get(3)?.noReadingReason, "attachment_not_read");
  assert.equal(byNumber.get(3)?.reading, null);
  assert.equal(byNumber.get(4)?.noReadingReason, "held_for_human_check");
  assert.equal(byNumber.get(4)?.reading, null);
  assert.equal(byNumber.get(5)?.noReadingReason, "model_error");
  assert.equal(byNumber.get(5)?.reading, null);
  assert.equal(byNumber.get(1)?.noReadingReason, null);
});

test("aggregate: truncates reply and referredReply at 1200 chars on a word boundary", () => {
  const result = aggregate(fixture());
  const items = result.questionBlocks.flatMap((b) => b.items);
  const byNumber = new Map(items.map((i) => [i.number, i]));

  const q6 = byNumber.get(6);
  assert.equal(q6?.referredReplyTruncated, true);
  assert.ok((q6?.referredReply?.length ?? 0) <= 1201); // 1200 chars + the ellipsis
  assert.ok(q6?.referredReply?.endsWith("…"));

  const q7 = byNumber.get(7);
  assert.equal(q7?.replyTruncated, true);
  assert.ok(q7 !== undefined && !q7.reply.includes("  ")); // truncated cleanly, no dangling double-space
});

test("aggregate: distinctQuestions counts a duplicate group once, using the lowest-numbered label", () => {
  const result = aggregate(fixture());
  // Labels across the 8 published records: answered {1,6,7,8}, unclear {2}, noReading {3,4,5}.
  const all = result.portfolioIndex.totals.all;
  assert.equal(all.answered, 4);
  assert.equal(all.unclear, 1);
  assert.equal(all.noReading, 3);

  // dup-a = {2024-1 (answered), 2024-2 (unclear)}: the group counts once, under 2024-1's label
  // (the lowest-numbered member), so the group's "unclear" vote from 2024-2 must not show up.
  const distinct = result.portfolioIndex.totals.distinctQuestions;
  assert.equal(distinct.answered, 4); // dup-a (as "answered") + 2024-6, 2024-7, 2024-8
  assert.equal(distinct.unclear, 0);
  assert.equal(distinct.noReading, 3);
});

test("aggregate: colliding portfolio slugs get distinct hashed slugs, neither the bare base", () => {
  const result = aggregate(fixture());
  const items = result.questionBlocks.flatMap((b) => b.items);
  const byNumber = new Map(items.map((i) => [i.number, i]));
  const accForFor = byNumber.get(7)?.portfolioSlug;
  const accForOf = byNumber.get(8)?.portfolioSlug;
  assert.notEqual(accForFor, "acc");
  assert.notEqual(accForOf, "acc");
  assert.notEqual(accForFor, accForOf);
  assert.ok(accForFor?.startsWith("acc-"));
  assert.ok(accForOf?.startsWith("acc-"));
});

test("aggregate: deterministic — identical input produces byte-identical JSON, twice", () => {
  const input = fixture();
  const a = aggregate(input);
  const b = aggregate(input);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("aggregate: civics.askers counts every answered question, skips empty names, orders by questions desc then name", () => {
  const result = aggregate(fixture());
  const { askers } = result.findings.civics;
  assert.deepEqual(
    askers.map((a) => a.name),
    ["Alice MP", "Bob MP", "Carol MP"],
  );
  const alice = askers.find((a) => a.name === "Alice MP");
  assert.deepEqual(alice, {
    name: "Alice MP",
    questions: 3, // q1, q2, q6
    distinctQuestions: 2, // dup-a, 2024-6
    portfoliosAsked: 1, // all three sit in Finance
  });
  const carol = askers.find((a) => a.name === "Carol MP");
  assert.equal(carol?.portfoliosAsked, 2); // "Minister for ACC" and "Minister of ACC" collide to distinct slugs
  assert.equal(
    askers.some((a) => a.name === ""),
    false,
  );
});

test("aggregate: civics.portfolioVolumes reuses the portfolio index's slugs, ordered by questions desc then name", () => {
  const result = aggregate(fixture());
  const { portfolioVolumes } = result.findings.civics;
  const portfolioSlugs = result.portfolioIndex.portfolios.map((p) => p.slug).sort();
  assert.deepEqual(portfolioVolumes.map((p) => p.slug).sort(), portfolioSlugs);
  assert.equal(portfolioVolumes[0]?.name, "Minister of Finance");
  assert.equal(portfolioVolumes[0]?.questions, 6); // q1, q2, q3, q4, q5, q6
  assert.equal(portfolioVolumes[0]?.distinctQuestions, 5);
  assert.equal(portfolioVolumes[0]?.askers, 2); // Alice, Bob (q5's empty name does not count)
  assert.deepEqual(
    portfolioVolumes.slice(1).map((p) => p.name),
    ["Minister for ACC", "Minister of ACC"], // tied at 1 question each, ordered by name
  );
});

test("aggregate: civics.mostRepeatedQuestions ranks duplicate groups by answered-record count", () => {
  const result = aggregate(fixture());
  const { mostRepeatedQuestions } = result.findings.civics;
  assert.equal(mostRepeatedQuestions.length, 7); // 7 distinct duplicateGroups among the 8 answered questions
  assert.deepEqual(mostRepeatedQuestions[0], {
    question: "What is the number?",
    sentTo: 2, // dup-a: q1 and q2
    example: { year: 2024, number: 1 }, // lowest-numbered member
  });
});

test("aggregate: civics.busiestDays counts answered questions by dateAsked, ties broken by date", () => {
  const result = aggregate(fixture());
  assert.deepEqual(result.findings.civics.busiestDays, [
    { date: "2024-03-15", questions: 3 }, // q1, q2, q3
    { date: "2024-03-16", questions: 3 }, // q4, q5, q6
    { date: "2024-03-17", questions: 2 }, // q7, q8
  ]);
});

test("aggregate: byQuestionOpener classifies only readable records, others fall under model_error/held_for_human_check", () => {
  const result = aggregate(fixture());
  const total = result.findings.byQuestionOpener.reduce(
    (sum, row) =>
      sum +
      row.counts.answered +
      row.counts.partly_answered +
      row.counts.not_answered +
      row.counts.unclear +
      row.counts.noReading,
    0,
  );
  // Readable = has a published reading: q1, q2, q6, q7, q8 (q3/q4/q5 have no reading).
  assert.equal(total, 5);
});

test("questionOpenerGroup: classifies the opening words, first match wins", () => {
  const cases: readonly [string, string][] = [
    [
      "What advice did officials give the Minister about the policy?",
      "Asks for a list of documents or advice",
    ],
    [
      "Please provide a list of all Government vehicles purchased since 2020.",
      "Asks for a list of documents or advice",
    ],
    ["How many people are employed by the Ministry of Health?", "How many or how much"],
    ["What is the total number of complaints received in 2024?", "How many or how much"],
    ["When will the Minister release the report?", "When or on what date"],
    ["Does the Minister support this initiative?", "Yes or no (does, has, is, will, did)"],
    ["Why has the wait time increased?", "Why or how"],
    [
      "In light of recent events, will the Minister commit to a review?",
      "Other", // opener doesn't match any recognised pattern; see the `ponytail:` comment on the ceiling
    ],
  ];
  for (const [text, expected] of cases) {
    assert.equal(questionOpenerGroup(text), expected, text);
  }
});

test("activeAndPaused: gaps over a minute count as pauses, not reading time", () => {
  assert.deepEqual(activeAndPaused([0, 10_000, 20_000, 3_620_000, 3_630_000]), {
    activeSeconds: 30,
    pauses: 1,
    pausedSeconds: 3600,
  });
});
