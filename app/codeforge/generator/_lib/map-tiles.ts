// Carte statique : tuiles OpenStreetMap (projection Web Mercator) placées autour du centre, sans bibliothèque.
// Même calcul que ScreenDraft, redéclaré ici : un squad n'importe pas le code d'un autre.

const TILE_SIZE = 256;
const MAX_LATITUDE = 85.05112878;

export type MapPoint = { latitude: number; longitude: number };
export type PlacedTile = { src: string; left: number; top: number };

/** Position d'un point sur la carte du monde entière au niveau `zoom`, en px. */
function project({ latitude, longitude }: MapPoint, zoom: number): { x: number; y: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude)) * Math.PI) / 180);
  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

/** Position d'un point dans une carte de `width` × `height` px centrée sur `center`. */
export function pointInMap(point: MapPoint, center: MapPoint, zoom: number, width: number, height: number) {
  const target = project(point, zoom);
  const origin = project(center, zoom);
  return { x: Math.round(width / 2 + target.x - origin.x), y: Math.round(height / 2 + target.y - origin.y) };
}

/** Tuiles qui couvrent la carte, avec leur place en px dans le cadre. */
export function tilesFor(center: MapPoint, zoom: number, width: number, height: number): PlacedTile[] {
  const origin = project(center, zoom);
  const left = origin.x - width / 2;
  const top = origin.y - height / 2;
  const count = 2 ** zoom;
  const tiles: PlacedTile[] = [];
  for (let ty = Math.floor(top / TILE_SIZE); ty <= Math.floor((top + height) / TILE_SIZE); ty++) {
    if (ty < 0 || ty >= count) continue;
    for (let tx = Math.floor(left / TILE_SIZE); tx <= Math.floor((left + width) / TILE_SIZE); tx++) {
      const wrappedX = ((tx % count) + count) % count;
      tiles.push({
        src: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`,
        left: Math.round(tx * TILE_SIZE - left),
        top: Math.round(ty * TILE_SIZE - top),
      });
    }
  }
  return tiles;
}

export const TILE_PX = TILE_SIZE;
