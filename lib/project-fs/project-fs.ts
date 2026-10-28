import { clearRootHandle, loadRootHandle, saveRootHandle } from "@/lib/project-fs/handle-store";

/** Dossier de travail attendu, défini au build via NEXT_PUBLIC_FACTORY_DATA_DIR (indicatif). */
export const EXPECTED_DATA_DIR = process.env.NEXT_PUBLIC_FACTORY_DATA_DIR ?? "";

export type ProjectFsErrorCode =
  | "unsupported" // navigateur sans File System Access API (Firefox, Safari)
  | "no-folder" // aucun dossier de travail choisi dans le Hub
  | "permission-denied" // l'utilisateur a refusé l'accès au dossier
  | "invalid-project-id"
  | "invalid-filename"
  | "project-not-found";

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

const PROJECT_DIR_PATTERN = /^[1-9]\d*$/;
const PERMISSION = { mode: "readwrite" } as const;

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

/** Liste les ids de projets (sous-dossiers numérotés du dossier de travail), triés. */
export async function listProjects(): Promise<number[]> {
  const root = await getRoot();
  const ids: number[] = [];
  for await (const [name, handle] of root.entries()) {
    const id = handle.kind === "directory" ? parseProjectId(name) : null;
    if (id !== null) ids.push(id);
  }
  return ids.sort((a, b) => a - b);
}

/** Crée le dossier du prochain projet (id max + 1) et renvoie son id. */
export async function createProject(): Promise<number> {
  const ids = await listProjects();
  const nextId = (ids.at(-1) ?? 0) + 1;
  await getProjectDir(nextId, true);
  return nextId;
}

export async function listProjectFiles(projectId: number): Promise<ProjectFileInfo[]> {
  const dir = await getProjectDir(projectId, false);
  const files: ProjectFileInfo[] = [];
  for await (const handle of dir.values()) {
    if (handle.kind !== "file") continue;
    const file = await (handle as FileSystemFileHandle).getFile();
    files.push({ name: file.name, size: file.size, lastModified: file.lastModified });
  }
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

/** Écrit (ou remplace) `<dossier>/<projectId>/<filename>`. Crée le dossier du projet si besoin. */
export async function writeProjectFile(
  projectId: number,
  filename: string,
  content: ProjectFileContent,
): Promise<void> {
  assertFilename(filename);
  const dir = await getProjectDir(projectId, true);
  const fileHandle = await dir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  try {
    await writable.write(content);
  } finally {
    await writable.close();
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

export async function deleteProjectFile(projectId: number, filename: string): Promise<void> {
  assertFilename(filename);
  const dir = await getProjectDir(projectId, false);
  await dir.removeEntry(filename);
}
