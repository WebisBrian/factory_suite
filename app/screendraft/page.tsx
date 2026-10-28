import { Suspense } from "react";
import { ScreenDraftEditor } from "@/components/screendraft/ScreenDraftEditor";

export default function ScreenDraftPage() {
  return (
    <Suspense fallback={<main className="p-8 text-zinc-400">Chargement de Screendraft…</main>}>
      <ScreenDraftEditor />
    </Suspense>
  );
}