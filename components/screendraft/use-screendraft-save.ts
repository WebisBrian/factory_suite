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
  /** `note` : avertissement qui n'empêche pas l'enregistrement (ex. pages HTML non générées). */
  | { kind: "saved"; at: Date; note?: string }
  | { kind: "error"; message: string };

/** Éléments que le générateur HTML/CSS sait produire (les autres, comme carte et carrousel, en sont exclus). */
const GENERATED_TYPES: ReadonlySet<string> = new Set(["section", "title", "text", "image", "button", "shape", "video"]);

type JsonNode = { type?: unknown; children?: unknown };

/** Retire récursivement les éléments non pris en charge ; renvoie le JSON à générer et les types retirés. */
function generatableJson(json: string): { json: string; skipped: string[] } {
  const skipped = new Set<string>();
  const keep = (nodes: unknown): unknown =>
    Array.isArray(nodes)
      ? nodes
          .filter((node: JsonNode) => {
            const supported = typeof node.type === "string" && GENERATED_TYPES.has(node.type);
            if (!supported) skipped.add(String(node.type));
            return supported;
          })
          .map((node: JsonNode) => (node.children ? { ...node, children: keep(node.children) } : node))
      : nodes;
  const data = JSON.parse(json) as { screens?: { nodes?: unknown }[] };
  data.screens = data.screens?.map((screen) => ({ ...screen, nodes: keep(screen.nodes) }));
  return { json: JSON.stringify(data), skipped: [...skipped] };
}

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
        setSavedDraft(draft);
        // La maquette est enregistrée : un échec de génération est un avertissement, pas une erreur d'enregistrement.
        let note: string | undefined;
        try {
          const generatable = generatableJson(json);
          const parsed = parseMaquette(generatable.json);
          if (!parsed.ok) throw new Error(parsed.errors.join(" ; "));
          for (const file of projectFiles(generateSite(parsed.maquette))) {
            await writeProjectFile(projectId, file.name, file.content);
          }
          if (generatable.skipped.length > 0) {
            note = `absents de la page générée : ${generatable.skipped.join(", ")}`;
          }
        } catch (error) {
          note = `pages HTML non générées (${error instanceof Error ? error.message : String(error)})`;
        }
        setStatus({ kind: "saved", at: new Date(), note });
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
