"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { writeProjectFile } from "@/lib/project-fs";
import type { Maquette } from "@/app/codeforge/generator/_lib/maquette";
import { generateSite } from "@/app/codeforge/generator/_lib/generate-html";
import { createSiteZip, projectFiles, siteFiles } from "@/app/codeforge/generator/_lib/export-site";
import { GeneratorPreview } from "@/app/codeforge/generator/_components/GeneratorPreview";

type SaveState = { status: "saving" } | { status: "saved"; at: Date } | { status: "error"; message: string };

export function GeneratorOutput({ maquette, projectId, sourceLabel }: { maquette: Maquette; projectId: number | null; sourceLabel: string }) {
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
      setDownload({ ok: true, message: multiple
        ? `Téléchargement de site.zip lancé. Extrayez tous les fichiers, puis ouvrez ${pages[0].screen.path} dans votre navigateur.`
        : `Téléchargement de ${downloadName} lancé. Ouvrez ce fichier dans votre navigateur : le CSS est intégré.` });
    } catch {
      setDownload({ ok: false, message: "Erreur : le téléchargement a échoué. Réessayez avec le bouton de téléchargement." });
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
    <section className="rounded-2xl border border-white/10 bg-white/3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">{maquette.name}</h2>
          <p className="text-sm text-zinc-300">{sourceLabel}</p>
          <p className="text-sm text-zinc-400">
            {projectId === null ? (
              <>Mode démo : ouvrez le Générateur depuis un projet du Hub pour enregistrer la page.</>
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
            className="min-h-10 rounded-full border border-zinc-500 bg-white/5 px-5 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
          >
            {multiple ? "Télécharger le site (ZIP)" : "Télécharger la page"}
          </button>
          {projectId !== null && (
            <button
              type="button"
              onClick={handleSave}
              disabled={save?.status === "saving"}
              className="min-h-10 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-60"
            >
              {save?.status === "saving" ? "Enregistrement…" : "Générer et enregistrer"}
            </button>
          )}
        </div>
      </div>

      <p id="generator-download-description" className="mt-3 text-sm text-zinc-300">
        {multiple
          ? `Une archive avec les ${pages.length} pages HTML et leurs fichiers CSS. Extrayez-la entièrement, puis ouvrez ${pages[0].screen.path}.`
          : "Un fichier HTML avec le CSS intégré, à ouvrir directement dans un navigateur."}
      </p>
      <p role={download?.ok === false ? "alert" : "status"} className="mt-2 text-sm text-zinc-200">
        {download?.message}
      </p>

      {save?.status === "saved" && (
        <p role="status" className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          Les {pages.length} écran(s) et leurs styles ont été enregistrés dans le projet #{projectId} à {save.at.toLocaleTimeString("fr-FR")}.
        </p>
      )}
      {save?.status === "error" && (
        <div role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <p>Erreur : {save.message}</p>
          <div className="mt-2 flex gap-4">
            <button type="button" onClick={handleSave} className="min-h-10 underline">
              Réessayer
            </button>
            <Link href="/" className="inline-flex min-h-10 items-center underline">
              Retour au Hub
            </Link>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label htmlFor="generator-screen" className="text-base text-zinc-100">Écran à prévisualiser</label>
        <select
          id="generator-screen"
          value={page.screen.id}
          onChange={(event) => setScreenId(event.target.value)}
          className="min-h-10 max-w-full rounded-lg border border-zinc-500 bg-zinc-900 px-3 py-2 text-base text-zinc-100"
        >
          {pages.map((item) => <option key={item.screen.id} value={item.screen.id}>{item.screen.name} — {item.screen.path}</option>)}
        </select>
      </div>
      <GeneratorPreview key={page.screen.id} html={page.standaloneHtml} name={page.screen.name} width={page.screen.frame.width} height={page.screen.frame.height} />
    </section>
  );
}
