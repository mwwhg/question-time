import type { RunFacts as RunFactsData } from "@contract";
import { formatNumber } from "../lib/format.ts";

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourWord = hours === 1 ? "hour" : "hours";
  return rest === 0 ? `${hours} ${hourWord}` : `${hours} ${hourWord} ${rest} minutes`;
}

/** Recorded usage and timing, with model cost estimated from the listed token price. */
export function RunFacts({ run }: { readonly run: RunFactsData }) {
  const perSecond = run.activeSeconds > 0 ? run.pairsJudged / run.activeSeconds : 0;
  const costPerThousand = run.pairsJudged > 0 ? (run.estimatedCostUsd / run.pairsJudged) * 1000 : 0;

  return (
    <ul className="corpus-facts">
      <li>
        <span className="mono">{formatNumber(run.pairsJudged)}</span> question and reply pairs read,{" "}
        <span className="mono">{formatNumber(run.pairsFailed)}</span> failed.{" "}
        <span className="mono">{run.questionsPerPair}</span> questions asked of each, so{" "}
        <span className="mono">{formatNumber(run.pairsJudged * run.questionsPerPair)}</span>{" "}
        readings in all.
      </li>
      <li>
        Time spent reading: <span className="mono">{formatDuration(run.activeSeconds * 1000)}</span>
        , with the run managed from one laptop, about{" "}
        <span className="mono">{perSecond.toFixed(0)}</span> pairs a second.
        {run.pauses > 0 && (
          <>
            {" "}
            The run stopped and restarted <span className="mono">{run.pauses}</span>{" "}
            {run.pauses === 1 ? "time" : "times"}, for{" "}
            <span className="mono">{formatDuration(run.pausedSeconds * 1000)}</span> in all. The
            longest stop was when the account ran out of credit partway through. Nothing was lost:
            the run picked up where it left off.
          </>
        )}
      </li>
      <li>
        Time for one pair: median <span className="mono">{formatNumber(run.latencyMsP50)} ms</span>,
        and 95 in 100 took under <span className="mono">{formatNumber(run.latencyMsP95)} ms</span>.
      </li>
      <li>
        Text sent to the model: <span className="mono">{formatNumber(run.inputTokens)}</span> tokens
        (a token is roughly three-quarters of a word).
      </li>
      <li>
        Estimated model cost: <span className="mono">US${run.estimatedCostUsd.toFixed(2)}</span>,
        worked out from the tokens sent at the vendor's listed price of{" "}
        <span className="mono">US${run.usdPerMillionInputTokens}</span> per million. That is about{" "}
        <span className="mono">US${costPerThousand.toFixed(3)}</span> per thousand pairs. We will
        replace this with the invoiced amount when it arrives.
      </li>
      <li>
        Model <span className="mono">{run.model}</span>, question set{" "}
        <span className="mono">
          {run.questionSetVersion} ({run.questionSetHash})
        </span>
        , run on{" "}
        <span className="mono">
          {new Date(run.firstJudgementAt).toLocaleDateString("en-NZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
        .
      </li>
    </ul>
  );
}
