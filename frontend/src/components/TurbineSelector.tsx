// frontend/src/components/TurbineSelector.tsx
"use client";

import { useTurbines } from "@/hooks/useTurbines";
import type { Turbine } from "@/lib/services/turbines";

// Créé une seule fois : instancier un formateur à chaque rendu est coûteux.
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function lastInspectionLabel(turbine: Turbine): string {
  if (turbine.last_inspection_at === null) {
    return "Jamais inspectée";
  }
  return `Dernière inspection : ${DATE_FORMAT.format(new Date(turbine.last_inspection_at))}`;
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Squelettes plutôt qu'un simple texte : la mise en page ne saute
            pas quand les données arrivent. */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            aria-hidden="true"
            className="animate-pulse space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700"
          >
            <div className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
        <p role="status" className="sr-only">
          Chargement des éoliennes
        </p>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div
        role="alert"
        className="space-y-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm dark:border-red-800 dark:bg-red-950"
      >
        <p className="text-red-700 dark:text-red-300">
          Impossible de charger les éoliennes : {state.message}
        </p>
        <button
          type="button"
          onClick={refresh}
          className="rounded-md border border-red-300 px-3 py-1.5 font-medium text-red-700 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (state.turbines.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
        Aucune éolienne enregistrée. Lancez{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">
          python -m scripts.seed
        </code>{" "}
        depuis <code className="font-mono">backend/</code> pour insérer les
        éoliennes de démonstration.
      </p>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Éolienne à inspecter"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {state.turbines.map((turbine) => {
        const isSelected = turbine.id === selectedId;

        return (
          // Un bouton et non un div : focusable au clavier et annoncé comme
          // interactif, sans avoir à recréer tabIndex ni les touches Entrée
          // et Espace à la main.
          <button
            key={turbine.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(turbine.id)}
            className={`rounded-lg border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
              isSelected
                ? // La sélection ne repose pas sur la couleur seule : bordure
                  // doublée et coche explicite, lisibles en vision daltonienne.
                  "border-2 border-sky-600 bg-sky-50 dark:border-sky-400 dark:bg-sky-950"
                : "border border-slate-200 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-500 dark:hover:bg-slate-900"
            }`}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {turbine.tag}
              </span>
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="text-sm font-bold text-sky-700 dark:text-sky-300"
                >
                  ✓
                </span>
              )}
            </span>

            <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">
              {turbine.site_name ?? "Site inconnu"}
            </span>

            <span className="mt-2 block text-xs text-slate-500 dark:text-slate-500">
              {turbine.model ?? "Modèle inconnu"}
            </span>

            <span className="mt-3 block text-xs text-slate-600 dark:text-slate-400">
              {turbine.inspection_count} inspection
              {turbine.inspection_count === 1 ? "" : "s"}
            </span>

            <span className="block text-xs text-slate-500 dark:text-slate-500">
              {lastInspectionLabel(turbine)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
