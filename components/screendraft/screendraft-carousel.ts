import { createContext, useMemo, useState } from "react";
import type { CarouselNode, CarouselSlide, DraftNode, Screen } from "@/components/screendraft/screendraft-schema";
import type { Point, Size } from "@/components/screendraft/screendraft-viewport";

/**
 * Diapositive affichée de chaque carrousel, par id d'élément. C'est un état de l'éditeur
 * ou du prototype, jamais exporté : la page générée commence toujours par la première.
 */
export type CarouselPreview = {
  slideIndex: (nodeId: string) => number;
  showSlide: (nodeId: string, index: number) => void;
};

export const CarouselPreviewContext = createContext<CarouselPreview>({
  slideIndex: () => 0,
  showSlide: () => {},
});

export function useCarouselPreviewState(): CarouselPreview {
  const [indexes, setIndexes] = useState<ReadonlyMap<string, number>>(new Map());
  return useMemo(
    () => ({
      slideIndex: (nodeId) => indexes.get(nodeId) ?? 0,
      showSlide: (nodeId, index) => setIndexes((current) => new Map(current).set(nodeId, index)),
    }),
    [indexes],
  );
}

/** Index ramené dans les diapositives, en bouclant : après la dernière vient la première. */
export function wrapSlideIndex(index: number, count: number): number {
  return count === 0 ? 0 : ((index % count) + count) % count;
}

let slideCount = 0;

/** Nouvelle diapositive, avec une image d'exemple à remplacer. */
export function createSlide(position: number): CarouselSlide {
  return {
    id: `slide_${Date.now()}_${++slideCount}`,
    src: `https://placehold.co/1280x720/e0f2fe/0369a1?text=Diapositive+${position}`,
    alt: `Diapositive ${position}`,
  };
}

/** Carrousels d'un écran et leur rectangle dans le frame, pour poser les flèches du prototype. */
export function screenCarousels(screen: Screen): { node: CarouselNode; rect: Point & Size }[] {
  const found: { node: CarouselNode; rect: Point & Size }[] = [];
  const walk = (nodes: DraftNode[], parentX: number, parentY: number) => {
    for (const node of nodes) {
      const x = parentX + node.x;
      const y = parentY + node.y;
      if (node.type === "carousel") found.push({ node, rect: { x, y, width: node.width, height: node.height } });
      if (node.type === "section") walk(node.children, x, y);
    }
  };
  walk(screen.nodes, 0, 0);
  return found;
}
