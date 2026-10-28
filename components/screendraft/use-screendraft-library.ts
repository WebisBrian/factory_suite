import { useCallback, useEffect, useState } from "react";
import { readProjectText, writeProjectFile } from "@/lib/project-fs";
import {
  LIBRARY_FILE,
  createComponent,
  parseLibrary,
  serializeLibrary,
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

  const update = useCallback(
    async (change: (current: CustomComponent[]) => CustomComponent[]) => {
      if (projectId === null) {
        setComponents(change);
        return;
      }
      setStatus({ kind: "saving" });
      try {
        const current = await readLibrary(projectId);
        if (!current.ok) {
          setStatus({ kind: "error", message: current.error });
          return;
        }
        const next = change(current.components);
        await writeProjectFile(projectId, LIBRARY_FILE, serializeLibrary(next));
        setComponents(next);
        setStatus({ kind: "ready" });
      } catch (error) {
        setStatus({ kind: "error", message: errorMessage(error) });
      }
    },
    [projectId],
  );

  const add = useCallback(
    (name: string, node: DraftNode) => update((current) => [...current, createComponent(name, node)]),
    [update],
  );
  const rename = useCallback(
    (id: string, name: string) =>
      update((current) => current.map((item) => (item.id === id ? { ...item, name } : item))),
    [update],
  );
  const remove = useCallback(
    (id: string) => update((current) => current.filter((item) => item.id !== id)),
    [update],
  );

  return { components, status, add, rename, remove };
}
