// Verbatim wording from docs/site-copy.md. Change the copy there first, then mirror it here.
// Kept as one file so nothing is paraphrased inline in a component.

export const PILL_TEXT = "independent experiment · not from Parliament or any party";

export const PREVIEW_NOTICE = {
  heading: "Early preview.",
  summary:
    "Model readings have not yet been checked against people. Read the source before drawing conclusions.",
  disclosure: "What is still being checked",
  body: "These readings were made by a computer model and have not yet been checked against people's judgement. Some are wrong. The planned human check covers 300 pairs. We will publish how often the model and people agree, including every case where the model was sure and wrong. Until then, treat each reading as a prompt to read the reply yourself.",
};

export const NEW_HERE = {
  heading: "Why these questions matter",
  paragraphs: [
    "A Member of Parliament can send a written question to a government minister.",
    "A minister is the MP put in charge of an area of government, such as health or transport.",
    "The question is published, the minister has to send back a written reply, and that is published too.",
    "This gives the public a record of what MPs asked and how ministers replied.",
    "So it matters whether the reply gives what the question asked for, and that one thing is all this site looks at.",
  ],
};

/** One line per term of art, shown beside the term the first time a page uses it. */
export const TERMS: Readonly<Record<string, string>> = {
  writtenQuestion:
    "A written question is a question an MP sends to a minister in writing. The minister has to reply in writing, and both are published.",
  minister:
    "A minister is the MP put in charge of an area of government, such as health or transport.",
  portfolio:
    "A portfolio is one minister's area of government, such as Health or Transport. The same portfolio is held by different people over time.",
  wq: "WQ is short for written question. Each one has a number and a year.",
  referral:
    "Some replies do not answer in their own words. They point at a reply the minister gave earlier. We fetch that earlier reply and show it here too.",
  stockPhrase:
    "A stock phrase is a set form of words that turns up in many replies, such as “not in the public interest”. We picked a short list by hand, so it is not every phrase.",
  distinctQuestion:
    "The same wording is often sent to many ministers on the same day. “Every question” counts each one. “Each distinct question once” groups repeated wording and uses the reading of the lowest-numbered question in each group. Other replies in that group may differ; this is not an average or a consensus.",
  median: "The median is the middle one. Half are shorter and half are longer.",
  percentile95: "95 in 100 are shorter than this. 5 in 100 are longer.",
  token:
    "A token is a chunk of text, roughly three-quarters of a word. The model is priced by how much text it is sent.",
  confidence:
    "Confidence is the model's own number for how strongly it settled on one answer. It is not a measure of whether the answer is right.",
  controls:
    "Trick pairs are pairs we made up on purpose so we already know the right answer, to see whether a method notices.",
  calibration:
    "Calibration is whether the readings a model was surest about turn out right more often than the ones it was unsure about.",
};

export const HOW_TO_READ_A_READING =
  "The model splits 100 between the possible answers. The largest share normally determines the reading. The published reading is “Unclear” when the model's confidence is below 50 in 100, even if one option has the largest share. These are the model's own numbers, not measured accuracy.";

export const WORKED_EXAMPLE = {
  heading: "Watch Jev read one reply",
  standfirst:
    "This is one real pair. We picked it before running anything, and it is the pair recorded in the project's first test on 18 September 2026. It is one example. It is not evidence that the readings are accurate.",
  questionRef: "WQ 962 of 2024, sent to the Minister of Transport",
  question:
    "Does the Minister stand by his statement “We're going to be a Government that delivers, not just talks”; if so, what transport projects, if any, does he expect to start and finish in the next three years?",
  reply:
    "Yes. Decisions around which projects are funded and delivered over the coming three years will be made in the coming months as the National Land Transport Programme is finalised.",
  asked:
    "In that first test Jev was given three questions. The full run asks the five set out below. One of the three was the same “does the reply give the information asked for” question used in the run.",
  // Numbers below are read from docs/gate0/jev-response.json, the committed record of that test.
  outcome:
    "No sentences. Jev wrote nothing back. It split 100 across the four possible answers: partly answered 95 in 100, answered 3 in 100, not answered 2 in 100, unclear 0 in 100. The biggest share wins, so the reading is “Partly answered”. It also put the chance that the reply declines and gives a reason at 60 in 100.",
  why: "The question asks two things. The reply says yes to the first and names no project at all, so some of what was asked is there and some is not. You do not have to agree. That is the point of showing the question and the reply above every reading.",
  cost: "That one pair took 719 milliseconds and 639 tokens of text.",
  sitePath: "/q/2024/962",
  officialUrl: "https://questions.parliament.nz/written-questions/question/WQ_00962_2024",
};

