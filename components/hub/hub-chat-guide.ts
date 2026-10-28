// Parcours guidé d'un projet : l'assistant envoie l'utilisateur d'outil en outil et vérifie,
// à son retour dans le Hub, que le fichier de l'étape a bien été enregistré.
// 100 % Hub : on lit seulement la liste des fichiers du projet, on n'écrit rien dans les outils.

import { ProjectFsError, listProjectFiles, type ProjectFileInfo, type ProjectInfo } from "@/lib/project-fs";
import type { HubChatReply } from "@/components/hub/hub-chat";
import { HUB_TOOLS, hubToolHref, type HubTool } from "@/components/hub/hub-tools";

export interface HubGuide {
  projectId: number;
  projectName: string;
  /** Index dans HUB_TOOLS de l'étape en cours. */
  step: number;
  /** Début de l'étape (ms) : le fichier doit avoir été enregistré après. */
  stepStartedAt: number;
}

/** Ce qu'il faut faire dans chaque outil, avec le libellé exact de ses boutons. */
const STEP_HOWTO: Record<HubTool["slug"], string> = {
  screendraft: "Créez votre maquette, puis cliquez sur « Enregistrer » (ou Ctrl+S).",
  generator: "Vérifiez l'aperçu de la page, puis cliquez sur « Générer et enregistrer ».",
  animations: "Sélectionnez les éléments de la page et choisissez leurs animations.",
};

/** AnimFlow n'écrit encore aucun fichier : la fin de son étape est déclarée par l'utilisateur. */
const UNVERIFIABLE_STEPS: ReadonlySet<HubTool["slug"]> = new Set(["animations"]);

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });

export function describeProject(project: ProjectInfo): string {
  return `« ${project.name} » (n°${project.id})`;
}

function guidedProject(guide: HubGuide): ProjectInfo {
  return { id: guide.projectId, name: guide.projectName };
}

function stepReply(guide: HubGuide, intro: string[]): HubChatReply {
  const tool = HUB_TOOLS[guide.step];
  const verification = UNVERIFIABLE_STEPS.has(tool.slug)
    ? `${tool.label} n'enregistre pas encore de fichier : je ne pourrai pas vérifier cette étape. Quand vous avez fini, revenez au Hub et dites « terminé ».`
    : "Revenez ensuite au Hub (logo FactorySuite, en haut à gauche) et rouvrez l'assistant : je vérifierai l'étape.";
  return {
    text: [
      ...intro,
      `Étape ${guide.step + 1} sur ${HUB_TOOLS.length} : ${tool.label} (${tool.description}).`,
      STEP_HOWTO[tool.slug],
      verification,
      "Vous pouvez aussi dire « passe l'étape » ou « arrête le guide ».",
    ].join("\n"),
    actions: [{ label: `Ouvrir ${tool.label} pour le projet ${guide.projectName}`, href: hubToolHref(tool, guide.projectId) }],
    guide,
  };
}

function advance(guide: HubGuide, intro: string[]): HubChatReply {
  const next = guide.step + 1;
  if (next >= HUB_TOOLS.length) {
    return {
      text: [...intro, `Parcours terminé : les ${HUB_TOOLS.length} étapes du projet ${describeProject(guidedProject(guide))} sont faites.`].join("\n"),
      guide: null,
    };
  }
  return stepReply({ ...guide, step: next, stepStartedAt: Date.now() }, intro);
}

/** Démarre le parcours à la première étape dont le fichier manque. */
export async function startHubGuide(project: ProjectInfo): Promise<HubChatReply> {
  const files = await listProjectFiles(project.id);
  const intro = [`Parcours guidé du projet ${describeProject(project)}.`];
  let step = 0;
  for (; step < HUB_TOOLS.length; step++) {
    const tool = HUB_TOOLS[step];
    const file = files.find((f) => f.name === tool.outputFile);
    if (UNVERIFIABLE_STEPS.has(tool.slug) || !file) break;
    intro.push(`✓ Étape ${step + 1} (${tool.label}) déjà faite : ${file.name} du ${dateFormat.format(file.lastModified)}.`);
  }
  return stepReply({ projectId: project.id, projectName: project.name, step, stepStartedAt: Date.now() }, intro);
}

/**
 * Vérifie l'étape en cours. `userSaysDone` : l'utilisateur affirme avoir fini (« terminé »),
 * seule preuve possible pour une étape sans fichier.
 */
export async function checkHubGuide(guide: HubGuide, userSaysDone: boolean): Promise<HubChatReply> {
  const tool = HUB_TOOLS[guide.step];
  const label = `Étape ${guide.step + 1} (${tool.label})`;
  if (UNVERIFIABLE_STEPS.has(tool.slug)) {
    return userSaysDone
      ? advance(guide, [`✓ ${label} notée comme faite.`])
      : stepReply(guide, [`Avez-vous terminé dans ${tool.label} ?`]);
  }

  let file: ProjectFileInfo | undefined;
  try {
    file = (await listProjectFiles(guide.projectId)).find((f) => f.name === tool.outputFile);
  } catch (error) {
    if (error instanceof ProjectFsError && error.code === "project-not-found") {
      return { text: `Le projet n°${guide.projectId} n'existe plus : parcours guidé arrêté.`, isError: true, guide: null };
    }
    throw error;
  }

  if (file && file.lastModified >= guide.stepStartedAt) {
    return advance(guide, [`✓ ${label} faite : ${file.name} enregistré le ${dateFormat.format(file.lastModified)}.`]);
  }
  if (file) {
    return stepReply(guide, [
      `${file.name} existe (version du ${dateFormat.format(file.lastModified)}), mais n'a pas été réenregistré depuis le début de l'étape. Dites « passe l'étape » pour garder cette version.`,
    ]);
  }
  return stepReply(guide, [`${label} pas encore faite : je ne trouve pas ${tool.outputFile} dans le projet.`]);
}

export function skipHubGuideStep(guide: HubGuide): HubChatReply {
  return advance(guide, [`Étape ${guide.step + 1} (${HUB_TOOLS[guide.step].label}) passée.`]);
}

export function stopHubGuide(guide: HubGuide): HubChatReply {
  return {
    text: `Parcours guidé arrêté. Dites « guide-moi pour le projet ${guide.projectId} » pour le reprendre.`,
    guide: null,
  };
}
