# Animations (Anime Flow) — charte graphique

> Référence pour coder l'interface de l'outil **Animations** de FactorySuite : on importe une page HTML, on y sélectionne des éléments comme avec l'inspecteur du navigateur (F12), et on leur associe une animation et un déclencheur.
> Pour toute décision visuelle, suis cette charte. N'invente pas de nouvelles couleurs : utilise les variables de `anime-flow-theme.css`.

## Fichiers

- `anime-flow-theme.css` : toutes les variables de couleur, portées par la classe `.anime-flow` (jamais par `:root`, pour ne pas fuir vers le Hub ni les autres outils). Importé par `AnimationsApp.tsx`.
- `logos/animflow-mark.svg` : logo AnimFlow, dessiné par l'équipe Hub. Copie de `components/hub/logos/animflow-mark.svg` (un squad n'importe pas le code du Hub) : si le Hub le change, recopier le fichier.
- `../icon.svg` : icône de l'onglet (favicon de la route `/animations`), identique au logo AnimFlow. Onglet, barre du Hub et en-tête de l'outil affichent le même logo.

## Règles

1. **Aucune couleur en dur.** Dans le JSX, utilise les variables avec la syntaxe Tailwind `bg-(--surface-raised)`, `text-(--ink-muted)`, `border-(--line)`. Seule exception : l'aperçu de la page, dans l'iframe, où les variables n'existent pas (voir « Motifs »).
2. **Thèmes.** Clair par défaut, sombre automatiquement selon `prefers-color-scheme`.
3. **`motion` (violet) est la couleur signature.** Bouton principal, élément actif, sélection. **Un seul bouton `motion` plein par vue** ; les autres sont secondaires (fond `surface-raised`, bordure `line-strong`, texte `ink`).
4. **`spark` (fuchsia) est l'accent, en aplat uniquement** : étiquette de l'inspecteur, petit badge. **Jamais en couleur de texte.** Le texte posé dessus est `on-spark`.
5. **`danger`** sert uniquement aux messages d'erreur, jamais en décoration.
6. **Pas de dégradé, pas d'emoji dans l'interface.**

## Accessibilité (exigence client : malvoyants)

Plus strict que les autres outils de la suite :

- **Texte de 18 px minimum** (`text-lg`) partout, titres plus grands. Pas de `text-sm` ni `text-base`.
- **Contraste visé 7:1 (AAA)** pour le texte. Les paires ci-dessous sont vérifiées dans les deux thèmes.
- **Zones cliquables de 48 px minimum** (`min-h-12`).
- **Focus** : contour de 4 px en `--focus-ring` (encre foncée en clair, jaune du Hub en sombre), géré par `anime-flow-theme.css`. Ne le supprime pas, ne le recolore pas.
- **Jamais d'information par la couleur seule** : un élément actif a aussi une coche, un texte en gras ou une bordure plus épaisse.
- Texte violet sur `--motion-soft` interdit en thème clair (5,98:1) : sur ce fond, le texte est `--ink`.
- Police : **Atkinson Hyperlegible**, déjà chargée par le Hub pour toute l'app. Ne pas en changer.

## Couleurs

| Variable | Clair | Sombre | Usage | Contraste vérifié |
| --- | --- | --- | --- | --- |
| `--surface` | #f7f5fc | #120c1f | Fond de l'outil | — |
| `--surface-raised` | #ffffff | #1c1430 | Panneaux, cartes | — |
| `--line` | #ddd6ee | #352a52 | Séparateurs | — |
| `--line-strong` | #7d7497 | #8a7fae | Bordures des contrôles | ≥ 4:1 (mini 3:1 pour l'UI) |
| `--ink` | #1a1033 | #f3effc | Texte principal | ≥ 15:1 |
| `--ink-muted` | #4a4263 | #c9c0e0 | Texte secondaire | ≥ 9:1 |
| `--motion` | #6d28d9 | #c4b5fd | Signature : action principale, sélection | 7,1:1 / 9,5:1 |
| `--motion-strong` | #5b21b6 | #ddd6fe | Survol / pressé de `motion` | ≥ 9:1 |
| `--motion-soft` | #ede9fe | #2e1f5c | Fond d'un choix actif, badge | texte `--ink` dessus ≥ 12:1 |
| `--on-motion` | #ffffff | #1a1033 | Texte sur `motion` | 7,1:1 / 9,8:1 |
| `--spark` | #e879f9 | #e879f9 | Accent en aplat | `--on-spark` dessus 7,3:1 |
| `--danger` | #8f141d | #ffb4b4 | Texte d'erreur | ≥ 7:1 sur `--danger-soft` |
| `--danger-soft` | #fdecec | #3a1220 | Fond d'un message d'erreur | — |
| `--focus-ring` | #1a1033 | #fde047 | Contour de focus clavier | ≥ 14:1 |

