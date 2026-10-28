"use client";

import { useRef, useState, type ReactNode } from "react";
import { ScreendraftPrototype } from "@/components/screendraft/ScreendraftPrototype";
import { ScreendraftTemplatePreview } from "@/components/screendraft/ScreendraftTemplatePreview";
import type { Maquette } from "@/components/screendraft/screendraft-schema";
import {
  SCREENDRAFT_TEMPLATES,
  type ScreendraftTemplate,
} from "@/components/screendraft/templates/screendraft-templates";

type ScreendraftTemplatePickerProps = {
  /** Titre et explications au-dessus de la liste des modèles. */
  intro: ReactNode;
  /** Libellé du bouton de choix, suivi du nom du modèle (ex. « Utiliser »). */
  chooseLabel: string;
  /** Modèle en cours d'import : son bouton est désactivé, comme les autres. */
  busy?: boolean;
  onChoose: (template: ScreendraftTemplate) => void;
};

/**
 * Liste des modèles de maquette, chacun avec une vignette de son premier écran.
 * « Aperçu » ouvre le prototype du modèle (tous ses écrans, liens compris) par-dessus la liste.
 * Occupe tout son conteneur, qui doit être positionné (`relative`).
 */
export function ScreendraftTemplatePicker({ intro, chooseLabel, busy = false, onChoose }: ScreendraftTemplatePickerProps) {
  const [previewed, setPreviewed] = useState<ScreendraftTemplate | null>(null);
  // Bouton « Aperçu » qui a ouvert le prototype : il reprend le focus à la fermeture.
  const opener = useRef<HTMLButtonElement | null>(null);

  function closePreview() {
    setPreviewed(null);
    // Après le rendu : le bouton n'est plus inerte.
    requestAnimationFrame(() => opener.current?.focus());
  }

  return (
    <div className="absolute inset-0">
      {previewed && (
        <ScreendraftPrototype
          screens={previewed.maquette.screens}
          startScreenId={previewed.maquette.screens[0].id}
          onClose={closePreview}
        />
      )}
      <div inert={previewed !== null} className="absolute inset-0 overflow-auto p-(--space-6)">
        {intro}
        <ul className="mt-(--space-6) grid grid-cols-[repeat(auto-fill,minmax(min(100%,21rem),1fr))] gap-(--space-4)">
          {SCREENDRAFT_TEMPLATES.map((template) => (
            <li
              key={template.id}
              className="flex flex-col gap-(--space-3) rounded-(--radius-lg) border border-(--line-strong) bg-(--surface-raised) p-(--space-4)"
            >
              <ScreendraftTemplatePreview
                screen={template.maquette.screens[0]}
                label={`Aperçu du modèle ${template.name} : écran ${template.maquette.screens[0].name}`}
              />
              <h3 className="text-lg font-semibold text-(--ink)">{template.name}</h3>
              <p className="text-base text-(--ink)">{template.description}</p>
              <p className="text-sm text-(--ink-muted)">{summary(template.maquette)}</p>
              <div className="mt-auto flex flex-wrap gap-(--space-2)">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onChoose(template)}
                  className="min-h-10 rounded-(--radius-md) bg-(--draft) px-(--space-4) py-(--space-2) text-sm font-semibold text-(--on-draft) hover:bg-(--draft-strong) disabled:bg-(--line-strong)"
                >
                  {chooseLabel}
                  <span className="sr-only"> le modèle {template.name}</span>
                </button>
                {hasContent(template.maquette) && (
                  <button
                    type="button"
                    onClick={(event) => {
                      opener.current = event.currentTarget;
                      setPreviewed(template);
                    }}
                    className="min-h-10 rounded-(--radius-md) border border-(--line-strong) bg-(--surface-raised) px-(--space-4) py-(--space-2) text-sm font-semibold text-(--ink) hover:bg-(--canvas)"
                  >
                    Aperçu
                    <span className="sr-only"> du modèle {template.name}</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Ex. « 3 écrans : Accueil, Carte, Commander ». */
function summary({ screens }: Maquette): string {
  const names = screens.map((screen) => screen.name).join(", ");
  return `${screens.length} ${screens.length > 1 ? "écrans" : "écran"} : ${names}`;
}

function hasContent({ screens }: Maquette): boolean {
  return screens.some((screen) => screen.nodes.length > 0);
}
