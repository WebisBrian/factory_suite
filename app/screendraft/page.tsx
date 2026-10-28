import type { Metadata } from "next";
import { Suspense } from "react";
import { ScreendraftApp } from "@/components/screendraft/ScreendraftApp";

export const metadata: Metadata = {
  title: "Screendraft — FactorySuite",
  description: "Créez des maquettes de sites web à partir de composants.",
};

// Suspense obligatoire : ScreendraftApp lit ?project_id= (useSearchParams) et l'export est statique.
export default function ScreendraftPage() {
  return (
    <Suspense fallback={<p role="status" className="p-8 text-base text-zinc-300">Chargement…</p>}>
      <ScreendraftApp />
    </Suspense>
  );
}
