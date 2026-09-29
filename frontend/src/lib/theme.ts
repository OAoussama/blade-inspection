// frontend/src/lib/theme.ts
// Shared by the server layout and the client toggle, so it must NOT live in a
// "use client" module: a Server Component importing a value from one gets a
// client-reference proxy, and plain exports come back as undefined. That is
// exactly how this constant silently became `undefined` inside the pre-paint
// script, leaving the stored theme unread on every load.

export const THEME_STORAGE_KEY = "blade-theme";

export type Theme = "light" | "dark";
