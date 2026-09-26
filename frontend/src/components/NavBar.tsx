// frontend/src/components/NavBar.tsx
// Server Component : rien d'interactif ici. ApiStatus porte lui-même son
// "use client", la barre reste donc hors du bundle client.

import { ApiStatus } from "@/components/ApiStatus";

export function NavBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <span className="text-sm font-semibold text-slate-900 sm:text-base dark:text-slate-100">
          Wind Turbine Defect Detection
        </span>
        <ApiStatus />
      </div>
    </header>
  );
}
