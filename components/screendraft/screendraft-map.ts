import type { MapMarker } from "@/components/screendraft/screendraft-schema";
import type { Point, Size } from "@/components/screendraft/screendraft-viewport";

/**
 * Carte (SCRUM-32) : calcul des tuiles OpenStreetMap et de la position des points d'intérêt,
 * en projection Web Mercator, sans bibliothèque ni appel à une API.
 */

export const TILE_SIZE = 256;
export const MIN_MAP_ZOOM = 1;
export const MAX_MAP_ZOOM = 19;

// Au-delà, la projection Web Mercator part à l'infini.
const MAX_LATITUDE = 85.05112878;

export type Coordinates = { latitude: number; longitude: number };

export type MapTile = { key: string; src: string; left: number; top: number };

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

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export type ParsedMapLocation = ({ ok: true } & Coordinates & { zoom?: number }) | { ok: false; error: string };

/**
 * Coordonnées tirées d'un lien Google Maps (`@48.85,2.29,15z`, `?q=48.85,2.29`), d'un lien
 * OpenStreetMap (`#map=15/48.85/2.29`, `?mlat=…&mlon=…`) ou d'un simple « 48.85, 2.29 ».
 */
export function parseMapLocation(input: string): ParsedMapLocation {
  const text = decodeURIComponent(input.trim());
  const number = "(-?\\d+(?:\\.\\d+)?)";
  const patterns: { regex: RegExp; read: (m: RegExpMatchArray) => [number, number, number?] }[] = [
    { regex: new RegExp(`@${number},${number},(\\d+(?:\\.\\d+)?)z`), read: (m) => [+m[1], +m[2], +m[3]] },
    { regex: new RegExp(`#map=(\\d+)/${number}/${number}`), read: (m) => [+m[2], +m[3], +m[1]] },
    { regex: new RegExp(`mlat=${number}&mlon=${number}`), read: (m) => [+m[1], +m[2]] },
    { regex: new RegExp(`[?&](?:q|ll|query)=${number},\\s*${number}`), read: (m) => [+m[1], +m[2]] },
    { regex: new RegExp(`^${number}\\s*[,;\\s]\\s*${number}$`), read: (m) => [+m[1], +m[2]] },
  ];
  for (const { regex, read } of patterns) {
    const match = text.match(regex);
    if (!match) continue;
    const [latitude, longitude, zoom] = read(match);
    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
      return { ok: false, error: "Coordonnées hors limites : latitude entre -90 et 90, longitude entre -180 et 180." };
    }
    const location = { ok: true as const, latitude, longitude };
    return zoom === undefined ? location : { ...location, zoom: clampZoom(Math.round(zoom)) };
  }
  return {
    ok: false,
    error: "Lien non reconnu. Collez un lien Google Maps ou OpenStreetMap, ou des coordonnées « 48.8584, 2.2945 ».",
  };
}

export function clampZoom(zoom: number): number {
  return Math.max(MIN_MAP_ZOOM, Math.min(MAX_MAP_ZOOM, zoom));
}

let markerCount = 0;

export function createMarker(position: number, { latitude, longitude }: Coordinates): MapMarker {
  return { id: `marker_${Date.now()}_${++markerCount}`, label: `Point ${position}`, latitude, longitude };
}
