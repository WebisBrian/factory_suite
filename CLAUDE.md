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
5 bis. Accessibilité — OBLIGATOIRE (public malvoyant)
Le site s'adresse à des personnes malvoyantes, qui utilisent un lecteur d'écran ou une extension qui lit l'élément survolé, l'agrandissement du texte et le clavier. Une fonctionnalité inaccessible n'est pas terminée.
Cadre fourni par le Hub (ne pas recoder) : police Atkinson Hyperlegible (font-sans / font-mono), fond sombre #0b0b10, contour de focus jaune sur tout élément focusable, lien « Aller au contenu », réglage A−/A+ (texte de 100 % à 200 %) dans la barre du haut.
Nom accessible : tout bouton, lien, champ et contrôle a un nom lisible. Texte visible explicite, sinon aria-label. Un bouton icône seul (×, ⋯, ▶) DOIT avoir un aria-label. Les noms répétés précisent leur cible : aria-label="Supprimer le projet Boulangerie", pas juste « Supprimer ».
Champs de formulaire : un <label htmlFor> visible pour chaque champ (le placeholder n'est pas un label). Erreurs de saisie en texte, liées au champ (aria-describedby).
Images : alt descriptif sur toute image porteuse d'information ; alt="" sur une image décorative. Icônes SVG décoratives : aria-hidden. SVG porteur de sens : role="img" + aria-label.
Contraste (fond sombre) : texte principal text-white / text-zinc-100 / text-zinc-200 ; secondaire text-zinc-300 ; text-zinc-400 au minimum. INTERDIT pour du texte : zinc-500, zinc-600, opacités (text-white/50) et texte blanc sur fond clair ou saturé (orange-500, pink-500…). Viser 7:1 pour le texte (WCAG AAA), 3:1 minimum pour les bordures de contrôles (border-zinc-500 ou plus clair).
Daltonisme : jamais d'information portée par la seule couleur. Toujours un 2e indice : texte, icône, signe (+ / −), soulignement, gras. Éviter la paire rouge/vert ; préférer bleu/orange.
Taille du texte : en unités Tailwind (rem) uniquement : text-sm (14 px) au minimum, text-base (16 px) pour le contenu. INTERDIT : text-xs, tailles en px (text-[11px]), hauteurs fixes qui coupent le texte agrandi (h-10 sur un bloc de texte), truncate sur une information utile. Tester la route avec le réglage à 200 % : rien ne doit être coupé ni se chevaucher.
Clavier : tout se fait au clavier (Tab, Entrée, Espace, Échap). Utiliser <button> / <a> / <input> natifs, jamais un <div onClick>. Ne jamais supprimer le contour de focus (pas de outline-none sur un élément interactif). Cibles cliquables de 40 px minimum (min-h-10).
Structure : un seul <h1> par page, titres hiérarchiques (h2, h3…), landmarks (<main>, <nav aria-label>, <section aria-labelledby>), listes en <ul>/<ol>. L'état d'un bouton bascule se donne avec aria-pressed, l'élément courant avec aria-current.
Annonces : messages de chargement en role="status", erreurs en role="alert" (texte « Erreur : » écrit en toutes lettres). Après une action sans changement de page (enregistrement, restauration), annoncer le résultat dans une zone role="status".
Mouvement : animations et transitions de déplacement avec motion-safe: (respect de « réduire les animations ») ; rien qui clignote plus de 3 fois par seconde.
Contenu affiché dans une iframe (HTML généré) : title sur l'<iframe> qui décrit son contenu.
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
Accessibilité (§5 bis) : utilisable entièrement au clavier, chaque contrôle a un nom accessible, rien n'est coupé avec le texte à 200 %, aucune information portée par la couleur seule.
Aucun fichier hors de son dossier modifié (hors contrats gelés).
Fallback démo : si l'intégration bout-à-bout M1→M2→M3 ne boucle pas en fin de journée, chaque route reste démontrable isolément contre les fixtures. On ne sacrifie jamais ça.
9. Pour Claude Code spécifiquement
Avant d'écrire : vérifier dans quel dossier on est et à quel squad il appartient (§2). Ne jamais éditer un dossier gelé ou le dossier d'un autre squad sans que l'utilisateur le demande explicitement.
Ne pas introduire de backend, d'API route, de Server Action, de base de données, ni de dépendance lourde sans accord — ça contredit la contrainte "no back" et casse l'export statique.
Pour lire/écrire des fichiers : uniquement @/lib/project-fs. Réutiliser les types de @/lib/contracts s'ils existent au lieu d'en inventer.
Si une tâche oblige à toucher un fichier partagé : le signaler et demander plutôt que de modifier directement.