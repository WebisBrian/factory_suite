"use client";

import type { PointerEvent } from "react";
import { ScreendraftFrame } from "@/components/screendraft/ScreendraftFrame";
import { ScreendraftSelection } from "@/components/screendraft/ScreendraftSelection";
import { ScreendraftZoomControls } from "@/components/screendraft/ScreendraftZoomControls";
import type { Maquette } from "@/components/screendraft/screendraft-schema";
import { frameRect, type NodeLocation } from "@/components/screendraft/screendraft-tree";
import { rectToScreen } from "@/components/screendraft/screendraft-viewport";
import { useScreendraftViewport } from "@/components/screendraft/use-screendraft-viewport";

type ScreendraftCanvasProps = {
  draft: Maquette;
  selection: NodeLocation | null;
  onSelect: (id: string | null) => void;
};

export function ScreendraftCanvas({ draft, selection, onSelect }: ScreendraftCanvasProps) {
  const { canvasRef, viewport, zoom, cursor, panHandlers } = useScreendraftViewport(draft.frame);

  // Clic sur un élément : on sélectionne le plus profond sous le pointeur. Clic ailleurs : on désélectionne.
  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    panHandlers.onPointerDown(event);
    // Le hook a pris le geste pour déplacer la vue (espace ou clic molette).
    if (event.defaultPrevented || event.button !== 0) return;
    const element = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-node-id]") : null;
    onSelect(element?.dataset.nodeId ?? null);
  }

  return (
    <div
      ref={canvasRef}
      className="relative min-w-0 flex-1 touch-none overflow-hidden bg-(--canvas) select-none"
      style={{ cursor }}
      {...panHandlers}
      onPointerDown={handlePointerDown}
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
          {selection && <ScreendraftSelection rect={rectToScreen(frameRect(selection), viewport)} />}
          <ScreendraftZoomControls zoom={viewport.zoom} onCommand={zoom} />
        </>
      )}
    </div>
  );
}
