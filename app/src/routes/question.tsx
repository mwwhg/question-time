import type { ChoiceReading, QuestionBlock, QuestionDetail } from "@contract";
import { questionBlockPath } from "@contract";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { EmptyNote, ErrorNote, LoadingNote } from "../components/data-state.tsx";
import { PageBanner } from "../components/page-banner.tsx";
import { PreviewNotice } from "../components/preview-notice.tsx";
import { useCheckedAgainstPeople } from "../context/preview-context.tsx";
import { useDocumentTitle } from "../hooks/use-document-title.ts";
import { useJson } from "../hooks/use-json.ts";
import {
  EVASION_TYPE_HEADING,
  HOW_TO_READ_A_READING,
  LABEL_WORDING,
  NO_READING_REASON_TEXT,
  READING_IT_YOURSELF_CLOSE,
  READING_IT_YOURSELF_INTRO,
  TERMS,
} from "../lib/copy.ts";
import { formatDate, formatNInHundred } from "../lib/format.ts";
import { QS_V1_INSTRUCTIONS } from "../lib/qs-v1-texts.ts";
import "./question.css";

const SHORTENED_NOTE = "Shortened here. The full text is on the official record.";

const CHOICE_LABELS: Readonly<Record<string, string>> = {
  answered: "Answered",
  partly_answered: "Partly answered",
  not_answered: "Not answered",
  unclear: "Unclear",
  yes: "Yes",
  no: "No",
  no_figure_requested: "No figure requested",
  all_parts: "All parts",
  some_parts: "Some parts",
  no_parts: "No parts",
  single_part_question: "Single-part question",
  related_topic: "Talks about a related topic",
  restates_policy: "Restates government policy",
  refers_elsewhere: "Refers elsewhere without giving the content",
  none: "None of the above",
};

function withParty(name: string, party: string | null): string {
  return party === null ? name : `${name}, ${party}`;
}

function prettyChoice(choice: string): string {
  return CHOICE_LABELS[choice] ?? choice.replaceAll("_", " ");
}

export function Question() {
  const { year = "", number = "" } = useParams();
  const yearNumber = Number(year);
  const numberNumber = Number(number);
  const state = useJson<QuestionBlock>(questionBlockPath(yearNumber, numberNumber));

  const item =
    state.status === "ok" ? state.data.items.find((i) => i.number === numberNumber) : undefined;

  useDocumentTitle(item ? `WQ ${item.number} (${item.year})` : `WQ ${number}`);

  if (state.status === "loading")
    return (
      <Bare>
        <LoadingNote />
      </Bare>
    );
  if (state.status === "error")
    return (
      <Bare>
        <ErrorNote />
      </Bare>
    );
  if (!item)
    return (
      <Bare>
        <EmptyNote>That question could not be found.</EmptyNote>
      </Bare>
    );

  return <QuestionView item={item} />;
}

/** States with no question to show have no banner, so they carry the preview notice themselves. */
function Bare({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <PreviewNotice />
      <div className="wrap page-body">{children}</div>
    </>
  );
}

