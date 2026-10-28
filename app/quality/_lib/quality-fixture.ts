// Page de démonstration, utilisée sans project_id : ce que CodeForge produit pour la maquette d'exemple.
// Volontairement imparfaite (pas de meta description, une image sans dimensions) pour montrer des échecs.
export const pageFixtureHtml = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Landing page — exemple</title>
</head>
<body>
<main>
  <section>
    <h1>Donnez vie à vos idées de site web</h1>
    <p>Créez des maquettes modernes et épurées, puis exportez-les en JSON.</p>
    <a href="#features">Commencer</a>
    <img src="https://placehold.co/960x800" alt="Aperçu de l'éditeur">
  </section>
  <section id="features">
    <h2>Pensé pour les équipes web</h2>
    <h3>Composants de base</h3>
    <p>Texte, image, bouton, section et titre, à placer librement.</p>
    <a href="#">Cliquez ici</a>
  </section>
</main>
</body>
</html>`;

export const pageFixtureCss = "body{margin:0;font-family:system-ui,sans-serif}";
