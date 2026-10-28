import { Suspense } from "react";
import { BrandScreendraftEditor } from "@/components/screendraft/BrandScreendraftEditor";
import { maquetteFixture } from "@/components/screendraft/temp-fixture";

export default function ScreenDraftPage() {
  return (
    <Suspense fallback={<main className="p-8 text-zinc-400">Chargement de Screendraft…</main>}>
      <BrandScreendraftEditor draft={maquetteFixture} />
    </Suspense>
  );
}
