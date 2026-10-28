import Link from "next/link";
import { Suspense } from "react";
import { HubNavFrame } from "@/components/hub/HubNavFrame";
import { HubLogo } from "@/components/hub/HubAppIcon";
import { HubNavSwitcher } from "@/components/hub/HubNavSwitcher";
import { HubTextSizeControl } from "@/components/hub/HubTextSizeControl";

// Barre non collante : texte agrandi à 200 %, une barre fixe masquerait une grande partie de l'écran.
export function HubNav() {
  return (
    <HubNavFrame>
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2">
        <Link
          href="/"
          aria-label="FactorySuite, accueil du Hub"
          className="flex items-center gap-2.5 rounded-lg font-bold tracking-tight text-white group-data-light/nav:text-[#2e2e2e]"
        >
          <HubLogo size="sm" />
          <span aria-hidden>
            Factory<span className="text-zinc-300 group-data-light/nav:text-[#454545]">Suite</span>
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
    </HubNavFrame>
  );
}
