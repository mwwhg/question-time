import { ATTRIBUTION_TEXT, CC_LICENCE_URL, FOUND_A_MISTAKE } from "../lib/copy.ts";
import "./footer.css";

export function Footer() {
  return (
    <footer className="site-footer on-dark">
      <div className="wrap site-footer-inner">
        <div>
          <p>{ATTRIBUTION_TEXT}</p>
          <p>
            <a href={CC_LICENCE_URL} rel="license noopener noreferrer" target="_blank">
              Creative Commons Attribution 4.0 International
            </a>
          </p>
        </div>
        <div>
          <h2 className="footer-heading">{FOUND_A_MISTAKE.heading}</h2>
          <p>
            {FOUND_A_MISTAKE.before}
            <a href={FOUND_A_MISTAKE.contactUrl} rel="noopener noreferrer">
              {FOUND_A_MISTAKE.contactLabel}
            </a>
            {FOUND_A_MISTAKE.after}
          </p>
        </div>
      </div>
    </footer>
  );
}
