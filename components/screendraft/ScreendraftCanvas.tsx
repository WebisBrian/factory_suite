"use client";

import { useRef, type PointerEvent } from "react";
import { ScreendraftFrame } from "@/components/screendraft/ScreendraftFrame";
import { ScreendraftSelection } from "@/components/screendraft/ScreendraftSelection";
import { ScreendraftZoomControls } from "@/components/screendraft/ScreendraftZoomControls";
import type { DraftNode, Maquette } from "@/components/screendraft/screendraft-schema";
import {
  findNode,
  frameRect,
  isSameOrInside,
  type NodeLocation,
} from "@/components/screendraft/screendraft-tree";
import { rectToScreen, type Point } from "@/components/screendraft/screendraft-viewport";
import { useScreendraftViewport } from "@/components/screendraft/use-screendraft-viewport";

type ScreendraftCanvasProps = {
  draft: Maquette;
  selection: NodeLocation | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  /** Fin d'un déplacement au-dessus d'une autre section (ou hors de toute section : `null`). */
  onDropInto: (id: string, parentId: string | null) => void;
};

/**
 * Élément en cours de déplacement : pointeur et position (relative au parent) au début
 * du geste, et si le pointeur a assez bougé pour que ce ne soit plus un simple clic.
 */
type Drag = { id: string; pointer: Point; start: Point; moved: boolean };

// En px écran : en dessous, le clic sélectionne sans déplacer.
const DRAG_THRESHOLD = 3;

export function ScreendraftCanvas({
  draft,
  selection,
  onSelect,
  onMove,
  onDropInto,
}: ScreendraftCanvasProps) {
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
      moved: false,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    panHandlers.onPointerMove(event);
    const current = drag.current;
    if (!current || !viewport) return;
    const screenDx = event.clientX - current.pointer.x;
    const screenDy = event.clientY - current.pointer.y;
    if (!current.moved && Math.hypot(screenDx, screenDy) < DRAG_THRESHOLD) return;
    current.moved = true;
    // Le pointeur bouge en px écran, l'élément en px de la maquette. Pas de borne :
    // l'élément peut sortir de son parent, il en changera au lâcher.
    onMove(
      current.id,
      Math.round(current.start.x + screenDx / viewport.zoom),
      Math.round(current.start.y + screenDy / viewport.zoom),
    );
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    panHandlers.onPointerUp();
    const current = drag.current;
    drag.current = null;
    if (!current?.moved) return;
    // Lâché au-dessus d'une section : l'élément y entre. Ailleurs : il revient au premier niveau.
    const parentId = sectionAt(draft.nodes, event.clientX, event.clientY, current.id);
    if (findNode(draft.nodes, current.id)?.parentId !== parentId) onDropInto(current.id, parentId);
  }

  function handlePointerCancel() {
    panHandlers.onPointerCancel();
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
      onPointerCancel={handlePointerCancel}
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

/** Section la plus haute sous le pointeur, en ignorant l'élément déplacé et ses enfants. */
function sectionAt(nodes: DraftNode[], x: number, y: number, draggedId: string): string | null {
  for (const element of document.elementsFromPoint(x, y)) {
    const id = element instanceof HTMLElement ? element.dataset.nodeId : undefined;
    if (!id || isSameOrInside(nodes, draggedId, id)) continue;
    if (findNode(nodes, id)?.node.type === "section") return id;
  }
  return null;
}
