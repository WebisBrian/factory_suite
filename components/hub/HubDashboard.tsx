"use client";

import { useCallback, useEffect, useId, useState } from "react";
import {
  createProject,
  EXPECTED_DATA_DIR,
  listProjects,
  useProjectFolder,
  type ProjectInfo,
} from "@/lib/project-fs";
import { HubAlert, HubStatus } from "@/components/hub/HubAlert";
import { HubProjectCard } from "@/components/hub/HubProjectCard";
import { hubCard, hubCode, hubInput, hubPrimaryButton, hubSecondaryButton } from "@/components/hub/hub-styles";

function HubNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className={`flex flex-col items-start gap-4 p-6 ${hubCard}`}>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

function ExpectedDirHint() {
  if (!EXPECTED_DATA_DIR) return null;
  return (
    <p className="text-base text-zinc-300">
      Dossier attendu : <code className={hubCode}>{EXPECTED_DATA_DIR}</code>
    </p>
  );
}

function HubProjectList({ folderName, onChangeFolder }: { folderName: string; onChangeFolder: () => void }) {
  const [projects, setProjects] = useState<ProjectInfo[] | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const nameInputId = useId();

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

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    try {
      const id = await createProject(newName);
      setAnnouncement(`Projet ${newName.trim() || id} créé, numéro ${id}.`);
      setNewName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  return (
    <section aria-labelledby="hub-projects-title" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="hub-projects-title" className="text-2xl font-bold text-white">
            Projets
          </h2>
          <p className="text-base text-zinc-300">
            Dossier de travail : <code className={hubCode}>{folderName}</code>
          </p>
        </div>
        <button type="button" onClick={onChangeFolder} className={hubSecondaryButton}>
          Changer de dossier
        </button>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-2">
        <label htmlFor={nameInputId} className="text-base font-semibold text-zinc-100">
          Nom du nouveau projet <span className="font-normal text-zinc-300">(facultatif)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id={nameInputId}
            type="text"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Ex. : Site vitrine boulangerie"
            maxLength={80}
            autoComplete="off"
            className={`min-w-0 flex-1 ${hubInput}`}
          />
          <button type="submit" disabled={creating} className={hubPrimaryButton}>
            {creating ? "Création…" : "Créer le projet"}
          </button>
        </div>
      </form>

      <p role="status" className="sr-only">
        {announcement}
      </p>

      {error && <HubAlert>{error}</HubAlert>}

      {projects === null ? (
        <HubStatus>Chargement des projets…</HubStatus>
      ) : projects.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-zinc-600 p-10 text-center text-base text-zinc-300">
          Aucun projet. Créez-en un pour commencer.
        </p>
      ) : (
        <ul aria-label={`${projects.length} projet${projects.length > 1 ? "s" : ""}`} className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,26rem),1fr))] gap-4">
          {projects.toReversed().map((project) => (
            <HubProjectCard key={project.id} project={project} onChanged={load} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function HubDashboard() {
  const { status, pickFolder, requestAccess } = useProjectFolder();

  if (status === null) {
    return <HubStatus>Chargement…</HubStatus>;
  }

  switch (status.state) {
    case "unsupported":
      return (
        <HubNotice title="Navigateur non compatible">
          <p className="text-base text-zinc-300">
            FactorySuite enregistre les fichiers directement dans un dossier de votre ordinateur, ce qui
            nécessite Chrome ou Edge (File System Access API).
          </p>
        </HubNotice>
      );
    case "no-folder":
      return (
        <HubNotice title="Choisir le dossier de travail">
          <p className="text-base text-zinc-300">
            Tous les outils enregistrent leurs fichiers dans ce dossier, dans un sous-dossier par projet.
          </p>
          <ExpectedDirHint />
          <button type="button" onClick={pickFolder} className={hubPrimaryButton}>
            Choisir le dossier
          </button>
        </HubNotice>
      );
    case "needs-permission":
      return (
        <HubNotice title="Autoriser l'accès au dossier">
          <p className="text-base text-zinc-300">
            Le navigateur demande de confirmer l&apos;accès à <code className={hubCode}>{status.folderName}</code>.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={requestAccess} className={hubPrimaryButton}>
              Autoriser l&apos;accès
            </button>
            <button type="button" onClick={pickFolder} className={hubSecondaryButton}>
              Choisir un autre dossier
            </button>
          </div>
        </HubNotice>
      );
    case "ready":
      return <HubProjectList key={status.folderName} folderName={status.folderName} onChangeFolder={pickFolder} />;
  }
}
