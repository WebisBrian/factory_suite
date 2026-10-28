"use client";

import { useCallback, useId, useSyncExternalStore, type ReactNode } from "react";

const STORAGE_PREFIX = "screendraft:panel:";

type ScreendraftPanelSectionProps = {
  /** Clé de mémorisation de l'état ouvert / replié, propre à chaque section. */
  id: string;
  /** id du titre : la section et sa liste s'y réfèrent (aria-labelledby), comme le veut le RGAA. */
  headingId: string;
  title: string;
  /** Nombre d'éléments, affiché à côté du titre : utile quand la section est repliée. */
  count?: number;
  /** Boutons à droite du titre, ex. « Ajouter un écran ». Restent visibles section repliée. */
  actions?: ReactNode;
  /** Première section du panneau : pas de filet au-dessus. */
  isFirst?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
};

// Prévient les sections de la page qu'un état a changé (l'événement « storage » ne part
// que vers les autres onglets). Sert aussi de repli quand localStorage est indisponible.
const PANEL_EVENT = "screendraft:panel";
const sessionState = new Map<string, "1" | "0">();

function subscribe(onChange: () => void) {
  window.addEventListener(PANEL_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PANEL_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readOpen(id: string): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + id) ?? sessionState.get(id) ?? null;
  } catch {
    return sessionState.get(id) ?? null;
  }
}

function writeOpen(id: string, open: boolean) {
  sessionState.set(id, open ? "1" : "0");
  try {
    localStorage.setItem(STORAGE_PREFIX + id, open ? "1" : "0");
  } catch {
    // Stockage indisponible (navigation privée) : l'état vaut pour la session.
  }
  window.dispatchEvent(new Event(PANEL_EVENT));
}

/**
 * Section repliable du panneau de gauche. Son état est mémorisé dans le navigateur :
 * c'est un confort d'affichage, jamais enregistré dans le projet.
 * Le contenu replié reste monté (masqué) pour garder une saisie en cours.
 */
export function ScreendraftPanelSection({
  id,
  headingId,
  title,
  count,
  actions,
  isFirst = false,
  defaultOpen = true,
  children,
}: ScreendraftPanelSectionProps) {
  // Rendue aussi côté serveur : là, pas de localStorage, la section est dans son état par défaut.
  // Le navigateur applique ensuite l'état mémorisé, sans écart à l'hydratation.
  const stored = useSyncExternalStore(
    subscribe,
    useCallback(() => readOpen(id), [id]),
    () => null,
  );
  const isOpen = stored === null ? defaultOpen : stored === "1";
  const contentId = useId();

  function toggle() {
    writeOpen(id, !isOpen);
  }

  return (
    <section aria-labelledby={headingId} className={isFirst ? undefined : "border-t border-(--line)"}>
      <div className="flex items-center gap-(--space-2) px-(--space-4) py-(--space-1)">
        <h2 id={headingId} className="min-w-0 flex-1">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={contentId}
            onClick={toggle}
            className="text-label flex min-h-10 w-full items-center gap-(--space-1) rounded-(--radius-sm) text-left text-(--ink-muted) hover:text-(--ink)"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className={`size-4 shrink-0 fill-none stroke-current transition-transform ${isOpen ? "rotate-90" : ""}`}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
            <span className="min-w-0 break-words">{title}</span>
            {count !== undefined && (
              <>
                <span aria-hidden className="text-code ml-auto pl-(--space-2) normal-case tracking-normal">
                  {count}
                </span>
                {/* Lu « Écrans, 2 » et non « Écrans2 ». */}
                <span className="sr-only">, {count}</span>
              </>
            )}
          </button>
        </h2>
        {actions}
      </div>
      <div id={contentId} hidden={!isOpen} className="px-(--space-4) pb-(--space-4)">
        {children}
      </div>
    </section>
  );
}
