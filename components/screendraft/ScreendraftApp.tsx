"use client";

import "@/components/screendraft/screendraft-theme.css";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { readProjectText, useProjectId } from "@/lib/project-fs";
import { ScreendraftEditor } from "@/components/screendraft/ScreendraftEditor";
import { ScreendraftNewProject } from "@/components/screendraft/ScreendraftNewProject";
import {
  MAQUETTE_FILE,
  parseMaquette,
  type ParsedMaquette,
} from "@/components/screendraft/screendraft-file";
import { maquetteFixture } from "@/components/screendraft/temp-fixture";

/** `draft: null` : le projet n'a pas encore de `maquette.json`. */
type MaquetteLoad = ParsedMaquette | { ok: true; draft: null };

type ProjectLoad = { projectId: number; result: MaquetteLoad };

async function loadMaquette(projectId: number): Promise<MaquetteLoad> {
  try {
    const text = await readProjectText(projectId, MAQUETTE_FILE);
    // Premier passage dans Screendraft pour ce projet : l'utilisateur choisit un modèle.
    if (text === null) return { ok: true, draft: null };
    return parseMaquette(text);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Sans `?project_id=` : mode démo sur la fixture, aucun accès disque.
 * Avec : ouvre le `maquette.json` du projet, ou propose les modèles s'il n'existe pas encore.
 */
export function ScreendraftApp() {
  const projectId = useProjectId();
  const [load, setLoad] = useState<ProjectLoad | null>(null);

  // Lecture au chargement : marche si l'accès au dossier est déjà accordé.
  useEffect(() => {
    if (projectId === null) return;
    let cancelled = false;
    loadMaquette(projectId).then((result) => {
      if (!cancelled) setLoad({ projectId, result });
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (projectId === null) {
    return <ScreendraftEditor initialDraft={maquetteFixture} projectId={null} />;
  }
  if (load?.projectId !== projectId) {
    return <ScreendraftNotice role="status">Chargement du projet {projectId}…</ScreendraftNotice>;
  }
  if (!load.result.ok) {
    // Relancée depuis un clic, la lecture peut afficher l'invite d'autorisation de Chrome.
    const retry = async () => setLoad({ projectId, result: await loadMaquette(projectId) });
    return (
      <ScreendraftNotice role="alert">
        <p>Erreur : {load.result.error}</p>
        <div className="mt-(--space-4) flex justify-center gap-(--space-3)">
          <button
            type="button"
            onClick={retry}
            className="min-h-10 rounded-(--radius-md) bg-(--draft) px-(--space-4) py-(--space-2) text-sm font-semibold text-(--on-draft) hover:bg-(--draft-strong)"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex min-h-10 items-center rounded-(--radius-md) border border-(--line-strong) px-(--space-4) py-(--space-2) text-sm font-semibold text-(--ink) hover:bg-(--canvas)"
          >
            Retour au Hub
          </Link>
        </div>
      </ScreendraftNotice>
    );
  }
  if (load.result.draft === null) {
    return (
      <ScreendraftNewProject
        projectId={projectId}
        onCreated={(draft) => setLoad({ projectId, result: { ok: true, draft } })}
      />
    );
  }
  return <ScreendraftEditor key={projectId} initialDraft={load.result.draft} projectId={projectId} />;
}

function ScreendraftNotice({ role, children }: { role: "status" | "alert"; children: ReactNode }) {
  return (
    <div className="screendraft flex flex-1 items-center justify-center bg-(--surface) p-(--space-8) text-(--ink)">
      <div role={role} className="max-w-lg text-center text-base">
        {children}
      </div>
    </div>
  );
}
