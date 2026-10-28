import Link from "next/link";
import { Suspense } from "react";
import { HubLogo } from "@/components/hub/HubAppIcon";
import { HubNavSwitcher } from "@/components/hub/HubNavSwitcher";
import { HubTextSizeControl } from "@/components/hub/HubTextSizeControl";

// Barre non collante : texte agrandi à 200 %, une barre fixe masquerait une grande partie de l'écran.
export function HubNav() {
  return (
    <header className="border-b border-zinc-700 bg-[#121218]">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2">
        <Link
          href="/"
          aria-label="FactorySuite, accueil du Hub"
          className="flex items-center gap-2.5 rounded-lg font-bold tracking-tight text-white"
        >
          <HubLogo size="sm" />
          <span aria-hidden>
            Factory<span className="text-zinc-300">Suite</span>
          </span>
        </Link>
        <nav aria-label="Outils de la suite">
          {/* useSearchParams (project_id) → Suspense obligatoire pour l'export statique. */}
          <Suspense fallback={null}>
            <HubNavSwitcher />
          </Suspense>
        </nav>
        <HubTextSizeControl />
      </div>
    </header>
  );
}
