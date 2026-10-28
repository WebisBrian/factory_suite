/**
 * Format JSON d'une maquette Screendraft (fichier `maquette.json` du projet).
 *
 * C'est le contrat avec l'équipe qui transforme la maquette en HTML éditable :
 * tout changement incompatible doit incrémenter SCHEMA_VERSION.
 *
 * Conventions :
 * - Positions et dimensions en px, à l'échelle 1 de la maquette. Le zoom et le
 *   déplacement du canvas sont un état de l'éditeur et ne sont jamais exportés.
 * - Une maquette contient un ou plusieurs écrans (`screens`), chacun avec son frame
 *   et ses éléments. L'ordre du tableau est l'ordre d'affichage des écrans.
 * - x / y sont relatifs au parent : le frame de l'écran pour un élément de premier
 *   niveau, la section pour ses enfants.
 * - L'ordre des tableaux `nodes` et `children` est l'ordre d'empilement :
 *   le premier élément est au fond, le dernier au premier plan.
 *
 * - Prototype : chaque écran a un `path`, le nom de son fichier HTML. Un bouton lié à un
 *   écran (`targetScreenId`) a pour `href` le `path` de cet écran : le HTML généré peut
 *   l'utiliser tel quel. Screendraft tient `path` et `href` à jour (renommage, suppression).
 *
 * - Charte graphique (`theme`) : couleurs, tailles de texte et arrondi partagés par toute la
 *   maquette. Un élément ou un frame peut reprendre certaines de ses valeurs (`themeLinks`) ;
 *   la valeur concrète reste toujours écrite dans `style` (ou `frame`), que Screendraft tient à
 *   jour quand la charte change. Le Générateur peut donc ignorer la charte, ou s'en servir pour
 *   produire des variables CSS. Champs ajoutés sans changer de version : un fichier sans `theme`
 *   reçoit la charte par défaut à l'ouverture.
 *
 * Version 2 : `frame` et `nodes` passent du premier niveau à chaque écran de `screens`.
 */

export const SCHEMA_VERSION = 2;

export type Maquette = {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  name: string;
  theme: Theme;
  /** Au moins un écran. */
  screens: Screen[];
};

/** Charte graphique de la maquette (SCRUM-12). */
export type Theme = {
  colors: Record<ThemeColor, HexColor>;
  /** Tailles de texte, en px. */
  textSizes: Record<ThemeTextSize, number>;
  /** Arrondi des angles, en px. */
  radius: number;
};

export type ThemeColor = "primary" | "onPrimary" | "text" | "background" | "surface" | "border";

export type ThemeTextSize = "heading1" | "heading2" | "heading3" | "body";

/** Propriétés de style reprises de la charte, et la valeur de la charte qu'elles suivent. */
export type ThemeLinks = {
  color?: ThemeColor;
  backgroundColor?: ThemeColor;
  borderColor?: ThemeColor;
  fontSize?: ThemeTextSize;
  borderRadius?: "radius";
};

/** Un écran de la maquette, ex. « Accueil » ou « Contact ». */
export type Screen = {
  /** Unique dans le document. */
  id: string;
  name: string;
  /**
   * Fichier HTML de l'écran, unique dans le document : `index.html` pour le premier écran,
   * puis tiré du nom (ex. « Contact » → `contact.html`). Calculé par Screendraft.
   */
  path: string;
  frame: Frame;
  nodes: DraftNode[];
};

/** Format fixe de la maquette, volontairement non responsive. */
export type Frame = {
  device: "desktop" | "mobile";
  width: number;
  height: number;
  backgroundColor: HexColor;
  themeLinks?: Pick<ThemeLinks, "backgroundColor">;
};

/** Couleur CSS hexadécimale, ex. "#0f172a" ou "#0f172a80". */
export type HexColor = `#${string}`;

export type NodeStyle = {
  backgroundColor?: HexColor;
  color?: HexColor;
  fontSize?: number;
  fontWeight?: 400 | 500 | 600 | 700;
  textAlign?: "left" | "center" | "right";
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: HexColor;
};

