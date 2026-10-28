import { useCallback, useState } from "react";
import { writeProjectFile } from "@/lib/project-fs";
import { MAQUETTE_FILE, serializeMaquette } from "@/components/screendraft/screendraft-file";
import type { Maquette } from "@/components/screendraft/screendraft-schema";

export type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string };

/**
 * Enregistrement de la maquette dans le dossier du projet (`maquette.json`).
 * Toujours déclenché par l'utilisateur (clic ou Ctrl/⌘ + S) : Chrome peut redemander
 * l'accès au dossier, ce qui exige un geste. `savedDraft` sert à repérer les modifications.
 * `save` indique si l'écriture a réussi, pour enchaîner (ex. passer à l'outil suivant).
 */
export function useScreendraftSave(projectId: number | null, initialDraft: Maquette) {
  const [savedDraft, setSavedDraft] = useState(initialDraft);
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });

  const save = useCallback(
    async (draft: Maquette): Promise<boolean> => {
      if (projectId === null) return false;
      setStatus({ kind: "saving" });
      try {
        await writeProjectFile(projectId, MAQUETTE_FILE, serializeMaquette(draft));
        setSavedDraft(draft);
        setStatus({ kind: "saved", at: new Date() });
        return true;
      } catch (error) {
        setStatus({ kind: "error", message: error instanceof Error ? error.message : String(error) });
        return false;
      }
    },
    [projectId],
  );

  return { save, status, savedDraft };
}
