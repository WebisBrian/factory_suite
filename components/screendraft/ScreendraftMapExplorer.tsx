"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import {
  coordinatesAt,
  panView,
  pointInMap,
  zoomView,
  type Coordinates,
  type MapView,
} from "@/components/screendraft/screendraft-map";
import type { MapNode } from "@/components/screendraft/screendraft-schema";
import type { Point, Size } from "@/components/screendraft/screendraft-viewport";

type ScreendraftMapExplorerProps = {
  node: MapNode;
  view: MapView;
  /** Place de la carte à l'écran, en px. */
  rect: Point & Size;
  onView: (view: MapView) => void;
  /** Poser et déplacer des points ; absent : on ne fait que regarder (prototype). */
  markers?: {
    onAdd: (coordinates: Coordinates) => void;
    onMove: (markerId: string, coordinates: Coordinates) => void;
  };
  /** Sortie de l'exploration (éditeur) ; absent : la carte reste explorable (prototype). */
  onExit?: () => void;
};

// Déplacement par appui sur une flèche, en px de la carte.
const PAN_STEP = 80;
// Cumul de molette pour un cran de zoom : un cran de souris, ou un geste de trackpad.
const WHEEL_STEP = 60;
// En px écran : en dessous, c'est un clic (poser un point), pas un glisser.
const DRAG_THRESHOLD = 3;

/** Geste en cours : point de départ (px de la carte et px écran), vue de départ, point d'intérêt saisi. */
type Gesture = { start: Point; client: Point; startView: MapView; markerId: string | null; moved: boolean };

/**
 * Carte manipulable comme avec Leaflet, posée par-dessus son rendu : glisser déplace la carte,
 * la molette zoome sous le curseur, un clic pose un point, un point se glisse.
 * Au clavier : flèches, + et −, Entrée (point au centre), Échap (terminer).
 */
