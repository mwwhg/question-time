import type { Breakdown, Findings as FindingsData, LabelCounts, PortfolioIndex } from "@contract";
import { findingsPath, portfolioIndexPath } from "@contract";
import { useState } from "react";
import { Link } from "react-router";
import { EmptyNote, ErrorNote, LoadingNote } from "../components/data-state.tsx";
import { LabelKey } from "../components/label-key.tsx";
import { PageBanner } from "../components/page-banner.tsx";
import { RunFacts } from "../components/run-facts.tsx";
import { TwoPane } from "../components/two-pane.tsx";
import { useDocumentTitle } from "../hooks/use-document-title.ts";
import { useJson } from "../hooks/use-json.ts";
import { CIVICS, TERMS, WHY_NO_BEST_TABLE } from "../lib/copy.ts";
import { formatNumber } from "../lib/format.ts";
import "./findings.css";

const ASKERS_SHOWN_BY_DEFAULT = 15;

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

/** "about 1 in 4", "about 4 in 10": a share a reader can hold in their head without a percentage. */
function aboutOneIn(part: number, total: number): string {
  if (total === 0 || part === 0) return "none of them";
  const share = part / total;
  if (share >= 0.95) return "nearly all of them";
  if (share >= 0.15) return `about ${Math.round(share * 10)} in 10`;
  return `about 1 in ${Math.round(1 / share)}`;
}

/** The three reply shapes, in the words the site uses for them elsewhere. */
const GROUP_WORDING: Readonly<Record<string, string>> = {
  text: "answers in its own words",
  referral: "points to an earlier reply",
  "attachment-only": "says the answer is in an attached file",
};

function groupWording(group: string): string {
  return GROUP_WORDING[group] ?? group;
}

/** The raw option names from the question set, in the words the site uses for them. */
const SECONDARY_KEY_WORDING: Readonly<Record<string, string>> = {
  yes: "Yes, the reply states the figure",
  no: "No, the reply does not state it",
  no_figure_requested: "The question did not ask for a figure",
  all_parts: "Every part",
  some_parts: "Some parts",
  no_parts: "No parts",
  single_part_question: "The question asked only one thing",
  related_topic: "Talks about a related topic",
  restates_policy: "Restates government policy",
  refers_elsewhere: "Points somewhere else without giving the content",
  none: "None of those",
};

const LABEL_KEYS = ["answered", "partly_answered", "not_answered", "unclear", "noReading"] as const;
const LABEL_HEADS = ["Answered", "Partly answered", "Not answered", "Unclear", "No reading"];

function BreakdownTable({
  id,
  title,
  shows,
  cannotShow,
  rows,
}: {
  readonly id: string;
  readonly title: string;
  readonly shows: string;
  readonly cannotShow: string;
  readonly rows: readonly Breakdown[];
}) {
  return (
    <section id={id} tabIndex={-1} className="findings-section">
      <h2>{title}</h2>
      <p>{shows}</p>
      {rows[0] !== undefined && totalOf(rows[0].counts) > 0 && (
        <p>
          How to read it: the first row covers {formatNumber(totalOf(rows[0].counts))} questions in
          the group “{groupWording(rows[0].group)}”. Of those,{" "}
          {aboutOneIn(rows[0].counts.answered, totalOf(rows[0].counts))} were read as answered,
          which is {formatNumber(rows[0].counts.answered)} questions. Every other row reads the same
          way.
        </p>
      )}
      <p className="muted">{cannotShow}</p>
      {rows.length === 0 ? (
        <EmptyNote>No data yet.</EmptyNote>
      ) : (
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll this named table region.
        <section className="table-scroll" aria-label={title} tabIndex={0}>
          <table>
            <caption>{title}: counts and shares within each group</caption>
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
                    <th scope="row">{groupWording(row.group)}</th>
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
        </section>
      )}
    </section>
  );
}

