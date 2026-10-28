import { cloneNode, insertionOffset } from "@/components/screendraft/screendraft-new-node";
import type { DraftNode } from "@/components/screendraft/screendraft-schema";

/**
 * Bibliothèque de composants custom du projet (fichier `screendraft-composants.json`).
 *
 * Insérer un composant crée une instance : une copie complète, faite d'éléments ordinaires,
 * dont la racine garde le `componentId`. Mettre à jour le composant remplace toutes ses
 * instances ; chacune garde seulement sa place (id et x / y de la racine).
 * Les enfants d'une instance ont des id dérivés de la racine (`<racine>__<enfant>`) :
 * ils restent les mêmes d'une mise à jour à l'autre.
 */
export const LIBRARY_FILE = "screendraft-composants.json";

export const LIBRARY_VERSION = 1;

export type CustomComponent = {
  id: string;
  name: string;
  /** Le contenu du composant, ramené en x = y = 0, sans `componentId`. */
  node: DraftNode;
};

const CHILD_ID_SEPARATOR = "__";

type LibraryFile = {
  version: typeof LIBRARY_VERSION;
  components: CustomComponent[];
};

export type ParsedLibrary = { ok: true; components: CustomComponent[] } | { ok: false; error: string };

export function createComponent(name: string, node: DraftNode): CustomComponent {
  return { id: `component_${Date.now()}`, name, node: toComponentContent(node) };
}

/**
 * Contenu de composant tiré d'un élément de la maquette : x = y = 0, sans `componentId`
 * (pas d'instance dans un composant), et sans le préfixe d'id d'une instance.
 */
export function toComponentContent(node: DraftNode): DraftNode {
  const prefix = `${node.id}${CHILD_ID_SEPARATOR}`;
  const strip = (child: DraftNode): DraftNode => {
    const rest = detachInstance(child);
    const id = rest.id.startsWith(prefix) ? rest.id.slice(prefix.length) : rest.id;
    return rest.type === "section" ? { ...rest, id, children: rest.children.map(strip) } : { ...rest, id };
  };
  return { ...strip(node), id: node.id, x: 0, y: 0 };
}

/** Instance du composant à la place `rootId` / x / y. */
export function buildInstance(component: CustomComponent, rootId: string, x: number, y: number): DraftNode {
  const withChildIds = (child: DraftNode): DraftNode => {
    const id = `${rootId}${CHILD_ID_SEPARATOR}${child.id}`;
    return child.type === "section" ? { ...child, id, children: child.children.map(withChildIds) } : { ...child, id };
  };
  const root = { ...component.node, id: rootId, x, y, componentId: component.id };
  return root.type === "section" ? { ...root, children: root.children.map(withChildIds) } : root;
}

/** Nouvelle instance à insérer au premier niveau du frame. */
export function instantiateComponent(component: CustomComponent, index: number): DraftNode {
  const offset = insertionOffset(index);
  // cloneNode ne sert qu'à tirer un id de racine unique.
  const { id } = cloneNode(component.node, 0);
  return buildInstance(component, id, offset, offset);
}

/** Vrai si l'instance a été modifiée depuis le composant (sa place mise à part). */
export function isInstanceModified(node: DraftNode, component: CustomComponent): boolean {
  return !sameJson(node, buildInstance(component, node.id, node.x, node.y));
}

/**
 * Remplace, dans un arbre d'éléments, chaque racine d'instance pour laquelle `replace`
 * renvoie un élément. Renvoie le même tableau si rien ne change.
 */
export function mapInstances(
  nodes: DraftNode[],
  replace: (instance: DraftNode & { componentId: string }) => DraftNode | null,
): DraftNode[] {
  let changed = false;
  const next = nodes.map((node) => {
    if (node.componentId !== undefined) {
      const replaced = replace({ ...node, componentId: node.componentId });
      if (replaced && !sameJson(replaced, node)) {
        changed = true;
        return replaced;
      }
      return node;
    }
    if (node.type !== "section") return node;
    const children = mapInstances(node.children, replace);
    if (children === node.children) return node;
    changed = true;
    return { ...node, children };
  });
  return changed ? next : nodes;
}

/** L'instance redevient un élément ordinaire, sans lien avec le composant. */
export function detachInstance(node: DraftNode): DraftNode {
  const copy = { ...node };
  delete copy.componentId;
  return copy;
}

/** Égalité de deux valeurs JSON, indépendante de l'ordre des clés. */
function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a)) {
    return Array.isArray(b) && a.length === b.length && a.every((item, index) => sameJson(item, b[index]));
  }
  if (!isRecord(a) || !isRecord(b)) return false;
  const keys = Object.keys(a).filter((key) => a[key] !== undefined);
  const otherKeys = Object.keys(b).filter((key) => b[key] !== undefined);
  return keys.length === otherKeys.length && keys.every((key) => sameJson(a[key], b[key]));
}

export function serializeLibrary(components: CustomComponent[]): string {
  const file: LibraryFile = { version: LIBRARY_VERSION, components };
  return JSON.stringify(file, null, 2);
}

/** Relit la bibliothèque. Un composant mal formé est ignoré plutôt que de tout rejeter. */
export function parseLibrary(text: string): ParsedLibrary {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: `${LIBRARY_FILE} n'est pas un fichier JSON valide.` };
  }
  if (!isRecord(data) || data.version !== LIBRARY_VERSION || !Array.isArray(data.components)) {
    return {
      ok: false,
      error: `${LIBRARY_FILE} n'est pas une bibliothèque Screendraft (version ${LIBRARY_VERSION}).`,
    };
  }
  return { ok: true, components: data.components.filter(isComponent) };
}

function isComponent(value: unknown): value is CustomComponent {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isRecord(value.node) &&
    typeof value.node.id === "string" &&
    typeof value.node.type === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
