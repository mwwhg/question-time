import type { PortfolioIndex } from "@contract";
import { portfolioIndexPath } from "@contract";
import { Link } from "react-router";
import { ErrorNote, LoadingNote } from "../components/data-state.tsx";
import { PageBanner } from "../components/page-banner.tsx";
import { PipelineGraph } from "../components/pipeline-graph.tsx";
import { RunFacts } from "../components/run-facts.tsx";
import { TwoPane } from "../components/two-pane.tsx";
import { useCheckedAgainstPeople } from "../context/preview-context.tsx";
import { useDocumentTitle } from "../hooks/use-document-title.ts";
import { useJson } from "../hooks/use-json.ts";
import {
  ATTRIBUTION_TEXT,
  CC_LICENCE_URL,
  CODE_NOT_MODEL,
  FIVE_QUESTIONS_INTRO,
  HUMAN_CHECK_DONE_NOTE,
  JEV_VENDOR_LIMITS_NOTE,
  METHOD_INTRO,
  METHOD_RUN_NOTE,
  NOT_CHECKED_YET_NOTE,
  NOT_DONE_YET,
  NOT_GOOD_AT,
  TERMS,
  TRICK_PAIRS,
  WHAT_JEV_IS,
  WHY_READ_EVERY_REPLY,
  WORKED_EXAMPLE,
} from "../lib/copy.ts";
import { QS_V1_INSTRUCTIONS } from "../lib/qs-v1-texts.ts";
import "./method.css";

const CONTROLS = [
  {
    draw: "1 (discarded, see below)",
    method: "Jev",
    swapped: "8 of 10",
    swappedHigh: "7 of 10",
    echo: "10 of 10",
  },
  { draw: "2", method: "Jev", swapped: "10 of 10", swappedHigh: "10 of 10", echo: "10 of 10" },
  { draw: "2", method: "Rules", swapped: "2 of 10", swappedHigh: "2 of 10", echo: "0 of 10" },
];

