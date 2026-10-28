"use client";

import { writeProjectFile, useProjectId } from "@/lib/project-fs";
import type { ScreenDraftDocument } from "@/app/screen-draft/_lib/schema";

export function ScreenDraftSaveButton({ document }: { document: ScreenDraftDocument }) {
  const projectId = useProjectId();
  return <button type="button" onClick={() => projectId === null ? undefined : writeProjectFile(projectId, "maquette.json", JSON.stringify(document, null, 2))} className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/10">Enregistrer</button>;
}
