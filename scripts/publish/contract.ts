// The JSON the site reads. Zero imports, no Node APIs: this is the only pipeline file `app/` may import (as "@contract").

export type Label = "answered" | "partly_answered" | "not_answered" | "unclear";
export const LABELS: readonly Label[] = ["answered", "partly_answered", "not_answered", "unclear"];

/** Present only for Choice answers. `unsure` is decided by the pipeline so the app has no threshold to get wrong. */
export type ChoiceReading = {
  readonly choice: string;
  readonly probabilities: Readonly<Record<string, number>>;
  readonly confidence: number;
  readonly unsure: boolean;
};

export type Provenance = {
  readonly sourceUrl: string;
  readonly retrievedAt: string;
  readonly featuresVersion: string;
  readonly model: string;
  readonly questionSetVersion: string;
  readonly questionSetHash: string;
  /** null when there is no reading. */
  readonly evaluatedAt: string | null;
};

export type ReplyShape = "text" | "referral" | "attachment-only";

/**
 * Why a question has no published reading.
 * `held_for_human_check`: the pair is in the hand-labelled benchmark, and its reading stays unpublished
 * until both people have labelled it, so nobody labels with the model's answer in view.
 */
export type NoReadingReason = "attachment_not_read" | "held_for_human_check" | "model_error";

export type BrowseRow = {
  readonly year: number;
  readonly number: number;
  readonly dateAsked: string;
  /** First 160 characters. */
  readonly question: string;
  readonly replyShape: ReplyShape;
  /** The published label: `unclear` when the model was unsure. null when there is no reading. */
  readonly label: Label | null;
  readonly confidence: number | null;
};

export type BrowseShard = {
  readonly portfolio: string;
  readonly slug: string;
  readonly year: number;
  readonly rows: readonly BrowseRow[];
};

export type Reading = {
  readonly answered: ChoiceReading;
  readonly givesRequestedFigure: ChoiceReading;
  readonly addressesAllParts: ChoiceReading;
  /** Probability of yes. A yes/no reading has no separate confidence. */
  readonly declinesWithReason: number;
  readonly evasionType: ChoiceReading;
};

export type QuestionDetail = {
  readonly year: number;
  readonly number: number;
  readonly dateAsked: string;
  readonly askedBy: string;
  readonly portfolio: string;
  readonly portfolioSlug: string;
  readonly minister: string;
  readonly question: string;
  readonly reply: string;
  readonly replyTruncated: boolean;
  readonly replyShape: ReplyShape;
  /** For a referral: the earlier reply it points to, which the model read together with `reply`. */
  readonly referredReply: string | null;
  readonly referredReplyTruncated: boolean;
  readonly referralChain: readonly string[];
  readonly attachmentName: string | null;
  readonly sameQuestionSentTo: number;
  readonly features: {
    readonly replyWords: number;
    readonly hasNumber: boolean;
    readonly questionParts: number;
    readonly stockPhrases: readonly string[];
  };
  readonly reading: Reading | null;
  readonly noReadingReason: NoReadingReason | null;
  readonly provenance: Provenance;
};

export type QuestionBlock = {
  readonly year: number;
  readonly block: number;
  readonly items: readonly QuestionDetail[];
};

export type LabelCounts = Readonly<Record<Label, number>> & { readonly noReading: number };

export type PortfolioSummary = {
  readonly slug: string;
  readonly name: string;
  /** Keyed by year as a string. `distinctQuestions` counts each question text once per portfolio. */
  readonly byYear: Readonly<
    Record<string, { readonly all: LabelCounts; readonly distinctQuestions: LabelCounts }>
  >;
};

export type RunFacts = {
  readonly model: string;
  readonly questionSetVersion: string;
  readonly questionSetHash: string;
  readonly featuresVersion: string;
  readonly pairsJudged: number;
  readonly pairsFailed: number;
  readonly questionsPerPair: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly usdPerMillionInputTokens: number;
  readonly estimatedCostUsd: number;
  readonly latencyMsP50: number;
  readonly latencyMsP95: number;
  /** Time the run was actually reading: the sum of gaps between consecutive readings, leaving out any gap over a minute. */
  readonly activeSeconds: number;
  /** Gaps over a minute, such as a stop and restart. Reported so the elapsed time is not mistaken for working time. */
  readonly pauses: number;
  readonly pausedSeconds: number;
  readonly firstJudgementAt: string;
  readonly lastJudgementAt: string;
};

export type PortfolioIndex = {
  readonly generatedAt: string;
  /** False until the 300-pair human benchmark is published. The site shows a preview notice and hides "how sure" wording while false. */
  readonly checkedAgainstPeople: boolean;
  readonly years: readonly number[];
  readonly totals: { readonly all: LabelCounts; readonly distinctQuestions: LabelCounts };
  readonly run: RunFacts;
  readonly portfolios: readonly PortfolioSummary[];
};

