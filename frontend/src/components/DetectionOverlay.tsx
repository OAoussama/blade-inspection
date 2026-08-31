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

      <figcaption className="text-sm text-slate-600">
        {image.detections.length === 0
          ? "Aucun dommage détecté"
          : image.detections
              .map((d) => `${d.damage_class} (${d.severity}, ${Math.round(d.confidence * 100)} %)`)
              .join(" · ")}
      </figcaption>
    </figure>
  );
}