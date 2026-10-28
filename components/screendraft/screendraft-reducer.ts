import type { FrameFormat } from "@/components/screendraft/screendraft-formats";
import type { DraftNode, Maquette } from "@/components/screendraft/screendraft-schema";
import {
  findNode,
  moveInDepth,
  placeNode,
  removeNode,
  updateNode,
  type DepthMove,
  type Placement,
} from "@/components/screendraft/screendraft-tree";

/** Toutes les modifications de la maquette passent par ici, une action par story. */
export type ScreendraftAction =
  | { type: "set-format"; format: FrameFormat }
  | { type: "set-frame-height"; height: number }
  | { type: "move-depth"; id: string; move: DepthMove }
  | { type: "place-node"; id: string; placement: Placement }
  | { type: "add-node"; node: DraftNode }
  | { type: "paste-node"; node: DraftNode; parentId: string | null }
  | { type: "delete-node"; id: string }
  | { type: "move-node"; id: string; x: number; y: number }
  | { type: "set-text"; id: string; text: string }
  | { type: "set-image"; id: string; src: string; alt: string };

export function screendraftReducer(draft: Maquette, action: ScreendraftAction): Maquette {
  switch (action.type) {
    // Les éléments ne bougent pas : ce qui dépasse du nouveau frame est masqué.
    case "set-format": {
      const { device, width, height } = action.format;
      return { ...draft, frame: { ...draft.frame, device, width, height } };
    }
    case "set-frame-height":
      return { ...draft, frame: { ...draft.frame, height: action.height } };
    case "move-depth": {
      const nodes = moveInDepth(draft.nodes, action.id, action.move);
      return nodes === draft.nodes ? draft : { ...draft, nodes };
    }
    // Sortir un élément d'une section, l'y faire entrer ou le passer dans une autre.
    case "place-node": {
      const nodes = placeNode(draft.nodes, action.id, action.placement);
      return nodes === draft.nodes ? draft : { ...draft, nodes };
    }
    // Ajouté au premier plan, au premier niveau du frame.
    case "add-node":
      return { ...draft, nodes: [...draft.nodes, action.node] };
    // Collé au premier plan de son ancienne section, ou du frame si elle n'existe plus.
    case "paste-node": {
      const parent = action.parentId === null ? null : findNode(draft.nodes, action.parentId);
      if (parent?.node.type !== "section") return { ...draft, nodes: [...draft.nodes, action.node] };
      return withNode(draft, parent.node.id, (section) =>
        section.type === "section" ? { ...section, children: [...section.children, action.node] } : section,
      );
    }
    // Supprimer une section supprime aussi ses enfants.
    case "delete-node":
      return findNode(draft.nodes, action.id)
        ? { ...draft, nodes: removeNode(draft.nodes, action.id) }
        : draft;
    // x / y relatifs au parent, comme dans le JSON.
    case "move-node":
      return withNode(draft, action.id, (node) =>
        node.x === action.x && node.y === action.y ? node : { ...node, x: action.x, y: action.y },
      );
    case "set-text":
      return withNode(draft, action.id, (node) => {
        if (node.type === "text") return { ...node, props: { text: action.text } };
        if (node.type === "title") return { ...node, props: { ...node.props, text: action.text } };
        return node;
      });
    case "set-image":
      return withNode(draft, action.id, (node) =>
        node.type === "image" ? { ...node, props: { ...node.props, src: action.src, alt: action.alt } } : node,
      );
  }
}

function withNode(draft: Maquette, id: string, update: (node: DraftNode) => DraftNode): Maquette {
  const nodes = updateNode(draft.nodes, id, update);
  return nodes === draft.nodes ? draft : { ...draft, nodes };
}
