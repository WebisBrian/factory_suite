# FactorySuite — Guide de développement des squads

Oct 28, 2026 · @Ronan

## 1. Vue d'ensemble

FactorySuite est une seule application Next.js qui enchaîne trois outils : **Screendraft** (maquette → JSON), **Générateur** (JSON → HTML/CSS) et **Animations** (HTML/CSS → animations). Le **Hub** (page `/`) choisit le dossier de travail, crée les projets et relie les trois outils.

Les outils ne s'appellent jamais entre eux. Ils communiquent uniquement par des **fichiers écrits sur le disque de l'utilisateur**, dans le dossier du projet courant.

| Contrainte | Conséquence pour vous |
| --- | --- |
| Pas de backend | Aucune API route, Server Action, base de données ni appel serveur. Tout se passe dans le navigateur. |
| Export statique (`output: "export"`) | Le site est un dossier `out/` servi par nginx dans Docker. Pas de `cookies()`, `headers()`, redirects, routes dynamiques sans `generateStaticParams`, ni `next/image` par défaut. |
| File System Access API | Fonctionne sur **Chrome et Edge uniquement**. Firefox/Safari = mode démo seulement. |
| 4 squads, 1 repo, 1 journée | Le risque n°1 est le conflit Git. Chaque squad reste dans son dossier. |
| Routes autonomes | Chaque outil doit tourner seul sur des fixtures, sans attendre l'outil d'avant. |

&#91;embedded content: flux des fichiers · noms proposés, à valider (section 6)\]

Chaque outil écrit son fichier et lit celui de l'outil précédent, dans le même dossier projet. Le Hub ne fait que choisir le dossier et transmettre le `project_id`.

## 2. Fonctionnement actuel du Hub

Le Hub est déjà en place : il gère le dossier de travail, la liste des projets et la navigation entre outils. Vous n'avez rien à recoder de tout ça.

### Le dossier de travail

1. Au premier lancement, l'utilisateur clique sur **Choisir le dossier** dans le Hub. Le navigateur ouvre un sélecteur de dossier.
2. Le Hub enregistre le « handle » de ce dossier dans **IndexedDB** (base `factorysuite`, clé `root`).
3. IndexedDB est partagé par toutes les pages du même site. Vos routes `/screendraft`, `/generator`, `/animations` retrouvent donc ce dossier toutes seules via `@/lib/project-fs`.
4. Après un rechargement, Chrome peut redemander l'autorisation. Le Hub affiche alors **Autoriser**. Dans vos pages, l'autorisation est redemandée automatiquement au moment d'une lecture/écriture déclenchée par un clic.

La variable `NEXT_PUBLIC_FACTORY_DATA_DIR` (passée au `docker build`) sert seulement à **indiquer** à l'utilisateur quel dossier choisir. Le navigateur ne peut pas l'ouvrir tout seul.

### Les projets

- Un projet = un sous-dossier numéroté du dossier de travail : `1/`, `2/`, `3/`…
- **Nouveau projet** crée le dossier suivant (numéro max + 1).
- Chaque carte projet liste les fichiers présents (nom, taille, date) et propose les trois outils.

Arborescence sur le disque :

```
<dossier de travail>/
  1/
    maquette.json      ← écrit par Screendraft
    page.html          ← écrit par le Générateur
    ...
  2/
    ...
```

(Les noms de fichiers ci-dessus sont des exemples : ils restent à valider, voir section 6.)

### Le passage de projet entre outils

Le projet courant voyage **dans l'URL** : `/generator?project_id=3`. La barre du haut (app switcher Sd / Gn / An) garde ce `project_id` quand on passe d'un outil à l'autre. Sans `project_id`, les liens ouvrent les outils en **mode démo**.

| URL | Ce que votre page doit faire |
| --- | --- |
| `/generator?project_id=3` | Lire/écrire dans `<dossier>/3/` |
| `/generator` | Mode démo sur les fixtures, aucun accès disque |
| `/generator?project_id=abc` | `useProjectId()` renvoie `null` → mode démo |

## 3. Structure du repo et ownership

