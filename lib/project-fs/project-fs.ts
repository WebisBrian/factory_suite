import { clearRootHandle, loadRootHandle, saveRootHandle } from "@/lib/project-fs/handle-store";

/** Dossier de travail attendu, défini au build via NEXT_PUBLIC_FACTORY_DATA_DIR (indicatif). */
export const EXPECTED_DATA_DIR = process.env.NEXT_PUBLIC_FACTORY_DATA_DIR ?? "";

export type ProjectFsErrorCode =
  | "unsupported" // navigateur sans File System Access API (Firefox, Safari)
  | "no-folder" // aucun dossier de travail choisi dans le Hub
  | "permission-denied" // l'utilisateur a refusé l'accès au dossier
  | "invalid-project-id"
  | "invalid-filename"
  | "project-not-found"
  | "version-not-found"; // version d'historique inconnue ou supprimée

export class ProjectFsError extends Error {
  constructor(
    readonly code: ProjectFsErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProjectFsError";
  }
}

export type FolderStatus =
  | { state: "unsupported" }
  | { state: "no-folder" }
  | { state: "needs-permission"; folderName: string }
  | { state: "ready"; folderName: string };

export interface ProjectFileInfo {
  name: string;
  size: number;
  lastModified: number;
}

export type ProjectFileContent = string | Blob | ArrayBuffer;

export interface ProjectInfo {
  id: number;
  /** Nom choisi par l'utilisateur ; l'id reste l'identifiant technique (URL, dossier). */
  name: string;
}

const PROJECT_DIR_PATTERN = /^[1-9]\d*$/;
const PERMISSION = { mode: "readwrite" } as const;
/** Métadonnées du projet, gérées par le Hub. Commence par "." : inaccessible via writeProjectFile. */
const META_FILENAME = ".factorysuite.json";
const PROJECT_NAME_MAX_LENGTH = 80;

