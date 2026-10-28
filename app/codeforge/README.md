# Export CodeForge

Le générateur accepte `maquette.json` v2 (`screens`) et convertit aussi les anciennes
maquettes v1 (`frame` et `nodes`) en un écran unique.

- Un écran : téléchargement de son fichier HTML avec CSS intégré.
- Plusieurs écrans : téléchargement de `site.zip`, avec un HTML et un CSS par écran.
  Extraire tous les fichiers dans le même dossier et ouvrir le HTML du premier écran
  (`index.html` dans la démo). Les liens entre écrans utilisent leurs `path`.
- Le menu « Écran à prévisualiser » permet d'inspecter chaque écran.
- Les formes et vidéos sont exportées. Les images et vidéos référencées par des URL
  externes nécessitent une connexion ; les images en data URL restent intégrées.

L'enregistrement via le Hub utilise uniquement `writeProjectFile`. Les fichiers
produits sont `<path>.html` et le CSS de même nom pour chaque écran, plus `page.html`
comme point d'entrée pour Animations si aucun écran ne porte déjà ce nom.
Le CSS de `page.html` est intégré pour l'aperçu d'Animations.

Vérification depuis la racine (Node 22.15+ ou 24) :

```sh
node --test app/codeforge/generator/_lib/export-site.test.mjs
```
