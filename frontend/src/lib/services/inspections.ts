// frontend/src/lib/services/inspections.ts
// Miroir des schémas Pydantic. Si le backend change son contrat,
// la compilation TypeScript échoue — c'est le but.

import { apiFetch } from "@/lib/api";

export type Severity = "low" | "medium" | "high" | "critical";
export type DamageClass = "crack" | "erosion" | "lightning_strike" | "delamination";
export type InspectionStatus = "queued" | "processing" | "done" | "failed";

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