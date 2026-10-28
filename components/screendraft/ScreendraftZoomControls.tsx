import type { ReactNode } from "react";
import type { ZoomCommand } from "@/components/screendraft/screendraft-viewport";

type ScreendraftZoomControlsProps = {
  zoom: number;
  onCommand: (command: ZoomCommand) => void;
};

export function ScreendraftZoomControls({ zoom, onCommand }: ScreendraftZoomControlsProps) {
  return (
    <div className="absolute right-4 bottom-4 flex items-center rounded-full border border-white/15 bg-[#121218]/90 p-1 text-sm shadow-lg backdrop-blur">
      <ControlButton title="Zoom arrière (Ctrl/⌘ −)" onClick={() => onCommand("out")}>
        −
      </ControlButton>
      <ControlButton title="Zoom à 100 % (Maj + 0)" onClick={() => onCommand("reset")}>
        <span className="inline-block w-12 tabular-nums">{Math.round(zoom * 100)} %</span>
      </ControlButton>
      <ControlButton title="Zoom avant (Ctrl/⌘ +)" onClick={() => onCommand("in")}>
        +
      </ControlButton>
      <span className="mx-1 h-5 w-px bg-white/15" />
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
      className="h-7 min-w-7 rounded-full px-2.5 text-zinc-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-sky-400"
    >
      {children}
    </button>
  );
}