export function ScreendraftMapExplorer({ node, view, rect, onView, markers, onExit }: ScreendraftMapExplorerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const wheel = useRef(0);
  const latest = useRef({ view, onView });
  const size: Size = { width: node.width, height: node.height };
  const center: Point = { x: node.width / 2, y: node.height / 2 };

  // L'écouteur natif de la molette lit toujours la vue à jour.
  useEffect(() => {
    latest.current = { view, onView };
  });

  // En entrant dans l'exploration, le clavier va à la carte.
  useEffect(() => {
    if (onExit) ref.current?.focus();
  }, [onExit]);

  // Écouteur natif : React enregistre `onWheel` en passif, et la molette ne doit pas zoomer le canvas.
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      wheel.current += event.deltaY;
      if (Math.abs(wheel.current) < WHEEL_STEP) return;
      const direction = wheel.current < 0 ? 1 : -1;
      wheel.current = 0;
      const box = element.getBoundingClientRect();
      const anchor = {
        x: ((event.clientX - box.left) * node.width) / box.width,
        y: ((event.clientY - box.top) * node.height) / box.height,
      };
      const { view: current, onView: change } = latest.current;
      change(zoomView(current, current.zoom + direction, anchor, { width: node.width, height: node.height }));
    };
    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [node.width, node.height]);

  // Position du pointeur dans la carte, en px de la maquette (le canvas peut être zoomé).
  function mapPoint(event: PointerEvent<HTMLDivElement>): Point {
    const box = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) * node.width) / box.width,
      y: ((event.clientY - box.top) * node.height) / box.height,
    };
  }

  // L'épingle et son nom, au-dessus du point (voir ScreendraftNode).
  function markerAt(point: Point): string | null {
    for (const marker of [...node.props.markers].reverse()) {
      const pin = pointInMap(marker, view, view.zoom, size);
      if (Math.abs(point.x - pin.x) <= 14 && point.y >= pin.y - 58 && point.y <= pin.y + 2) return marker.id;
    }
    return null;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    // Le canvas ne doit ni sélectionner, ni déplacer l'élément, ni déplacer la vue.
    event.stopPropagation();
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = mapPoint(event);
    gesture.current = {
      start,
      client: { x: event.clientX, y: event.clientY },
      startView: view,
      markerId: markers ? markerAt(start) : null,
      moved: false,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current) return;
    const distance = Math.hypot(event.clientX - current.client.x, event.clientY - current.client.y);
    if (!current.moved && distance < DRAG_THRESHOLD) return;
    current.moved = true;
    const point = mapPoint(event);
    if (current.markerId && markers) {
      markers.onMove(current.markerId, coordinatesAt(point, view, size));
    } else {
      onView(panView(current.startView, point.x - current.start.x, point.y - current.start.y));
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    gesture.current = null;
    if (!current || current.moved || current.markerId || !markers) return;
    markers.onAdd(coordinatesAt(mapPoint(event), view, size));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Ctrl/⌘ + Z et les autres raccourcis de l'éditeur restent disponibles.
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const pans: Record<string, [number, number]> = {
      ArrowLeft: [PAN_STEP, 0],
      ArrowRight: [-PAN_STEP, 0],
      ArrowUp: [0, PAN_STEP],
      ArrowDown: [0, -PAN_STEP],
    };
    if (event.key in pans) onView(panView(view, ...pans[event.key]));
    else if (event.key === "+" || event.key === "=") onView(zoomView(view, view.zoom + 1, center, size));
    else if (event.key === "-") onView(zoomView(view, view.zoom - 1, center, size));
    else if (event.key === "Enter" && markers) markers.onAdd(coordinatesAt(center, view, size));
    else if (event.key === "Escape" && onExit) onExit();
    // Suppr ne supprime pas la carte et espace ne déplace pas le canvas pendant l'exploration.
    else if (!["Delete", "Backspace", " "].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
  }

  const instructions = markers
    ? "Glissez pour vous déplacer, molette ou + et − pour zoomer, cliquez pour poser un point. Au clavier : flèches, + et −, Entrée pour un point au centre, Échap pour terminer."
    : "Glissez pour vous déplacer, molette ou + et − pour zoomer. Au clavier : flèches, + et −.";

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="application"
      aria-roledescription="carte"
      aria-label={`${node.props.title || "Carte"}. ${instructions}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        gesture.current = null;
      }}
      onKeyDown={handleKeyDown}
      // Un clic sur la carte n'est pas un clic à côté (le prototype signale alors les liens).
      onClick={(event) => event.stopPropagation()}
      className={`sd-free-size absolute cursor-grab touch-none active:cursor-grabbing ${
        onExit ? "outline-2 outline-offset-0 outline-(--draft) outline-solid" : ""
      }`}
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
    >
      <div
        onPointerDown={(event) => event.stopPropagation()}
        className="absolute top-(--space-2) right-(--space-2) flex gap-(--space-1)"
      >
        <MapButton label="Zoom avant" onClick={() => onView(zoomView(view, view.zoom + 1, center, size))}>
          +
        </MapButton>
        <MapButton label="Zoom arrière" onClick={() => onView(zoomView(view, view.zoom - 1, center, size))}>
          −
        </MapButton>
        {onExit && (
          <MapButton label="Terminer l’exploration de la carte" onClick={onExit}>
            Terminé
          </MapButton>
        )}
      </div>
      {markers && (
        <p
          aria-hidden
          className="text-body-sm pointer-events-none absolute bottom-(--space-2) left-(--space-2) max-w-[calc(100%-1rem)] rounded-(--radius-sm) bg-(--surface-raised) px-(--space-2) py-(--space-1) text-(--ink) shadow-(--shadow-panel)"
        >
          Glisser : se déplacer · Molette : zoomer · Clic : poser un point
        </p>
      )}
    </div>
  );
}

function MapButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid min-h-10 min-w-10 cursor-pointer place-items-center rounded-(--radius-md) border border-(--line-strong) bg-(--surface-raised) px-(--space-2) text-base font-semibold text-(--ink) shadow-(--shadow-panel) hover:bg-(--canvas)"
    >
      {children}
    </button>
  );
}
