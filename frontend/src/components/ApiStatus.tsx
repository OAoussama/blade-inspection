//affichage

// frontend/src/components/ApiStatus.tsx
// Composant purement presentationnel : il consomme le hook et affiche.
// Aucun fetch, aucune URL, aucun try/catch ici.

"use client";

import { useApiHealth } from "@/hooks/useApiHealth";

const DOT = {
  loading: "bg-slate-400 animate-pulse",
  online: "bg-emerald-500",
  offline: "bg-red-500",
} as const;

export function ApiStatus() {
  const { state, refresh } = useApiHealth();

  return (
    // role="status" + aria-live : un lecteur d'ecran annonce le changement
    // d'etat sans que l'utilisateur ait a chercher l'information.
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm"
    >
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[state.kind]}`}
      />

      <span className="flex-1">
        {state.kind === "loading" && "Verification de l'API..."}
        {state.kind === "online" && (
          <>
            API en ligne
            <span className="ml-2 text-slate-500">
              {state.status} - {state.latencyMs} ms
            </span>
          </>
        )}
        {state.kind === "offline" && (
          <>
            API injoignable
            <span className="ml-2 text-slate-500">{state.message}</span>
          </>
        )}
      </span>

      <button
        type="button"
        onClick={refresh}
        className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
      >
        Reessayer
      </button>
    </div>
  );
}