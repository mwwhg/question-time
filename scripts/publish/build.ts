// Pure aggregation of questions + judgements + the benchmark hold-out into the published JSON,
// plus the deterministic shard writer. I/O (reading the sources, wiping and writing data/output/)
// lives here per the architecture's rule that build.ts owns it; `aggregate` itself touches no fs.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { QUESTION_SET_VERSION } from "../judgement/qs-v1.ts";
import type { Run } from "../judgement/run.ts";
import { readJudgements } from "../judgement/run.ts";
import type { AnsweredLabel, Answers, Judgement } from "../judgement/vocabulary.ts";
import {
  ALL_PARTS,
  GIVES_FIGURE,
  INSTEAD,
  publishedLabel,
  UNSURE_BELOW,
} from "../judgement/vocabulary.ts";
import { readJsonl } from "../lib/jsonl.ts";
import { STOCK_PHRASES } from "../question/features.ts";
import type { Memberships } from "../question/party.ts";
import { PARTY_FILE, parseMemberships, partyOn } from "../question/party.ts";
import type { Question } from "../question/question.ts";
import { readQuestions } from "../question/question.ts";
import type {
  Breakdown,
  BrowseRow,
  BrowseShard,
  ChoiceReading,
  Findings,
  Label,
  LabelCounts,
  NoReadingReason,
  PortfolioIndex,
  PortfolioSummary,
  QuestionBlock,
  QuestionDetail,
  Reading,
  ReplyShape,
  RunFacts,
} from "./contract.ts";
import { BLOCK_SIZE, browseShardPath, findingsPath, portfolioIndexPath } from "./contract.ts";

// False until the 300-pair benchmark is published; flip this once `docs/evaluation.md` Part 3 lands.
const CHECKED_AGAINST_PEOPLE = false;
const USD_PER_MILLION_INPUT_TOKENS = 0.042;
const QUESTIONS_PER_PAIR = 5;
const REPLY_TRUNCATE_CHARS = 1200;
const BROWSE_QUESTION_TRUNCATE_CHARS = 160;

// ponytail: nearest-rank percentile, matching the pattern already used in question.ts and
// benchmark/sample.ts. Fine for a summary/report figure; no need for interpolation here.
function percentile(sortedAscending: readonly number[], p: number): number {
  if (sortedAscending.length === 0) return 0;
  const rank = Math.ceil(p * sortedAscending.length) - 1;
  const index = Math.min(Math.max(rank, 0), sortedAscending.length - 1);
  return sortedAscending[index] ?? 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function truncateAtWord(text: string, maxChars: number): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  const boundary = lastSpace > 0 ? lastSpace : maxChars;
  return { text: `${cut.slice(0, boundary).trimEnd()}…`, truncated: true };
}

function mustGet<K, V>(map: ReadonlyMap<K, V>, key: K): V {
  const v = map.get(key);
  if (v === undefined) throw new Error("build.ts: missing map entry (internal invariant broken)");
  return v;
}

// ----- label counting -------------------------------------------------------------------------

type MutableLabelCounts = {
  answered: number;
  partly_answered: number;
  not_answered: number;
  unclear: number;
  noReading: number;
};

function emptyLabelCounts(): MutableLabelCounts {
  return { answered: 0, partly_answered: 0, not_answered: 0, unclear: 0, noReading: 0 };
}

function bumpLabel(counts: MutableLabelCounts, label: Label | null): void {
  if (label === null) counts.noReading++;
  else counts[label]++;
}

function allLabelCounts(labels: readonly (Label | null)[]): LabelCounts {
  const counts = emptyLabelCounts();
  for (const label of labels) bumpLabel(counts, label);
  return counts;
}

/** Groups by duplicateGroup, counts each group once under the label of its lowest-numbered member. */
function distinctLabelCounts(
  items: readonly {
    readonly duplicateGroup: string;
    readonly number: number;
    readonly label: Label | null;
  }[],
): LabelCounts {
  const lowestByGroup = new Map<string, { number: number; label: Label | null }>();
  for (const item of items) {
    const current = lowestByGroup.get(item.duplicateGroup);
    if (current === undefined || item.number < current.number) {
      lowestByGroup.set(item.duplicateGroup, { number: item.number, label: item.label });
    }
  }
  const counts = emptyLabelCounts();
  for (const v of lowestByGroup.values()) bumpLabel(counts, v.label);
  return counts;
}

// ----- portfolio slugs -------------------------------------------------------------------------

const PORTFOLIO_PREFIX = /^(minister\s+(?:of|for|responsible\s+for)\s+)/i;