Règle d'or : **chaque squad ne modifie que ses deux dossiers**, et n'importe jamais le code d'un autre squad. Le seul code partagé que vous importez est celui de `lib/` (fourni par le Hub).

```
app/
  layout.tsx            shell + barre du haut          [HUB, gelé]
  page.tsx              dashboard des projets          [HUB, gelé]
  globals.css           styles globaux                 [interdit]
  screendraft/page.tsx  route Screendraft              [squad Screendraft]
  generator/page.tsx    route Générateur               [squad Générateur]
  animations/page.tsx   route Animations               [squad Animations]
components/
  hub/                  composants du Hub              [HUB, gelé]
  screendraft/          vos composants                 [squad Screendraft]
  generator/            vos composants                 [squad Générateur]
  animations/           vos composants                 [squad Animations]
lib/
  project-fs/           lecture/écriture disque        [HUB, gelé]
  contracts/            types des fichiers échangés    [HUB, gelé — à créer]
  fixtures/             données de démo                [HUB, gelé — à créer]
next.config.ts, tsconfig.json, Dockerfile, nginx.conf  [HUB, gelé]
```

| Squad | Branche | Dossiers modifiables | Route |
| --- | --- | --- | --- |
| Hub | `squad/hub` | `app/layout.tsx`, `app/page.tsx`, `components/hub/`, `lib/`, config, Docker | `/` |
| Screendraft | `squad/screendraft` | `app/screendraft/`, `components/screendraft/` | `/screendraft` |
| Générateur | `squad/generator` | `app/generator/`, `components/generator/` | `/generator` |
| Animations | `squad/animations` | `app/animations/`, `components/animations/` | `/animations` |

**Les noms de dossiers de route sont imposés.** La barre du haut et les cartes projet pointent vers `/screendraft`, `/generator` et `/animations`. Une page créée ailleurs (par ex. `app/maquette/`) ne sera jamais atteinte depuis le Hub.

Vous pouvez créer autant de fichiers que vous voulez **dans** vos dossiers (sous-composants, hooks, utilitaires `components/generator/utils.ts`…). Pas de nouveau dossier à la racine du repo sans accord du Hub.

Besoin d'un changement dans une zone gelée (un type, une fonction de `project-fs`, un style global) ? Demandez au Hub, ne le faites pas vous-même.

## 4. Référence de l'API `@/lib/project-fs`

Tout accès disque passe par cet import unique. N'appelez jamais `showDirectoryPicker`, `indexedDB` ou les handles vous-même, et n'importez pas les sous-fichiers (`@/lib/project-fs/project-fs`).

```ts
import {
  useProjectId, useProjectFolder,
  readProjectText, readProjectFile, writeProjectFile,
  listProjectFiles, deleteProjectFile,
  ProjectFsError,
} from "@/lib/project-fs";
```

### Hooks (composants client uniquement)

| Hook | Retour | À savoir |
| --- | --- | --- |
| `useProjectId()` | `number \| null` | Lit `?project_id=` dans l'URL. `null` si absent ou invalide → mode démo. **Le composant doit être sous un `<Suspense>`.** |
| `useProjectFolder()` | `{ status, refresh, pickFolder, requestAccess }` | Statut du dossier : `unsupported`, `no-folder`, `needs-permission`, `ready`. Utile pour afficher un bouton « Autoriser » dans votre page. |

### Fonctions (async)

| Fonction | Retour | Comportement |
| --- | --- | --- |
| `readProjectText(id, nom)` | `string \| null` | Contenu texte. `null` si le fichier ou le projet n'existe pas. |
| `readProjectFile(id, nom)` | `File \| null` | Pour un binaire (image…). `null` si absent. |
| `writeProjectFile(id, nom, contenu)` | `void` | Crée ou **remplace** le fichier. `contenu` : `string`, `Blob` ou `ArrayBuffer`. Crée le dossier projet si besoin. |
| `listProjectFiles(id)` | `{ name, size, lastModified }[]` | Fichiers du projet, triés par nom. |
| `deleteProjectFile(id, nom)` | `void` | Supprime **votre** fichier. Jamais celui d'un autre squad. |

### Noms de fichiers valides

