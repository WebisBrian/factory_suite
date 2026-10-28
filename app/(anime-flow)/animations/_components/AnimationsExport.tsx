"use client";

import { useState } from "react";
import { writeProjectFile } from "@/lib/project-fs";
import {
  CONFIG_FILE,
  SCRIPT_FILE,
  serializeConfig,
  type AnimeFlowConfig,
} from "@/app/(anime-flow)/animations/_lib/animation-config";
import { ANIMATION_RUNTIME_JS, INTEGRATION_SNIPPET } from "@/app/(anime-flow)/animations/_lib/animation-runtime";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/app/(anime-flow)/animations/_lib/field-styles";

export type ExportState =
  | { status: "saving" }
  | { status: "done"; message: string }
  | { status: "error"; message: string; showHubLink: boolean };

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
/** `announce` reçoit le message de réussite, pour le lecteur d'écran. */
export function useAnimationsExport(
  projectId: number | null,
  config: AnimeFlowConfig,
  announce: (message: string) => void,
) {
  const [state, setState] = useState<ExportState | null>(null);

  // Écriture depuis un clic : Chrome peut afficher l'invite d'autorisation.
  async function save() {
    if (projectId === null) return;
    setState({ status: "saving" });
    try {
      await writeProjectFile(projectId, CONFIG_FILE, serializeConfig(config));
      await writeProjectFile(projectId, SCRIPT_FILE, ANIMATION_RUNTIME_JS);
      const message = `${SCRIPT_FILE} et ${CONFIG_FILE} enregistrés dans le projet ${projectId}.`;
      setState({ status: "done", message });
      announce(message);
    } catch (e) {
      setState({ status: "error", message: e instanceof Error ? e.message : String(e), showHubLink: true });
    }
  }

  function download() {
    try {
      downloadFile(CONFIG_FILE, serializeConfig(config), "application/json;charset=utf-8");
      downloadFile(SCRIPT_FILE, ANIMATION_RUNTIME_JS, "text/javascript;charset=utf-8");
      const message = `Téléchargement de ${SCRIPT_FILE} et ${CONFIG_FILE} lancé.`;
      setState({ status: "done", message });
      announce(message);
    } catch {
      setState({ status: "error", message: "le téléchargement a échoué. Réessayez.", showHubLink: false });
    }
  }

  return { state, save, download, dismiss: () => setState(null) };
}

type ButtonsProps = {
  projectId: number | null;
  saving: boolean;
  onSave: () => void;
  onDownload: () => void;
};

/** Boutons d'export de l'en-tête. */
export function AnimationsExportButtons({ projectId, saving, onSave, onDownload }: ButtonsProps) {
  return (
    <>
      {projectId !== null && (
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          aria-label={`Enregistrer ${SCRIPT_FILE} et ${CONFIG_FILE} dans le projet`}
          className={PRIMARY_BUTTON}
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-current">
            <path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 2v5h8V5H7Zm5 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
          </svg>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      )}
      <button
        type="button"
        onClick={onDownload}
        aria-label={`Télécharger ${SCRIPT_FILE} et ${CONFIG_FILE}`}
        className={projectId === null ? PRIMARY_BUTTON : SECONDARY_BUTTON}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-current">
          <path d="M11 3h2v9.17l3.59-3.58L18 10l-6 6-6-6 1.41-1.41L11 12.17V3ZM4 18h16v2H4v-2Z" />
        </svg>
        Télécharger
      </button>
    </>
  );
}

/** Ce que l'intégration doit ajouter à la page. */
export function AnimationsIntegration({ animatedCount }: { animatedCount: number }) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p>
        L&apos;export produit <code className="font-mono">{SCRIPT_FILE}</code> (le script qui joue les animations) et{" "}
        <code className="font-mono">{CONFIG_FILE}</code> (la liste des animations).{" "}
        {animatedCount === 0
          ? "Aucun élément animé pour l'instant."
          : `${animatedCount} élément${animatedCount > 1 ? "s" : ""} animé${animatedCount > 1 ? "s" : ""}.`}
      </p>
      <p>Placez-les à côté de la page, puis ajoutez dans son &lt;head&gt; :</p>
      <pre className="overflow-x-auto rounded-xl border border-(--line) bg-(--surface) p-3 whitespace-pre-wrap break-all">
        <code className="font-mono">{INTEGRATION_SNIPPET}</code>
      </pre>
    </div>
  );
}
