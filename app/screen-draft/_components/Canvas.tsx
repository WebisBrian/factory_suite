"use client";

import { useCanvasViewport } from "../_hooks/useCanvasViewport";
import type { ScreenDraftDocument } from "../_lib/schema";
import FrameView from "./FrameView";
import ZoomControls from "./ZoomControls";

export default function Canvas({ draft }: { draft: ScreenDraftDocument }) {
  const { canvasRef, viewport, zoom, cursor, panHandlers } = useCanvasViewport(draft.frame);

  return (
    <div
      ref={canvasRef}
      className="relative min-w-0 flex-1 touch-none overflow-hidden bg-neutral-100 select-none"
      style={{ cursor }}
      {...panHandlers}
    >
      {viewport && (
        <>
          <p
            className="pointer-events-none absolute text-xs whitespace-nowrap text-neutral-500"
            style={{ left: viewport.x, top: viewport.y - 20 }}
          >
            {draft.name}
          </p>
          <FrameView
            draft={draft}
            style={{
              top: 0,
              left: 0,
              transformOrigin: "0 0",
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
              boxShadow: "0 1px 3px rgb(0 0 0 / 0.12)",
            }}
          />
          <ZoomControls zoom={viewport.zoom} onCommand={zoom} />
        </>
      )}
    </div>
  );
}
