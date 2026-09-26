// frontend/src/components/UploadPanel.tsx
"use client";

import { useState } from "react";
import { useInspection } from "@/hooks/useInspection";
import { uploadInspection } from "@/lib/services/inspections";
import { ApiError } from "@/lib/api";
import { DetectionOverlay } from "@/components/DetectionOverlay";

export function UploadPanel({ turbineId }: { turbineId: string | null }) {
  const [files, setFiles] = useState<File[]>([]);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const state = useInspection(inspectionId);

  async function handleSubmit() {
    if (turbineId === null) return;

    setUploading(true);
    setUploadError(null);
    try {
      const created = await uploadInspection(turbineId, files);
      // À partir d'ici le hook prend le relais et interroge le backend.
      setInspectionId(created.id);
      setFiles([]);
    } catch (error) {
      setUploadError(error instanceof ApiError ? error.message : "Envoi impossible");
    } finally {
      setUploading(false);
    }
  }

  function buttonLabel() {
    if (turbineId === null) return "Sélectionnez une éolienne";
    if (uploading) return "Envoi...";
    if (files.length === 0) return "Choisissez des images";
    return `Analyser ${files.length} image${files.length === 1 ? "" : "s"}`;
  }

  return (
    <section className="space-y-6">
      <div className="space-y-3 rounded-lg border-2 border-dashed border-slate-300 p-6 transition-colors hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500">
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:text-white hover:file:bg-slate-700 dark:text-slate-300 dark:file:bg-slate-200 dark:file:text-slate-900 dark:hover:file:bg-white"
        />

        <button
          type="button"
          disabled={turbineId === null || files.length === 0 || uploading}
          onClick={handleSubmit}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
        >
          {/* Le libellé dit pourquoi le bouton est inactif : un bouton
              simplement grisé laisse l'utilisateur deviner. */}
          {buttonLabel()}
        </button>

        {uploadError && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {uploadError}
          </p>
        )}
      </div>

      {/* aria-live : l'avancement est annoncé aux lecteurs d'écran. */}
      <div role="status" aria-live="polite" className="space-y-6">
        {state.kind === "polling" && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Analyse en cours{state.inspection ? ` (${state.inspection.status})` : ""}...
          </p>
        )}

        {state.kind === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
        )}

        {state.kind === "ready" && state.inspection.status === "failed" && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Analyse échouée : {state.inspection.error_message}
          </p>
        )}

        {state.kind === "ready" &&
          state.inspection.status === "done" &&
          state.inspection.images.map((image) => (
            <DetectionOverlay key={image.id} image={image} />
          ))}
      </div>
    </section>
  );
}
