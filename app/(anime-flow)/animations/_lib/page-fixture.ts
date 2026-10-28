// Page de démo, utilisée sans project_id : ce que le Générateur devrait produire
// à partir de la maquette d'exemple de Screendraft (mêmes ids).
// À remplacer par `pageHtmlFixture` de `@/lib/fixtures` dès que le Hub le publie.
export const pageHtmlFixture = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Landing page — exemple</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #ffffff; color: #0f172a; }
  #button_contact { position: absolute; top: 24px; right: 32px; padding: 10px 24px; border: 0; border-radius: 22px; background: #ffffff; color: #0f172a; font-size: 16px; font-weight: 600; }
  #section_hero { display: flex; flex-wrap: wrap; align-items: center; gap: 48px; padding: 96px 64px; background: #0f172a; }
  #section_hero > div { flex: 1 1 320px; }
  #title_hero { margin: 0; color: #ffffff; font-size: 48px; font-weight: 700; }
  #text_hero { color: #cbd5e1; font-size: 20px; }
  #button_hero { display: inline-block; padding: 16px 32px; border-radius: 12px; background: #6366f1; color: #ffffff; font-size: 18px; font-weight: 600; text-decoration: none; }
  #image_hero { flex: 1 1 320px; max-width: 480px; border-radius: 24px; }
  #section_features { padding: 80px 64px; background: #f8fafc; }
  #title_features { margin: 0 0 32px; font-size: 36px; }
  .cards { display: flex; flex-wrap: wrap; gap: 24px; }
  .cards > section { flex: 1 1 260px; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; }
  .cards h3 { margin: 0 0 16px; font-size: 24px; font-weight: 600; }
  .cards p { margin: 0; color: #475569; font-size: 16px; }
</style>
</head>
<body>
  <section id="section_hero">
    <div>
      <h1 id="title_hero">Donnez vie à vos idées de site web</h1>
      <p id="text_hero">Créez des maquettes modernes et épurées, puis exportez-les en JSON.</p>
      <a id="button_hero" href="#features">Commencer</a>
    </div>
    <img id="image_hero" src="https://placehold.co/960x800" alt="Aperçu de l'éditeur">
  </section>
  <section id="section_features">
    <h2 id="title_features">Pensé pour les équipes web</h2>
    <div class="cards">
      <section id="card_components">
        <h3 id="card_components_title">Composants de base</h3>
        <p id="card_components_text">Texte, image, bouton, section et titre, à placer librement.</p>
      </section>
      <section id="card_positioning">
        <h3 id="card_positioning_title">Positionnement libre</h3>
        <p id="card_positioning_text">Placez chaque élément au pixel près, sur un format fixe.</p>
      </section>
      <section id="card_export">
        <h3 id="card_export_title">Export JSON</h3>
        <p id="card_export_text">Un format standard, repris par l'équipe HTML pour générer le site.</p>
      </section>
    </div>
  </section>
  <button id="button_contact" type="button">Contact</button>
</body>
</html>
`;