function AskersTable({ askers }: { readonly askers: FindingsData["civics"]["askers"] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? askers : askers.slice(0, ASKERS_SHOWN_BY_DEFAULT);
  return (
    <>
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll this named table region. */}
      <section className="table-scroll" aria-label="Questions by member" tabIndex={0}>
        <table>
          <caption>Question volumes by member, not a measure of effectiveness</caption>
          <thead>
            <tr>
              <th scope="col">Member</th>
              <th scope="col">Party when asking</th>
              <th scope="col">Questions</th>
              <th scope="col">Distinct questions</th>
              <th scope="col">Portfolios asked</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((asker) => (
              <tr key={asker.name}>
                <th scope="row">{asker.name}</th>
                <td>{asker.parties.join(", then ")}</td>
                <td className="mono">{formatNumber(asker.questions)}</td>
                <td className="mono">{formatNumber(asker.distinctQuestions)}</td>
                <td className="mono">{formatNumber(asker.portfoliosAsked)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {!expanded && askers.length > ASKERS_SHOWN_BY_DEFAULT && (
        <button type="button" className="button" onClick={() => setExpanded(true)}>
          {CIVICS.showAllMembers(formatNumber(askers.length))}
        </button>
      )}
    </>
  );
}

function PortfolioVolumesTable({
  portfolioVolumes,
  browseYear,
}: {
  readonly portfolioVolumes: FindingsData["civics"]["portfolioVolumes"];
  readonly browseYear: number | null;
}) {
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll this named table region.
    <section className="table-scroll" aria-label="Questions by portfolio" tabIndex={0}>
      <table>
        <caption>Question volumes received by portfolio</caption>
        <thead>
          <tr>
            <th scope="col">Portfolio</th>
            <th scope="col">Questions received</th>
            <th scope="col">Distinct questions</th>
            <th scope="col">Members who asked</th>
          </tr>
        </thead>
        <tbody>
          {portfolioVolumes.map((p) => (
            <tr key={p.slug}>
              <th scope="row">
                {browseYear === null ? (
                  p.name
                ) : (
                  <Link to={`/browse/${p.slug}/${browseYear}`}>{p.name}</Link>
                )}
              </th>
              <td className="mono">{formatNumber(p.questions)}</td>
              <td className="mono">{formatNumber(p.distinctQuestions)}</td>
              <td className="mono">{formatNumber(p.askers)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CivicsSection({
  civics,
  browseYear,
}: {
  readonly civics: FindingsData["civics"];
  readonly browseYear: number | null;
}) {
  return (
    <section id="civic-record" tabIndex={-1} className="findings-section">
      <h2>{CIVICS.sectionHeading}</h2>
      <p>
        These counts describe who asked questions and where they sent them. They come from the
        public record, not Jev’s judgements about replies.
      </p>

      <h3>{CIVICS.askersHeading}</h3>
      <p className="muted">{CIVICS.askersNote}</p>
      {civics.askers.length === 0 ? (
        <EmptyNote>No data yet.</EmptyNote>
      ) : (
        <AskersTable askers={civics.askers} />
      )}

      <h3>{CIVICS.portfolioVolumesHeading}</h3>
      <p className="muted">{CIVICS.portfolioVolumesNote}</p>
      {civics.portfolioVolumes.length === 0 ? (
        <EmptyNote>No data yet.</EmptyNote>
      ) : (
        <PortfolioVolumesTable portfolioVolumes={civics.portfolioVolumes} browseYear={browseYear} />
      )}

      <div className="cream-panel">
        <h3>{WHY_NO_BEST_TABLE.heading}</h3>
        <p>
          {(() => {
            const [before, after] = WHY_NO_BEST_TABLE.body.split("open any portfolio");
            return (
              <>
                {before}
                <Link to="/browse">open any portfolio</Link>
                {after}
              </>
            );
          })()}
        </p>
      </div>

      <h3>{CIVICS.mostRepeatedHeading}</h3>
      {civics.mostRepeatedQuestions.length === 0 ? (
        <EmptyNote>No data yet.</EmptyNote>
      ) : (
        <ul>
          {civics.mostRepeatedQuestions.map((q) => (
            <li key={`${q.example.year}-${q.example.number}`}>
              “{q.question}”. Sent to <span className="mono">{formatNumber(q.sentTo)}</span>{" "}
              ministers.{" "}
              <Link to={`/q/${q.example.year}/${q.example.number}`}>Read one example</Link>.
            </li>
          ))}
        </ul>
      )}

      <h3>{CIVICS.busiestDaysHeading}</h3>
      {civics.busiestDays.length === 0 ? (
        <EmptyNote>No data yet.</EmptyNote>
      ) : (
        <ul>
          {civics.busiestDays.map((d) => (
            <li key={d.date}>
              {d.date}: <span className="mono">{formatNumber(d.questions)}</span> questions lodged
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Findings() {
  useDocumentTitle("What the data shows");
  const findingsState = useJson<FindingsData>(findingsPath);
  const indexState = useJson<PortfolioIndex>(portfolioIndexPath);

  return (
    <>
      <PageBanner>
        <h1>What the data shows</h1>
        <p>
          Start with the public record, then explore Jev’s judgements about replies. The civic
          tables count questions and people. The model tables count readings: what Jev said about a
          reply. A pattern can suggest where to investigate; it does not establish that the readings
          are correct.
        </p>
        <p>
          To check a reading against its question, reply and official source, open a portfolio in{" "}
          <Link to="/browse">Browse the results</Link> and pick one.
        </p>
      </PageBanner>
      <TwoPane
        side={
          <>
            <nav className="contents-nav findings-contents" aria-label="On this page">
              <a href="#run">Time and estimated cost</a>
              {findingsState.status === "ok" && (
                <>
                  <a href="#civic-record">Who asks and who receives</a>
                  <a href="#corpus">The source record</a>
                  <a href="#reply-shape">Patterns in the readings</a>
                  <a href="#confidence">Model confidence</a>
                  <a href="#secondary">Other assessment questions</a>
                  <a href="#cross-checks">Agreement between readings</a>
                  <a href="#same-question">Same question, different replies</a>
                </>
              )}
            </nav>
            <div className="card">
              <LabelKey />
            </div>
          </>
        }
      >
        <section id="run" tabIndex={-1} className="findings-section">
          <h2>Time and estimated model cost</h2>
          <p>
            These are the recorded time and usage for pairs processed in this run. Asking the same
            questions repeatedly makes large-scale comparison possible. This does not mean every
            record has a published reading.
          </p>
          <p className="muted">
            It cannot show whether that cost is worth it. That is a judgement call. {TERMS.token}
          </p>
          {indexState.status === "loading" && <LoadingNote />}
          {indexState.status === "error" && <ErrorNote />}
          {indexState.status === "ok" && <RunFacts run={indexState.data.run} />}
        </section>

        {findingsState.status === "loading" && <LoadingNote />}
        {findingsState.status === "error" && <ErrorNote />}

        {findingsState.status === "ok" && (
          <>
            <CivicsSection
              civics={findingsState.data.civics}
              browseYear={
                indexState.status === "ok"
                  ? (indexState.data.years[indexState.data.years.length - 1] ?? null)
                  : null
              }
            />

            <section id="corpus" tabIndex={-1} className="findings-section">
              <h2>What the record looks like</h2>
              <p>
                This is the shape of the whole written-question record from 2024 to 18 September
                2026, counted by ordinary code before the model read anything.
              </p>
              <p className="muted">It cannot show whether any reading of it is correct.</p>
              <ul className="corpus-facts">
                <li>
                  <span className="mono">{formatNumber(findingsState.data.corpus.records)}</span>{" "}
                  written questions were recorded from 2024 to 18 September 2026
                </li>
                <li>
                  <span className="mono">{formatNumber(findingsState.data.corpus.answered)}</span>{" "}
                  of them had a reply by the time we copied the record,{" "}
                  <span className="mono">{formatNumber(findingsState.data.corpus.awaiting)}</span>{" "}
                  were still waiting for one, and{" "}
                  <span className="mono">{formatNumber(findingsState.data.corpus.withdrawn)}</span>{" "}
                  were taken back by the MP who asked
                </li>
                <li>
                  <span className="mono">
                    {formatNumber(findingsState.data.corpus.distinctQuestionTexts)}
                  </span>{" "}
                  of those are different wordings. The same question is often sent to many ministers
                  on the same day, so the number of different questions is much smaller than the
                  number of questions
                </li>
                <li>
                  <span className="mono">
                    {formatNumber(findingsState.data.corpus.referralReplies)}
                  </span>{" "}
                  replies do not answer in their own words. They point at a reply the minister gave
                  earlier, so code fetches that earlier reply and gives the model both. Of those,{" "}
                  <span className="mono">
                    {formatNumber(findingsState.data.corpus.referralsUnresolved)}
                  </span>{" "}
                  could not be found, mostly because they point back to 2023
                </li>
                <li>
                  <span className="mono">
                    {formatNumber(findingsState.data.corpus.attachmentOnlyReplies)}
                  </span>{" "}
                  replies say the answer is in an attached file. We did not open the files, so those
                  questions show no reading
                </li>
                <li>
                  <span className="mono">
                    {formatNumber(findingsState.data.corpus.correctedReplies)}
                  </span>{" "}
                  replies were sent again as a correction by the minister
                </li>
                <li>
                  Reply length, counted in characters. The middle reply is{" "}
                  <span className="mono">
                    {formatNumber(findingsState.data.corpus.replyCharsMedian)}
                  </span>{" "}
                  characters long, and{" "}
                  <span className="mono">
                    {formatNumber(findingsState.data.corpus.replyCharsP95)}
                  </span>{" "}
                  characters is the length that 95 in 100 replies stay under. Most replies are
                  short: one or two sentences
                </li>
              </ul>
            </section>

            <BreakdownTable
              id="reply-shape"
              title="Replies that answer, replies that point elsewhere, replies in a file"
              shows="Replies come in three kinds. Most answer in their own words. Some only point at a reply the minister gave earlier. Some say the answer is in an attached file, which we did not open. This shows how the readings differ between the three."
              cannotShow="It cannot show why a particular reply took the shape it did."
              rows={findingsState.data.byReplyShape}
            />

            <BreakdownTable
              id="reply-length"
              title="Short replies and long replies"
              shows="Replies are grouped by how many words they contain. This shows how the readings change as replies get longer."
              cannotShow="It cannot show whether a longer reply is a better one."
              rows={findingsState.data.byReplyLength}
            />

            <BreakdownTable
              id="question-parts"
              title="Questions that ask one thing, and questions that ask several"
              shows="Code estimates how many separate things a question asks using text rules. These groups may include miscounts, so use them to explore patterns rather than as exact measures."
              cannotShow="It cannot show which part, if any, went unanswered."
              rows={findingsState.data.byQuestionParts}
            />

            <BreakdownTable
              id="months"
              title="Month by month"
              shows="This shows how the readings are spread across the twenty-four months covered."
              cannotShow="It cannot show whether any change over time reflects replies, questions, or the model."
              rows={findingsState.data.byMonth}
            />

            <BreakdownTable
              id="fan-out"
              title="Questions sent to one minister, and questions sent to many"
              shows="The same question is often posted to many ministers at once. This shows how the readings differ between a question sent to one minister and a question sent to a great many."
              cannotShow="It cannot show whether a wide mailout was itself a reasonable way to ask."
              rows={findingsState.data.byFanOut}
            />

            <BreakdownTable
              id="stock-phrases"
              title="Replies that use a stock phrase"
              shows={`${TERMS.stockPhrase} This shows how the readings differ when a reply uses one of them.`}
              cannotShow="It cannot show whether the phrase was the right or only reason for that reading."
              rows={findingsState.data.byStockPhrase}
            />

            <BreakdownTable
              id="question-openers"
              title={CIVICS.openerHeading}
              shows={CIVICS.openerShows}
              cannotShow={CIVICS.openerCannotShow}
              rows={findingsState.data.byQuestionOpener}
            />

            <section id="confidence" tabIndex={-1} className="findings-section">
              <h2>How firmly the model settled on its answer</h2>
              <p>
                {TERMS.confidence} Each row is a band of that number, from 0.0 at the top to 1.0 at
                the bottom. The four columns count how many readings in that band got each answer. A
                reading in the last row is one the model settled on very firmly.
              </p>
              <p className="muted">
                It cannot show whether those firm readings are right more often than the unsure
                ones. That check is not done yet. See{" "}
                <Link to="/method">How Jev works and how we check it</Link>.
              </p>
              {findingsState.data.confidenceHistogram.length === 0 ? (
                <EmptyNote>No data yet.</EmptyNote>
              ) : (
                <section
                  className="table-scroll"
                  aria-label="Model confidence bands"
                  // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll this named table region.
                  tabIndex={0}
                >
                  <table>
                    <caption>Readings grouped by model confidence, not measured accuracy</caption>
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
                          <th scope="row" className="mono">
                            {bin.from.toFixed(1)} to {bin.to.toFixed(1)}
                          </th>
                          <td className="mono">{formatNumber(bin.byChoice.answered)}</td>
                          <td className="mono">{formatNumber(bin.byChoice.partly_answered)}</td>
                          <td className="mono">{formatNumber(bin.byChoice.not_answered)}</td>
                          <td className="mono">{formatNumber(bin.byChoice.unclear)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}
            </section>

            <section id="secondary" tabIndex={-1} className="findings-section">
              <h2>Other assessment questions</h2>
              <p>
                Besides “does the reply give the information asked for”, the model was asked four
                more questions about each processed pair. These are the totals for three of them.
              </p>
              <p className="muted">
                It cannot show how these answers line up with the main reading for the same reply.
                The cross-checks below do some of that.
              </p>
              <div className="secondary-grid">
                <SecondaryCountList
                  title="Does the reply give the figure asked for?"
                  counts={findingsState.data.secondary.givesRequestedFigure}
                />
                <SecondaryCountList
                  title="Does the reply address every part of the question?"
                  counts={findingsState.data.secondary.addressesAllParts}
                />
                <SecondaryCountList
                  title="What the reply does instead"
                  counts={findingsState.data.secondary.evasionType}
                />
              </div>
            </section>

            <section id="cross-checks" tabIndex={-1} className="findings-section">
              <h2>Do the five readings agree with each other?</h2>
              <p>
                Each line below takes a group of replies and asks what a second reading said about
                the same replies. The five questions are answered independently, so they can
                disagree.
              </p>
              <p className="muted">
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
                      , or {aboutOneIn(check.numerator, check.denominator)}.
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section id="same-question" tabIndex={-1} className="findings-section">
              <h2>Same question, different reading</h2>
              <p>
                When one question goes to many ministers, the replies differ, and so do the
                readings. These are the largest such groups. Follow the link to read one of them.
              </p>
              <p className="muted">
                It cannot show which of the differing readings, if any, is the correct one.
              </p>
              {findingsState.data.sameQuestionDifferentReading.length === 0 ? (
                <EmptyNote>No data yet.</EmptyNote>
              ) : (
                <ul>
                  {findingsState.data.sameQuestionDifferentReading.map((group) => (
                    <li key={`${group.example.year}-${group.example.number}`}>
                      “{group.question}”. Sent to{" "}
                      <span className="mono">{formatNumber(group.sentTo)}</span> ministers. Read as
                      answered <span className="mono">{formatNumber(group.counts.answered)}</span>{" "}
                      times, partly answered{" "}
                      <span className="mono">{formatNumber(group.counts.partly_answered)}</span>{" "}
                      times, not answered{" "}
                      <span className="mono">{formatNumber(group.counts.not_answered)}</span> times.{" "}
                      <Link to={`/q/${group.example.year}/${group.example.number}`}>
                        Read one of these questions and its reply
                      </Link>
                      .
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </TwoPane>
    </>
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
              {SECONDARY_KEY_WORDING[key] ?? key.replaceAll("_", " ")}:{" "}
              <span className="mono">{formatNumber(value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
