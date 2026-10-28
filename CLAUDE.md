CLAUDE.md — FactorySuite Hub
Instructions pour toute instance de Claude Code travaillant sur ce repo. Ces règles priment sur les habitudes individuelles. En cas de doute : demander, ne pas deviner.
1. Contexte
FactorySuite est une chaîne de production d'interfaces, en une seule app Next.js (App Router). Pipeline : Screendraft (maquette → JSON) → Générateur (JSON → HTML/CSS) → Animations (HTML/CSS → événements/animations). Le Hub réunit les trois et suit l'avancement du projet.
Contraintes du projet :
Pas de backend. Tout est traitement client + statique. Export statique Next.js (output: "export") servi par nginx dans un conteneur Docker.
Les fichiers produits sont écrits sur le disque de l'utilisateur via la File System Access API (Chrome/Edge uniquement), dans un dossier de travail choisi une fois dans le Hub.
1 seul repo, 4 squads, 1 journée. Le risque n°1 est le conflit de merge, pas l'archi.
Les transformations (JSON→HTML, HTML→anim) sont 100% côté navigateur.
Les 4 routes sont autonomes : chacune doit tourner seule contre les fixtures, sans attendre l'amont.
Chaque outil reçoit le projet courant dans l'URL : /screendraft?project_id=3 (entier ≥ 1).
2. Qui possède quoi (ownership strict)
Zone	Propriétaire	Règle
lib/project-fs/, lib/contracts/, lib/fixtures/	Squad Hub	GELÉ. Édité par une seule personne. Ne jamais modifier sans accord du Hub.
app/layout.tsx, app/page.tsx, components/hub/	Squad Hub	Idem, gelé.
next.config.ts, tsconfig.json, Dockerfile, nginx.conf	Squad Hub	Idem, gelé.
app/screendraft/, components/screendraft/	Squad Screendraft	Libre dans son dossier.
app/generator/, components/generator/	Squad Générateur	Libre dans son dossier.
app/animations/, components/animations/	Squad Animations	Libre dans son dossier.
Règle d'or : un squad ne touche QUE son dossier. Un squad n'importe jamais le code d'un autre squad — la seule communication passe par les fichiers du projet, via @/lib/project-fs (§4).
3. Structure du repo
app/
  layout.tsx        # shell + nav         [HUB, gelé]
  page.tsx          # dashboard / suivi   [HUB, gelé]
  screendraft/      # route squad 1
  generator/        # route squad 2
  animations/       # route squad 3
components/
  <squad>/          # composants, namespacés par squad
lib/
  project-fs/       # lecture/écriture des fichiers projet   [HUB, gelé]
  contracts/        # types TS des fichiers échangés (opt.)  [HUB, gelé]
  fixtures/         # 1 JSON, 1 HTML, 1 anim valides         [HUB, gelé]
Dockerfile, nginx.conf  # conteneur : build statique + nginx    [HUB, gelé]
Ne pas créer de dossier top-level nouveau sans accord du Hub.
4. Échange de données entre applis — fichiers projet
Pas de backend, pas d'API, pas de postMessage. Chaque outil écrit ses fichiers dans le dossier de travail, sous-dossier du projet :
<dossier de travail>/<project_id>/<fichier>
Le dossier de travail est choisi UNE fois par l'utilisateur dans le Hub (/) et mémorisé (IndexedDB, même origine → partagé par toutes les routes). La variable d'env NEXT_PUBLIC_FACTORY_DATA_DIR (passée au build Docker) indique à l'utilisateur quel dossier choisir.
Toujours passer par @/lib/project-fs, jamais appeler showDirectoryPicker / IndexedDB soi-même :
"use client";
import { useProjectId, writeProjectFile, readProjectText, ProjectFsError } from "@/lib/project-fs";
const projectId = useProjectId();                                        // number | null, lu dans ?project_id=
await writeProjectFile(projectId, "maquette.json", JSON.stringify(data)); // string | Blob | ArrayBuffer
const json = await readProjectText(projectId, "maquette.json");          // string | null si absent
Autres fonctions : readProjectFile (File | null), listProjectFiles, deleteProjectFile, useProjectFolder (statut du dossier + boutons « choisir » / « autoriser »).
Règles :
Chaque squad choisit et documente ses noms de fichiers (pas de "/", pas de "..", pas de nom commençant par "."). Ne jamais écraser le fichier d'un autre squad.
useProjectId utilise useSearchParams → le composant qui l'appelle doit être dans un <Suspense>, sinon le build échoue.
Écrire depuis un handler de clic : après un rechargement, le navigateur peut redemander l'autorisation, ce qui exige un geste utilisateur.
Gérer les erreurs ProjectFsError (code : "unsupported" | "no-folder" | "permission-denied" | "invalid-project-id" | "invalid-filename" | "project-not-found") en affichant un message et un lien vers le Hub.
Sans project_id dans l'URL, la route doit rester démontrable (fixtures).
5. Conventions de code
TypeScript strict. Pas de any.
CSS : Tailwind uniquement. <!-- si le groupe a choisi CSS Modules, remplacer cette ligne -->
Interdit de modifier app/globals.css (fichier partagé → source de conflits et de styles qui fuient). Styles locaux dans les composants.
State partagé entre outils : uniquement les fichiers projet (§4). State local d'un composant : useState normal.
Export statique : interdits les Server Actions, Route Handlers, cookies/headers, rewrites/redirects, routes dynamiques sans generateStaticParams, next/image avec le loader par défaut.
Imports : alias @/ (configuré par create-next-app). Pas de chemins relatifs profonds.
Nommer les composants et fichiers en cohérence avec son squad pour éviter les collisions (GeneratorSidebar, pas Sidebar).
6. Git — anti-collision
1 branche par squad : squad/screendraft, squad/generator, squad/animations, squad/hub.
PR vers main. Jamais de commit direct sur main sauf intégration par le Hub.
Commits petits et fréquents. Pull main régulièrement.
Un conflit sur un fichier gelé (project-fs, contracts, layout, config) = stop, on règle avec le Hub avant de merger.
7. Commandes
npm run dev     # dev local
npm run build   # vérifier que le build passe AVANT de push
npm run lint
docker build --build-arg NEXT_PUBLIC_FACTORY_DATA_DIR=/chemin/du/dossier -t factorysuite .
docker run -p 8080:80 factorysuite   # http://localhost:8080 (Chrome/Edge)
Toujours faire passer build + lint avant une PR.
8. Definition of Done (par squad)
La route tourne seule contre les fixtures (démontrable sans l'amont).
Lit le project_id via useProjectId, lit/écrit ses fichiers via @/lib/project-fs.
build et lint passent.
Aucun fichier hors de son dossier modifié (hors contrats gelés).
Fallback démo : si l'intégration bout-à-bout M1→M2→M3 ne boucle pas en fin de journée, chaque route reste démontrable isolément contre les fixtures. On ne sacrifie jamais ça.
9. Pour Claude Code spécifiquement
Avant d'écrire : vérifier dans quel dossier on est et à quel squad il appartient (§2). Ne jamais éditer un dossier gelé ou le dossier d'un autre squad sans que l'utilisateur le demande explicitement.
Ne pas introduire de backend, d'API route, de Server Action, de base de données, ni de dépendance lourde sans accord — ça contredit la contrainte "no back" et casse l'export statique.
Pour lire/écrire des fichiers : uniquement @/lib/project-fs. Réutiliser les types de @/lib/contracts s'ils existent au lieu d'en inventer.
Si une tâche oblige à toucher un fichier partagé : le signaler et demander plutôt que de modifier directement.