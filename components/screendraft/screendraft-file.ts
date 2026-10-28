import { SCHEMA_VERSION, type Maquette } from "@/components/screendraft/screendraft-schema";

/** Fichier écrit dans le dossier du projet, lu ensuite par le Générateur. */
export const MAQUETTE_FILE = "maquette.json";

export type ParsedMaquette = { ok: true; draft: Maquette } | { ok: false; error: string };

export function serializeMaquette(draft: Maquette): string {
  return JSON.stringify(draft, null, 2);
}

/**
 * Relit un `maquette.json`. Vérifie la version et la forme générale (frame, nodes),
 * pas chaque élément : le fichier est censé avoir été écrit par Screendraft.
 */
export function parseMaquette(text: string): ParsedMaquette {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: `${MAQUETTE_FILE} n'est pas un fichier JSON valide.` };
  }
  if (!looksLikeMaquette(data)) {
    return {
      ok: false,
      error: `${MAQUETTE_FILE} n'est pas une maquette Screendraft (version ${SCHEMA_VERSION}).`,
    };
  }
  return { ok: true, draft: data };
}

/** Maquette de départ d'un projet qui n'a pas encore de `maquette.json`. */
export function createEmptyMaquette(projectId: number): Maquette {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: `maquette_${projectId}`,
    name: "Nouvelle maquette",
    frame: { device: "desktop", width: 1440, height: 1024, backgroundColor: "#ffffff" },
    nodes: [],
  };
}

/** Télécharge la maquette en `maquette.json`, sans passer par le dossier du projet. */
export function downloadMaquette(draft: Maquette) {
  const url = URL.createObjectURL(new Blob([serializeMaquette(draft)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = MAQUETTE_FILE;
  link.click();
  // Laisse le navigateur démarrer le téléchargement avant de libérer l'URL.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function looksLikeMaquette(data: unknown): data is Maquette {
  if (!isRecord(data) || !isRecord(data.frame)) return false;
  return (
    data.schemaVersion === SCHEMA_VERSION &&
    typeof data.id === "string" &&
    typeof data.name === "string" &&
    typeof data.frame.width === "number" &&
    typeof data.frame.height === "number" &&
    Array.isArray(data.nodes)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
