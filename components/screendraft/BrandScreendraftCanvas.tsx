"use client";

import { ScreendraftFrame } from "@/components/screendraft/ScreendraftFrame";
import { ScreendraftZoomControls } from "@/components/screendraft/BrandScreendraftZoomControls";
import type { Maquette } from "@/components/screendraft/screendraft-schema";
import { useScreendraftViewport } from "@/components/screendraft/use-screendraft-viewport";

export function ScreendraftCanvas({ draft }: { draft: Maquette }) {
  const { canvasRef, viewport, zoom, cursor, panHandlers } = useScreendraftViewport(draft.frame);

  return (
    <div
      ref={canvasRef}
      className="relative min-w-0 flex-1 touch-none overflow-hidden bg-(--canvas) select-none"
      style={{ cursor }}
      {...panHandlers}
    >
      {viewport && (
        <>
          <p
            className="text-body-sm pointer-events-none absolute whitespace-nowrap text-(--ink-muted)"
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
              boxShadow: "var(--shadow-frame)",
            }}
          />
          <ScreendraftZoomControls zoom={viewport.zoom} onCommand={zoom} />
        </>
      )}
    </div>
  );
}
