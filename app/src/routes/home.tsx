import type { Findings, PortfolioIndex } from "@contract";
import { findingsPath, portfolioIndexPath } from "@contract";
import { useState } from "react";
import { Link } from "react-router";
import { EmptyNote, ErrorNote, LoadingNote } from "../components/data-state.tsx";
import { LabelKey } from "../components/label-key.tsx";
import { PreviewNotice } from "../components/preview-notice.tsx";
import { StackedLabelBar } from "../components/stacked-label-bar.tsx";
import { useDocumentTitle } from "../hooks/use-document-title.ts";
import { useJson } from "../hooks/use-json.ts";
import {
  INTRO,
  KNOW_BEFORE_YOU_READ,
  NEW_HERE,
  TERMS,
  WHAT_THIS_IS,
  WHAT_THIS_IS_NOT,
  WHAT_WE_FOUND_SO_FAR_HEADING,
  WORKED_EXAMPLE,
  WORKFLOW,
} from "../lib/copy.ts";
import { formatNumber } from "../lib/format.ts";
import type { HeadlineCard } from "../lib/headlines.ts";
import { buildHeadlines } from "../lib/headlines.ts";
import "./home.css";

function HeadlineCardView({ card }: { readonly card: HeadlineCard }) {
  return (
    <li className="card headline-card">
      <p className="headline-tag">{card.tag}</p>
      {card.kind === "number" ? (
        <p className="headline-value mono">{card.value}</p>
      ) : (
        <StackedLabelBar counts={card.counts} label="Every reading" />
      )}
      <p>{card.sentence}</p>
      <p style={{ color: "var(--muted)" }}>{card.cannotTell}</p>
      <p>
        <Link to={card.linkTo}>{card.linkText}</Link>
      </p>
    </li>
  );
}

export function Home() {
  useDocumentTitle("Start here");
  const state = useJson<PortfolioIndex>(portfolioIndexPath);
  const findingsState = useJson<Findings>(findingsPath);
  const [mode, setMode] = useState<"all" | "distinct">("all");

  return (
    <div>
      <section className="home-intro prose">
        <p className="section-label">A civic experiment with Jev</p>
        <h1>{INTRO.heading}</h1>
        <p className="intro-summary">{INTRO.body}</p>
        <nav className="entry-links intro-links" aria-label="Choose your starting point">
          <a className="card entry-link" href="#worked-example">
            {INTRO.civicLink}
          </a>
          <Link className="card entry-link" to="/method">
            {INTRO.builderLink}
          </Link>
        </nav>
      </section>
      <PreviewNotice />
      <section className="card prose new-here">
        <h2>{NEW_HERE.heading}</h2>
        {NEW_HERE.paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </section>

      <section
        id="worked-example"
        tabIndex={-1}
        className="card prose worked-example"
        aria-labelledby="example-heading"
      >
        <h2 id="example-heading">{WORKED_EXAMPLE.heading}</h2>
        <p>One question, one reply, and what came back. {WORKED_EXAMPLE.standfirst}</p>
        <h3>The question, {WORKED_EXAMPLE.questionRef}</h3>
        <p>{WORKED_EXAMPLE.question}</p>
        <h3>The reply</h3>
        <p>{WORKED_EXAMPLE.reply}</p>
        <h3>The assessment we asked Jev to make</h3>
        <p>
          Does the reply give the information asked for? The possible answers are answered, partly
          answered, not answered and unclear.
        </p>
        <h3>What Jev gave back</h3>
        <p>{WORKED_EXAMPLE.outcome}</p>
        <h3>Our interpretation, not a Jev explanation</h3>
        <p>{WORKED_EXAMPLE.why}</p>
        <p>
          <a href={WORKED_EXAMPLE.officialUrl}>
            Read this question and reply on Parliament's website
          </a>
        </p>
        <p>
          <Link to="/method">See the full method and checks</Link>
        </p>
      </section>

      <section className="prose">
        <h2>{WHAT_THIS_IS.heading}</h2>
        {WHAT_THIS_IS.paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </section>

      <section className="workflow-section" aria-labelledby="workflow-heading">
        <h2 id="workflow-heading">{WORKFLOW.heading}</h2>
        <ol className="workflow-list">
          {WORKFLOW.steps.map((step) => (
            <li key={step.heading}>
              <h3>{step.heading}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {state.status === "ok" && findingsState.status === "ok" && (
        <section className="card headlines">
          <h2>{WHAT_WE_FOUND_SO_FAR_HEADING}</h2>
          <ul className="headline-grid">
            {buildHeadlines(findingsState.data, state.data).map((card) => (
              <HeadlineCardView key={card.id} card={card} />
            ))}
          </ul>
        </section>
      )}

      <section className="card headline-bar">
        <h2>Published readings across the record</h2>
        <p>
          Each band is one reading. The wider the band, the more replies got that reading. The four
          model readings and the separate “No reading” category are explained under the bar.
        </p>
        <p style={{ color: "var(--muted)" }}>
          It cannot tell you whether any one reading is right, and it is not a score for anyone.
        </p>
        {state.status === "loading" && <LoadingNote />}
        {state.status === "error" && <ErrorNote />}
        {state.status === "ok" &&
          (() => {
            const totals = state.data.totals;
            const counts = mode === "all" ? totals.all : totals.distinctQuestions;
            const total =
              counts.answered +
              counts.partly_answered +
              counts.not_answered +
              counts.unclear +
              counts.noReading;
            if (total === 0) return <EmptyNote>No data yet.</EmptyNote>;
            const sum = (c: typeof counts) => Object.values(c).reduce((a, b) => a + b, 0);
            const allTotal = sum(totals.all);
            const noReadingShare = Math.round((counts.noReading / total) * 100);
            return (
              <>
                <p>{TERMS.distinctQuestion}</p>
                <fieldset className="toggle-row">
                  <legend className="visually-hidden">
                    Count every question, or each distinct question once
                  </legend>
                  <button
                    type="button"
                    className="button"
                    aria-pressed={mode === "all"}
                    onClick={() => setMode("all")}
                  >
                    Every question ({formatNumber(allTotal)})
                  </button>
                  <button
                    type="button"
                    className="button"
                    aria-pressed={mode === "distinct"}
                    onClick={() => setMode("distinct")}
                  >
                    Each distinct question once ({formatNumber(sum(totals.distinctQuestions))})
                  </button>
                </fieldset>
                <StackedLabelBar
                  counts={counts}
                  label={mode === "all" ? "Every question" : "Each distinct question once"}
                />
                <p role="status">
                  {formatNumber(total - counts.noReading)} of {formatNumber(total)} questions in
                  this view have a published reading.
                  {noReadingShare > 0 &&
                    ` About ${noReadingShare} in 100 have no reading published. This includes excluded, withheld or unavailable results.`}
                </p>
                <LabelKey />
              </>
            );
          })()}
      </section>

      <section className="prose">
        <h2>{WHAT_THIS_IS_NOT.heading}</h2>
        {WHAT_THIS_IS_NOT.paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </section>

      <section className="prose">
        <h2>{KNOW_BEFORE_YOU_READ.heading}</h2>
        <ul>
          {KNOW_BEFORE_YOU_READ.items.map((item) => (
            <li key={item.slice(0, 24)}>{item}</li>
          ))}
        </ul>
      </section>

      <nav className="entry-links" aria-label="Explore the site">
        <Link className="card entry-link" to="/browse">
          Browse the results
        </Link>
        <Link className="card entry-link" to="/findings">
          What the data shows
        </Link>
        <Link className="card entry-link" to="/method">
          How Jev works and how we check it
        </Link>
      </nav>
    </div>
  );
}
