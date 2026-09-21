// Pure: turns findings.json + portfolios.json into the Start page's headline cards. No fetching,
// no formatting side effects beyond string templates, so it is easy to point a test at directly.
import type { Findings, LabelCounts, PortfolioIndex } from "@contract";
import {
  HEADLINE_CARDS,
  HEADLINE_TAG_COUNTED,
  HEADLINE_TAG_MODEL,
  HEADLINE_TAG_RUN,
} from "./copy.ts";
import { formatNInHundred, formatNumber } from "./format.ts";

export type HeadlineTag =
  | typeof HEADLINE_TAG_MODEL
  | typeof HEADLINE_TAG_COUNTED
  | typeof HEADLINE_TAG_RUN;

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

/** Working time only. A stop and restart in the middle is not reading time, and the method page reports it separately. */
function runDurationPhrase(index: PortfolioIndex): string {
  const minutes = Math.round(index.run.activeSeconds / 60);
  if (minutes < 60) return `in about ${formatNumber(minutes)} minutes of reading`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourWord = hours === 1 ? "hour" : "hours";
  return rest === 0
    ? `in about ${hours} ${hourWord} of reading`
    : `in about ${hours} ${hourWord} ${rest} minutes of reading`;
}

/** Builds the 5-7 Start page headline cards. Every value is read live; none is hard-coded. */
export function buildHeadlines(findings: Findings, index: PortfolioIndex): HeadlineCard[] {
  const cards: HeadlineCard[] = [];

  cards.push({
    kind: "number",
    id: "askers",
    value: formatNumber(findings.corpus.answered),
    sentence: HEADLINE_CARDS.askers.sentence(formatNumber(findings.civics.askers.length)),
    cannotTell: HEADLINE_CARDS.askers.cannotTell,
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
    sentence: HEADLINE_CARDS.repeatedWording.sentence,
    cannotTell: HEADLINE_CARDS.repeatedWording.cannotTell,
    tag: HEADLINE_TAG_COUNTED,
    linkTo: "/findings",
    linkText: "See the most repeated questions",
  });

  cards.push({
    kind: "number",
    id: "referrals",
    value: shareInHundred(findings.corpus.referralReplies, findings.corpus.answered),
    sentence: HEADLINE_CARDS.referrals.sentence,
    cannotTell: HEADLINE_CARDS.referrals.cannotTell,
    tag: HEADLINE_TAG_COUNTED,
    linkTo: "/findings",
    linkText: "See how replies are shaped",
  });

  cards.push({
    kind: "labelSplit",
    id: "label-split",
    counts: index.totals.all,
    sentence: HEADLINE_CARDS.labelSplit.sentence,
    cannotTell: HEADLINE_CARDS.labelSplit.cannotTell,
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
      sentence: HEADLINE_CARDS.figuresGiven.sentence,
      cannotTell: HEADLINE_CARDS.figuresGiven.cannotTell,
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
      sentence: HEADLINE_CARDS.allPartsAddressed.sentence,
      cannotTell: HEADLINE_CARDS.allPartsAddressed.cannotTell,
      tag: HEADLINE_TAG_MODEL,
      linkTo: "/findings",
      linkText: "See the cross-checks",
    });
  }

  cards.push({
    kind: "number",
    id: "cost-and-time",
    value: `$${index.run.estimatedCostUsd.toFixed(2)}`,
    sentence: HEADLINE_CARDS.costAndTime.sentence({
      pairs: formatNumber(index.run.pairsJudged),
      duration: runDurationPhrase(index),
    }),
    cannotTell: HEADLINE_CARDS.costAndTime.cannotTell,
    tag: HEADLINE_TAG_RUN,
    linkTo: "/method",
    linkText: "See the run in numbers",
  });

  return cards;
}
