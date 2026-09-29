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
      // From here the hook takes over and polls the backend.
      setInspectionId(created.id);
      setFiles([]);
    } catch (error) {
      setUploadError(error instanceof ApiError ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function buttonLabel() {
    if (turbineId === null) return "Select a turbine first";
    if (uploading) return "Uploading…";
    if (files.length === 0) return "Choose images";
    return `Analyse ${files.length} image${files.length === 1 ? "" : "s"}`;
  }

  const damageCount =
    state.kind === "ready" && state.inspection.status === "done"
      ? state.inspection.images.reduce((n, image) => n + image.detections.length, 0)
      : 0;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-4 rounded-card border-2 border-dashed border-hairline p-6 transition-colors hover:border-ink-dim">
        <input
          type="file"
          id="inspection-files"
          accept="image/jpeg,image/png"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-card file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-hairline"
        />

        <button
          type="button"
          disabled={turbineId === null || files.length === 0 || uploading}
          onClick={handleSubmit}
          className="self-start rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-on-accent transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-card disabled:text-ink-muted"
        >
          {/* The label says why the button is inactive: a greyed-out button
              alone leaves the user guessing. */}
          {buttonLabel()}
        </button>

        {uploadError && (
          <p role="alert" className="text-sm text-sev-critical">
            {uploadError}
          </p>
        )}
      </div>

      {/* aria-live: progress is announced to screen readers. */}
      <div role="status" aria-live="polite" className="flex flex-col gap-6">
        {state.kind === "polling" && (
          <p className="flex items-center gap-2.5 text-sm text-ink-soft">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden="true" />
            Analysing{state.inspection ? ` (${state.inspection.status})` : ""}…
          </p>
        )}

        {state.kind === "error" && (
          <p className="text-sm text-sev-critical">{state.message}</p>
        )}

        {state.kind === "ready" && state.inspection.status === "failed" && (
          <p className="text-sm text-sev-critical">
            Analysis failed: {state.inspection.error_message}
          </p>
        )}

        {state.kind === "ready" && state.inspection.status === "done" && (
          <>
            <h3 className="font-display text-2xl leading-[0.95] sm:text-display-md">
              {damageCount} DEFECT{damageCount === 1 ? "" : "S"}
              <br />
              DETECTED
            </h3>

            {state.inspection.images.map((image) => (
              <DetectionOverlay key={image.id} image={image} />
            ))}

            <dl className="flex flex-wrap gap-7 rounded-card bg-sunken p-4">
              <div className="flex flex-col gap-1">
                <dt className="text-[11px] text-ink-muted">Model</dt>
                <dd className="font-mono text-sm">
                  {state.inspection.model_version ?? "—"}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-[11px] text-ink-muted">Images</dt>
                <dd className="font-mono text-sm">{state.inspection.images.length}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-[11px] text-ink-muted">Defects</dt>
                <dd className="font-mono text-sm">{damageCount}</dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </div>
  );
}
