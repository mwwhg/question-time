import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router";

/** Wait for asynchronous page content before focusing it or restoring its scroll position. */
export function RouteNavigation() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, number>());

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    const main = document.getElementById("main");
    if (!main) return;
    const savedPosition = positions.current.get(location.key);
    if (savedPosition === undefined) positions.current.set(location.key, 0);
    // A new page starts at the top straight away. Waiting for its data would pull back a reader
    // who has already begun scrolling.
    if (navigationType !== "POP" && !location.hash) window.scrollTo(0, 0);
    let settled = false;
    const observer = new MutationObserver(settle);

    function settle() {
      if (!main || settled || main.querySelector("[data-loading]")) return;
      const heading = main.querySelector<HTMLElement>("h1");
      const fallback = main.querySelector<HTMLElement>('[role="alert"], [data-empty]');
      if (!heading && !fallback) return;
      settled = true;
      observer.disconnect();
      if (navigationType === "POP" && savedPosition !== undefined) {
        window.scrollTo(0, savedPosition);
        return;
      }
      let hash = location.hash.slice(1);
      try {
        hash = decodeURIComponent(hash);
      } catch {
        // A malformed URL fragment still permits normal page navigation.
      }
      const anchor = hash ? document.getElementById(hash) : null;
      if (navigationType === "POP" && !anchor) return;
      const target = anchor ?? heading ?? fallback;
      if (target) {
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
      if (anchor) anchor.scrollIntoView();
    }

    observer.observe(main, { childList: true, subtree: true });
    settle();
    function rememberPosition() {
      // The router updates history before React unmounts the old page. That unmount can clamp the
      // scroll to 0, which must not overwrite the position saved for the page being left.
      if ((window.history.state?.key ?? "default") !== location.key) return;
      positions.current.set(location.key, window.scrollY);
    }
    window.addEventListener("scroll", rememberPosition, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", rememberPosition);
    };
  }, [location.key, location.hash, navigationType]);

  return null;
}
