import Link from "next/link";
import { HubNavFrame } from "@/components/hub/HubNavFrame";
import { HubLogo } from "@/components/hub/HubAppIcon";
import { HubTextSizeControl } from "@/components/hub/HubTextSizeControl";
import { hubPrimaryButton, hubSecondaryButton } from "@/components/hub/hub-styles";

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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <nav aria-label="Actions principales" className="flex flex-wrap items-center gap-2">
            {/* Commencer : création / ouverture d'un projet sur le tableau de bord du Hub. */}
            <Link
              href="/#hub-projects-title"
              className={`${hubPrimaryButton} group-data-light/nav:bg-none group-data-light/nav:bg-[#2e2e2e]`}
            >
              Commencer
            </Link>
            {/* Démo : premier outil du pipeline sans project_id, donc contre les fixtures. */}
            <Link
              href="/screendraft"
              aria-label="Démo : ouvrir ScreenDraft avec la maquette d'exemple"
              className={`${hubSecondaryButton} group-data-light/nav:border-zinc-500 group-data-light/nav:text-[#2e2e2e] group-data-light/nav:hover:bg-black/5`}
            >
              Démo
            </Link>
          </nav>
          <HubTextSizeControl />
        </div>
      </div>
    </HubNavFrame>
  );
}
