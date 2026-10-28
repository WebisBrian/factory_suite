import type { Metadata } from "next";
import { Suspense } from "react";
import { AnimationsApp } from "@/app/(anime-flow)/animations/_components/AnimationsApp";

export const metadata: Metadata = {
  title: "Animations — FactorySuite",
  description: "Ajoutez des animations aux éléments de votre page.",
};

export default function AnimationsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
      <Suspense fallback={<p className="text-lg text-zinc-300">Chargement…</p>}>
        <AnimationsApp />
      </Suspense>
    </main>
  );
}
