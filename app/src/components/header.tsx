import { NavLink } from "react-router";
import { PILL_TEXT } from "../lib/copy.ts";
import "./header.css";

const NAV_ITEMS = [
  { to: "/", label: "Start here" },
  { to: "/browse", label: "Browse the results" },
  { to: "/findings", label: "What the data shows" },
  { to: "/method", label: "How Jev works and how we check it" },
];

export function Header() {
  return (
    <header className="site-header on-dark">
      <div className="wrap site-header-inner">
        <a href="/" className="site-name">
          Did they answer<span className="site-name-mark">?</span>
        </a>
        <nav aria-label="Main">
          <ul className="nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === "/"} className="nav-link">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <span className="pill header-pill">{PILL_TEXT}</span>
      </div>
    </header>
  );
}