/** One row of a breakdown table: a group name and its label counts. */
export type Breakdown = { readonly group: string; readonly counts: LabelCounts };

export type Findings = {
  readonly generatedAt: string;
  readonly corpus: {
    readonly records: number;
    readonly answered: number;
    readonly awaiting: number;
    readonly withdrawn: number;
    readonly distinctQuestionTexts: number;
    readonly referralReplies: number;
    readonly referralsUnresolved: number;
    readonly attachmentOnlyReplies: number;
    readonly correctedReplies: number;
    readonly replyCharsMedian: number;
    readonly replyCharsP95: number;
  };
  readonly byReplyShape: readonly Breakdown[];
  /** Groups: "under 10 words", "10 to 29", "30 to 99", "100 or more". */
  readonly byReplyLength: readonly Breakdown[];
  /** Groups: "1", "2", "3 or more". */
  readonly byQuestionParts: readonly Breakdown[];
  /** Groups: "2024-01" ... "2025-12", by date asked. */
  readonly byMonth: readonly Breakdown[];
  /** Groups: "sent to 1 minister", "2 to 9", "10 or more". */
  readonly byFanOut: readonly Breakdown[];
  /** Groups: each stock phrase, plus "none of these phrases". */
  readonly byStockPhrase: readonly Breakdown[];
  /** Ten bins of width 0.1 over the `answered` confidence, split by the model's raw choice. */
  readonly confidenceHistogram: readonly {
    readonly from: number;
    readonly to: number;
    readonly byChoice: Readonly<Record<Label, number>>;
  }[];
  readonly secondary: {
    readonly givesRequestedFigure: Readonly<Record<string, number>>;
    readonly addressesAllParts: Readonly<Record<string, number>>;
    /** Only over replies whose published label is not `answered`. */
    readonly evasionType: Readonly<Record<string, number>>;
    /** Ten bins of width 0.1 over the yes-probability. */
    readonly declinesWithReasonHistogram: readonly number[];
  };
  /** How the five readings sit together: e.g. of replies read as not answered, how many also read as declining with a reason. */
  readonly crossChecks: readonly {
    readonly statement: string;
    readonly numerator: number;
    readonly denominator: number;
  }[];
  /**
   * Plain counts from the official record. No model is involved in `askers`, `portfolioVolumes` or
   * `mostRepeatedQuestions`, so they hold whatever the readings turn out to be worth.
   * People are listed only by how many questions they asked. No person is ever listed or ordered
   * by how replies were read: that would turn an unchecked model's output into a verdict on a named person.
   */
  readonly civics: {
    /** Every member who asked a question, most questions first. Names exactly as the source gives them. */
    readonly askers: readonly {
      readonly name: string;
      readonly questions: number;
      readonly distinctQuestions: number;
      readonly portfoliosAsked: number;
    }[];
    /** Every portfolio, most questions received first. Answered questions only. */
    readonly portfolioVolumes: readonly {
      readonly slug: string;
      readonly name: string;
      readonly questions: number;
      readonly distinctQuestions: number;
      readonly askers: number;
    }[];
    /** The question wordings sent to the most ministers. Top 15. */
    readonly mostRepeatedQuestions: readonly {
      readonly question: string;
      readonly sentTo: number;
      readonly example: { readonly year: number; readonly number: number };
    }[];
    /** The days on which the most questions were lodged. Top 10. */
    readonly busiestDays: readonly { readonly date: string; readonly questions: number }[];
  };
  /**
   * What kind of question gets what kind of reply. Groups, by how the question opens:
   * "How many or how much", "What or which", "Yes or no (does, has, is, will, did)", "When or on what date",
   * "Why or how", "Asks for a list of documents or advice", "Other".
   */
  readonly byQuestionOpener: readonly Breakdown[];
  /** Same question text sent to several ministers and read differently: the largest such groups. */
  readonly sameQuestionDifferentReading: readonly {
    readonly question: string;
    readonly sentTo: number;
    readonly counts: LabelCounts;
    readonly example: { readonly year: number; readonly number: number };
  }[];
};

// 250 keeps each block near 600 KB before compression, so opening one question stays quick on a phone.
export const BLOCK_SIZE = 250;
export const portfolioIndexPath = "/data/portfolios.json";
export const findingsPath = "/data/findings.json";
export const browseShardPath = (slug: string, year: number) => `/data/browse/${slug}-${year}.json`;
export const questionBlockPath = (year: number, number: number) =>
  `/data/q/${year}/${Math.floor(number / BLOCK_SIZE)}.json`;
