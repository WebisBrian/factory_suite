import {
  buildInstance,
  detachInstance,
  mapInstances,
  type CustomComponent,
} from "@/components/screendraft/screendraft-components";
import type { FrameFormat } from "@/components/screendraft/screendraft-formats";
import type {
  ButtonNode,
  DraftNode,
  ImageNode,
  Maquette,
  NodeA11y,
  NodeStyle,
  Screen,
  ShapeNode,
  TextNode,
  ThemeLinks,
  TitleNode,
  VideoNode,
} from "@/components/screendraft/screendraft-schema";
import { withA11y } from "@/components/screendraft/screendraft-a11y";
import { syncLinks } from "@/components/screendraft/screendraft-links";
import {
  applyTheme,
  applyThemeToNode,
  followTitleLevel,
  patchTheme,
  type ThemePatch,
} from "@/components/screendraft/screendraft-mockup-theme";
import { groupNodes } from "@/components/screendraft/screendraft-group";
import { findScreenNode } from "@/components/screendraft/screendraft-screens";
import {
  findNode,
  insertInto,
  moveInDepth,
  placeNode,
  removeNode,
  updateNode,
  type DepthMove,
  type Placement,
} from "@/components/screendraft/screendraft-tree";

/**
 * Toutes les modifications de la maquette passent par ici, une action par story.
 * Les actions sur un élément retrouvent seules son écran ; les autres le nomment.
 */
export type ScreendraftAction =
  /** Remplace tout le contenu par celui d'un modèle ; la maquette garde son id. */
  | { type: "load-template"; template: Maquette }
  | { type: "add-screen"; screen: Screen }
  | { type: "rename-screen"; screenId: string; name: string }
  | { type: "delete-screen"; screenId: string }
  | { type: "set-format"; screenId: string; format: FrameFormat }
  | { type: "set-frame-height"; screenId: string; height: number }
  | { type: "add-node"; screenId: string; node: DraftNode }
  | { type: "paste-node"; screenId: string; node: DraftNode; parentId: string | null }
  | { type: "delete-node"; id: string }
  | { type: "move-depth"; id: string; move: DepthMove }
  | { type: "place-node"; id: string; placement: Placement }
  /** Passe un élément dans un autre écran, au premier niveau ou dans une section (`parentId`). */
  | { type: "move-to-screen"; id: string; screenId: string; parentId: string | null; x: number; y: number }
  | { type: "move-node"; id: string; x: number; y: number }
  | { type: "set-text"; id: string; text: string }
  | { type: "set-image"; id: string; src: string }
  // SCRUM-25 : ce que les lecteurs d'écran liront pour l'élément.
  | { type: "set-a11y"; id: string; patch: NodeA11y }
  | { type: "set-geometry"; id: string; geometry: Partial<Geometry> }
  | { type: "set-style"; id: string; style: NodeStyle }
  | ({ type: "set-props"; id: string } & PropsPatch)
  | { type: "sync-component"; component: CustomComponent }
  | { type: "reset-instance"; id: string; component: CustomComponent }
  | { type: "detach-instance"; id: string }
  | { type: "detach-component"; componentId: string }
  | { type: "group-nodes"; ids: string[]; wrapperId: string; component?: CustomComponent }
  | { type: "delete-nodes"; ids: string[] }
  /** Modifie la charte : tous les éléments qui la suivent sont mis à jour, sur tous les écrans. */
  | { type: "set-theme"; patch: ThemePatch }
  /** Lie des propriétés de l'élément à la charte ; une valeur `undefined` retire le lien. */
  | { type: "link-style"; id: string; links: ThemeLinks };

/** Position (relative au parent) et taille d'un élément, en px. */
export type Geometry = Pick<DraftNode, "x" | "y" | "width" | "height">;

/** Propriétés propres à un type d'élément ; ignorées si l'élément est d'un autre type. */
export type PropsPatch =
  | { nodeType: "title"; props: Partial<TitleNode["props"]> }
  | { nodeType: "text"; props: Partial<TextNode["props"]> }
  | { nodeType: "image"; props: Partial<ImageNode["props"]> }
  | { nodeType: "video"; props: Partial<VideoNode["props"]> }
  | { nodeType: "button"; props: Partial<ButtonNode["props"]> }
  | { nodeType: "shape"; props: Partial<ShapeNode["props"]> };

/**
 * Applique une action, puis remet à jour les liens du prototype : renommer, supprimer ou
 * ajouter un écran change les `path`, donc les `href` des boutons qui y mènent.
 */
export function screendraftReducer(draft: Maquette, action: ScreendraftAction): Maquette {
  return syncLinks(applyAction(draft, action));
}

