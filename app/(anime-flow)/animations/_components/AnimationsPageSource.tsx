"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { PAGE_FILE, STYLE_FILE } from "@/app/(anime-flow)/animations/_lib/page-source";

type Props = {
  /** D'où vient la page affichée : « Page de démo », « page.html du projet #3 »… */
  sourceLabel: string | null;
  /** Feuilles de style liées par la page mais pas fournies : la page s'affiche sans elles. */
  missingStylesheets: string[];
  importError: string | null;
  canReloadProject: boolean;
  canCancelImport: boolean;
  onFiles: (files: File[]) => void;
  onReloadProject: () => void;
  onCancelImport: () => void;
};

/** Choix de la page à animer : celle du projet, ou un fichier importé (bouton ou glisser-déposer). */
export function AnimationsPageSource({
  sourceLabel,
  missingStylesheets,
  importError,
  canReloadProject,
  canCancelImport,
  onFiles,
  onReloadProject,
  onCancelImport,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    onFiles(Array.from(event.target.files ?? []));
    // Permet de réimporter les mêmes fichiers après une modification.
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    onFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <section
      aria-labelledby="animations-source-title"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 p-5 ${
        dragging ? "border-dashed border-(--motion) bg-(--motion-soft)" : "border-(--line) bg-(--surface-raised)"
      }`}
    >
      <div>
        <h2 id="animations-source-title" className="text-xl font-semibold">
          Votre page
        </h2>
        <p className="text-lg text-(--ink-muted)">
          {sourceLabel ?? "Aucune page chargée."} Vous pouvez aussi glisser-déposer {PAGE_FILE} et {STYLE_FILE} ici.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="min-h-12 rounded-full bg-(--motion) px-6 text-lg font-semibold text-(--on-motion) hover:bg-(--motion-strong)"
        >
          Importer une page
        </button>
        {canReloadProject && (
          <button
            type="button"
            onClick={onReloadProject}
            className="min-h-12 rounded-full border-2 border-(--line-strong) bg-(--surface-raised) px-6 text-lg font-semibold hover:bg-(--motion-soft)"
          >
            Recharger la page du projet
          </button>
        )}
        {canCancelImport && (
          <button
            type="button"
            onClick={onCancelImport}
            className="min-h-12 rounded-full border-2 border-(--line-strong) bg-(--surface-raised) px-6 text-lg font-semibold hover:bg-(--motion-soft)"
          >
            Annuler l&apos;import
          </button>
        )}
        {/* Plusieurs fichiers : la page HTML et sa feuille de style. */}
        <input
          ref={fileInput}
          type="file"
          accept=".html,.htm,.css,text/html,text/css"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {importError && (
        <p role="alert" className="w-full rounded-xl border-2 border-(--danger) bg-(--danger-soft) p-4 text-lg text-(--danger)">
          {importError}
        </p>
      )}
      {missingStylesheets.length > 0 && (
        <p className="w-full rounded-xl border-2 border-(--line-strong) p-4 text-lg">
          Cette page utilise {missingStylesheets.join(", ")} : importez-le avec la page pour voir ses couleurs et sa mise en
          page.
        </p>
      )}
    </section>
  );
}
