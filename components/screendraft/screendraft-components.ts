import { cloneNode, insertionOffset } from "@/components/screendraft/screendraft-new-node";
import type { DraftNode } from "@/components/screendraft/screendraft-schema";

/**
 * Bibliothèque de composants custom du projet (fichier `screendraft-composants.json`).
 *
 * Un composant est un modèle : l'insérer colle une copie indépendante, faite d'éléments
 * ordinaires. `maquette.json` ne sait donc rien des composants et le Générateur non plus.
 */
export const LIBRARY_FILE = "screendraft-composants.json";

export const LIBRARY_VERSION = 1;

export type CustomComponent = {
  id: string;
  name: string;
  /** L'élément source (et ses enfants), ramené en x = y = 0. */
  node: DraftNode;
};

type LibraryFile = {
  version: typeof LIBRARY_VERSION;
  components: CustomComponent[];
};

export type ParsedLibrary = { ok: true; components: CustomComponent[] } | { ok: false; error: string };

export function createComponent(name: string, node: DraftNode): CustomComponent {
  return { id: `component_${Date.now()}`, name, node: { ...node, x: 0, y: 0 } };
}

/** Copie du composant à insérer au premier niveau du frame, avec de nouveaux id. */
export function instantiateComponent(component: CustomComponent, index: number): DraftNode {
  const offset = insertionOffset(index);
  return cloneNode({ ...component.node, x: offset, y: offset }, 0);
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
