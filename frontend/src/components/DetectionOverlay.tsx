// frontend/src/components/DetectionOverlay.tsx
// Because the boxes are normalised, a 0 0 1 1 viewBox is enough: the SVG
// scales itself whatever the rendered size. No ratio maths, no resize listener.

"use client";

import { imageFileUrl, type InspectionImage, type Severity } from "@/lib/services/inspections";

// Severity resolves to a CSS variable rather than a literal, so the scale
// follows the active theme without this component knowing which one is on.
const SEVERITY_COLOR: Record<Severity, string> = {
  low: "var(--sev-low)",
  medium: "var(--sev-medium)",
  high: "var(--sev-high)",
  critical: "var(--sev-critical)",
};

// Every badge carries its label in words: a coloured dot on its own is
// unreadable for part of the audience.
const SEVERITY_LABEL: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export function DetectionOverlay({ image }: { image: InspectionImage }) {
  return (
    <figure className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-card bg-sunken">
        {/* width/height come from the API and reserve the right box before
            the file arrives, so the results list does not jump as each photo
            loads. lazy: an inspection may carry up to 50 images. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageFileUrl(image.id)}
          alt={image.original_filename ?? "Inspection image"}
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full"
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
              stroke={SEVERITY_COLOR[d.severity]}
              // vectorEffect stops the viewBox from stretching the stroke:
              // without it the borders render distorted.
              vectorEffect="non-scaling-stroke"
              strokeWidth={2}
            />
          ))}
        </svg>
      </div>

      <figcaption className="text-sm text-ink-muted">
        {image.detections.length === 0 ? (
          "No damage detected"
        ) : (
          <ul className="flex flex-col gap-2">
            {image.detections.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-3 rounded-card bg-card px-3.5 py-2.5"
              >
                <span
                  aria-hidden="true"
                  className="w-1 self-stretch rounded-full"
                  style={{ background: SEVERITY_COLOR[d.severity] }}
                />
                <span className="grow text-sm font-semibold text-ink">
                  {d.damage_class}
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide"
                  style={{
                    background: SEVERITY_COLOR[d.severity],
                    color: "var(--on-sev)",
                  }}
                >
                  {SEVERITY_LABEL[d.severity].toUpperCase()}
                </span>
                <span className="w-12 text-right font-mono text-sm text-ink-soft tabular-nums">
                  {Math.round(d.confidence * 100)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </figcaption>
    </figure>
  );
}
