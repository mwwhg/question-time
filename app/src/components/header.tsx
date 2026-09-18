import { NavLink } from "react-router";
import { PILL_TEXT } from "../lib/copy.ts";
import "./header.css";

const NAV_ITEMS = [
  { to: "/", label: "Start here" },
  { to: "/browse", label: "Browse the results" },
  { to: "/findings", label: "What the data shows" },
  { to: "/method", label: "How we checked" },
];

export function Header() {
  return (
    <header className="site-header">
      <div className="page-shell site-header-inner">
        <a href="/" className="site-name">
          Did they answer?
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
