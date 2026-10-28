import type { MapMarker } from "@/components/screendraft/screendraft-schema";
import type { Point, Size } from "@/components/screendraft/screendraft-viewport";

/**
 * Carte (SCRUM-32) : calcul des tuiles OpenStreetMap, de la position des points d'intérêt et
 * des gestes d'exploration (glisser, zoomer), en projection Web Mercator, sans bibliothèque
 * ni appel à une API.
 */

export const TILE_SIZE = 256;
export const MIN_MAP_ZOOM = 1;
export const MAX_MAP_ZOOM = 19;

// Au-delà, la projection Web Mercator part à l'infini.
const MAX_LATITUDE = 85.05112878;

export type Coordinates = { latitude: number; longitude: number };

export type MapTile = { key: string; src: string; left: number; top: number };

/** Ce que montre une carte : son centre et son niveau de zoom (entier). */
export type MapView = Coordinates & { zoom: number };

/** Position d'un point sur la carte du monde entière au niveau `zoom`, en px. */
export function project({ latitude, longitude }: Coordinates, zoom: number): Point {
  const scale = TILE_SIZE * 2 ** zoom;
  const lat = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude));
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

/** Inverse de `project` : coordonnées d'un point de la carte du monde au niveau `zoom`. */
export function unproject({ x, y }: Point, zoom: number): Coordinates {
  const scale = TILE_SIZE * 2 ** zoom;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  return { latitude: (180 / Math.PI) * Math.atan(Math.sinh(n)), longitude: (x / scale) * 360 - 180 };
}

// Marge autour des points, en px : de quoi laisser voir l'épingle et son nom au-dessus.
const FIT_PADDING = 64;
// Un point seul n'est pas montré plus près que l'échelle d'un quartier.
const SINGLE_POINT_ZOOM = 15;

/** Centre et zoom (le plus grand possible) qui montrent tous les points dans une carte de taille `size`. */
export function fitMarkers(points: Coordinates[], size: Size): (Coordinates & { zoom: number }) | null {
  if (points.length === 0) return null;
  for (let zoom = MAX_MAP_ZOOM; zoom >= MIN_MAP_ZOOM; zoom--) {
    const projected = points.map((point) => project(point, zoom));
    const xs = projected.map((point) => point.x);
    const ys = projected.map((point) => point.y);
    const fits =
      Math.max(...xs) - Math.min(...xs) <= size.width - FIT_PADDING * 2 &&
      Math.max(...ys) - Math.min(...ys) <= size.height - FIT_PADDING * 2;
    if (fits || zoom === MIN_MAP_ZOOM) {
      const center = unproject(
        { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 },
        zoom,
      );
      return { ...center, zoom: points.length === 1 ? Math.min(zoom, SINGLE_POINT_ZOOM) : zoom };
    }
  }
  return null;
}

/** Position d'un point dans une carte de taille `size` centrée sur `center`, en px. */
export function pointInMap(point: Coordinates, center: Coordinates, zoom: number, size: Size): Point {
  const target = project(point, zoom);
  const origin = project(center, zoom);
  return { x: size.width / 2 + target.x - origin.x, y: size.height / 2 + target.y - origin.y };
}

/** Tuiles qui couvrent une carte de taille `size` centrée sur `center`, avec leur place en px. */
export function visibleTiles(center: Coordinates, zoom: number, size: Size): MapTile[] {
  const origin = project(center, zoom);
  const left = origin.x - size.width / 2;
  const top = origin.y - size.height / 2;
  const count = 2 ** zoom;
  const tiles: MapTile[] = [];
  for (let ty = Math.floor(top / TILE_SIZE); ty <= Math.floor((top + size.height) / TILE_SIZE); ty++) {
    if (ty < 0 || ty >= count) continue;
    for (let tx = Math.floor(left / TILE_SIZE); tx <= Math.floor((left + size.width) / TILE_SIZE); tx++) {
      // La carte boucle d'est en ouest.
      const wrappedX = ((tx % count) + count) % count;
      tiles.push({
        key: `${tx}:${ty}`,
        src: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`,
        left: tx * TILE_SIZE - left,
        top: ty * TILE_SIZE - top,
      });
    }
  }
  return tiles;
}

export function clampZoom(zoom: number): number {
  return Math.max(MIN_MAP_ZOOM, Math.min(MAX_MAP_ZOOM, zoom));
}

let markerCount = 0;

export function createMarker(position: number, { latitude, longitude }: Coordinates): MapMarker {
  return { id: `marker_${Date.now()}_${++markerCount}`, label: `Point ${position}`, latitude, longitude };
}

/** Coordonnées arrondies au millionième de degré (~10 cm), longitude ramenée dans [-180, 180]. */
function normalize({ latitude, longitude }: Coordinates): Coordinates {
  const wrapped = ((((longitude + 180) % 360) + 360) % 360) - 180;
  const round = (value: number) => Math.round(value * 1e6) / 1e6;
  return { latitude: round(Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude))), longitude: round(wrapped) };
}

/** Coordonnées du point `point` (px depuis le coin haut gauche) d'une carte de taille `size`. */
export function coordinatesAt(point: Point, view: MapView, size: Size): Coordinates {
  const origin = project(view, view.zoom);
  return normalize(
    unproject({ x: origin.x + point.x - size.width / 2, y: origin.y + point.y - size.height / 2 }, view.zoom),
  );
}

/** Glisser la carte de (dx, dy) px : le centre part dans l'autre sens. */
export function panView(view: MapView, dx: number, dy: number): MapView {
  const origin = project(view, view.zoom);
  return { ...normalize(unproject({ x: origin.x - dx, y: origin.y - dy }, view.zoom)), zoom: view.zoom };
}

/** Change de zoom en gardant immobile le point `anchor` (px depuis le coin haut gauche), comme Leaflet. */
export function zoomView(view: MapView, zoom: number, anchor: Point, size: Size): MapView {
  const nextZoom = clampZoom(zoom);
  if (nextZoom === view.zoom) return view;
  const target = project(coordinatesAt(anchor, view, size), nextZoom);
  const center = unproject(
    { x: target.x - (anchor.x - size.width / 2), y: target.y - (anchor.y - size.height / 2) },
    nextZoom,
  );
  return { ...normalize(center), zoom: nextZoom };
}
