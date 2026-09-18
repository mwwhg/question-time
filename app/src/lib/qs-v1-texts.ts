// Pasted, not imported, from scripts/judgement/qs-v1.ts (question set qs-v1) — app/ cannot import
// pipeline code except @contract. Keep this in sync by hand if qs-v1 ever changes (it is frozen,
// so a wording change is a new qs-vN file, and this file is updated alongside it).

const JUDGE_TOGETHER =
  "If `referred_reply` is present, the `reply` points to an earlier reply: judge `reply` and `referred_reply` together against this `question`.";

// `label` and `answers` are the plain-word versions shown to readers. `instructions` is the exact
// text the model was given, shown as-is where a reader asks to see it.
export const QS_V1_INSTRUCTIONS = [
  {
    key: "answered",
    label: "Does the reply give the information asked for?",
    answers: "Answered, partly answered, not answered, or unclear.",
    instructions: `Does the \`reply\` give the information that the \`question\` asks for? ${JUDGE_TOGETHER}`,
  },
  {
    key: "givesRequestedFigure",
    label: "Does the reply give the figure asked for?",
    answers: "Yes, no, or the question did not ask for a figure.",
    instructions: `If the \`question\` asks for a number, amount, date or count, does the \`reply\` state it? ${JUDGE_TOGETHER}`,
  },
  {
    key: "addressesAllParts",
    label: "Does it address every part?",
    answers: "All parts, some parts, no parts, or the question asked only one thing.",
    instructions: `\`features.question_parts\` is how many separate things the \`question\` asks. How many of them does the \`reply\` address? ${JUDGE_TOGETHER}`,
  },
  {
    key: "declinesWithReason",
    label: "Does it decline and give a reason?",
    answers: "A single number out of 100 for yes.",
    instructions:
      "Does the `reply` decline to provide the information asked for and state a reason for declining?",
  },
  {
    key: "evasionType",
    label: "What the reply does instead",
    answers:
      "Talks about a related topic, restates government policy, refers elsewhere without giving the content, or none of those.",
    instructions: `If the \`reply\` does not give the information the \`question\` asks for, what does it do instead? ${JUDGE_TOGETHER}`,
  },
] as const;
