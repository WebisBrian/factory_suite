"use client";

import { Fragment, useRef, useState, type PointerEvent } from "react";
import { ScreendraftFrame } from "@/components/screendraft/ScreendraftFrame";
import { ScreendraftSelection } from "@/components/screendraft/ScreendraftSelection";
import { ScreendraftZoomControls } from "@/components/screendraft/ScreendraftZoomControls";
import type { Screen } from "@/components/screendraft/screendraft-schema";
import {
  findScreenNode,
  screenOrigins,
  screensSize,
  type ScreenNodeLocation,
} from "@/components/screendraft/screendraft-screens";
import { linkTarget } from "@/components/screendraft/screendraft-links";
import { findNode, frameRect } from "@/components/screendraft/screendraft-tree";
import { rectToScreen, type Point, type Size } from "@/components/screendraft/screendraft-viewport";
import { useScreendraftViewport } from "@/components/screendraft/use-screendraft-viewport";

type ScreendraftCanvasProps = {
  screens: Screen[];
  activeScreenId: string;
  selection: ScreenNodeLocation | null;
  /** Clic sur le canvas : l'écran sous le pointeur (null : hors écran) et l'élément cliqué (null : aucun). */
  onPick: (screenId: string | null, nodeId: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  /** Fin d'un déplacement dans le même écran, au-dessus d'une autre section (ou hors de toute section : `null`). */
  onDropInto: (id: string, parentId: string | null) => void;
  /** Fin d'un déplacement au-dessus d'un autre écran : x / y relatifs au nouveau parent. */
  onMoveToScreen: (id: string, screenId: string, parentId: string | null, x: number, y: number) => void;
};

/** Où lâcher l'élément déplacé : un écran, et une de ses sections (null : le premier niveau). */
type DropTarget = { screenId: string; parentId: string | null };

/** Écran de départ et écran survolé pendant un déplacement, pour l'affichage. */
type DragView = { sourceScreenId: string; targetScreenId: string | null };

/**
 * Élément en cours de déplacement : pointeur et position (relative au parent) au début
 * du geste, et si le pointeur a assez bougé pour que ce ne soit plus un simple clic.
 */
type Drag = { id: string; pointer: Point; start: Point; moved: boolean };

// En px écran : en dessous, le clic sélectionne sans déplacer.
const DRAG_THRESHOLD = 3;

export function ScreendraftCanvas({
  screens,
  activeScreenId,
  selection,
  onPick,
  onMove,
  onDropInto,
  onMoveToScreen,
}: ScreendraftCanvasProps) {
  // « Ajuster » montre tous les écrans à la fois.
  const { canvasRef, viewport, zoom, cursor, panHandlers } = useScreendraftViewport(screensSize(screens));
  const origins = screenOrigins(screens);
  const drag = useRef<Drag | null>(null);
  const [dragView, setDragView] = useState<DragView | null>(null);

  // Clic sur un élément : on sélectionne le plus profond sous le pointeur et on active son écran.
  // Clic sur le fond d'un écran : on l'active. Ailleurs : on désélectionne.
  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    panHandlers.onPointerDown(event);
    // Le hook a pris le geste pour déplacer la vue (espace ou clic molette).
    if (event.defaultPrevented || event.button !== 0) return;
    const target = event.target instanceof Element ? event.target : null;
    const id = target?.closest<HTMLElement>("[data-node-id]")?.dataset.nodeId ?? null;
    const screenId = target?.closest<HTMLElement>("[data-screen-id]")?.dataset.screenId ?? null;
    onPick(screenId, id);

    // Glisser l'élément cliqué le déplace.
    const location = id ? findScreenNode(screens, id)?.location : null;
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
    if (!current.moved) {
      const sourceScreenId = findScreenNode(screens, current.id)?.screen.id;
      if (sourceScreenId) setDragView({ sourceScreenId, targetScreenId: sourceScreenId });
    }
    current.moved = true;
    const targetScreenId = dropTargetAt(screens, event.clientX, event.clientY, current.id)?.screenId ?? null;
    if (dragView && dragView.targetScreenId !== targetScreenId) setDragView({ ...dragView, targetScreenId });
    // Le pointeur bouge en px écran, l'élément en px de la maquette. Pas de borne :
    // l'élément peut sortir de son parent, voire de son écran : il en changera au lâcher.
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
    setDragView(null);
    if (!current?.moved) return;
    const found = findScreenNode(screens, current.id);
    if (!found) return;
    // Lâché au-dessus d'une section : l'élément y entre. Au-dessus du fond d'un écran : il passe
    // au premier niveau de cet écran. Hors de tout écran : il reste dans le sien, au premier niveau.
    const target = dropTargetAt(screens, event.clientX, event.clientY, current.id) ?? {
      screenId: found.screen.id,
      parentId: null,
    };
    if (target.screenId === found.screen.id) {
      if (found.location.parentId !== target.parentId) onDropInto(current.id, target.parentId);
      return;
    }

    // Autre écran : l'élément garde sa place à l'écran, recalculée par rapport à son nouveau parent.
    const targetScreen = screens.find((screen) => screen.id === target.screenId);
    const targetOrigin = origins.get(target.screenId);
    if (!targetScreen || !targetOrigin) return;
    const position = offsetRect(frameRect(found.location), origins.get(found.screen.id));
    const parent = target.parentId ? findNode(targetScreen.nodes, target.parentId) : null;
    const parentOrigin = parent ? frameRect(parent) : { x: 0, y: 0 };
    onMoveToScreen(
      current.id,
      target.screenId,
      target.parentId,
      Math.round(position.x - targetOrigin.x - parentOrigin.x),
      Math.round(position.y - targetOrigin.y - parentOrigin.y),
    );
  }

  function handlePointerCancel() {
    panHandlers.onPointerCancel();
    drag.current = null;
    setDragView(null);
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
      {viewport &&
        screens.map((screen) => {
          const origin = origins.get(screen.id) ?? { x: 0, y: 0 };
          const left = viewport.x + origin.x * viewport.zoom;
          const top = viewport.y + origin.y * viewport.zoom;
          const isActive = screen.id === activeScreenId;
          const isDragSource = dragView?.sourceScreenId === screen.id;
          // Écran survolé par un élément venu d'un autre écran : il le recevra au lâcher.
          const isDropTarget = dragView !== null && !isDragSource && dragView.targetScreenId === screen.id;
          return (
            <Fragment key={screen.id}>
              {/* Nom de l'écran au-dessus du frame, comme dans Figma : un clic l'active. */}
              <button
                type="button"
                data-screen-id={screen.id}
                aria-current={isActive || undefined}
                onClick={() => onPick(screen.id, null)}
                className={`text-body-sm absolute max-w-full truncate rounded-(--radius-sm) px-(--space-1) whitespace-nowrap ${
                  isActive || isDropTarget
                    ? "bg-(--draft-soft) font-semibold text-(--draft)"
                    : "text-(--ink-muted) hover:text-(--ink)"
                }`}
                style={{ left, top: top - 24, maxWidth: Math.max(screen.frame.width * viewport.zoom, 80) }}
              >
                {screen.name}
              </button>
              <ScreendraftFrame
                screen={screen}
                style={{
                  top: 0,
                  left: 0,
                  transformOrigin: "0 0",
                  transform: `translate(${left}px, ${top}px) scale(${viewport.zoom})`,
                  boxShadow: "var(--shadow-frame)",
                  // Pendant un déplacement, l'élément reste visible hors de son écran, au-dessus des autres.
                  ...(isDragSource && { overflow: "visible", zIndex: 1 }),
                  ...(isDropTarget && { outline: "2px solid var(--selection)" }),
                }}
              />
            </Fragment>
          );
        })}
      {viewport && (
        <>
          {selection && (
            <ScreendraftSelection
              rect={rectToScreen(
                offsetRect(frameRect(selection.location), origins.get(selection.screen.id)),
                viewport,
              )}
            />
          )}
          {selection && <LinkArrow selection={selection} screens={screens} origins={origins} viewport={viewport} />}
          <ScreendraftZoomControls zoom={viewport.zoom} onCommand={zoom} />
        </>
      )}
    </div>
  );
}

