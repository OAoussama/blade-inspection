// frontend/src/components/InspectionView.tsx
// Owns the selected turbine and hands it to the upload panel. That state has
// to live above both children, so it lives here.

"use client";

import { useState } from "react";
import { TurbineSelector } from "@/components/TurbineSelector";
import { UploadPanel } from "@/components/UploadPanel";

function StepLabel({ children }: { children: string }) {
  return (
    <span className="self-start rounded-full bg-accent px-3 py-1 text-[11px] font-bold tracking-widest text-on-accent">
      {children}
    </span>
  );
}

export function InspectionView() {
  const [selectedTurbineId, setSelectedTurbineId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-7 rounded-block bg-field p-6 sm:p-9">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end sm:gap-10">
          <div className="flex flex-col gap-3">
            <StepLabel>STEP 1</StepLabel>
            <h1 className="font-display text-3xl leading-[0.92] sm:text-display-lg">
              SELECT
              <br />
              THE TURBINE
            </h1>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
            Inspection count and last date are aggregated in a single{" "}
            <span className="font-mono">GET /turbines</span> call.
          </p>
        </div>

        <TurbineSelector
          selectedId={selectedTurbineId}
          onSelect={setSelectedTurbineId}
        />
      </section>

      <section className="flex flex-col gap-7 rounded-block bg-panel p-6 sm:p-9">
        <div className="flex flex-col gap-3">
          <StepLabel>STEP 2</StepLabel>
          <h2 className="font-display text-3xl leading-[0.92] sm:text-display-lg">
            UPLOAD
            <br />
            THE IMAGES
          </h2>
        </div>

        <UploadPanel turbineId={selectedTurbineId} />
      </section>
    </div>
  );
}
