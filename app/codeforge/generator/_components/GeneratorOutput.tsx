"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { writeProjectFile } from "@/lib/project-fs";
import type { Maquette } from "@/app/codeforge/generator/_lib/maquette";
import { generateSite } from "@/app/codeforge/generator/_lib/generate-html";
import { createSiteZip, projectFiles, siteFiles } from "@/app/codeforge/generator/_lib/export-site";
import {
  generatorError,
  generatorKicker,
  generatorLink,
  generatorPrimaryButton,
  generatorSecondaryButton,
  generatorSuccess,
  generatorWindow,
} from "@/app/codeforge/generator/_lib/generator-styles";
import { GeneratorPreview } from "@/app/codeforge/generator/_components/GeneratorPreview";

type SaveState = { status: "saving" } | { status: "saved"; at: Date } | { status: "error"; message: string };

export function GeneratorOutput({
  maquette,
  projectId,
  sourceLabel,
}: {
  maquette: Maquette;
  projectId: number | null;
  sourceLabel: string;
}) {
  const pages = useMemo(() => generateSite(maquette), [maquette]);
  const [screenId, setScreenId] = useState(maquette.screens[0].id);
  const page = pages.find((item) => item.screen.id === screenId) ?? pages[0];
  const multiple = pages.length > 1;
  const downloadName = multiple ? "site.zip" : page.screen.path;
  const [save, setSave] = useState<SaveState | null>(null);
  const [download, setDownload] = useState<{ ok: boolean; message: string } | null>(null);

  function handleDownload() {
    let url: string | undefined;
    const link = document.createElement("a");
    try {
      const blob = multiple
        ? createSiteZip(siteFiles(pages))
        : new Blob([page.standaloneHtml], { type: "text/html;charset=utf-8" });
      url = URL.createObjectURL(blob);
      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      setDownload({
        ok: true,
        message: multiple
          ? `Téléchargement de site.zip lancé. Extrayez tous les fichiers, puis ouvrez ${pages[0].screen.path} dans votre navigateur.`
          : `Téléchargement de ${downloadName} lancé. Ouvrez ce fichier dans votre navigateur : le CSS est intégré.`,
      });
    } catch {
      setDownload({
        ok: false,
        message: "Erreur : le téléchargement a échoué. Réessayez avec le bouton de téléchargement.",
      });
    } finally {
      link.remove();
      // Laisser au navigateur le temps de démarrer le téléchargement avant de libérer l'URL.
      if (url !== undefined) {
        const downloadUrl = url;
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
      }
    }
  }

  // Écriture depuis un clic : Chrome peut afficher l'invite d'autorisation.
  async function handleSave() {
    if (projectId === null) return;
    setSave({ status: "saving" });
    try {
      for (const file of projectFiles(pages)) {
        await writeProjectFile(projectId, file.name, file.content);
      }
      setSave({ status: "saved", at: new Date() });
    } catch (e) {
      setSave({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <section aria-labelledby="generator-output-title" className={generatorWindow}>
      <div className="flex flex-wrap items-start justify-between gap-4 p-6">
        <div>
          <p className={generatorKicker}>Aperçu et export</p>
          <h2 id="generator-output-title" className="mt-1 text-2xl font-semibold text-[#2e2e2e]">
            {maquette.name}
          </h2>
          <p className="mt-1 text-sm text-[#454545]">{sourceLabel}</p>
          <p className="mt-1 text-sm text-[#454545]">
            {projectId === null ? (
              <>Mode démo : ouvrez CodeForge depuis un projet du Hub pour enregistrer la page.</>
            ) : (
              <>
                Enregistre les {pages.length} écran(s) en HTML/CSS dans le dossier du projet #{projectId}.
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            aria-describedby="generator-download-description"
            className={generatorSecondaryButton}
          >
            {multiple ? "Télécharger le site (ZIP)" : "Télécharger la page"}
          </button>
          {projectId !== null && (
            <button
              type="button"
              onClick={handleSave}
              disabled={save?.status === "saving"}
              className={generatorPrimaryButton}
            >
              {save?.status === "saving" ? "Enregistrement…" : "Générer et enregistrer"}
            </button>
          )}
        </div>
      </div>

      <div className="px-6 pb-5">
        <p id="generator-download-description" className="text-sm text-[#454545]">
          {multiple
            ? `Une archive avec les ${pages.length} pages HTML et leurs fichiers CSS. Extrayez-la entièrement, puis ouvrez ${pages[0].screen.path}.`
            : "Un fichier HTML avec le CSS intégré, à ouvrir directement dans un navigateur."}
        </p>
        <p role={download?.ok === false ? "alert" : "status"} className="mt-2 text-sm text-[#2e2e2e]">
          {download?.message}
        </p>

        {save?.status === "saved" && (
          <p role="status" className={`mt-3 ${generatorSuccess}`}>
            ✓ Enregistré : les {pages.length} écran(s) et leurs styles sont dans le projet #{projectId} à{" "}
            {save.at.toLocaleTimeString("fr-FR")}.
          </p>
        )}
        {save?.status === "error" && (
          <div role="alert" className={`mt-3 ${generatorError}`}>
            <p className="font-semibold">Erreur : {save.message}</p>
            <div className="mt-2 flex gap-4">
              <button type="button" onClick={handleSave} className={`min-h-10 ${generatorLink}`}>
                Réessayer
              </button>
              <Link href="/" className={`inline-flex min-h-10 items-center ${generatorLink}`}>
                Retour au Hub
              </Link>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label htmlFor="generator-screen" className="text-base font-semibold text-[#2e2e2e]">
            Écran à prévisualiser
          </label>
          <select
            id="generator-screen"
            value={page.screen.id}
            onChange={(event) => setScreenId(event.target.value)}
            className="min-h-10 max-w-full rounded-md border border-zinc-500 bg-white px-3 py-2 text-base text-[#2e2e2e]"
          >
            {pages.map((item) => (
              <option key={item.screen.id} value={item.screen.id}>
                {item.screen.name} — {item.screen.path}
              </option>
            ))}
          </select>
        </div>
      </div>

      <GeneratorPreview
        key={page.screen.id}
        html={page.standaloneHtml}
        name={page.screen.name}
        width={page.screen.frame.width}
        height={page.screen.frame.height}
      />
    </section>
  );
}
