// Pure: turns findings.json + portfolios.json into the Start page's headline cards. No fetching,
// no formatting side effects beyond string templates, so it is easy to point a test at directly.
import type { Findings, LabelCounts, PortfolioIndex } from "@contract";
import { HEADLINE_TAG_COUNTED, HEADLINE_TAG_MODEL } from "./copy.ts";
import { formatNInHundred, formatNumber } from "./format.ts";

export type HeadlineTag = typeof HEADLINE_TAG_MODEL | typeof HEADLINE_TAG_COUNTED;

export type NumberCard = {
  readonly kind: "number";
  readonly id: string;
  readonly value: string;
  readonly sentence: string;
  readonly cannotTell: string;
  readonly tag: HeadlineTag;
  readonly linkTo: string;
  readonly linkText: string;
};

export type LabelSplitCard = {
  readonly kind: "labelSplit";
  readonly id: string;
  readonly counts: LabelCounts;
  readonly sentence: string;
  readonly cannotTell: string;
  readonly tag: HeadlineTag;
  readonly linkTo: string;
  readonly linkText: string;
};

export type HeadlineCard = NumberCard | LabelSplitCard;

function findCrossCheck(
  findings: Findings,
  statementPrefix: string,
): { numerator: number; denominator: number } | undefined {
  return findings.crossChecks.find((c) => c.statement.startsWith(statementPrefix));
}

function shareInHundred(numerator: number, denominator: number): string {
  return denominator === 0 ? "0 in 100" : formatNInHundred(numerator / denominator);
}

/** "over about 3 days" once it's at least one day; under that, hours read better than "0 days". */
function runDurationPhrase(index: PortfolioIndex): string {
  const first = Date.parse(index.run.firstJudgementAt);
  const last = Date.parse(index.run.lastJudgementAt);
  if (Number.isNaN(first) || Number.isNaN(last) || last <= first) return "in under an hour";
  const hours = (last - first) / (1000 * 60 * 60);
  if (hours < 1) return "in under an hour";
  if (hours < 24) return `over about ${formatNumber(Math.round(hours))} hours`;
  return `over about ${formatNumber(Math.round(hours / 24))} days`;
}

/** Builds the 5-7 Start page headline cards. Every value is read live; none is hard-coded. */
export function buildHeadlines(findings: Findings, index: PortfolioIndex): HeadlineCard[] {
  const cards: HeadlineCard[] = [];

  cards.push({
    kind: "number",
    id: "askers",
    value: formatNumber(findings.corpus.answered),
    sentence: `written questions got a reply. They were asked by ${formatNumber(findings.civics.askers.length)} different MPs.`,
    cannotTell: "This counts questions asked, not whether the replies were any good.",
    tag: HEADLINE_TAG_COUNTED,
    linkTo: "/findings",
    linkText: "See who asked the most",
  });

  const repeatedShare =
    findings.corpus.records === 0
      ? 0
      : Math.round(
          ((findings.corpus.records - findings.corpus.distinctQuestionTexts) /
            findings.corpus.records) *
            100,
        );
  cards.push({
    kind: "number",
    id: "repeated-wording",
    value: `${repeatedShare}%`,
    sentence: "of written questions repeat a wording already sent to another minister.",
    cannotTell:
      "This can't tell you whether sending the same wording to many ministers was a reasonable way to ask it.",
    tag: HEADLINE_TAG_COUNTED,
    linkTo: "/findings",
    linkText: "See the most repeated questions",
  });

  cards.push({
    kind: "number",
    id: "referrals",
    value: shareInHundred(findings.corpus.referralReplies, findings.corpus.answered),
    sentence:
      "of replies do not answer in their own words. They only point to a reply the minister gave earlier.",
    cannotTell:
      "This can't tell you whether the earlier reply, once read together with the question, actually answered it.",
    tag: HEADLINE_TAG_COUNTED,
    linkTo: "/findings",
    linkText: "See how replies are shaped",
  });

  cards.push({
    kind: "labelSplit",
    id: "label-split",
    counts: index.totals.all,
    sentence: "This is how the model read every reply, split across the four possible readings.",
    cannotTell: "This is the model's own reading. It has not yet been checked against people.",
    tag: HEADLINE_TAG_MODEL,
    linkTo: "/findings",
    linkText: "See the breakdowns",
  });

  const figureCheck = findCrossCheck(findings, "Questions asking for a figure");
  if (figureCheck !== undefined) {
    cards.push({
      kind: "number",
      id: "figures-given",
      value: shareInHundred(figureCheck.numerator, figureCheck.denominator),
      sentence:
        "Of questions that ask for a number, amount or date, this is how often the model read the reply as giving it.",
      cannotTell:
        "This is the model's own reading of whether a figure was given, not a check that the figure is correct.",
      tag: HEADLINE_TAG_MODEL,
      linkTo: "/findings",
      linkText: "See the cross-checks",
    });
  }

  const partsCheck = findCrossCheck(findings, "Multi-part questions");
  if (partsCheck !== undefined) {
    cards.push({
      kind: "number",
      id: "all-parts-addressed",
      value: shareInHundred(partsCheck.numerator, partsCheck.denominator),
      sentence:
        "Of questions that ask more than one thing, this is how often the model read the reply as addressing every part.",
      cannotTell:
        "This is the model's own reading. It does not say which part, if any, was missed.",
      tag: HEADLINE_TAG_MODEL,
      linkTo: "/findings",
      linkText: "See the cross-checks",
    });
  }

  cards.push({
    kind: "number",
    id: "cost-and-time",
    value: `$${index.run.estimatedCostUsd.toFixed(2)}`,
    sentence: `is what it cost to have a model read every one of these replies, ${runDurationPhrase(index)}.`,
    cannotTell: "This can't tell you whether that cost is worth it. That is a judgement call.",
    tag: HEADLINE_TAG_COUNTED,
    linkTo: "/method",
    linkText: "See the run in numbers",
  });

  return cards;
}
