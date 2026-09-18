// Pure sampling for the Gate 3 human-labelling set and its synthetic controls. No I/O here;
// `scripts/sample.ts` reads the questions and writes the files.

import type { MethodInput } from "../judgement/method.ts";
import { computeFeatures } from "../question/features.ts";
import type { Question } from "../question/question.ts";

export type Stratum = "short" | "long" | "multi_part";

export type GateSample = { readonly id: string; readonly stratum: Stratum };

export type ControlKind = "swapped" | "echo";

export type Control = {
  readonly id: string;
  readonly kind: ControlKind;
  readonly input: MethodInput;
  readonly sourceIds: readonly string[];
};

/** mulberry32: tiny, deterministic, good enough for sampling (not cryptographic). */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = copy[i] as T;
    const b = copy[j] as T;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

// ponytail: nearest-rank percentile, matching `question.ts`'s summary helper. Fine for choosing
// a stratum cutoff; no need for interpolation here.
function percentile(sortedAscending: readonly number[], p: number): number {
  if (sortedAscending.length === 0) return 0;
  const rank = Math.ceil(p * sortedAscending.length) - 1;
  const index = Math.min(Math.max(rank, 0), sortedAscending.length - 1);
  return sortedAscending[index] ?? 0;
}

function replyTextOf(q: Question): string {
  switch (q.reply.kind) {
    case "text":
    case "referral":
    case "attachment-only":
      return q.reply.text;
    case "none":
      return "";
    default:
      q.reply satisfies never;
      return "";
  }
}

/** Answered, with a real (possibly referral-resolved) reply text, one per duplicate group. */
export function eligiblePool(questions: readonly Question[]): Question[] {
  const seenGroups = new Set<string>();
  const pool: Question[] = [];
  for (const q of questions) {
    if (q.status !== "answered") continue;
    const isEligibleReply =
      q.reply.kind === "text" ||
      (q.reply.kind === "referral" && q.reply.referral.resolvedText !== null);
    if (!isEligibleReply) continue;
    if (seenGroups.has(q.duplicateGroup)) continue;
    seenGroups.add(q.duplicateGroup);
    pool.push(q);
  }
  return pool;
}

const STRATUM_SIZE = 10;
const SHORT_MAX_CHARS = 80;
const MIN_REFERRAL = 5;

/** 30 ids: 10 short, 10 long (> pool's 75th percentile reply length), 10 multi-part, no id in
 * two strata, at least `MIN_REFERRAL` referral-kind ids across the 30 (swapped in from leftovers). */
export function drawGate3(pool: readonly Question[], seed: number): GateSample[] {
  const order = shuffled(pool, mulberry32(seed));
  const p75 = percentile(
    pool.map((q) => q.features.replyChars).sort((a, b) => a - b),
    0.75,
  );

  const buckets: Record<Stratum, { chosen: Question[]; leftover: Question[] }> = {
    short: { chosen: [], leftover: [] },
    long: { chosen: [], leftover: [] },
    multi_part: { chosen: [], leftover: [] },
  };
  const chosenIds = new Set<string>();

  for (const q of order) {
    if (chosenIds.size >= STRATUM_SIZE * 3) break;
    const stratum: Stratum | undefined =
      q.features.replyChars < SHORT_MAX_CHARS
        ? "short"
        : q.features.replyChars > p75
          ? "long"
          : q.features.questionParts >= 2
            ? "multi_part"
            : undefined;
    if (stratum === undefined) continue;
    const bucket = buckets[stratum];
    if (bucket.chosen.length < STRATUM_SIZE) {
      bucket.chosen.push(q);
      chosenIds.add(q.id);
    } else {
      bucket.leftover.push(q);
    }
  }

  ensureReferralFloor(buckets);

  const result: GateSample[] = [];
  for (const stratum of ["short", "long", "multi_part"] as const) {
    for (const q of buckets[stratum].chosen) result.push({ id: q.id, stratum });
  }
  return result;
}

function ensureReferralFloor(
  buckets: Record<Stratum, { chosen: Question[]; leftover: Question[] }>,
): void {
  const isReferral = (q: Question) => q.reply.kind === "referral";
  let referralCount = (["short", "long", "multi_part"] as const)
    .flatMap((s) => buckets[s].chosen)
    .filter(isReferral).length;

  for (const stratum of ["short", "long", "multi_part"] as const) {
    if (referralCount >= MIN_REFERRAL) break;
    const bucket = buckets[stratum];
    const swapInIndex = bucket.leftover.findIndex(isReferral);
    const swapOutIndex = bucket.chosen.findIndex((q) => !isReferral(q));
    if (swapInIndex === -1 || swapOutIndex === -1) continue;
    while (referralCount < MIN_REFERRAL) {
      const nextIn = bucket.leftover.findIndex(isReferral);
      const nextOut = bucket.chosen.findIndex((q) => !isReferral(q));
      if (nextIn === -1 || nextOut === -1) break;
      const [incoming] = bucket.leftover.splice(nextIn, 1);
      if (incoming === undefined) break;
      bucket.chosen[nextOut] = incoming;
      referralCount++;
    }
  }
}

const YEARS = [2024, 2025] as const;
const REPLY_LENGTH_TERCILES = ["short", "mid", "long"] as const;
const REFERRAL_CELLS = ["referral", "not"] as const;
const BENCHMARK_SIZE = 300;

// A plain string, not a literal union: it only keys an internal Map, never leaves this module.
type Cell = string;

