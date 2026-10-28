"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import {
  deleteProject,
  listProjectFiles,
  renameProject,
  type ProjectFileInfo,
  type ProjectInfo,
} from "@/lib/project-fs";
import { HubAlert, HubStatus } from "@/components/hub/HubAlert";
import { HubAppIcon } from "@/components/hub/HubAppIcon";
import { HubProjectCommunication } from "@/components/hub/HubProjectCommunication";
import { HubProjectHistory } from "@/components/hub/HubProjectHistory";
import { onHubProjectsChanged } from "@/components/hub/hub-project-events";
import {
  hubCard,
  hubDangerButton,
  hubInput,
  hubSectionLabel,
  hubSmallButton,
} from "@/components/hub/hub-styles";
import { HUB_TOOLS, hubToolHref } from "@/components/hub/hub-tools";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });

type Panel = "files" | "history" | "communication";

const PANEL_LABELS: Record<Panel, string> = { files: "Fichiers", history: "Historique", communication: "Communication" };

export function HubProjectCard({ project, onChanged }: { project: ProjectInfo; onChanged: () => Promise<void> }) {
  const projectId = project.id;
  const [files, setFiles] = useState<ProjectFileInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftName, setDraftName] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState<Panel>("files");
  const titleId = useId();
  const renameId = useId();
  const deleteTextId = useId();

  const load = useCallback(async () => {
    try {
      setFiles(await listProjectFiles(projectId));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [projectId]);

  // Action faite par l'assistant (ex. restauration d'une version) : on recharge.
  useEffect(() => onHubProjectsChanged(() => void load()), [load]);

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

  const fileCount = files === null ? null : `${files.length} fichier${files.length > 1 ? "s" : ""}`;

  return (
    <li
      aria-labelledby={titleId}
      className={`relative flex flex-col gap-5 p-5 ${hubCard} ${panel !== "files" ? "lg:col-span-2" : ""}`}
    >
      <header className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span
            title="Numéro du projet (utilisé dans les adresses et le nom du dossier)"
            className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-500 px-2 font-mono text-base text-zinc-100"
          >
            <span className="sr-only">Projet numéro </span>
            {projectId}
          </span>
          {draftName === null ? (
            <div className="min-w-0">
              <h3 id={titleId} className="text-xl font-bold break-words text-white">
                {project.name}
              </h3>
              <p className="text-sm text-zinc-300">{fileCount ?? "…"}</p>
            </div>
          ) : (
            <form onSubmit={handleRename} className="flex min-w-0 flex-1 flex-col gap-2">
              <label htmlFor={renameId} id={titleId} className="text-base font-semibold text-zinc-100">
                Nouveau nom du projet {projectId}
              </label>
              <input
                id={renameId}
                type="text"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onKeyDown={(event) => event.key === "Escape" && setDraftName(null)}
                maxLength={80}
                autoFocus
                autoComplete="off"
                className={hubInput}
              />
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={busy} className={hubSmallButton}>
                  Enregistrer le nom
                </button>
                <button type="button" onClick={() => setDraftName(null)} className={hubSmallButton}>
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>

        {draftName === null && !confirmingDelete && (
          <div role="group" aria-label={`Actions sur le projet ${project.name}`} className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDraftName(project.name)}
              aria-label={`Renommer le projet ${project.name}`}
              className={hubSmallButton}
            >
              Renommer
            </button>
            <button
              type="button"
              onClick={load}
              aria-label={`Rafraîchir la liste des fichiers du projet ${project.name}`}
              className={hubSmallButton}
            >
              Rafraîchir
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              aria-label={`Supprimer le projet ${project.name}`}
              className={`${hubSmallButton} hover:border-red-300 hover:bg-red-950`}
            >
              Supprimer…
            </button>
          </div>
        )}
      </header>

      {confirmingDelete && (
        <div
          role="group"
          aria-labelledby={deleteTextId}
          className="flex flex-col gap-3 rounded-xl border-2 border-red-400 bg-red-950/60 p-4 text-base text-red-50"
        >
          <p id={deleteTextId}>
            <strong>Attention :</strong> supprimer « {project.name} » et ses {files?.length ?? 0} fichier(s) du
            disque ? Cette action est définitive.
          </p>
          <div className="flex flex-wrap gap-2">
            {/* Focus sur « Annuler » : le choix sans risque est celui par défaut. */}
            <button type="button" onClick={() => setConfirmingDelete(false)} autoFocus className={hubSmallButton}>
              Annuler
            </button>
            <button type="button" onClick={handleDelete} disabled={busy} className={hubDangerButton}>
              {busy ? "Suppression…" : "Supprimer définitivement"}
            </button>
          </div>
        </div>
      )}

      <nav aria-label={`Ouvrir le projet ${project.name} dans un outil`}>
        {/* Colonnes d'au moins 13rem : les noms d'outils ne sont jamais coupés en plein mot, même à 200 %. */}
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-2">
          {HUB_TOOLS.map((tool, index) => (
            <li key={tool.slug}>
              <Link
                href={hubToolHref(tool, projectId)}
                aria-label={`Étape ${index + 1} : ouvrir ${tool.label} (${tool.description}) pour le projet ${project.name}`}
                className={`flex h-full items-center gap-3 rounded-xl border border-zinc-500 p-3 transition-all motion-safe:hover:-translate-y-0.5 ${tool.theme.hover}`}
              >
                <HubAppIcon tool={tool} />
                <span className="flex min-w-0 flex-col">
                  <span className="text-base font-bold break-words text-white">
                    {index + 1}. {tool.label}
                  </span>
                  <span className="text-sm break-words text-zinc-300">{tool.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <section aria-label={`${PANEL_LABELS[panel]} du projet ${project.name}`}>
        <div role="group" aria-label="Affichage" className="mb-3 flex flex-wrap gap-2">
          {(["files", "history", "communication"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPanel(tab)}
              aria-pressed={panel === tab}
              // Onglet actif : souligné épais + gras + fond (pas seulement une couleur).
              className={`min-h-10 rounded-lg px-3 ${hubSectionLabel} ${
                panel === tab
                  ? "bg-white/15 text-white underline decoration-4 underline-offset-8"
                  : "text-zinc-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {PANEL_LABELS[tab]}
            </button>
          ))}
        </div>
        {panel === "history" ? (
          <HubProjectHistory projectId={projectId} onRestored={load} />
        ) : panel === "communication" ? (
          <HubProjectCommunication projectId={projectId} projectName={project.name} onSaved={load} />
        ) : error ? (
          <HubAlert>{error}</HubAlert>
        ) : files === null ? (
          <HubStatus>Chargement des fichiers…</HubStatus>
        ) : files.length === 0 ? (
          <p className="text-base text-zinc-300">Aucun fichier pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-zinc-700 rounded-xl border border-zinc-700 text-base">
            {files.map((file) => (
              <li key={file.name} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2">
                <span className="font-mono break-all text-zinc-100">{file.name}</span>
                <span className="text-sm text-zinc-300">
                  {formatSize(file.size)}, modifié le {dateFormat.format(file.lastModified)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </li>
  );
}
