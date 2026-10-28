"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";
import {
  deleteProject,
  listProjectFiles,
  renameProject,
  type ProjectFileInfo,
  type ProjectInfo,
} from "@/lib/project-fs";
import { HubAppIcon } from "@/components/hub/HubAppIcon";
import { HubProjectHistory } from "@/components/hub/HubProjectHistory";
import { HUB_TOOLS, hubToolHref } from "@/components/hub/hub-tools";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });

const ghostButton =
  "rounded-lg px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white";

export function HubProjectCard({ project, onChanged }: { project: ProjectInfo; onChanged: () => Promise<void> }) {
  const projectId = project.id;
  const [files, setFiles] = useState<ProjectFileInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftName, setDraftName] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState<"files" | "history">("files");

  const load = useCallback(async () => {
    try {
      setFiles(await listProjectFiles(projectId));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    listProjectFiles(projectId).then(
      (next) => !cancelled && setFiles(next),
      (e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function handleRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draftName === null) return;
    run(async () => {
      await renameProject(projectId, draftName);
      setDraftName(null);
      await onChanged();
    });
  }

  function handleDelete() {
    run(async () => {
      await deleteProject(projectId);
      await onChanged();
    });
  }

  return (
    <article
      className={`group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-white/10 bg-white/3 p-5 transition-colors hover:border-white/20 ${
        panel === "history" ? "lg:col-span-2" : ""
      }`}
    >
      <div className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-linear-to-br from-orange-500/20 via-pink-500/15 to-violet-600/20 blur-3xl" />

      <header className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            title="Identifiant du projet (utilisé dans les URL et le nom du dossier)"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 font-mono text-sm text-zinc-300 ring-1 ring-white/10"
          >
            #{projectId}
          </span>
          {draftName === null ? (
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-white">{project.name}</h2>
              <p className="text-xs text-zinc-500">
                {files === null ? "…" : `${files.length} fichier${files.length > 1 ? "s" : ""}`}
              </p>
            </div>
          ) : (
            <form onSubmit={handleRename} className="flex min-w-0 flex-1 gap-1.5">
              <input
                type="text"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onKeyDown={(event) => event.key === "Escape" && setDraftName(null)}
                maxLength={80}
                autoFocus
                aria-label="Nom du projet"
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-sm text-white focus:border-pink-500/60 focus:outline-none"
              />
              <button type="submit" disabled={busy} className={ghostButton}>
                OK
              </button>
              <button type="button" onClick={() => setDraftName(null)} className={ghostButton}>
                Annuler
              </button>
            </form>
          )}
        </div>
        {draftName === null && !confirmingDelete && (
          <div className="flex shrink-0 gap-0.5">
            <button type="button" onClick={() => setDraftName(project.name)} className={ghostButton}>
              Renommer
            </button>
            <button type="button" onClick={load} className={ghostButton}>
              Rafraîchir
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded-lg px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:bg-red-500/15 hover:text-red-300"
            >
              Supprimer
            </button>
          </div>
        )}
      </header>

      {confirmingDelete && (
        <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <p>
            Supprimer « {project.name} » et ses {files?.length ?? 0} fichier(s) du disque ? Action irréversible.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmingDelete(false)} className={ghostButton}>
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-400 disabled:opacity-50"
            >
              {busy ? "Suppression…" : "Supprimer définitivement"}
            </button>
          </div>
        </div>
      )}

      <div className="relative flex items-stretch gap-1.5">
        {HUB_TOOLS.map((tool, index) => (
          <Fragment key={tool.slug}>
            {index > 0 && (
              <span aria-hidden className="self-center text-zinc-600">
                →
              </span>
            )}
            <Link
              href={hubToolHref(tool, projectId)}
              className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-white/10 bg-white/3 p-2.5 shadow-lg shadow-transparent transition-all hover:-translate-y-0.5 ${tool.theme.hover}`}
            >
              <HubAppIcon tool={tool} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-white">{tool.label}</span>
                <span className="truncate text-[11px] text-zinc-500">{tool.description}</span>
              </span>
            </Link>
          </Fragment>
        ))}
      </div>

      <section className="relative">
        <div className="mb-2 flex gap-4">
          {(["files", "history"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPanel(tab)}
              className={`border-b-2 pb-0.5 text-[11px] font-medium tracking-wider uppercase transition-colors ${
                panel === tab ? "border-pink-500 text-zinc-200" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab === "files" ? "Fichiers" : "Historique"}
            </button>
          ))}
        </div>
        {panel === "history" ? (
          <HubProjectHistory projectId={projectId} onRestored={load} />
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : files === null ? (
          <p className="text-sm text-zinc-500">Chargement…</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun fichier pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-white/5 rounded-xl border border-white/5 bg-black/20 text-sm">
            {files.map((file) => (
              <li key={file.name} className="flex items-center justify-between gap-4 px-3 py-2">
                <span className="truncate font-mono text-zinc-200">{file.name}</span>
                <span className="shrink-0 text-xs text-zinc-500">
                  {formatSize(file.size)} · {dateFormat.format(file.lastModified)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
