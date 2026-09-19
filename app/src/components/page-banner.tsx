import type { ReactNode } from "react";
import { PreviewNotice } from "./preview-notice.tsx";
import "./page-banner.css";

/** Dark band under the header that holds a page's h1. The preview notice rides directly below it,
    so every page that has a banner shows exactly one notice. */
export function PageBanner({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <div className="page-banner on-dark">
        <div className="wrap">{children}</div>
      </div>
      <PreviewNotice />
    </>
  );
}
