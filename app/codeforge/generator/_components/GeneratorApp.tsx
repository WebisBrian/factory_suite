"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ProjectFsError, readProjectText, useProjectId } from "@/lib/project-fs";
import { MAQUETTE_FILE, parseMaquette, type Maquette } from "@/app/codeforge/generator/_lib/maquette";
import { maquetteFixture } from "@/app/codeforge/generator/_lib/maquette-fixture";
import { GeneratorOutput } from "@/app/codeforge/generator/_components/GeneratorOutput";

type ProjectLoad =
  | { status: "ok"; maquette: Maquette }
  | { status: "missing" }
  | { status: "invalid"; errors: string[] }
  | { status: "fs-error"; message: string };

type Imported =
  | { fileName: string; ok: true; maquette: Maquette }
  | { fileName: string; ok: false; errors: string[] };

async function loadProjectMaquette(projectId: number): Promise<ProjectLoad> {
  try {
    const text = await readProjectText(projectId, MAQUETTE_FILE);
    if (text === null) return { status: "missing" };
    const parsed = parseMaquette(text);
    return parsed.ok ? { status: "ok", maquette: parsed.maquette } : { status: "invalid", errors: parsed.errors };
  } catch (e) {
    const message = e instanceof ProjectFsError || e instanceof Error ? e.message : String(e);
    return { status: "fs-error", message };
  }
}

export function GeneratorApp() {
  const projectId = useProjectId();
  const [projectLoad, setProjectLoad] = useState<ProjectLoad | null>(null);
  const [imported, setImported] = useState<Imported | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Chargement initial du fichier du projet (si l'accès est déjà accordé).
  useEffect(() => {
    if (projectId === null) return;
    let cancelled = false;
    loadProjectMaquette(projectId).then((next) => {
      if (!cancelled) setProjectLoad(next);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Priorité : fichier importé à la main, puis fichier du projet, puis fixture en mode démo.
  let maquette: Maquette | null = null;
  let sourceLabel = "";
  if (imported?.ok) {
    maquette = imported.maquette;
    sourceLabel = `Fichier importé : ${imported.fileName}`;
  } else if (projectId === null) {
    maquette = maquetteFixture;
    sourceLabel = "Maquette de démo (fixture)";
  } else if (projectLoad?.status === "ok") {
    maquette = projectLoad.maquette;
    sourceLabel = `${MAQUETTE_FILE} du projet #${projectId}`;
  }

  // Relance depuis un clic : déclenche l'invite d'autorisation si besoin.
  async function handleReloadFromProject() {
    if (projectId === null) return;
    setImported(null);
    setProjectLoad(await loadProjectMaquette(projectId));
  }

  async function receiveFile(file: File) {
    const parsed = parseMaquette(await file.text());
    setImported(parsed.ok ? { fileName: file.name, ok: true, maquette: parsed.maquette } : { fileName: file.name, ok: false, errors: parsed.errors });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void receiveFile(file);
    // Permet de réimporter le même fichier après une correction.
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void receiveFile(file);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Générateur</h1>
          <p className="text-sm text-zinc-400">
            Transmettez la maquette JSON produite par Screendraft pour la convertir en HTML/CSS.
          </p>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
          {projectId === null ? "Mode démo" : `Projet #${projectId}`}
        </span>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/3 p-5">
        <h2 className="text-base font-semibold text-zinc-100">Maquette d&apos;entrée</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {projectId === null ? (
            <>Sans projet, la maquette de démo est utilisée. Vous pouvez aussi importer votre propre fichier.</>
          ) : (
            <>
              Le Générateur lit{" "}
              <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-zinc-200">{MAQUETTE_FILE}</code> dans le
              projet. Vous pouvez aussi importer un fichier à la main.
            </>
          )}
        </p>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-8 text-center transition-colors ${
            dragging ? "border-emerald-400 bg-emerald-500/10" : "border-white/15 bg-black/20"
          }`}
        >
          <p className="text-sm text-zinc-300">Glissez-déposez un fichier JSON de maquette ici</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
            >
              Importer un fichier JSON
            </button>
            {projectId !== null && (
              <button
                type="button"
                onClick={handleReloadFromProject}
                className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10"
              >
                Charger {MAQUETTE_FILE} du projet
              </button>
            )}
            {imported && (
              <button
                type="button"
                onClick={() => setImported(null)}
                className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10"
              >
                Annuler l&apos;import
              </button>
            )}
          </div>
          <input ref={fileInput} type="file" accept=".json,application/json" onChange={handleFileChange} className="hidden" />
        </div>

        {imported && !imported.ok && (
          <GeneratorErrorBox title={`${imported.fileName} n'est pas une maquette valide.`} errors={imported.errors} />
        )}

        {!imported?.ok && projectId !== null && projectLoad && projectLoad.status !== "ok" && (
          <GeneratorErrorBox
            title={
              projectLoad.status === "missing"
                ? `${MAQUETTE_FILE} introuvable dans le projet ${projectId} : passez d'abord par Screendraft, ou importez un fichier.`
                : projectLoad.status === "invalid"
                  ? `${MAQUETTE_FILE} du projet ${projectId} n'est pas une maquette valide.`
                  : projectLoad.message
            }
            errors={projectLoad.status === "invalid" ? projectLoad.errors : []}
            onRetry={handleReloadFromProject}
          />
        )}
      </section>

      {maquette ? (
        <GeneratorOutput maquette={maquette} projectId={projectId} sourceLabel={sourceLabel} />
      ) : (
        projectId !== null &&
        projectLoad === null && <p className="text-base text-zinc-300" role="status">Lecture de {MAQUETTE_FILE}…</p>
      )}
    </div>
  );
}

function GeneratorErrorBox({ title, errors, onRetry }: { title: string; errors: string[]; onRetry?: () => void }) {
  return (
    <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
      <p>{title}</p>
      {errors.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 font-mono text-sm text-red-200">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex gap-4">
        {onRetry && (
          <button type="button" onClick={onRetry} className="underline">
            Réessayer
          </button>
        )}
        <Link href="/" className="underline">
          Retour au Hub
        </Link>
      </div>
    </div>
  );
}
