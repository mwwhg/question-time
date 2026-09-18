// Verbatim wording from docs/site-copy.md. Change the copy there first, then mirror it here.
// Kept as one file so nothing is paraphrased inline in a component.

export const PILL_TEXT = "independent experiment · not from Parliament or any party";

export const PREVIEW_NOTICE = {
  heading: "Early preview.",
  body: "These readings were made by a computer model and have not yet been checked against people's judgement. Some are wrong. We are hand-checking 300 of them and will publish how often the model and people agree, including every case where the model was sure and wrong. Until then, treat each reading as a prompt to read the reply yourself.",
};

export const WHAT_THIS_IS = {
  heading: "What this is",
  paragraphs: [
    "This is an experiment in reading a very large public record.",
    "Members of Parliament send ministers tens of thousands of written questions a year. In 2024 and 2025 there were 141,686. Every question and reply is published, and almost nobody can read them all. We asked a small, fast computer model called Jev to read every pair and say one narrow thing: does the text of the reply give what the question asked for?",
    "We are testing two things. One is whether a model like this can do that job well enough to be useful. The other is what becomes possible when it costs a few dollars, not a research budget, to ask several questions of every document in a public record.",
    "Civic and political records have been hard to study at scale. They are mostly free text, there is a great deal of it, and the questions worth asking need judgement: did this reply address that question? Until now the choices were to read a small sample by hand, or to count words and phrases and hope they stood for meaning. This site is a first look at a third way, where every document gets read and several plain questions are asked of each one. It is an initial exploration. It will have errors, the method is published in full, and we would rather show the work early and be corrected than wait.",
  ],
};

export const WHAT_THIS_IS_NOT = {
  heading: "What this is not",
  paragraphs: [
    "It is not the official record. The official record is at questions.parliament.nz, and every page here links to it.",
    "It is not a judgement of anyone. A reading of “not answered” describes the words of a reply. It does not say the minister was wrong to reply that way. Ministers can have good reasons to decline: privacy, cost, commercial sensitivity, or the matter belonging to someone else. It says nothing about anyone's honesty, effort or ability.",
    "It is not a ranking. Results are grouped by portfolio, never by person. Portfolios change hands, and the questions sent to each portfolio differ in kind and difficulty, so portfolios should not be compared as if they were scores.",
    "It is not from Parliament, the Office of the Clerk, any party, or any member.",
  ],
};

export const KNOW_BEFORE_YOU_READ = {
  heading: "Know before you read",
  items: [
    "A model made these readings, and models make mistakes. Open any question to see the full question, the full reply and the model's reading side by side, then decide for yourself.",
    "The model read text only. When a reply says the answer is in an attached file, we did not read the file, and we show no reading.",
    "About one reply in four only points to an earlier reply. We fetched the earlier reply and the model read both together.",
    "The same question is often sent to many ministers at once. We show counts both ways: every question, and each distinct question once.",
    "Long replies are shortened on this site. The link to the official record always has the full text.",
  ],
};

export const FOUND_A_MISTAKE = {
  heading: "Found a mistake?",
  // TODO(owner): real contact address — corrections@example.org is a placeholder.
  address: "corrections@example.org",
  body: (address: string) =>
    `If a reading is wrong, or a question or reply is shown incorrectly, tell us at ${address} and we will correct it and list the correction on the How we checked page.`,
};

export const ATTRIBUTION_TEXT =
  "This work includes part of Office of the Clerk/Parliamentary Service's written parliamentary questions and replies, which is licensed by the Clerk of the House of Representatives and/or the Parliamentary Corporation on behalf of Parliamentary Service for re-use under the Creative Commons Attribution 4.0 International licence. Full licence available at https://creativecommons.org/licenses/by/4.0/. Text has been shortened in places and machine-generated readings have been added beside it.";

export const CC_LICENCE_URL = "https://creativecommons.org/licenses/by/4.0/";

export const READING_IT_YOURSELF_INTRO =
  "Built from computed features only. It describes structure, never motive.";

export const READING_IT_YOURSELF_CLOSE =
  "Read the question and the reply above and see whether you agree.";

export const LABEL_WORDING: Readonly<
  Record<string, { readonly shownAs: string; readonly meaning: string }>
> = {
  answered: { shownAs: "Answered", meaning: "The reply gives what was asked." },
  partly_answered: {
    shownAs: "Partly answered",
    meaning: "The reply gives some of what was asked.",
  },
  not_answered: {
    shownAs: "Not answered",
    meaning:
      "The reply does not give what was asked. This describes the reply, not whether declining was justified.",
  },
  unclear: {
    shownAs: "Unclear",
    meaning: "The model could not tell, or was not sure enough to say.",
  },
};

export const NO_READING_WORDING = {
  shownAs: "No reading",
  meaning: "We did not read an attached file, or this pair is being checked by people first.",
};

export const EVASION_TYPE_HEADING = "What the reply does instead";

export const NO_READING_REASON_TEXT: Readonly<Record<string, string>> = {
  attachment_not_read:
    "The reply says the information is in an attached file. We did not read the file, so there is no reading here. The file is on the official page.",
  held_for_human_check:
    "This pair is part of the 300-pair human check. Its reading stays unpublished until both people have labelled it, so nobody labels with the model's answer in view.",
  model_error: "The model could not produce a reading for this pair.",
};

export const BROWSE_COMPARISON_NOTE =
  "Portfolios change hands, and the questions sent to each differ, so they should not be compared as scores.";
