// frontend/src/components/TurbineSelector.tsx
"use client";

import { useTurbines } from "@/hooks/useTurbines";
import type { Turbine } from "@/lib/services/turbines";

// Built once: creating a formatter on every render is expensive.
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function lastInspectionLabel(turbine: Turbine): string {
  if (turbine.last_inspection_at === null) {
    return "Never inspected";
  }
  return DATE_FORMAT.format(new Date(turbine.last_inspection_at));
}

export function TurbineSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { state, refresh } = useTurbines();

  if (state.kind === "loading") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Skeletons rather than a line of text: the layout does not jump
            when the data lands. */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            aria-hidden="true"
            className="animate-pulse space-y-3 rounded-card border-2 border-transparent bg-card p-5"
          >
            <div className="h-6 w-24 rounded bg-hairline" />
            <div className="h-4 w-full rounded bg-hairline" />
            <div className="h-4 w-2/3 rounded bg-hairline" />
          </div>
        ))}
        <p role="status" className="sr-only">
          Loading turbines
        </p>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div role="alert" className="space-y-3 rounded-card bg-card p-5 text-sm">
        <p className="text-sev-critical">Could not load turbines: {state.message}</p>
        <button
          type="button"
          onClick={refresh}
          className="rounded-full bg-accent px-4 py-1.5 font-medium text-on-accent hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel focus-visible:outline-none"
        >
          Retry
        </button>
      </div>
    );
  }

  if (state.turbines.length === 0) {
    return (
      <p className="rounded-card bg-card p-5 text-sm text-ink-soft">
        No turbines yet. Run{" "}
        <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-accent">
          python -m scripts.seed
        </code>{" "}
        from <code className="font-mono">backend/</code> to insert the demo
        turbines.
      </p>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Turbine to inspect"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {state.turbines.map((turbine) => {
        const isSelected = turbine.id === selectedId;
        const neverInspected = turbine.last_inspection_at === null;

        return (
          // A button, not a div: keyboard focusable and announced as
          // interactive without re-implementing tabIndex, Enter and Space.
          <button
            key={turbine.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(turbine.id)}
            className={`flex flex-col gap-2.5 rounded-card border-2 bg-card p-5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel focus-visible:outline-none ${
              isSelected
                ? // Selection does not rest on colour alone: a solid border
                  // plus an explicit tick, both readable without hue.
                  "border-accent"
                : "border-hairline hover:border-ink-dim"
            }`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="font-display text-display-sm">{turbine.tag}</span>
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </span>

            <span className="block text-sm font-medium">
              {turbine.site_name ?? "Unknown site"}
            </span>

            <span className="block text-xs text-ink-muted">
              {turbine.model ?? "Unknown model"}
            </span>

            <span className="my-1 block h-px bg-hairline" />

            <span className="flex items-baseline gap-2">
              <span
                className={`font-mono text-xl ${neverInspected ? "text-ink-muted" : "text-accent"}`}
              >
                {turbine.inspection_count}
              </span>
              <span className="text-xs text-ink-muted">
                {neverInspected
                  ? "Never inspected"
                  : `inspection${turbine.inspection_count === 1 ? "" : "s"} · ${lastInspectionLabel(turbine)}`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
