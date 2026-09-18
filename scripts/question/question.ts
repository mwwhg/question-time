import { createHash } from "node:crypto";
import { readJsonl, writeJsonl } from "../lib/jsonl.ts";
import { computeFeatures, type Features } from "./features.ts";
import type { ReferralTarget } from "./referral.ts";
import { isReferralReply, parseReferralTargets, resolveReferral } from "./referral.ts";
import type { SourceRecord } from "./source.ts";

export type QuestionId = string & { readonly __brand: "QuestionId" };

/** The only place the id format ("2024-199") is constructed. */
export function questionId(year: number, number: number): QuestionId {
  return `${year}-${number}` as QuestionId;
}

export type Attachment = { readonly id: string; readonly name: string; readonly size: number };

/** `chain` lists every hop from this reply to the final text; `resolvedText` is null when a hop is missing, cyclic, or past the depth cap. */
export type Referral = {
  readonly chain: readonly QuestionId[];
  readonly resolvedText: string | null;
};

// One union instead of attachmentOnly / refersToEarlier / hasReply booleans that would have to stay in sync.
export type Reply =
  | { readonly kind: "text"; readonly text: string; readonly corrected: boolean }
  | {
      readonly kind: "referral";
      readonly text: string;
      readonly corrected: boolean;
      readonly referral: Referral;
    }
  | {
      readonly kind: "attachment-only";
      readonly text: string;
      readonly corrected: boolean;
      readonly attachment: Attachment;
    }
  | { readonly kind: "none" };

export type Question = {
  readonly id: QuestionId;
  readonly year: number;
  readonly number: number;
  readonly parliament: number;
  readonly source: {
    readonly docId: string;
    readonly url: string;
    readonly rawFile: string;
    readonly retrievedAt: string;
  };
  readonly status: "answered" | "awaiting" | "other";
  readonly statusIdRaw: number;
  readonly dateAsked: string;
  /** Names exactly as the source gives them. */
  readonly askedBy: string;
  readonly askedById: string;
  readonly portfolio: string;
  readonly portfolioId: string;
  readonly minister: string;
  readonly text: string;
  readonly reply: Reply;
  /** A text reply can still carry an attachment (figures in the text, breakdown in the PDF). */
  readonly attachment: Attachment | null;
  /** Hash of normalised question text; the same question sent to many ministers shares one group. */
  readonly duplicateGroup: string;
  readonly features: Features;
};

export const QUESTIONS_FILE = "data/processed/questions.jsonl";

// Verified 2026-09-19 in the browser: questions.parliament.nz is a client-side SPA whose router
// resolves to this exact path for a question, matching `writtenQuestionsDocumentId` byte for byte.
function sourceUrl(docId: string): string {
  return `https://questions.parliament.nz/written-questions/question/${docId}`;
}

/** \r\n -> \n, then collapse runs of horizontal whitespace, then trim. Nothing else. */
function normaliseWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

const CORRECTED_PREFIX = /^corrected reply:\s*/i;
const ATTACHMENT_ONLY_MAX_CHARS = 200;
const ATTACHMENT_MENTION = /attach|table|document/i;
const TITLE_PATTERN = /^\s*\d+\s*\(\d{4}\)\.\s*(.+)$/;
const TITLE_TO_MINISTER = /\s+to\s+the\s+/i;

/** "41077 (2026). Lan Pham to the Minister responsible for RMA Reform" -> "Lan Pham". Empty when the title has no asker (e.g. a withdrawn question). */
function parseAskedBy(title: string): string {
  const rest = TITLE_PATTERN.exec(title)?.[1];
  if (rest === undefined) return "";
  const split = rest.search(TITLE_TO_MINISTER);
  return split === -1 ? "" : rest.slice(0, split).trim();
}

function toAttachment(record: SourceRecord): Attachment | null {
  if (record.attachmentId === null) return null;
  return {
    id: record.attachmentId,
    name: record.attachmentName ?? "",
    size: record.attachmentSize ?? 0,
  };
}

function buildReply(record: SourceRecord, attachment: Attachment | null): Reply {
  // Status 1 (awaiting) and 3 (other: withdrawn) carry no real reply text.
  if (record.statusId !== 2) return { kind: "none" };

  const normalised = normaliseWhitespace(record.replyText);
  const corrected = CORRECTED_PREFIX.test(normalised);
  const text = corrected ? normalised.replace(CORRECTED_PREFIX, "") : normalised;

  if (
    attachment !== null &&
    text.length < ATTACHMENT_ONLY_MAX_CHARS &&
    ATTACHMENT_MENTION.test(text)
  ) {
    return { kind: "attachment-only", text, corrected, attachment };
  }
  if (isReferralReply(text)) {
    // Placeholder: `normaliseAll` resolves every referral in a second pass, once every
    // question's text is known, and replaces this with the real chain and resolved text.
    return { kind: "referral", text, corrected, referral: { chain: [], resolvedText: null } };
  }
  return { kind: "text", text, corrected };
}

function statusFrom(statusId: number): Question["status"] {
  switch (statusId) {
    case 1:
      return "awaiting";
    case 2:
      return "answered";
    default:
      return "other";
  }
}

/** sha256 of the lowercased, whitespace-collapsed question text, first 12 hex chars. */
function duplicateGroupOf(questionText: string): string {
  const collapsed = questionText.replace(/\s+/g, " ").trim().toLowerCase();
  return createHash("sha256").update(collapsed).digest("hex").slice(0, 12);
}

export type Provenance = { readonly rawFile: string; readonly retrievedAt: string };

