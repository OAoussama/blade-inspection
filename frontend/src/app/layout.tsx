import type { Metadata } from "next";
import { Anton, Geist, Space_Mono } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Headings. Anton exists in one weight only, which is the point.
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

// Figures: counts, confidences, model metrics. Regular only — nothing in the
// interface uses bold monospace, and the 700 face was dead weight.
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Wind Turbine Defect Detection",
  description: "Blade damage detection from drone imagery.",
};

// Runs before first paint: without it the page renders in the OS theme and
// then snaps to the stored one, which is visible as a flash.
//
// The only interpolated value is THEME_STORAGE_KEY, a module-level literal
// passed through JSON.stringify. No request, user or network data reaches
// this string, so there is nothing here to inject into.
const NO_FLASH = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The script below sets data-theme before React hydrates, so this one
      // element legitimately differs from the server markup. The flag applies
      // to this element's own attributes only, never to its children.
      suppressHydrationWarning
      className={`${geistSans.variable} ${anton.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ground">
        {/* First child of <body>, not inside <head>: Next drops a raw script
            from a layout's <head>, which silently left data-theme unset and
            made the stored choice lose to the OS preference on every load. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
        <NavBar />
        {children}
      </body>
    </html>
  );
}
