// frontend/src/components/DetectionOverlay.tsx
// Les bbox étant normalisées, un viewBox 0 0 1 1 suffit : le SVG se met
// à l'échelle tout seul, quelle que soit la taille d'affichage. Aucun
// calcul de ratio, aucun listener de resize.

"use client";

import { imageFileUrl, type InspectionImage, type Severity } from "@/lib/services/inspections";

const STROKE: Record<Severity, string> = {
  low: "#38bdf8",
  medium: "#facc15",
  high: "#fb923c",
  critical: "#ef4444",
};

// Chaque badge porte son libellé en texte : une pastille de couleur seule
// serait indéchiffrable en vision daltonienne.
const SEVERITY_LABEL: Record<Severity, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
  critical: "Critique",
};

const SEVERITY_BADGE: Record<Severity, string> = {
  low: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  medium: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  high: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  critical: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export function DetectionOverlay({ image }: { image: InspectionImage }) {
  return (
    <figure className="space-y-2">
      <div className="relative overflow-hidden rounded-lg border border-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageFileUrl(image.id)}
          alt={image.original_filename ?? "Image d'inspection"}
          className="block w-full"
        />

        <svg
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {image.detections.map((d) => (
            <rect
              key={d.id}
              x={d.bbox_x}
              y={d.bbox_y}
              width={d.bbox_w}
              height={d.bbox_h}
              fill="none"
              stroke={STROKE[d.severity]}
              // vectorEffect empêche le trait d'être étiré par le viewBox :
              // sans lui, les bordures apparaissent déformées.
              vectorEffect="non-scaling-stroke"
              strokeWidth={2}
            />
          ))}
        </svg>
      </div>

      <figcaption className="text-sm text-slate-600 dark:text-slate-400">
        {image.detections.length === 0 ? (
          "Aucun dommage détecté"
        ) : (
          <ul className="flex flex-wrap gap-2">
            {image.detections.map((d) => (
              <li
                key={d.id}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${SEVERITY_BADGE[d.severity]}`}
              >
                <span className="font-medium">{d.damage_class}</span>
                <span>· {SEVERITY_LABEL[d.severity]}</span>
                <span className="opacity-75">{Math.round(d.confidence * 100)} %</span>
              </li>
            ))}
          </ul>
        )}
      </figcaption>
    </figure>
  );
}