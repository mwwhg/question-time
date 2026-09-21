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
  HOME_BAR,
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
      <p className="muted">{card.cannotTell}</p>
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
    <>
      <div className="home-hero">
        <div className="wrap home-hero-inner on-dark">
          <section className="home-intro">
            <p className="section-label">A civic experiment with Jev</p>
            <h1>{INTRO.heading}</h1>
            <p className="intro-summary">{INTRO.body}</p>
            <nav className="intro-links" aria-label="Choose your starting point">
              <a className="button" href="#worked-example">
                {INTRO.civicLink}
              </a>
              <Link className="button" to="/method">
                {INTRO.builderLink}
              </Link>
            </nav>
          </section>

          <section className="card headline-bar">
            <h2 className="section-label">Published readings across the record</h2>
            <p>{HOME_BAR.howToRead}</p>
            <p className="muted">{HOME_BAR.cannotTell}</p>
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
                    <p className="small">{TERMS.distinctQuestion}</p>
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
                      {HOME_BAR.published({
                        withReading: formatNumber(total - counts.noReading),
                        total: formatNumber(total),
                      })}
                      {noReadingShare > 0 && HOME_BAR.noReadingShare(noReadingShare)}
                    </p>
                    <LabelKey />
                  </>
                );
              })()}
          </section>
        </div>
        <svg
          className="home-hills"
          viewBox="0 0 1360 64"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            className="hill-back"
            d="M0 64V38C160 14 330 10 520 30S900 56 1090 30s200-22 270-12v46z"
          />
          <path className="hill-mid" d="M0 64V50C200 26 420 28 640 44s420 14 720-16v36z" />
          <path className="hill-front" d="M0 64V58C240 40 460 48 700 56s440-2 660-22v30z" />
        </svg>
      </div>
      <PreviewNotice />

      <div className="wrap page-body">
        <section className="card new-here">
          <h2>{NEW_HERE.heading}</h2>
          {NEW_HERE.paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </section>

        <section
          id="worked-example"
          tabIndex={-1}
          className="card worked-example"
          aria-labelledby="example-heading"
        >
          <h2 id="example-heading">{WORKED_EXAMPLE.heading}</h2>
          <p className="prose">
            {WORKED_EXAMPLE.homeLead} {WORKED_EXAMPLE.standfirst}
          </p>
          <div className="worked-grid">
            <div className="worked-col">
              <div className="source-box">
                <h3 className="section-label">The question, {WORKED_EXAMPLE.questionRef}</h3>
                <p className="question-text">{WORKED_EXAMPLE.question}</p>
              </div>
              <div className="source-box">
                <h3 className="section-label">The reply</h3>
                <p>{WORKED_EXAMPLE.reply}</p>
              </div>
            </div>
            <div className="worked-col">
              <div>
                <h3 className="section-label">The assessment we asked Jev to make</h3>
                <p>{WORKED_EXAMPLE.homeAsked}</p>
              </div>
              <div className="gold-box">
                <h3 className="section-label">What Jev gave back</h3>
                <p>{WORKED_EXAMPLE.outcome}</p>
              </div>
              <div>
                <h3 className="section-label">Our interpretation, not a Jev explanation</h3>
                <p>{WORKED_EXAMPLE.why}</p>
              </div>
              <p className="worked-links">
                <a className="button" href={WORKED_EXAMPLE.officialUrl}>
                  Read this question and reply on Parliament's website
                </a>
                <Link className="button button-primary" to="/method">
                  See the full method and checks
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section className="prose">
          <h2>{WHAT_THIS_IS.heading}</h2>
          {WHAT_THIS_IS.paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </section>

        <section className="workflow-section" aria-labelledby="workflow-heading">
          <h2 id="workflow-heading" className="section-label">
            {WORKFLOW.heading}
          </h2>
          <ol className="workflow-list">
            {WORKFLOW.steps.map((step) => (
              <li key={step.heading} className="card">
                <h3>{step.heading}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {state.status === "ok" && findingsState.status === "ok" && (
          <section className="headlines">
            <h2 className="section-label">{WHAT_WE_FOUND_SO_FAR_HEADING}</h2>
            <ul className="headline-grid">
              {buildHeadlines(findingsState.data, state.data).map((card) => (
                <HeadlineCardView key={card.id} card={card} />
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="home-band">
        <div className="wrap home-band-inner">
          <section className="card">
            <h2>{WHAT_THIS_IS_NOT.heading}</h2>
            {WHAT_THIS_IS_NOT.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </section>

          <section>
            <h2 className="section-label">{KNOW_BEFORE_YOU_READ.heading}</h2>
            <ul className="bullets">
              {KNOW_BEFORE_YOU_READ.items.map((item) => (
                <li key={item.slice(0, 24)}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="wrap">
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
    </>
  );
}
