import type { QuestionId } from "../question/question.ts";

export type Probability = number & { readonly __brand: "Probability" };

/** Boundary constructor: method adapters call this on every number a model returns. */
export function probability(n: number): Probability {
  if (!(n >= 0 && n <= 1)) throw new RangeError(`not a probability: ${n}`);
  return n as Probability;
}

// A Noul has no confidence field, so "how sure" cannot be shown for it by mistake.
export type Noul = { readonly kind: "noul"; readonly probability: Probability };

export type Choice<O extends string> = {
  readonly kind: "choice";
  readonly choice: O;
  readonly probabilities: Readonly<Record<O, Probability>>;
  readonly confidence: Probability;
};

export const ANSWERED = ["answered", "partly_answered", "not_answered", "unclear"] as const;
export const GIVES_FIGURE = ["yes", "no", "no_figure_requested"] as const;
export const ALL_PARTS = ["all_parts", "some_parts", "no_parts", "single_part_question"] as const;
export const INSTEAD = ["related_topic", "restates_policy", "refers_elsewhere", "none"] as const;

export type AnsweredLabel = (typeof ANSWERED)[number];

/** qs-v1: one field per question. */
export type Answers = {
  readonly answered: Choice<AnsweredLabel>;
  readonly givesRequestedFigure: Choice<(typeof GIVES_FIGURE)[number]>;
  readonly addressesAllParts: Choice<(typeof ALL_PARTS)[number]>;
  readonly declinesWithReason: Noul;
  readonly evasionType: Choice<(typeof INSTEAD)[number]>;
};

/** Below this, the site greys the reading and counts it as unclear. Decided here and nowhere else. */
export const UNSURE_BELOW = 0.5;

export function publishedLabel(a: Answers["answered"]): AnsweredLabel {
  return a.confidence < UNSURE_BELOW ? "unclear" : a.choice;
}

export type RunId = string & { readonly __brand: "RunId" };

export type Usage = {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly latencyMs: number;
};

export type Judgement =
  | {
      readonly kind: "judged";
      readonly id: QuestionId;
      readonly runId: RunId;
      readonly at: string;
      readonly answers: Answers;
      readonly usage: Usage;
    }
  | {
      readonly kind: "failed";
      readonly id: QuestionId;
      readonly runId: RunId;
      readonly at: string;
      readonly error: string;
      readonly attempts: number;
    };
