import { syncLinks } from "@/components/screendraft/screendraft-links";
import {
  SCHEMA_VERSION,
  type ButtonNode,
  type DraftNode,
  type Frame,
  type HexColor,
  type ImageNode,
  type Maquette,
  type NodeStyle,
  type Screen,
  type SectionNode,
  type ShapeKind,
  type ShapeNode,
  type TextNode,
  type Theme,
  type ThemeLinks,
  type ThemeTextSize,
  type TitleNode,
  type VideoNode,
} from "@/components/screendraft/screendraft-schema";

/** Maquette proposée à l'import dans un nouveau projet. */
export type ScreendraftTemplate = {
  id: string;
  name: string;
  /** Une phrase, lue dans la liste des modèles. */
  description: string;
  maquette: Maquette;
};

/** Position et taille en px, relatives au parent : [x, y, largeur, hauteur]. */
type Rect = readonly [number, number, number, number];

/** Lien d'un bouton : vers un écran de la maquette, ou vers une URL libre. */
type ButtonLink = { screenId: string } | { href: string };

function rect([x, y, width, height]: Rect) {
  return { x, y, width, height };
}

export function desktopFrame(height: number, backgroundColor: HexColor = "#ffffff"): Frame {
  return { device: "desktop", width: 1440, height, backgroundColor };
}

export function mobileFrame(height: number, backgroundColor: HexColor = "#ffffff"): Frame {
  return { device: "mobile", width: 393, height, backgroundColor };
}

/** `path` est calculé par `defineTemplate`. */
export function screen(id: string, name: string, frame: Frame, nodes: DraftNode[]): Screen {
  return { id, name, path: "", frame, nodes };
}

/**
 * Fabrique d'éléments d'un modèle : les id sont `<type>_<prefix>_<n>`, uniques dans le modèle.
 * Les styles de texte reçoivent des valeurs par défaut (graisse, alignement).
 */
export function createTemplateBuilder(prefix: string) {
  let count = 0;
  const nextId = (type: DraftNode["type"]) => `${type}_${prefix}_${++count}`;

  return {
    section: (box: Rect, style: NodeStyle, children: DraftNode[]): SectionNode => ({
      id: nextId("section"),
      type: "section",
      ...rect(box),
      style,
      children,
    }),
    title: (box: Rect, text: string, level: 1 | 2 | 3, style: NodeStyle): TitleNode => ({
      id: nextId("title"),
      type: "title",
      ...rect(box),
      style: { fontWeight: 700, textAlign: "left", ...style },
      props: { text, level },
    }),
    text: (box: Rect, text: string, style: NodeStyle): TextNode => ({
      id: nextId("text"),
      type: "text",
      ...rect(box),
      style: { fontWeight: 400, textAlign: "left", ...style },
      props: { text },
    }),
    button: (box: Rect, label: string, style: NodeStyle, link?: ButtonLink): ButtonNode => ({
      id: nextId("button"),
      type: "button",
      ...rect(box),
      style: { fontWeight: 600, textAlign: "center", ...style },
      props:
        link === undefined
          ? { label }
          : "screenId" in link
            ? { label, targetScreenId: link.screenId }
            : { label, href: link.href },
    }),
    image: (box: Rect, src: string, alt: string, style: NodeStyle = {}): ImageNode => ({
      id: nextId("image"),
      type: "image",
      ...rect(box),
      style,
      props: { src, alt, fit: "cover" },
    }),
    video: (box: Rect, title: string, style: NodeStyle): VideoNode => ({
      id: nextId("video"),
      type: "video",
      ...rect(box),
      style,
      props: { src: "", kind: "embed", title },
    }),
    shape: (box: Rect, shape: ShapeKind, style: NodeStyle): ShapeNode => ({
      id: nextId("shape"),
      type: "shape",
      ...rect(box),
      style,
      props: { shape },
    }),
  };
}

/**
 * Assemble le modèle : calcule les `path` des écrans et les `href` des boutons liés, et lie à la
 * charte les styles qui en reprennent la valeur, pour que modifier la charte change le modèle.
 */
export function defineTemplate(
  id: string,
  name: string,
  description: string,
  theme: Theme,
  screens: Screen[],
): ScreendraftTemplate {
  const themed = screens.map((item) => ({
    ...item,
    frame: linkFrame(item.frame, theme),
    nodes: item.nodes.map((node) => linkNode(node, theme)),
  }));
  return {
    id,
    name,
    description,
    maquette: syncLinks({ schemaVersion: SCHEMA_VERSION, id: `template_${id}`, name, theme, screens: themed }),
  };
}

function linkFrame(frame: Frame, theme: Theme): Frame {
  return frame.backgroundColor === theme.colors.background
    ? { ...frame, themeLinks: { backgroundColor: "background" } }
    : frame;
}

/**
 * Liens prudents, pour ne pas lier une couleur par coïncidence : le fond suit « primaire » ou
 * « fond des sections », le texte suit « texte », ou « texte sur primaire » sur un fond primaire.
 */
function linkNode(node: DraftNode, theme: Theme): DraftNode {
  const { style } = node;
  const { colors } = theme;
  const links: ThemeLinks = {};
  if (style.backgroundColor === colors.primary) links.backgroundColor = "primary";
  else if (style.backgroundColor === colors.surface) links.backgroundColor = "surface";
  if (style.color === colors.text) links.color = "text";
  else if (style.color === colors.onPrimary && links.backgroundColor === "primary") links.color = "onPrimary";
  if (style.borderColor !== undefined && style.borderColor === colors.border) links.borderColor = "border";
  if (style.borderRadius !== undefined && style.borderRadius === theme.radius) links.borderRadius = "radius";
  const size: ThemeTextSize | null =
    node.type === "title" ? `heading${node.props.level}` : node.type === "text" ? "body" : null;
  if (size && style.fontSize === theme.textSizes[size]) links.fontSize = size;

  const linked = Object.keys(links).length > 0 ? { ...node, themeLinks: links } : node;
  return linked.type === "section"
    ? { ...linked, children: linked.children.map((child) => linkNode(child, theme)) }
    : linked;
}

/** Image de remplacement : `placehold.co`, aux couleurs du modèle. */
export function placeholder(width: number, height: number, background: string, color: string, label: string) {
  return `https://placehold.co/${width}x${height}/${background}/${color}?text=${encodeURIComponent(label)}`;
}
