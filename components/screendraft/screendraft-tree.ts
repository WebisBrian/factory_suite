import type { DraftNode, ShapeKind } from "@/components/screendraft/screendraft-schema";

/** Déplacement d'un élément dans l'ordre d'empilement de ses voisins (SCRUM-9). */
export type DepthMove = "front" | "forward" | "backward" | "back";

/**
 * Un élément, son parent (`null` : le frame), sa place parmi ses voisins
 * et la position de son parent dans le frame.
 */
export type NodeLocation = {
  node: DraftNode;
  parentId: string | null;
  index: number;
  siblingCount: number;
  parentX: number;
  parentY: number;
};

type Parent = { id: string | null; x: number; y: number };

const FRAME: Parent = { id: null, x: 0, y: 0 };

export function findNode(nodes: DraftNode[], id: string, parent = FRAME): NodeLocation | null {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (node.id === id) {
      return {
        node,
        parentId: parent.id,
        index,
        siblingCount: nodes.length,
        parentX: parent.x,
        parentY: parent.y,
      };
    }
    if (node.type === "section") {
      const found = findNode(node.children, id, {
        id: node.id,
        x: parent.x + node.x,
        y: parent.y + node.y,
      });
      if (found) return found;
    }
  }
  return null;
}

/** Position et taille de l'élément dans le frame, en px à l'échelle 1. */
export function frameRect({ node, parentX, parentY }: NodeLocation) {
  return { x: parentX + node.x, y: parentY + node.y, width: node.width, height: node.height };
}

/** Vrai si `targetId` désigne l'élément `id` lui-même ou l'un de ses descendants. */
export function isSameOrInside(nodes: DraftNode[], id: string, targetId: string): boolean {
  if (id === targetId) return true;
  const location = findNode(nodes, id);
  return location?.node.type === "section" && findNode(location.node.children, targetId) !== null;
}

/**
 * Nouvelle place d'un élément dans l'arbre. `inside` le met au premier plan d'une section
 * (ou du frame si `parentId` est null) ; `before` / `after` le met derrière / devant un voisin.
 */
export type Placement =
  | { type: "inside"; parentId: string | null }
  | { type: "before" | "after"; siblingId: string };

/**
 * Change le parent ou la place d'un élément sans le faire bouger à l'écran : ses x / y
 * sont recalculés par rapport au nouveau parent. Un élément ne peut pas entrer en lui-même.
 */
export function placeNode(nodes: DraftNode[], id: string, placement: Placement): DraftNode[] {
  const location = findNode(nodes, id);
  const anchorId = placement.type === "inside" ? placement.parentId : placement.siblingId;
  if (!location || (anchorId !== null && isSameOrInside(nodes, id, anchorId))) return nodes;

  const remaining = removeNode(nodes, id);
  const parentId =
    placement.type === "inside"
      ? placement.parentId
      : findNode(remaining, placement.siblingId)?.parentId;
  if (parentId === undefined) return nodes;

  const parent = parentId === null ? null : findNode(remaining, parentId);
  if (parent && parent.node.type !== "section") return nodes;

  const position = frameRect(location);
  const origin = parent ? frameRect(parent) : FRAME;
  const moved = { ...location.node, x: position.x - origin.x, y: position.y - origin.y };

  if (parentId === null) return insertAmong(remaining, moved, placement);
  return updateNode(remaining, parentId, (section) =>
    section.type === "section"
      ? { ...section, children: insertAmong(section.children, moved, placement) }
      : section,
  );
}

/** Retire un élément (et ses enfants), où qu'il soit dans l'arbre. */
export function removeNode(nodes: DraftNode[], id: string): DraftNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) =>
      node.type === "section" ? { ...node, children: removeNode(node.children, id) } : node,
    );
}

/** Ajoute un élément au premier plan d'une section, ou du frame si `parentId` est null. */
export function insertInto(nodes: DraftNode[], node: DraftNode, parentId: string | null): DraftNode[] {
  if (parentId === null) return [...nodes, node];
  return updateNode(nodes, parentId, (section) =>
    section.type === "section" ? { ...section, children: [...section.children, node] } : section,
  );
}

function insertAmong(siblings: DraftNode[], node: DraftNode, placement: Placement): DraftNode[] {
  if (placement.type === "inside") return [...siblings, node];
  const index =
    siblings.findIndex((sibling) => sibling.id === placement.siblingId) +
    (placement.type === "after" ? 1 : 0);
  return [...siblings.slice(0, index), node, ...siblings.slice(index)];
}

/**
 * Change la place d'un élément parmi ses voisins. L'ordre du tableau est l'ordre
 * d'empilement : le dernier est au premier plan. Pour changer de parent, voir `placeNode`.
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
    case "shape":
      return SHAPE_LABELS[node.props.shape];
  }
}

export const SHAPE_LABELS: Record<ShapeKind, string> = {
  circle: "Rond",
  rectangle: "Rectangle",
  triangle: "Triangle",
};

/** Remplace un élément, où qu'il soit dans l'arbre. Renvoie le même tableau si rien ne change. */
export function updateNode(
  nodes: DraftNode[],
  id: string,
  update: (node: DraftNode) => DraftNode,
): DraftNode[] {
  let changed = false;
  const next = nodes.map((node) => {
    if (node.id === id) {
      const updated = update(node);
      changed ||= updated !== node;
      return updated;
    }
    if (node.type !== "section") return node;
    const children = updateNode(node.children, id, update);
    if (children === node.children) return node;
    changed = true;
    return { ...node, children };
  });
  return changed ? next : nodes;
}