- Pas de `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`.
- Ne commence pas par `.`, 255 caractères max.
- Pas de sous-dossier : tout est à plat dans `<dossier>/<project_id>/`.

### Erreurs : `ProjectFsError`

Toutes les fonctions peuvent lever une `ProjectFsError` avec un `code` :

| `code` | Cause | Quoi afficher |
| --- | --- | --- |
| `unsupported` | Firefox, Safari | « Utilisez Chrome ou Edge » + rester en mode démo |
| `no-folder` | Aucun dossier choisi dans le Hub | « Choisissez le dossier dans le Hub » + lien vers `/` |
| `permission-denied` | L'utilisateur a refusé l'accès | « Accès refusé » + bouton réessayer ou lien vers `/` |
| `invalid-project-id` | `project_id` ≤ 0 ou non entier | Lien vers `/` |
| `invalid-filename` | Nom de fichier interdit | Bug de votre code : corrigez le nom |
| `project-not-found` | Le dossier du projet n'existe pas | Lien vers `/` |

`error.message` est déjà rédigé en français : vous pouvez l'afficher tel quel.

### Permission et clic utilisateur

Chrome n'accorde l'accès qu'en réponse à un geste utilisateur. Une lecture au chargement de la page (`useEffect`) marche si l'accès est déjà accordé, sinon elle lève `permission-denied`. Dans ce cas, affichez un bouton « Charger le projet » : la même lecture relancée depuis le clic déclenchera l'invite. **Les écritures se font toujours depuis un clic.**

## 5. Développer sa route : la page modèle

Chaque squad crée **deux fichiers de départ** : un `page.tsx` minimal dans `app/<route>/`, et un composant client dans `components/<squad>/` qui fait tout le travail. L'exemple ci-dessous est celui du Générateur ; adaptez les noms pour Screendraft et Animations. Ce code passe le lint et le typecheck du repo.

### Étape 1 — `app/generator/page.tsx`

Le `page.tsx` reste un composant serveur. Il pose le `<main>` et le `<Suspense>` obligatoire (sinon `npm run build` échoue à cause de `useSearchParams`).

```tsx
import { Suspense } from "react";
import { GeneratorApp } from "@/components/generator/GeneratorApp";

export default function GeneratorPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
      <Suspense fallback={<p className="text-sm text-zinc-500">Chargement…</p>}>
        <GeneratorApp />
      </Suspense>
    </main>
  );
}
```

### Étape 2 — `components/generator/GeneratorApp.tsx`

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readProjectText, useProjectId, writeProjectFile } from "@/lib/project-fs";
import type { Maquette } from "@/lib/contracts";       // à créer par le Hub
import { maquetteFixture } from "@/lib/fixtures";       // à créer par le Hub
import { generateHtml } from "@/components/generator/generate-html"; // votre logique

const INPUT_FILE = "maquette.json"; // produit par Screendraft
const OUTPUT_FILE = "page.html";    // produit par nous

type LoadResult = { ok: true; maquette: Maquette } | { ok: false; error: string };

