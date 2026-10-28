import { createContext } from "react";
import type { MapView } from "@/components/screendraft/screendraft-map";
import type { DraftNode, MapNode, Screen } from "@/components/screendraft/screendraft-schema";
import type { Point, Size } from "@/components/screendraft/screendraft-viewport";

/**
 * Carte explorée dans l'éditeur (double-clic sur la carte ou « Explorer la carte ») :
 * glisser la déplace, la molette zoome, un clic pose un point, au lieu d'agir sur le canvas.
 */
export type MapExploration = {
  exploringId: string | null;
  explore: (nodeId: string | null) => void;
};

export const MapExplorationContext = createContext<MapExploration>({
  exploringId: null,
  explore: () => {},
});

/**
 * Vue d'une carte explorée dans le prototype : elle remplace celle de la maquette à l'affichage,
 * sans la modifier. `null` : la carte montre sa vue enregistrée.
 */
export const MapViewOverrideContext = createContext<(nodeId: string) => MapView | null>(() => null);

/** Cartes d'un écran et leur rectangle dans le frame, pour y poser l'explorateur du prototype. */
export function screenMaps(screen: Screen): { node: MapNode; rect: Point & Size }[] {
  const found: { node: MapNode; rect: Point & Size }[] = [];
  const walk = (nodes: DraftNode[], parentX: number, parentY: number) => {
    for (const node of nodes) {
      const x = parentX + node.x;
      const y = parentY + node.y;
      if (node.type === "map") found.push({ node, rect: { x, y, width: node.width, height: node.height } });
      if (node.type === "section") walk(node.children, x, y);
    }
  };
  walk(screen.nodes, 0, 0);
  return found;
}