## Classes récurrentes

| Élément | Classes |
| --- | --- |
| Panneau | `rounded-2xl border border-(--line) bg-(--surface-raised) p-5` |
| Titre de panneau | `text-xl font-semibold` |
| Texte secondaire | `text-lg text-(--ink-muted)` |
| Bouton principal | `min-h-12 rounded-full bg-(--motion) px-6 text-lg font-semibold text-(--on-motion) hover:bg-(--motion-strong)` |
| Bouton secondaire | `min-h-12 rounded-full border-2 border-(--line-strong) bg-(--surface-raised) px-6 text-lg font-semibold hover:bg-(--motion-soft)` |
| Choix actif (carte radio) | `border-(--motion) bg-(--motion-soft)` + nom en gras |
| Badge | `rounded-full border border-(--motion) bg-(--motion-soft) px-4 py-1 text-lg` |
| Erreur | `rounded-xl border-2 border-(--danger) bg-(--danger-soft) p-4 text-lg text-(--danger)` |

## Motifs propres à l'outil

- **En-tête d'outil** : logo AnimFlow en 48 px, titre « Animations », phrase d'aide en `--ink-muted`, et à droite le badge du mode (« Mode démo » ou « Projet #N »). Le même logo que dans la barre du Hub.
- **Élément sélectionné dans l'aperçu** : double contour, blanc à l'intérieur et violet `#6d28d9` à l'extérieur. Le violet seul ne ressort pas sur une page sombre (2,5:1) ; le double contour est visible sur n'importe quel fond.
- **Élément survolé dans l'aperçu (inspecteur)** : contour en pointillés `#6d28d9` et étiquette en aplat `spark` qui donne le nom de l'élément (« Bouton « Contact » »), en texte `on-spark`.

## Logo

- Ne recolore pas le logo, ne le déforme pas, ne lui ajoute pas d'ombre. Ses couleurs (magenta `#a3168f`, vert fluo `#c6f432`) appartiennent au logo seulement : elles ne s'utilisent pas dans l'interface, qui reste en `motion` / `spark`.
- Taille minimale : 24 px. Dans l'en-tête, il est décoratif (`alt=""`) car le titre « Animations » nomme déjà l'outil.

## Ton des textes

Français, direct, impératif pour les actions (« Importer une page », « Choisir une animation »), sans emoji. Les éléments de la page sont nommés comme l'utilisateur les voit : « Bouton « Contact » », « Titre principal », jamais par leur id technique.

## Fichiers du projet

| Fichier | Rôle |
| --- | --- |
| `page.html` | Lu (produit par le Générateur). Seuls les éléments avec un `id` sont animables. |
| `animations.json` | Écrit. Config : `{ version: 1, page, animations: { <id>: { name, description, keyframes, duration, easing, custom } }, elements: [{ elementId, animation, event }] }`. Relu à l'ouverture pour reprendre le travail. |
| `animations.js` | Écrit. Script autonome à charger dans la page (`<script src="animations.js" defer></script>`) : lit `animations.json` (ou un bloc `<script type="application/json" id="anime-flow-config">` si le site est ouvert en `file://`), ne joue rien si « réduire les animations » est activé. |
