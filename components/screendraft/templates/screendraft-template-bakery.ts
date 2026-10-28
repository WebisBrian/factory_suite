import {
  createTemplateBuilder,
  defineTemplate,
  mobileFrame,
  placeholder,
  screen,
} from "@/components/screendraft/templates/screendraft-template-builder";

const b = createTemplateBuilder("bakery");

const BROWN = "#451a03";
const BODY = "#57534e";
const PRIMARY = "#9a3412";
const CREAM = "#fffbeb";

const HOME = "screen_bakery_home";
const MENU = "screen_bakery_menu";
const ORDER = "screen_bakery_order";

const primary = { backgroundColor: PRIMARY, color: "#ffffff", fontSize: 18, borderRadius: 12 } as const;
const secondary = { backgroundColor: CREAM, color: PRIMARY, fontSize: 18, borderRadius: 12, borderWidth: 2, borderColor: PRIMARY } as const;

function backButton() {
  return b.button(
    [24, 24, 140, 44],
    "← Accueil",
    { backgroundColor: CREAM, color: PRIMARY, fontSize: 16, borderRadius: 22, borderWidth: 2, borderColor: PRIMARY },
    { screenId: HOME },
  );
}

function menuItem(y: number, name: string, detail: string, imageLabel: string) {
  return b.section([24, y, 345, 120], { backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#d6d3d1" }, [
    b.image([16, 16, 88, 88], placeholder(176, 176, "fed7aa", "451a03", imageLabel), "", { borderRadius: 12 }),
    b.title([120, 18, 209, 32], name, 2, { color: BROWN, fontSize: 20 }),
    b.text([120, 56, 209, 48], detail, { color: BODY, fontSize: 16 }),
  ]);
}

export const bakeryTemplate = defineTemplate(
  "bakery",
  "Boulangerie — Site mobile",
  "Site de commerce de quartier sur téléphone : accueil, carte et commande.",
  {
    colors: { primary: PRIMARY, onPrimary: "#ffffff", text: BROWN, background: CREAM, surface: "#ffedd5", border: "#d6d3d1" },
    textSizes: { heading1: 32, heading2: 20, heading3: 20, body: 16 },
    radius: 12,
  },
  [
    screen(HOME, "Accueil", mobileFrame(940, CREAM), [
      b.section([0, 0, 393, 72], { backgroundColor: BROWN }, [
        b.text([24, 20, 345, 32], "Au Bon Pain", { color: "#ffffff", fontSize: 22, fontWeight: 700 }),
      ]),
      b.image(
        [0, 72, 393, 260],
        placeholder(786, 520, "fed7aa", "451a03", "Vitrine"),
        "Vitrine de la boulangerie avec baguettes et viennoiseries",
      ),
      b.title([24, 356, 345, 112], "Le pain du quartier, cuit chaque matin", 1, { color: BROWN, fontSize: 30 }),
      b.text([24, 476, 345, 72], "Farines locales, levain maison et viennoiseries pur beurre depuis 1998.", {
        color: BODY,
        fontSize: 16,
      }),
      b.button([24, 568, 345, 56], "Voir la carte", primary, { screenId: MENU }),
      b.button([24, 640, 345, 56], "Commander", secondary, { screenId: ORDER }),
      b.section([24, 728, 345, 180], { backgroundColor: "#ffedd5", borderRadius: 16 }, [
        b.title([20, 20, 305, 32], "Horaires", 2, { color: BROWN, fontSize: 22 }),
        b.text([20, 64, 305, 32], "Mardi au samedi : 7 h – 19 h", { color: BROWN, fontSize: 16 }),
        b.text([20, 100, 305, 32], "Dimanche : 7 h – 13 h", { color: BROWN, fontSize: 16 }),
        b.text([20, 136, 305, 32], "Fermé le lundi", { color: BROWN, fontSize: 16, fontWeight: 600 }),
      ]),
    ]),
    screen(MENU, "Carte", mobileFrame(852, CREAM), [
      backButton(),
      b.title([24, 92, 345, 48], "Notre carte", 1, { color: BROWN, fontSize: 32 }),
      menuItem(160, "Baguette tradition", "Levain naturel · 1,30 €", "Baguette"),
      menuItem(296, "Croissant", "Pur beurre AOP · 1,20 €", "Croissant"),
      menuItem(432, "Pain aux céréales", "Graines de lin et tournesol · 3,40 €", "Céréales"),
      menuItem(568, "Tarte aux pommes", "Part individuelle · 3,80 €", "Tarte"),
      b.button([24, 720, 345, 56], "Commander", primary, { screenId: ORDER }),
    ]),
    screen(ORDER, "Commander", mobileFrame(852, CREAM), [
      backButton(),
      b.title([24, 92, 345, 48], "Commander", 1, { color: BROWN, fontSize: 32 }),
      b.text(
        [24, 152, 345, 72],
        "Commandez la veille avant 18 h, votre commande vous attend en boutique dès 7 h.",
        { color: BODY, fontSize: 16 },
      ),
      b.section([24, 248, 345, 200], { backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#d6d3d1" }, [
        b.title([20, 20, 305, 32], "Retrait en boutique", 2, { color: BROWN, fontSize: 20 }),
        b.text([20, 60, 305, 56], "12 rue des Lilas, 69003 Lyon", { color: BODY, fontSize: 16 }),
        b.button([20, 124, 305, 52], "Itinéraire", secondary, { href: "https://www.openstreetmap.org/" }),
      ]),
      b.button([24, 480, 345, 56], "Appeler la boulangerie", primary, { href: "tel:+33400000000" }),
      b.text([24, 552, 345, 48], "Paiement sur place : espèces, carte ou titre-restaurant.", {
        color: BODY,
        fontSize: 16,
        textAlign: "center",
      }),
    ]),
  ],
);
