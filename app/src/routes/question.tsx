import type { ChoiceReading, QuestionBlock, QuestionDetail } from "@contract";
import { questionBlockPath } from "@contract";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { EmptyNote, ErrorNote, LoadingNote } from "../components/data-state.tsx";
import { PageBanner } from "../components/page-banner.tsx";
import { useCheckedAgainstPeople } from "../context/preview-context.tsx";
import { useDocumentTitle } from "../hooks/use-document-title.ts";
import { useJson } from "../hooks/use-json.ts";
import {
  CHOICE_WORDING,
  EVASION_TYPE_HEADING,
  HOW_TO_READ_A_READING,
  LABEL_WORDING,
  NO_READING_REASON_TEXT,
  QUESTION_PAGE,
  READING_IT_YOURSELF,
  READING_IT_YOURSELF_CLOSE,
  READING_IT_YOURSELF_INTRO,
  TERMS,
} from "../lib/copy.ts";
import { formatDate, formatNInHundred } from "../lib/format.ts";
import { QS_V1_INSTRUCTIONS } from "../lib/qs-v1-texts.ts";
import "./question.css";

const SHORTENED_NOTE = QUESTION_PAGE.shortened;

function withParty(name: string, party: string | null): string {
  return party === null ? name : `${name}, ${party}`;
}

function prettyChoice(choice: string): string {
  return LABEL_WORDING[choice]?.shownAs ?? CHOICE_WORDING[choice] ?? choice.replaceAll("_", " ");
}

export function Question() {
  const { year = "", number = "" } = useParams();
  const yearNumber = Number(year);
  const numberNumber = Number(number);
  const state = useJson<QuestionBlock>(questionBlockPath(yearNumber, numberNumber));

  const item =
    state.status === "ok" ? state.data.items.find((i) => i.number === numberNumber) : undefined;

  useDocumentTitle(item ? `WQ ${item.number} (${item.year})` : `WQ ${number}`);
  const heading = `Written question ${number} of ${year}`;

  if (state.status === "loading") return <Pending heading={heading} note={<LoadingNote />} />;
  if (state.status === "error") return <Pending heading={heading} note={<ErrorNote />} />;
  if (!item) {
    return (
      <Pending heading={heading} note={<EmptyNote>That question could not be found.</EmptyNote>} />
    );
  }

  return <QuestionView item={item} />;
}

/** The h1 comes from the URL, so the banner and the notice under it hold their place while the
    block loads instead of mounting above content that has already painted. */
function Pending({ heading, note }: { readonly heading: string; readonly note: ReactNode }) {
  return (
    <>
      <PageBanner>
        <h1>{heading}</h1>
      </PageBanner>
      <div className="wrap page-body">{note}</div>
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
            <p>{QUESTION_PAGE.copied(formatDate(item.provenance.retrievedAt))}</p>
            <p>
              {item.provenance.evaluatedAt
                ? QUESTION_PAGE.modelReadOn(formatDate(item.provenance.evaluatedAt))
                : QUESTION_PAGE.noReadingDate}{" "}
              {QUESTION_PAGE.versions}
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
  bullets.push(READING_IT_YOURSELF.parts(item.features.questionParts));
  bullets.push(READING_IT_YOURSELF.length(item.features.replyWords));
  bullets.push(READING_IT_YOURSELF.number(item.features.hasNumber));
  if (item.replyShape === "referral" && item.referredReply !== null) {
    bullets.push(
      READING_IT_YOURSELF.referral({
        pointer: formatPointer(item.referralChain[0]),
        modelReadBoth: item.reading !== null,
      }),
    );
  }
  for (const phrase of item.features.stockPhrases) {
    bullets.push(READING_IT_YOURSELF.stockPhrase(phrase));
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
        {unsure && <p className="muted">{QUESTION_PAGE.countedAsUnclear}</p>}

        <p className="small muted">{HOW_TO_READ_A_READING}</p>

        <ChoiceBars reading={reading.answered} />

        <p className="reading-confidence">
          {checkedAgainstPeople
            ? QUESTION_PAGE.confidenceChecked(formatNInHundred(reading.answered.confidence))
            : QUESTION_PAGE.confidenceUnchecked(formatNInHundred(reading.answered.confidence))}
        </p>
      </div>

      <div className={`${boxClass} secondary-readings`}>
        <p className="secondary-intro">{QUESTION_PAGE.secondaryIntro}</p>
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
