"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { writeProjectFile } from "@/lib/project-fs";
import type { Maquette } from "@/app/codeforge/generator/_lib/maquette";
import { generateSite } from "@/app/codeforge/generator/_lib/generate-html";
import { createSiteZip, projectFiles, siteFiles } from "@/app/codeforge/generator/_lib/export-site";
import {
  generatorError,
  generatorLink,
  generatorPaper,
  generatorPrimaryButton,
  generatorSecondaryButton,
  generatorSectionTitle,
  generatorSuccess,
  toolHref,
  generatorWindow,
} from "@/app/codeforge/generator/_lib/generator-styles";
import { GeneratorPreview } from "@/app/codeforge/generator/_components/GeneratorPreview";

type SaveState = { status: "saving" } | { status: "saved"; at: Date } | { status: "error"; message: string };

export function GeneratorOutput({ maquette, projectId }: { maquette: Maquette; projectId: number | null }) {
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
    <>
      <section aria-labelledby="generator-preview-title" className="flex flex-col gap-4">
        <h2 id="generator-preview-title" className={generatorSectionTitle}>
          2. Aperçu
        </h2>
        <div className={generatorWindow}>
          <GeneratorPreview
            key={page.screen.id}
            html={page.standaloneHtml}
            name={page.screen.name}
            width={page.screen.frame.width}
            height={page.screen.frame.height}
            leading={
              multiple && (
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="generator-screen" className="text-sm font-semibold text-[#2e2e2e]">
                    Écran
                  </label>
                  <select
                    id="generator-screen"
                    value={page.screen.id}
                    onChange={(event) => setScreenId(event.target.value)}
                    className="min-h-10 max-w-full rounded-md border border-zinc-500 bg-white px-3 py-2 text-sm text-[#2e2e2e]"
                  >
                    {pages.map((item) => (
                      <option key={item.screen.id} value={item.screen.id}>
                        {item.screen.name} — {item.screen.path}
                      </option>
                    ))}
                  </select>
                </div>
              )
            }
          />
        </div>
      </section>

      <section aria-labelledby="generator-export-title" className="flex flex-col gap-4">
        <h2 id="generator-export-title" className={generatorSectionTitle}>
          3. Export
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className={`${generatorPaper} flex flex-col gap-3 p-5`}>
            <h3 className="text-xl font-medium text-[#2e2e2e]">Télécharger</h3>
            <p id="generator-download-description" className="text-base text-[#454545]">
              {multiple
                ? `Une archive avec les ${pages.length} pages HTML et leurs fichiers CSS. Extrayez-la entièrement, puis ouvrez ${pages[0].screen.path}.`
                : "Un fichier HTML avec le CSS intégré, à ouvrir directement dans un navigateur."}
            </p>
            <div>
              <button
                type="button"
                onClick={handleDownload}
                aria-describedby="generator-download-description"
                className={projectId === null ? generatorPrimaryButton : generatorSecondaryButton}
              >
                {multiple ? "Télécharger le site (ZIP)" : "Télécharger la page"}
              </button>
            </div>
            {/* Deux régions live toujours présentes : changer le rôle d'une région existante n'est pas annoncé. */}
            <p role="status" className="text-sm text-[#2e2e2e]">
              {download?.ok ? download.message : null}
            </p>
            <p role="alert" className="text-sm font-semibold text-red-950">
              {download?.ok === false ? download.message : null}
            </p>
          </div>

          <div className={`${generatorPaper} flex flex-col gap-3 p-5`}>
            <h3 className="text-xl font-medium text-[#2e2e2e]">
              {projectId === null ? "Enregistrer dans un projet" : `Enregistrer dans le projet #${projectId}`}
            </h3>
            {projectId === null ? (
              <p className="text-base text-[#454545]">
                Disponible quand CodeForge est ouvert depuis un projet du Hub : les pages sont alors écrites dans le
                dossier de travail, et l&apos;étape suivante (AnimFlow) peut les lire.
              </p>
            ) : (
              <>
                <p className="text-base text-[#454545]">
                  Écrit les {pages.length} écran(s) en HTML/CSS dans le dossier du projet, pour l&apos;étape AnimFlow.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={save?.status === "saving"}
                    className={generatorPrimaryButton}
                  >
                    {save?.status === "saving" ? "Enregistrement…" : "Générer et enregistrer"}
                  </button>
                </div>
              </>
            )}
            {/* Région live présente dès le départ : un rôle status inséré avec son texte est souvent ignoré. */}
            <div role="status">
              {save?.status === "saving" && <p className="sr-only">Enregistrement en cours…</p>}
              {save?.status === "saved" && (
                <p className={generatorSuccess}>
                  <span aria-hidden>✓ </span>Enregistré à {save.at.toLocaleTimeString("fr-FR")}.{" "}
                  <Link href={toolHref("/animations", projectId)} className={generatorLink}>
                    Ouvrir dans AnimFlow
                  </Link>
                </p>
              )}
            </div>
            {save?.status === "error" && (
              <div role="alert" className={generatorError}>
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
          </div>
        </div>
      </section>
    </>
  );
}
