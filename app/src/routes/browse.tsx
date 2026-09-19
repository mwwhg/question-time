import type { LabelCounts, PortfolioIndex } from "@contract";
import { portfolioIndexPath } from "@contract";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { EmptyNote, ErrorNote, LoadingNote } from "../components/data-state.tsx";
import { LabelKey } from "../components/label-key.tsx";
import { PageBanner } from "../components/page-banner.tsx";
import { StackedLabelBar } from "../components/stacked-label-bar.tsx";
import { TwoPane } from "../components/two-pane.tsx";
import { useDocumentTitle } from "../hooks/use-document-title.ts";
import { useJson } from "../hooks/use-json.ts";
import { BROWSE_COMPARISON_NOTE, TERMS } from "../lib/copy.ts";
import { formatNumber } from "../lib/format.ts";
import "./browse.css";

function totalOf(counts: LabelCounts): number {
  return (
    counts.answered +
    counts.partly_answered +
    counts.not_answered +
    counts.unclear +
    counts.noReading
  );
}

export function Browse() {
  useDocumentTitle("Browse the results");
  const state = useJson<PortfolioIndex>(portfolioIndexPath);
  const [mode, setMode] = useState<"all" | "distinct">("all");
  const [sort, setSort] = useState<"name" | "count">("name");
  const [year, setYear] = useState<number | null>(null);

  const years = state.status === "ok" ? state.data.years : [];
  const activeYear = year ?? years[years.length - 1] ?? null;

  const rows = useMemo(() => {
    if (state.status !== "ok" || activeYear === null) return [];
    return state.data.portfolios.map((portfolio) => {
      const byYear = portfolio.byYear[String(activeYear)];
      const counts = byYear ? (mode === "all" ? byYear.all : byYear.distinctQuestions) : null;
      return { portfolio, counts };
    });
  }, [state, activeYear, mode]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (sort === "name") {
      copy.sort((a, b) => a.portfolio.name.localeCompare(b.portfolio.name));
    } else {
      copy.sort((a, b) => (b.counts ? totalOf(b.counts) : 0) - (a.counts ? totalOf(a.counts) : 0));
    }
    return copy;
  }, [rows, sort]);

  return (
    <>
      <PageBanner>
        <h1>Browse the results</h1>
        <p>Pick a portfolio and read the questions sent to it. {TERMS.portfolio}</p>
      </PageBanner>
      <TwoPane
        side={
          <>
            {state.status === "ok" && activeYear !== null && (
              <div className="browse-controls">
                <fieldset className="control-group control-row">
                  <legend className="section-label">Year</legend>
                  {years.map((y) => (
                    <button
                      key={y}
                      type="button"
                      className="button"
                      aria-pressed={y === activeYear}
                      onClick={() => setYear(y)}
                    >
                      {y}
                    </button>
                  ))}
                </fieldset>
                <fieldset className="control-group">
                  <legend className="section-label">
                    Count every question, or each distinct question once
                  </legend>
                  <button
                    type="button"
                    className="button"
                    aria-pressed={mode === "all"}
                    onClick={() => setMode("all")}
                  >
                    Every question
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
                <fieldset className="control-group">
                  <legend className="section-label">Sort portfolios</legend>
                  <button
                    type="button"
                    className="button"
                    aria-pressed={sort === "name"}
                    onClick={() => setSort("name")}
                  >
                    Sort by name
                  </button>
                  <button
                    type="button"
                    className="button"
                    aria-pressed={sort === "count"}
                    onClick={() => setSort("count")}
                  >
                    Sort by number of questions
                  </button>
                </fieldset>
              </div>
            )}
            <div className="card">
              <LabelKey />
            </div>
            {state.status === "ok" && activeYear !== null && (
              <p className="muted">{TERMS.distinctQuestion}</p>
            )}
          </>
        }
      >
        <p className="prose muted">
          Each row shows one portfolio, the number of questions it received that year, and a bar
          splitting those questions by reading. {BROWSE_COMPARISON_NOTE} The bar cannot tell you
          whether any one reading is right.
        </p>
        {state.status === "loading" && <LoadingNote />}
        {state.status === "error" && <ErrorNote />}
        {state.status === "ok" && years.length === 0 && <EmptyNote>No data yet.</EmptyNote>}

        {state.status === "ok" && activeYear !== null && (
          <>
            <p role="status" aria-atomic="true" className="results-summary">
              {sorted.length} portfolios for {activeYear}. Counting{" "}
              {mode === "all" ? "every question" : "each distinct question once"}, sorted by{" "}
              {sort === "name" ? "name" : "number of questions"}.
            </p>

            {sorted.length === 0 && <EmptyNote>No portfolios for this year.</EmptyNote>}

            <ul className="portfolio-list">
              {sorted.map(({ portfolio, counts }) => (
                <li key={portfolio.slug} className="portfolio-row">
                  <Link to={`/browse/${portfolio.slug}/${activeYear}`} className="portfolio-link">
                    {portfolio.name}
                  </Link>
                  {counts ? (
                    <>
                      <p className="mono portfolio-total">
                        {formatNumber(totalOf(counts))} questions
                      </p>
                      <StackedLabelBar counts={counts} label={portfolio.name} />
                    </>
                  ) : (
                    <EmptyNote>No data for {activeYear}.</EmptyNote>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </TwoPane>
    </>
  );
}
