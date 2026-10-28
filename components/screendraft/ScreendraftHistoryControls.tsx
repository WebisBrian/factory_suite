import type { ReactNode } from "react";

type ScreendraftHistoryControlsProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

/** Boutons Annuler / Rétablir, doublés par Ctrl/⌘ + Z et Ctrl/⌘ + Maj + Z. */
export function ScreendraftHistoryControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: ScreendraftHistoryControlsProps) {
  return (
    <div role="group" aria-label="Historique des modifications" className="flex items-center">
      <HistoryButton
        label="Annuler (Ctrl/⌘ + Z)"
        keyShortcuts="Control+Z Meta+Z"
        disabled={!canUndo}
        onClick={onUndo}
      >
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
      </HistoryButton>
      <HistoryButton
        label="Rétablir (Ctrl/⌘ + Maj + Z)"
        keyShortcuts="Control+Shift+Z Meta+Shift+Z Control+Y"
        disabled={!canRedo}
        onClick={onRedo}
      >
        <path d="m15 14 5-5-5-5" />
        <path d="M20 9H10a6 6 0 0 0 0 12h3" />
      </HistoryButton>
    </div>
  );
}

type HistoryButtonProps = {
  label: string;
  keyShortcuts: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
};

function HistoryButton({ label, keyShortcuts, disabled, onClick, children }: HistoryButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-keyshortcuts={keyShortcuts}
      disabled={disabled}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-(--radius-md) text-(--ink) hover:bg-(--canvas) disabled:text-(--line-strong) disabled:hover:bg-transparent"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-5 fill-none stroke-current"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  );
}
