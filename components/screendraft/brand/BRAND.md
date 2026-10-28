# Screen draft — charte graphique (à appliquer dans le code)

> Ce fichier sert de référence pour coder l'interface de **Screen draft**, l'outil de maquettage du projet. On y compose des écrans à partir de blocs (section, titre, texte, image, bouton) et de composants réutilisables, puis on les exporte en JSON pour l'équipe HTML/CSS.
> Pour toute décision visuelle, suis cette charte. N'invente pas de nouvelles couleurs, tailles ou rayons : utilise les variables CSS ci-dessous.

## Fichiers fournis (dossier `screen-draft-brand/`)

- `tokens.css` contient toutes les variables CSS, les `@font-face` et les classes de texte. Importe-le une seule fois dans la feuille de style globale de l'app.
- `fonts/` contient Space Grotesk, DM Sans et JetBrains Mono en woff2 variable, sous licence SIL OFL. Le chemin `./fonts/` est relatif à `tokens.css` : garde les deux ensemble, ou corrige les `url()` si tu les déplaces.
- `logos/` contient chaque logo en SVG et en PNG transparent :
  - `screen-draft-wordmark.svg` : logo complet, sur fond clair
  - `screen-draft-wordmark-white.svg` : logo complet, sur fond sombre
  - `screen-draft-mark.svg` : symbole seul (favicon, header compact, icône)
  - `screen-draft-mark-mono.svg` : symbole en une seule couleur

## Règles à respecter

1. **N'écris aucune valeur en dur.** Utilise toujours `var(--draft)`, `var(--space-4)`, `var(--radius-md)`, etc. Seul le contenu des maquettes de l'utilisateur, sur le canvas, peut avoir des couleurs libres.
2. **Thèmes.** Le thème clair s'applique par défaut. Le thème sombre s'active avec `data-theme="dark"` sur `<html>`. Prévois un bouton de bascule et respecte `prefers-color-scheme` au premier chargement.
3. **`draft` (bleu `#2348FF`) est la couleur signature.** Elle sert au bouton principal, à l'élément actif, aux liens et au cadre de sélection. Mets **au maximum un bouton `draft` plein par vue** ; les autres boutons sont secondaires (fond `surface-raised`, bordure `line-strong`, texte `ink`).
4. **`fluo` (vert `#C6F432`) est l'accent.** Utilise-le en aplat uniquement : poignées, surlignage, badge « nouveau ». **Jamais en couleur de texte.** Le texte posé sur du fluo est `on-fluo`.
5. **Les couleurs d'état** (`success`, `warning`, `danger`) servent seulement à indiquer un état, par exemple un export JSON réussi ou une erreur. Jamais en décoration.
6. **Espacements sur une grille de 4px** (`--space-*`). C'est aussi le pas d'aimantation du canvas.
7. **Rayons** : `radius-sm` pour les champs et badges, `radius-md` pour les boutons, cartes et menus, `radius-lg` pour les modales et panneaux flottants, `radius-pill` pour les pastilles et interrupteurs.
8. **Ombres.** `shadow-panel` s'applique aux panneaux flottants, menus et popovers. `shadow-frame` s'applique aux écrans posés sur le canvas. Aucun autre élément n'a d'ombre.
9. **Accessibilité.** Le focus clavier est déjà géré par `:focus-visible` dans `tokens.css` : ne le supprime pas. Les paires texte/fond indiquées ci-dessous respectent un contraste d'au moins 4.5:1 dans les deux thèmes.
10. **Pas de dégradés, pas d'emoji dans l'interface, pas de cartes avec une bordure gauche colorée.**

## Couleurs (sémantiques)

| Variable | Clair | Sombre | Usage |
| --- | --- | --- | --- |
| `--surface` | #f6f7fb | #0d0f1a | Fond de l'app, autour du canvas |
| `--surface-raised` | #ffffff | #161a2b | Panneaux, menus, inspecteur |
| `--canvas` | #eceef5 | #1b1f33 | Fond du canvas derrière les écrans |
| `--line` | #dadeea | #2a2f48 | Séparateurs, bordures décoratives |
| `--line-strong` | #80869f | #666d92 | Contours des inputs et boutons secondaires (3:1) |
| `--ink` | #0b1033 | #eef0fa | Texte principal |
| `--ink-muted` | #565c7a | #a3a9c6 | Texte secondaire, labels |
| `--draft` | #2348ff | #7b8fff | Couleur signature : action principale, actif, liens |
| `--draft-strong` | #1631c9 | #a3b1ff | Survol et état pressé de `draft` |
| `--draft-soft` | #e6eaff | #1a2259 | Fond d'un calque sélectionné, d'un onglet actif ou d'un badge |
| `--on-draft` | #ffffff | #0b1033 | Texte sur un aplat `draft` |
| `--fluo` | #c6f432 | #c6f432 | Accent en aplat uniquement |
| `--on-fluo` | #0b1033 | #0b1033 | Texte sur `fluo` |
| `--success` | #13804b | #4ade80 | Export réussi, validation |
| `--warning` | #a15c00 | #ffb547 | Avertissement |
| `--danger` | #d3263b | #ff7a85 | Erreur, suppression |
| `--focus-ring` | = draft | = draft | Anneau de focus |
| `--selection` | = draft | = draft | Cadre de sélection sur le canvas |

## Typographie

