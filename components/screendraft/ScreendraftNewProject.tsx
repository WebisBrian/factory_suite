"use client";

import Link from "next/link";
import { useState } from "react";
import { writeProjectFile } from "@/lib/project-fs";
import { ScreendraftTemplatePicker } from "@/components/screendraft/ScreendraftTemplatePicker";
import { MAQUETTE_FILE, serializeMaquette } from "@/components/screendraft/screendraft-file";
import type { Maquette } from "@/components/screendraft/screendraft-schema";
import {
  createMaquetteFromTemplate,
  type ScreendraftTemplate,
} from "@/components/screendraft/templates/screendraft-templates";

type CreateStatus = { kind: "idle" } | { kind: "creating"; name: string } | { kind: "error"; message: string };

type ScreendraftNewProjectProps = {
  projectId: number;
  onCreated: (draft: Maquette) => void;
};

/**
 * Premier passage dans Screendraft pour un projet (pas encore de `maquette.json`) :
 * l'utilisateur part d'un modèle ou d'une maquette vierge. Le choix est enregistré tout de suite,
 * depuis le clic : Chrome peut redemander l'accès au dossier, ce qui exige un geste.
 */
export function ScreendraftNewProject({ projectId, onCreated }: ScreendraftNewProjectProps) {
  const [status, setStatus] = useState<CreateStatus>({ kind: "idle" });

  async function create(template: ScreendraftTemplate) {
    const draft = createMaquetteFromTemplate(template, projectId);
    setStatus({ kind: "creating", name: template.name });
    try {
      await writeProjectFile(projectId, MAQUETTE_FILE, serializeMaquette(draft));
      onCreated(draft);
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div className="screendraft absolute inset-0 bg-(--surface) text-(--ink)">
        <ScreendraftTemplatePicker
          chooseLabel="Utiliser"
          busy={status.kind === "creating"}
          onChoose={(template) => void create(template)}
          intro={
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold">Nouvelle maquette — projet {projectId}</h1>
              <p className="mt-(--space-2) text-base">
                Choisissez un point de départ. Tout reste modifiable ensuite, et vous pourrez changer de
                modèle depuis l&apos;éditeur avec le bouton « Modèles ».
              </p>
              {status.kind === "creating" && (
                <p role="status" className="mt-(--space-3) text-base">
                  Création de la maquette « {status.name} »…
                </p>
              )}
              {status.kind === "error" && (
                <p role="alert" className="mt-(--space-3) text-base font-semibold">
                  Erreur : {status.message}{" "}
                  <Link href="/" className="underline">
                    Retour au Hub
                  </Link>
                </p>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}
