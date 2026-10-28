import type { Metadata } from "next";
import { Suspense } from "react";
import { Instrument_Sans } from "next/font/google";
import { QualityApp } from "@/app/quality/_components/QualityApp";
import { qualityFocus } from "@/app/quality/_lib/quality-styles";

export const metadata: Metadata = {
  title: "Qualité — FactorySuite",
  description: "Contrôle de la performance, de l'accessibilité, des bonnes pratiques et du SEO de la page produite.",
};

// Police d'affichage réservée aux grands titres ; le texte courant garde Atkinson (cadre du Hub).
const display = Instrument_Sans({ variable: "--font-instrument-sans", subsets: ["latin", "latin-ext"], weight: "500" });

// Suspense obligatoire : QualityApp lit ?project_id= (useSearchParams) et l'export est statique.
export default function QualityPage() {
  return (
    <main className={`${display.variable} ${qualityFocus} flex flex-1 flex-col bg-[#fdfcfb] text-[#2e2e2e]`}>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-12">
        <Suspense
          fallback={
            <p role="status" className="text-base text-[#454545]">
              Chargement…
            </p>
          }
        >
          <QualityApp />
        </Suspense>
      </div>
    </main>
  );
}