async function loadMaquette(projectId: number): Promise<LoadResult> {
  try {
    const text = await readProjectText(projectId, INPUT_FILE);
    if (text === null) {
      return { ok: false, error: `${INPUT_FILE} introuvable dans le projet ${projectId} : passez d'abord par Screendraft.` };
    }
    return { ok: true, maquette: JSON.parse(text) as Maquette };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function GeneratorApp() {
  const projectId = useProjectId();
  const [result, setResult] = useState<LoadResult | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Chargement initial (si l'accès est déjà accordé).
  useEffect(() => {
    if (projectId === null) return;
    let cancelled = false;
    loadMaquette(projectId).then((next) => {
      if (!cancelled) setResult(next);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Mode démo : fixture. Mode projet : fichier lu sur le disque.
  const maquette = projectId === null ? maquetteFixture : result?.ok ? result.maquette : null;

  // Relance depuis un clic : déclenche l'invite d'autorisation si besoin.
  async function handleReload() {
    if (projectId !== null) setResult(await loadMaquette(projectId));
  }

  async function handleSave() {
    if (projectId === null || maquette === null) return;
    try {
      await writeProjectFile(projectId, OUTPUT_FILE, generateHtml(maquette));
      setSaveMessage(`${OUTPUT_FILE} enregistré dans le projet ${projectId}.`);
    } catch (e) {
      setSaveMessage(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-400">
        {projectId === null ? "Mode démo (fixtures)" : `Projet #${projectId}`}
      </p>

      {result && !result.ok && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <p>{result.error}</p>
          <div className="mt-2 flex gap-4">
            <button type="button" onClick={handleReload} className="underline">Réessayer</button>
            <Link href="/" className="underline">Retour au Hub</Link>
          </div>
        </div>
      )}

      {maquette && <pre className="overflow-auto rounded-xl bg-black/30 p-4 text-xs">{generateHtml(maquette)}</pre>}

      {projectId !== null && (
        <button type="button" onClick={handleSave} disabled={maquette === null}
          className="self-start rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black disabled:opacity-50">
          Enregistrer {OUTPUT_FILE}
        </button>
      )}
      {saveMessage && <p className="text-sm text-zinc-300">{saveMessage}</p>}
    </div>
  );
}
```

Tant que `@/lib/contracts` et `@/lib/fixtures` n'existent pas, définissez temporairement le type et la fixture dans un fichier de votre dossier (par ex. `components/generator/temp-fixture.ts`), puis basculez sur les imports `@/lib/...` dès que le Hub les publie.

### Pourquoi ce motif

1. **`useEffect` + `.then` + `cancelled`** : le lint du repo (`react-hooks/set-state-in-effect`) refuse un `setState` appelé directement dans un effet. Ce motif est celui déjà utilisé dans le Hub.
2. **Le mode démo est calculé, pas chargé** : `projectId === null` → fixture immédiate, aucun accès disque.
3. **« Réessayer » est un clic** : si Chrome a perdu l'autorisation, la lecture depuis ce bouton affiche l'invite.
4. **L'écriture est dans un handler de clic**, jamais dans un effet.
5. **Le message d'erreur renvoie vers le Hub**, qui sait choisir le dossier ou créer le projet.

### Ce que fait chaque squad

| Squad | Lit | Écrit | Mode démo |
| --- | --- | --- | --- |
| Screendraft | Rien (ou son propre fichier pour reprendre un travail) | La maquette au format JSON | Éditeur vide ou maquette d'exemple, sans bouton Enregistrer |
| Générateur | La maquette JSON de Screendraft | Le HTML/CSS généré | Fixture maquette → aperçu du HTML |
| Animations | Le HTML/CSS du Générateur | Les animations (+ éventuellement un HTML final animé) | Fixture HTML → aperçu animé |

## 6. Échanges entre outils : fichiers et contrats

Les noms de fichiers et leurs formats ne sont **pas encore fixés**. C'est la première décision à prendre, avant tout développement : sans elle, chaque squad code contre un format que l'outil précédent ne produira jamais.

### Proposition de noms (à valider)

| Fichier | Écrit par | Lu par | Contenu |
| --- | --- | --- | --- |
| `maquette.json` | Screendraft | Générateur | Arbre des éléments de la maquette (type `Maquette`) |
| `page.html` | Générateur | Animations | Page HTML générée |
| `page.css` | Générateur | Animations | Styles de la page (si séparés du HTML) |
| `animations.json` | Animations | Animations, Hub | Liste des animations/événements appliqués |
| `page-animee.html` | Animations | Utilisateur final | Rendu final autonome (optionnel) |

Règles sur les fichiers :

- **Un fichier n'a qu'un seul auteur.** On lit les fichiers des autres, on n'écrit que les siens.
- Un squad peut créer des fichiers internes en plus (brouillon, préférences) : préfixez-les par le nom du squad (`screendraft-brouillon.json`) pour éviter les collisions.
- Toujours gérer le cas `null` (fichier absent) : l'utilisateur peut ouvrir le Générateur avant d'avoir fait sa maquette.
- Le JSON lu sur le disque peut être invalide ou d'une ancienne version : entourez `JSON.parse` d'un `try/catch` et affichez un message clair.

### Les contrats TypeScript (`lib/contracts/`)

Le Hub publiera les types partagés dans `@/lib/contracts`, par exemple `Maquette` pour `maquette.json`. Les deux squads concernés (le producteur et le consommateur) valident la forme ensemble ; le Hub l'écrit. Ensuite :

- Le producteur type ce qu'il écrit : `const data: Maquette = …; writeProjectFile(id, "maquette.json", JSON.stringify(data))`.
- Le consommateur type ce qu'il lit : `JSON.parse(text) as Maquette`.
- Un changement de format = une demande au Hub, annoncée aux deux squads. Ajoutez de préférence un champ `version` à chaque JSON.

### Décisions à prendre ce matin

- [ ] Screendraft + Générateur : nom et structure de `maquette.json`
- [ ] Générateur + Animations : HTML et CSS dans un seul fichier ou deux ? Conventions d'attributs (`id`, `data-*`) pour que les animations ciblent les éléments
- [ ] Animations : format de sortie (JSON d'animations, HTML final, les deux ?)
- [ ] Hub : publier `lib/contracts/` et `lib/fixtures/` dès que les formats sont validés

## 7. Mode démo et fixtures

Sans `project_id` dans l'URL, votre route doit fonctionner **sans aucun accès disque**, sur une fixture compilée dans le code. C'est le filet de sécurité de la soutenance : même si l'enchaînement complet ne marche pas en fin de journée, chaque outil reste démontrable seul.

### Comment ça marche

- Une fixture est un module TypeScript importé normalement : `import { maquetteFixture } from "@/lib/fixtures"`.
- Au `npm run build`, Next l'intègre dans le JavaScript de la page. **Pas de fichier à télécharger, pas de `fetch`.**
- Le mode démo marche donc partout : Firefox, Safari, sans dossier choisi, sans autorisation.

### Fixtures prévues (à créer par le Hub)

| Export | Type | Utilisé par |
| --- | --- | --- |
| `maquetteFixture` | `Maquette` (objet) | Générateur, en entrée |
| `pageHtmlFixture` (+ `pageCssFixture`) | `string` | Animations, en entrée |
| `animationsFixture` | type d'Animations | Hub / démo finale |

Chaque fixture doit être un exemple **réaliste et valide** du contrat : c'est la référence que l'outil suivant utilise pour se développer. Si l'outil amont ne sait pas produire exactement ça, il faut corriger l'un ou l'autre, pas les laisser diverger.

### En attendant `lib/fixtures/`

Créez une fixture temporaire dans votre dossier (`components/<squad>/temp-fixture.ts`) en suivant le format convenu à la section 6. Le jour où le Hub publie `@/lib/fixtures`, remplacez l'import et supprimez votre fichier.

### Idée pour la soutenance

Un bouton **« Projet de démo »** dans le Hub pourrait créer un projet et y copier les fixtures (`writeProjectFile`). On montre alors l'enchaînement complet sur de vrais fichiers, même si un outil n'est pas terminé. À décider par le Hub.

## 8. UI et style dans le cadre du Hub

Votre page s'affiche **sous la barre du Hub, sur un fond sombre (`#0b0b10`) avec un texte clair (`zinc-100`) hérité**. Concevez pour ce fond, ou posez votre propre fond sur le conteneur de votre page.

### Identité visuelle de la suite

Le Hub suit le style « suite créative » : une couleur et un monogramme par outil. Reprenez la couleur de votre outil pour vos boutons principaux et vos accents.

| Outil | Monogramme | Couleur d'accent (Tailwind) | Fond de l'icône |
| --- | --- | --- | --- |
| Screendraft | Sd | `sky-300` / `sky-400` / `sky-500` | `#001e36` |
| Générateur | Gn | `emerald-300` / `emerald-400` / `emerald-500` | `#062b1f` |
| Animations | An | `fuchsia-300` / `fuchsia-400` / `fuchsia-500` | `#2a0a3d` |
| Hub | Fs | dégradé `from-orange-500 via-pink-500 to-violet-600` | — |

Classes récurrentes du Hub, à réutiliser pour rester cohérent :

| Élément | Classes |
| --- | --- |
| Carte / panneau | `rounded-2xl border border-white/10 bg-white/3 p-5` |
| Texte secondaire | `text-sm text-zinc-400` (très discret : `text-zinc-500`) |
| Bouton secondaire | `rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10` |
| Bouton principal (ex. Générateur) | `rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-400` |
| Code / nom de fichier | `rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-zinc-200` |
| Erreur | `rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300` |

### Règles de style

- **Tailwind uniquement.** Pas de fichier `.css` global, **ne jamais modifier `app/globals.css`**.
- Ne modifiez pas `app/layout.tsx` : la barre et le fond viennent du Hub.
- Largeur de contenu conseillée : `mx-auto w-full max-w-6xl px-4` (comme le Hub). Un éditeur plein écran peut s'en passer.
- Pour afficher du HTML généré (Générateur, Animations), utilisez une `<iframe srcDoc={html}>` : les styles de la page générée ne fuient pas dans l'app, et ceux de l'app ne la cassent pas.
- Pas de `next/image` avec le loader par défaut (incompatible avec l'export statique) : utilisez `<img>`.
- Nommez vos composants avec le préfixe du squad : `GeneratorSidebar`, pas `Sidebar`.

## 9. Règles communes

Ces règles sont les mêmes pour les trois squads. Si une seule n'est pas respectée, l'intégration casse : build en échec, conflit Git ou fichier écrasé.

### Obligatoire

| Règle | Pourquoi |
| --- | --- |
| Route dans `app/screendraft/`, `app/generator/` ou `app/animations/` | Le Hub et la barre pointent vers ces URL |
| Composant qui appelle `useProjectId()` placé sous un `<Suspense>` | Sinon `npm run build` échoue (export statique) |
| `"use client"` en tête de tout composant qui utilise des hooks ou `project-fs` | Les accès disque n'existent que dans le navigateur |
| Lire/écrire uniquement via `@/lib/project-fs` | Un seul endroit gère dossier, permissions et IndexedDB |
| Mode démo sur fixture quand `projectId === null` | Chaque route doit être démontrable seule |
| Gérer les erreurs `ProjectFsError` avec message + lien vers `/` | L'utilisateur doit savoir quoi faire |
| Écrire depuis un clic | Chrome exige un geste utilisateur pour l'autorisation |
| Gérer le fichier d'entrée absent (`null`) et le JSON invalide | L'outil amont n'a peut-être pas encore tourné |
| TypeScript strict, aucun `any` | Convention du repo |
| Imports avec l'alias `@/` | Pas de `../../../` |
| Composants préfixés par le squad (`AnimationsTimeline`) | Évite les collisions de noms |

### Interdit

- Modifier un fichier hors de vos deux dossiers (`layout.tsx`, `page.tsx` du Hub, `globals.css`, `lib/`, config, Docker).
- Importer le code d'un autre squad (`@/components/generator/...` depuis Animations, par exemple).
- Écrire ou supprimer le fichier d'un autre squad.
- Appeler `showDirectoryPicker`, `indexedDB`, `localStorage` pour partager des données entre outils.
- `postMessage`, `fetch` vers une API, Server Actions, Route Handlers (`app/**/route.ts`), `cookies()`, `headers()`, redirects/rewrites.
- Routes dynamiques (`[id]`) sans `generateStaticParams` : utilisez `?project_id=` à la place.
- `next/image` avec le loader par défaut.
- Ajouter une dépendance npm lourde sans accord du Hub (`package.json` est partagé : conflits assurés).

## 10. Workflow Git et Definition of Done

Une branche par squad, des PR vers `main`, et `build` + `lint` verts avant chaque PR. Seul le Hub intègre sur `main`.

### Au quotidien

```bash
# une fois
git checkout main && git pull
git checkout -b squad/generator        # ou squad/screendraft, squad/animations

# en boucle
git add app/generator components/generator
git commit -m "generator: aperçu HTML depuis la maquette"
git pull origin main                    # régulièrement, pour récupérer lib/ et le Hub
npm run lint && npm run build           # avant chaque push
git push -u origin squad/generator
```

- Commits petits et fréquents, préfixés par le squad.
- `git add` ciblé sur vos dossiers : jamais `git add .` si vous avez touché autre chose par erreur.
- `git status` montre un fichier hors de vos dossiers ? Annulez-le (`git restore <fichier>`) ou demandez au Hub.
- **Conflit sur un fichier gelé** (`lib/`, `layout.tsx`, config) : stop, on règle avec le Hub avant de merger.

### Lancer et tester

| Commande | Usage |
| --- | --- |
| `npm run dev` | Dev local sur http://localhost:3000 (Chrome ou Edge) |
| `npm run lint` | Doit passer sans erreur avant une PR |
| `npm run build` | Doit passer avant une PR (vérifie l'export statique) |
| `docker build --build-arg NEXT_PUBLIC_FACTORY_DATA_DIR=/chemin -t factorysuite .` | Image finale (Hub) |
| `docker run -p 8080:80 factorysuite` | Test sur http://localhost:8080 |

Pour tester le mode projet en local : ouvrez `/`, choisissez un dossier, créez un projet, puis cliquez sur votre outil dans la carte projet. Pour tester le mode démo : ouvrez directement `/generator`.

### Definition of Done (par squad)

- [ ] `/<route>` sans `project_id` fonctionne sur les fixtures, sans dossier choisi
- [ ] `/<route>?project_id=N` lit l'entrée et écrit la sortie dans `<dossier>/N/`
- [ ] Fichier d'entrée absent, JSON invalide, permission refusée : message clair + lien vers le Hub
- [ ] Le fichier produit apparaît dans la carte projet du Hub après « Rafraîchir »
- [ ] `npm run lint` et `npm run build` passent
- [ ] `git diff main --stat` ne montre que vos deux dossiers

## 11. FAQ et erreurs fréquentes

**Comment je sais quel dossier l'utilisateur a choisi ?** Vous n'en avez pas besoin. `writeProjectFile` et `readProjectText` retrouvent le dossier tout seuls (IndexedDB). Si aucun dossier n'est choisi, ils lèvent `ProjectFsError("no-folder")` : affichez un lien vers le Hub.

**Dois-je créer le dossier du projet ?** Non. Le Hub le crée (« Nouveau projet ») et `writeProjectFile` le crée de toute façon si besoin.

**Je veux tester mon outil sans passer par le Hub.** Ouvrez `/votre-route` sans paramètre : mode démo. Pour le mode projet, il faut avoir choisi le dossier une fois dans le Hub (c'est mémorisé ensuite).

**Le build échoue avec « useSearchParams() should be wrapped in a suspense boundary ».** Le composant qui appelle `useProjectId()` n'est pas sous un `<Suspense>`. Voir la page modèle, étape 1.

**Le lint signale « Calling setState synchronously within an effect ».** Vous appelez une fonction qui fait `setState` directement dans `useEffect`. Utilisez le motif `.then` + `cancelled` de la page modèle.

**J'ai `permission-denied` au chargement de la page.** Normal après un rechargement : Chrome redemande l'accès, ce qui exige un clic. Affichez un bouton « Réessayer » qui relance la lecture.

**Ça ne marche pas sur Firefox / Safari.** Normal : la File System Access API n'existe que sur Chrome et Edge. Le mode démo, lui, doit marcher partout.

**Mon texte est invisible / mes couleurs sont bizarres.** Votre page hérite du texte clair du Hub sur fond sombre. Fixez vos couleurs explicitement, ou affichez le HTML généré dans une `<iframe srcDoc>`.

**J'ai besoin d'une fonction en plus dans `project-fs` (ou d'un type dans `contracts`).** Demandez au Hub. Ne modifiez pas `lib/` vous-même, même pour une ligne.

**J'ai besoin d'une librairie npm.** Demandez au Hub avant de l'installer : `package.json` et `package-lock.json` sont partagés et génèrent des conflits. Pas de librairie qui a besoin d'un serveur.

**Je peux stocker des préférences dans `localStorage` ?** Pour un réglage purement local à votre outil (thème de l'éditeur…), oui. Pour toute donnée qu'un autre outil doit lire : non, uniquement les fichiers projet.
