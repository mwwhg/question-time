// ponytail: a naive phrase-matching baseline, not a real reading of the reply. It exists to give
// the LLM/Jev methods something worse to beat, and to run instantly with zero cost. Upgrade path:
// none intended — a better heuristic baseline is not the point, `jev`/`llm` are.
import type { Method, MethodInput } from "./method.ts";
import type { Answers, Choice, Noul } from "./vocabulary.ts";
import { ALL_PARTS, ANSWERED, GIVES_FIGURE, INSTEAD, probability } from "./vocabulary.ts";

const DECLINE_PHRASES = [
  "not in the public interest",
  "commercially sensitive",
  "would require substantial",
  "no responsibility",
  "not able to provide",
  "do not hold",
  "is an operational matter",
];

const FIGURE_QUESTION =
  /how many|how much|what (is|was|were) the (number|total|cost|amount)|on what date|what date/i;
const REFERS_ELSEWHERE_MENTION = /publicly available|website/i;

function degenerateChoice<O extends string>(options: readonly O[], chosen: O): Choice<O> {
  const probabilities = Object.fromEntries(
    options.map((o) => [o, probability(o === chosen ? 1 : 0)]),
  ) as Record<O, ReturnType<typeof probability>>;
  return { kind: "choice", choice: chosen, probabilities, confidence: probability(1) };
}

function degenerateNoul(value: boolean): Noul {
  return { kind: "noul", probability: probability(value ? 1 : 0) };
}

function classifyAnswered(
  input: MethodInput,
  hasAttachmentLittleText: boolean,
  declined: boolean,
): (typeof ANSWERED)[number] {
  if (hasAttachmentLittleText) return "unclear";
  if (declined) return "not_answered";
  if (input.referredReply === null && input.features.refersToEarlier) return "unclear";
  return "answered";
}

export function judgeRules(input: MethodInput): Answers {
  const declined = DECLINE_PHRASES.some((p) => input.reply.toLowerCase().includes(p));
  const hasAttachmentLittleText = input.features.hasAttachment && input.features.replyWords < 15;
  const answered = classifyAnswered(input, hasAttachmentLittleText, declined);

  const givesRequestedFigure: (typeof GIVES_FIGURE)[number] = FIGURE_QUESTION.test(input.question)
    ? input.features.hasNumber
      ? "yes"
      : "no"
    : "no_figure_requested";

  const addressesAllParts: (typeof ALL_PARTS)[number] =
    input.features.questionParts === 1
      ? "single_part_question"
      : answered === "answered"
        ? "all_parts"
        : "some_parts";

  const evasionType: (typeof INSTEAD)[number] =
    REFERS_ELSEWHERE_MENTION.test(input.reply) && answered !== "answered"
      ? "refers_elsewhere"
      : "none";

  return {
    answered: degenerateChoice(ANSWERED, answered),
    givesRequestedFigure: degenerateChoice(GIVES_FIGURE, givesRequestedFigure),
    addressesAllParts: degenerateChoice(ALL_PARTS, addressesAllParts),
    declinesWithReason: degenerateNoul(declined),
    evasionType: degenerateChoice(INSTEAD, evasionType),
  };
}

export const rules: Method = {
  id: "rules",
  version: "rules-1",
  async judge(input) {
    return {
      answers: judgeRules(input),
      usage: { inputTokens: 0, outputTokens: 0, latencyMs: 0 },
    };
  },
};
