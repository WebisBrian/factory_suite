// Moteur de l'assistant du Hub : comprend une demande en français (règles par mots-clés,
// 100 % navigateur, sans appel réseau) et l'exécute via @/lib/project-fs.

import {
  ProjectFsError,
  createProject,
  deleteProject,
  listProjectFiles,
  listProjectHistory,
  listProjects,
  renameProject,
  type ProjectFsErrorCode,
  type ProjectInfo,
} from "@/lib/project-fs";
import { notifyHubProjectsChanged } from "@/components/hub/hub-project-events";
import { HUB_TOOLS, hubToolHref, type HubTool } from "@/components/hub/hub-tools";

export type HubChatAuthor = "user" | "assistant";

export interface HubChatMessage {
  id: number;
  author: HubChatAuthor;
  text: string;
  /** Réponse d'erreur : affichée avec le préfixe « Erreur : » (pas seulement en couleur). */
  isError?: boolean;
}

/** Action irréversible en attente : exécutée seulement après confirmation explicite. */
export interface HubChatConfirmation {
  /** Texte du bouton de confirmation, précis sur sa cible : « Supprimer « Boulangerie » ». */
  label: string;
  run: () => Promise<HubChatReply>;
  cancelText: string;
}

export interface HubChatReply {
  text: string;
  isError?: boolean;
  /** Page à ouvrir après la réponse (outil de la suite). */
  navigateTo?: string;
  confirmation?: HubChatConfirmation;
}

/** Exemples proposés à l'ouverture de l'assistant. */
export const HUB_CHAT_SUGGESTIONS: readonly string[] = [
  "Aide",
  "Liste mes projets",
  "Crée un projet Boulangerie",
  "Où en est le dernier projet ?",
];

export const HUB_CHAT_WELCOME =
  "Bonjour, je suis l'assistant FactorySuite. Je peux créer, renommer ou supprimer un projet, donner son avancement et ouvrir un outil. Dites « aide » pour des exemples.";

const HELP_TEXT = [
  "Voici ce que je sais faire, avec des exemples :",
  "• Lister les projets : « liste mes projets »",
  "• Créer un projet : « crée un projet Boulangerie »",
  "• Renommer : « renomme le projet 2 en Pâtisserie »",
  "• Supprimer (après confirmation) : « supprime le projet 2 »",
  "• Avancement : « où en est le projet Boulangerie ? »",
  "• Fichiers : « fichiers du projet 2 »",
  "• Historique : « historique du projet 2 »",
  "• Ouvrir un outil : « ouvre CodeForge pour le projet 2 » (sans projet : mode démo)",
  "Un projet se désigne par son numéro, son nom ou « le dernier projet ».",
].join("\n");

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });

// --- Analyse du texte ---------------------------------------------------------

/**
 * Minuscules sans accents, caractère par caractère : la chaîne garde la même longueur
 * que l'originale, ce qui permet d'y retrouver un nom (avec sa casse et ses accents).
 */
function normalize(text: string): string {
  return text
    .split("")
    .map((char) => {
      const plain = char.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      return plain.length === 1 ? plain : char;
    })
    .join("");
}

/** Groupe capturé en fin de motif, repris dans le texte d'origine. */
function trailingGroup(request: string, match: RegExpMatchArray, group: string): string {
  const start = (match.index ?? 0) + match[0].length - group.length;
  return cleanName(request.slice(start, start + group.length));
}

