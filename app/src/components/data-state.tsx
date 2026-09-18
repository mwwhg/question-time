import type { ReactNode } from "react";

/** Shared loading/error copy so every page fails the same way. */
export function LoadingNote() {
  return <p className="mono">Loading…</p>;
}

export function ErrorNote() {
  return (
    <p role="alert" style={{ color: "var(--not-answered-text)" }}>
      We could not load this data. Try again.
    </p>
  );
}

export function EmptyNote({ children }: { readonly children: ReactNode }) {
  return <p style={{ color: "var(--muted)" }}>{children}</p>;
}