export const WHY_READ_EVERY_REPLY = {
  heading: "Why apply the same questions across the record?",
  paragraphs: [
    "Reading a sample by hand gives people room to consider context, but the sample needs careful selection. Keyword rules can count a phrase reliably, but cannot establish whether the reply gives the information asked for.",
    "General-purpose language models can assess meaning and produce structured results too. Jev is another approach: this experiment gives it narrow questions with predefined answers and receives probabilities for those answers.",
    "Applying the same criteria across many replies can reveal patterns worth investigating. The published run figures show the work recorded so far. Excluded, withheld and unavailable results are shown as no reading.",
    "On twenty constructed pairs, Jev detected unrelated or repeated-question replies more often than our keyword rules. This is a limited check of those cases, not evidence of accuracy on the public record or superiority to general-purpose models. The human check and broader comparisons remain unfinished.",
  ],
};

export const NOT_GOOD_AT = {
  heading: "What Jev is not good at, and what we did about it",
  items: [
    {
      lead: "It cannot open an attached file.",
      body: "Some replies say the answer is in an attachment. The model never sees it, so those questions show no reading and we say so on the page.",
    },
    {
      lead: "It only sees the text we hand it.",
      body: "About one reply in four is just a pointer to an earlier reply. Handed only that sentence, the model would be reading “I refer the member to reply number 1” and nothing else. Ordinary code finds the earlier reply first and gives it both. A small number could not be found, mostly because they point back to 2023, outside the two years we fetched.",
    },
    {
      lead: "It does not do the counting.",
      body: "Code counts words, detects numbers and matches selected phrases. It also estimates how many parts a question has using text rules; that estimate can be wrong. The model is asked for judgement.",
    },
    {
      lead: "It gives no reason.",
      body: "It returns numbers, not an explanation. That is why the full question and the full reply sit above every reading, with a link to the official record.",
    },
    {
      lead: "Exact wording matters, including ours.",
      body: "In the first draw of the trick pairs, two replies of “None.” were counted as misses. Looking again, “None.” does answer a question of the form “What advice, if any”. The trick pair was wrong and the model was right. We changed how the pairs are built and published both draws.",
    },
    {
      lead: "We do not know yet whether its confidence means anything.",
      body: "Whether the readings it was surest about turn out right more often is exactly what the 300-pair check will test. Until then, treat the numbers as the model's own.",
    },
  ],
  vendorNote:
    "The company that makes it says one request can carry up to 64,000 tokens of text and that the text sent costs US$0.042 per million tokens. We have not tested the limit ourselves, and the price on this site is worked out from that listed figure, not from an invoice.",
};

export const JEV_VENDOR_LIMITS_NOTE =
  "The company that makes Jev says it reads instructions literally, does not count reliably, is unreliable at comparing dates and doing arithmetic, handles double negatives and indirect instructions poorly, gets less accurate as the text it is given fills with detail unrelated to the question, can be swayed by text that argues with it, and does not write text. We have not tested these claims ourselves. This is why code does the counting, the model is sent only the question, the reply and a few computed facts, and each question we ask it is one narrow thing.";

export const HEADLINE_TAG_MODEL = "Model's reading, not yet checked against people";
export const HEADLINE_TAG_COUNTED = "Counted from the official record";
export const HEADLINE_TAG_RUN = "Measured from our own run";

export const WHAT_WE_FOUND_SO_FAR_HEADING = "What we found so far";

export const CIVICS = {
  sectionHeading: "Parliament's written questions in numbers",
  askersHeading: "Who asked the most questions",
  askersNote:
    "Asking many questions is a normal part of an opposition MP's job. The same wording sent to 20 ministers counts as 20 questions here, once for each minister who had to reply.",
  showAllMembers: (n: string) => `Show all ${n} members`,
  portfolioVolumesHeading: "Which portfolios were asked the most",
  portfolioVolumesNote:
    "How many questions a portfolio receives depends on what is in the news and what the portfolio covers, not on how it replies.",
  mostRepeatedHeading: "The most repeated questions",
  busiestDaysHeading: "The busiest days",
  openerHeading: "What kind of question gets what kind of reply",
  openerShows:
    "Code sorts each question by how it opens, such as “How many or how much” or “Yes or no”. This shows how the readings differ by the kind of question asked.",
  openerCannotShow:
    "A list-of-documents question is harder to answer in full than a yes/no one, so this compares kinds of question, not people.",
};

