import { useCheckedAgainstPeople } from "../context/preview-context.tsx";
import { PREVIEW_NOTICE } from "../lib/copy.ts";

export function PreviewNotice() {
  const checkedAgainstPeople = useCheckedAgainstPeople();
  if (checkedAgainstPeople) return null;
  return (
    <div className="notice" role="note">
      <div className="wrap">
        <p>
          <strong>{PREVIEW_NOTICE.heading}</strong> {PREVIEW_NOTICE.summary}
        </p>
        <details>
          <summary>{PREVIEW_NOTICE.disclosure}</summary>
          <p>{PREVIEW_NOTICE.body}</p>
        </details>
      </div>
    </div>
  );
}
