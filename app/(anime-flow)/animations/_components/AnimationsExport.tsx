"use client";

import Link from "next/link";
import { useState } from "react";
import { writeProjectFile } from "@/lib/project-fs";
import {
  CONFIG_FILE,
  SCRIPT_FILE,
  serializeConfig,
  type AnimeFlowConfig,
} from "@/app/(anime-flow)/animations/_lib/animation-config";
import { ANIMATION_RUNTIME_JS, INTEGRATION_SNIPPET } from "@/app/(anime-flow)/animations/_lib/animation-runtime";

type ExportState =
  | { status: "saving" }
  | { status: "done"; message: string }
  | { status: "error"; message: string; showHubLink: boolean };

type Props = {
  projectId: number | null;
  config: AnimeFlowConfig;
};

const PRIMARY_BUTTON =
  "min-h-12 rounded-full bg-(--motion) px-6 text-lg font-semibold text-(--on-motion) hover:bg-(--motion-strong)";
const SECONDARY_BUTTON =
  "min-h-12 rounded-full border-2 border-(--line-strong) bg-(--surface-raised) px-6 text-lg font-semibold hover:bg-(--motion-soft)";

function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Laisser au navigateur le temps de démarrer le téléchargement avant de libérer l'URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Export pour l'intégration : le script `animations.js` et sa config `animations.json`. */
export function AnimationsExport({ projectId, config }: Props) {
  const [state, setState] = useState<ExportState | null>(null);
  const count = config.elements.length;
  const summary =
    count === 0
      ? "Aucun élément animé pour l'instant : la config sera vide."
      : `${count} élément${count > 1 ? "s" : ""} animé${count > 1 ? "s" : ""}.`;

  // Écriture depuis un clic : Chrome peut afficher l'invite d'autorisation.
  async function handleSave() {
    if (projectId === null) return;
    setState({ status: "saving" });
    try {
      await writeProjectFile(projectId, CONFIG_FILE, serializeConfig(config));
      await writeProjectFile(projectId, SCRIPT_FILE, ANIMATION_RUNTIME_JS);
      setState({
        status: "done",
        message: `${SCRIPT_FILE} et ${CONFIG_FILE} enregistrés dans le projet ${projectId}.`,
      });
    } catch (e) {
      setState({ status: "error", message: e instanceof Error ? e.message : String(e), showHubLink: true });
    }
  }

  function handleDownload() {
    try {
      downloadFile(CONFIG_FILE, serializeConfig(config), "application/json;charset=utf-8");
      downloadFile(SCRIPT_FILE, ANIMATION_RUNTIME_JS, "text/javascript;charset=utf-8");
      setState({ status: "done", message: `Téléchargement de ${SCRIPT_FILE} et ${CONFIG_FILE} lancé.` });
    } catch {
      setState({ status: "error", message: "le téléchargement a échoué. Réessayez.", showHubLink: false });
    }
  }

  return (
    <section
      aria-labelledby="animations-export-title"
      className="flex flex-col gap-4 rounded-2xl border border-(--line) bg-(--surface-raised) p-5"
    >
      <h2 id="animations-export-title" className="text-xl font-semibold">
        Exporter les animations
      </h2>
      <p className="text-lg text-(--ink-muted)">
        Deux fichiers pour l&apos;intégration : <code className="font-mono">{SCRIPT_FILE}</code> (le script qui joue
        les animations) et <code className="font-mono">{CONFIG_FILE}</code> (la liste des animations). {summary}
      </p>

      <div className="flex flex-wrap gap-3">
        {projectId !== null && (
          <button
            type="button"
            onClick={handleSave}
            disabled={state?.status === "saving"}
            className={PRIMARY_BUTTON}
          >
            Enregistrer dans le projet
          </button>
        )}
        <button
          type="button"
          onClick={handleDownload}
          className={projectId === null ? PRIMARY_BUTTON : SECONDARY_BUTTON}
        >
          Télécharger les 2 fichiers
        </button>
      </div>

      <p role="status" className="text-lg">
        {state?.status === "saving" && "Enregistrement…"}
        {state?.status === "done" && state.message}
      </p>
      {state?.status === "error" && (
        <div role="alert" className="rounded-xl border-2 border-(--danger) bg-(--danger-soft) p-4 text-lg text-(--danger)">
          <p>Erreur : {state.message}</p>
          {state.showHubLink && (
            <Link href="/" className="inline-flex min-h-12 items-center underline">
              Retour au Hub
            </Link>
          )}
        </div>
      )}

      <div>
        <p className="text-lg">Ensuite, ajoutez cette ligne dans le &lt;head&gt; de la page :</p>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-(--line) bg-(--surface) p-3 text-lg">
          <code className="font-mono">{INTEGRATION_SNIPPET}</code>
        </pre>
      </div>
    </section>
  );
}
