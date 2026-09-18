// Question set v1. Frozen once Gate 3 labels exist: any wording change is a new qs-vN file, never an edit.
// Every method gets these same texts. Jev receives them as instructions and criteria; the LLM prompt is built from them.
import { createHash } from "node:crypto";

const JUDGE_TOGETHER =
  "If `referred_reply` is present, the `reply` points to an earlier reply: judge `reply` and `referred_reply` together against this `question`.";

export const QS_V1 = {
  answered: {
    type: "choice",
    instructions: `Does the \`reply\` give the information that the \`question\` asks for? ${JUDGE_TOGETHER}`,
    criteria: {
      answered:
        "The reply gives the information asked for, or a direct yes or no where that is what was asked. Saying there is none, or that no such documents exist, counts as giving the information.",
      partly_answered:
        "The reply gives some of the information asked for and leaves some of it out.",
      not_answered:
        "The reply does not give the information asked for, whether it declines, talks about something else, only restates policy, or points to another source without giving the content.",
      unclear:
        "The reply cannot be judged from its text alone, for example because the information is said to be in an attachment that is not shown.",
    },
  },
  givesRequestedFigure: {
    type: "choice",
    instructions: `If the \`question\` asks for a number, amount, date or count, does the \`reply\` state it? ${JUDGE_TOGETHER}`,
    criteria: {
      yes: "The question asks for a number, amount, date or count, and the reply states one that matches what was asked.",
      no: "The question asks for a number, amount, date or count, and the reply does not state it.",
      no_figure_requested: "The question does not ask for a number, amount, date or count.",
    },
  },
  addressesAllParts: {
    type: "choice",
    instructions: `\`features.question_parts\` is how many separate things the \`question\` asks. How many of them does the \`reply\` address? ${JUDGE_TOGETHER}`,
    criteria: {
      all_parts: "The question asks more than one thing and the reply addresses every one of them.",
      some_parts:
        "The question asks more than one thing and the reply addresses at least one but not all of them.",
      no_parts: "The question asks more than one thing and the reply addresses none of them.",
      single_part_question: "The question asks only one thing.",
    },
  },
  declinesWithReason: {
    type: "noul",
    instructions:
      "Does the `reply` decline to provide the information asked for and state a reason for declining?",
    criteria: {
      true: "The reply says the information will not or cannot be provided, and gives a reason such as cost, privacy, commercial sensitivity, or that it is not the Minister's responsibility.",
      false:
        "The reply provides the information, or it fails to provide it without saying that it is declining, or it declines without giving any reason.",
    },
  },
  evasionType: {
    type: "choice",
    instructions: `If the \`reply\` does not give the information the \`question\` asks for, what does it do instead? ${JUDGE_TOGETHER}`,
    criteria: {
      related_topic:
        "The reply talks about a related subject rather than the specific thing asked.",
      restates_policy:
        "The reply restates government policy, intentions or general principles rather than the specific thing asked.",
      refers_elsewhere:
        "The reply points to another document, website, person or organisation without giving the content.",
      none: "The reply gives the information asked for, or none of the other options describes it.",
    },
  },
} as const;

export const QUESTION_SET_VERSION = "qs-v1";

/** Hash of the exact texts above. Stored in every run header so a silent wording change cannot share a file with old judgements. */
export const QUESTION_SET_HASH = createHash("sha256")
  .update(JSON.stringify(QS_V1))
  .digest("hex")
  .slice(0, 12);
