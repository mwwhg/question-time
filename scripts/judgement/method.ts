import type { Question } from "../question/question.ts";
import { jev } from "./jev.ts";
import { rules } from "./rules.ts";
import type { Answers, Usage } from "./vocabulary.ts";

export type MethodId = "rules" | "llm" | "jev";

/**
 * Identical inputs for every method: the question, the reply, the resolved referral text,
 * and the computed features. Built once by `methodInput` so no method sees more than another.
 */
export type MethodInput = {
  readonly question: string;
  readonly reply: string;
  readonly referredReply: string | null;
  readonly features: {
    readonly replyWords: number;
    readonly hasNumber: boolean;
    readonly refersToEarlier: boolean;
    readonly hasAttachment: boolean;
    readonly questionParts: number;
  };
};

export function methodInput(q: Question): MethodInput {
  const reply = q.reply;
  if (reply.kind === "none") throw new Error(`methodInput: ${q.id} has no reply`);

  switch (reply.kind) {
    case "text":
      return {
        question: q.text,
        reply: reply.text,
        referredReply: null,
        features: featuresOf(q, false),
      };
    case "referral":
      return {
        question: q.text,
        reply: reply.text,
        referredReply: reply.referral.resolvedText,
        features: featuresOf(q, true),
      };
    case "attachment-only":
      return {
        question: q.text,
        reply: reply.text,
        referredReply: null,
        features: featuresOf(q, false),
      };
    default:
      reply satisfies never;
      throw new Error("unreachable");
  }
}

function featuresOf(q: Question, refersToEarlier: boolean): MethodInput["features"] {
  return {
    replyWords: q.features.replyWords,
    hasNumber: q.features.hasNumber,
    refersToEarlier,
    hasAttachment: q.attachment !== null,
    questionParts: q.features.questionParts,
  };
}

/** A method only judges. Files, resume, retry and provenance belong to `runMethod`. */
export interface Method {
  readonly id: MethodId;
  /** "rules-1" | "claude-haiku-4-5-20251001" | "jev-1.13.0". Pinned, never an alias. */
  readonly version: string;
  judge(input: MethodInput): Promise<{ answers: Answers; usage: Usage }>;
}

// "llm" is added once an Anthropic key exists; MethodId already includes it so callers don't churn.
export const METHODS: Record<Exclude<MethodId, "llm">, Method> = { rules, jev };
