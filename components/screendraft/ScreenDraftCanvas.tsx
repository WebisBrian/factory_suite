import type { PointerEvent, ReactNode } from "react";

export function ScreenDraftCanvas({
  width = 900,
  height = 600,
  zoom = 1,
  children,
  onPointerDown,
}: {
  width?: number;
  height?: number;
  zoom?: number;
  children?: ReactNode;
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className="overflow-auto rounded-2xl border border-white/10 bg-white/3 p-6">
      <div
        role="application"
        aria-label="Canvas de maquette"
        onPointerDown={onPointerDown}
        style={{ width, height, transform: `scale(${zoom})`, transformOrigin: "top left" }}
        className="relative mx-auto overflow-hidden rounded-lg bg-white shadow-2xl"
      >
        {children}
      </div>
    </div>
  );
}
