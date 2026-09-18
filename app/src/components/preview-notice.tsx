import { useCheckedAgainstPeople } from "../context/preview-context.tsx";
import { PREVIEW_NOTICE } from "../lib/copy.ts";

export function PreviewNotice() {
  const checkedAgainstPeople = useCheckedAgainstPeople();
  if (checkedAgainstPeople) return null;
  return (
    <div className="notice" role="note">
      <strong>{PREVIEW_NOTICE.heading}</strong> {PREVIEW_NOTICE.body}
    </div>
  );
}
