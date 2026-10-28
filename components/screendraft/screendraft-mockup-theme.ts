import type {
  DraftNode,
  Frame,
  Maquette,
  NodeStyle,
  Screen,
  Theme,
  ThemeColor,
  ThemeLinks,
  ThemeTextSize,
  TitleNode,
} from "@/components/screendraft/screendraft-schema";

/**
 * Charte graphique de la maquette (SCRUM-12) : à ne pas confondre avec `screendraft-theme.css`,
 * l'identité visuelle de l'éditeur lui-même.
 *
 * Valeurs par défaut reprises des anciens styles des composants de la palette, dont les
 * couleurs sont conformes WCAG AA sur le fond blanc du frame et sur une section.
 */
export const DEFAULT_THEME: Theme = {
  colors: {
    primary: "#0369a1",
    onPrimary: "#ffffff",
    text: "#111827",
    background: "#ffffff",
    surface: "#e0f2fe",
    border: "#0284c7",
  },
  textSizes: { heading1: 48, heading2: 36, heading3: 28, body: 18 },
  radius: 12,
};

export const THEME_COLORS: { key: ThemeColor; label: string }[] = [
  { key: "primary", label: "Primaire" },
  { key: "onPrimary", label: "Texte sur primaire" },
  { key: "text", label: "Texte" },
  { key: "background", label: "Fond des écrans" },
  { key: "surface", label: "Fond des sections" },
  { key: "border", label: "Bordures" },
];

export const THEME_TEXT_SIZES: { key: ThemeTextSize; label: string }[] = [
  { key: "heading1", label: "Titre 1" },
  { key: "heading2", label: "Titre 2" },
  { key: "heading3", label: "Titre 3" },
  { key: "body", label: "Texte courant" },
];

/** Modification partielle de la charte. */
export type ThemePatch = {
  colors?: Partial<Theme["colors"]>;
  textSizes?: Partial<Theme["textSizes"]>;
  radius?: number;
};

export function patchTheme(theme: Theme, patch: ThemePatch): Theme {
  return {
    colors: { ...theme.colors, ...patch.colors },
    textSizes: { ...theme.textSizes, ...patch.textSizes },
    radius: patch.radius ?? theme.radius,
  };
}

export function headingSize(level: TitleNode["props"]["level"]): ThemeTextSize {
  return `heading${level}`;
}

/** Ce qu'un élément ajouté depuis la palette reprend de la charte. */
export function defaultThemeLinks(node: DraftNode): ThemeLinks {
  switch (node.type) {
    case "title":
      return { color: "text", fontSize: headingSize(node.props.level) };
    case "text":
      return { color: "text", fontSize: "body" };
    case "button":
      return { backgroundColor: "primary", color: "onPrimary", borderRadius: "radius" };
    case "section":
      return { backgroundColor: "surface", borderColor: "border", borderRadius: "radius" };
    case "shape":
      return { backgroundColor: "primary" };
    case "image":
    case "video":
      return { borderRadius: "radius" };
  }
}

/** Valeurs que la charte donne aux propriétés liées. */
export function themeStyle(links: ThemeLinks, theme: Theme): NodeStyle {
  const style: NodeStyle = {};
  if (links.color) style.color = theme.colors[links.color];
  if (links.backgroundColor) style.backgroundColor = theme.colors[links.backgroundColor];
  if (links.borderColor) style.borderColor = theme.colors[links.borderColor];
  if (links.fontSize) style.fontSize = theme.textSizes[links.fontSize];
  if (links.borderRadius) style.borderRadius = theme.radius;
  return style;
}

/** Remet les propriétés liées d'un élément, et de ses enfants, aux valeurs de la charte. */
export function applyThemeToNode(node: DraftNode, theme: Theme): DraftNode {
  const styled = node.themeLinks ? withStyle(node, themeStyle(node.themeLinks, theme)) : node;
  if (styled.type !== "section") return styled;
  const children = styled.children.map((child) => applyThemeToNode(child, theme));
  return children.every((child, index) => child === styled.children[index])
    ? styled
    : { ...styled, children };
}

/** Applique la charte de la maquette à tous ses écrans. Renvoie la même maquette si rien ne change. */
export function applyTheme(draft: Maquette): Maquette {
  const screens = draft.screens.map((screen) => applyThemeToScreen(screen, draft.theme));
  return screens.every((screen, index) => screen === draft.screens[index]) ? draft : { ...draft, screens };
}

function applyThemeToScreen(screen: Screen, theme: Theme): Screen {
  const frame = applyThemeToFrame(screen.frame, theme);
  const nodes = screen.nodes.map((node) => applyThemeToNode(node, theme));
  const nodesChanged = nodes.some((node, index) => node !== screen.nodes[index]);
  if (frame === screen.frame && !nodesChanged) return screen;
  return { ...screen, frame, nodes: nodesChanged ? nodes : screen.nodes };
}

function applyThemeToFrame(frame: Frame, theme: Theme): Frame {
  const link = frame.themeLinks?.backgroundColor;
  if (!link || frame.backgroundColor === theme.colors[link]) return frame;
  return { ...frame, backgroundColor: theme.colors[link] };
}

function withStyle(node: DraftNode, patch: NodeStyle): DraftNode {
  const unchanged = (Object.keys(patch) as (keyof NodeStyle)[]).every(
    (key) => node.style[key] === patch[key],
  );
  return unchanged ? node : { ...node, style: { ...node.style, ...patch } };
}

/** Un titre lié à la taille de son niveau suit son nouveau niveau. */
export function followTitleLevel(node: DraftNode, theme: Theme): DraftNode {
  const link = node.themeLinks?.fontSize;
  if (node.type !== "title" || !link?.startsWith("heading")) return node;
  const fontSize = headingSize(node.props.level);
  if (link === fontSize) return node;
  return applyThemeToNode({ ...node, themeLinks: { ...node.themeLinks, fontSize } }, theme);
}

/** Lit la charte d'un fichier ; absente ou mal formée, la charte par défaut la remplace. */
export function readTheme(value: unknown): Theme {
  if (!isRecord(value) || !isRecord(value.colors) || !isRecord(value.textSizes)) return DEFAULT_THEME;
  const { colors, textSizes } = value;
  const validColors = THEME_COLORS.every(
    ({ key }) => typeof colors[key] === "string" && String(colors[key]).startsWith("#"),
  );
  const validSizes = THEME_TEXT_SIZES.every(({ key }) => typeof textSizes[key] === "number");
  if (!validColors || !validSizes || typeof value.radius !== "number") return DEFAULT_THEME;
  return value as Theme;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
