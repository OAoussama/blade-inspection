// frontend/src/components/NavBar.tsx
// Server Component: nothing here is interactive. ApiStatus and ThemeToggle
// carry their own "use client", so the bar itself stays off the client bundle.

import { ApiStatus } from "@/components/ApiStatus";
import { ThemeToggle } from "@/components/ThemeToggle";

export function NavBar() {
  return (
    // The sticky wrapper is painted in the page colour: without it, content
    // would scroll through the gutter above the rounded block.
    <div className="sticky top-0 z-10 bg-ground px-4 pt-4 pb-2">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 rounded-block bg-panel px-5 sm:px-7">
        <span className="font-display text-lg tracking-wide sm:text-xl">
          BLADE INSPECTION
        </span>
        <div className="flex items-center gap-2">
          <ApiStatus />
          <ThemeToggle />
        </div>
      </header>
    </div>
  );
}