type LinkArrowProps = {
  selection: ScreenNodeLocation;
  screens: Screen[];
  origins: Map<string, Point>;
  viewport: { zoom: number; x: number; y: number };
};

/**
 * Prototype : flèche du bouton sélectionné vers l'écran qu'il ouvre, comme dans Figma.
 * Elle part du côté du bouton tourné vers l'écran cible et arrive sur le bord de son frame.
 */
function LinkArrow({ selection, screens, origins, viewport }: LinkArrowProps) {
  const targetId = linkTarget(selection.location.node);
  const target = screens.find((screen) => screen.id === targetId);
  const targetOrigin = targetId ? origins.get(targetId) : undefined;
  if (!target || !targetOrigin) return null;

  const button = rectToScreen(
    offsetRect(frameRect(selection.location), origins.get(selection.screen.id)),
    viewport,
  );
  const frame: Point & Size = rectToScreen({ ...targetOrigin, ...target.frame }, viewport);
  const toRight = frame.x >= button.x + button.width;
  const start = { x: toRight ? button.x + button.width : button.x, y: button.y + button.height / 2 };
  const end = {
    x: toRight ? frame.x : frame.x + frame.width,
    y: Math.min(Math.max(start.y, frame.y + 12), frame.y + frame.height - 12),
  };
  const bend = Math.max(Math.abs(end.x - start.x) / 2, 24) * (toRight ? 1 : -1);

  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible text-(--draft)">
      <defs>
        <marker id="screendraft-link-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10Z" fill="currentColor" />
        </marker>
      </defs>
      <circle cx={start.x} cy={start.y} r={3.5} fill="currentColor" />
      <path
        d={`M${start.x} ${start.y} C${start.x + bend} ${start.y} ${end.x - bend} ${end.y} ${end.x} ${end.y}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        markerEnd="url(#screendraft-link-arrow)"
      />
    </svg>
  );
}

/** Rectangle d'un élément dans son écran, converti en position sur l'ensemble des écrans. */
function offsetRect<R extends Point>(rect: R, origin: Point | undefined): R {
  return origin ? { ...rect, x: rect.x + origin.x, y: rect.y + origin.y } : rect;
}

/**
 * Section la plus haute sous le pointeur, ou à défaut l'écran sous le pointeur,
 * en ignorant l'élément déplacé et ses enfants. null : hors de tout écran.
 */
function dropTargetAt(screens: Screen[], x: number, y: number, draggedId: string): DropTarget | null {
  for (const element of document.elementsFromPoint(x, y)) {
    if (!(element instanceof HTMLElement)) continue;
    if (element.closest(`[data-node-id="${CSS.escape(draggedId)}"]`)) continue;
    const nodeId = element.dataset.nodeId;
    if (nodeId) {
      const found = findScreenNode(screens, nodeId);
      if (found?.location.node.type === "section") return { screenId: found.screen.id, parentId: nodeId };
      continue;
    }
    const screenId = element.dataset.screenId;
    if (screenId) return { screenId, parentId: null };
  }
  return null;
}
