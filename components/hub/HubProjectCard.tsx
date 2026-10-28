"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";
import { listProjectFiles, type ProjectFileInfo } from "@/lib/project-fs";
import { HubAppIcon } from "@/components/hub/HubAppIcon";
import { HUB_TOOLS, hubToolHref } from "@/components/hub/hub-tools";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });

export function HubProjectCard({ projectId }: { projectId: number }) {
  const [files, setFiles] = useState<ProjectFileInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <article className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-white/10 bg-white/3 p-5 transition-colors hover:border-white/20">
      <div className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-linear-to-br from-orange-500/20 via-pink-500/15 to-violet-600/20 blur-3xl" />

      <header className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/5 font-mono text-sm text-zinc-300 ring-1 ring-white/10">
            #{projectId}
          </span>
          <div>
            <h2 className="font-semibold text-white">Projet {projectId}</h2>
            <p className="text-xs text-zinc-500">
              {files === null ? "…" : `${files.length} fichier${files.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          Rafraîchir
        </button>
      </header>

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
        <h3 className="mb-2 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">Fichiers</h3>
        {error ? (
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
