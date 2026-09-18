import { LABELS } from "@contract";
import { LABEL_WORDING, NO_READING_WORDING } from "../lib/copy.ts";
import "./label-key.css";

/** The five reading words with their one-line meanings. Shown wherever a page first uses them. */
export function LabelKey() {
  return (
    <dl className="label-key">
      {LABELS.map((label) => (
        <div key={label} className="label-key-row">
          <dt>
            <span className={`label-key-swatch label-key-${label}`} aria-hidden="true" />
            {LABEL_WORDING[label]?.shownAs}
          </dt>
          <dd>{LABEL_WORDING[label]?.meaning}</dd>
        </div>
      ))}
      <div className="label-key-row">
        <dt>
          <span className="label-key-swatch label-key-noReading" aria-hidden="true" />
          {NO_READING_WORDING.shownAs}
        </dt>
        <dd>{NO_READING_WORDING.meaning}</dd>
      </div>
    </dl>
  );
}
