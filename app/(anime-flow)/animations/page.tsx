import type { Metadata } from "next";
import { Suspense } from "react";
import { AnimationsApp } from "@/app/(anime-flow)/animations/_components/AnimationsApp";

export const metadata: Metadata = {
  title: "Animations — FactorySuite",
  description: "Ajoutez des animations aux éléments de votre page.",
};

export default function AnimationsPage() {
  return (
    // Pleine largeur : AnimationsApp pose son propre fond (charte : _brand/BRAND.md).
    <main className="flex min-h-0 w-full flex-1 flex-col">
      <Suspense fallback={<p className="px-4 py-10 text-lg text-zinc-300">Chargement…</p>}>
        <AnimationsApp />
      </Suspense>
    </main>
  );
}
