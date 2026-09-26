// frontend/src/hooks/useTurbines.ts
// Même découpe que useApiHealth : le hook porte l'état, le composant
// affiche. Aucun fetch dans un composant.

"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { listTurbines, type Turbine } from "@/lib/services/turbines";

export type TurbinesState =
  | { kind: "loading" }
  | { kind: "ready"; turbines: Turbine[] }
  | { kind: "error"; message: string };

export function useTurbines() {
  const [state, setState] = useState<TurbinesState>({ kind: "loading" });
  const [nonce, setNonce] = useState(0);

  /** Relance la requête après un échec. */
  const refresh = useCallback(() => {
    setState({ kind: "loading" });
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const turbines = await listTurbines(controller.signal);
        setState({ kind: "ready", turbines });
      } catch (error) {
        // Le démontage annule la requête : ce n'est pas une panne. React
        // StrictMode monte deux fois en dev, ce cas arrive à chaque
        // rechargement et afficherait une erreur alors que tout va bien.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setState({
          kind: "error",
          message: error instanceof ApiError ? error.message : "Erreur inattendue",
        });
      }
    }

    void load();

    return () => controller.abort();
  }, [nonce]);

  return { state, refresh };
}
