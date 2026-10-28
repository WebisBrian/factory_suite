import type { FrameFormat } from "@/components/screendraft/screendraft-formats";
import type {
  ButtonNode,
  DraftNode,
  ImageNode,
  Maquette,
  NodeStyle,
  ShapeNode,
  TextNode,
  TitleNode,
} from "@/components/screendraft/screendraft-schema";
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
  | { type: "set-image"; id: string; src: string; alt: string }
  | { type: "set-geometry"; id: string; geometry: Partial<Geometry> }
  | { type: "set-style"; id: string; style: NodeStyle }
  | ({ type: "set-props"; id: string } & PropsPatch);

/** Position (relative au parent) et taille d'un élément, en px. */
export type Geometry = Pick<DraftNode, "x" | "y" | "width" | "height">;

/** Propriétés propres à un type d'élément ; ignorées si l'élément est d'un autre type. */
export type PropsPatch =
  | { nodeType: "title"; props: Partial<TitleNode["props"]> }
  | { nodeType: "text"; props: Partial<TextNode["props"]> }
  | { nodeType: "image"; props: Partial<ImageNode["props"]> }
  | { nodeType: "button"; props: Partial<ButtonNode["props"]> }
  | { nodeType: "shape"; props: Partial<ShapeNode["props"]> };

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
    case "set-geometry":
      return withNode(draft, action.id, (node) => ({ ...node, ...action.geometry }));
    // Une valeur `undefined` retire la propriété : le rendu par défaut s'applique.
    case "set-style":
      return withNode(draft, action.id, (node) => ({
        ...node,
        style: withoutUndefined({ ...node.style, ...action.style }),
      }));
    case "set-props":
      return withNode(draft, action.id, (node) => mergeProps(node, action));
  }
}

function mergeProps(node: DraftNode, patch: PropsPatch): DraftNode {
  switch (patch.nodeType) {
    case "title":
      return node.type === "title" ? { ...node, props: { ...node.props, ...patch.props } } : node;
    case "text":
      return node.type === "text" ? { ...node, props: { ...node.props, ...patch.props } } : node;
    case "image":
      return node.type === "image" ? { ...node, props: { ...node.props, ...patch.props } } : node;
    case "button":
      return node.type === "button"
        ? { ...node, props: withoutUndefined({ ...node.props, ...patch.props }) }
        : node;
    case "shape":
      return node.type === "shape" ? { ...node, props: { ...node.props, ...patch.props } } : node;
  }
}

/** Le JSON exporté ne garde pas les clés vides (ex. un lien de bouton effacé). */
function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

function withNode(draft: Maquette, id: string, update: (node: DraftNode) => DraftNode): Maquette {
  const nodes = updateNode(draft.nodes, id, update);
  return nodes === draft.nodes ? draft : { ...draft, nodes };
}