function cleanName(name: string): string {
  return name
    .trim()
    .replace(/[\s.!?]+$/, "")
    .replace(/^["'«“\s]+|["'»”\s]+$/g, "")
    .trim();
}

const YES = /^(oui|ok|d'accord|confirme[rs]?|vas-y|valide[rs]?)\b/;
const NO = /^(non|annule[rs]?|stop|laisse tomber)\b/;

export function isHubChatYes(text: string): boolean {
  return YES.test(normalize(text.trim()));
}

export function isHubChatNo(text: string): boolean {
  return NO.test(normalize(text.trim()));
}

const TOOL_PATTERNS: Record<HubTool["slug"], RegExp> = {
  screendraft: /\b(screen ?draft|maquett\w*)\b/,
  generator: /\b(code ?forge|generateur|generator|html)\b/,
  animations: /\b(anim ?flow|anime ?flow|animations?|anim)\b/,
};

function findTool(text: string): HubTool | null {
  return HUB_TOOLS.find((tool) => TOOL_PATTERNS[tool.slug].test(text)) ?? null;
}

type ProjectRef = { kind: "found"; project: ProjectInfo } | { kind: "none" } | { kind: "unknown"; label: string };

/** Retrouve le projet désigné : « projet 2 », « #2 », « le dernier projet » ou son nom. */
function findProject(text: string, projects: readonly ProjectInfo[]): ProjectRef {
  const byNumber = text.match(/(?:projet|#|n°|numero)\s*(?:n°|numero|#)?\s*(\d+)\b/);
  if (byNumber) {
    const id = Number(byNumber[1]);
    const project = projects.find((p) => p.id === id);
    return project ? { kind: "found", project } : { kind: "unknown", label: `n°${id}` };
  }
  if (/\bdernier projet\b|\bprojet le plus recent\b/.test(text) && projects.length > 0) {
    return { kind: "found", project: projects[projects.length - 1] };
  }
  // Nom cité dans la phrase : le plus long l'emporte (« Boulangerie bio » avant « Boulangerie »).
  const named = projects
    .filter((p) => normalize(p.name).trim() !== "" && text.includes(normalize(p.name)))
    .sort((a, b) => b.name.length - a.name.length)[0];
  return named ? { kind: "found", project: named } : { kind: "none" };
}

function describe(project: ProjectInfo): string {
  return `« ${project.name} » (n°${project.id})`;
}

// --- Réponses ----------------------------------------------------------------

const ERROR_HINTS: Partial<Record<ProjectFsErrorCode, string>> = {
  "no-folder": "Fermez l'assistant et cliquez sur « Choisir le dossier » dans la section Projets.",
  "permission-denied": "Fermez l'assistant et cliquez sur « Autoriser l'accès », puis refaites votre demande.",
  unsupported: "Ouvrez FactorySuite dans Chrome ou Edge.",
};

function errorReply(error: unknown): HubChatReply {
  if (error instanceof ProjectFsError) {
    const hint = ERROR_HINTS[error.code];
    return { text: hint ? `${error.message} ${hint}` : error.message, isError: true };
  }
  return { text: error instanceof Error ? error.message : String(error), isError: true };
}

/** Demande qui nécessite un projet, mais aucun n'est désigné clairement. */
function askWhichProject(ref: ProjectRef, projects: readonly ProjectInfo[], example: string): HubChatReply {
  if (projects.length === 0) {
    return { text: "Il n'y a encore aucun projet. Dites par exemple « crée un projet Boulangerie »." };
  }
  const intro = ref.kind === "unknown" ? `Je ne trouve pas le projet ${ref.label}.` : "De quel projet parlez-vous ?";
  return { text: `${intro} ${projectListText(projects)}\nPrécisez-le, par exemple : « ${example} ».` };
}

function projectListText(projects: readonly ProjectInfo[]): string {
  if (projects.length === 0) return "Il n'y a encore aucun projet.";
  const lines = projects.map((p) => `• n°${p.id} : ${p.name}`);
  return [`${projects.length} projet${projects.length > 1 ? "s" : ""} :`, ...lines].join("\n");
}

async function projectStatus(project: ProjectInfo): Promise<HubChatReply> {
  const files = await listProjectFiles(project.id);
  const steps = HUB_TOOLS.map((tool, index) => {
    const file = files.find((f) => f.name === tool.outputFile);
    return { tool, index, file };
  });
  const lines = steps.map(({ tool, index, file }) =>
    file
      ? `${index + 1}. ${tool.label} : fait (${file.name}, modifié le ${dateFormat.format(file.lastModified)})`
      : `${index + 1}. ${tool.label} : à faire`,
  );
  const next = steps.find((step) => !step.file);
  const conclusion = next
    ? `Prochaine étape : ${next.tool.label}. Dites « ouvre ${next.tool.label} pour le projet ${project.id} ».`
    : "Les trois étapes sont faites.";
  return { text: [`Avancement du projet ${describe(project)} :`, ...lines, conclusion].join("\n") };
}

async function projectFiles(project: ProjectInfo): Promise<HubChatReply> {
  const files = await listProjectFiles(project.id);
  if (files.length === 0) return { text: `Le projet ${describe(project)} n'a encore aucun fichier.` };
  const lines = files.map((f) => `• ${f.name}, modifié le ${dateFormat.format(f.lastModified)}`);
  return { text: [`Fichiers du projet ${describe(project)} :`, ...lines].join("\n") };
}

const HISTORY_LIMIT = 5;

async function projectHistory(project: ProjectInfo): Promise<HubChatReply> {
  const versions = await listProjectHistory(project.id);
  if (versions.length === 0) return { text: `Aucun enregistrement dans l'historique du projet ${describe(project)}.` };
  const lines = versions
    .slice(0, HISTORY_LIMIT)
    .map((v) => `• ${v.filename}, enregistré le ${dateFormat.format(v.savedAt)}`);
  const more =
    versions.length > HISTORY_LIMIT
      ? `Et ${versions.length - HISTORY_LIMIT} version(s) plus ancienne(s) : voir l'onglet Historique de la carte du projet.`
      : "Pour restaurer une version, ouvrez l'onglet Historique de la carte du projet.";
  return { text: [`Derniers enregistrements du projet ${describe(project)} :`, ...lines, more].join("\n") };
}

async function confirmDelete(project: ProjectInfo): Promise<HubChatReply> {
  const files = await listProjectFiles(project.id);
  return {
    text: `Supprimer définitivement le projet ${describe(project)} et ses ${files.length} fichier(s) du disque ? Cette action est irréversible. Répondez « oui » ou « non », ou utilisez les boutons.`,
    confirmation: {
      label: `Supprimer « ${project.name} »`,
      cancelText: `Suppression annulée : le projet ${describe(project)} est conservé.`,
      run: async () => {
        try {
          await deleteProject(project.id);
          notifyHubProjectsChanged();
          return { text: `Le projet ${describe(project)} a été supprimé.` };
        } catch (error) {
          return errorReply(error);
        }
      },
    },
  };
}

function openTool(tool: HubTool, project: ProjectInfo | null): HubChatReply {
  return {
    text: project
      ? `J'ouvre ${tool.label} pour le projet ${describe(project)}.`
      : `J'ouvre ${tool.label} en mode démo (sans projet).`,
    navigateTo: hubToolHref(tool, project?.id ?? null),
  };
}

const UNKNOWN_TEXT =
  "Je n'ai pas compris cette demande. Je sais lister, créer, renommer et supprimer des projets, donner leur avancement et ouvrir un outil. Dites « aide » pour des exemples.";

export async function respondToHubChat(request: string): Promise<HubChatReply> {
  const text = normalize(request.trim());

  if (/^(aide|help|\?)|que (sais|peux)[- ]tu|qu.est.ce que tu (sais|peux)|comment (ca|tu) (marche|fonctionne)/.test(text)) {
    return { text: HELP_TEXT };
  }

  try {
    // Création d'abord : le nom du projet peut contenir un nom d'outil (« crée un projet AnimFlow »).
    const create = text.match(
      /\b(?:(?:cree[rsz]?|ajoute[rsz]?)\s+(?:un\s+)?(?:nouveau\s+)?|nouveau\s+)projet\b\s*(?:(?:nomme|appele|intitule)e?\s+|:\s*)?(.*)$/,
    );
    if (create) {
      const name = trailingGroup(request.trim(), create, create[1]);
      const id = await createProject(name);
      notifyHubProjectsChanged();
      const label = name || `Projet ${id}`;
      return {
        text: `Projet « ${label} » créé (n°${id}). Prochaine étape : la maquette. Dites « ouvre ScreenDraft pour le projet ${id} ».`,
      };
    }

    const detail = /\bhistorique\b|\bversions?\b/.test(text)
      ? { run: projectHistory, example: "historique du projet 2" }
      : /\bfichiers?\b/.test(text)
        ? { run: projectFiles, example: "fichiers du projet 2" }
        : /\bou en est\b|\bavancement\b|\betat\b|\bstatut\b|\bsuivi\b|\betapes?\b/.test(text)
          ? { run: projectStatus, example: "où en est le projet 2 ?" }
          : null;
    const tool = findTool(text);

    // Sans dossier de travail (ou sans autorisation), ouvrir un outil en mode démo reste possible.
    const projects = await listProjects().catch((error: unknown) => {
      if (tool && !detail && !/\bprojet\b|#\s*\d/.test(text)) return null;
      throw error;
    });
    if (projects === null) return tool ? openTool(tool, null) : { text: UNKNOWN_TEXT };

    const rename = text.match(/\brenomm\w*\s+(?:le\s+)?(?:projet\s+)?(.+?)\s+en\s+(.+)$/);
    if (rename) {
      const ref = findProject(/^\d+$/.test(rename[1].trim()) ? `projet ${rename[1]}` : rename[1], projects);
      if (ref.kind !== "found") return askWhichProject(ref, projects, "renomme le projet 2 en Pâtisserie");
      const name = trailingGroup(request.trim(), rename, rename[2]);
      if (!name) return { text: "Quel nouveau nom ? Par exemple : « renomme le projet 2 en Pâtisserie »." };
      await renameProject(ref.project.id, name);
      notifyHubProjectsChanged();
      return { text: `Le projet n°${ref.project.id} s'appelle maintenant « ${name} ».` };
    }

    if (/\b(supprim\w*|efface\w*|detrui\w*)\b/.test(text)) {
      const ref = findProject(text, projects);
      if (ref.kind !== "found") return askWhichProject(ref, projects, "supprime le projet 2");
      return await confirmDelete(ref.project);
    }

    if (detail) {
      const ref = findProject(text, projects);
      // Un seul projet : pas besoin de le préciser.
      if (ref.kind === "none" && projects.length === 1) return await detail.run(projects[0]);
      if (ref.kind !== "found") return askWhichProject(ref, projects, detail.example);
      return await detail.run(ref.project);
    }

    // Après l'avancement : « où en est la maquette du projet 2 » ne doit pas ouvrir ScreenDraft.
    if (tool) {
      const ref = findProject(text, projects);
      if (ref.kind === "unknown") return askWhichProject(ref, projects, `ouvre ${tool.label} pour le projet 1`);
      return openTool(tool, ref.kind === "found" ? ref.project : null);
    }

    if (/\bprojets\b/.test(text)) return { text: projectListText(projects) };
  } catch (error) {
    return errorReply(error);
  }

  return { text: UNKNOWN_TEXT };
}
