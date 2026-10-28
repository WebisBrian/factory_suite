/**
 * Conversion d'une maquette Screendraft en page HTML/CSS autonome.
 *
 * Chaque élément est positionné en absolu dans son parent (les coordonnées des
 * enfants d'une section sont relatives à cette section). Le HTML suit l'ordre de
 * lecture visuel (haut → bas, gauche → droite) pour les lecteurs d'écran et la
 * tabulation ; l'empilement de la maquette (dernier élément du tableau au-dessus)
 * est conservé par un `z-index` explicite. Chaque balise porte un `id` CSS et
 * les attributs `data-node-id` / `data-node-type` pour que le squad Animations
 * puisse cibler les éléments.
 */
import type { Maquette, MaquetteScreen, MaquetteNode, MaquetteNodeStyle } from "@/app/codeforge/generator/_lib/maquette";

export const HTML_FILE = "page.html";
export const CSS_FILE = "page.css";

export type GeneratedPage = {
  screen: MaquetteScreen;
  cssPath: string;
  /** HTML qui lie le fichier cssPath, à placer dans le même dossier. */
  html: string;
  /** Feuille de style de cet écran. */
  css: string;
  /** Page autonome (CSS intégré), pour l'aperçu en iframe. */
  standaloneHtml: string;
};

export function generateSite(maquette: Maquette): GeneratedPage[] {
  const paths = new Map(maquette.screens.map((screen) => [screen.id, screen.path]));
  return maquette.screens.map((screen) => generatePage(screen, maquette.id, paths));
}

export function generatePage(maquette: MaquetteScreen, documentId = maquette.id, paths: ReadonlyMap<string, string> = new Map()): GeneratedPage {
  const cssIds = new Map<string, string>();
  const usedCssIds = new Set<string>();
  const cssIdOf = (node: MaquetteNode) => {
    let cssId = cssIds.get(node.id);
    if (cssId === undefined) {
      cssId = uniqueCssId(node.id, usedCssIds);
      cssIds.set(node.id, cssId);
    }
    return cssId;
  };

  const cssPath = maquette.path.replace(/\.html$/i, ".css");
  const body = renderNodes(maquette.nodes, cssIdOf, 2, paths);
  const css = [baseCss(maquette), ...collectRules(maquette.nodes, cssIdOf)].join("\n\n") + "\n";

  const page = (head: string) =>
    [
      "<!doctype html>",
      '<html lang="fr">',
      "<head>",
      '  <meta charset="utf-8">',
      `  <meta name="viewport" content="width=${maquette.frame.width}">`,
      `  <title>${escapeHtml(maquette.name)}</title>`,
      head,
      "</head>",
      "<body>",
      // <main> : repère de navigation principal pour les lecteurs d'écran.
      `  <main class="maquette-frame" data-maquette-id="${escapeAttr(documentId)}" data-screen-id="${escapeAttr(maquette.id)}">`,
      body,
      "  </main>",
      "</body>",
      "</html>",
      "",
    ].join("\n");

  return {
    screen: maquette,
    cssPath,
    html: page(`  <link rel="stylesheet" href="${cssPath}">`),
    css,
    standaloneHtml: page(`  <style>\n${css}  </style>`),
  };
}

function baseCss(maquette: MaquetteScreen): string {
  const { frame } = maquette;
  return `*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
}

body {
  background: #e5e7eb;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  line-height: 1.25;
}

.maquette-frame {
  position: relative;
  width: ${frame.width}px;
  height: ${frame.height}px;
  margin: 0 auto;
  overflow: hidden;
  background-color: ${frame.backgroundColor};
}

.maquette-frame [data-node-type] {
  position: absolute;
  overflow-wrap: break-word;
}

.maquette-frame img {
  display: block;
}

.maquette-frame iframe, .maquette-frame video {
  display: block;
  border: 0;
}

.maquette-frame [data-node-type="button"] {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: 0;
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}

/* Focus clavier visible sur tout fond : contour bleu foncé doublé d'un liseré blanc. */
.maquette-frame :focus-visible {
  outline: 3px solid #0a4fb8;
  outline-offset: 2px;
  box-shadow: 0 0 0 5px #ffffff;
}`;
}

/**
 * Ordre de lecture : lignes de haut en bas, puis de gauche à droite dans chaque ligne.
 * Un élément rejoint la ligne en cours si son centre vertical tombe dans la hauteur
 * du premier élément de la ligne (logo, titre et menu d'un en-tête par exemple).
 * Les formes, décoratives (aria-hidden), restent en tête : un fond pleine page
 * ne doit pas servir de ligne et regrouper tout le reste.
 */
function readingOrder(nodes: MaquetteNode[]): MaquetteNode[] {
  const shapes = nodes.filter((node) => node.type === "shape");
  const rows: MaquetteNode[][] = [];
  const content = nodes.filter((node) => node.type !== "shape");
  for (const node of content.sort((a, b) => a.y - b.y || a.x - b.x)) {
    const row = rows.at(-1);
    const center = node.y + node.height / 2;
    if (row && center >= row[0].y && center <= row[0].y + row[0].height) row.push(node);
    else rows.push([node]);
  }
  return [...shapes, ...rows.flatMap((row) => row.sort((a, b) => a.x - b.x))];
}

function renderNodes(nodes: MaquetteNode[], cssIdOf: (node: MaquetteNode) => string, depth: number, paths: ReadonlyMap<string, string>): string {
  return readingOrder(nodes).map((node) => renderNode(node, cssIdOf, depth, paths)).join("\n");
}