export const WHY_NO_BEST_TABLE = {
  heading: "Why there is no table of who answered best",
  body: "You might expect a list here of which minister gave the best answers. We have not made one, for three reasons. First, the readings come from a computer model and have not yet been checked against people, so a league table would present unchecked guesses as a verdict on named people. Second, ministers are not sent the same questions. A minister asked for long lists of documents will look different from one asked yes or no questions, whatever they do. Third, a reply that declines can be a proper reply. What you can do instead is open any portfolio, read the questions and replies yourself, and see the kinds of question that tend to get a full reply in the section below.",
};

export const NOT_CHECKED_YET_NOTE =
  "Until these checks are done, the site does not claim the readings are accurate. Model probabilities have not been validated against people. A preview notice remains visible on every page.";

export const INTRO = {
  heading: "Can a small AI model help us examine a large public record?",
  body: "Jev helps us ask the same carefully defined questions across New Zealand Parliament's written replies. Its structured judgements can help people find patterns and choose what to investigate.",
  civicLink: "Understand the civic example",
  builderLink: "Understand the method",
};

export const WORKFLOW = {
  heading: "From one reply to a public record",
  steps: [
    {
      heading: "People define the questions",
      body: "We choose what to assess and what each possible answer means.",
    },
    {
      heading: "Jev returns structured judgements",
      body: "The model assigns probabilities to the answers we specify. It does not write an explanation.",
    },
    {
      heading: "Code counts the results",
      body: "Software groups the published readings so we can explore patterns across many replies.",
    },
    {
      heading: "People check and interpret",
      body: "We test accuracy against human readings. You can open the original replies and judge the evidence yourself.",
    },
  ],
};

export const WHAT_THIS_IS = {
  heading: "What changes when we can ask at scale?",
  paragraphs: [
    "A public record can be open to everyone and still be too large for one person to read. This experiment uses Jev, a small AI model, to assess whether a reply gives the information a question asked for.",
    "The useful change is the ability to turn a question about meaning into a repeatable assessment across many documents. That could help a civic reader find examples worth examining and help a researcher test a pattern beyond a small sample.",
    "People still choose the criteria, check the results and decide what they mean. A consistent question does not guarantee a correct answer. Our human accuracy check is unfinished.",
    "General-purpose language models can also assess meaning. This experiment explores Jev's structured outputs and estimated cost for this task; it has not established that Jev is more accurate or better value than those alternatives.",
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
    "Some replies point to an earlier reply. Where we could fetch it, both texts are supplied for the model to assess.",
    "The same question is often sent to many ministers at once. We show counts both ways: every question, and each distinct question once.",
    "Long replies are shortened on this site. The link to the official record always has the full text.",
    `One pattern we have already seen: when a question says "if any" and the reply is "I am not responsible for any departments", the model often reads it as not answered. A person might well say that reply does answer the question. Expect other patterns like this.`,
  ],
};

export const FOUND_A_MISTAKE = {
  heading: "Found a mistake?",
  contactUrl: "https://www.linkedin.com/in/matthewawood/",
  contactLabel: "message Matthew Wood on LinkedIn",
  before: "If a reading is wrong, or a question or reply is shown incorrectly, ",
  after: " and we will review it and list any correction on the method page.",
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
  meaning:
    "No model judgement is published for this pair. It may be excluded, held for human checks, or have no result available.",
};

export const EVASION_TYPE_HEADING = "What the reply does instead";

export const NO_READING_REASON_TEXT: Readonly<Record<string, string>> = {
  attachment_not_read:
    "The reply says the information is in an attached file. We did not read the file, so there is no reading here. The file is on the official page.",
  held_for_human_check:
    "This pair is part of the 300-pair human check. Its reading stays unpublished until both people have labelled it, so nobody labels with the model's answer in view.",
  model_error:
    "No model result is available in this published dataset. This may mean processing is unfinished or a request failed.",
};

export const BROWSE_COMPARISON_NOTE =
  "Portfolios change hands, and the questions sent to each differ, so they should not be compared as scores.";
