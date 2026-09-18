import type { PortfolioIndex } from "@contract";
import { portfolioIndexPath } from "@contract";
import { Link } from "react-router";
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
  "The 300-pair human check, comparing the model's readings against two independent people.",
  "A comparison with a general-purpose language model on the same 300 pairs.",
  "A calibration chart: whether the readings the model was surest about turn out right more often than the ones it was unsure about.",
];

export function Method() {
  useDocumentTitle("How we checked");
  const checkedAgainstPeople = useCheckedAgainstPeople();
  const indexState = useJson<PortfolioIndex>(portfolioIndexPath);

  return (
    <div className="prose">
      <h1>How we checked</h1>

      <section>
        <h2>How it works</h2>
        <p>{TERMS.writtenQuestion}</p>
        <p>
          A model does one narrow job here: it reads a question and its reply and says whether the
          reply gives what was asked. Everything around that job is ordinary code or people.
        </p>
      </section>
      <PipelineGraph />

      <section className="worked-example card">
        <h2>{WORKED_EXAMPLE.heading}</h2>
        <p>{WORKED_EXAMPLE.standfirst}</p>
        <p className="section-label">What went in: the question, {WORKED_EXAMPLE.questionRef}</p>
        <p>{WORKED_EXAMPLE.question}</p>
        <p className="section-label">What went in: the reply</p>
        <p>{WORKED_EXAMPLE.reply}</p>
        <p className="section-label">What Jev was asked</p>
        <p>{WORKED_EXAMPLE.asked}</p>
        <p className="section-label">What came out</p>
        <p>{WORKED_EXAMPLE.outcome}</p>
        <p className="section-label">Why that is a sensible reading</p>
        <p>{WORKED_EXAMPLE.why}</p>
        <p className="section-label">What it took</p>
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

      <section>
        <h2>The run, in numbers</h2>
        <p>
          These figures come from the run's own records: the time stamped on each reading and the
          amount of text the model reported receiving.
        </p>
        <p style={{ color: "var(--muted)" }}>{TERMS.token}</p>
        {indexState.status === "ok" ? (
          <RunFacts run={indexState.data.run} />
        ) : (
          <p>The run figures could not be loaded.</p>
        )}
      </section>

      <section>
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
          list of answers, it splits 100 between them, and the largest share is the answer. For a
          yes or no question, it gives one number out of 100 for yes. The worked example above shows
          exactly what that looks like.
        </p>
        <p style={{ color: "var(--muted)" }}>{TERMS.confidence}</p>
      </section>

      <section>
        <h2>The five questions asked of every reply</h2>
        <p>
          Jev is asked the same five questions about every pair, in the same words every time. The
          phrase rules and a general-purpose language model are given the same five, so the three
          can be compared. Here they are in plain words.
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

      <section>
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
            Whether a reading counts as "unclear": the model is treated as not sure enough whenever
            its top-choice confidence is below a fixed threshold, decided once by the pipeline and
            never by the site.
          </li>
          <li>
            The reply's word count, whether it contains a number, how many separate things the
            question asks, and which stock phrases it uses.
          </li>
          <li>
            Whether a reply is plain text, a referral to an earlier reply, or attachment-only,
            including following referral chains and resolving them against earlier questions.
          </li>
          <li>
            Counting each question two ways: every record, and each distinct question text once,
            since the same question is often sent to many ministers.
          </li>
          <li>
            All aggregation shown on the Findings page: breakdowns, the confidence histogram,
            cross-checks and cost figures.
          </li>
        </ul>
      </section>

      <section>
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
        <div className="table-scroll">
          <table>
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
                  <td>{row.draw}</td>
                  <td>{row.method}</td>
                  <td className="mono">{row.swapped}</td>
                  <td className="mono">{row.swappedHigh}</td>
                  <td className="mono">{row.echo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The phrase rules got 2 of 10 swapped pairs and 0 of 10 echo pairs. That is what matching
          words does when the words are in the wrong place: an echo reply is made entirely of the
          question's own words and contains no stock phrase at all, so the rules have nothing to go
          on. Jev got 10 of 10 on both. These are twenty pairs we built ourselves. They show the
          rules cannot tell what a reply is about. They do not show how often Jev is right on real
          replies.
        </p>
        <p>{DISCARD_EXPLANATION}</p>
      </section>

      <section>
        <h2>What has not been done yet</h2>
        <ul>
          {NOT_DONE_YET.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          {checkedAgainstPeople
            ? "These are now complete; see the What the data shows page for results."
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
