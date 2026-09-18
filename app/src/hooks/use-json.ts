import { useEffect, useState } from "react";

type State<T> =
  | { readonly status: "loading" }
  | { readonly status: "error" }
  | { readonly status: "ok"; readonly data: T };

// Module-level cache: moving between questions in the same block, or back to a page already
// visited, does not refetch. Fine for a static site where every path is content-addressed.
const cache = new Map<string, unknown>();

/**
 * Fetch JSON from our own build output and hand back the raw value.
 * Callers cast the result to the @contract type at the one place they use it — see the comment
 * at each call site for why that cast is safe (it is our own build output, not third-party input).
 */
export function useJson<T>(path: string): State<T> {
  const cached = cache.get(path);
  const [state, setState] = useState<State<T>>(
    cached !== undefined ? { status: "ok", data: cached as T } : { status: "loading" },
  );

  useEffect(() => {
    const already = cache.get(path);
    if (already !== undefined) {
      setState({ status: "ok", data: already as T });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    fetch(path)
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${path}`);
        return response.json();
      })
      .then((data: unknown) => {
        if (cancelled) return;
        cache.set(path, data);
        setState({ status: "ok", data: data as T });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}
