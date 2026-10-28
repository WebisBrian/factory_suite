"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Route d'AnimFlow (app/(anime-flow)/animations), l'outil qui suit CodeForge dans la chaîne.
const ANIMFLOW_PATH = "/animations";

type ScreendraftNextStepProps = {
  projectId: number;
  isDirty: boolean;
  /** Enregistre la maquette ; renvoie false en cas d'échec (l'erreur s'affiche à côté). */
  onSave: () => Promise<boolean>;
};

/**
 * « Passer à la suite » : le projet a déjà une page HTML, on l'ouvre directement dans AnimFlow.
 * Une navigation dans l'appli ne déclenche pas l'alerte « Quitter le site ? » :
 * les modifications en cours sont donc enregistrées d'abord, et on reste ici si ça échoue.
 */
export function ScreendraftNextStep({ projectId, isDirty, onSave }: ScreendraftNextStepProps) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  async function goToAnimations() {
    setIsLeaving(true);
    if (isDirty && !(await onSave())) {
      setIsLeaving(false);
      return;
    }
    router.push(`${ANIMFLOW_PATH}?project_id=${projectId}`);
  }

  return (
    <button
      type="button"
      onClick={() => void goToAnimations()}
      disabled={isLeaving}
      aria-describedby="screendraft-next-step-hint"
      className="text-body-sm flex min-h-10 items-center gap-(--space-2) rounded-(--radius-md) border border-(--line-strong) bg-(--surface-raised) px-(--space-4) py-(--space-2) font-semibold text-(--ink) hover:bg-(--canvas) disabled:border-(--line) disabled:text-(--ink-muted)"
    >
      Passer à la suite
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-4 fill-none stroke-current"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
      <span id="screendraft-next-step-hint" className="sr-only">
        {isDirty
          ? "Enregistre la maquette, puis ouvre la page HTML du projet dans AnimFlow."
          : "Ouvre la page HTML du projet dans AnimFlow."}
      </span>
    </button>
  );
}