/** Normalises one record. Pure; does not resolve referrals (see `normaliseAll`). */
export function normalise(record: SourceRecord, provenance: Provenance): Question {
  const attachment = toAttachment(record);
  const reply = buildReply(record, attachment);
  const questionText = normaliseWhitespace(record.questionText);
  const replyTextForFeatures = reply.kind === "none" ? "" : reply.text;

  return {
    id: questionId(record.questionYear, record.questionNumber),
    year: record.questionYear,
    number: record.questionNumber,
    parliament: record.parliamentNumber,
    source: {
      docId: record.writtenQuestionsDocumentId,
      url: sourceUrl(record.writtenQuestionsDocumentId),
      rawFile: provenance.rawFile,
      retrievedAt: provenance.retrievedAt,
    },
    status: statusFrom(record.statusId),
    statusIdRaw: record.statusId,
    dateAsked: record.questionReleasedDate,
    askedBy: parseAskedBy(record.title),
    askedById: record.memberId ?? "",
    portfolio: record.ministerialDisplayName,
    portfolioId: record.portfolioId_PortfolioMinister ?? "",
    minister: record.ministerName,
    text: questionText,
    reply,
    attachment,
    duplicateGroup: duplicateGroupOf(questionText),
    features: computeFeatures({ questionText, replyText: replyTextForFeatures }),
  };
}

/** A question with an unresolved (placeholder) `reply.referral` gets its real chain and text filled in here. */
function lookupFor(
  byId: ReadonlyMap<QuestionId, Question>,
): (id: QuestionId) => ReferralTarget | undefined {
  return (id) => {
    const question = byId.get(id);
    if (question === undefined || question.reply.kind === "none") return undefined;
    const targets =
      question.reply.kind === "referral"
        ? parseReferralTargets(question.reply.text, question.year)
        : [];
    return { text: question.reply.text, targets };
  };
}

/** Normalises every record, then resolves referrals in a second pass over the full set. */
export function normaliseAll(
  records: readonly { record: SourceRecord; provenance: Provenance }[],
): Question[] {
  const questions = records.map((r) => normalise(r.record, r.provenance));
  const byId = new Map(questions.map((q) => [q.id, q]));
  const lookup = lookupFor(byId);

  return questions.map((question) => {
    if (question.reply.kind !== "referral") return question;
    const referral = resolveReferral(question.id, lookup);
    return { ...question, reply: { ...question.reply, referral } };
  });
}

export type NormaliseSummary = {
  readonly total: number;
  readonly byStatus: Readonly<Record<Question["status"], number>>;
  readonly byReplyKind: Readonly<Record<Reply["kind"], number>>;
  readonly referralsResolved: number;
  readonly referralsUnresolved: number;
  readonly attachmentOnly: number;
  readonly corrected: number;
  readonly distinctDuplicateGroups: number;
  readonly replyCharsMedian: number;
  readonly replyCharsP95: number;
};

// ponytail: nearest-rank percentile, not interpolated. Fine for a print-and-eyeball summary;
// upgrade to interpolation only if a report needs the fractional precision.
function percentile(sortedAscending: readonly number[], p: number): number {
  if (sortedAscending.length === 0) return 0;
  const rank = Math.ceil(p * sortedAscending.length) - 1;
  const index = Math.min(Math.max(rank, 0), sortedAscending.length - 1);
  return sortedAscending[index] ?? 0;
}

/** For the `normalise` shell's printed report. Pure, over an already-normalised set. */
export function summariseQuestions(questions: readonly Question[]): NormaliseSummary {
  const byStatus = { answered: 0, awaiting: 0, other: 0 };
  const byReplyKind = { text: 0, referral: 0, "attachment-only": 0, none: 0 };
  let referralsResolved = 0;
  let referralsUnresolved = 0;
  let attachmentOnly = 0;
  let corrected = 0;
  const duplicateGroups = new Set<string>();
  const replyChars: number[] = [];

  for (const question of questions) {
    byStatus[question.status]++;
    byReplyKind[question.reply.kind]++;
    duplicateGroups.add(question.duplicateGroup);
    if (question.status === "answered") replyChars.push(question.features.replyChars);

    switch (question.reply.kind) {
      case "referral":
        if (question.reply.referral.resolvedText === null) referralsUnresolved++;
        else referralsResolved++;
        if (question.reply.corrected) corrected++;
        break;
      case "attachment-only":
        attachmentOnly++;
        if (question.reply.corrected) corrected++;
        break;
      case "text":
        if (question.reply.corrected) corrected++;
        break;
      case "none":
        break;
      default:
        question.reply satisfies never;
    }
  }

  replyChars.sort((a, b) => a - b);
  return {
    total: questions.length,
    byStatus,
    byReplyKind,
    referralsResolved,
    referralsUnresolved,
    attachmentOnly,
    corrected,
    distinctDuplicateGroups: duplicateGroups.size,
    replyCharsMedian: percentile(replyChars, 0.5),
    replyCharsP95: percentile(replyChars, 0.95),
  };
}

export function readQuestions(filter?: { status?: Question["status"] }): Iterable<Question> {
  return readAndFilter(filter);
}

function* readAndFilter(filter: { status?: Question["status"] } | undefined): Iterable<Question> {
  for (const row of readJsonl(QUESTIONS_FILE)) {
    // The one place we trust our own previously-written output instead of re-validating it:
    // `questions.jsonl` is written only by `normaliseAll` below, never by an external source.
    const question = row as Question;
    if (filter?.status === undefined || question.status === filter.status) yield question;
  }
}

export function writeQuestions(questions: readonly Question[]): void {
  writeJsonl(QUESTIONS_FILE, questions);
}
