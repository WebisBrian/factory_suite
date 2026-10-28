import type { DraftNode, SectionNode } from "@/components/screendraft/screendraft-schema";
import {
  findNode,
  frameRect,
  isSameOrInside,
  removeNode,
  updateNode,
  type NodeLocation,
} from "@/components/screendraft/screendraft-tree";

/**
 * Éléments sélectionnés à regrouper : un élément dont un ancêtre est aussi sélectionné
 * suit déjà cet ancêtre, il est donc ignoré. Dans l'ordre d'empilement du document.
 */
export function groupableLocations(nodes: DraftNode[], ids: string[]): NodeLocation[] | null {
  const locations = ids
    .map((id) => findNode(nodes, id))
    .filter((location): location is NodeLocation => location !== null);
  if (locations.length !== ids.length) return null;
  const kept = locations.filter(
    ({ node }) => !ids.some((other) => other !== node.id && isSameOrInside(nodes, other, node.id)),
  );
  const order = documentOrder(nodes);
  return kept.sort((a, b) => (order.get(a.node.id) ?? 0) - (order.get(b.node.id) ?? 0));
}

/**
 * Regroupe des éléments d'un même écran dans une nouvelle section, ajustée à leur ensemble,
 * sans qu'ils bougent à l'écran. La section prend la place du plus en avant d'entre eux
 * s'ils ont le même parent, sinon elle va au premier plan du frame.
 * Renvoie null si un élément n'est pas dans `nodes`.
 */
export function groupNodes(
  nodes: DraftNode[],
  ids: string[],
  wrapperId: string,
): { nodes: DraftNode[]; wrapper: SectionNode } | null {
  const locations = groupableLocations(nodes, ids);
  if (!locations || locations.length === 0) return null;

  const rects = locations.map(frameRect);
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));

  const parentIds = new Set(locations.map((location) => location.parentId));
  const parentId = parentIds.size === 1 ? locations[0].parentId : null;
  const parent = parentId === null ? null : findNode(nodes, parentId);
  const origin = parent ? frameRect(parent) : { x: 0, y: 0 };

  const wrapper: SectionNode = {
    id: wrapperId,
    type: "section",
    x: left - origin.x,
    y: top - origin.y,
    width: right - left,
    height: bottom - top,
    style: {},
    children: locations.map((location, index) => ({
      ...location.node,
      x: rects[index].x - left,
      y: rects[index].y - top,
    })),
  };

  const remaining = locations.reduce((current, { node }) => removeNode(current, node.id), nodes);
  // Même parent : à la place du plus en avant, décalée des éléments retirés devant lui.
  const index =
    parentIds.size === 1
      ? Math.max(...locations.map((location) => location.index)) - (locations.length - 1)
      : null;
  const insert = (siblings: DraftNode[]) =>
    index === null ? [...siblings, wrapper] : [...siblings.slice(0, index), wrapper, ...siblings.slice(index)];

  if (parentId === null) return { nodes: insert(remaining), wrapper };
  return {
    nodes: updateNode(remaining, parentId, (section) =>
      section.type === "section" ? { ...section, children: insert(section.children) } : section,
    ),
    wrapper,
  };
}

/** Rang de chaque élément dans un parcours en profondeur : du fond vers le premier plan. */
function documentOrder(nodes: DraftNode[]): Map<string, number> {
  const order = new Map<string, number>();
  const visit = (list: DraftNode[]) => {
    for (const node of list) {
      order.set(node.id, order.size);
      if (node.type === "section") visit(node.children);
    }
  };
  visit(nodes);
  return order;
}
