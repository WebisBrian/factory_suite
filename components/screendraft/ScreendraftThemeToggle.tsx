"use client";

import { useEffect, useRef } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "screendraft:theme";

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

/**
 * Bascule clair / sombre. Le thème est posé en data-theme sur le conteneur
 * .screendraft (pas sur <html>, qui appartient au Hub). Sans choix mémorisé,
 * screendraft-theme.css suit prefers-color-scheme.
 */
export function ScreendraftThemeToggle() {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = buttonRef.current?.closest<HTMLElement>(".screendraft");
    const stored = readStoredTheme();
    if (root && stored) root.dataset.theme = stored;
  }, []);

  function toggle() {
    const root = buttonRef.current?.closest<HTMLElement>(".screendraft");
    if (!root) return;
    const current: Theme =
      (root.dataset.theme as Theme | undefined) ??
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next: Theme = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Stockage indisponible (navigation privée) : le choix vaut pour la session.
    }
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      title="Changer de thème"
      aria-label="Changer de thème"
      onClick={toggle}
      className="grid size-8 place-items-center rounded-(--radius-md) border border-(--line-strong) bg-(--surface-raised) text-(--ink) hover:bg-(--canvas)"
    >
      {/* Lune en thème clair, soleil en thème sombre (affichage géré par screendraft-theme.css). */}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="sd-only-light size-4 fill-none stroke-current"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="sd-only-dark size-4 fill-none stroke-current"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
