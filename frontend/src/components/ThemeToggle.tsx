// frontend/src/components/ThemeToggle.tsx
"use client";

import { useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

// The theme is not React state: it lives on <html> and in localStorage, and
// the OS can change it underneath us. That makes it an external store, so it
// is read through useSyncExternalStore rather than mirrored into useState
// from an effect (which would render once with the wrong value, then again).
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => {
    listeners.delete(onChange);
    media.removeEventListener("change", onChange);
  };
}

function getSnapshot(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;

  // Falls back to storage before the OS: if the pre-paint script ever fails
  // to run, the viewer still gets the theme they picked — with a flash, but
  // not with the wrong theme.
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage blocked; fall through to the OS preference.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// The server cannot know the viewer's theme. This value only has to be
// stable: useSyncExternalStore reads the real one immediately after
// hydration, so no markup mismatch is reported.
function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const goingDark = theme !== "dark";

  function toggle() {
    const next: Theme = goingDark ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing or blocked storage: the choice simply does not
      // survive a reload, which beats breaking the button.
    }
    listeners.forEach((notify) => notify());
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={goingDark ? "Switch to dark theme" : "Switch to light theme"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-card hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {goingDark ? (
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </>
        )}
      </svg>
    </button>
  );
}
