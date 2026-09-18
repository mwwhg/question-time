/** Bump when any feature's definition changes; judgements are keyed on it. */
export const FEATURES_VERSION = "f1";

/** Everything here is exactly computable. The models never count or pattern-match these themselves. */
export type Features = {
  readonly version: typeof FEATURES_VERSION;
  readonly replyChars: number;
  readonly replyWords: number;
  readonly hasNumber: boolean;
  readonly stockPhrases: readonly string[];
  readonly questionParts: number;
};

// Fixed, literal, case-insensitive. Not an attempt at exhaustive coverage of every stock phrase
// in the corpus — just the ones the brief named. Exported so publish/build.ts can use the same
// fixed list as Findings.byStockPhrase's group order, instead of restating it.
export const STOCK_PHRASES = [
  "not in the public interest",
  "commercially sensitive",
  "operational matter",
  "I am advised",
  "publicly available",
  "would require substantial",
  "I refer the member",
  "no responsibility",
];

const NUMBER_PATTERN = /\d|\b(?:nil|none|zero)\b/i;

// "; if so" / "; if not" / "; and" / ", and if" join two asks into one sentence; a lettered or
// numbered list ("(a)", "(1)") enumerates asks directly. "broken down by" is a request for
// how to slice one answer, not a second ask, so it is deliberately absent from both patterns.
const CONNECTOR_PATTERN = /;\s*if so|;\s*if not|;\s*and|,\s*and if/gi;
const LIST_MARKER_PATTERN = /\(([a-z]|\d+)\)/gi;

/**
 * ponytail: regex/counting heuristic, not a parse of the question's grammar — it undercounts
 * asks phrased without any of these connectors or markers. Ceiling; upgrade path is a
 * hand-checked sample at Gate 3 if the miscount rate matters there.
 */
function countQuestionParts(questionText: string): number {
  const connectorMatches = questionText.match(CONNECTOR_PATTERN)?.length ?? 0;
  const listMarkerMatches = questionText.match(LIST_MARKER_PATTERN)?.length ?? 0;
  return Math.max(1, connectorMatches + 1, listMarkerMatches);
}

export function computeFeatures(input: { questionText: string; replyText: string }): Features {
  const { questionText, replyText } = input;
  const words = replyText.split(/\s+/).filter((w) => w.length > 0);
  const matchedStockPhrases = STOCK_PHRASES.filter((phrase) =>
    replyText.toLowerCase().includes(phrase.toLowerCase()),
  );

  return {
    version: FEATURES_VERSION,
    replyChars: replyText.length,
    replyWords: words.length,
    hasNumber: NUMBER_PATTERN.test(replyText),
    stockPhrases: matchedStockPhrases,
    questionParts: countQuestionParts(questionText),
  };
}
