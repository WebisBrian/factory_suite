/**
 * Vue du canvas : niveau de zoom et position du frame à l'écran.
 *
 * C'est un état de l'éditeur, jamais exporté dans le JSON. Un point de la
 * maquette (dx, dy) s'affiche à l'écran en (x + dx * zoom, y + dy * zoom),
 * en px relatifs au coin haut gauche du canvas.
 */
export type Viewport = {
  zoom: number;
  x: number;
  y: number;
};

export type Point = { x: number; y: number };
export type Size = { width: number; height: number };

export type ZoomCommand = "in" | "out" | "fit" | "reset";

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;

const ZOOM_STEPS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];
const FIT_PADDING = 48;
const STEP_EPSILON = 0.001;

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/** Zoome en gardant immobile le point de l'écran `anchor`. */
export function zoomAt(viewport: Viewport, zoom: number, anchor: Point): Viewport {
  const nextZoom = clampZoom(zoom);
  const scale = nextZoom / viewport.zoom;
  return {
    zoom: nextZoom,
    x: anchor.x - (anchor.x - viewport.x) * scale,
    y: anchor.y - (anchor.y - viewport.y) * scale,
  };
}

export function panBy(viewport: Viewport, dx: number, dy: number): Viewport {
  return { ...viewport, x: viewport.x + dx, y: viewport.y + dy };
}

/** Rectangle de la maquette (px à l'échelle 1) converti en px écran du canvas. */
export function rectToScreen(rect: Point & Size, viewport: Viewport): Point & Size {
  return {
    x: viewport.x + rect.x * viewport.zoom,
    y: viewport.y + rect.y * viewport.zoom,
    width: rect.width * viewport.zoom,
    height: rect.height * viewport.zoom,
  };
}

/** Centre le frame dans le canvas au plus grand zoom qui le montre en entier. */
export function fitToScreen(frame: Size, canvas: Size): Viewport {
  const zoom = clampZoom(
    Math.min(
      (canvas.width - FIT_PADDING * 2) / frame.width,
      (canvas.height - FIT_PADDING * 2) / frame.height,
    ),
  );
  return {
    zoom,
    x: (canvas.width - frame.width * zoom) / 2,
    y: (canvas.height - frame.height * zoom) / 2,
  };
}

/** Palier de zoom suivant (+1) ou précédent (-1), comme les boutons de Figma. */
export function stepZoom(zoom: number, direction: 1 | -1): number {
  if (direction === 1) {
    return ZOOM_STEPS.find((step) => step > zoom + STEP_EPSILON) ?? MAX_ZOOM;
  }
  return ZOOM_STEPS.findLast((step) => step < zoom - STEP_EPSILON) ?? MIN_ZOOM;
}

/** Applique une commande de zoom, centrée sur le milieu du canvas. */
export function applyZoomCommand(
  viewport: Viewport,
  command: ZoomCommand,
  frame: Size,
  canvas: Size,
): Viewport {
  const center = { x: canvas.width / 2, y: canvas.height / 2 };
  switch (command) {
    case "in":
      return zoomAt(viewport, stepZoom(viewport.zoom, 1), center);
    case "out":
      return zoomAt(viewport, stepZoom(viewport.zoom, -1), center);
    case "reset":
      return zoomAt(viewport, 1, center);
    case "fit":
      return fitToScreen(frame, canvas);
  }
}
