// frontend/src/components/UploadPanel.tsx
"use client";

import { useState } from "react";
import { useInspection } from "@/hooks/useInspection";
import { uploadInspection } from "@/lib/services/inspections";
import { ApiError } from "@/lib/api";
import { DetectionOverlay } from "@/components/DetectionOverlay";

export function UploadPanel({ turbineId }: { turbineId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const state = useInspection(inspectionId);

  async function handleSubmit() {
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

  return (
    <section className="space-y-6">
      <div className="space-y-3 rounded-lg border border-dashed border-slate-300 p-6">
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-sm"
        />

        <button
          type="button"
          disabled={files.length === 0 || uploading}
          onClick={handleSubmit}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          {uploading ? "Envoi..." : `Analyser ${files.length} image(s)`}
        </button>

        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
      </div>

      {/* aria-live : l'avancement est annoncé aux lecteurs d'écran. */}
      <div role="status" aria-live="polite" className="space-y-6">
        {state.kind === "polling" && (
          <p className="text-sm text-slate-600">
            Analyse en cours{state.inspection ? ` (${state.inspection.status})` : ""}...
          </p>
        )}

        {state.kind === "error" && <p className="text-sm text-red-600">{state.message}</p>}

        {state.kind === "ready" && state.inspection.status === "failed" && (
          <p className="text-sm text-red-600">
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