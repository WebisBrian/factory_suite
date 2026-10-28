import {
  createTemplateBuilder,
  defineTemplate,
  desktopFrame,
  placeholder,
  screen,
} from "@/components/screendraft/templates/screendraft-template-builder";

const b = createTemplateBuilder("blog");

const INK = "#111827";
const BODY = "#374151";
const ACCENT = "#1d4ed8";

const HOME = "screen_blog_home";
const ARTICLE = "screen_blog_article";

const link = { backgroundColor: "#ffffff", color: ACCENT, fontSize: 16, borderRadius: 10, borderWidth: 2, borderColor: ACCENT } as const;

function navBar() {
  return b.section([0, 0, 1440, 80], { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#d1d5db" }, [
    b.text([120, 22, 300, 36], "Carnet Tech", { color: INK, fontSize: 26, fontWeight: 700 }),
    b.button([1060, 16, 120, 48], "Articles", { color: INK, fontSize: 16, borderRadius: 10 }, { screenId: HOME }),
    b.button([1196, 16, 124, 48], "S'abonner", { backgroundColor: INK, color: "#ffffff", fontSize: 16, borderRadius: 10 }, {
      href: "#newsletter",
    }),
  ]);
}

function articleCard(x: number, category: string, title: string, text: string) {
  return b.section([x, 712, 384, 460], { backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#d1d5db" }, [
    b.image([0, 0, 384, 216], placeholder(768, 432, "e5e7eb", "111827", category), "", { borderRadius: 16 }),
    b.text([24, 236, 336, 28], category, { color: ACCENT, fontSize: 14, fontWeight: 600 }),
    b.title([24, 268, 336, 64], title, 3, { color: INK, fontSize: 22 }),
    b.text([24, 336, 336, 48], text, { color: BODY, fontSize: 16 }),
    b.button([24, 392, 200, 48], `Lire : ${title}`, link, { screenId: ARTICLE }),
  ]);
}

export const blogTemplate = defineTemplate(
  "blog",
  "Blog — Magazine",
  "Liste d'articles avec un article mis en avant, et une page d'article avec vidéo.",
  {
    colors: { primary: ACCENT, onPrimary: "#ffffff", text: INK, background: "#ffffff", surface: "#f3f4f6", border: "#d1d5db" },
    textSizes: { heading1: 44, heading2: 32, heading3: 22, body: 16 },
    radius: 16,
  },
  [
    screen(HOME, "Accueil", desktopFrame(1420), [
      navBar(),
      b.title([120, 120, 800, 56], "Le numérique, expliqué simplement", 1, { color: INK, fontSize: 44 }),
      b.section([120, 208, 1200, 420], { backgroundColor: "#f3f4f6", borderRadius: 24 }, [
        b.image(
          [0, 0, 600, 420],
          placeholder(1200, 840, "dbeafe", "1e3a8a", "Article à la une"),
          "Personne utilisant un lecteur d'écran sur un ordinateur portable",
          { borderRadius: 24 },
        ),
        b.text([648, 56, 500, 28], "À la une · Accessibilité", { color: ACCENT, fontSize: 16, fontWeight: 600 }),
        b.title([648, 92, 500, 120], "Concevoir un site lisible pour tous, sans tout refaire", 2, {
          color: INK,
          fontSize: 32,
        }),
        b.text([648, 224, 500, 72], "Contraste, taille du texte, navigation au clavier : les gestes qui changent tout.", {
          color: BODY,
          fontSize: 18,
        }),
        b.button([648, 320, 220, 52], "Lire l'article", { backgroundColor: ACCENT, color: "#ffffff", fontSize: 18, borderRadius: 12 }, {
          screenId: ARTICLE,
        }),
      ]),
      b.title([120, 656, 600, 44], "Derniers articles", 2, { color: INK, fontSize: 32 }),
      articleCard(120, "Outils", "Cinq extensions pour tester un site", "Contraste, titres, liens : vérifiez en un clic."),
      articleCard(528, "Design", "Le bon contraste en mode sombre", "Pourquoi le blanc pur fatigue, et quoi choisir."),
      articleCard(936, "Code", "Des boutons vraiment utilisables", "Nom accessible, focus visible et taille de cible."),
      b.section([0, 1220, 1440, 200], { backgroundColor: INK }, [
        b.text([120, 64, 800, 32], "Carnet Tech · Un article par semaine, sans publicité.", { color: "#f3f4f6", fontSize: 18 }),
        b.text([120, 108, 800, 32], "© 2026 Carnet Tech", { color: "#d1d5db", fontSize: 16 }),
      ]),
    ]),
    screen(ARTICLE, "Article", desktopFrame(1660), [
      navBar(),
      b.button([320, 120, 220, 48], "← Tous les articles", link, { screenId: HOME }),
      b.text([320, 200, 800, 28], "Accessibilité", { color: ACCENT, fontSize: 16, fontWeight: 600 }),
      b.title([320, 236, 800, 120], "Concevoir un site lisible pour tous, sans tout refaire", 1, {
        color: INK,
        fontSize: 44,
      }),
      b.text([320, 372, 800, 28], "Par Alex Martin · 6 min de lecture", { color: BODY, fontSize: 16 }),
      b.image(
        [320, 424, 800, 400],
        placeholder(1600, 800, "dbeafe", "1e3a8a", "Illustration"),
        "Personne utilisant un lecteur d'écran sur un ordinateur portable",
        { borderRadius: 16 },
      ),
      b.text(
        [320, 856, 800, 112],
        "Un site accessible n'est pas un site à part. Quelques règles simples suffisent à le rendre utilisable par les personnes malvoyantes, au clavier comme au lecteur d'écran.",
        { color: BODY, fontSize: 20 },
      ),
      b.title([320, 1000, 800, 44], "Commencer par le contraste", 2, { color: INK, fontSize: 30 }),
      b.text(
        [320, 1056, 800, 84],
        "Visez un rapport de 7 pour 1 entre le texte et le fond. Sur fond sombre, préférez un gris très clair au blanc pur.",
        { color: BODY, fontSize: 18 },
      ),
      b.video([320, 1172, 800, 450], "Vidéo : tester un site avec un lecteur d'écran", {
        backgroundColor: INK,
        borderRadius: 16,
      }),
    ]),
  ],
);
