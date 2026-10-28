import {
  createTemplateBuilder,
  defineTemplate,
  desktopFrame,
  mobileFrame,
  placeholder,
  screen,
} from "@/components/screendraft/templates/screendraft-template-builder";

const b = createTemplateBuilder("event");

const NIGHT = "#1e1b4b";
const INK = "#1e1b4b";
const BODY = "#3f3f46";
const ORANGE = "#fb923c";

const HOME = "screen_event_home";
const SIGNUP = "screen_event_signup";

const cta = { backgroundColor: ORANGE, color: NIGHT, fontSize: 18, borderRadius: 12 } as const;

function slot(y: number, time: string, title: string, speaker: string) {
  return b.section([120, y, 1200, 104], { backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#a1a1aa" }, [
    b.text([32, 34, 160, 36], time, { color: INK, fontSize: 24, fontWeight: 700 }),
    b.title([224, 20, 900, 36], title, 3, { color: INK, fontSize: 22 }),
    b.text([224, 60, 900, 28], speaker, { color: BODY, fontSize: 16 }),
  ]);
}

function speaker(x: number, name: string, role: string) {
  return b.section([x, 0, 270, 340], {}, [
    b.image([35, 0, 200, 200], placeholder(400, 400, "e0e7ff", "1e1b4b", name), `Portrait de ${name}`, {
      borderRadius: 100,
    }),
    b.title([0, 224, 270, 32], name, 3, { color: INK, fontSize: 22, textAlign: "center" }),
    b.text([0, 264, 270, 56], role, { color: BODY, fontSize: 16, textAlign: "center" }),
  ]);
}

export const eventTemplate = defineTemplate(
  "event",
  "Événement — Conférence",
  "Page d'une conférence (programme, intervenants) et inscription sur téléphone.",
  {
    colors: { primary: ORANGE, onPrimary: NIGHT, text: INK, background: "#f4f4f5", surface: "#ffffff", border: "#a1a1aa" },
    textSizes: { heading1: 72, heading2: 40, heading3: 22, body: 16 },
    radius: 12,
  },
  [
    screen(HOME, "Accueil", desktopFrame(1820, "#f4f4f5"), [
      b.section([0, 0, 1440, 640], { backgroundColor: NIGHT }, [
        b.shape([1080, 80, 280, 280], "circle", { backgroundColor: "#4338ca" }),
        b.shape([960, 300, 240, 240], "triangle", { backgroundColor: ORANGE }),
        b.text([120, 120, 600, 32], "Jeudi 18 mars 2027 · Lyon", { color: "#fed7aa", fontSize: 22, fontWeight: 600 }),
        b.title([120, 168, 760, 160], "WebConf Lyon 2027", 1, { color: "#ffffff", fontSize: 72 }),
        b.text([120, 344, 640, 64], "Une journée pour faire du web plus rapide, plus sobre et accessible à tous.", {
          color: "#e0e7ff",
          fontSize: 22,
        }),
        b.button([120, 448, 220, 60], "S'inscrire", cta, { screenId: SIGNUP }),
        b.button(
          [360, 448, 220, 60],
          "Voir le programme",
          { backgroundColor: NIGHT, color: "#ffffff", fontSize: 18, borderRadius: 12, borderWidth: 2, borderColor: "#ffffff" },
          { href: "#programme" },
        ),
      ]),
      b.title([120, 712, 800, 56], "Programme", 2, { color: INK, fontSize: 40 }),
      slot(800, "9 h 00", "Accueil et café", "Hall principal"),
      slot(920, "9 h 30", "Le web accessible, du design au code", "Inès Morel, experte accessibilité"),
      slot(1040, "11 h 00", "Mesurer et réduire le poids de ses pages", "Hugo Bernard, développeur web"),
      b.title([120, 1208, 800, 56], "Intervenants", 2, { color: INK, fontSize: 40 }),
      b.section([120, 1296, 1200, 340], {}, [
        speaker(0, "Inès Morel", "Experte accessibilité"),
        speaker(310, "Hugo Bernard", "Développeur web"),
        speaker(620, "Léa Nguyen", "Designer produit"),
        speaker(930, "Samir Haddad", "Responsable technique"),
      ]),
      b.section([0, 1680, 1440, 140], { backgroundColor: NIGHT }, [
        b.text([120, 52, 900, 36], "Centre des congrès de Lyon · Accès en tram T1", { color: "#ffffff", fontSize: 20 }),
        b.button([1100, 40, 220, 60], "Réserver ma place", cta, { screenId: SIGNUP }),
      ]),
    ]),
    screen(SIGNUP, "Inscription", mobileFrame(852, "#f4f4f5"), [
      b.button(
        [24, 24, 180, 44],
        "← Programme",
        { backgroundColor: "#ffffff", color: INK, fontSize: 16, borderRadius: 22, borderWidth: 2, borderColor: INK },
        { screenId: HOME },
      ),
      b.title([24, 96, 345, 48], "Inscription", 1, { color: INK, fontSize: 32 }),
      b.text([24, 152, 345, 56], "WebConf Lyon 2027 · Jeudi 18 mars, de 9 h à 18 h.", { color: BODY, fontSize: 16 }),
      b.section([24, 232, 345, 248], { backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#a1a1aa" }, [
        b.title([20, 20, 305, 32], "Billet journée", 2, { color: INK, fontSize: 22 }),
        b.text([20, 60, 305, 48], "89 €", { color: INK, fontSize: 36, fontWeight: 700 }),
        b.text([20, 116, 305, 112], "Conférences, déjeuner et accès aux replays. Tarif étudiant : 29 €.", {
          color: BODY,
          fontSize: 16,
        }),
      ]),
      b.button([24, 512, 345, 60], "Confirmer l'inscription", { ...cta, backgroundColor: NIGHT, color: "#ffffff" }),
      b.text([24, 588, 345, 48], "Vous recevrez votre billet par e-mail.", {
        color: BODY,
        fontSize: 16,
        textAlign: "center",
      }),
    ]),
  ],
);
