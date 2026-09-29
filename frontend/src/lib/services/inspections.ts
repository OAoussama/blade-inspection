// frontend/src/lib/services/inspections.ts
// Mirrors the Pydantic schemas in backend/app/schemas/.

import { apiFetch } from "@/lib/api";

export type Severity = "low" | "medium" | "high" | "critical";
export type InspectionStatus = "queued" | "processing" | "done" | "failed";

/**
 * WTBD dataset classes — must stay in sync with DamageClass in
 * backend/app/models.py. The order mirrors the backend enum, which mirrors
 * the YOLO class indices: those are positional, so reordering there renames
 * every detection.
 *
 * Note this union is a declaration, not a guarantee: apiFetch casts the
 * response without validating it, so a backend rename shows up as a wrong
 * label on screen rather than a compile error. Zod (or similar) at the
 * service boundary is what would make it enforceable.
 */
export type DamageClass =
  | "craze"
  | "corrosion"
  | "surface_injure"
  | "thunderstrike"
  | "crack"
  | "hide_craze";

export type Detection = {
  id: string;
  damage_class: DamageClass;
  confidence: number;
  // Normalisées 0-1 : à multiplier par la taille AFFICHÉE, jamais par
  // les dimensions d'origine du fichier.
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
  area_ratio: number;
  severity: Severity;
};

export type InspectionImage = {
  id: string;
  original_filename: string | null;
  width: number;
  height: number;
  detections: Detection[];
};

export type Inspection = {
  id: string;
  turbine_id: string;
  status: InspectionStatus;
  model_version: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  images: InspectionImage[];
};

export type InspectionCreated = {
  id: string;
  status: InspectionStatus;
};

export function uploadInspection(
  turbineId: string,
  files: File[],
  signal?: AbortSignal
): Promise<InspectionCreated> {
  const form = new FormData();
  form.append("turbine_id", turbineId);
  files.forEach((file) => form.append("files", file));

  // Surtout PAS de Content-Type manuel : le navigateur doit générer
  // lui-même la boundary du multipart.
  return apiFetch<InspectionCreated>("/inspections", {
    method: "POST",
    body: form,
    signal,
    timeoutMs: 60_000,
  });
}

export function getInspection(id: string, signal?: AbortSignal): Promise<Inspection> {
  return apiFetch<Inspection>(`/inspections/${id}`, { signal });
}

export function imageFileUrl(imageId: string): string {
  return `${process.env.NEXT_PUBLIC_API_URL}/images/${imageId}/file`;
}