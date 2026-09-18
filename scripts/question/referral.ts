// Parse "reply number N (YYYY)" style referrals and follow them to their source text.

import type { QuestionId, Referral } from "./question.ts";
import { questionId } from "./question.ts";

const DEPTH_CAP = 5;
// ponytail: regex heuristic over the phrasings actually seen in the 2024/2025 raw pages (see the
// fetch report for measured coverage against "refer the member" replies). Deliberately narrow:
// "question" alone is not a trigger word, because "Oral Question No. 9 on 1 February 2024" also
// matches "question" + a number and is a different numbering scheme we cannot resolve into.
// Upgrade path: hand-checked sample at Gate 3 if coverage looks short.
const REFERRAL_PATTERNS = [
  // "reply number 13 (2024)", "reply 117 (2024)", "reply to question No. 1234"
  /reply\s*(?:number|to\s+question\s*(?:no\.?)?)?\s*(\d+)\s*(?:\((\d{4})\))?/i,
  // "WQ 1234 (2024)", "WPQ 177 (2024)", "PQ 203 (2024)"
  /\b(?:WPQ|WQ|PQ)\s*(\d+)\s*(?:\((\d{4})\))?/i,
  // "answer to written question 1234 (2024)", "Written Question reply 29924 (2023)",
  // "written parliamentary question 295 (2024)", "question for written answer 413 (2024)"
  /written\s+(?:parliamentary\s+)?question\s*(?:number|no\.?)?\s*(\d+)\s*(?:\((\d{4})\))?/i,
  /question\s+for\s+written\s+answer\s*(\d+)\s*(?:\((\d{4})\))?/i,
  // "response to question 1462 (2024)" — year must be parenthesised here, unlike the others,
  // so this never matches "Oral Question No. 9 on 1 February 2024" (no parens around its date).
  /\bquestion\s+(\d+)\s*\((\d{4})\)/i,
];

/** First referral target in `replyText`, or `[]` if the text names none. A missing year means the question's own year. */
export function parseReferralTargets(replyText: string, ownYear: number): QuestionId[] {
  for (const pattern of REFERRAL_PATTERNS) {
    const match = pattern.exec(replyText);
    if (match?.[1] === undefined) continue;
    const number = Number(match[1]);
    const year = match[2] === undefined ? ownYear : Number(match[2]);
    return [questionId(year, number)];
  }
  return [];
}

const CORRECTED_PREFIX = /^corrected reply:\s*/i;
const SHORT_REFERRAL_MAX_CHARS = 200;
const ALSO_MY_ANSWER = /also my (?:answer|reply|response)/i;

/** A reply counts as a referral only when, after stripping "Corrected reply:", it is short and is essentially just the referral. */
export function isReferralReply(replyText: string): boolean {
  const stripped = replyText.replace(CORRECTED_PREFIX, "").trim();
  if (stripped.length >= SHORT_REFERRAL_MAX_CHARS) return false;
  // "No, ... This is also my answer to written question 422 (2024)" points forward: the text
  // here is the answer and the other question refers to it. Treating it as a referral would
  // send every question that points here on to a reply that points back.
  if (ALSO_MY_ANSWER.test(stripped)) return false;
  return REFERRAL_PATTERNS.some((pattern) => pattern.test(stripped));
}

export type ReferralTarget = { readonly text: string; readonly targets: readonly QuestionId[] };

/**
 * Follows the first target hop by hop from `start`. `chain` lists only the ids hopped *to*,
 * not `start` itself. Guards against cycles and stops after `DEPTH_CAP` hops.
 */
export function resolveReferral(
  start: QuestionId,
  lookup: (id: QuestionId) => ReferralTarget | undefined,
): Referral {
  const chain: QuestionId[] = [];
  const visited = new Set<QuestionId>([start]);
  let current = start;

  for (let hop = 0; hop < DEPTH_CAP; hop++) {
    const entry = lookup(current);
    if (entry === undefined) return { chain, resolvedText: null }; // missing target
    const next = entry.targets[0];
    if (next === undefined) return { chain, resolvedText: entry.text }; // no further referral: final text
    if (visited.has(next)) {
      chain.push(next);
      return { chain, resolvedText: null }; // cycle
    }
    visited.add(next);
    chain.push(next);
    current = next;
  }
  return { chain, resolvedText: null }; // past depth cap
}
