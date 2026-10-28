"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { writeProjectFile } from "@/lib/project-fs";
import type { Maquette } from "@/app/codeforge/generator/_lib/maquette";
import { CSS_FILE, HTML_FILE, generatePage } from "@/app/codeforge/generator/_lib/generate-html";
import { GeneratorPreview } from "@/app/codeforge/generator/_components/GeneratorPreview";

type SaveState = { status: "saving" } | { status: "saved"; at: Date } | { status: "error"; message: string };

export function GeneratorOutput({ maquette, projectId, sourceLabel }: { maquette: Maquette; projectId: number | null; sourceLabel: string }) {
  const page = useMemo(() => generatePage(maquette), [maquette]);
  const [save, setSave] = useState<SaveState | null>(null);

  // Écriture depuis un clic : Chrome peut afficher l'invite d'autorisation.
  async function handleSave() {
    if (projectId === null) return;
    setSave({ status: "saving" });
    try {
      await writeProjectFile(projectId, CSS_FILE, page.css);
      await writeProjectFile(projectId, HTML_FILE, page.html);
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
                Enregistre{" "}
                <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-zinc-200">{HTML_FILE}</code> et{" "}
                <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-zinc-200">{CSS_FILE}</code> dans le
                dossier du projet #{projectId}.
              </>
            )}
          </p>
        </div>
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

      {save?.status === "saved" && (
        <p role="status" className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {HTML_FILE} et {CSS_FILE} enregistrés dans le projet #{projectId} à {save.at.toLocaleTimeString("fr-FR")}.
        </p>
      )}
      {save?.status === "error" && (
        <div role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <p>{save.message}</p>
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

      <GeneratorPreview html={page.standaloneHtml} name={maquette.name} width={maquette.frame.width} height={maquette.frame.height} />
    </section>
  );
}
