"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { ScreendraftTemplatePicker } from "@/components/screendraft/ScreendraftTemplatePicker";
import type { ScreendraftTemplate } from "@/components/screendraft/templates/screendraft-templates";

type ScreendraftTemplateDialogProps = {
  onChoose: (template: ScreendraftTemplate) => void;
  onClose: () => void;
};

/** Choix d'un modèle depuis l'éditeur : il remplace la maquette ouverte. Échap ferme. */
export function ScreendraftTemplateDialog({ onChoose, onClose }: ScreendraftTemplateDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Les raccourcis de l'éditeur (Suppr, Ctrl/⌘ + Z…) ne s'appliquent pas à la liste des modèles.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation();
    if (event.key === "Escape") onClose();
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="screendraft-templates-title"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onKeyUp={(event) => event.stopPropagation()}
      className="absolute inset-0 z-20 flex flex-col bg-(--surface) text-(--ink) outline-none"
    >
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-(--space-3) border-b border-(--line) bg-(--surface-raised) px-(--space-4) py-(--space-2)">
        <h2 id="screendraft-templates-title" className="text-lg font-semibold">
          Modèles de maquette
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-keyshortcuts="Escape"
          className="ml-auto min-h-10 rounded-(--radius-md) border border-(--line-strong) bg-(--surface-raised) px-(--space-4) py-(--space-2) text-sm font-semibold text-(--ink) hover:bg-(--canvas)"
        >
          Fermer
        </button>
      </header>
      <div className="relative min-h-0 flex-1">
        <ScreendraftTemplatePicker
          chooseLabel="Charger"
          onChoose={onChoose}
          intro={
            <p className="max-w-3xl text-base text-(--ink)">
              Le modèle choisi remplace tous les écrans de la maquette ouverte. Vous pourrez revenir en arrière
              avec « Annuler » (Ctrl/⌘ + Z), puis enregistrer quand le résultat vous convient.
            </p>
          }
        />
      </div>
    </div>
  );
}
