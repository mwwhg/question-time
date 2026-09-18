import type { Findings, PortfolioIndex } from "@contract";
import { findingsPath, portfolioIndexPath } from "@contract";
import { useState } from "react";
import { Link } from "react-router";
import { EmptyNote, ErrorNote, LoadingNote } from "../components/data-state.tsx";
import { LabelKey } from "../components/label-key.tsx";
import { StackedLabelBar } from "../components/stacked-label-bar.tsx";
import { useDocumentTitle } from "../hooks/use-document-title.ts";
import { useJson } from "../hooks/use-json.ts";
import {
  KNOW_BEFORE_YOU_READ,
  NEW_HERE,
  TERMS,
  WHAT_THIS_IS,
  WHAT_THIS_IS_NOT,
  WHAT_WE_FOUND_SO_FAR_HEADING,
  WORKED_EXAMPLE,
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
      <section className="card prose new-here">
        <h1>{NEW_HERE.heading}</h1>
        {NEW_HERE.paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
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
        <p className="section-label">Every written question and reply, 2024 and 2025</p>
        <p>
          Each band is one reading. The wider the band, the more replies got that reading. The five
          readings are explained under the bar.
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
                    Every question ({formatNumber(total)})
                  </button>
                  <button
                    type="button"
                    className="button"
                    aria-pressed={mode === "distinct"}
                    onClick={() => setMode("distinct")}
                  >
                    Each distinct question once
                  </button>
                </fieldset>
                <StackedLabelBar
                  counts={counts}
                  label={mode === "all" ? "Every question" : "Each distinct question once"}
                />
                {noReadingShare >= 10 && (
                  <p>
                    About {noReadingShare} in 100 of the bar is “No reading”. The model has read{" "}
                    {formatNumber(total - counts.noReading)} of these {formatNumber(total)} so far.
                  </p>
                )}
                <LabelKey />
              </>
            );
          })()}
      </section>

      <section className="card prose worked-example">
        <h2>{WORKED_EXAMPLE.heading}</h2>
        <p>One question, one reply, and what came back. {WORKED_EXAMPLE.standfirst}</p>
        <p className="section-label">The question, {WORKED_EXAMPLE.questionRef}</p>
        <p>{WORKED_EXAMPLE.question}</p>
        <p className="section-label">The reply</p>
        <p>{WORKED_EXAMPLE.reply}</p>
        <p className="section-label">What Jev gave back</p>
        <p>{WORKED_EXAMPLE.outcome}</p>
        <p>
          <Link to="/method">See the whole example, and how we checked the readings</Link>
        </p>
      </section>

      <section className="prose">
        <h2>{WHAT_THIS_IS.heading}</h2>
        {WHAT_THIS_IS.paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
        <p>
          Reading a few hundred replies by hand means choosing which few hundred. Counting words
          cannot tell whether a reply is about the question.{" "}
          <Link to="/method">Why we read every reply</Link>.
        </p>
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
          How we checked
        </Link>
      </nav>
    </div>
  );
}
