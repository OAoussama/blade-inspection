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

export function useInspection(inspectionId: string | null, intervalMs = 2_000) {
  const [state, setState] = useState<InspectionState>({ kind: "idle" });

  useEffect(() => {
    if (!inspectionId) {
      setState({ kind: "idle" });
      return;
    }

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function poll() {
      try {
        const data = await getInspection(inspectionId!, controller.signal);
        if (cancelled) return;

        if (TERMINAL.has(data.status)) {
          setState({ kind: "ready", inspection: data });
          return; // état terminal : on arrête le polling
        }

        setState({ kind: "polling", inspection: data });
        // setTimeout récursif plutôt que setInterval : la requête suivante
        // ne part qu'une fois la précédente terminée, donc jamais
        // d'empilement si le backend ralentit.
        timer = setTimeout(poll, intervalMs);
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        setState({
          kind: "error",
          message: error instanceof ApiError ? error.message : "Erreur inattendue",
        });
      }
    }

    setState({ kind: "polling", inspection: null });
    void poll();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [inspectionId, intervalMs]);

  return state;
}