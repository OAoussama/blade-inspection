// frontend/src/hooks/useInspection.ts
"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { getInspection, type Inspection } from "@/lib/services/inspections";

const TERMINAL: ReadonlySet<string> = new Set(["done", "failed"]);

export type InspectionState =
  | { kind: "idle" }
  | { kind: "polling"; inspection: Inspection | null }
  | { kind: "ready"; inspection: Inspection }
  | { kind: "error"; message: string };

const IDLE: InspectionState = { kind: "idle" };
const STARTING: InspectionState = { kind: "polling", inspection: null };

/** What the effect has learned, tagged with the id it belongs to. */
type Entry = { id: string; state: InspectionState };

export function useInspection(inspectionId: string | null, intervalMs = 2_000) {
  const [entry, setEntry] = useState<Entry | null>(null);

  useEffect(() => {
    if (!inspectionId) return;

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function poll() {
      try {
        const data = await getInspection(inspectionId!, controller.signal);
        if (cancelled) return;

        if (TERMINAL.has(data.status)) {
          setEntry({ id: inspectionId!, state: { kind: "ready", inspection: data } });
          return; // terminal state: stop polling
        }

        setEntry({ id: inspectionId!, state: { kind: "polling", inspection: data } });
        // Recursive setTimeout rather than setInterval: the next request only
        // goes out once the previous one came back, so nothing piles up if
        // the backend slows down.
        timer = setTimeout(poll, intervalMs);
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        setEntry({
          id: inspectionId!,
          state: {
            kind: "error",
            message: error instanceof ApiError ? error.message : "Unexpected error",
          },
        });
      }
    }

    void poll();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [inspectionId, intervalMs]);

  // Derived, not assigned from the effect. With no id there is nothing to
  // poll, and an entry left over from a previous id is stale by definition —
  // so neither case costs a render spent on a value we already know is wrong.
  if (inspectionId === null) return IDLE;
  return entry?.id === inspectionId ? entry.state : STARTING;
}
