"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ProjectFsError, readProjectText, useProjectId } from "@/lib/project-fs";
import { MAQUETTE_FILE, parseMaquette, type Maquette } from "@/app/codeforge/generator/_lib/maquette";
import { maquetteFixture } from "@/app/codeforge/generator/_lib/maquette-fixture";
import {
  generatorCard,
  generatorDisplay,
  generatorError,
  generatorKicker,
  generatorLink,
  generatorPaper,
  generatorPrimaryButton,
  generatorSecondaryButton,
} from "@/app/codeforge/generator/_lib/generator-styles";
import { GeneratorOutput } from "@/app/codeforge/generator/_components/GeneratorOutput";

const CHAIN = [
  { tool: "Screendraft", role: "Étape amont", file: "écrit maquette.json", current: false },
  { tool: "CodeForge", role: "Vous êtes ici", file: "maquette.json → pages HTML/CSS", current: true },
  { tool: "Animations", role: "Étape aval", file: "lit page.html", current: false },
] as const;

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
    <div className="flex flex-col gap-16">
      <header className="flex flex-col items-center gap-6 text-center">
        <p className="rounded-full bg-[#f7f7f7] px-4 py-1.5 text-sm font-medium text-[#2e2e2e] ring-1 ring-black/15">
          {projectId === null ? "Mode démo" : `Projet #${projectId}`}
        </p>
        <h1 className={`${generatorDisplay} text-5xl leading-tight tracking-tighter sm:text-6xl`}>CodeForge</h1>
        <p className="max-w-prose text-lg text-[#454545]">
          Transforme la maquette JSON de Screendraft en pages HTML/CSS, prêtes à être animées.
        </p>

        <nav aria-label="Chaîne FactorySuite" className="w-full">
          <ol className="grid gap-3 text-left sm:grid-cols-3">
            {CHAIN.map((step, index) => (
              <li
                key={step.tool}
                aria-current={step.current ? "step" : undefined}
                className={`flex flex-col gap-1 p-4 ${
                  step.current ? "rounded-lg border-2 border-[#2e2e2e] bg-[#fdfcfb]" : generatorPaper
                }`}
              >
                <span className="text-sm font-semibold text-[#454545]">
                  {index + 1}. {step.role}
                </span>
                <span className="text-xl font-medium text-[#2e2e2e]">{step.tool}</span>
                <span className="font-mono text-sm text-[#454545]">{step.file}</span>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      {projectId === null && (
        <section aria-labelledby="generator-input-title" className={`${generatorCard} p-6`}>
          <p className={generatorKicker}>Étape 1</p>
          <h2 id="generator-input-title" className={`${generatorDisplay} mt-1 text-3xl tracking-tight`}>
            Maquette d&apos;entrée
          </h2>
          <p className="mt-2 text-base text-[#454545]">
            Sans projet, la maquette de démo est utilisée. Vous pouvez aussi importer votre propre fichier.
          </p>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`mt-4 flex flex-col items-start gap-3 rounded-lg p-5 ${generatorPaper} border-2 border-dashed ${
              dragging ? "border-[#2e2e2e]" : "border-zinc-500"
            }`}
          >
            <p className="text-base text-[#2e2e2e]">
              {dragging ? "Relâchez pour importer le fichier" : "Glissez-déposez un fichier JSON de maquette ici"}
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => fileInput.current?.click()} className={generatorPrimaryButton}>
                Importer un fichier JSON
              </button>
              {imported && (
                <button type="button" onClick={() => setImported(null)} className={generatorSecondaryButton}>
                  Annuler l&apos;import
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

          {imported && !imported.ok && (
            <GeneratorErrorBox title={`${imported.fileName} n'est pas une maquette valide.`} errors={imported.errors} />
          )}
        </section>
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

      {maquette ? (
        <GeneratorOutput maquette={maquette} projectId={projectId} sourceLabel={sourceLabel} />
      ) : (
        projectId !== null &&
        projectLoad === null && (
          <p className="text-base text-[#454545]" role="status">
            Lecture de {MAQUETTE_FILE}…
          </p>
        )
      )}
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
