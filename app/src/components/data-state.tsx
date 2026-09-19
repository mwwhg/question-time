import type { ReactNode } from "react";

/** Shared loading/error copy so every page fails the same way. */
export function LoadingNote() {
  return (
    <p className="mono" role="status" data-loading="true">
      Loading…
    </p>
  );
}

export function ErrorNote() {
  return (
    <p role="alert" style={{ color: "var(--not-answered-text)" }}>
      We could not load this data. Try again.
    </p>
  );
}

export function EmptyNote({ children }: { readonly children: ReactNode }) {
  return (
    <p data-empty="true" className="muted">
      {children}
    </p>
  );
}