function applyAction(draft: Maquette, action: ScreendraftAction): Maquette {
  switch (action.type) {
    case "load-template":
      return {
        ...draft,
        name: action.template.name,
        theme: action.template.theme,
        screens: structuredClone(action.template.screens),
      };
    // Ajouté après les autres, donc à droite sur le canvas.
    case "add-screen":
      return applyTheme({ ...draft, screens: [...draft.screens, action.screen] });
    case "rename-screen":
      return withScreen(draft, action.screenId, (screen) =>
        screen.name === action.name ? screen : { ...screen, name: action.name },
      );
    // Une maquette garde toujours au moins un écran.
    case "delete-screen":
      if (draft.screens.length <= 1) return draft;
      return { ...draft, screens: draft.screens.filter((screen) => screen.id !== action.screenId) };
    // Les éléments ne bougent pas : ce qui dépasse du nouveau frame est masqué.
    case "set-format": {
      const { device, width, height } = action.format;
      return withScreen(draft, action.screenId, (screen) => ({
        ...screen,
        frame: { ...screen.frame, device, width, height },
      }));
    }
    case "set-frame-height":
      return withScreen(draft, action.screenId, (screen) => ({
        ...screen,
        frame: { ...screen.frame, height: action.height },
      }));
    // Ajouté au premier plan, au premier niveau du frame, aux couleurs de la charte actuelle.
    case "add-node":
      return withScreen(draft, action.screenId, (screen) => ({
        ...screen,
        nodes: [...screen.nodes, applyThemeToNode(action.node, draft.theme)],
      }));
    // Collé au premier plan de son ancienne section si elle est dans cet écran, sinon au
    // premier niveau du frame (section supprimée, ou élément copié depuis un autre écran).
    case "paste-node":
      return withScreen(draft, action.screenId, (screen) => {
        const parent = action.parentId === null ? null : findNode(screen.nodes, action.parentId);
        const parentId = parent?.node.type === "section" ? parent.node.id : null;
        const node = applyThemeToNode(action.node, draft.theme);
        return { ...screen, nodes: insertInto(screen.nodes, node, parentId) };
      });
    // Supprimer une section supprime aussi ses enfants.
    case "delete-node":
      return withNodesOf(draft, action.id, (nodes) => removeNode(nodes, action.id));
    case "move-depth":
      return withNodesOf(draft, action.id, (nodes) => moveInDepth(nodes, action.id, action.move));
    // Sortir un élément d'une section, l'y faire entrer ou le passer dans une autre, dans le même écran.
    case "place-node":
      return withNodesOf(draft, action.id, (nodes) => placeNode(nodes, action.id, action.placement));
    case "move-to-screen":
      return moveToScreen(draft, action);
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
    // Le texte alternatif est gardé : le nom du fichier n'est pas une alternative (RGAA 1.3).
    case "set-image":
      return withNode(draft, action.id, (node) =>
        node.type === "image" ? { ...node, props: { ...node.props, src: action.src } } : node,
      );
    case "set-a11y":
      return withNode(draft, action.id, (node) => withA11y(node, action.patch));
    case "set-geometry":
      return withNode(draft, action.id, (node) => ({ ...node, ...action.geometry }));
    // Une valeur `undefined` retire la propriété : le rendu par défaut s'applique.
    // Une valeur choisie à la main détache la propriété de la charte.
    case "set-style":
      return withNode(draft, action.id, (node) =>
        withLinks(
          { ...node, style: withoutUndefined({ ...node.style, ...action.style }) },
          Object.fromEntries(Object.keys(action.style).map((key) => [key, undefined])),
        ),
      );
    // Le niveau d'un titre lié à la charte décide de sa taille.
    case "set-props":
      return withNode(draft, action.id, (node) => followTitleLevel(mergeProps(node, action), draft.theme));
    // Composant mis à jour : toutes ses instances, dans tous les écrans, reprennent son contenu
    // (aux valeurs de la charte de la maquette pour ce qui la suit).
    case "sync-component": {
      const { component } = action;
      return withAllNodes(draft, (nodes) =>
        mapInstances(nodes, (instance) =>
          instance.componentId === component.id
            ? applyThemeToNode(buildInstance(component, instance.id, instance.x, instance.y), draft.theme)
            : null,
        ),
      );
    }
    // Annule les modifications locales d'une instance ; lie aussi un élément au composant créé depuis lui.
    case "reset-instance":
      return withNode(draft, action.id, (node) =>
        applyThemeToNode(buildInstance(action.component, node.id, node.x, node.y), draft.theme),
      );
    case "detach-instance":
      return withNode(draft, action.id, (node) =>
        node.componentId === undefined ? node : detachInstance(node),
      );
    // Composant retiré de la bibliothèque : ses instances deviennent des éléments ordinaires.
    case "detach-component":
      return withAllNodes(draft, (nodes) =>
        mapInstances(nodes, (instance) =>
          instance.componentId === action.componentId ? detachInstance(instance) : null,
        ),
      );
    // Sélection multiple : les éléments, d'un même écran, passent dans une nouvelle section.
    // Avec `component`, la section devient aussitôt son instance : une seule étape à annuler.
    case "group-nodes": {
      const { ids, wrapperId, component } = action;
      if (ids.length === 0) return draft;
      return withNodesOf(draft, ids[0], (nodes) => {
        const grouped = groupNodes(nodes, ids, wrapperId);
        if (!grouped) return nodes;
        if (!component) return grouped.nodes;
        return updateNode(grouped.nodes, wrapperId, (node) => buildInstance(component, node.id, node.x, node.y));
      });
    }
    case "delete-nodes":
      return action.ids.reduce(
        (current, id) => withNodesOf(current, id, (nodes) => removeNode(nodes, id)),
        draft,
      );
    case "set-theme":
      return applyTheme({ ...draft, theme: patchTheme(draft.theme, action.patch) });
    case "link-style":
      return withNode(draft, action.id, (node) =>
        applyThemeToNode(withLinks(node, action.links), draft.theme),
      );
  }
}