function renderNode(node: MaquetteNode, cssIdOf: (node: MaquetteNode) => string, depth: number, paths: ReadonlyMap<string, string>): string {
  const indent = "  ".repeat(depth);
  const attrs = `id="${cssIdOf(node)}" data-node-id="${escapeAttr(node.id)}" data-node-type="${node.type}"`;

  switch (node.type) {
    case "section":
      if (node.children.length === 0) return `${indent}<section ${attrs}></section>`;
      return `${indent}<section ${attrs}>\n${renderNodes(node.children, cssIdOf, depth + 1, paths)}\n${indent}</section>`;
    // Titre ou paragraphe vide : bloc décoratif, pour ne pas annoncer un titre sans contenu.
    case "title":
      if (!node.props.text.trim()) return `${indent}<div ${attrs} aria-hidden="true"></div>`;
      return `${indent}<h${node.props.level} ${attrs}>${escapeHtml(node.props.text)}</h${node.props.level}>`;
    case "text":
      if (!node.props.text.trim()) return `${indent}<div ${attrs} aria-hidden="true"></div>`;
      return `${indent}<p ${attrs}>${escapeHtml(node.props.text)}</p>`;
    case "image":
      return `${indent}<img ${attrs} src="${escapeAttr(node.props.src)}" alt="${escapeAttr(node.props.alt)}">`;
    case "button": {
      const href = (node.props.targetScreenId ? paths.get(node.props.targetScreenId) : undefined) ?? node.props.href;
      return href === undefined
        ? `${indent}<button type="button" ${attrs}>${escapeHtml(node.props.label)}</button>`
        : `${indent}<a ${attrs} href="${escapeAttr(href)}">${escapeHtml(node.props.label)}</a>`;
    }
    case "shape":
      if (node.props.shape === "triangle") {
        return `${indent}<svg ${attrs} aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,0 100,100 0,100" fill="${node.style.backgroundColor ?? "none"}" stroke="${node.style.borderColor ?? "none"}" stroke-width="${node.style.borderWidth ?? 0}" vector-effect="non-scaling-stroke" /></svg>`;
      }
      return `${indent}<div ${attrs} aria-hidden="true"></div>`;
    case "video": {
      // Un lecteur sans nom n'est pas identifiable au lecteur d'écran : nom générique par défaut.
      const title = node.props.title.trim() || "Vidéo";
      if (!node.props.src) return `${indent}<div ${attrs} role="img" aria-label="${escapeAttr(title)}"></div>`;
      return node.props.kind === "embed"
        ? `${indent}<iframe ${attrs} src="${escapeAttr(node.props.src)}" title="${escapeAttr(title)}" loading="lazy" allowfullscreen></iframe>`
        : `${indent}<video ${attrs} src="${escapeAttr(node.props.src)}" aria-label="${escapeAttr(title)}" controls preload="metadata">${escapeHtml(title)}</video>`;
    }
  }
}

function collectRules(nodes: MaquetteNode[], cssIdOf: (node: MaquetteNode) => string): string[] {
  return nodes.flatMap((node, index) => {
    const declarations = [
      `left: ${node.x}px;`,
      `top: ${node.y}px;`,
      `width: ${node.width}px;`,
      `height: ${node.height}px;`,
      // Le HTML suit l'ordre de lecture : l'empilement de la maquette est porté par le z-index.
      `z-index: ${index + 1};`,
      ...(node.type === "shape" && node.props.shape === "triangle" ? ["overflow: visible;"] : styleDeclarations(node.style)),
    ];
    if (node.type === "image") declarations.push(`object-fit: ${node.props.fit};`);
    if (node.type === "shape" && node.props.shape === "circle") declarations.push("border-radius: 50%;");
    const rule = `#${cssIdOf(node)} {\n${declarations.map((d) => `  ${d}`).join("\n")}\n}`;
    return node.type === "section" ? [rule, ...collectRules(node.children, cssIdOf)] : [rule];
  });
}

const JUSTIFY: Record<NonNullable<MaquetteNodeStyle["textAlign"]>, string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

function styleDeclarations(style: MaquetteNodeStyle): string[] {
  const out: string[] = [];
  if (style.backgroundColor) out.push(`background-color: ${style.backgroundColor};`);
  if (style.color) out.push(`color: ${style.color};`);
  if (style.fontSize !== undefined) out.push(`font-size: ${style.fontSize}px;`);
  if (style.fontWeight !== undefined) out.push(`font-weight: ${style.fontWeight};`);
  if (style.textAlign) out.push(`text-align: ${style.textAlign};`, `justify-content: ${JUSTIFY[style.textAlign]};`);
  if (style.borderRadius !== undefined) out.push(`border-radius: ${style.borderRadius}px;`);
  if (style.borderWidth) out.push(`border: ${style.borderWidth}px solid ${style.borderColor ?? "currentColor"};`);
  return out;
}

/** Identifiant utilisable tel quel dans un sélecteur CSS `#…`, unique dans la page. */
function uniqueCssId(nodeId: string, used: Set<string>): string {
  let base = nodeId.replace(/[^A-Za-z0-9_-]/g, "_");
  if (!/^[A-Za-z_]/.test(base)) base = `n_${base}`;
  let cssId = base;
  for (let i = 2; used.has(cssId); i++) cssId = `${base}_${i}`;
  used.add(cssId);
  return cssId;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, "&quot;");
}
