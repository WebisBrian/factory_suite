/**
 * Conversion d'une maquette Screendraft en page HTML/CSS autonome.
 *
 * Chaque élément est positionné en absolu dans son parent (les coordonnées des
 * enfants d'une section sont relatives à cette section), dans l'ordre du tableau :
 * le dernier élément est dessiné au-dessus. Chaque balise porte un `id` CSS et
 * les attributs `data-node-id` / `data-node-type` pour que le squad Animations
 * puisse cibler les éléments.
 */
import type { Maquette, MaquetteNode, MaquetteNodeStyle } from "@/app/codeforge/generator/_lib/maquette";

export const HTML_FILE = "page.html";
export const CSS_FILE = "page.css";

export type GeneratedPage = {
  /** Contenu de page.html : lie page.css, à placer dans le même dossier. */
  html: string;
  /** Contenu de page.css. */
  css: string;
  /** Page autonome (CSS intégré), pour l'aperçu en iframe. */
  standaloneHtml: string;
};

export function generatePage(maquette: Maquette): GeneratedPage {
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

  const body = renderNodes(maquette.nodes, cssIdOf, 2);
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
      `  <div class="maquette-frame" data-maquette-id="${escapeAttr(maquette.id)}">`,
      body,
      "  </div>",
      "</body>",
      "</html>",
      "",
    ].join("\n");

  return {
    html: page(`  <link rel="stylesheet" href="${CSS_FILE}">`),
    css,
    standaloneHtml: page(`  <style>\n${css}  </style>`),
  };
}

function baseCss(maquette: Maquette): string {
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

.maquette-frame [data-node-type="button"] {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: 0;
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}`;
}

function renderNodes(nodes: MaquetteNode[], cssIdOf: (node: MaquetteNode) => string, depth: number): string {
  return nodes.map((node) => renderNode(node, cssIdOf, depth)).join("\n");
}

function renderNode(node: MaquetteNode, cssIdOf: (node: MaquetteNode) => string, depth: number): string {
  const indent = "  ".repeat(depth);
  const attrs = `id="${cssIdOf(node)}" data-node-id="${escapeAttr(node.id)}" data-node-type="${node.type}"`;

  switch (node.type) {
    case "section":
      if (node.children.length === 0) return `${indent}<section ${attrs}></section>`;
      return `${indent}<section ${attrs}>\n${renderNodes(node.children, cssIdOf, depth + 1)}\n${indent}</section>`;
    case "title":
      return `${indent}<h${node.props.level} ${attrs}>${escapeHtml(node.props.text)}</h${node.props.level}>`;
    case "text":
      return `${indent}<p ${attrs}>${escapeHtml(node.props.text)}</p>`;
    case "image":
      return `${indent}<img ${attrs} src="${escapeAttr(node.props.src)}" alt="${escapeAttr(node.props.alt)}">`;
    case "button":
      return node.props.href === undefined
        ? `${indent}<button type="button" ${attrs}>${escapeHtml(node.props.label)}</button>`
        : `${indent}<a ${attrs} href="${escapeAttr(node.props.href)}">${escapeHtml(node.props.label)}</a>`;
  }
}

function collectRules(nodes: MaquetteNode[], cssIdOf: (node: MaquetteNode) => string): string[] {
  return nodes.flatMap((node) => {
    const declarations = [
      `left: ${node.x}px;`,
      `top: ${node.y}px;`,
      `width: ${node.width}px;`,
      `height: ${node.height}px;`,
      ...styleDeclarations(node.style),
    ];
    if (node.type === "image") declarations.push(`object-fit: ${node.props.fit};`);
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
