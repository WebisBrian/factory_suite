"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { SECONDARY_BUTTON } from "@/app/(anime-flow)/animations/_lib/field-styles";

type Props = {
  canReloadProject: boolean;
  canCancelImport: boolean;
  onFiles: (files: File[]) => void;
  onReloadProject: () => void;
  onCancelImport: () => void;
};

/** Boutons d'en-tête pour choisir la page à animer : celle du projet, ou un fichier importé. */
export function AnimationsPageImport({
  canReloadProject,
  canCancelImport,
  onFiles,
  onReloadProject,
  onCancelImport,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    onFiles(Array.from(event.target.files ?? []));
    // Permet de réimporter les mêmes fichiers après une modification.
    event.target.value = "";
  }

  return (
    <>
      <button type="button" onClick={() => fileInput.current?.click()} className={SECONDARY_BUTTON}>
        <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-current">
          <path d="M11 21h2v-9.17l3.59 3.58L18 14l-6-6-6 6 1.41 1.41L11 11.83V21ZM4 4h16v2H4V4Z" />
        </svg>
        Importer une page
      </button>
      {canCancelImport ? (
        <button type="button" onClick={onCancelImport} className={SECONDARY_BUTTON}>
          Annuler l&apos;import
        </button>
      ) : (
        canReloadProject && (
          <button
            type="button"
            onClick={onReloadProject}
            aria-label="Recharger la page du projet"
            className={SECONDARY_BUTTON}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-current">
              <path d="M12 4a8 8 0 0 1 7.75 6h-2.1A6 6 0 1 0 18 15h2.1A8 8 0 1 1 12 4Zm5 1h4v4l-4-4Z" />
            </svg>
            Recharger
          </button>
        )
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
    </>
  );
}

/**
 * Glisser-déposer de fichiers. `dragging` passe à true dès que des fichiers sont glissés dans
 * la fenêtre : la zone affiche alors une surcouche de dépôt, nécessaire au-dessus de l'aperçu,
 * car une iframe garde pour elle les évènements de glisser.
 */
export function useFileDrop(onFiles: (files: File[]) => void) {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    window.addEventListener(
      "dragenter",
      (event) => {
        // Seulement pour des fichiers, pas pour un texte glissé depuis la page.
        if (event.dataTransfer?.types.includes("Files")) setDragging(true);
      },
      { signal },
    );
    // relatedTarget null : le curseur a quitté la fenêtre.
    window.addEventListener("dragleave", (event) => event.relatedTarget === null && setDragging(false), { signal });
    // Un dépôt hors de la zone ne doit pas ouvrir le fichier à la place de l'outil (travail perdu).
    window.addEventListener("dragover", (event) => event.preventDefault(), { signal });
    window.addEventListener(
      "drop",
      (event) => {
        event.preventDefault();
        setDragging(false);
      },
      { signal },
    );
    return () => controller.abort();
  }, []);

  return {
    dragging,
    handlers: {
      onDragOver(event: DragEvent<HTMLElement>) {
        event.preventDefault();
      },
      onDrop(event: DragEvent<HTMLElement>) {
        event.preventDefault();
        setDragging(false);
        onFiles(Array.from(event.dataTransfer.files));
      },
    },
  };
}
