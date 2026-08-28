//état et cycle de vie

// frontend/src/hooks/useApiHealth.ts
// La logique de recuperation vit dans un hook, separee de l'affichage.
// Le composant ne sait pas comment l'API est jointe, seulement dans quel
// etat elle se trouve.

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

  /** Permet un rafraichissement manuel depuis l'interface. */
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    async function check() {
      const startedAt = performance.now();
      try {
        const data = await getHealth(controller.signal);
        setState({
          kind: "online",
          status: data.status,
          latencyMs: Math.round(performance.now() - startedAt),
        });
      } catch (error) {
        // Le demontage du composant annule la requete : ce n'est pas une
        // panne de l'API, il ne faut surtout pas afficher une erreur.
        // React StrictMode monte deux fois en dev, ce cas arrive a chaque
        // rechargement.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setState({
          kind: "offline",
          message:
            error instanceof ApiError ? error.message : "Erreur inattendue",
        });
      }
    }

    void check();
    const timer = setInterval(check, pollIntervalMs);

    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [pollIntervalMs, nonce]);

  return { state, refresh };
}