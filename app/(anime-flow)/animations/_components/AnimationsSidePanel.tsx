"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { SECONDARY_BUTTON } from "@/app/(anime-flow)/animations/_lib/field-styles";

export type SidePanelView = "settings" | "editor";

type Props = {
  view: SidePanelView;
  /** Nom de l'élément sélectionné, null si aucun. */
  selectedName: string | null;
  onBack: () => void;
  /** Réglages de l'élément sélectionné. */
  settings: ReactNode;
  /** Formulaire de création d'animation. */
  editor: ReactNode;
};

/** Panneau de droite (comme les propriétés de Screendraft) : réglages, ou création d'une animation. */
export function AnimationsSidePanel({ view, selectedName, onBack, settings, editor }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const previousView = useRef(view);

  // À chaque bascule (pas au premier rendu), le focus suit : clavier et lecteur d'écran arrivent sur la vue.
  useEffect(() => {
    if (previousView.current === view) return;
    previousView.current = view;
    heading.current?.focus();
  }, [view]);

  return (
    <aside
      aria-labelledby="animations-panel-title"
      className="relative flex flex-col gap-4 border-t border-(--line) bg-(--surface-raised) p-4 lg:w-96 lg:max-w-[32vw] lg:shrink-0 lg:overflow-y-auto lg:overscroll-contain lg:border-t-0 lg:border-l"
    >
      {view === "editor" && (
        <button type="button" onClick={onBack} className={`${SECONDARY_BUTTON} self-start`}>
          <span aria-hidden>←</span> Retour aux réglages
        </button>
      )}
      <h2 ref={heading} id="animations-panel-title" tabIndex={-1} className="text-xl font-semibold break-words">
        {view === "editor" ? "Nouvelle animation" : selectedName ? `Réglages de : ${selectedName}` : "Réglages"}
      </h2>
      {view === "editor" ? (
        editor
      ) : selectedName ? (
        settings
      ) : (
        <p className="text-lg text-(--ink-muted)">
          Sélectionnez un élément dans la liste ou cliquez dessus dans l&apos;aperçu pour lui choisir une animation.
        </p>
      )}
    </aside>
  );
}
