import type { BrowseShard, Label } from "@contract";
import { browseShardPath, LABELS } from "@contract";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { EmptyNote, ErrorNote, LoadingNote } from "../components/data-state.tsx";
import { LabelKey } from "../components/label-key.tsx";
import { PageBanner } from "../components/page-banner.tsx";
import { TwoPane } from "../components/two-pane.tsx";
import { useDocumentTitle } from "../hooks/use-document-title.ts";
import { useJson } from "../hooks/use-json.ts";
import { LABEL_WORDING, NO_READING_WORDING, TERMS } from "../lib/copy.ts";
import { formatDate } from "../lib/format.ts";
import "./browse-portfolio.css";

const PAGE_SIZE = 50;
type FilterValue = Label | "no_reading" | "all";

export function BrowsePortfolio() {
  const { slug = "", year = "" } = useParams();
  const yearNumber = Number(year);
  const state = useJson<BrowseShard>(browseShardPath(slug, yearNumber));
  const [filter, setFilter] = useState<FilterValue>("all");
  const [page, setPage] = useState(1);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const focusResults = useRef(false);

  useEffect(() => {
    if (focusResults.current && page > 0) {
      resultsHeading.current?.focus();
      focusResults.current = false;
    }
  }, [page]);

  useDocumentTitle(state.status === "ok" ? state.data.portfolio : "Browse the results");

  const filtered = useMemo(() => {
    if (state.status !== "ok") return [];
    if (filter === "all") return state.data.rows;
    if (filter === "no_reading") return state.data.rows.filter((r) => r.label === null);
    return state.data.rows.filter((r) => r.label === filter);
  }, [state, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changePage(nextPage: number) {
    focusResults.current = true;
    setPage(nextPage);
  }

  function setFilterAndResetPage(value: FilterValue) {
    setFilter(value);
    setPage(1);
  }

  const hasRows = state.status === "ok" && state.data.rows.length > 0;

  return (
    <>
      <PageBanner>
        <p className="banner-back">
          <Link to="/browse">&larr; Browse the results</Link>
        </p>
        {state.status === "ok" && (
          <>
            <h1>{state.data.portfolio}</h1>
            <p>Written questions sent to this portfolio in {year}.</p>
          </>
        )}
      </PageBanner>
      <TwoPane
        side={
          <>
            {hasRows && (
              <div>
                <p className="control-note" id="filter-note">
                  Show only questions with this reading:
                </p>
                <fieldset className="control-group" aria-describedby="filter-note">
                  <legend className="visually-hidden">Filter by reading</legend>
                  <button
                    type="button"
                    className="button"
                    aria-pressed={filter === "all"}
                    onClick={() => setFilterAndResetPage("all")}
                  >
                    All
                  </button>
                  {LABELS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      className="button"
                      aria-pressed={filter === l}
                      onClick={() => setFilterAndResetPage(l)}
                    >
                      {LABEL_WORDING[l]?.shownAs}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="button"
                    aria-pressed={filter === "no_reading"}
                    onClick={() => setFilterAndResetPage("no_reading")}
                  >
                    {NO_READING_WORDING.shownAs}
                  </button>
                </fieldset>
              </div>
            )}
            <div className="card">
              <LabelKey />
            </div>
            <p className="muted">
              {TERMS.wq} Each row is one question. Open a number to read the question, the reply and
              the reading side by side. The table cannot tell you whether a reading is right, and it
              is not a score for the minister who replied.
            </p>
          </>
        }
      >
        {state.status === "loading" && <LoadingNote />}
        {state.status === "error" && <ErrorNote />}
        {state.status === "ok" && !hasRows && (
          <EmptyNote>No questions for this portfolio in {year}.</EmptyNote>
        )}
        {state.status === "ok" && hasRows && (
          <>
            <h2
              ref={resultsHeading}
              tabIndex={-1}
              className="results-heading"
              id="question-results"
            >
              Questions
            </h2>
            <p role="status" aria-atomic="true" className="results-summary">
              {filtered.length === 0
                ? "No questions match that filter."
                : `${filtered.length} questions. Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)}. Page ${page} of ${pageCount}.`}
            </p>
            {filtered.length > 0 && (
              <>
                {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll the table region. */}
                <section className="table-scroll" aria-labelledby="question-results" tabIndex={0}>
                  <table>
                    <caption className="section-label">
                      {filtered.length === state.data.rows.length
                        ? "All questions"
                        : "Questions matching the filter"}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Question number</th>
                        <th scope="col">Date asked</th>
                        <th scope="col">Question</th>
                        <th scope="col">Reading</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row) => {
                        const wording = row.label ? LABEL_WORDING[row.label] : NO_READING_WORDING;
                        return (
                          <tr key={row.number}>
                            <th scope="row" className="mono">
                              <Link to={`/q/${row.year}/${row.number}`}>{row.number}</Link>
                            </th>
                            <td className="mono">{formatDate(row.dateAsked)}</td>
                            <td>{row.question}</td>
                            <td>
                              <span className="chip" data-label={row.label ?? undefined}>
                                {wording?.shownAs}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>

                {pageCount > 1 && (
                  <nav className="pagination" aria-label="Pagination">
                    <button
                      type="button"
                      className="button"
                      disabled={page <= 1}
                      onClick={() => changePage(Math.max(1, page - 1))}
                    >
                      Previous
                    </button>
                    <span className="mono">
                      Page {page} of {pageCount}
                    </span>
                    <button
                      type="button"
                      className="button"
                      disabled={page >= pageCount}
                      onClick={() => changePage(Math.min(pageCount, page + 1))}
                    >
                      Next
                    </button>
                  </nav>
                )}
              </>
            )}
          </>
        )}
      </TwoPane>
    </>
  );
}