/**
 * Ce que les lecteurs d'écran lisent pour un élément (SCRUM-25). Champ facultatif :
 * absent, l'élément est lu selon son contenu visible. Ajout compatible : SCHEMA_VERSION inchangé.
 *
 * Côté HTML généré :
 * - `decorative: true` → `aria-hidden="true"` (`alt=""` pour une image) ;
 * - `label` → `aria-label`, lu à la place du texte visible.
 * Pour une image et une vidéo, le texte lu reste `props.alt` / `props.title` : `label` n'est pas utilisé.
 */
export type NodeA11y = {
  label?: string;
  decorative?: boolean;
};

type BaseNode = {
  /** Unique dans le document, tous écrans confondus. */
  id: string;
  /**
   * Nom du calque, choisi dans l'éditeur (ex. « En-tête », « Carte tarif »). Facultatif :
   * sans nom, le calque affiche son contenu. Utilisable côté HTML comme repère (commentaire, data-name).
   */
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: NodeStyle;
  a11y?: NodeA11y;
  themeLinks?: ThemeLinks;
  /**
   * Présent sur la racine d'une instance de composant custom (`screendraft-composants.json`).
   * Le contenu de l'instance est toujours déployé dans la maquette : le Générateur peut ignorer ce champ.
   */
  componentId?: string;
};

export type SectionNode = BaseNode & {
  type: "section";
  children: DraftNode[];
};

export type TitleNode = BaseNode & {
  type: "title";
  props: { text: string; level: 1 | 2 | 3 };
};

export type TextNode = BaseNode & {
  type: "text";
  props: { text: string };
};

export type ImageNode = BaseNode & {
  type: "image";
  props: { src: string; alt: string; fit: "cover" | "contain" };
};

/**
 * Vidéo référencée par un lien, jamais copiée dans le projet.
 * - kind "embed" : `src` est l'URL d'un lecteur intégrable (YouTube, Vimeo), à afficher dans une <iframe>.
 * - kind "file" : `src` est l'URL d'un fichier vidéo, à afficher dans une <video controls>.
 * `src` vide : aucun lien saisi pour l'instant.
 * `title` décrit la vidéo pour les lecteurs d'écran (title de l'iframe, aria-label de la vidéo).
 */
export type VideoNode = BaseNode & {
  type: "video";
  props: { src: string; kind: "embed" | "file"; title: string };
};

export type ButtonNode = BaseNode & {
  type: "button";
  props: {
    label: string;
    /** Lien du bouton : URL libre, ou `path` de l'écran cible si `targetScreenId` est défini. */
    href?: string;
    /** Écran ouvert au clic dans le prototype. */
    targetScreenId?: string;
  };
};

/** Une diapositive de carrousel : une image, décrite pour les lecteurs d'écran. */
export type CarouselSlide = {
  /** Unique dans le carrousel. */
  id: string;
  src: string;
  alt: string;
};

/**
 * Carrousel d'images (SCRUM-31), dans l'ordre du tableau. La page générée montre une
 * diapositive à la fois, avec des boutons Précédente / Suivante et un indicateur de position.
 * Pas de défilement automatique : l'utilisateur garde la main (WCAG 2.2.2).
 * `title` nomme le carrousel pour les lecteurs d'écran (ex. « Nos réalisations »).
 */
export type CarouselNode = BaseNode & {
  type: "carousel";
  props: { slides: CarouselSlide[]; title: string };
};

export type ShapeKind = "circle" | "rectangle" | "triangle";

export type ShapeNode = BaseNode & {
  type: "shape";
  props: { shape: ShapeKind };
};

export type DraftNode =
  | SectionNode
  | TitleNode
  | TextNode
  | ImageNode
  | VideoNode
  | CarouselNode
  | ButtonNode
  | ShapeNode;

export type DraftNodeType = DraftNode["type"];