export function Method() {
  useDocumentTitle("How Jev works and how we check it");
  const checkedAgainstPeople = useCheckedAgainstPeople();
  const indexState = useJson<PortfolioIndex>(portfolioIndexPath);

  return (
    <>
      <PageBanner>
        <h1>How Jev works and how we check it</h1>
        <p>{METHOD_INTRO.banner}</p>
      </PageBanner>
      <TwoPane
        mainClassName="method-main"
        side={
          <nav className="contents-nav method-contents" aria-label="On this page">
            <a href="#workflow">The workflow</a>
            <a href="#example">One worked example</a>
            <a href="#run">Time and estimated cost</a>
            <a href="#value">Why use Jev?</a>
            <a href="#questions">The five questions</a>
            <a href="#limits">Limits</a>
            <a href="#checks">Trick pairs</a>
            <a href="#validation">Validation and remaining work</a>
          </nav>
        }
      >
        <section id="workflow" tabIndex={-1} className="card">
          <h2>How it works</h2>
          <p>{TERMS.writtenQuestion}</p>
          <p>{METHOD_INTRO.oneJob}</p>
        </section>
        <PipelineGraph />

        <section id="example" tabIndex={-1} className="card">
          <h2>{WORKED_EXAMPLE.heading}</h2>
          <p>{WORKED_EXAMPLE.standfirst}</p>
          <div className="worked-grid">
            <div className="worked-col">
              <div className="source-box">
                <h3 className="section-label">
                  What went in: the question, {WORKED_EXAMPLE.questionRef}
                </h3>
                <p className="question-text">{WORKED_EXAMPLE.question}</p>
              </div>
              <div className="source-box">
                <h3 className="section-label">What went in: the reply</h3>
                <p>{WORKED_EXAMPLE.reply}</p>
              </div>
            </div>
            <div className="worked-col">
              <div>
                <h3 className="section-label">What Jev was asked</h3>
                <p>{WORKED_EXAMPLE.asked}</p>
              </div>
              <div className="gold-box">
                <h3 className="section-label">What came out</h3>
                <p>{WORKED_EXAMPLE.outcome}</p>
              </div>
              <div>
                <h3 className="section-label">Our interpretation, not a Jev explanation</h3>
                <p>{WORKED_EXAMPLE.why}</p>
                <p>{WORKED_EXAMPLE.whyNote}</p>
              </div>
            </div>
          </div>
          <h3 className="section-label">What it took</h3>
          <p>{WORKED_EXAMPLE.cost}</p>
          <p>
            <Link to={WORKED_EXAMPLE.sitePath}>See this pair on this site</Link>, or{" "}
            <a href={WORKED_EXAMPLE.officialUrl} target="_blank" rel="noopener noreferrer">
              read it on the official record
            </a>
            . {WORKED_EXAMPLE.numbersSource}
          </p>
        </section>

        <section id="run" tabIndex={-1} className="card">
          <h2>The run, in numbers</h2>
          <p>{METHOD_RUN_NOTE}</p>
          <p className="muted">{TERMS.token}</p>
          {indexState.status === "loading" && <LoadingNote />}
          {indexState.status === "error" && <ErrorNote />}
          {indexState.status === "ok" && <RunFacts run={indexState.data.run} />}
        </section>

        <section id="value" tabIndex={-1} className="card">
          <h2>{WHY_READ_EVERY_REPLY.heading}</h2>
          {WHY_READ_EVERY_REPLY.paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </section>

        <section className="card">
          <h2>What Jev is</h2>
          <p>{WHAT_JEV_IS}</p>
          <p className="muted">{TERMS.confidence}</p>
        </section>

        <section id="questions" tabIndex={-1} className="card">
          <h2>The five questions asked of each processed pair</h2>
          <p>{FIVE_QUESTIONS_INTRO}</p>
          <ol className="question-set-list">
            {QS_V1_INSTRUCTIONS.map((q) => (
              <li key={q.key}>
                <p className="qs-plain">{q.label}</p>
                <p className="qs-answers">Answers: {q.answers}</p>
                <details>
                  <summary>The exact words the model was given</summary>
                  <p className="qs-exact">{q.instructions}</p>
                </details>
              </li>
            ))}
          </ol>
        </section>

        <section id="limits" tabIndex={-1} className="cream-panel">
          <h2>{NOT_GOOD_AT.heading}</h2>
          <ul className="bullets">
            {NOT_GOOD_AT.items.map((item) => (
              <li key={item.lead}>
                <strong>{item.lead}</strong> {item.body}
              </li>
            ))}
          </ul>
          <p>{NOT_GOOD_AT.vendorNote}</p>
          <p>{JEV_VENDOR_LIMITS_NOTE}</p>
        </section>

        <section className="card">
          <h2>{CODE_NOT_MODEL.heading}</h2>
          <ul className="bullets">
            {CODE_NOT_MODEL.items.map((item) => (
              <li key={item.slice(0, 24)}>{item}</li>
            ))}
          </ul>
        </section>

        <section id="checks" tabIndex={-1} className="card">
          <h2>Trick pairs, and what the phrase rules got wrong</h2>
          <p>{TERMS.controls}</p>
          <p>{TRICK_PAIRS.kinds}</p>
          <p>{TRICK_PAIRS.methods}</p>
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll this named table region. */}
          <section className="table-scroll" aria-label="Control test results" tabIndex={0}>
            <table>
              <caption>
                Results on constructed test pairs, not a measure of accuracy on real replies
              </caption>
              <thead>
                <tr>
                  <th scope="col">Draw</th>
                  <th scope="col">Method</th>
                  <th scope="col">Swapped correct</th>
                  <th scope="col">Swapped at 0.8+</th>
                  <th scope="col">Echo correct</th>
                </tr>
              </thead>
              <tbody>
                {CONTROLS.map((row) => (
                  <tr key={`${row.draw}-${row.method}`}>
                    <th scope="row">{row.draw}</th>
                    <td>{row.method}</td>
                    <td className="mono">{row.swapped}</td>
                    <td className="mono">{row.swappedHigh}</td>
                    <td className="mono">{row.echo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <p>{TRICK_PAIRS.result}</p>
          <p>{TRICK_PAIRS.discard}</p>
        </section>

        <section id="validation" tabIndex={-1} className="cream-panel">
          <h2>Validation and remaining work</h2>
          <ul className="bullets">
            {NOT_DONE_YET.filter((item) => !checkedAgainstPeople || item.id !== "human-check").map(
              (item) => (
                <li key={item.id}>{item.text}</li>
              ),
            )}
          </ul>
          <p>{checkedAgainstPeople ? HUMAN_CHECK_DONE_NOTE : NOT_CHECKED_YET_NOTE}</p>
        </section>

        <section className="card">
          <h2>Corrections</h2>
          <p>No corrections yet.</p>
        </section>

        <section className="card">
          <h2>Licence</h2>
          <p>{ATTRIBUTION_TEXT}</p>
          <p>
            <a href={CC_LICENCE_URL} rel="license noopener noreferrer" target="_blank">
              Creative Commons Attribution 4.0 International
            </a>
          </p>
        </section>
      </TwoPane>
    </>
  );
}
