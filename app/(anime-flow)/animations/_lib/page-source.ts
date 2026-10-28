/**
 * Préparation de la page produite par le Générateur pour l'aperçu.
 *
 * Le Générateur écrit `page.html`, qui charge `page.css` par un <link>. Dans
 * une iframe `srcDoc`, ce lien relatif ne mène nulle part : on remplace donc
 * le <link> par le contenu du CSS.
 */

export const PAGE_FILE = "page.html";
export const STYLE_FILE = "page.css";

const STYLESHEET_LINK = /<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi;

/** Intègre `css` à la place du <link> vers `cssName`. */
export function inlineStylesheet(html: string, css: string, cssName = STYLE_FILE): string {
  // Un « </style> » dans le CSS fermerait la balise trop tôt.
  const style = `<style>\n${css.replace(/<\/style/gi, "<\\/style")}\n</style>`;
  return html.replace(STYLESHEET_LINK, (link) => (linkHref(link) === cssName ? style : link));
}

/** Noms des feuilles de style encore liées (donc absentes de l'aperçu). */
export function missingStylesheets(html: string): string[] {
  return Array.from(html.matchAll(STYLESHEET_LINK), ([link]) => linkHref(link)).filter(
    (href): href is string => href !== null && !/^(https?:)?\/\//.test(href),
  );
}

/** Largeur fixe de la page (`<meta name="viewport" content="width=1440">`), ou null si elle s'adapte. */
export function pageWidth(html: string): number | null {
  const meta = html.match(/<meta\b[^>]*name=["']?viewport["']?[^>]*>/i)?.[0];
  const width = meta?.match(/width\s*=\s*(\d+)/i)?.[1];
  return width ? Number(width) : null;
}

function linkHref(link: string): string | null {
  return link.match(/href=["']?([^"'\s>]+)/i)?.[1] ?? null;
}