/** Fusionne des liens vers la charte ; un lien `undefined` est retiré, et `themeLinks` vide aussi. */
function withLinks(node: DraftNode, links: ThemeLinks): DraftNode {
  const merged = withoutUndefined({ ...node.themeLinks, ...links });
  if (Object.keys(merged).length > 0) return { ...node, themeLinks: merged };
  if (!node.themeLinks) return node;
  const unlinked = { ...node };
  delete unlinked.themeLinks;
  return unlinked;
}

/** Modifie les éléments de chaque écran. Renvoie la même maquette si rien ne change. */
function withAllNodes(draft: Maquette, update: (nodes: DraftNode[]) => DraftNode[]): Maquette {
  let changed = false;
  const screens = draft.screens.map((screen) => {
    const nodes = update(screen.nodes);
    if (nodes === screen.nodes) return screen;
    changed = true;
    return { ...screen, nodes };
  });
  return changed ? { ...draft, screens } : draft;
}

function mergeProps(node: DraftNode, patch: PropsPatch): DraftNode {
  switch (patch.nodeType) {
    case "title":
      return node.type === "title" ? { ...node, props: { ...node.props, ...patch.props } } : node;
    case "text":
      return node.type === "text" ? { ...node, props: { ...node.props, ...patch.props } } : node;
    case "image":
      return node.type === "image" ? { ...node, props: { ...node.props, ...patch.props } } : node;
    case "video":
      return node.type === "video" ? { ...node, props: { ...node.props, ...patch.props } } : node;
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

/** Remplace un écran. Renvoie la même maquette si rien ne change. */
function withScreen(draft: Maquette, screenId: string, update: (screen: Screen) => Screen): Maquette {
  let changed = false;
  const screens = draft.screens.map((screen) => {
    if (screen.id !== screenId) return screen;
    const updated = update(screen);
    changed ||= updated !== screen;
    return updated;
  });
  return changed ? { ...draft, screens } : draft;
}

/** Modifie les éléments de l'écran qui contient l'élément `id`. */
function withNodesOf(draft: Maquette, id: string, update: (nodes: DraftNode[]) => DraftNode[]): Maquette {
  const found = findScreenNode(draft.screens, id);
  if (!found) return draft;
  return withScreen(draft, found.screen.id, (screen) => {
    const nodes = update(screen.nodes);
    return nodes === screen.nodes ? screen : { ...screen, nodes };
  });
}

/**
 * Retire l'élément de son écran et l'ajoute au premier plan de `parentId` dans l'écran cible,
 * en x / y relatifs à ce parent. Ses enfants le suivent ; les ids restent uniques dans le document.
 */
function moveToScreen(
  draft: Maquette,
  { id, screenId, parentId, x, y }: Extract<ScreendraftAction, { type: "move-to-screen" }>,
): Maquette {
  const found = findScreenNode(draft.screens, id);
  const target = draft.screens.find((screen) => screen.id === screenId);
  if (!found || !target || found.screen.id === screenId) return draft;
  if (parentId !== null && findNode(target.nodes, parentId)?.node.type !== "section") return draft;

  const moved = { ...found.location.node, x, y };
  return {
    ...draft,
    screens: draft.screens.map((screen) => {
      if (screen.id === found.screen.id) return { ...screen, nodes: removeNode(screen.nodes, id) };
      if (screen.id === screenId) return { ...screen, nodes: insertInto(screen.nodes, moved, parentId) };
      return screen;
    }),
  };
}

function withNode(draft: Maquette, id: string, update: (node: DraftNode) => DraftNode): Maquette {
  return withNodesOf(draft, id, (nodes) => updateNode(nodes, id, update));
}
