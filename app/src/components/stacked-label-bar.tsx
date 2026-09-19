import type { LabelCounts } from "@contract";
import { LABEL_WORDING, NO_READING_WORDING } from "../lib/copy.ts";
import { formatNumber } from "../lib/format.ts";
import "./stacked-label-bar.css";

// Segment order is fixed by the design system: answered, partly, not answered, unclear, no-reading.
const SEGMENTS = [
  { key: "answered", varName: "--answered" },
  { key: "partly_answered", varName: "--partly" },
  { key: "not_answered", varName: "--not-answered" },
  { key: "unclear", varName: "--unclear" },
] as const;

export function StackedLabelBar({
  counts,
  label,
}: {
  readonly counts: LabelCounts;
  readonly label: string;
}) {
  const total =
    counts.answered +
    counts.partly_answered +
    counts.not_answered +
    counts.unclear +
    counts.noReading;
  if (total === 0) {
    return <p className="mono muted">No data yet.</p>;
  }
  const segments = [
    ...SEGMENTS.map((s) => ({ ...s, count: counts[s.key] })),
    { key: "noReading" as const, varName: "--track", count: counts.noReading },
  ].filter((s) => s.count > 0);

  const textEquivalent = segments
    .map((s) => {
      const wording = s.key === "noReading" ? NO_READING_WORDING : LABEL_WORDING[s.key];
      return `${wording?.shownAs}: ${formatNumber(s.count)}`;
    })
    .join(", ");

  return (
    <div className="stacked-bar-wrap">
      <div className="stacked-bar" role="img" aria-label={`${label}: ${textEquivalent}`}>
        {segments.map((s) => (
          <div
            key={s.key}
            className="stacked-bar-segment"
            style={{ width: `${(s.count / total) * 100}%`, background: `var(${s.varName})` }}
          />
        ))}
      </div>
      <p className="stacked-bar-text mono">{textEquivalent}</p>
    </div>
  );
}
