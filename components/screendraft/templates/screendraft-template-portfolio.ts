import {
  createTemplateBuilder,
  defineTemplate,
  desktopFrame,
  placeholder,
  screen,
} from "@/components/screendraft/templates/screendraft-template-builder";

const b = createTemplateBuilder("portfolio");

const INK = "#1c1917";
const BODY = "#44403c";
const ACCENT = "#c2410c";
const PAPER = "#fafaf9";

const HOME = "screen_portfolio_home";
const PROJECT = "screen_portfolio_project";
const CONTACT = "screen_portfolio_contact";

const outline = { backgroundColor: PAPER, color: INK, fontSize: 16, borderRadius: 24, borderWidth: 2, borderColor: INK } as const;
const filled = { backgroundColor: INK, color: "#ffffff", fontSize: 16, borderRadius: 24 } as const;

function header() {
  return [
    b.text([120, 40, 320, 40], "Camille Durand", { color: INK, fontSize: 24, fontWeight: 700 }),
    b.button([1060, 36, 120, 48], "Projets", outline, { screenId: HOME }),
    b.button([1196, 36, 124, 48], "Contact", filled, { screenId: CONTACT }),
  ];
}

function projectCard(x: number, imageLabel: string, alt: string, title: string, text: string) {
  return b.section([x, 640, 584, 620], { backgroundColor: "#ffffff", borderRadius: 20, borderWidth: 1, borderColor: "#a8a29e" }, [
    b.image([0, 0, 584, 360], placeholder(1168, 720, "e7e5e4", "1c1917", imageLabel), alt, { borderRadius: 20 }),
    b.title([32, 392, 520, 40], title, 3, { color: INK, fontSize: 28 }),
    b.text([32, 444, 520, 64], text, { color: BODY, fontSize: 16 }),
    b.button([32, 532, 220, 52], `Voir le projet ${title}`, filled, { screenId: PROJECT }),
  ]);
}

export const portfolioTemplate = defineTemplate(
  "portfolio",
  "Portfolio — Designer",
  "Site d'un profil indépendant : projets, étude de cas et contact, sur ordinateur.",
  {
    colors: { primary: INK, onPrimary: "#ffffff", text: INK, background: PAPER, surface: "#ffffff", border: "#a8a29e" },
    textSizes: { heading1: 56, heading2: 36, heading3: 28, body: 16 },
    radius: 20,
  },
  [
    screen(HOME, "Accueil", desktopFrame(1360, PAPER), [
      b.shape([1080, 140, 240, 240], "circle", { backgroundColor: "#fdba74" }),
      b.shape([1000, 300, 140, 140], "triangle", { backgroundColor: "#fed7aa" }),
      ...header(),
      b.title([120, 160, 860, 180], "Je dessine des interfaces simples et lisibles.", 1, { color: INK, fontSize: 64 }),
      b.text(
        [120, 368, 640, 64],
        "Designer d'interfaces à Lyon. Dix ans de sites et d'applications pensés pour tous, accessibilité comprise.",
        { color: BODY, fontSize: 20 },
      ),
      b.title([120, 560, 600, 48], "Projets récents", 2, { color: INK, fontSize: 36 }),
      projectCard(120, "Appli vélo", "Écrans de l'application de vélos en libre-service", "Vélo'v", "Refonte de l'application de location de vélos de la métropole."),
      projectCard(736, "Site musée", "Page d'accueil du site du musée", "Musée des Confluences", "Un site de billetterie lisible au lecteur d'écran."),
    ]),
    screen(PROJECT, "Projet", desktopFrame(1720, PAPER), [
      ...header(),
      b.text([120, 152, 600, 32], "Étude de cas · 2026", { color: ACCENT, fontSize: 18, fontWeight: 600 }),
      b.title([120, 192, 1000, 80], "Vélo'v : louer un vélo en trois gestes", 1, { color: INK, fontSize: 56 }),
      b.text(
        [120, 288, 800, 64],
        "Comment nous avons réduit de moitié le temps de location, pour les habitués comme pour les touristes.",
        { color: BODY, fontSize: 20 },
      ),
      b.image(
        [120, 392, 1200, 560],
        placeholder(2400, 1120, "e7e5e4", "1c1917", "Maquettes Vélo'v"),
        "Trois écrans de l'application : carte des stations, choix du vélo, paiement",
        { borderRadius: 24 },
      ),
      b.title([120, 1016, 560, 48], "Le défi", 2, { color: INK, fontSize: 32 }),
      b.text(
        [120, 1076, 560, 120],
        "L'ancienne application demandait sept écrans pour louer un vélo, et la carte était illisible au soleil.",
        { color: BODY, fontSize: 18 },
      ),
      b.title([760, 1016, 560, 48], "La solution", 2, { color: INK, fontSize: 32 }),
      b.text(
        [760, 1076, 560, 120],
        "Une carte à fort contraste, une location en trois gestes et un paiement mémorisé.",
        { color: BODY, fontSize: 18 },
      ),
      b.video([360, 1228, 720, 405], "Démonstration de la location d'un vélo dans l'application", {
        backgroundColor: INK,
        borderRadius: 16,
      }),
      b.button([600, 1652, 240, 52], "Me contacter", filled, { screenId: CONTACT }),
    ]),
    screen(CONTACT, "Contact", desktopFrame(900, PAPER), [
      ...header(),
      b.title([120, 200, 900, 80], "Travaillons ensemble", 1, { color: INK, fontSize: 56 }),
      b.text([120, 300, 700, 64], "Un projet, une question ? Je réponds sous 48 heures, du lundi au vendredi.", {
        color: BODY,
        fontSize: 20,
      }),
      b.section([120, 408, 700, 260], { backgroundColor: "#ffffff", borderRadius: 20, borderWidth: 1, borderColor: "#a8a29e" }, [
        b.text([40, 40, 620, 32], "camille.durand@example.com", { color: INK, fontSize: 22, fontWeight: 600 }),
        b.text([40, 84, 620, 32], "Lyon, France", { color: BODY, fontSize: 18 }),
        b.button([40, 160, 240, 56], "Écrire un e-mail", filled, { href: "mailto:camille.durand@example.com" }),
        b.button([300, 160, 200, 56], "LinkedIn", outline, { href: "https://www.linkedin.com/" }),
      ]),
    ]),
  ],
);
