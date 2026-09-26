// frontend/src/lib/services/turbines.ts
// Miroir de TurbineRead. Si le backend change son contrat, la compilation
// TypeScript échoue — c'est le but.

import { apiFetch } from "@/lib/api";

export type Turbine = {
  id: string;
  tag: string;
  site_name: string | null;
  latitude: number | null;
  longitude: number | null;
  model: string | null;
  created_at: string;
  inspection_count: number;
  last_inspection_at: string | null;
};

export function listTurbines(signal?: AbortSignal): Promise<Turbine[]> {
  return apiFetch<Turbine[]>("/turbines", { signal });
}