interface ProjectMeta {
  name: string;
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

/** Convertit la valeur du query param `project_id` en entier, ou null si invalide. */
export function parseProjectId(value: string | null | undefined): number | null {
  if (!value || !PROJECT_DIR_PATTERN.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function assertProjectId(projectId: number): void {
  if (!Number.isSafeInteger(projectId) || projectId < 1) {
    throw new ProjectFsError("invalid-project-id", `project_id invalide : ${projectId}`);
  }
}

function assertFilename(filename: string): void {
  const valid =
    filename.length > 0 &&
    filename.length <= 255 &&
    !filename.startsWith(".") &&
    !/[\\/:*?"<>|\u0000-\u001f]/.test(filename);
  if (!valid) {
    throw new ProjectFsError("invalid-filename", `Nom de fichier invalide : "${filename}"`);
  }
}

async function getStoredRoot(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) return null;
  return loadRootHandle();
}

export async function getFolderStatus(): Promise<FolderStatus> {
  if (!isFileSystemAccessSupported()) return { state: "unsupported" };
  const root = await loadRootHandle();
  if (!root) return { state: "no-folder" };
  const permission = await root.queryPermission(PERMISSION);
  return permission === "granted"
    ? { state: "ready", folderName: root.name }
    : { state: "needs-permission", folderName: root.name };
}

/** Ouvre le sélecteur de dossier (doit être appelé depuis un clic utilisateur). */
export async function pickDataFolder(): Promise<FileSystemDirectoryHandle> {
  if (!isFileSystemAccessSupported() || !window.showDirectoryPicker) {
    throw new ProjectFsError("unsupported", "Ce navigateur ne permet pas d'écrire dans un dossier. Utilisez Chrome ou Edge.");
  }
  const handle = await window.showDirectoryPicker({ id: "factorysuite-data", mode: "readwrite" });
  await saveRootHandle(handle);
  return handle;
}

export async function forgetDataFolder(): Promise<void> {
  await clearRootHandle();
}

/**
 * Redemande l'accès au dossier déjà choisi. Le navigateur affiche une invite si
 * nécessaire, ce qui exige un geste utilisateur (clic) récent.
 */
export async function requestFolderAccess(): Promise<boolean> {
  const root = await getStoredRoot();
  if (!root) return false;
  if ((await root.queryPermission(PERMISSION)) === "granted") return true;
  return (await root.requestPermission(PERMISSION)) === "granted";
}

async function getRoot(): Promise<FileSystemDirectoryHandle> {
  if (!isFileSystemAccessSupported()) {
    throw new ProjectFsError("unsupported", "Ce navigateur ne permet pas d'écrire dans un dossier. Utilisez Chrome ou Edge.");
  }
  const root = await loadRootHandle();
  if (!root) {
    throw new ProjectFsError("no-folder", "Aucun dossier de travail : choisissez-le depuis le Hub.");
  }
  if ((await root.queryPermission(PERMISSION)) !== "granted") {
    // Fonctionne si on est encore dans le contexte d'un clic utilisateur.
    const permission = await root.requestPermission(PERMISSION).catch(() => "denied" as const);
    if (permission !== "granted") {
      throw new ProjectFsError("permission-denied", `Accès refusé au dossier "${root.name}".`);
    }
  }
  return root;
}

async function getProjectDir(projectId: number, create: boolean): Promise<FileSystemDirectoryHandle> {
  assertProjectId(projectId);
  const root = await getRoot();
  try {
    return await root.getDirectoryHandle(String(projectId), { create });
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") {
      throw new ProjectFsError("project-not-found", `Le projet ${projectId} n'existe pas.`);
    }
    throw error;
  }
}

function defaultProjectName(projectId: number): string {
  return `Projet ${projectId}`;
}

function normalizeProjectName(name: string): string {
  return name.trim().slice(0, PROJECT_NAME_MAX_LENGTH);
}

async function readProjectName(dir: FileSystemDirectoryHandle, projectId: number): Promise<string> {
  try {
    const file = await (await dir.getFileHandle(META_FILENAME)).getFile();
    const meta: unknown = JSON.parse(await file.text());
    if (typeof meta === "object" && meta !== null && "name" in meta && typeof meta.name === "string") {
      const name = normalizeProjectName(meta.name);
      if (name) return name;
    }
  } catch {
    // Fichier absent ou illisible : nom par défaut.
  }
  return defaultProjectName(projectId);
}

async function writeProjectMeta(dir: FileSystemDirectoryHandle, meta: ProjectMeta): Promise<void> {
  const writable = await (await dir.getFileHandle(META_FILENAME, { create: true })).createWritable();
  try {
    await writable.write(JSON.stringify(meta, null, 2));
  } finally {
    await writable.close();
  }
}

async function listProjectIds(root: FileSystemDirectoryHandle): Promise<number[]> {
  const ids: number[] = [];
  for await (const [name, handle] of root.entries()) {
    const id = handle.kind === "directory" ? parseProjectId(name) : null;
    if (id !== null) ids.push(id);
  }
  return ids.sort((a, b) => a - b);
}

/** Liste les projets (sous-dossiers numérotés du dossier de travail), triés par id. */
export async function listProjects(): Promise<ProjectInfo[]> {
  const root = await getRoot();
  const ids = await listProjectIds(root);
  return Promise.all(
    ids.map(async (id) => ({ id, name: await readProjectName(await root.getDirectoryHandle(String(id)), id) })),
  );
}

/** Nom du projet (ou "Projet N" s'il n'en a pas). */
export async function getProjectName(projectId: number): Promise<string> {
  return readProjectName(await getProjectDir(projectId, false), projectId);
}

/** Crée le dossier du prochain projet (id max + 1) avec un nom, et renvoie son id. */
export async function createProject(name = ""): Promise<number> {
  const root = await getRoot();
  const nextId = ((await listProjectIds(root)).at(-1) ?? 0) + 1;
  const dir = await getProjectDir(nextId, true);
  await writeProjectMeta(dir, { name: normalizeProjectName(name) || defaultProjectName(nextId) });
  return nextId;
}

/** Renomme un projet. L'id (et donc le dossier et les URLs) ne change pas. */
export async function renameProject(projectId: number, name: string): Promise<void> {
  const dir = await getProjectDir(projectId, false);
  await writeProjectMeta(dir, { name: normalizeProjectName(name) || defaultProjectName(projectId) });
}

/** Supprime définitivement le dossier du projet et tous ses fichiers, sur le disque. */
export async function deleteProject(projectId: number): Promise<void> {
  assertProjectId(projectId);
  const root = await getRoot();
  try {
    await root.removeEntry(String(projectId), { recursive: true });
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") {
      throw new ProjectFsError("project-not-found", `Le projet ${projectId} n'existe pas.`);
    }
    throw error;
  }
}

/** Fichiers du projet, hors fichiers cachés (métadonnées du Hub). */
export async function listProjectFiles(projectId: number): Promise<ProjectFileInfo[]> {
  const dir = await getProjectDir(projectId, false);
  const files: ProjectFileInfo[] = [];
  for await (const handle of dir.values()) {
    if (handle.kind !== "file" || handle.name.startsWith(".")) continue;
    const file = await (handle as FileSystemFileHandle).getFile();
    files.push({ name: file.name, size: file.size, lastModified: file.lastModified });
  }
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

async function writeHandle(handle: FileSystemFileHandle, content: ProjectFileContent): Promise<void> {
  const writable = await handle.createWritable();
  try {
    await writable.write(content);
  } finally {
    await writable.close();
  }
}

/**
 * Écrit (ou remplace) `<dossier>/<projectId>/<filename>`. Crée le dossier du projet si besoin.
 * Chaque écriture est aussi archivée dans l'historique du projet (voir listProjectHistory).
 */
export async function writeProjectFile(
  projectId: number,
  filename: string,
  content: ProjectFileContent,
): Promise<void> {
  assertFilename(filename);
  const dir = await getProjectDir(projectId, true);
  const fileHandle = await dir.getFileHandle(filename, { create: true });

  // Fichier écrit avant l'existence de l'historique : on archive d'abord sa version actuelle.
  const historyDir = await getFileHistoryDir(dir, filename);
  if (!(await hasEntries(historyDir))) {
    const previous = await fileHandle.getFile();
    if (previous.size > 0) await saveVersion(historyDir, previous.lastModified, previous);
  }

  await writeHandle(fileHandle, content);

  try {
    await saveVersion(historyDir, Date.now(), content);
    await pruneVersions(historyDir);
  } catch (error) {
    // Le fichier est bien écrit ; un échec d'archivage ne doit pas faire échouer l'outil.
    console.warn(`Historique non enregistré pour ${filename}`, error);
  }
}

/** Lit un fichier du projet, ou renvoie null s'il n'existe pas. */
export async function readProjectFile(projectId: number, filename: string): Promise<File | null> {
  assertFilename(filename);
  const dir = await getProjectDir(projectId, false).catch((error: unknown) => {
    if (error instanceof ProjectFsError && error.code === "project-not-found") return null;
    throw error;
  });
  if (!dir) return null;
  try {
    return await (await dir.getFileHandle(filename)).getFile();
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") return null;
    throw error;
  }
}

/** Raccourci : contenu texte du fichier, ou null s'il n'existe pas. */
export async function readProjectText(projectId: number, filename: string): Promise<string | null> {
  const file = await readProjectFile(projectId, filename);
  return file ? file.text() : null;
}

/** Supprime le fichier. Son historique est conservé : il reste restaurable depuis le Hub. */
export async function deleteProjectFile(projectId: number, filename: string): Promise<void> {
  assertFilename(filename);
  const dir = await getProjectDir(projectId, false);
  await dir.removeEntry(filename);
}

// --- Historique des versions -------------------------------------------------
// <projet>/.history/<filename>/<timestamp ms> : une copie complète par écriture.

export interface FileVersion {
  filename: string;
  /** Identifiant de la version = horodatage d'enregistrement (ms depuis epoch), en texte. */
  versionId: string;
  savedAt: number;
  size: number;
}

const HISTORY_DIRNAME = ".history";
/** Versions conservées par fichier ; les plus anciennes sont supprimées au-delà. */
const MAX_VERSIONS_PER_FILE = 100;
const VERSION_ID_PATTERN = /^\d+$/;

async function findHistoryRoot(dir: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle | null> {
  try {
    return await dir.getDirectoryHandle(HISTORY_DIRNAME);
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") return null;
    throw error;
  }
}

async function getFileHistoryDir(dir: FileSystemDirectoryHandle, filename: string): Promise<FileSystemDirectoryHandle> {
  const historyRoot = await dir.getDirectoryHandle(HISTORY_DIRNAME, { create: true });
  return historyRoot.getDirectoryHandle(filename, { create: true });
}

async function hasEntries(dir: FileSystemDirectoryHandle): Promise<boolean> {
  for await (const _ of dir.keys()) return true;
  return false;
}

async function saveVersion(historyDir: FileSystemDirectoryHandle, savedAt: number, content: ProjectFileContent): Promise<void> {
  // Deux écritures dans la même milliseconde : on décale pour ne rien écraser.
  let stamp = savedAt;
  for (;;) {
    try {
      await historyDir.getFileHandle(String(stamp));
      stamp += 1;
    } catch {
      break;
    }
  }
  await writeHandle(await historyDir.getFileHandle(String(stamp), { create: true }), content);
}

async function listVersionStamps(historyDir: FileSystemDirectoryHandle): Promise<number[]> {
  const stamps: number[] = [];
  for await (const [name, handle] of historyDir.entries()) {
    if (handle.kind === "file" && VERSION_ID_PATTERN.test(name)) stamps.push(Number(name));
  }
  return stamps.sort((a, b) => a - b);
}

async function pruneVersions(historyDir: FileSystemDirectoryHandle): Promise<void> {
  const stamps = await listVersionStamps(historyDir);
  for (const stamp of stamps.slice(0, Math.max(0, stamps.length - MAX_VERSIONS_PER_FILE))) {
    await historyDir.removeEntry(String(stamp));
  }
}

/** Toutes les versions de tous les fichiers du projet, de la plus récente à la plus ancienne. */
export async function listProjectHistory(projectId: number): Promise<FileVersion[]> {
  const historyRoot = await findHistoryRoot(await getProjectDir(projectId, false));
  if (!historyRoot) return [];
  const versions: FileVersion[] = [];
  for await (const [filename, fileDir] of historyRoot.entries()) {
    if (fileDir.kind !== "directory") continue;
    for await (const [name, handle] of (fileDir as FileSystemDirectoryHandle).entries()) {
      if (handle.kind !== "file" || !VERSION_ID_PATTERN.test(name)) continue;
      const file = await (handle as FileSystemFileHandle).getFile();
      versions.push({ filename, versionId: name, savedAt: Number(name), size: file.size });
    }
  }
  return versions.sort((a, b) => b.savedAt - a.savedAt || a.filename.localeCompare(b.filename));
}

/** Contenu d'une version, ou null si elle n'existe plus. */
export async function readFileVersion(projectId: number, filename: string, versionId: string): Promise<File | null> {
  assertFilename(filename);
  if (!VERSION_ID_PATTERN.test(versionId)) return null;
  const historyRoot = await findHistoryRoot(await getProjectDir(projectId, false));
  if (!historyRoot) return null;
  try {
    const fileDir = await historyRoot.getDirectoryHandle(filename);
    return await (await fileDir.getFileHandle(versionId)).getFile();
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") return null;
    throw error;
  }
}

/** Remet une ancienne version en fichier courant (ce qui crée une nouvelle version). */
export async function restoreFileVersion(projectId: number, filename: string, versionId: string): Promise<void> {
  const version = await readFileVersion(projectId, filename, versionId);
  if (!version) throw new ProjectFsError("version-not-found", `Version introuvable pour "${filename}".`);
  await writeProjectFile(projectId, filename, version);
}
