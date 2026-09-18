import { useCheckedAgainstPeople } from "../context/preview-context.tsx";
import { useDocumentTitle } from "../hooks/use-document-title.ts";
import { ATTRIBUTION_TEXT, CC_LICENCE_URL } from "../lib/copy.ts";
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
  "The calibration chart showing whether the model's stated confidence tracks how often it is actually right.",
];

export function Method() {
  useDocumentTitle("How we checked");
  const checkedAgainstPeople = useCheckedAgainstPeople();

  return (
    <div className="prose">
      <h1>How we checked</h1>

      <section>
        <h2>What Jev is</h2>
        <p>
          Jev is a small, fast model built to answer typed questions about a piece of text with
          probabilities. Given a question and a reply, it does not write any text back. It answers
          each of the five questions below by choosing one option from a fixed list, or a single
          yes/no probability, and it reports how confident it is in that choice.
        </p>
      </section>

      <section>
        <h2>The five questions asked of every reply</h2>
        <p>
          Every method — the phrase rules, a general-purpose language model, and Jev — is given the
          same five questions, word for word:
        </p>
        <ol className="question-set-list">
          {QS_V1_INSTRUCTIONS.map((q) => (
            <li key={q.key}>
              <p className="mono qs-key">{q.key}</p>
              <p>{q.instructions}</p>
            </li>
          ))}
        </ol>
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
        <h2>Controls</h2>
        <p>
          Before judging real pairs, Jev and the rules baseline were run against two kinds of
          constructed control: a "swapped" reply taken from a different portfolio, which should read
          as not answered, and an "echo" reply that just restates the question, which should read as
          not answered or unclear.
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
            ? "These are now complete; see the Findings page for results."
            : 'Until these are done, the "how sure" wording is switched off across the site. Confidence is shown on each question page as the model\'s own confidence, not yet checked against people.'}
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
