import { Suspense } from "react";
import { Instrument_Sans } from "next/font/google";
import { GeneratorApp } from "@/app/codeforge/generator/_components/GeneratorApp";
import { generatorFocus } from "@/app/codeforge/generator/_lib/generator-styles";

// Police d'affichage réservée aux grands titres ; le texte courant garde Atkinson (cadre du Hub).
const display = Instrument_Sans({ variable: "--font-instrument-sans", subsets: ["latin", "latin-ext"], weight: "500" });

export default function GeneratorPage() {
  return (
    <main className={`${display.variable} ${generatorFocus} flex flex-1 flex-col bg-[#fdfcfb] text-[#2e2e2e]`}>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-12">
        <Suspense
          fallback={
            <p role="status" className="text-base text-[#454545]">
              Chargement…
            </p>
          }
        >
          <GeneratorApp />
        </Suspense>
      </div>
    </main>
  );
}
