// Tests du moteur de l'assistant du Hub, sur un stockage de projets simulé en mémoire.
// Lancement depuis la racine (Node 22+) : node --test components/hub/hub-chat.test.mjs

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { beforeEach, test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

// Charge le TypeScript local sans ajouter de runner ni modifier la config partagée (même méthode que CodeForge).
function load(name, imports = {}) {
  const exports = {};
  const source = readFileSync(new URL(name, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  runInNewContext(outputText, {
    exports,
    DOMException,
    require: (name) => {
      assert.ok(name in imports, `Import inattendu : ${name}`);
      return imports[name];
    },
  });
  return exports;
}

// --- Stockage simulé (remplace @/lib/project-fs) --------------------------------

class ProjectFsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

let disk;

function resetDisk() {
  disk = {
    folder: "factory-data",
    hasFolder: true,
    granted: true,
    pickAborts: false,
    projects: [
      { id: 1, name: "Boulangerie" },
      { id: 2, name: "Site Animations" },
    ],
    files: { 1: [{ name: "maquette.json", size: 10, lastModified: Date.UTC(2026, 0, 1) }] },
    history: {},
    restored: [],
  };
}

const guard = () => {
  if (!disk.hasFolder) throw new ProjectFsError("no-folder", "Aucun dossier de travail : choisissez-le depuis le Hub.");
};

const projectFs = {
  ProjectFsError,
  async listProjects() {
    guard();
    return disk.projects.map((p) => ({ ...p }));
  },
  async createProject(name = "") {
    guard();
    const id = Math.max(0, ...disk.projects.map((p) => p.id)) + 1;
    disk.projects.push({ id, name: name || `Projet ${id}` });
    return id;
  },
  async renameProject(id, name) {
    disk.projects.find((p) => p.id === id).name = name;
  },
  async deleteProject(id) {
    disk.projects = disk.projects.filter((p) => p.id !== id);
  },
  async listProjectFiles(id) {
    if (!disk.projects.some((p) => p.id === id)) throw new ProjectFsError("project-not-found", `Le projet ${id} n'existe pas.`);
    return disk.files[id] ?? [];
  },
  async listProjectHistory(id) {
    return [...(disk.history[id] ?? [])].sort((a, b) => b.savedAt - a.savedAt);
  },
  async restoreFileVersion(id, filename, versionId) {
    disk.restored.push(`${id}/${filename}@${versionId}`);
  },
  async pickDataFolder() {
    if (disk.pickAborts) throw new DOMException("Fermé", "AbortError");
    disk.folder = "nouveau-dossier";
    disk.hasFolder = true;
    return { name: disk.folder };
  },
  async requestFolderAccess() {
    return disk.granted;
  },
  async getFolderStatus() {
    if (!disk.hasFolder) return { state: "no-folder" };
    return disk.granted ? { state: "ready", folderName: disk.folder } : { state: "needs-permission", folderName: disk.folder };
  },
};

function save(projectId, name, lastModified) {
  (disk.files[projectId] ??= []).push({ name, size: 1, lastModified });
}

// --- Modules du Hub ------------------------------------------------------------

const svg = { default: { src: "logo.svg" } };
const tools = load("hub-tools.ts", {
  "@/components/hub/logos/screendraft-mark.svg": svg,
  "@/components/hub/logos/codeforge-mark.svg": svg,
  "@/components/hub/logos/animflow-mark.svg": svg,
});
const events = load("hub-project-events.ts");
const guideModule = load("hub-chat-guide.ts", { "@/lib/project-fs": projectFs, "@/components/hub/hub-tools": tools });
const chat = load("hub-chat.ts", {
  "@/lib/project-fs": projectFs,
  "@/components/hub/hub-chat-guide": guideModule,
  "@/components/hub/hub-project-events": events,
  "@/components/hub/hub-tools": tools,
});
const text = load("HubChatText.tsx", { "react/jsx-runtime": require("react/jsx-runtime") });

/** Conversation : enchaîne les demandes en gardant le contexte, comme HubChat. */
function conversation() {
  const context = { guide: null, currentProject: null };
  return {
    context,
    apply(reply) {
      if (reply.guide !== undefined) context.guide = reply.guide;
      if (reply.currentProject !== undefined) context.currentProject = reply.currentProject;
      return reply;
    },
    async say(request) {
      return this.apply(await chat.respondToHubChat(request, context));
    },
  };
}

beforeEach(resetDisk);

// --- Projets -------------------------------------------------------------------

test("crée un projet, garde son nom d'origine et le retient", async () => {
  const c = conversation();
  const reply = await c.say("Crée un projet « Pâtisserie Dupont »");
  assert.match(reply.text, /Pâtisserie Dupont/);
  assert.equal(disk.projects.at(-1).name, "Pâtisserie Dupont");
  assert.equal(c.context.currentProject.id, 3);
});

test("« ajoute une animation au projet 2 » ne crée pas de projet", async () => {
  await conversation().say("ajoute une animation au projet 2");
  assert.equal(disk.projects.length, 2);
});

test("renomme un projet cité par son nom ou par « -le »", async () => {
  const c = conversation();
  await c.say("renomme Boulangerie en Boulangerie Bio");
  assert.equal(disk.projects[0].name, "Boulangerie Bio");
  await c.say("renomme-le en Site en ligne");
  assert.equal(disk.projects[0].name, "Site en ligne");
});

test("la suppression attend une confirmation et oublie le projet en cours", async () => {
  const c = conversation();
  const reply = await c.say("supprime le projet deux");
  assert.ok(reply.confirmation, "confirmation demandée");
  assert.equal(disk.projects.length, 2, "rien n'est supprimé avant confirmation");
  c.apply(await reply.confirmation.run());
  assert.deepEqual(
    disk.projects.map((p) => p.id),
    [1],
  );
  assert.equal(c.context.currentProject, null);
});

test("demande de préciser le projet quand il y en a plusieurs", async () => {
  const reply = await conversation().say("où en est le projet ?");
  assert.match(reply.text, /De quel projet/);
});

// --- Outils et projet en cours ---------------------------------------------------

test("ouvre un outil en démo sans projet, puis sur le projet en cours", async () => {
  const c = conversation();
  assert.equal((await c.say("ouvre ScreenDraft")).navigateTo, "/screendraft");
  await c.say("où en est le projet 1 ?");
  assert.equal((await c.say("ouvre CodeForge")).navigateTo, "/codeforge/generator?project_id=1");
  assert.equal((await c.say("ouvre AnimFlow en démo")).navigateTo, "/animations");
});

test("reconnaît les noms d'outils avec une faute de frappe", async () => {
  const c = conversation();
  assert.equal((await c.say("ouvre screndraft pour le projet 1")).navigateTo, "/screendraft?project_id=1");
  assert.equal((await c.say("lance codefroge en démo")).navigateTo, "/codeforge/generator");
});

test("« où en est la maquette » donne l'avancement au lieu d'ouvrir ScreenDraft", async () => {
  const reply = await conversation().say("où en est la maquette de Boulangerie");
  assert.equal(reply.navigateTo, undefined);
  assert.match(reply.text, /ScreenDraft : \*\*fait\*\*/);
  assert.match(reply.text, /CodeForge : \*\*à faire\*\*/);
});

test("sans dossier : un outil s'ouvre en démo, le reste explique quoi faire", async () => {
  disk.hasFolder = false;
  const c = conversation();
  assert.equal((await c.say("ouvre le générateur")).navigateTo, "/codeforge/generator");
  const reply = await c.say("liste mes projets");
  assert.equal(reply.isError, true);
  assert.match(reply.text, /choisis le dossier/);
});

// --- Dossier de travail ----------------------------------------------------------

test("choisir un dossier arrête le parcours et oublie le projet en cours", async () => {
  const c = conversation();
  await c.say("guide-moi pour le projet 2");
  const reply = await c.say("change de dossier");
  assert.match(reply.text, /nouveau-dossier/);
  assert.equal(c.context.guide, null);
  assert.equal(c.context.currentProject, null);
});

test("choix du dossier annulé : rien ne change", async () => {
  disk.pickAborts = true;
  const c = conversation();
  await c.say("guide-moi pour le projet 2");
  const reply = await c.say("choisis le dossier");
  assert.match(reply.text, /annulé/);
  assert.notEqual(c.context.guide, null);
});

// --- Historique ------------------------------------------------------------------

test("restaure la version précédente après confirmation", async () => {
  const v = (filename, savedAt) => ({ filename, versionId: String(savedAt), savedAt, size: 1 });
  disk.history[1] = [v("maquette.json", 100), v("maquette.json", 200), v("page.html", 300)];
  const reply = await conversation().say("restaure la version précédente de la maquette du projet 1");
  assert.ok(reply.confirmation);
  assert.deepEqual(disk.restored, []);
  await reply.confirmation.run();
  assert.deepEqual(disk.restored, ["1/maquette.json@100"]);
});

// --- Parcours guidé --------------------------------------------------------------

test("parcours guidé : vérifie le fichier de chaque étape et valide plusieurs étapes d'un coup", async () => {
  const c = conversation();
  const start = await c.say("crée un projet Café et guide-moi");
  assert.equal(start.actions[0].href, "/screendraft?project_id=3");
  const { stepStartedAt } = c.context.guide;

  // Retour au Hub sans rien enregistrer : on reste à l'étape 1.
  c.apply(await guideModule.checkHubGuide(c.context.guide, false));
  assert.equal(c.context.guide.step, 0);

  // ScreenDraft puis CodeForge enregistrés sans repasser par le Hub.
  save(3, "maquette.json", stepStartedAt + 1000);
  save(3, "page.html", stepStartedAt + 2000);
  const back = c.apply(await guideModule.checkHubGuide(c.context.guide, false));
  assert.equal(c.context.guide.step, 2);
  assert.match(back.text, /faite aussi/);

  // AnimFlow n'écrit pas de fichier : l'utilisateur déclare la fin de l'étape.
  await c.say("terminé");
  assert.equal(c.context.guide, null);
});

test("parcours guidé : un fichier antérieur au parcours ne valide pas l'étape", async () => {
  const c = conversation();
  await c.say("guide-moi pour Boulangerie"); // maquette.json existe déjà : départ à l'étape 2
  assert.equal(c.context.guide.step, 1);
  save(1, "page.html", 0);
  const reply = c.apply(await guideModule.checkHubGuide(c.context.guide, false));
  assert.equal(c.context.guide.step, 1);
  assert.match(reply.text, /pas été réenregistré/);
});

// --- Mise en forme -----------------------------------------------------------------

test("le texte annoncé aux lecteurs d'écran n'a ni gras ni puces", () => {
  assert.equal(text.hubChatPlainText("**2 projets** :\n• **Café** (n°3)\n✓ Étape 1"), "2 projets :\nCafé (n°3)\nÉtape 1");
});