| Classe | Police | Taille / interligne | Graisse | Usage |
| --- | --- | --- | --- | --- |
| `.text-display` | Space Grotesk | 48/52 | 700 | Écran d'accueil, une fois par page |
| `.text-title-1` | Space Grotesk | 32/38 | 600 | Titre de page ou de modale |
| `.text-title-2` | Space Grotesk | 22/28 | 600 | Titre de section ou de panneau |
| `.text-body` | DM Sans | 15/22 | 400 | Texte courant |
| `.text-body-sm` | DM Sans | 13/18 | 400 | Panneaux d'inspection, infobulles |
| `.text-label` | DM Sans | 12/16 | 600, majuscules | En-têtes de panneaux (« CALQUES ») |
| `.text-code` | JetBrains Mono | 13/20 | 400 | Aperçu de l'export JSON, valeurs numériques |

## Motifs propres à l'éditeur

- **Élément sélectionné sur le canvas** : contour de 1.5px en `--selection`, avec 4 poignées carrées de 8×8px (fond `--surface-raised`, bordure 1.5px `--selection`) placées aux coins. Ce motif reprend le logo.
- **Calque sélectionné dans l'arbre des calques** : fond `--draft-soft`, texte `--draft`.
- **Écrans (frames) sur le canvas** : fond blanc (le contenu de l'utilisateur), `--shadow-frame`, nom de l'écran au-dessus en `.text-body-sm` couleur `--ink-muted`.
- **Panneaux latéraux** : fond `--surface-raised`, séparés du canvas par `1px solid var(--line)`, padding `--space-4`, en-têtes en `.text-label`.
- **Bouton principal** : fond `--draft`, texte `--on-draft`, `--radius-md`, padding `var(--space-2) var(--space-4)`, `--draft-strong` au survol.

## Logo

- Header de l'app : `screen-draft-wordmark.svg` en thème clair et `screen-draft-wordmark-white.svg` en thème sombre, avec une hauteur d'environ 32px.
- Favicon et icône PWA : `screen-draft-mark.svg`, avec le PNG en secours.
- Laisse autour du logo un espace libre égal à au moins ¼ de la hauteur du symbole. Taille minimale : 24px pour le symbole, 120px de large pour le logo complet.
- Ne recolore pas le logo, ne le déforme pas et ne lui ajoute pas d'ombre.

## Ton des textes de l'interface

Les textes de l'interface sont en français : directs, à l'impératif pour les actions (« Ajouter une section », « Exporter en JSON »), sans emoji. Nomme les éléments comme dans l'outil : bloc, section, composant, écran.

## `tokens.css` (copie intégrale, au cas où le fichier manquerait)

```css
/* Screen draft — design tokens. Thème clair par défaut, thème sombre via [data-theme="dark"]. */

@font-face { font-family: "Space Grotesk"; src: url("./fonts/SpaceGrotesk-Variable.woff2") format("woff2"); font-weight: 300 700; font-style: normal; font-display: swap; }
@font-face { font-family: "DM Sans"; src: url("./fonts/DMSans-Variable.woff2") format("woff2"); font-weight: 100 1000; font-style: normal; font-display: swap; }
@font-face { font-family: "JetBrains Mono"; src: url("./fonts/JetBrainsMono-Variable.woff2") format("woff2"); font-weight: 100 800; font-style: normal; font-display: swap; }

:root, [data-theme="light"] {
  color-scheme: light;
  --surface: #f6f7fb;
  --surface-raised: #ffffff;
  --canvas: #eceef5;
  --line: #dadeea;
  --line-strong: #80869f;
  --ink: #0b1033;
  --ink-muted: #565c7a;
  --draft: #2348ff;
  --draft-strong: #1631c9;
  --draft-soft: #e6eaff;
  --on-draft: #ffffff;
  --fluo: #c6f432;
  --on-fluo: #0b1033;
  --success: #13804b;
  --warning: #a15c00;
  --danger: #d3263b;
  --focus-ring: var(--draft);
  --selection: var(--draft);
  --shadow-panel: 0 1px 2px rgba(11,16,51,0.06), 0 4px 16px rgba(11,16,51,0.08);
  --shadow-frame: 0 2px 12px rgba(11,16,51,0.10);
}

[data-theme="dark"] {
  color-scheme: dark;
  --surface: #0d0f1a;
  --surface-raised: #161a2b;
  --canvas: #1b1f33;
  --line: #2a2f48;
  --line-strong: #666d92;
  --ink: #eef0fa;
  --ink-muted: #a3a9c6;
  --draft: #7b8fff;
  --draft-strong: #a3b1ff;
  --draft-soft: #1a2259;
  --on-draft: #0b1033;
  --fluo: #c6f432;
  --on-fluo: #0b1033;
  --success: #4ade80;
  --warning: #ffb547;
  --danger: #ff7a85;
  --focus-ring: var(--draft);
  --selection: var(--draft);
  --shadow-panel: 0 1px 2px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.4);
  --shadow-frame: 0 2px 12px rgba(0,0,0,0.5);
}

:root {
  --font-display: "Space Grotesk", "DM Sans", system-ui, sans-serif;
  --font-sans: "DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 14px;
  --radius-pill: 999px;
}

.text-display { font-family: var(--font-display); font-size: 48px; line-height: 52px; font-weight: 700; letter-spacing: -0.02em; }
.text-title-1 { font-family: var(--font-display); font-size: 32px; line-height: 38px; font-weight: 600; letter-spacing: -0.015em; }
.text-title-2 { font-family: var(--font-display); font-size: 22px; line-height: 28px; font-weight: 600; letter-spacing: -0.01em; }
.text-body { font-family: var(--font-sans); font-size: 15px; line-height: 22px; font-weight: 400; }
.text-body-sm { font-family: var(--font-sans); font-size: 13px; line-height: 18px; font-weight: 400; }
.text-label { font-family: var(--font-sans); font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
.text-code { font-family: var(--font-mono); font-size: 13px; line-height: 20px; font-weight: 400; }

:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
body { background: var(--surface); color: var(--ink); font-family: var(--font-sans); }
```
