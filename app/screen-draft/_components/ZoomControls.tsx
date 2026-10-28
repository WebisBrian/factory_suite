import type { ReactNode } from "react";
import type { ZoomCommand } from "../_lib/viewport";

type ZoomControlsProps = {
  zoom: number;
  onCommand: (command: ZoomCommand) => void;
};

export default function ZoomControls({ zoom, onCommand }: ZoomControlsProps) {
  return (
    <div className="absolute right-4 bottom-4 flex items-center rounded-lg border border-neutral-200 bg-white p-1 text-sm shadow-sm">
      <ControlButton title="Zoom arrière (Ctrl/⌘ −)" onClick={() => onCommand("out")}>
        −
      </ControlButton>
      <ControlButton title="Zoom à 100 % (Maj + 0)" onClick={() => onCommand("reset")}>
        <span className="inline-block w-12 tabular-nums">{Math.round(zoom * 100)} %</span>
      </ControlButton>
      <ControlButton title="Zoom avant (Ctrl/⌘ +)" onClick={() => onCommand("in")}>
        +
      </ControlButton>
      <span className="mx-1 h-5 w-px bg-neutral-200" />
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
      className="h-7 min-w-7 rounded-md px-2 text-neutral-700 hover:bg-neutral-100"
    >
      {children}
    </button>
  );
}
