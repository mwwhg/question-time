// Jev (TypeSafe AI) adapter. Pins jev-1.13.0 and passes QS_V1 verbatim; see docs/sources.md.
import { choice, noul, TypeSafeClient } from "@typesafe-ai/sdk";
import { z } from "zod";
import { secret } from "../lib/env.ts";
import type { Method, MethodInput } from "./method.ts";
import { QS_V1 } from "./qs-v1.ts";
import type { Answers } from "./vocabulary.ts";
import { ALL_PARTS, ANSWERED, GIVES_FIGURE, INSTEAD, probability } from "./vocabulary.ts";

const VERSION = "jev-1.13.0";

const QUESTIONS = {
  answered: choice(QS_V1.answered.instructions, QS_V1.answered.criteria),
  givesRequestedFigure: choice(
    QS_V1.givesRequestedFigure.instructions,
    QS_V1.givesRequestedFigure.criteria,
  ),
  addressesAllParts: choice(QS_V1.addressesAllParts.instructions, QS_V1.addressesAllParts.criteria),
  declinesWithReason: noul(
    QS_V1.declinesWithReason.instructions,
    QS_V1.declinesWithReason.criteria,
  ),
  evasionType: choice(QS_V1.evasionType.instructions, QS_V1.evasionType.criteria),
};

let client: TypeSafeClient | undefined;

function getClient(): TypeSafeClient {
  // Lazy: constructing eagerly would require TYPESAFE_API_KEY at import time, which breaks
  // running `rules` without a .env.
  client ??= new TypeSafeClient({ apiKey: secret("TYPESAFE_API_KEY"), retry: { maxRetries: 0 } });
  return client;
}

/** Every declared option must be present in `probabilities`; a missing one fails loudly. */
function probabilitiesSchema<O extends string>(options: readonly O[]) {
  const shape = Object.fromEntries(options.map((o) => [o, z.number()])) as Record<O, z.ZodNumber>;
  return z.object(shape).strict();
}

function choiceSchema<O extends string>(options: readonly O[]) {
  return z.object({
    choice: z.enum(options as unknown as [O, ...O[]]),
    confidence: z.number(),
    probabilities: probabilitiesSchema(options),
  });
}

const RESPONSE_SCHEMA = z.object({
  answered: choiceSchema(ANSWERED),
  givesRequestedFigure: choiceSchema(GIVES_FIGURE),
  addressesAllParts: choiceSchema(ALL_PARTS),
  declinesWithReason: z.object({ noul: z.number() }),
  evasionType: choiceSchema(INSTEAD),
});

function toChoice<O extends string>(
  options: readonly O[],
  parsed: { choice: O; confidence: number; probabilities: Record<O, number> },
) {
  const probabilities = Object.fromEntries(
    options.map((o) => [o, probability(parsed.probabilities[o])]),
  ) as Record<O, ReturnType<typeof probability>>;
  return {
    kind: "choice" as const,
    choice: parsed.choice,
    probabilities,
    confidence: probability(parsed.confidence),
  };
}

function stateOf(input: MethodInput) {
  const referredReply = input.referredReply;
  return {
    question: input.question,
    reply: input.reply,
    ...(referredReply === null ? {} : { referred_reply: referredReply }),
    features: {
      reply_words: input.features.replyWords,
      has_number: input.features.hasNumber,
      refers_to_earlier: input.features.refersToEarlier,
      has_attachment: input.features.hasAttachment,
      question_parts: input.features.questionParts,
    },
  };
}

export const jev: Method = {
  id: "jev",
  version: VERSION,
  async judge(input) {
    const t0 = performance.now();
    const result = await getClient().systemOne({
      model: VERSION,
      state: stateOf(input),
      questions: QUESTIONS,
    });
    const latencyMs = Math.round(performance.now() - t0);
    const parsed = RESPONSE_SCHEMA.parse(result.answers);

    const answers: Answers = {
      answered: toChoice(ANSWERED, parsed.answered),
      givesRequestedFigure: toChoice(GIVES_FIGURE, parsed.givesRequestedFigure),
      addressesAllParts: toChoice(ALL_PARTS, parsed.addressesAllParts),
      declinesWithReason: {
        kind: "noul",
        probability: probability(parsed.declinesWithReason.noul),
      },
      evasionType: toChoice(INSTEAD, parsed.evasionType),
    };

    return {
      answers,
      usage: {
        inputTokens: result.usage.input_tokens,
        outputTokens: result.usage.output_tokens,
        latencyMs,
      },
    };
  },
};
