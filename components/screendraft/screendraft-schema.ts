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
 * Version 2 : `frame` et `nodes` passent du premier niveau à chaque écran de `screens`.
 */

export const SCHEMA_VERSION = 2;

export type Maquette = {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  name: string;
  /** Au moins un écran. */
  screens: Screen[];
};

/** Un écran de la maquette, ex. « Accueil » ou « Contact ». */
export type Screen = {
  /** Unique dans le document. */
  id: string;
  name: string;
  frame: Frame;
  nodes: DraftNode[];
};

/** Format fixe de la maquette, volontairement non responsive. */
export type Frame = {
  device: "desktop" | "mobile";
  width: number;
  height: number;
  backgroundColor: HexColor;
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

type BaseNode = {
  /** Unique dans le document, tous écrans confondus. */
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: NodeStyle;
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

export type ButtonNode = BaseNode & {
  type: "button";
  props: { label: string; href?: string };
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
  | ButtonNode
  | ShapeNode;

export type DraftNodeType = DraftNode["type"];
