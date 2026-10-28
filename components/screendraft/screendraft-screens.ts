import type { FrameFormat } from "@/components/screendraft/screendraft-formats";
import type { Screen } from "@/components/screendraft/screendraft-schema";
import { findNode, type NodeLocation } from "@/components/screendraft/screendraft-tree";
import type { Point, Size } from "@/components/screendraft/screendraft-viewport";

/** Espace entre deux écrans sur le canvas, en px de la maquette. */
export const SCREEN_GAP = 160;

/** Un élément et l'écran qui le contient. */
export type ScreenNodeLocation = { screen: Screen; location: NodeLocation };

export function findScreenNode(screens: Screen[], id: string): ScreenNodeLocation | null {
  for (const screen of screens) {
    const location = findNode(screen.nodes, id);
    if (location) return { screen, location };
  }
  return null;
}

/**
 * Place des écrans sur le canvas : alignés en haut, de gauche à droite dans l'ordre du JSON.
 * C'est un état de l'éditeur, jamais exporté : le Générateur traite chaque écran à part.
 */
export function screenOrigins(screens: Screen[]): Map<string, Point> {
  const origins = new Map<string, Point>();
  let x = 0;
  for (const screen of screens) {
    origins.set(screen.id, { x, y: 0 });
    x += screen.frame.width + SCREEN_GAP;
  }
  return origins;
}

/** Taille de l'ensemble des écrans, pour ajuster le zoom afin de tous les voir. */
export function screensSize(screens: Screen[]): Size {
  return {
    width: screens.reduce((total, screen) => total + screen.frame.width, 0) + SCREEN_GAP * (screens.length - 1),
    height: Math.max(...screens.map((screen) => screen.frame.height)),
  };
}

/** Nouvel écran vide, au format de `format`, nommé « Écran N » sans doublon. */
export function createScreen(screens: Screen[], format: FrameFormat): Screen {
  const names = new Set(screens.map((screen) => screen.name));
  let number = screens.length + 1;
  while (names.has(`Écran ${number}`)) number++;
  return {
    id: `screen_${Date.now()}`,
    name: `Écran ${number}`,
    frame: { ...format, backgroundColor: "#ffffff" },
    nodes: [],
  };
}
