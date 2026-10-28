import { SCHEMA_VERSION, type Frame, type Maquette } from "@/components/screendraft/screendraft-schema";

/** Fichier écrit dans le dossier du projet, lu ensuite par le Générateur. */
export const MAQUETTE_FILE = "maquette.json";

export type ParsedMaquette = { ok: true; draft: Maquette } | { ok: false; error: string };

export function serializeMaquette(draft: Maquette): string {
  return JSON.stringify(draft, null, 2);
}

/**
 * Relit un `maquette.json`. Vérifie la version et la forme générale (écrans, frame, nodes),
 * pas chaque élément : le fichier est censé avoir été écrit par Screendraft.
 * Un fichier en version 1 (un seul écran) est converti en version 2.
 */
export function parseMaquette(text: string): ParsedMaquette {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: `${MAQUETTE_FILE} n'est pas un fichier JSON valide.` };
  }
  if (looksLikeMaquetteV1(data)) return { ok: true, draft: migrateV1(data) };
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
    screens: [
      {
        id: "screen_1",
        name: "Écran 1",
        frame: { device: "desktop", width: 1440, height: 1024, backgroundColor: "#ffffff" },
        nodes: [],
      },
    ],
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
  if (!isRecord(data) || !Array.isArray(data.screens) || data.screens.length === 0) return false;
  return (
    data.schemaVersion === SCHEMA_VERSION &&
    typeof data.id === "string" &&
    typeof data.name === "string" &&
    data.screens.every(
      (screen) =>
        isRecord(screen) &&
        typeof screen.id === "string" &&
        typeof screen.name === "string" &&
        looksLikeFrame(screen.frame) &&
        Array.isArray(screen.nodes),
    )
  );
}

/** Version 1 : un seul écran, `frame` et `nodes` au premier niveau. */
type MaquetteV1 = Omit<Maquette, "schemaVersion" | "screens"> & {
  schemaVersion: 1;
  frame: Frame;
  nodes: Maquette["screens"][number]["nodes"];
};

function looksLikeMaquetteV1(data: unknown): data is MaquetteV1 {
  return (
    isRecord(data) &&
    data.schemaVersion === 1 &&
    typeof data.id === "string" &&
    typeof data.name === "string" &&
    looksLikeFrame(data.frame) &&
    Array.isArray(data.nodes)
  );
}

function migrateV1({ id, name, frame, nodes }: MaquetteV1): Maquette {
  return {
    schemaVersion: SCHEMA_VERSION,
    id,
    name,
    screens: [{ id: "screen_1", name: "Écran 1", frame, nodes }],
  };
}

function looksLikeFrame(frame: unknown): frame is Frame {
  return isRecord(frame) && typeof frame.width === "number" && typeof frame.height === "number";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
