"use client";

import { useRef, type PointerEvent } from "react";
import { ScreendraftFrame } from "@/components/screendraft/ScreendraftFrame";
import { ScreendraftSelection } from "@/components/screendraft/ScreendraftSelection";
import { ScreendraftZoomControls } from "@/components/screendraft/ScreendraftZoomControls";
import type { Maquette } from "@/components/screendraft/screendraft-schema";
import { findNode, frameRect, type NodeLocation } from "@/components/screendraft/screendraft-tree";
import { rectToScreen, type Point } from "@/components/screendraft/screendraft-viewport";
import { useScreendraftViewport } from "@/components/screendraft/use-screendraft-viewport";

type ScreendraftCanvasProps = {
  draft: Maquette;
  selection: NodeLocation | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
};

/** Élément en cours de déplacement : pointeur et position (relative au parent) au début du geste. */
type Drag = { id: string; pointer: Point; start: Point };

export function ScreendraftCanvas({ draft, selection, onSelect, onMove }: ScreendraftCanvasProps) {
  const { canvasRef, viewport, zoom, cursor, panHandlers } = useScreendraftViewport(draft.frame);
  const drag = useRef<Drag | null>(null);

  // Clic sur un élément : on sélectionne le plus profond sous le pointeur. Clic ailleurs : on désélectionne.
  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    panHandlers.onPointerDown(event);
    // Le hook a pris le geste pour déplacer la vue (espace ou clic molette).
    if (event.defaultPrevented || event.button !== 0) return;
    const element = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-node-id]") : null;
    const id = element?.dataset.nodeId ?? null;
    onSelect(id);

    // Glisser l'élément cliqué le déplace.
    const location = id ? findNode(draft.nodes, id) : null;
    if (!location) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: location.node.id,
      pointer: { x: event.clientX, y: event.clientY },
      start: { x: location.node.x, y: location.node.y },
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    panHandlers.onPointerMove(event);
    const current = drag.current;
    if (!current || !viewport) return;
    // Le pointeur bouge en px écran, l'élément en px de la maquette.
    const dx = (event.clientX - current.pointer.x) / viewport.zoom;
    const dy = (event.clientY - current.pointer.y) / viewport.zoom;
    onMove(
      current.id,
      Math.max(0, Math.round(current.start.x + dx)),
      Math.max(0, Math.round(current.start.y + dy)),
    );
  }

  function handlePointerUp() {
    panHandlers.onPointerUp();
    drag.current = null;
  }

  return (
    <div
      ref={canvasRef}
      className="relative min-w-0 flex-1 touch-none overflow-hidden bg-(--canvas) select-none"
      style={{ cursor }}
      {...panHandlers}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
