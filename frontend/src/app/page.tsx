import { InspectionView } from "@/components/InspectionView";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Nouvelle inspection
      </h1>
      <InspectionView />
    </main>
  );
}
