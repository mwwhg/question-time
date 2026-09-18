import type { PortfolioIndex } from "@contract";
import { portfolioIndexPath } from "@contract";
import { useState } from "react";
import { Link } from "react-router";
import { EmptyNote, ErrorNote, LoadingNote } from "../components/data-state.tsx";
import { StackedLabelBar } from "../components/stacked-label-bar.tsx";
import { useDocumentTitle } from "../hooks/use-document-title.ts";
import { useJson } from "../hooks/use-json.ts";
import { KNOW_BEFORE_YOU_READ, WHAT_THIS_IS, WHAT_THIS_IS_NOT } from "../lib/copy.ts";
import { formatNumber } from "../lib/format.ts";
import "./home.css";

export function Home() {
  useDocumentTitle("Start here");
  const state = useJson<PortfolioIndex>(portfolioIndexPath);
  const [mode, setMode] = useState<"all" | "distinct">("all");

  return (
    <div>
      <section className="prose">
        <h1>{WHAT_THIS_IS.heading}</h1>
        {WHAT_THIS_IS.paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </section>

      <section className="card headline-bar">
        <p className="section-label">All 2024–2025 replies</p>
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
            return (
              <>
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
          How we checked
        </Link>
      </nav>
    </div>
  );
}