function tercileBoundsOf(pool: readonly Question[]): { low: number; high: number } {
  const sorted = pool.map((q) => q.features.replyChars).sort((a, b) => a - b);
  return { low: percentile(sorted, 1 / 3), high: percentile(sorted, 2 / 3) };
}

function cellOf(q: Question, bounds: { low: number; high: number }): Cell {
  const tercile =
    q.features.replyChars <= bounds.low
      ? "short"
      : q.features.replyChars <= bounds.high
        ? "mid"
        : "long";
  const referral = q.reply.kind === "referral" ? "referral" : "not";
  return `${q.year}|${tercile}|${referral}`;
}

/** 300 ids: every `mustInclude` id, plus more drawn from `pool` (minus those already included) so
 * the 270 remainder is spread as evenly as possible across the 12 year x reply-length-tercile x
 * referral-or-not cells. Round-robins across cells so one running dry just shifts the remainder
 * to the others instead of shrinking the total. Deterministic for a given seed. */
export function drawBenchmark(
  pool: readonly Question[],
  seed: number,
  mustInclude: readonly string[],
): string[] {
  const alreadyIn = new Set(mustInclude);
  const bounds = tercileBoundsOf(pool);
  const candidates = shuffled(
    pool.filter((q) => !alreadyIn.has(q.id)),
    mulberry32(seed),
  );

  const queues = new Map<Cell, Question[]>();
  for (const q of candidates) {
    const cell = cellOf(q, bounds);
    const queue = queues.get(cell);
    if (queue === undefined) queues.set(cell, [q]);
    else queue.push(q);
  }
  const cellOrder: Cell[] = YEARS.flatMap((year) =>
    REPLY_LENGTH_TERCILES.flatMap((tercile) =>
      REFERRAL_CELLS.map((referral) => `${year}|${tercile}|${referral}`),
    ),
  );

  const target = BENCHMARK_SIZE - mustInclude.length;
  const drawn: string[] = [];
  for (let ranOutOfEveryCell = false; drawn.length < target && !ranOutOfEveryCell; ) {
    ranOutOfEveryCell = true;
    for (const cell of cellOrder) {
      if (drawn.length >= target) break;
      const next = queues.get(cell)?.shift();
      if (next === undefined) continue;
      drawn.push(next.id);
      ranOutOfEveryCell = false;
    }
  }

  return [...mustInclude, ...drawn];
}

const SWAP_LENGTH_TOLERANCE = 0.3;
// A short generic reply ("None.", "No.", "As the Minister for X, none.") truly answers almost any
// "what ..., if any" question, so swapping it in does not make a not-answered pair. The first
// control draw showed this. Both sides of a swap must be long enough to carry specific content.
const SWAP_MIN_REPLY_CHARS = 80;

function isUsableDonor(q: Question): boolean {
  return q.reply.kind !== "referral" && replyTextOf(q).trim().length >= SWAP_MIN_REPLY_CHARS;
}

function inputFor(question: string, reply: string): MethodInput {
  const features = computeFeatures({ questionText: question, replyText: reply });
  return {
    question,
    reply,
    referredReply: null,
    features: {
      replyWords: features.replyWords,
      hasNumber: features.hasNumber,
      refersToEarlier: false,
      hasAttachment: false,
      questionParts: features.questionParts,
    },
  };
}

/** 10 `swapped` (reply swapped in from a different portfolio, similar length) plus 10 `echo`
 * (reply just parrots the question). Drawn from `pool` minus `excludeIds`, deterministically. */
export function drawControls(
  pool: readonly Question[],
  seed: number,
  excludeIds: ReadonlySet<string>,
): { swapped: Control[]; echo: Control[] } {
  const candidates = shuffled(
    pool.filter((q) => !excludeIds.has(q.id)),
    mulberry32(seed + 1),
  );
  const swapBases = candidates.filter(isUsableDonor).slice(0, 10);
  const swapBaseIds = new Set(swapBases.map((q) => q.id));
  const echoBases = candidates.filter((q) => !swapBaseIds.has(q.id)).slice(0, 10);
  const usedDonors = new Set<string>();

  const swapped: Control[] = swapBases.map((base, i) => {
    const baseChars = base.features.replyChars;
    const donor = pool.find(
      (q) =>
        q.id !== base.id &&
        !usedDonors.has(q.id) &&
        q.portfolio !== base.portfolio &&
        isUsableDonor(q) &&
        Math.abs(q.features.replyChars - baseChars) <= baseChars * SWAP_LENGTH_TOLERANCE,
    );
    if (donor === undefined) throw new Error(`no swap donor found for ${base.id}`);
    usedDonors.add(donor.id);
    return {
      id: `control-swapped-${String(i + 1).padStart(2, "0")}`,
      kind: "swapped" as const,
      input: inputFor(base.text, replyTextOf(donor)),
      sourceIds: [base.id, donor.id],
    };
  });

  const echo: Control[] = echoBases.map((base, i) => {
    const withoutQuestionMark = base.text.trim().replace(/\?\s*$/, "");
    return {
      id: `control-echo-${String(i + 1).padStart(2, "0")}`,
      kind: "echo" as const,
      input: inputFor(base.text, `The question asks: ${withoutQuestionMark}.`),
      sourceIds: [base.id],
    };
  });

  return { swapped, echo };
}

/** RFC 4180-ish: doubles embedded quotes, quotes any field with a comma, quote or newline. */
export function csvRow(fields: readonly string[]): string {
  return fields.map(csvField).join(",");
}

function csvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The inverse of `csvRow`/`csvField`, for `scripts/sample.ts`'s overwrite guard: it has to read
 * back a labeller's own edits, which may contain quoted commas or embedded newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
