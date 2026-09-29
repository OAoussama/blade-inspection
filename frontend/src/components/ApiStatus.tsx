// frontend/src/components/ApiStatus.tsx
// Presentational only: it reads the hook and renders. No fetch, no URL,
// no try/catch here.

"use client";

import { useApiHealth } from "@/hooks/useApiHealth";

const DOT = {
  loading: "bg-ink-dim animate-pulse",
  online: "bg-accent",
  offline: "bg-sev-critical",
} as const;

export function ApiStatus() {
  const { state, refresh } = useApiHealth();

  return (
    // role="status" + aria-live: a screen reader announces the change without
    // the user having to go looking for it.
    <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm">
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-full ${DOT[state.kind]}`}
      />

      <span className="text-ink-soft">
        {state.kind === "loading" && "Checking API…"}
        {state.kind === "online" && (
          <>
            API online
            {/* The figure crowds the bar on a phone. */}
            <span className="ml-2 hidden font-mono text-xs text-ink-muted sm:inline">
              {state.latencyMs} ms
            </span>
          </>
        )}
        {state.kind === "offline" && (
          <>
            API unreachable
            <span className="ml-2 hidden text-ink-muted sm:inline">
              {state.message}
            </span>
          </>
        )}
      </span>

      {state.kind === "offline" && (
        <button
          type="button"
          onClick={refresh}
          className="rounded-full px-3 py-1 text-ink-muted hover:bg-card hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Retry
        </button>
      )}
    </div>
  );
}
