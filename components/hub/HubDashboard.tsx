"use client";

import { useCallback, useEffect, useState } from "react";
import { createProject, EXPECTED_DATA_DIR, listProjects, useProjectFolder } from "@/lib/project-fs";
import { HubProjectCard } from "@/components/hub/HubProjectCard";

const primaryButton =
  "rounded-full bg-linear-to-r from-orange-500 via-pink-500 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/25 transition-all hover:brightness-110 disabled:opacity-50";
const secondaryButton =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10";
const codeChip = "rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-zinc-200";

function HubNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col items-start gap-4 rounded-2xl border border-white/10 bg-white/3 p-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function ExpectedDirHint() {
  if (!EXPECTED_DATA_DIR) return null;
  return (
    <p className="text-sm text-zinc-400">
      Dossier attendu : <code className={codeChip}>{EXPECTED_DATA_DIR}</code>
    </p>
  );
}

function HubProjectList({ folderName, onChangeFolder }: { folderName: string; onChangeFolder: () => void }) {
  const [projects, setProjects] = useState<number[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setProjects(await listProjects());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    listProjects().then(
      (next) => !cancelled && setProjects(next),
      (e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      await createProject();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Projets</h2>
          <p className="text-sm text-zinc-400">
            Dossier de travail : <code className={codeChip}>{folderName}</code>
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onChangeFolder} className={secondaryButton}>
            Changer de dossier
          </button>
          <button type="button" onClick={handleCreate} disabled={creating} className={primaryButton}>
            {creating ? "Création…" : "+ Nouveau projet"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {projects === null ? (
        <p className="text-sm text-zinc-500">Chargement des projets…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-zinc-500">
          Aucun projet. Créez-en un pour commencer.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.toReversed().map((id) => (
            <HubProjectCard key={id} projectId={id} />
          ))}
        </div>
      )}
    </div>
  );
}

export function HubDashboard() {
  const { status, pickFolder, requestAccess } = useProjectFolder();

  if (status === null) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  switch (status.state) {
    case "unsupported":
      return (
        <HubNotice title="Navigateur non compatible">
          <p className="text-sm text-zinc-400">
            FactorySuite enregistre les fichiers directement dans un dossier de votre ordinateur, ce qui
            nécessite Chrome ou Edge (File System Access API).
          </p>
        </HubNotice>
      );
    case "no-folder":
      return (
        <HubNotice title="Choisir le dossier de travail">
          <p className="text-sm text-zinc-400">
            Tous les outils enregistrent leurs fichiers dans ce dossier, dans un sous-dossier par projet.
          </p>
          <ExpectedDirHint />
          <button type="button" onClick={pickFolder} className={primaryButton}>
            Choisir le dossier
          </button>
        </HubNotice>
      );
    case "needs-permission":
      return (
        <HubNotice title="Autoriser l'accès au dossier">
          <p className="text-sm text-zinc-400">
            Le navigateur demande de confirmer l&apos;accès à <code className={codeChip}>{status.folderName}</code>.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={requestAccess} className={primaryButton}>
              Autoriser
            </button>
            <button type="button" onClick={pickFolder} className={secondaryButton}>
              Choisir un autre dossier
            </button>
          </div>
        </HubNotice>
      );
    case "ready":
      return <HubProjectList key={status.folderName} folderName={status.folderName} onChangeFolder={pickFolder} />;
  }
}
