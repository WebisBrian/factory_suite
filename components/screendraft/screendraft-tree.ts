import type { DraftNode } from "@/components/screendraft/screendraft-schema";

/** Déplacement d'un élément dans l'ordre d'empilement de ses voisins (SCRUM-9). */
export type DepthMove = "front" | "forward" | "backward" | "back";

/** Un élément, sa place parmi ses voisins et la position de son parent dans le frame. */
export type NodeLocation = {
  node: DraftNode;
  index: number;
  siblingCount: number;
  parentX: number;
  parentY: number;
};

export function findNode(
  nodes: DraftNode[],
  id: string,
  parentX = 0,
  parentY = 0,
): NodeLocation | null {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (node.id === id) return { node, index, siblingCount: nodes.length, parentX, parentY };
    if (node.type === "section") {
      const found = findNode(node.children, id, parentX + node.x, parentY + node.y);
      if (found) return found;
    }
  }
  return null;
}

/** Position et taille de l'élément dans le frame, en px à l'échelle 1. */
export function frameRect({ node, parentX, parentY }: NodeLocation) {
  return { x: parentX + node.x, y: parentY + node.y, width: node.width, height: node.height };
}

/**
 * Change la place d'un élément parmi ses voisins. L'ordre du tableau est l'ordre
 * d'empilement : le dernier est au premier plan. Un élément ne sort jamais de son parent.
 */
export function moveInDepth(nodes: DraftNode[], id: string, move: DepthMove): DraftNode[] {
  const index = nodes.findIndex((node) => node.id === id);
  if (index !== -1) {
    const target = depthTarget(index, nodes.length, move);
    if (target === index) return nodes;
    const next = [...nodes];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    return next;
  }

  let changed = false;
  const next = nodes.map((node) => {
    if (node.type !== "section") return node;
    const children = moveInDepth(node.children, id, move);
    if (children === node.children) return node;
    changed = true;
    return { ...node, children };
  });
  return changed ? next : nodes;
}

export function canMoveInDepth({ index, siblingCount }: NodeLocation, move: DepthMove): boolean {
  return depthTarget(index, siblingCount, move) !== index;
}

function depthTarget(index: number, count: number, move: DepthMove): number {
  switch (move) {
    case "front":
      return count - 1;
    case "forward":
      return Math.min(index + 1, count - 1);
    case "backward":
      return Math.max(index - 1, 0);
    case "back":
      return 0;
  }
}

/** Nom affiché dans les calques : le contenu de l'élément quand il en a un. */
export function nodeLabel(node: DraftNode): string {
  switch (node.type) {
    case "section":
      return "Section";
    case "title":
    case "text":
      return node.props.text;
    case "image":
      return node.props.alt || "Image";
    case "button":
      return node.props.label;
  }
}
