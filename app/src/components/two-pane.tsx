import type { ReactNode } from "react";

/** Cream sidebar beside the page content. The layout rules live in global.css under `.two-pane`. */
export function TwoPane({
  side,
  children,
  mainClassName,
}: {
  readonly side: ReactNode;
  readonly children: ReactNode;
  readonly mainClassName?: string;
}) {
  return (
    <div className="two-pane">
      <aside className="pane-side">
        <div className="pane-side-inner">{side}</div>
      </aside>
      <div className={mainClassName ? `pane-main ${mainClassName}` : "pane-main"}>{children}</div>
    </div>
  );
}
