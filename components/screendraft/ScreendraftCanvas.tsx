"use client";

import { ScreendraftFrame } from "@/components/screendraft/ScreendraftFrame";
import { ScreendraftZoomControls } from "@/components/screendraft/ScreendraftZoomControls";
import type { Maquette } from "@/components/screendraft/screendraft-schema";
import { useScreendraftViewport } from "@/components/screendraft/use-screendraft-viewport";

export function ScreendraftCanvas({ draft }: { draft: Maquette }) {
  const { canvasRef, viewport, zoom, cursor, panHandlers } = useScreendraftViewport(draft.frame);

  return (
    <div
      ref={canvasRef}
      className="relative min-w-0 flex-1 touch-none overflow-hidden bg-zinc-900/60 select-none"
      style={{ cursor }}
      {...panHandlers}
    >
      {viewport && (
        <>
          <p
            className="pointer-events-none absolute text-xs whitespace-nowrap text-zinc-400"
            style={{ left: viewport.x, top: viewport.y - 20 }}
          >
            {draft.name}
          </p>
          <ScreendraftFrame
            draft={draft}
            style={{
              top: 0,
              left: 0,
              transformOrigin: "0 0",
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
              boxShadow: "0 12px 32px rgb(0 0 0 / 0.45)",
            }}
          />
          <ScreendraftZoomControls zoom={viewport.zoom} onCommand={zoom} />
        </>
      )}
    </div>
  );
}
