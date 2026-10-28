import {
  createTemplateBuilder,
  defineTemplate,
  desktopFrame,
  placeholder,
  screen,
} from "@/components/screendraft/templates/screendraft-template-builder";

const b = createTemplateBuilder("landing");

const INK = "#0f172a";
const BODY = "#334155";
const PRIMARY = "#1d4ed8";
const NAVY = "#1e3a8a";

const HOME = "screen_landing_home";
const PRICING = "screen_landing_pricing";

const card = { backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#cbd5e1" } as const;

function feature(x: number, label: string, title: string, text: string) {
  return b.section([x, 168, 384, 300], card, [
    b.shape([32, 32, 56, 56], "circle", { backgroundColor: "#dbeafe", borderWidth: 2, borderColor: PRIMARY }),
    b.title([32, 112, 320, 40], title, 3, { color: INK, fontSize: 24 }),
    b.text([32, 164, 320, 100], text, { color: BODY, fontSize: 16 }),
    b.text([104, 44, 240, 32], label, { color: PRIMARY, fontSize: 14, fontWeight: 600 }),
  ]);
}

function plan(x: number, name: string, price: string, features: string, highlighted: boolean) {
  const color = highlighted ? "#ffffff" : INK;
  const muted = highlighted ? "#dbeafe" : BODY;
  return b.section(
    [x, 296, 384, 520],
    highlighted ? { backgroundColor: NAVY, borderRadius: 20 } : { ...card, borderRadius: 20 },
    [
      b.title([40, 40, 304, 40], name, 2, { color, fontSize: 28 }),
      b.text([40, 100, 304, 56], price, { color, fontSize: 40, fontWeight: 700 }),
      b.text([40, 172, 304, 160], features, { color: muted, fontSize: 16 }),
      b.button(
        [40, 420, 304, 56],
        `Choisir l'offre ${name}`,
        highlighted
          ? { backgroundColor: "#ffffff", color: NAVY, fontSize: 18, borderRadius: 12 }
          : { backgroundColor: PRIMARY, color: "#ffffff", fontSize: 18, borderRadius: 12 },
      ),
    ],
  );
}

export const landingTemplate = defineTemplate(
  "landing",
  "Landing page — Logiciel",
  "Page d'accueil d'un produit numérique et page de tarifs, sur ordinateur.",
  {
    colors: { primary: PRIMARY, onPrimary: "#ffffff", text: INK, background: "#ffffff", surface: "#f1f5f9", border: "#cbd5e1" },
    textSizes: { heading1: 56, heading2: 40, heading3: 24, body: 16 },
    radius: 12,
  },
  [
    screen(HOME, "Accueil", desktopFrame(1600), [
      b.section([0, 0, 1440, 88], { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#cbd5e1" }, [
        b.text([120, 26, 240, 36], "Nimbus", { color: INK, fontSize: 28, fontWeight: 700 }),
        b.button([860, 20, 180, 48], "Fonctionnalités", { color: INK, fontSize: 16, borderRadius: 10 }, {
          href: "#fonctionnalites",
        }),
        b.button([1052, 20, 108, 48], "Tarifs", { color: INK, fontSize: 16, borderRadius: 10 }, {
          screenId: PRICING,
        }),
        b.button(
          [1172, 20, 148, 48],
          "Essai gratuit",
          { backgroundColor: PRIMARY, color: "#ffffff", fontSize: 16, borderRadius: 10 },
          { screenId: PRICING },
        ),
      ]),
      b.section([0, 88, 1440, 600], { backgroundColor: INK }, [
        b.title([120, 112, 620, 144], "Pilotez vos projets sans friction", 1, { color: "#ffffff", fontSize: 56 }),
        b.text(
          [120, 280, 580, 96],
          "Tâches, échéances et équipe au même endroit. Nimbus vous fait gagner une heure par jour, dès la première semaine.",
          { color: "#e2e8f0", fontSize: 20 },
        ),
        b.button(
          [120, 408, 240, 56],
          "Démarrer l'essai",
          { backgroundColor: "#ffffff", color: INK, fontSize: 18, borderRadius: 12 },
          { screenId: PRICING },
        ),
        b.button(
          [384, 408, 200, 56],
          "Voir la démo",
          { backgroundColor: INK, color: "#ffffff", fontSize: 18, borderRadius: 12, borderWidth: 2, borderColor: "#ffffff" },
          { href: "#demo" },
        ),
        b.image(
          [800, 80, 520, 440],
          placeholder(1040, 880, "1e293b", "e2e8f0", "Tableau de bord"),
          "Tableau de bord de Nimbus : liste de tâches et planning de l'équipe",
          { borderRadius: 24 },
        ),
      ]),
      b.section([0, 688, 1440, 540], { backgroundColor: "#f1f5f9" }, [
        b.title([120, 72, 800, 56], "Tout ce dont votre équipe a besoin", 2, { color: INK, fontSize: 40 }),
        feature(120, "Étape 1", "Planifiez", "Découpez chaque projet en tâches, fixez les échéances et voyez la charge de chacun."),
        feature(528, "Étape 2", "Collaborez", "Commentez, partagez des fichiers et suivez les décisions sans quitter la tâche."),
        feature(936, "Étape 3", "Livrez", "Un tableau de bord clair montre ce qui avance, ce qui bloque et ce qui est fini."),
      ]),
      b.section([0, 1228, 1440, 372], { backgroundColor: NAVY }, [
        b.title([220, 88, 1000, 56], "Prêt à essayer ?", 2, { color: "#ffffff", fontSize: 40, textAlign: "center" }),
        b.text([320, 160, 800, 32], "14 jours gratuits, sans carte bancaire.", {
          color: "#dbeafe",
          fontSize: 20,
          textAlign: "center",
        }),
        b.button(
          [600, 232, 240, 56],
          "Voir les tarifs",
          { backgroundColor: "#ffffff", color: NAVY, fontSize: 18, borderRadius: 12 },
          { screenId: PRICING },
        ),
      ]),
    ]),
    screen(PRICING, "Tarifs", desktopFrame(1000, "#f8fafc"), [
      b.button(
        [120, 40, 160, 48],
        "← Accueil",
        { backgroundColor: "#ffffff", color: PRIMARY, fontSize: 16, borderRadius: 24, borderWidth: 2, borderColor: PRIMARY },
        { screenId: HOME },
      ),
      b.title([220, 128, 1000, 64], "Des tarifs simples", 1, { color: INK, fontSize: 48, textAlign: "center" }),
      b.text([320, 208, 800, 32], "Changez d'offre à tout moment. Prix par utilisateur et par mois.", {
        color: BODY,
        fontSize: 20,
        textAlign: "center",
      }),
      plan(120, "Solo", "0 €", "1 utilisateur · 3 projets · Tâches et échéances", false),
      plan(528, "Équipe", "9 €", "Recommandé · Projets illimités · Planning de l'équipe · Support par e-mail", true),
      plan(936, "Entreprise", "19 €", "Tout Équipe · Connexion unique (SSO) · Support prioritaire", false),
    ]),
  ],
);
