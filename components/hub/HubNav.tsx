import Link from "next/link";
import { HubLogo } from "@/components/hub/HubAppIcon";
import { HubTextSizeControl } from "@/components/hub/HubTextSizeControl";
import { hubPrimaryButton, hubSecondaryButton } from "@/components/hub/hub-styles";

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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <nav aria-label="Actions principales" className="flex flex-wrap items-center gap-2">
            {/* Commencer : création / ouverture d'un projet sur le tableau de bord du Hub. */}
            <Link href="/#hub-projects-title" className={hubPrimaryButton}>
              Commencer
            </Link>
            {/* Démo : premier outil du pipeline sans project_id, donc contre les fixtures. */}
            <Link
              href="/screendraft"
              aria-label="Démo : ouvrir ScreenDraft avec la maquette d'exemple"
              className={hubSecondaryButton}
            >
              Démo
            </Link>
          </nav>
          <HubTextSizeControl />
        </div>
      </div>
    </header>
  );
}
