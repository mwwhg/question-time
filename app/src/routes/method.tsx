import type { PortfolioIndex } from "@contract";
import { portfolioIndexPath } from "@contract";
import { Link } from "react-router";
import { ErrorNote, LoadingNote } from "../components/data-state.tsx";
import { PipelineGraph } from "../components/pipeline-graph.tsx";
import { RunFacts } from "../components/run-facts.tsx";
import { useCheckedAgainstPeople } from "../context/preview-context.tsx";
import { useDocumentTitle } from "../hooks/use-document-title.ts";
import { useJson } from "../hooks/use-json.ts";
import {
  ATTRIBUTION_TEXT,
  CC_LICENCE_URL,
  JEV_VENDOR_LIMITS_NOTE,
  NOT_CHECKED_YET_NOTE,
  NOT_GOOD_AT,
  TERMS,
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

const DISCARD_EXPLANATION =
  'Draw 1 was discarded. Its two misses had swapped-in replies of "None." and "As the Minister for Treaty of Waitangi Negotiations, none." against questions of the form "What advice, if any, ...". Those replies do answer such a question, so the control was wrong and Jev was right. The sampler now requires both sides of a swap to have replies of at least 80 characters. This was a fix to the instrument, made after seeing results, so draw 1 is kept and reported here rather than quietly dropped.';

const NOT_DONE_YET = [
  {
    id: "human-check",
    text: "The 300-pair human check, comparing the model's readings against two independent people.",
  },
  {
    id: "model-comparison",
    text: "A comparison with a general-purpose language model on the same 300 pairs.",
  },
  {
    id: "calibration",
    text: "A calibration chart: whether the readings the model was surest about turn out right more often than the ones it was unsure about.",
  },
];

export function Method() {
  useDocumentTitle("How Jev works and how we check it");
  const checkedAgainstPeople = useCheckedAgainstPeople();
  const indexState = useJson<PortfolioIndex>(portfolioIndexPath);

  return (
    <div className="prose">
      <h1>How Jev works and how we check it</h1>
      <p>
        People define the questions. Jev returns structured judgements. Code adds them up, and
        people must check what those results mean.
      </p>
      <nav className="method-contents" aria-label="On this page">
        <a href="#workflow">The workflow</a>
        <a href="#example">One worked example</a>
        <a href="#run">Time and estimated cost</a>
        <a href="#value">Why use Jev?</a>
        <a href="#questions">The five questions</a>
        <a href="#limits">Limits</a>
        <a href="#checks">Trick pairs</a>
        <a href="#validation">Validation and remaining work</a>
      </nav>

      <section id="workflow" tabIndex={-1}>
        <h2>How it works</h2>
        <p>{TERMS.writtenQuestion}</p>
        <p>
          A model does one narrow job here. It reads a question and its reply and says whether the
          reply gives what was asked. Everything around that job is ordinary code or people.
        </p>
      </section>
      <PipelineGraph />

      <section id="example" tabIndex={-1} className="worked-example card">
        <h2>{WORKED_EXAMPLE.heading}</h2>
        <p>{WORKED_EXAMPLE.standfirst}</p>
        <h3 className="section-label">What went in: the question, {WORKED_EXAMPLE.questionRef}</h3>
        <p>{WORKED_EXAMPLE.question}</p>
        <h3 className="section-label">What went in: the reply</h3>
        <p>{WORKED_EXAMPLE.reply}</p>
        <h3 className="section-label">What Jev was asked</h3>
        <p>{WORKED_EXAMPLE.asked}</p>
        <h3 className="section-label">What came out</h3>
        <p>{WORKED_EXAMPLE.outcome}</p>
        <h3 className="section-label">Our interpretation, not a Jev explanation</h3>
        <p>{WORKED_EXAMPLE.why}</p>
        <p>
          That explanation is our interpretation. Jev returned the numerical reading, not this
          explanation.
        </p>
        <h3 className="section-label">What it took</h3>
        <p>{WORKED_EXAMPLE.cost}</p>
        <p>
          <Link to={WORKED_EXAMPLE.sitePath}>See this pair on this site</Link>, or{" "}
          <a href={WORKED_EXAMPLE.officialUrl} target="_blank" rel="noopener noreferrer">
            read it on the official record
          </a>
          . The numbers above come from the record of that first test, kept in the project files,
          not from the run below.
        </p>
      </section>

      <section id="run" tabIndex={-1}>
        <h2>The run, in numbers</h2>
        <p>
          These figures come from the run's own records. Those records are the time stamped on each
          reading and the amount of text the model reported receiving. Cost is an estimate using the
          vendor's listed price. These figures describe the recorded run, not proof of accuracy or a
          completed reading of every record.
        </p>
        <p style={{ color: "var(--muted)" }}>{TERMS.token}</p>
        {indexState.status === "loading" && <LoadingNote />}
        {indexState.status === "error" && <ErrorNote />}
        {indexState.status === "ok" && <RunFacts run={indexState.data.run} />}
      </section>

      <section id="value" tabIndex={-1}>
        <h2>{WHY_READ_EVERY_REPLY.heading}</h2>
        {WHY_READ_EVERY_REPLY.paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </section>

      <section>
        <h2>What Jev is</h2>
        <p>
          Jev is a small, fast computer model. You hand it a piece of text and a question about that
          text, and it hands back numbers. It never writes a sentence. For a question with a fixed
          list of answers, it splits 100 between them, and the largest share is its raw choice. The
          site displays “Unclear” when the model’s confidence falls below 50 in 100. For a yes or no
          question, it gives one number out of 100 for yes. The worked example above shows exactly
          what that looks like.
        </p>
        <p style={{ color: "var(--muted)" }}>{TERMS.confidence}</p>
      </section>

      <section id="questions" tabIndex={-1}>
        <h2>The five questions asked of each processed pair</h2>
        <p>
          Jev receives the same five assessment questions for each pair, in the same words each
          time. Phrase rules provide a simple comparison. A comparison with a general-purpose
          language model on the same human-reviewed sample is planned but has not been completed.
          Here are the assessment questions in plain words.
        </p>
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

      <section id="limits" tabIndex={-1}>
        <h2>{NOT_GOOD_AT.heading}</h2>
        <ul>
          {NOT_GOOD_AT.items.map((item) => (
            <li key={item.lead}>
              <strong>{item.lead}</strong> {item.body}
            </li>
          ))}
        </ul>
        <p>{NOT_GOOD_AT.vendorNote}</p>
        <p>{JEV_VENDOR_LIMITS_NOTE}</p>
      </section>

      <section>
        <h2>What is computed by code, not the model</h2>
        <ul>
          <li>
            Whether a reading counts as "unclear": the pipeline treats the model as not sure enough
            when its top-choice confidence is below 50 in 100. The pipeline decides this once. The
            site never does.
          </li>
          <li>
            The reply's word count, whether it contains a number, and which stock phrases it uses.
            Code also estimates how many separate things the question asks using simple text rules.
            That estimate can miss or miscount parts.
          </li>
          <li>
            Whether a reply is plain text, a referral to an earlier reply, or attachment-only,
            including following referral chains and resolving them against earlier questions.
          </li>
          <li>
            Counting each question two ways: every record, and each distinct question text once,
            since the same question is often sent to many ministers. The distinct-question view uses
            the reading of the lowest-numbered record for each wording. It does not combine the
            replies or their judgements.
          </li>
          <li>
            All aggregation shown on the Findings page: breakdowns, the confidence histogram,
            cross-checks and cost figures.
          </li>
        </ul>
      </section>

      <section id="checks" tabIndex={-1}>
        <h2>Trick pairs, and what the phrase rules got wrong</h2>
        <p>{TERMS.controls}</p>
        <p>
          We built two kinds. A "swapped" pair keeps the question and puts a reply from a completely
          different portfolio underneath it. A reader paying attention calls that not answered. An
          "echo" pair replies to the question by repeating it back, which also answers nothing.
        </p>
        <p>
          Two methods were tested on them. The phrase rules look for set forms of words in the reply
          and nothing else. Jev reads the question and the reply together. "Swapped at 0.8+" counts
          the swapped pairs a method called not answered while giving that answer at least 80 of its
          100 shares.
        </p>
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
        <p>
          The phrase rules got 2 of 10 swapped pairs and 0 of 10 echo pairs. An echo reply uses only
          the question's own words and contains no stock phrase, so the rules find nothing to match.
          Jev got 10 of 10 on both. These are twenty pairs we built ourselves. They show the rules
          cannot tell what a reply is about. They do not show how often Jev is right on real
          replies.
        </p>
        <p>{DISCARD_EXPLANATION}</p>
      </section>

      <section id="validation" tabIndex={-1}>
        <h2>Validation and remaining work</h2>
        <ul>
          {NOT_DONE_YET.filter((item) => !checkedAgainstPeople || item.id !== "human-check").map(
            (item) => (
              <li key={item.id}>{item.text}</li>
            ),
          )}
        </ul>
        <p>
          {checkedAgainstPeople
            ? "The published data marks the human check complete. See the findings for available evidence; this does not establish that the model comparison or calibration work is complete."
            : NOT_CHECKED_YET_NOTE}
        </p>
      </section>

      <section>
        <h2>Corrections</h2>
        <p>No corrections yet.</p>
      </section>

      <section>
        <h2>Licence</h2>
        <p>{ATTRIBUTION_TEXT}</p>
        <p>
          <a href={CC_LICENCE_URL} rel="license noopener noreferrer" target="_blank">
            Creative Commons Attribution 4.0 International
          </a>
        </p>
      </section>
    </div>
  );
}
