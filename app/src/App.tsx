import type { PortfolioIndex } from "@contract";
import { portfolioIndexPath } from "@contract";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { Footer } from "./components/footer.tsx";
import { Header } from "./components/header.tsx";
import { PageBanner } from "./components/page-banner.tsx";
import { RouteNavigation } from "./components/route-navigation.tsx";
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
        <RouteNavigation />
        <Header />
        <main id="main" tabIndex={-1}>
          <PageRoutes />
        </main>
        <Footer />
      </BrowserRouter>
    </PreviewProvider>
  );
}

function PageRoutes() {
  const { pathname } = useLocation();
  return (
    <Routes key={pathname}>
      <Route path="/" element={<Home />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/browse/:slug/:year" element={<BrowsePortfolio />} />
      <Route path="/q/:year/:number" element={<Question />} />
      <Route path="/findings" element={<Findings />} />
      <Route path="/method" element={<Method />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  return (
    <>
      <PageBanner>
        <h1>Page not found</h1>
      </PageBanner>
      <div className="wrap page-body">
        <p>That page does not exist.</p>
      </div>
    </>
  );
}
