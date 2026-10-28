import { Suspense } from "react";
import { GeneratorApp } from "@/app/(codeforg)/generator/_components/GeneratorApp";

export default function GeneratorPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
      <Suspense fallback={<p className="text-sm text-zinc-500">Chargement…</p>}>
        <GeneratorApp />
      </Suspense>
    </main>
  );
}
