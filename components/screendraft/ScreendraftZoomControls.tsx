import type { ReactNode } from "react";
import type { ZoomCommand } from "@/components/screendraft/screendraft-viewport";

type ScreendraftZoomControlsProps = {
  zoom: number;
  onCommand: (command: ZoomCommand) => void;
};

export function ScreendraftZoomControls({ zoom, onCommand }: ScreendraftZoomControlsProps) {
  const percent = Math.round(zoom * 100);
  return (
    // Un clic sur les contrôles ne doit ni sélectionner, ni désélectionner, ni déplacer la vue.
    <div
      role="group"
      aria-label="Zoom de l’aperçu"
      onPointerDown={(event) => event.stopPropagation()}
      className="text-body-sm absolute right-(--space-4) bottom-(--space-4) flex max-w-[calc(100%-2rem)] flex-wrap items-center rounded-(--radius-lg) border border-(--line) bg-(--surface-raised) p-(--space-1) text-(--ink) shadow-(--shadow-panel)"
    >
      <ControlButton title="Zoom arrière (Ctrl/⌘ −)" onClick={() => onCommand("out")}>
        −
      </ControlButton>
      {/* Le nom accessible commence par le texte visible (RGAA 6.1, WCAG 2.5.3). */}
      <ControlButton title={`${percent} %, revenir à 100 % (Maj + 0)`} onClick={() => onCommand("reset")}>
        <span className="text-code inline-block min-w-12 tabular-nums">{percent} %</span>
      </ControlButton>
      <ControlButton title="Zoom avant (Ctrl/⌘ +)" onClick={() => onCommand("in")}>
        +
      </ControlButton>
      <span aria-hidden className="mx-(--space-1) h-5 w-px bg-(--line)" />
      <ControlButton title="Ajuster à l'écran (Maj + 1)" onClick={() => onCommand("fit")}>
        Ajuster
      </ControlButton>
    </div>
  );
}

type ControlButtonProps = {
  title: string;
  onClick: () => void;
  children: ReactNode;
};

function ControlButton({ title, onClick, children }: ControlButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="h-7 min-w-7 rounded-(--radius-md) px-(--space-2) text-(--ink) hover:bg-(--draft-soft) hover:text-(--draft)"
    >
      {children}
    </button>
  );
}