function slugBase(name: string): string {
  return name
    .replace(PORTFOLIO_PREFIX, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Empty portfolio name -> "unspecified" / "Portfolio not given". Two different names that slug
 * to the same base get a short hash appended to both, so neither silently shadows the other. */
function slugsFor(names: readonly string[]): Map<string, { slug: string; name: string }> {
  const distinctNames = Array.from(new Set(names)).sort();
  const byBase = new Map<string, string[]>();
  const result = new Map<string, { slug: string; name: string }>();

  for (const name of distinctNames) {
    if (name.trim() === "") {
      result.set(name, { slug: "unspecified", name: "Portfolio not given" });
      continue;
    }
    const base = slugBase(name);
    const group = byBase.get(base);
    if (group === undefined) byBase.set(base, [name]);
    else group.push(name);
  }

  for (const [base, group] of byBase) {
    if (group.length === 1) {
      const only = group[0];
      if (only !== undefined) result.set(only, { slug: base, name: only });
      continue;
    }
    for (const name of group) {
      const hash = createHash("sha256").update(name).digest("hex").slice(0, 6);
      result.set(name, { slug: `${base}-${hash}`, name });
    }
  }
  return result;
}

// ----- reading formatting ----------------------------------------------------------------------

function roundRecord<O extends string>(
  rec: Readonly<Record<O, number>>,
): Readonly<Record<O, number>> {
  // Same Object.fromEntries-then-cast idiom rules.ts already uses for a generic Record<O, ...>.
  return Object.fromEntries(
    Object.entries(rec).map(([k, v]) => [k, round2(v as number)]),
  ) as Record<O, number>;
}

function toChoiceReading<O extends string>(c: {
  readonly choice: O;
  readonly probabilities: Readonly<Record<O, number>>;
  readonly confidence: number;
}): ChoiceReading {
  return {
    choice: c.choice,
    probabilities: roundRecord(c.probabilities),
    confidence: round2(c.confidence),
    unsure: c.confidence < UNSURE_BELOW,
  };
}

/** `label`/`rawAnsweredChoice` are carried alongside the widened `Reading` shape so downstream
 * aggregation can compare literal AnsweredLabel values without casting back out of `string`. */
function toReading(a: Answers): {
  reading: Reading;
  rawAnsweredChoice: AnsweredLabel;
  label: AnsweredLabel;
} {
  const label = publishedLabel(a.answered);
  const answeredReading: ChoiceReading = {
    choice: label,
    probabilities: roundRecord(a.answered.probabilities),
    confidence: round2(a.answered.confidence),
    unsure: a.answered.confidence < UNSURE_BELOW,
  };
  const reading: Reading = {
    answered: answeredReading,
    givesRequestedFigure: toChoiceReading(a.givesRequestedFigure),
    addressesAllParts: toChoiceReading(a.addressesAllParts),
    declinesWithReason: round2(a.declinesWithReason.probability),
    evasionType: toChoiceReading(a.evasionType),
  };
  return { reading, rawAnsweredChoice: a.answered.choice, label };
}

// ----- per-question detail ---------------------------------------------------------------------

type JudgedRecord = Extract<Judgement, { kind: "judged" }>;

function noReadingReasonFor(
  q: Question,
  judged: JudgedRecord | undefined,
  benchmarkIds: ReadonlySet<string>,
): NoReadingReason | null {
  if (q.reply.kind === "attachment-only") return "attachment_not_read";
  if (benchmarkIds.has(q.id) && !CHECKED_AGAINST_PEOPLE) return "held_for_human_check";
  if (judged === undefined) return "model_error";
  return null;
}

function replyFieldsOf(reply: Question["reply"]): {
  text: string;
  referredReply: string | null;
  referralChain: readonly string[];
  shape: ReplyShape;
} {
  switch (reply.kind) {
    case "text":
      return { text: reply.text, referredReply: null, referralChain: [], shape: "text" };
    case "referral":
      return {
        text: reply.text,
        referredReply: reply.referral.resolvedText,
        referralChain: reply.referral.chain,
        shape: "referral",
      };
    case "attachment-only":
      return { text: reply.text, referredReply: null, referralChain: [], shape: "attachment-only" };
    case "none":
      // Unreachable: only "answered" questions reach here, and those never have a "none" reply
      // (see question.ts's buildReply — "none" is only produced for awaiting/withdrawn statuses).
      throw new Error("answered question with no reply");
    default:
      reply satisfies never;
      throw new Error("unreachable");
  }
}

type Rec = {
  readonly question: Question;
  readonly detail: QuestionDetail;
  readonly rawAnsweredChoice: AnsweredLabel | null;
  readonly label: Label | null;
};

function buildDetail(
  q: Question,
  judged: JudgedRecord | undefined,
  reason: NoReadingReason | null,
  sentTo: number,
  runHeader: Run,
  slugFor: ReadonlyMap<string, { slug: string; name: string }>,
  memberships: Memberships,
): { detail: QuestionDetail; rawAnsweredChoice: AnsweredLabel | null; label: Label | null } {
  const fields = replyFieldsOf(q.reply);
  const replyTrunc = truncateAtWord(fields.text, REPLY_TRUNCATE_CHARS);
  const referredTrunc =
    fields.referredReply === null
      ? null
      : truncateAtWord(fields.referredReply, REPLY_TRUNCATE_CHARS);
  const portfolioInfo = slugFor.get(q.portfolio) ?? {
    slug: "unspecified",
    name: "Portfolio not given",
  };
  const readingInfo = reason === null && judged !== undefined ? toReading(judged.answers) : null;

  const detail: QuestionDetail = {
    year: q.year,
    number: q.number,
    dateAsked: q.dateAsked,
    askedBy: q.askedBy,
    askedByParty: partyOn({ memberships, name: q.askedBy, date: q.dateAsked }),
    portfolio: portfolioInfo.name,
    portfolioSlug: portfolioInfo.slug,
    minister: q.minister,
    ministerParty: partyOn({ memberships, name: q.minister, date: q.dateAsked }),
    question: q.text,
    reply: replyTrunc.text,
    replyTruncated: replyTrunc.truncated,
    replyShape: fields.shape,
    referredReply: referredTrunc === null ? null : referredTrunc.text,
    referredReplyTruncated: referredTrunc?.truncated ?? false,
    referralChain: fields.referralChain,
    attachmentName: q.attachment?.name ?? null,
    sameQuestionSentTo: sentTo,
    features: {
      replyWords: q.features.replyWords,
      hasNumber: q.features.hasNumber,
      questionParts: q.features.questionParts,
      stockPhrases: q.features.stockPhrases,
    },
    reading: readingInfo?.reading ?? null,
    noReadingReason: reason,
    provenance: {
      sourceUrl: q.source.url,
      retrievedAt: q.source.retrievedAt,
      featuresVersion: q.features.version,
      model: runHeader.methodVersion,
      questionSetVersion: QUESTION_SET_VERSION,
      questionSetHash: runHeader.questionSetHash,
      evaluatedAt: judged?.at ?? null,
    },
  };

  return {
    detail,
    rawAnsweredChoice: readingInfo?.rawAnsweredChoice ?? null,
    label: readingInfo?.label ?? null,
  };
}

// ----- top-level aggregation ---------------------------------------------------------------------

export type BuildInput = {
  readonly questions: readonly Question[]; // every status
  readonly judgements: readonly Judgement[]; // last record per id
  readonly benchmarkIds: readonly string[]; // the held-out ids
  readonly memberships: Memberships;
  readonly runHeader: Run;
  readonly generatedAt: string;
};

export type BuildResult = {
  readonly portfolioIndex: PortfolioIndex;
  readonly findings: Findings;
  readonly browseShards: readonly BrowseShard[];
  readonly questionBlocks: readonly QuestionBlock[];
  readonly excludedCount: number;
  readonly noReadingCounts: Readonly<Record<NoReadingReason, number>>;
};

export function aggregate(input: BuildInput): BuildResult {
  const { questions, judgements, benchmarkIds, memberships, runHeader, generatedAt } = input;
  const answered = questions.filter((q) => q.status === "answered");
  const excludedCount = questions.length - answered.length;

  const judgedById = new Map<string, JudgedRecord>(
    judgements.filter((j): j is JudgedRecord => j.kind === "judged").map((j) => [j.id, j]),
  );
  const benchmarkIdSet = new Set(benchmarkIds);
  const dupCount = new Map<string, number>();
  for (const q of answered)
    dupCount.set(q.duplicateGroup, (dupCount.get(q.duplicateGroup) ?? 0) + 1);

  const sorted = answered.slice().sort((a, b) => a.year - b.year || a.number - b.number);
  const slugFor = slugsFor(sorted.map((q) => q.portfolio));

  const records: Rec[] = sorted.map((q) => {
    const judged = judgedById.get(q.id);
    const reason = noReadingReasonFor(q, judged, benchmarkIdSet);
    const sentTo = dupCount.get(q.duplicateGroup) ?? 1;
    const built = buildDetail(q, judged, reason, sentTo, runHeader, slugFor, memberships);
    return {
      question: q,
      detail: built.detail,
      rawAnsweredChoice: built.rawAnsweredChoice,
      label: built.label,
    };
  });

  const noReadingCounts: Record<NoReadingReason, number> = {
    attachment_not_read: 0,
    held_for_human_check: 0,
    model_error: 0,
  };
  for (const r of records) {
    if (r.detail.noReadingReason !== null) noReadingCounts[r.detail.noReadingReason]++;
  }

  return {
    portfolioIndex: buildPortfolioIndex(records, runHeader, judgements, generatedAt),
    findings: buildFindings(questions, records, dupCount, generatedAt),
    browseShards: buildBrowseShards(records),
    questionBlocks: buildQuestionBlocks(records),
    excludedCount,
    noReadingCounts,
  };
}

// ----- question blocks / browse shards -----------------------------------------------------------

function buildQuestionBlocks(records: readonly Rec[]): QuestionBlock[] {
  const byKey = new Map<string, { year: number; block: number; items: QuestionDetail[] }>();
  for (const r of records) {
    const block = Math.floor(r.detail.number / BLOCK_SIZE);
    const key = `${r.detail.year}|${block}`;
    const bucket = byKey.get(key);
    if (bucket === undefined) byKey.set(key, { year: r.detail.year, block, items: [r.detail] });
    else bucket.items.push(r.detail);
  }
  return Array.from(byKey.values()).sort((a, b) => a.year - b.year || a.block - b.block);
}

function buildBrowseShards(records: readonly Rec[]): BrowseShard[] {
  const byKey = new Map<
    string,
    { portfolio: string; slug: string; year: number; rows: BrowseRow[] }
  >();
  for (const r of records) {
    const key = `${r.detail.portfolioSlug}|${r.detail.year}`;
    const row: BrowseRow = {
      year: r.detail.year,
      number: r.detail.number,
      dateAsked: r.detail.dateAsked,
      question: r.detail.question.slice(0, BROWSE_QUESTION_TRUNCATE_CHARS),
      replyShape: r.detail.replyShape,
      label: r.label,
      confidence: r.detail.reading?.answered.confidence ?? null,
    };
    const bucket = byKey.get(key);
    if (bucket === undefined) {
      byKey.set(key, {
        portfolio: r.detail.portfolio,
        slug: r.detail.portfolioSlug,
        year: r.detail.year,
        rows: [row],
      });
    } else {
      bucket.rows.push(row);
    }
  }
  return Array.from(byKey.values()).sort((a, b) => a.slug.localeCompare(b.slug) || a.year - b.year);
}

// ----- portfolio index -----------------------------------------------------------------------

const PAUSE_THRESHOLD_MS = 60_000;

/** Splits elapsed time into working time and pauses. A run that was stopped and resumed has a long gap that is not reading time. */
export function activeAndPaused(sortedMs: readonly number[]): {
  activeSeconds: number;
  pauses: number;
  pausedSeconds: number;
} {
  let active = 0;
  let paused = 0;
  let pauses = 0;
  for (let i = 1; i < sortedMs.length; i++) {
    const gap = (sortedMs[i] ?? 0) - (sortedMs[i - 1] ?? 0);
    if (gap > PAUSE_THRESHOLD_MS) {
      paused += gap;
      pauses++;
    } else {
      active += gap;
    }
  }
  return {
    activeSeconds: Math.round(active / 1000),
    pauses,
    pausedSeconds: Math.round(paused / 1000),
  };
}

function buildRunFacts(runHeader: Run, judgements: readonly Judgement[]): RunFacts {
  const judged = judgements.filter((j): j is JudgedRecord => j.kind === "judged");
  const failed = judgements.filter((j) => j.kind === "failed");
  const inputTokens = judged.reduce((s, j) => s + j.usage.inputTokens, 0);
  const outputTokens = judged.reduce((s, j) => s + j.usage.outputTokens, 0);
  const latencies = judged.map((j) => j.usage.latencyMs).sort((a, b) => a - b);
  const timestamps = judged.map((j) => j.at).sort();
  const timing = activeAndPaused(timestamps.map((t) => Date.parse(t)));

  return {
    model: runHeader.methodVersion,
    questionSetVersion: QUESTION_SET_VERSION,
    questionSetHash: runHeader.questionSetHash,
    featuresVersion: runHeader.featuresVersion,
    pairsJudged: judged.length,
    pairsFailed: failed.length,
    questionsPerPair: QUESTIONS_PER_PAIR,
    inputTokens,
    outputTokens,
    usdPerMillionInputTokens: USD_PER_MILLION_INPUT_TOKENS,
    estimatedCostUsd: round2((inputTokens / 1e6) * USD_PER_MILLION_INPUT_TOKENS),
    latencyMsP50: percentile(latencies, 0.5),
    latencyMsP95: percentile(latencies, 0.95),
    activeSeconds: timing.activeSeconds,
    pauses: timing.pauses,
    pausedSeconds: timing.pausedSeconds,
    firstJudgementAt: timestamps[0] ?? "",
    lastJudgementAt: timestamps[timestamps.length - 1] ?? "",
  };
}

function buildPortfolioSummary(
  slug: string,
  name: string,
  items: readonly Rec[],
): PortfolioSummary {
  const byYear = new Map<number, Rec[]>();
  for (const r of items) {
    const list = byYear.get(r.detail.year);
    if (list === undefined) byYear.set(r.detail.year, [r]);
    else list.push(r);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => a - b);
  const byYearEntries = years.map(
    (year): [string, { all: LabelCounts; distinctQuestions: LabelCounts }] => {
      const yearItems = byYear.get(year) ?? [];
      return [
        String(year),
        {
          all: allLabelCounts(yearItems.map((r) => r.label)),
          distinctQuestions: distinctLabelCounts(
            yearItems.map((r) => ({
              duplicateGroup: r.question.duplicateGroup,
              number: r.detail.number,
              label: r.label,
            })),
          ),
        },
      ];
    },
  );
  return { slug, name, byYear: Object.fromEntries(byYearEntries) };
}

function buildPortfolioIndex(
  records: readonly Rec[],
  runHeader: Run,
  judgements: readonly Judgement[],
  generatedAt: string,
): PortfolioIndex {
  const years = Array.from(new Set(records.map((r) => r.detail.year))).sort((a, b) => a - b);
  const bySlug = new Map<string, { name: string; items: Rec[] }>();
  for (const r of records) {
    const bucket = bySlug.get(r.detail.portfolioSlug);
    if (bucket === undefined)
      bySlug.set(r.detail.portfolioSlug, { name: r.detail.portfolio, items: [r] });
    else bucket.items.push(r);
  }
  const portfolios = Array.from(bySlug.entries())
    .map(([slug, { name, items }]) => buildPortfolioSummary(slug, name, items))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  return {
    generatedAt,
    checkedAgainstPeople: CHECKED_AGAINST_PEOPLE,
    years,
    totals: {
      all: allLabelCounts(records.map((r) => r.label)),
      distinctQuestions: distinctLabelCounts(
        records.map((r) => ({
          duplicateGroup: r.question.duplicateGroup,
          number: r.detail.number,
          label: r.label,
        })),
      ),
    },
    run: buildRunFacts(runHeader, judgements),
    portfolios,
  };
}

// ----- findings ------------------------------------------------------------------------------

const REPLY_LENGTH_BUCKETS: readonly { readonly label: string; readonly max: number }[] = [
  { label: "under 10 words", max: 9 },
  { label: "10 to 29", max: 29 },
  { label: "30 to 99", max: 99 },
  { label: "100 or more", max: Number.POSITIVE_INFINITY },
];

function replyLengthGroup(words: number): string {
  for (const b of REPLY_LENGTH_BUCKETS) if (words <= b.max) return b.label;
  return "100 or more";
}

function questionPartsGroup(parts: number): string {
  if (parts <= 1) return "1";
  if (parts === 2) return "2";
  return "3 or more";
}

function fanOutGroup(sentTo: number): string {
  if (sentTo <= 1) return "sent to 1 minister";
  if (sentTo <= 9) return "2 to 9";
  return "10 or more";
}

function monthOf(dateAsked: string): string {
  return dateAsked.slice(0, 7);
}

// Every month from January 2024 to the last month asked, so a month with no readings still shows.
function monthsThrough(lastMonth: string): string[] {
  const months: string[] = [];
  for (let year = 2024; ; year++) {
    for (let m = 1; m <= 12; m++) {
      const month = `${year}-${String(m).padStart(2, "0")}`;
      if (month > lastMonth) return months;
      months.push(month);
    }
  }
}

function breakdownOver(
  groups: readonly string[],
  items: readonly { readonly group: string; readonly label: Label | null }[],
): Breakdown[] {
  const counts = new Map(groups.map((g) => [g, emptyLabelCounts()] as const));
  for (const item of items) {
    const c = counts.get(item.group);
    if (c !== undefined) bumpLabel(c, item.label);
  }
  return groups.map((g) => ({ group: g, counts: mustGet(counts, g) }));
}

function replyShapeBreakdown(records: readonly Rec[]): Breakdown[] {
  const shapes: readonly ReplyShape[] = ["text", "referral", "attachment-only"];
  const counts = new Map(shapes.map((s) => [s, emptyLabelCounts()] as const));
  for (const r of records) {
    const hasReading = r.detail.reading !== null;
    if (!hasReading && r.detail.replyShape !== "attachment-only") continue; // excluded per spec
    bumpLabel(mustGet(counts, r.detail.replyShape), r.label);
  }
  return shapes.map((s) => ({ group: s, counts: mustGet(counts, s) }));
}

function byStockPhraseBreakdown(readable: readonly Rec[]): Breakdown[] {
  const NONE = "none of these phrases";
  const groups = [...STOCK_PHRASES, NONE];
  const counts = new Map(groups.map((g) => [g, emptyLabelCounts()] as const));
  for (const r of readable) {
    const phrases = r.detail.features.stockPhrases;
    if (phrases.length === 0) bumpLabel(mustGet(counts, NONE), r.label);
    else for (const phrase of phrases) bumpLabel(mustGet(counts, phrase), r.label);
  }
  return groups.map((g) => ({ group: g, counts: mustGet(counts, g) }));
}

const HISTOGRAM_BINS: readonly { readonly from: number; readonly to: number }[] = Array.from(
  { length: 10 },
  (_, i) => ({ from: i / 10, to: (i + 1) / 10 }),
);

function binIndex(value: number): number {
  return Math.min(Math.max(Math.floor(value * 10), 0), 9);
}

function emptyByChoice(): Record<Label, number> {
  return { answered: 0, partly_answered: 0, not_answered: 0, unclear: 0 };
}

function confidenceHistogram(readable: readonly Rec[]): Findings["confidenceHistogram"] {
  const bins = HISTOGRAM_BINS.map((b) => ({ from: b.from, to: b.to, byChoice: emptyByChoice() }));
  for (const r of readable) {
    const confidence = r.detail.reading?.answered.confidence;
    if (confidence === undefined || r.rawAnsweredChoice === null) continue;
    const bin = bins[binIndex(confidence)];
    if (bin !== undefined) bin.byChoice[r.rawAnsweredChoice]++;
  }
  return bins;
}

function secondaryCounts(
  options: readonly string[],
  readable: readonly Rec[],
  pick: (r: Rec) => string | undefined,
): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(options.map((o) => [o, 0]));
  for (const r of readable) {
    const choice = pick(r);
    if (choice !== undefined && choice in counts) counts[choice] = (counts[choice] ?? 0) + 1;
  }
  return counts;
}

function declinesHistogram(readable: readonly Rec[]): readonly number[] {
  const bins = HISTOGRAM_BINS.map(() => 0);
  for (const r of readable) {
    const p = r.detail.reading?.declinesWithReason;
    if (p === undefined) continue;
    const idx = binIndex(p);
    bins[idx] = (bins[idx] ?? 0) + 1;
  }
  return bins;
}

function crossChecks(readable: readonly Rec[]): Findings["crossChecks"] {
  const declines = (r: Rec) => (r.detail.reading?.declinesWithReason ?? 0) >= 0.5;
  const notAnswered = readable.filter((r) => r.label === "not_answered");
  const answeredLabel = readable.filter((r) => r.label === "answered");
  const asksFigure = readable.filter(
    (r) => r.detail.reading?.givesRequestedFigure.choice !== "no_figure_requested",
  );
  const multiPart = readable.filter(
    (r) => r.detail.reading?.addressesAllParts.choice !== "single_part_question",
  );
  const referrals = readable.filter((r) => r.detail.replyShape === "referral");

  return [
    {
      statement:
        "Replies read as not answered that also read as declining with a reason (yes-probability 0.5 or more)",
      numerator: notAnswered.filter(declines).length,
      denominator: notAnswered.length,
    },
    {
      statement: "Replies read as answered that also read as declining with a reason",
      numerator: answeredLabel.filter(declines).length,
      denominator: answeredLabel.length,
    },
    {
      statement: "Questions asking for a figure where the reply read as giving it",
      numerator: asksFigure.filter((r) => r.detail.reading?.givesRequestedFigure.choice === "yes")
        .length,
      denominator: asksFigure.length,
    },
    {
      statement: "Multi-part questions where the reply read as addressing every part",
      numerator: multiPart.filter((r) => r.detail.reading?.addressesAllParts.choice === "all_parts")
        .length,
      denominator: multiPart.length,
    },
    {
      statement: "Referral replies read as answered once the earlier reply was read with them",
      numerator: referrals.filter((r) => r.label === "answered").length,
      denominator: referrals.length,
    },
  ];
}

// ----- civics: plain counts from the official record, no model involved --------------------------

function askersBreakdown(records: readonly Rec[]): Findings["civics"]["askers"] {
  const byName = new Map<
    string,
    { questions: number; groups: Set<string>; portfolios: Set<string>; parties: Set<string> }
  >();
  for (const r of records) {
    const name = r.detail.askedBy.trim();
    if (name === "") continue;
    let entry = byName.get(name);
    if (entry === undefined) {
      entry = { questions: 0, groups: new Set(), portfolios: new Set(), parties: new Set() };
      byName.set(name, entry);
    }
    // Records arrive in year and number order, so a Set keeps parties earliest first.
    if (r.detail.askedByParty !== null) entry.parties.add(r.detail.askedByParty);
    entry.questions++;
    entry.groups.add(r.question.duplicateGroup);
    entry.portfolios.add(r.detail.portfolioSlug);
  }
  return Array.from(byName.entries())
    .map(([name, e]) => ({
      name,
      parties: Array.from(e.parties),
      questions: e.questions,
      distinctQuestions: e.groups.size,
      portfoliosAsked: e.portfolios.size,
    }))
    .sort((a, b) => b.questions - a.questions || a.name.localeCompare(b.name));
}

function portfolioVolumesBreakdown(
  records: readonly Rec[],
): Findings["civics"]["portfolioVolumes"] {
  const bySlug = new Map<
    string,
    { name: string; questions: number; groups: Set<string>; askers: Set<string> }
  >();
  for (const r of records) {
    let entry = bySlug.get(r.detail.portfolioSlug);
    if (entry === undefined) {
      entry = { name: r.detail.portfolio, questions: 0, groups: new Set(), askers: new Set() };
      bySlug.set(r.detail.portfolioSlug, entry);
    }
    entry.questions++;
    entry.groups.add(r.question.duplicateGroup);
    const asker = r.detail.askedBy.trim();
    if (asker !== "") entry.askers.add(asker);
  }
  return Array.from(bySlug.entries())
    .map(([slug, e]) => ({
      slug,
      name: e.name,
      questions: e.questions,
      distinctQuestions: e.groups.size,
      askers: e.askers.size,
    }))
    .sort((a, b) => b.questions - a.questions || a.name.localeCompare(b.name));
}

function mostRepeatedQuestionsBreakdown(
  records: readonly Rec[],
  dupCount: ReadonlyMap<string, number>,
): Findings["civics"]["mostRepeatedQuestions"] {
  const byGroup = new Map<string, Rec[]>();
  for (const r of records) {
    const list = byGroup.get(r.question.duplicateGroup);
    if (list === undefined) byGroup.set(r.question.duplicateGroup, [r]);
    else list.push(r);
  }
  const entries = Array.from(byGroup.entries()).map(([group, items]) => {
    const lowest = items.reduce((a, b) => (b.detail.number < a.detail.number ? b : a));
    const truncated = truncateAtWord(lowest.detail.question, 240);
    return {
      question: truncated.text,
      sentTo: dupCount.get(group) ?? items.length,
      example: { year: lowest.detail.year, number: lowest.detail.number },
    };
  });
  return entries
    .sort((a, b) => b.sentTo - a.sentTo || a.question.localeCompare(b.question))
    .slice(0, 15);
}

function busiestDaysBreakdown(records: readonly Rec[]): Findings["civics"]["busiestDays"] {
  const byDate = new Map<string, number>();
  for (const r of records)
    byDate.set(r.detail.dateAsked, (byDate.get(r.detail.dateAsked) ?? 0) + 1);
  return Array.from(byDate.entries())
    .map(([date, questions]) => ({ date, questions }))
    .sort((a, b) => b.questions - a.questions || a.date.localeCompare(b.date))
    .slice(0, 10);
}

// ----- what kind of question gets what kind of reply ---------------------------------------------

const OPENER_LIST_DOCS =
  /^(what|which) (advice|reports?|briefings?|papers?|documents?|correspondence|communications?)/;
const OPENER_HOW_MANY = /^how (many|much)/;
const OPENER_WHAT_TOTAL = /^what (is|was|were|are) the (total|number|cost|amount)/;
const OPENER_WHEN = /^(when|on what dates?)/;
const OPENER_YES_NO = /^(does|do|did|has|have|had|is|are|was|were|will|would|can|could|should)\b/;
const OPENER_WHY_HOW = /^(why|how)\b/;
const OPENER_WHAT_WHICH = /^(what|which|who|where)\b/;

export const QUESTION_OPENER_GROUPS = [
  "Asks for a list of documents or advice",
  "How many or how much",
  "When or on what date",
  "Yes or no (does, has, is, will, did)",
  "Why or how",
  "What or which",
  "Other",
] as const;

// ponytail: an opening-words regex, not a parse of the question. A question that buries its real
// ask after throat-clearing ("Following on from the Minister's answer, does she...") is read fine
// here, but a compound opener the list above doesn't anticipate falls through to "Other" or a
// coarser bucket than a human reader would pick. Good enough for a findings breakdown; upgrade to
// an actual parse only if a reader needs the boundary to be exact.
export function questionOpenerGroup(text: string): string {
  const trimmed = text.trim().toLowerCase();
  const first12Words = trimmed.split(/\s+/).slice(0, 12).join(" ");
  if (OPENER_LIST_DOCS.test(trimmed) || /\blist\b/.test(first12Words)) {
    return "Asks for a list of documents or advice";
  }
  if (OPENER_HOW_MANY.test(trimmed) || OPENER_WHAT_TOTAL.test(trimmed))
    return "How many or how much";
  if (OPENER_WHEN.test(trimmed)) return "When or on what date";
  if (OPENER_YES_NO.test(trimmed)) return "Yes or no (does, has, is, will, did)";
  if (OPENER_WHY_HOW.test(trimmed)) return "Why or how";
  if (OPENER_WHAT_WHICH.test(trimmed)) return "What or which";
  return "Other";
}

function sameQuestionDifferentReading(
  readable: readonly Rec[],
  dupCount: ReadonlyMap<string, number>,
): Findings["sameQuestionDifferentReading"] {
  const byGroup = new Map<string, Rec[]>();
  for (const r of readable) {
    const list = byGroup.get(r.question.duplicateGroup);
    if (list === undefined) byGroup.set(r.question.duplicateGroup, [r]);
    else list.push(r);
  }

  const entries: {
    question: string;
    sentTo: number;
    counts: LabelCounts;
    example: { year: number; number: number };
  }[] = [];
  for (const [group, items] of byGroup) {
    const sentTo = dupCount.get(group) ?? items.length;
    if (sentTo < 5) continue;
    const labels = items.map((r) => r.label);
    if (new Set(labels).size <= 1) continue;
    const lowest = items.reduce((a, b) => (b.detail.number < a.detail.number ? b : a));
    entries.push({
      question: lowest.detail.question,
      sentTo,
      counts: allLabelCounts(labels),
      example: { year: lowest.detail.year, number: lowest.detail.number },
    });
  }
  return entries.sort((a, b) => b.sentTo - a.sentTo).slice(0, 25);
}

function buildFindings(
  questions: readonly Question[],
  records: readonly Rec[],
  dupCount: ReadonlyMap<string, number>,
  generatedAt: string,
): Findings {
  const readable = records.filter((r) => r.detail.reading !== null);
  const answeredReplyChars = questions
    .filter((q) => q.status === "answered")
    .map((q) => q.features.replyChars)
    .sort((a, b) => a - b);

  return {
    generatedAt,
    corpus: {
      records: questions.length,
      answered: questions.filter((q) => q.status === "answered").length,
      awaiting: questions.filter((q) => q.status === "awaiting").length,
      withdrawn: questions.filter((q) => q.status === "other").length,
      distinctQuestionTexts: new Set(questions.map((q) => q.duplicateGroup)).size,
      referralReplies: questions.filter((q) => q.reply.kind === "referral").length,
      referralsUnresolved: questions.filter(
        (q) => q.reply.kind === "referral" && q.reply.referral.resolvedText === null,
      ).length,
      attachmentOnlyReplies: questions.filter((q) => q.reply.kind === "attachment-only").length,
      correctedReplies: questions.filter((q) => q.reply.kind !== "none" && q.reply.corrected)
        .length,
      replyCharsMedian: percentile(answeredReplyChars, 0.5),
      replyCharsP95: percentile(answeredReplyChars, 0.95),
    },
    byReplyShape: replyShapeBreakdown(records),
    byReplyLength: breakdownOver(
      REPLY_LENGTH_BUCKETS.map((b) => b.label),
      readable.map((r) => ({
        group: replyLengthGroup(r.detail.features.replyWords),
        label: r.label,
      })),
    ),
    byQuestionParts: breakdownOver(
      ["1", "2", "3 or more"],
      readable.map((r) => ({
        group: questionPartsGroup(r.detail.features.questionParts),
        label: r.label,
      })),
    ),
    byMonth: breakdownOver(
      monthsThrough(
        readable
          .reduce((last, r) => (r.detail.dateAsked > last ? r.detail.dateAsked : last), "")
          .slice(0, 7),
      ),
      readable.map((r) => ({ group: monthOf(r.detail.dateAsked), label: r.label })),
    ),
    byFanOut: breakdownOver(
      ["sent to 1 minister", "2 to 9", "10 or more"],
      readable.map((r) => ({ group: fanOutGroup(r.detail.sameQuestionSentTo), label: r.label })),
    ),
    byStockPhrase: byStockPhraseBreakdown(readable),
    confidenceHistogram: confidenceHistogram(readable),
    secondary: {
      givesRequestedFigure: secondaryCounts(
        GIVES_FIGURE,
        readable,
        (r) => r.detail.reading?.givesRequestedFigure.choice,
      ),
      addressesAllParts: secondaryCounts(
        ALL_PARTS,
        readable,
        (r) => r.detail.reading?.addressesAllParts.choice,
      ),
      evasionType: secondaryCounts(
        INSTEAD,
        readable.filter((r) => r.label !== "answered"),
        (r) => r.detail.reading?.evasionType.choice,
      ),
      declinesWithReasonHistogram: declinesHistogram(readable),
    },
    crossChecks: crossChecks(readable),
    civics: {
      askers: askersBreakdown(records),
      portfolioVolumes: portfolioVolumesBreakdown(records),
      mostRepeatedQuestions: mostRepeatedQuestionsBreakdown(records, dupCount),
      busiestDays: busiestDaysBreakdown(records),
    },
    byQuestionOpener: breakdownOver(
      QUESTION_OPENER_GROUPS,
      readable.map((r) => ({ group: questionOpenerGroup(r.detail.question), label: r.label })),
    ),
    sameQuestionDifferentReading: sameQuestionDifferentReading(readable, dupCount),
  };
}

// ----- I/O: reading sources, writing shards -----------------------------------------------------

const QUESTIONS_STATUS_FILTER = undefined; // read every status; aggregate() does its own filtering
const JUDGEMENTS_PATH = "data/processed/judgements-jev.jsonl";
const BENCHMARK_SAMPLE_PATH = "data/labels/benchmark-sample.json";
const OUTPUT_DIR = "data/output";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 15000;

function readRunHeader(path: string): Run {
  const first = readJsonl(path)[Symbol.iterator]().next();
  if (first.done === true) throw new Error(`${path}: empty file, missing run header`);
  // Trusted: line 0 of this file is written only by runMethod (scripts/judgement/run.ts).
  return first.value as Run;
}

function readBenchmarkIds(path: string): readonly string[] {
  // Trusted: written only by scripts/sample.ts, in the same shape it writes.
  const parsed = JSON.parse(readFileSync(path, "utf8")) as { readonly ids: readonly string[] };
  return parsed.ids;
}

function diskPathFor(contractPath: string): string {
  return join(OUTPUT_DIR, contractPath.replace(/^\/data\//, ""));
}

function writeJsonFile(contractPath: string, value: unknown): { path: string; bytes: number } {
  const path = diskPathFor(contractPath);
  const json = JSON.stringify(value);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, json);
  const bytes = Buffer.byteLength(json, "utf8");
  if (bytes > MAX_FILE_BYTES) throw new Error(`${path}: ${bytes} bytes exceeds the 20 MB limit`);
  return { path, bytes };
}

export type WriteSummary = {
  readonly filesWritten: number;
  readonly totalBytes: number;
  readonly largestFile: { readonly path: string; readonly bytes: number };
};

/** Wipes and recreates ONLY data/output/, then writes every shard. Whole-file rewrites, not a
 * diff against the previous run, so a rebuild from identical inputs is byte-identical. */
export function writeOutput(result: BuildResult): WriteSummary {
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const written: { path: string; bytes: number }[] = [
    writeJsonFile(portfolioIndexPath, result.portfolioIndex),
    writeJsonFile(findingsPath, result.findings),
  ];
  for (const shard of result.browseShards)
    written.push(writeJsonFile(browseShardPath(shard.slug, shard.year), shard));
  for (const block of result.questionBlocks) {
    written.push(writeJsonFile(`/data/q/${block.year}/${block.block}.json`, block));
  }

  if (written.length > MAX_FILES)
    throw new Error(`${written.length} output files exceeds the ${MAX_FILES} limit`);

  const totalBytes = written.reduce((s, w) => s + w.bytes, 0);
  const largest = written.reduce((a, b) => (b.bytes > a.bytes ? b : a));
  return { filesWritten: written.length, totalBytes, largestFile: largest };
}

export type BuildSummary = WriteSummary & {
  readonly excludedCount: number;
  readonly noReadingCounts: Readonly<Record<NoReadingReason, number>>;
  readonly judgementsFileLooksComplete: boolean;
};

/** The one function scripts/build-output.ts calls: reads every source, aggregates, writes, reports. */
export function buildAndWrite(): BuildSummary {
  const questions = Array.from(readQuestions(QUESTIONS_STATUS_FILTER));
  const judgements = readJudgements(JUDGEMENTS_PATH);
  const benchmarkIds = readBenchmarkIds(BENCHMARK_SAMPLE_PATH);
  const memberships = parseMemberships(readFileSync(PARTY_FILE, "utf8"));
  const runHeader = readRunHeader(JUDGEMENTS_PATH);
  const generatedAt = new Date().toISOString();

  const result = aggregate({
    questions,
    judgements,
    benchmarkIds,
    memberships,
    runHeader,
    generatedAt,
  });
  const writeSummary = writeOutput(result);

  const eligible = questions.filter((q) => q.status === "answered").length;
  return {
    ...writeSummary,
    excludedCount: result.excludedCount,
    noReadingCounts: result.noReadingCounts,
    judgementsFileLooksComplete: judgements.length >= eligible,
  };
}
