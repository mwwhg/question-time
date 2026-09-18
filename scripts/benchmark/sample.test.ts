import assert from "node:assert/strict";
import { test } from "node:test";
import type { Question } from "../question/question.ts";
import { csvRow, drawBenchmark, drawGate3, eligiblePool, parseCsv } from "./sample.ts";

function makeQuestion(overrides: Omit<Partial<Question>, "id"> & { id: string }): Question {
  const replyText = "A reply of typical length for this fixture.";
  const id = overrides.id as Question["id"];
  return {
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
    text: "What is the number?",
    reply: { kind: "text", text: replyText, corrected: false },
    attachment: null,
    duplicateGroup: overrides.id,
    features: {
      version: "f1",
      replyChars: replyText.length,
      replyWords: 5,
      hasNumber: false,
      stockPhrases: [],
      questionParts: 1,
    },
    ...overrides,
    id,
  };
}

function pool(n: number, prefix: string, build: (i: number) => Partial<Question>): Question[] {
  return Array.from({ length: n }, (_, i) =>
    makeQuestion({ id: `${prefix}-${i}`, duplicateGroup: `${prefix}-${i}`, ...build(i) }),
  );
}

/** Enough shorts, longs, and multi-parts (with some referrals mixed in) for drawGate3 to fill every stratum. */
function bigPool(): Question[] {
  const short = pool(20, "2024-short", (i) => ({
    reply:
      i % 3 === 0
        ? {
            kind: "referral" as const,
            text: "See reply 1 (2024)",
            corrected: false,
            referral: { chain: [], resolvedText: "Resolved." },
          }
        : { kind: "text", text: "Short.", corrected: false },
    features: {
      version: "f1",
      replyChars: 10,
      replyWords: 2,
      hasNumber: false,
      stockPhrases: [],
      questionParts: 1,
    },
  }));
  const long = pool(20, "2024-long", (i) => ({
    reply: { kind: "text", text: "x".repeat(400 + i), corrected: false },
    features: {
      version: "f1",
      replyChars: 400 + i, // spread across the pool's 75th percentile so some clear it, some don't
      replyWords: 100,
      hasNumber: false,
      stockPhrases: [],
      questionParts: 1,
    },
  }));
  const multi = pool(20, "2024-multi", () => ({
    text: "What is (a) the first thing and (b) the second thing?",
    reply: { kind: "text", text: "Medium length reply text here.", corrected: false },
    features: {
      version: "f1",
      replyChars: 150,
      replyWords: 20,
      hasNumber: false,
      stockPhrases: [],
      questionParts: 2,
    },
  }));
  return [...short, ...long, ...multi];
}

test("eligiblePool: dedupes by duplicateGroup, keeping the first", () => {
  const q1 = makeQuestion({ id: "2024-1", duplicateGroup: "g1" });
  const q2 = makeQuestion({ id: "2024-2", duplicateGroup: "g1" });
  const q3 = makeQuestion({ id: "2024-3", duplicateGroup: "g2" });
  const result = eligiblePool([q1, q2, q3]);
  assert.deepEqual(
    result.map((q) => q.id),
    ["2024-1", "2024-3"],
  );
});

test("eligiblePool: excludes unanswered and unresolved referrals", () => {
  const unanswered = makeQuestion({ id: "2024-1", status: "awaiting" });
  const unresolvedReferral = makeQuestion({
    id: "2024-2",
    reply: {
      kind: "referral",
      text: "See reply 9 (2024)",
      corrected: false,
      referral: { chain: [], resolvedText: null },
    },
  });
  assert.deepEqual(eligiblePool([unanswered, unresolvedReferral]), []);
});

test("drawGate3: deterministic for the same seed", () => {
  const p = bigPool();
  assert.deepEqual(drawGate3(p, 42), drawGate3(p, 42));
});

test("drawGate3: 10 per stratum, no id chosen twice, at least 5 referrals", () => {
  const p = bigPool();
  const sample = drawGate3(p, 42);
  assert.equal(sample.length, 30);
  const byStratum = { short: 0, long: 0, multi_part: 0 };
  const ids = new Set<string>();
  for (const s of sample) {
    byStratum[s.stratum]++;
    assert.equal(ids.has(s.id), false, `${s.id} chosen twice`);
    ids.add(s.id);
  }
  assert.deepEqual(byStratum, { short: 10, long: 10, multi_part: 10 });

  const byId = new Map<string, Question>(p.map((q) => [q.id, q]));
  const referralCount = sample.filter((s) => byId.get(s.id)?.reply.kind === "referral").length;
  assert.ok(referralCount >= 5, `expected >=5 referrals, got ${referralCount}`);
});

