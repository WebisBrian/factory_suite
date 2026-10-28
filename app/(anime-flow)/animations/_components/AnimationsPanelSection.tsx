"use client";

import { useCallback, useId, useSyncExternalStore, type ReactNode } from "react";

const STORAGE_PREFIX = "anime-flow:panel:";
// Prévient les sections de la page qu'un état a changé (« storage » ne part que vers les autres
// onglets). Sert aussi de repli quand localStorage est indisponible (navigation privée).
const PANEL_EVENT = "anime-flow:panel";
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
    // Stockage indisponible : l'état vaut pour la session.
  }
  window.dispatchEvent(new Event(PANEL_EVENT));
}

type Props = {
  /** Clé de mémorisation de l'état ouvert / replié. */
  id: string;
  /** id du titre, pour que le contenu s'y réfère (aria-labelledby). */
  headingId: string;
  title: string;
  /** Nombre d'éléments, affiché à côté du titre : utile section repliée. */
  count?: number;
  /** Première section du panneau : pas de filet au-dessus. */
  isFirst?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
};

/**
 * Section repliable d'un panneau latéral (même motif que Screendraft). L'état est
 * mémorisé dans le navigateur : confort d'affichage, jamais enregistré dans le projet.
 */
export function AnimationsPanelSection({
  id,
  headingId,
  title,
  count,
  isFirst = false,
  defaultOpen = true,
  children,
}: Props) {
  // Rendue aussi côté serveur, sans localStorage : état par défaut, puis état mémorisé.
  const stored = useSyncExternalStore(
    subscribe,
    useCallback(() => readOpen(id), [id]),
    () => null,
  );
  const isOpen = stored === null ? defaultOpen : stored === "1";
  const contentId = useId();

  return (
    <section aria-labelledby={headingId} className={isFirst ? undefined : "border-t border-(--line)"}>
      <h2 id={headingId} className="px-2 py-1">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => writeOpen(id, !isOpen)}
          className="flex min-h-12 w-full items-center gap-2 rounded-lg px-2 text-left text-lg font-semibold hover:bg-(--motion-soft)"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className={`size-5 shrink-0 fill-none stroke-current motion-safe:transition-transform ${isOpen ? "rotate-90" : ""}`}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
          <span className="min-w-0 flex-1 break-words">{title}</span>
          {count !== undefined && (
            <>
              <span
                aria-hidden
                className="rounded-full border border-(--motion) bg-(--motion-soft) px-2 text-lg font-normal"
              >
                {count}
              </span>
              {/* Lu « Éléments de la page, 12 » et non « Éléments de la page12 ». */}
              <span className="sr-only">, {count}</span>
            </>
          )}
        </button>
      </h2>
      <div id={contentId} hidden={!isOpen} className="px-4 pb-4">
        {children}
      </div>
    </section>
  );
}
