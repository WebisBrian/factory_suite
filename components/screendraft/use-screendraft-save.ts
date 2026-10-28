import { useCallback, useState } from "react";
import { writeProjectFile } from "@/lib/project-fs";
// Génération HTML/CSS (ex-étape CodeForge) : la logique reste dans app/codeforge/generator/_lib, sans interface.
import { generateSite } from "@/app/codeforge/generator/_lib/generate-html";
import { projectFiles } from "@/app/codeforge/generator/_lib/export-site";
import { parseMaquette } from "@/app/codeforge/generator/_lib/maquette";
import { MAQUETTE_FILE, serializeMaquette } from "@/components/screendraft/screendraft-file";
import type { Maquette } from "@/components/screendraft/screendraft-schema";

export type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string };

/**
 * Enregistrement de la maquette dans le dossier du projet (`maquette.json`).
 * Chaque enregistrement génère aussi les pages HTML/CSS (une par écran + page.html) pour l'étape suivante.
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
        const json = serializeMaquette(draft);
        await writeProjectFile(projectId, MAQUETTE_FILE, json);
        const parsed = parseMaquette(json);
        if (!parsed.ok) throw new Error(`Maquette enregistrée, mais pages non générées : ${parsed.errors.join(" ; ")}`);
        for (const file of projectFiles(generateSite(parsed.maquette))) {
          await writeProjectFile(projectId, file.name, file.content);
        }
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
