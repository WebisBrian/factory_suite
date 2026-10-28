"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ScreendraftFrame } from "@/components/screendraft/ScreendraftFrame";
import { screenLinks } from "@/components/screendraft/screendraft-links";
import type { Screen } from "@/components/screendraft/screendraft-schema";
import { fitToScreen, type Size } from "@/components/screendraft/screendraft-viewport";

type ScreendraftPrototypeProps = {
  screens: Screen[];
  /** Écran affiché à l'ouverture : l'écran actif de l'éditeur. */
  startScreenId: string;
  onClose: () => void;
};

// Durée (ms) pendant laquelle les zones cliquables restent signalées après un clic à côté.
const HINT_DURATION = 800;

/**
 * Aperçu du prototype : un écran à la fois, comme dans le navigateur. Un clic sur un bouton
 * lié ouvre son écran cible ; « Retour » revient à l'écran précédent ; Échap ferme l'aperçu.
 * Les zones cliquables sont de vrais boutons posés sur la maquette : accessibles au clavier.
 */
export function ScreendraftPrototype({ screens, startScreenId, onClose }: ScreendraftPrototypeProps) {
  const [trail, setTrail] = useState([startScreenId]);
  const [areaSize, setAreaSize] = useState<Size | null>(null);
  const [showHints, setShowHints] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const hintTimer = useRef<number | undefined>(undefined);

  const screen = screens.find((candidate) => candidate.id === trail[trail.length - 1]) ?? screens[0];
  const links = screenLinks(screen, screens);
  const screenNames = new Map(screens.map((candidate) => [candidate.id, candidate.name]));

  useEffect(() => {
    dialogRef.current?.focus();
    const area = areaRef.current;
    if (!area) return;
    const observer = new ResizeObserver(() => {
      if (area.clientWidth > 0 && area.clientHeight > 0) {
        setAreaSize({ width: area.clientWidth, height: area.clientHeight });
      }
    });
    observer.observe(area);
    return () => {
      observer.disconnect();
      window.clearTimeout(hintTimer.current);
    };
  }, []);

  // L'écran tient dans la zone, sans être agrandi au-delà de sa taille réelle.
  const fit = areaSize ? fitToScreen(screen.frame, areaSize) : null;
  const zoom = fit ? Math.min(1, fit.zoom) : 1;
  const left = areaSize ? (areaSize.width - screen.frame.width * zoom) / 2 : 0;
  const top = areaSize ? Math.max((areaSize.height - screen.frame.height * zoom) / 2, 0) : 0;

  function open(screenId: string) {
    setTrail((current) => [...current, screenId]);
    setShowHints(false);
  }

  function back() {
    setTrail((current) => (current.length > 1 ? current.slice(0, -1) : current));
  }

  // Clic à côté d'une zone cliquable : on les signale brièvement, comme dans Figma.
  function hintLinks() {
    setShowHints(true);
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setShowHints(false), HINT_DURATION);
  }

  // Les raccourcis de l'éditeur (Suppr, Ctrl/⌘ + Z, espace…) ne s'appliquent pas à l'aperçu.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation();
    if (event.key === "Escape") onClose();
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Prototype — ${screen.name}`}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onKeyUp={(event) => event.stopPropagation()}
      className="absolute inset-0 z-20 flex flex-col bg-(--surface) text-(--ink) outline-none"
    >
      <header className="flex min-h-14 shrink-0 items-center gap-(--space-3) border-b border-(--line) bg-(--surface-raised) px-(--space-4) py-(--space-2)">
        <span className="text-label rounded-(--radius-sm) bg-(--fluo) px-(--space-2) py-(--space-1) text-(--on-fluo)">
          Prototype
        </span>
        <h2 className="text-body truncate font-semibold">{screen.name}</h2>
        <span className="text-code text-(--ink-muted)">{screen.path}</span>
        <p className="text-body-sm ml-auto hidden text-(--ink-muted) md:block">
          {links.length > 0
            ? "Cliquez sur les boutons liés pour changer d’écran."
            : "Aucun bouton de cet écran ne mène à un autre écran."}
        </p>
        <button
          type="button"
          onClick={back}
          disabled={trail.length === 1}
          className="text-body-sm min-h-10 rounded-(--radius-md) border border-(--line-strong) bg-(--surface-raised) px-(--space-4) py-(--space-2) text-(--ink) hover:bg-(--canvas) disabled:border-(--line) disabled:text-(--line-strong) disabled:hover:bg-(--surface-raised)"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-keyshortcuts="Escape"
          className="text-body-sm min-h-10 rounded-(--radius-md) border border-(--line-strong) bg-(--surface-raised) px-(--space-4) py-(--space-2) text-(--ink) hover:bg-(--canvas)"
        >
          Fermer
        </button>
      </header>

      <div
        ref={areaRef}
        onClick={(event) => {
          if (event.target === event.currentTarget || !(event.target instanceof HTMLButtonElement)) hintLinks();
        }}
        className="relative min-h-0 flex-1 overflow-auto bg-(--canvas)"
      >
        {areaSize && (
          <div
            className="absolute"
            style={{ left, top, width: screen.frame.width * zoom, height: screen.frame.height * zoom }}
          >
            <ScreendraftFrame
              screen={screen}
              style={{
                top: 0,
                left: 0,
                transformOrigin: "0 0",
                transform: `scale(${zoom})`,
                boxShadow: "var(--shadow-frame)",
              }}
            />
            {links.map(({ node, targetScreenId, rect }) => (
              <button
                key={node.id}
                type="button"
                onClick={() => open(targetScreenId)}
                aria-label={`${node.props.label} — ouvre l’écran ${screenNames.get(targetScreenId)}`}
                title={`Ouvre « ${screenNames.get(targetScreenId)} »`}
                className={`absolute cursor-pointer rounded-(--radius-sm) hover:outline-2 hover:outline-(--draft) hover:outline-solid ${
                  showHints ? "bg-(--draft)/20 outline-2 outline-(--draft) outline-solid" : ""
                }`}
                style={{
                  left: rect.x * zoom,
                  top: rect.y * zoom,
                  width: rect.width * zoom,
                  height: rect.height * zoom,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