function QuestionView({ item }: { readonly item: QuestionDetail }) {
  const checkedAgainstPeople = useCheckedAgainstPeople();
  const displayLabel = item.reading
    ? item.reading.answered.unsure
      ? "unclear"
      : item.reading.answered.choice
    : null;

  return (
    <article>
      <PageBanner>
        <p className="banner-back">
          <Link to={`/browse/${item.portfolioSlug}/${item.year}`}>
            See the other questions sent to {item.portfolio} in {item.year}
          </Link>
        </p>
        <h1>
          Written question {item.number} of {item.year}
        </h1>
        <p className="mono question-header">
          {formatDate(item.dateAsked)} · {item.portfolio}
        </p>
        <p>
          asked by {withParty(item.askedBy, item.askedByParty)} &middot; reply from{" "}
          {withParty(item.minister, item.ministerParty)}
        </p>
        <p className="banner-meta">
          {TERMS.wq} {TERMS.portfolio}
        </p>
      </PageBanner>

      <div className="wrap page-body question-grid">
        <div className="question-col">
          <div className="source-box">
            <h2 className="section-label">The question</h2>
            <p className="question-text">{item.question}</p>
          </div>

          <div className="source-box">
            <h2 className="section-label">The reply</h2>
            <p className="reply-text">{item.reply}</p>
            {item.replyTruncated && <p className="mono shortened-note">{SHORTENED_NOTE}</p>}
          </div>

          {item.referredReply !== null && (
            <div className="source-box">
              <h2 className="section-label">The earlier reply it points to</h2>
              <p className="small">{TERMS.referral}</p>
              <p className="reply-text">{item.referredReply}</p>
              {item.referredReplyTruncated && (
                <p className="mono shortened-note">{SHORTENED_NOTE}</p>
              )}
            </div>
          )}

          <div className="card reading-yourself">
            <h2 className="section-label">Reading it yourself</h2>
            <p className="small muted">{READING_IT_YOURSELF_INTRO}</p>
            <ul className="bullets">
              {readingItYourselfBullets(item).map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            {item.features.stockPhrases.length > 0 && (
              <p className="small muted">{TERMS.stockPhrase}</p>
            )}
            <p>{READING_IT_YOURSELF_CLOSE}</p>
          </div>
        </div>

        <div className="question-col">
          {item.reading === null ? (
            <div className="gold-box">
              <h2 className="section-label">The model's reading</h2>
              <p>{item.noReadingReason ? NO_READING_REASON_TEXT[item.noReadingReason] : null}</p>
            </div>
          ) : (
            <ReadingView
              reading={item.reading}
              displayLabel={displayLabel}
              checkedAgainstPeople={checkedAgainstPeople}
            />
          )}

          <div className="provenance">
            <h2 className="section-label">Where this came from</h2>
            <p>
              <a href={item.provenance.sourceUrl} target="_blank" rel="noopener noreferrer">
                Read the full text on the official record
              </a>
            </p>
            <p>
              We copied this question and reply from the official record on{" "}
              {formatDate(item.provenance.retrievedAt)} and did not change the words.
            </p>
            <p>
              {item.provenance.evaluatedAt
                ? `The model read it on ${formatDate(item.provenance.evaluatedAt)}.`
                : "No reading date is published for this pair."}{" "}
              The exact version of the model and of the five questions is recorded below, so this
              reading can be reproduced.
            </p>
            <p className="mono provenance-versions">
              Model {item.provenance.model} · question set {item.provenance.questionSetVersion} (
              {item.provenance.questionSetHash}) · features {item.provenance.featuresVersion}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

/** `referralChain` entries are stored as "{year}-{number}". docs/site-copy.md shows them as "WQ n (year)". */
function formatPointer(entry: string | undefined): string | null {
  if (entry === undefined) return null;
  const [year, number] = entry.split("-");
  return year && number ? `WQ ${number} (${year})` : entry;
}

function readingItYourselfBullets(item: QuestionDetail): string[] {
  const bullets: string[] = [];
  bullets.push(
    item.features.questionParts === 1
      ? "Code estimates that this question asks one thing, based on its wording and punctuation."
      : `Code estimates that this question asks ${item.features.questionParts} separate things, based on its wording and punctuation.`,
  );
  bullets.push(
    `The reply is ${item.features.replyWords} ${item.features.replyWords === 1 ? "word" : "words"} long.`,
  );
  bullets.push(`The reply ${item.features.hasNumber ? "contains" : "does not contain"} a number.`);
  if (item.replyShape === "referral" && item.referredReply !== null) {
    const pointer = formatPointer(item.referralChain[0]);
    bullets.push(
      pointer
        ? `The reply points to an earlier reply, ${pointer}. We show that earlier reply above. ${item.reading ? "The model read both replies." : "Both replies are available for assessment."}`
        : `The reply points to an earlier reply. We show that earlier reply above. ${item.reading ? "The model read both replies." : "Both replies are available for assessment."}`,
    );
  }
  for (const phrase of item.features.stockPhrases) {
    bullets.push(`The reply uses the phrase “${phrase}”.`);
  }
  return bullets;
}

function ReadingView({
  reading,
  displayLabel,
  checkedAgainstPeople,
}: {
  readonly reading: NonNullable<QuestionDetail["reading"]>;
  readonly displayLabel: string | null;
  readonly checkedAgainstPeople: boolean;
}) {
  const unsure = reading.answered.unsure;
  const wording = displayLabel ? LABEL_WORDING[displayLabel] : undefined;

  const boxClass = unsure ? "gold-box disabled" : "gold-box";

  return (
    <>
      <div className={boxClass}>
        <h2 className="section-label">The model's reading</h2>
        <p className="reading-label">
          <span className="chip chip-large" data-label={displayLabel ?? undefined}>
            {wording?.shownAs ?? displayLabel}
          </span>
        </p>
        {wording && <p>{wording.meaning}</p>}
        {unsure && (
          <p className="muted">
            The model was not sure enough to say, so we count this as unclear.
          </p>
        )}

        <p className="small muted">{HOW_TO_READ_A_READING}</p>

        <ChoiceBars reading={reading.answered} />

        <p className="reading-confidence">
          {checkedAgainstPeople
            ? `How sure: ${formatNInHundred(reading.answered.confidence)}`
            : `The model settled on that answer at ${formatNInHundred(reading.answered.confidence)}. That is its own number and says nothing about whether the answer is right.`}
        </p>
      </div>

      <div className={`${boxClass} secondary-readings`}>
        <p className="secondary-intro">
          Jev was asked four more questions about this reply. Each answer is followed by the share
          out of 100 the model gave it.
        </p>
        <SecondaryChoice
          heading={QS_V1_INSTRUCTIONS[1].label}
          reading={reading.givesRequestedFigure}
        />
        <SecondaryChoice
          heading={QS_V1_INSTRUCTIONS[2].label}
          reading={reading.addressesAllParts}
        />
        <div className="secondary-reading">
          <h3 className="secondary-heading">{QS_V1_INSTRUCTIONS[3].label}</h3>
          <p className="mono">
            Yes: {formatNInHundred(reading.declinesWithReason)}. No:{" "}
            {formatNInHundred(1 - reading.declinesWithReason)}.
          </p>
        </div>
        {displayLabel !== "answered" && (
          <SecondaryChoice heading={EVASION_TYPE_HEADING} reading={reading.evasionType} />
        )}
      </div>
    </>
  );
}

function ChoiceBars({ reading }: { readonly reading: ChoiceReading }) {
  return (
    <ul className="choice-bars">
      {Object.entries(reading.probabilities).map(([choice, probability]) => (
        <li key={choice} className="choice-bar-row" data-choice={choice}>
          <span className="choice-bar-label">{prettyChoice(choice)}</span>
          <span className="choice-bar-track" aria-hidden="true">
            <span
              className="choice-bar-fill"
              style={{ width: `${Math.round(probability * 100)}%` }}
            />
          </span>
          <span className="mono choice-bar-value">{formatNInHundred(probability)}</span>
        </li>
      ))}
    </ul>
  );
}

function SecondaryChoice({
  heading,
  reading,
}: {
  readonly heading: string;
  readonly reading: ChoiceReading;
}) {
  return (
    <div className="secondary-reading">
      <h3 className="secondary-heading">{heading}</h3>
      <p className="mono">
        {prettyChoice(reading.choice)}: {formatNInHundred(reading.confidence)}
      </p>
    </div>
  );
}
