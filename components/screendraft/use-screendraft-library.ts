import { useCallback, useEffect, useRef, useState } from "react";
import { readProjectText, writeProjectFile } from "@/lib/project-fs";
import {
  LIBRARY_FILE,
  createComponent,
  parseLibrary,
  serializeLibrary,
  toComponentContent,
  type CustomComponent,
  type ParsedLibrary,
} from "@/components/screendraft/screendraft-components";
import type { DraftNode } from "@/components/screendraft/screendraft-schema";

export type LibraryStatus =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "saving" }
  | { kind: "error"; message: string };

async function readLibrary(projectId: number): Promise<ParsedLibrary> {
  const text = await readProjectText(projectId, LIBRARY_FILE);
  return text === null ? { ok: true, components: [] } : parseLibrary(text);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Composants custom du projet, dans `screendraft-composants.json`.
 * En mode démo (`projectId` null), ils restent en mémoire et se perdent au rechargement.
 *
 * Chaque modification relit le fichier avant de l'écrire : si la lecture au chargement
 * a échoué (accès au dossier pas encore accordé), on n'écrase jamais les composants existants.
 * Toujours déclenchée par un clic : Chrome peut redemander l'accès au dossier.
 * La bibliothèque n'est pas dans l'historique : Ctrl/⌘ + Z ne supprime pas un composant.
 */
export function useScreendraftLibrary(projectId: number | null) {
  const [components, setComponents] = useState<CustomComponent[]>([]);
  const [status, setStatus] = useState<LibraryStatus>(
    projectId === null ? { kind: "ready" } : { kind: "loading" },
  );

  useEffect(() => {
    if (projectId === null) return;
    let cancelled = false;
    readLibrary(projectId)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setComponents(result.components);
          setStatus({ kind: "ready" });
        } else {
          setStatus({ kind: "error", message: result.error });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setStatus({ kind: "error", message: errorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Copie à jour de la liste, pour le mode démo où rien n'est relu depuis le disque.
  const componentsRef = useRef(components);
  useEffect(() => {
    componentsRef.current = components;
  }, [components]);

  /** Applique `change` et l'enregistre. Renvoie false si rien n'a pu être enregistré. */
  const update = useCallback(
    async (change: (current: CustomComponent[]) => CustomComponent[]): Promise<boolean> => {
      if (projectId === null) {
        const next = change(componentsRef.current);
        componentsRef.current = next;
        setComponents(next);
        return true;
      }
      setStatus({ kind: "saving" });
      try {
        const current = await readLibrary(projectId);
        if (!current.ok) {
          setStatus({ kind: "error", message: current.error });
          return false;
        }
        const next = change(current.components);
        await writeProjectFile(projectId, LIBRARY_FILE, serializeLibrary(next));
        setComponents(next);
        setStatus({ kind: "ready" });
        return true;
      } catch (error) {
        setStatus({ kind: "error", message: errorMessage(error) });
        return false;
      }
    },
    [projectId],
  );

  /** Renvoie le composant créé, ou null s'il n'a pas pu être enregistré. */
  const add = useCallback(
    async (name: string, node: DraftNode): Promise<CustomComponent | null> => {
      const component = createComponent(name, node);
      return (await update((current) => [...current, component])) ? component : null;
    },
    [update],
  );
  const rename = useCallback(
    (id: string, name: string) =>
      update((current) => current.map((item) => (item.id === id ? { ...item, name } : item))),
    [update],
  );
  /**
   * Remplace le contenu du composant par celui de `node` (une de ses instances).
   * Renvoie le composant mis à jour, ou null s'il n'existe plus ou n'a pas pu être enregistré.
   */
  const updateContent = useCallback(
    async (id: string, node: DraftNode): Promise<CustomComponent | null> => {
      let updated: CustomComponent | null = null;
      const saved = await update((current) =>
        current.map((item) => {
          if (item.id !== id) return item;
          updated = { ...item, node: toComponentContent(node) };
          return updated;
        }),
      );
      return saved ? updated : null;
    },
    [update],
  );
  const remove = useCallback(
    (id: string) => update((current) => current.filter((item) => item.id !== id)),
    [update],
  );

  return { components, status, add, rename, updateContent, remove };
}
