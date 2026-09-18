import type { PortfolioIndex } from "@contract";
import { portfolioIndexPath } from "@contract";
import { BrowserRouter, Route, Routes } from "react-router";
import { Footer } from "./components/footer.tsx";
import { Header } from "./components/header.tsx";
import { PreviewNotice } from "./components/preview-notice.tsx";
import { PreviewProvider } from "./context/preview-context.tsx";
import { useJson } from "./hooks/use-json.ts";
import { Browse } from "./routes/browse.tsx";
import { BrowsePortfolio } from "./routes/browse-portfolio.tsx";
import { Findings } from "./routes/findings.tsx";
import { Home } from "./routes/home.tsx";
import { Method } from "./routes/method.tsx";
import { Question } from "./routes/question.tsx";

export function App() {
  // The whole app reads this once: fetched JSON from our own build is a trust boundary we own,
  // so the cast to the contract type happens here and nowhere else.
  const index = useJson<PortfolioIndex>(portfolioIndexPath);
  const checkedAgainstPeople = index.status === "ok" ? index.data.checkedAgainstPeople : false;

  return (
    <PreviewProvider checkedAgainstPeople={checkedAgainstPeople}>
      <BrowserRouter>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main" className="page-shell" style={{ paddingTop: 24, paddingBottom: 24 }}>
          <PreviewNotice />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/browse/:slug/:year" element={<BrowsePortfolio />} />
            <Route path="/q/:year/:number" element={<Question />} />
            <Route path="/findings" element={<Findings />} />
            <Route path="/method" element={<Method />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </PreviewProvider>
  );
}

function NotFound() {
  return (
    <div className="prose">
      <h1>Page not found</h1>
      <p>That page does not exist.</p>
    </div>
  );
}
