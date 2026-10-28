"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ProjectFsError, readProjectText, useProjectId } from "@/lib/project-fs";
import { MAQUETTE_FILE, parseMaquette, type Maquette } from "@/app/codeforge/generator/_lib/maquette";
import { maquetteFixture } from "@/app/codeforge/generator/_lib/maquette-fixture";
import {
  generatorDisplay,
  generatorError,
  generatorLink,
  generatorPaper,
  generatorPrimaryButton,
  generatorSecondaryButton,
  generatorSectionTitle,
  toolHref,
} from "@/app/codeforge/generator/_lib/generator-styles";
import { GeneratorOutput } from "@/app/codeforge/generator/_components/GeneratorOutput";

type ProjectLoad =
  | { status: "ok"; maquette: Maquette }
  | { status: "missing" }
  | { status: "invalid"; errors: string[] }
  | { status: "fs-error"; message: string };

type Imported = { fileName: string; ok: true; maquette: Maquette } | { fileName: string; ok: false; errors: string[] };

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
    setImported(
      parsed.ok
        ? { fileName: file.name, ok: true, maquette: parsed.maquette }
        : { fileName: file.name, ok: false, errors: parsed.errors },
    );
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
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        <nav aria-label="Chaîne FactorySuite">
          <ol className="flex flex-wrap items-center gap-x-2 text-sm text-[#454545]">
            <li>
              <Link
                href={toolHref("/screendraft", projectId)}
                className={`inline-flex min-h-10 items-center ${generatorLink}`}
              >
                Screendraft
              </Link>
            </li>
            <li aria-hidden>→</li>
            <li aria-current="page" className="inline-flex min-h-10 items-center font-semibold text-[#2e2e2e]">
              CodeForge
            </li>
            <li aria-hidden>→</li>
            <li>
              <Link
                href={toolHref("/animations", projectId)}
                className={`inline-flex min-h-10 items-center ${generatorLink}`}
              >
                Animations
              </Link>
            </li>
          </ol>
        </nav>
        <h1 className={`${generatorDisplay} text-5xl leading-tight tracking-tighter sm:text-6xl`}>CodeForge</h1>
        <p className="max-w-prose text-lg text-[#454545]">
          Transforme la maquette de Screendraft en pages HTML/CSS, à télécharger ou à passer aux Animations.
        </p>
      </header>

      <section aria-labelledby="generator-input-title" className="flex flex-col gap-4">
        <h2 id="generator-input-title" className={generatorSectionTitle}>
          1. Maquette
        </h2>

        {maquette && (
          <dl className={`${generatorPaper} grid gap-x-6 gap-y-3 p-5 sm:grid-cols-2 lg:grid-cols-4`}>
            <GeneratorFact label="Nom" value={maquette.name} />
            <GeneratorFact label="Source" value={sourceLabel} />
            <GeneratorFact
              label={maquette.screens.length > 1 ? "Écrans" : "Écran"}
              value={maquette.screens.map((screen) => screen.name).join(", ")}
            />
            <GeneratorFact
              label="Format"
              value={[
                ...new Set(
                  maquette.screens.map((screen) => (screen.frame.device === "desktop" ? "Desktop" : "Mobile")),
                ),
              ].join(", ")}
            />
          </dl>
        )}

        {projectId === null && (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-wrap items-center gap-4 rounded-lg border-2 border-dashed p-5 ${
              dragging ? "border-[#2e2e2e] bg-[#f0f0ea]" : "border-zinc-500"
            }`}
          >
            <p className="flex-1 text-base text-[#454545]">
              {dragging
                ? "Relâchez pour importer le fichier"
                : "Vous voyez la maquette de démo. Glissez-déposez votre fichier JSON ici, ou importez-le."}
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => fileInput.current?.click()} className={generatorPrimaryButton}>
                Importer un fichier JSON
              </button>
              {imported && (
                <button type="button" onClick={() => setImported(null)} className={generatorSecondaryButton}>
                  Revenir à la démo
                </button>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {imported && !imported.ok && (
          <GeneratorErrorBox title={`${imported.fileName} n'est pas une maquette valide.`} errors={imported.errors} />
        )}
        {projectId !== null && projectLoad && projectLoad.status !== "ok" && (
          <GeneratorErrorBox
            title={
              projectLoad.status === "missing"
                ? `${MAQUETTE_FILE} introuvable dans le projet ${projectId} : passez d'abord par Screendraft.`
                : projectLoad.status === "invalid"
                  ? `${MAQUETTE_FILE} du projet ${projectId} n'est pas une maquette valide.`
                  : projectLoad.message
            }
            errors={projectLoad.status === "invalid" ? projectLoad.errors : []}
            onRetry={handleReloadFromProject}
          />
        )}

        {!maquette && projectId !== null && projectLoad === null && (
          <p className="text-base text-[#454545]" role="status">
            Lecture de {MAQUETTE_FILE}…
          </p>
        )}
      </section>

      {maquette && <GeneratorOutput maquette={maquette} projectId={projectId} />}
    </div>
  );
}

function GeneratorFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-[#454545]">{label}</dt>
      <dd className="mt-0.5 text-base text-[#2e2e2e]">{value}</dd>
    </div>
  );
}

function GeneratorErrorBox({ title, errors, onRetry }: { title: string; errors: string[]; onRetry?: () => void }) {
  return (
    <div role="alert" className={`mt-4 ${generatorError}`}>
      <p className="font-semibold">Erreur : {title}</p>
      {errors.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-sm">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex gap-4">
        {onRetry && (
          <button type="button" onClick={onRetry} className={`min-h-10 ${generatorLink}`}>
            Réessayer
          </button>
        )}
        <Link href="/" className={`inline-flex min-h-10 items-center ${generatorLink}`}>
          Retour au Hub
        </Link>
      </div>
    </div>
  );
}
