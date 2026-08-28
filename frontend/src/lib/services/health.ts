//contrat de la ressource /health

// frontend/src/lib/services/health.ts
// Un fichier par ressource de l'API. Les types miroitent les schemas
// Pydantic du backend : si le contrat change, la compilation echoue.

import { apiFetch } from "@/lib/api";

export type HealthResponse = {
  status: string;
};

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health", { signal });
}