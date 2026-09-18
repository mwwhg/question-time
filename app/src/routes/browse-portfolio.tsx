import type { BrowseShard, Label } from "@contract";
import { browseShardPath, LABELS } from "@contract";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { EmptyNote, ErrorNote, LoadingNote } from "../components/data-state.tsx";
import { LabelKey } from "../components/label-key.tsx";
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

  useDocumentTitle(state.status === "ok" ? state.data.portfolio : "Browse the results");

  const filtered = useMemo(() => {
    if (state.status !== "ok") return [];
    if (filter === "all") return state.data.rows;
    if (filter === "no_reading") return state.data.rows.filter((r) => r.label === null);
    return state.data.rows.filter((r) => r.label === filter);
  }, [state, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function setFilterAndResetPage(value: FilterValue) {
    setFilter(value);
    setPage(1);
  }

  return (
    <div>
      <p>
        <Link to="/browse">&larr; Browse the results</Link>
      </p>

      {state.status === "loading" && <LoadingNote />}
      {state.status === "error" && <ErrorNote />}

      {state.status === "ok" && (
        <>
          <h1>{state.data.portfolio}</h1>
          <p>Written questions sent to this portfolio in {year}.</p>
          <p style={{ color: "var(--muted)", maxWidth: "70ch" }}>
            {TERMS.wq} Each row is one question. Open a number to read the question, the reply and
            the reading side by side. The table cannot tell you whether a reading is right, and it
            is not a score for the minister who replied.
          </p>
          <LabelKey />

          {state.data.rows.length === 0 ? (
            <EmptyNote>No questions for this portfolio in {year}.</EmptyNote>
          ) : (
            <>
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

              {filtered.length === 0 ? (
                <EmptyNote>No questions match that filter.</EmptyNote>
              ) : (
                <>
                  <div className="table-scroll">
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
                              <td className="mono">
                                <Link to={`/q/${row.year}/${row.number}`}>{row.number}</Link>
                              </td>
                              <td className="mono">{formatDate(row.dateAsked)}</td>
                              <td>{row.question}</td>
                              <td>{wording?.shownAs}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {pageCount > 1 && (
                    <nav className="pagination" aria-label="Pagination">
                      <button
                        type="button"
                        className="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                      >
                        Next
                      </button>
                    </nav>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