/** 60 questions per cell (2 years x 3 length terciles x referral/not) = 720, ample for drawBenchmark.
 * Returns the pool alongside each id's cell, so the test can check spread without reaching into
 * `sample.ts`'s private tercile-cutoff logic. */
function benchmarkPool(): { pool: Question[]; cellOf: Map<string, string> } {
  const charsByTercile = { short: 10, mid: 200, long: 900 };
  const pool: Question[] = [];
  const cellOf = new Map<string, string>();
  let i = 0;
  for (const year of [2024, 2025] as const) {
    for (const tercile of ["short", "mid", "long"] as const) {
      for (const referral of [true, false]) {
        for (let n = 0; n < 60; n++) {
          i++;
          const id = `${year}-${i}`;
          pool.push(
            makeQuestion({
              id,
              duplicateGroup: id,
              year,
              reply: referral
                ? {
                    kind: "referral",
                    text: "See reply 1 (2024)",
                    corrected: false,
                    referral: { chain: [], resolvedText: "Resolved." },
                  }
                : { kind: "text", text: "x".repeat(charsByTercile[tercile]), corrected: false },
              features: {
                version: "f1",
                replyChars: charsByTercile[tercile],
                replyWords: 5,
                hasNumber: false,
                stockPhrases: [],
                questionParts: 1,
              },
            }),
          );
          cellOf.set(id, `${year}|${tercile}|${referral ? "referral" : "not"}`);
        }
      }
    }
  }
  return { pool, cellOf };
}

/** 30 ids spread across the 12 cells (not clumped in one), so every cell still has plenty of
 * candidates left over for the round-robin remainder to be checked for evenness. */
function spreadMustInclude(
  pool: readonly Question[],
  cellOf: ReadonlyMap<string, string>,
): string[] {
  const byCell = new Map<string, string[]>();
  for (const q of pool) {
    const cell = cellOf.get(q.id);
    if (cell === undefined) continue;
    const ids = byCell.get(cell);
    if (ids === undefined) byCell.set(cell, [q.id]);
    else ids.push(q.id);
  }
  return Array.from(byCell.values())
    .flatMap((ids) => ids.slice(0, 3))
    .slice(0, 30);
}

test("drawBenchmark: 300 ids, includes mustInclude, no duplicates, deterministic", () => {
  const { pool, cellOf } = benchmarkPool();
  const mustInclude = spreadMustInclude(pool, cellOf);
  const result = drawBenchmark(pool, 42, mustInclude);
  const again = drawBenchmark(pool, 42, mustInclude);

  assert.equal(result.length, 300);
  assert.deepEqual(result, again);
  for (const id of mustInclude) assert.ok(result.includes(id), `missing ${id}`);
  assert.equal(new Set(result).size, 300);
});

test("drawBenchmark: spreads the remainder evenly across the 12 cells when the pool is ample", () => {
  const { pool, cellOf } = benchmarkPool();
  const mustInclude = spreadMustInclude(pool, cellOf);
  const mustIncludeSet = new Set(mustInclude);
  const result = drawBenchmark(pool, 42, mustInclude);

  const counts = new Map<string, number>();
  for (const id of result) {
    if (mustIncludeSet.has(id)) continue; // only the round-robin remainder is meant to be even
    const cell = cellOf.get(id);
    if (cell === undefined) throw new Error(`unknown id ${id}`);
    counts.set(cell, (counts.get(cell) ?? 0) + 1);
  }
  const values = Array.from(counts.values());
  const min = Math.min(...values);
  const max = Math.max(...values);
  assert.ok(max - min <= 3, `cell counts spread too wide: ${JSON.stringify([...counts])}`);
});

test("csvRow/parseCsv: quotes commas, quotes and embedded newlines, and round-trips", () => {
  const row = csvRow(["plain", 'has "quotes"', "has,comma", "has\nnewline"]);
  assert.equal(row, 'plain,"has ""quotes""","has,comma","has\nnewline"');
  const [parsed] = parseCsv(`${row}\n`);
  assert.deepEqual(parsed, ["plain", 'has "quotes"', "has,comma", "has\nnewline"]);
});
