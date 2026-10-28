// API publique du stockage projet. Les squads importent UNIQUEMENT depuis "@/lib/project-fs".
export {
  EXPECTED_DATA_DIR,
  ProjectFsError,
  createProject,
  deleteProjectFile,
  forgetDataFolder,
  getFolderStatus,
  isFileSystemAccessSupported,
  listProjectFiles,
  listProjects,
  parseProjectId,
  pickDataFolder,
  readProjectFile,
  readProjectText,
  requestFolderAccess,
  writeProjectFile,
  type FolderStatus,
  type ProjectFileContent,
  type ProjectFileInfo,
  type ProjectFsErrorCode,
} from "@/lib/project-fs/project-fs";
export { useProjectFolder, useProjectId, type ProjectFolder } from "@/lib/project-fs/hooks";
