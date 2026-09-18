import type { Breakdown, Findings as FindingsData, LabelCounts, PortfolioIndex } from "@contract";
import { findingsPath, portfolioIndexPath } from "@contract";
import { Link } from "react-router";
import { EmptyNote, ErrorNote, LoadingNote } from "../components/data-state.tsx";
import { useDocumentTitle } from "../hooks/use-document-title.ts";
import { useJson } from "../hooks/use-json.ts";
import { formatNumber } from "../lib/format.ts";
import "./findings.css";

function totalOf(counts: LabelCounts): number {
  return (
    counts.answered +
    counts.partly_answered +
    counts.not_answered +
    counts.unclear +
    counts.noReading
  );
}

function percent(part: number, total: number): string {
  return total === 0 ? "0%" : `${Math.round((part / total) * 100)}%`;
}

const LABEL_KEYS = ["answered", "partly_answered", "not_answered", "unclear", "noReading"] as const;
const LABEL_HEADS = ["Answered", "Partly answered", "Not answered", "Unclear", "No reading"];

function BreakdownTable({
  title,
  shows,
  cannotShow,
  rows,
}: {
  readonly title: string;
  readonly shows: string;
  readonly cannotShow: string;
  readonly rows: readonly Breakdown[];
}) {
  return (
    <section className="findings-section">
      <h2>{title}</h2>
      <p>{shows}</p>
      <p style={{ color: "var(--muted)" }}>{cannotShow}</p>
      {rows.length === 0 ? (
        <EmptyNote>No data yet.</EmptyNote>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Group</th>
                {LABEL_HEADS.map((h) => (
                  <th scope="col" key={h}>
                    {h}
                  </th>
                ))}
                <th scope="col">Bar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const total = totalOf(row.counts);
                return (
                  <tr key={row.group}>
                    <td>{row.group}</td>
                    {LABEL_KEYS.map((key) => (
                      <td key={key} className="mono">
                        {formatNumber(row.counts[key])} ({percent(row.counts[key], total)})
                      </td>
                    ))}
                    <td>
                      <div className="mini-bar" aria-hidden="true">
                        {LABEL_KEYS.map((key) =>
                          row.counts[key] > 0 ? (
                            <span
                              key={key}
                              className={`mini-bar-segment mini-bar-${key}`}
                              style={{ width: `${(row.counts[key] / total) * 100}%` }}
                            />
                          ) : null,
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function Findings() {
  useDocumentTitle("What the data shows");
  const findingsState = useJson<FindingsData>(findingsPath);
  const indexState = useJson<PortfolioIndex>(portfolioIndexPath);

  return (
    <div>
      <h1>What the data shows</h1>

      {findingsState.status === "loading" && <LoadingNote />}
      {findingsState.status === "error" && <ErrorNote />}

      {findingsState.status === "ok" && (
        <>
          <section className="findings-section">
            <h2>The corpus</h2>
            <p>
              This shows the shape of the 2024–2025 written-question record before any model reading
              is applied.
            </p>
            <p style={{ color: "var(--muted)" }}>
              It cannot show whether any reading of it is correct.
            </p>
            <ul className="corpus-facts">
              <li>
                <span className="mono">{formatNumber(findingsState.data.corpus.records)}</span>{" "}
                records
              </li>
              <li>
                <span className="mono">{formatNumber(findingsState.data.corpus.answered)}</span>{" "}
                answered,{" "}
                <span className="mono">{formatNumber(findingsState.data.corpus.awaiting)}</span>{" "}
                awaiting reply,{" "}
                <span className="mono">{formatNumber(findingsState.data.corpus.withdrawn)}</span>{" "}
                withdrawn
              </li>
              <li>
                <span className="mono">
                  {formatNumber(findingsState.data.corpus.distinctQuestionTexts)}
                </span>{" "}
                distinct question texts
              </li>
              <li>
                <span className="mono">
                  {formatNumber(findingsState.data.corpus.referralReplies)}
                </span>{" "}
                replies that only point to an earlier reply,{" "}
                <span className="mono">
                  {formatNumber(findingsState.data.corpus.referralsUnresolved)}
                </span>{" "}
                unresolved
              </li>
              <li>
                <span className="mono">
                  {formatNumber(findingsState.data.corpus.attachmentOnlyReplies)}
                </span>{" "}
                attachment-only replies, not read by the model
              </li>
              <li>
                <span className="mono">
                  {formatNumber(findingsState.data.corpus.correctedReplies)}
                </span>{" "}
                replies marked as corrected
              </li>
              <li>
                Reply length:{" "}
                <span className="mono">
                  {formatNumber(findingsState.data.corpus.replyCharsMedian)}
                </span>{" "}
                characters median,{" "}
                <span className="mono">
                  {formatNumber(findingsState.data.corpus.replyCharsP95)}
                </span>{" "}
                at the 95th percentile
              </li>
            </ul>
          </section>

          <BreakdownTable
            title="By reply shape"
            shows="This shows how the model's readings differ between plain-text replies, referrals and attachment-only replies."
            cannotShow="It cannot show why a particular reply took the shape it did."
            rows={findingsState.data.byReplyShape}
          />

          <BreakdownTable
            title="By reply length"
            shows="This shows how the reading changes as replies get longer."
            cannotShow="It cannot show whether a longer reply is a better one."
            rows={findingsState.data.byReplyLength}
          />

          <BreakdownTable
            title="By number of question parts"
            shows="This shows how the reading changes as a question asks for more separate things."
            cannotShow="It cannot show which part, if any, went unanswered."
            rows={findingsState.data.byQuestionParts}
          />

          <BreakdownTable
            title="By month asked"
            shows="This shows how readings are spread across the two years covered."
            cannotShow="It cannot show whether any change over time reflects replies, questions, or the model."
            rows={findingsState.data.byMonth}
          />

          <BreakdownTable
            title="By how many ministers were asked"
            shows="This shows how the reading differs for questions sent to one minister versus sent widely."
            cannotShow="It cannot show whether a wide mailout was itself a reasonable way to ask."
            rows={findingsState.data.byFanOut}
          />

          <BreakdownTable
            title="By stock phrase"
            shows="This shows how the reading differs when a reply uses one of a small set of common stock phrases."
            cannotShow="It cannot show whether the phrase was the right or only reason for that reading."
            rows={findingsState.data.byStockPhrase}
          />

          <section className="findings-section">
            <h2>Confidence</h2>
            <p>
              This shows how the model's stated confidence on the "answered" question is spread,
              split by its choice.
            </p>
            <p style={{ color: "var(--muted)" }}>
              It cannot show whether that confidence is trustworthy; see How we checked for that.
            </p>
            {findingsState.data.confidenceHistogram.length === 0 ? (
              <EmptyNote>No data yet.</EmptyNote>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Confidence</th>
                      {LABEL_HEADS.slice(0, 4).map((h) => (
                        <th scope="col" key={h}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {findingsState.data.confidenceHistogram.map((bin) => (
                      <tr key={bin.from}>
                        <td className="mono">
                          {bin.from.toFixed(1)}–{bin.to.toFixed(1)}
                        </td>
                        <td className="mono">{formatNumber(bin.byChoice.answered)}</td>
                        <td className="mono">{formatNumber(bin.byChoice.partly_answered)}</td>
                        <td className="mono">{formatNumber(bin.byChoice.not_answered)}</td>
                        <td className="mono">{formatNumber(bin.byChoice.unclear)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="findings-section">
            <h2>Secondary readings</h2>
            <p>This shows how the four secondary questions were answered across the corpus.</p>
            <p style={{ color: "var(--muted)" }}>
              It cannot show how those readings compare to the primary label.
            </p>
            <div className="secondary-grid">
              <SecondaryCountList
                title="Gives the requested figure"
                counts={findingsState.data.secondary.givesRequestedFigure}
              />
              <SecondaryCountList
                title="Addresses every part"
                counts={findingsState.data.secondary.addressesAllParts}
              />
              <SecondaryCountList
                title="What the reply does instead"
                counts={findingsState.data.secondary.evasionType}
              />
            </div>
          </section>

          <section className="findings-section">
            <h2>Cross-checks</h2>
            <p>This shows how the five readings sit together for the same reply.</p>
            <p style={{ color: "var(--muted)" }}>
              It cannot show whether either reading, on its own, is correct.
            </p>
            {findingsState.data.crossChecks.length === 0 ? (
              <EmptyNote>No data yet.</EmptyNote>
            ) : (
              <ul>
                {findingsState.data.crossChecks.map((check) => (
                  <li key={check.statement}>
                    {check.statement}:{" "}
                    <span className="mono">
                      {formatNumber(check.numerator)} of {formatNumber(check.denominator)} (
                      {percent(check.numerator, check.denominator)})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="findings-section">
            <h2>Same question, different reading</h2>
            <p>
              This shows the same question text sent to several ministers and read differently by
              the model.
            </p>
            <p style={{ color: "var(--muted)" }}>
              It cannot show which of the differing readings, if any, is the correct one.
            </p>
            {findingsState.data.sameQuestionDifferentReading.length === 0 ? (
              <EmptyNote>No data yet.</EmptyNote>
            ) : (
              <ul>
                {findingsState.data.sameQuestionDifferentReading.map((group) => (
                  <li key={`${group.example.year}-${group.example.number}`}>
                    “{group.question}” — sent to{" "}
                    <span className="mono">{formatNumber(group.sentTo)}</span> ministers.{" "}
                    <Link to={`/q/${group.example.year}/${group.example.number}`}>
                      See an example
                    </Link>
                    .
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <section className="findings-section">
        <h2>What it cost to read everything</h2>
        <p>This shows the actual cost and speed of running the full pipeline.</p>
        <p style={{ color: "var(--muted)" }}>
          It cannot show whether that cost is worth it; that is a judgement call.
        </p>
        {indexState.status === "loading" && <LoadingNote />}
        {indexState.status === "error" && <ErrorNote />}
        {indexState.status === "ok" && (
          <ul className="corpus-facts">
            <li>
              <span className="mono">{formatNumber(indexState.data.run.pairsJudged)}</span> pairs
              read, <span className="mono">{formatNumber(indexState.data.run.pairsFailed)}</span>{" "}
              failed
            </li>
            <li>
              <span className="mono">{formatNumber(indexState.data.run.inputTokens)}</span> input
              tokens, <span className="mono">{formatNumber(indexState.data.run.outputTokens)}</span>{" "}
              output tokens
            </li>
            <li>
              Estimated cost:{" "}
              <span className="mono">US${indexState.data.run.estimatedCostUsd.toFixed(2)}</span>
            </li>
            <li>
              Median time per pair:{" "}
              <span className="mono">{formatNumber(indexState.data.run.latencyMsP50)} ms</span>{" "}
              (95th percentile{" "}
              <span className="mono">{formatNumber(indexState.data.run.latencyMsP95)} ms</span>)
            </li>
          </ul>
        )}
      </section>
    </div>
  );
}

function SecondaryCountList({
  title,
  counts,
}: {
  readonly title: string;
  readonly counts: Readonly<Record<string, number>>;
}) {
  const entries = Object.entries(counts);
  return (
    <div>
      <h3 className="secondary-heading">{title}</h3>
      {entries.length === 0 ? (
        <EmptyNote>No data yet.</EmptyNote>
      ) : (
        <ul className="secondary-count-list">
          {entries.map(([key, value]) => (
            <li key={key}>
              {key.replaceAll("_", " ")}: <span className="mono">{formatNumber(value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
