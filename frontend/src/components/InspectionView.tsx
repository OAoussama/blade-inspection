// frontend/src/components/InspectionView.tsx
// Porte l'éolienne sélectionnée et la transmet au panneau d'upload. Cet
// état doit vivre au-dessus des deux composants, donc ici.

"use client";

import { useState } from "react";
import { TurbineSelector } from "@/components/TurbineSelector";
import { UploadPanel } from "@/components/UploadPanel";

export function InspectionView() {
  const [selectedTurbineId, setSelectedTurbineId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          1. Choisir l&apos;éolienne
        </h2>
        <TurbineSelector
          selectedId={selectedTurbineId}
          onSelect={setSelectedTurbineId}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          2. Envoyer les images
        </h2>
        <UploadPanel turbineId={selectedTurbineId} />
      </section>
    </div>
  );
}
