// frontend/src/hooks/useApiHealth.ts
// Fetching lives in the hook, separate from rendering. The component does not
// know how the API is reached, only what state it is in.

"use client";

import { useCallback, useEffect, useState } from "react";
import { getHealth } from "@/lib/services/health";
import { ApiError } from "@/lib/api";

export type HealthState =
  | { kind: "loading" }
  | { kind: "online"; status: string; latencyMs: number }
  | { kind: "offline"; message: string };

export function useApiHealth(pollIntervalMs = 30_000) {
  const [state, setState] = useState<HealthState>({ kind: "loading" });
  const [nonce, setNonce] = useState(0);

  /** Manual retry from the interface. */
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    // Recursive setTimeout rather than setInterval: the next check is only
    // scheduled once the previous one has settled, so a slow API can never
    // leave several /health requests in flight at the same time.
    function schedule() {
      clearTimeout(timer);
      // A hidden tab polls nothing at all — visibilitychange starts it again.
      if (cancelled || document.hidden) return;
      timer = setTimeout(check, pollIntervalMs);
    }

    async function check() {
      const startedAt = performance.now();
      try {
        const data = await getHealth(controller.signal);
        if (cancelled) return;
        setState({
          kind: "online",
          status: data.status,
          latencyMs: Math.round(performance.now() - startedAt),
        });
      } catch (error) {
        // Unmounting aborts the request: that is not an API failure, and must
        // not surface as one. React StrictMode mounts twice in development,
        // so this happens on every reload.
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        setState({
          kind: "offline",
          message: error instanceof ApiError ? error.message : "Unexpected error",
        });
      } finally {
        schedule();
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        clearTimeout(timer);
        return;
      }
      // Coming back after a while, the dot may be showing stale information,
      // so re-check immediately instead of waiting out the interval.
      clearTimeout(timer);
      void check();
    }

    void check();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pollIntervalMs, nonce]);

  return { state, refresh };
}
