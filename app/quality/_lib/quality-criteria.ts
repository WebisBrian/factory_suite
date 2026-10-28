// Critères de qualité de l'étape 4. Chaque critère est vérifié sur la page générée par ScreenDraft
// (page.html + page.css), par analyse statique dans le navigateur. Ce qui ne peut pas l'être
// (contraste réel, lecteur d'écran, temps de chargement) est un critère « manuel » à cocher.

export type QualityCategory = "performance" | "accessibility" | "best-practices" | "seo";
export type Severity = "required" | "recommended";
export type CheckStatus = "pass" | "fail" | "manual";

export interface QualityInput {
  doc: Document;
  html: string;
  css: string;
}

export interface CheckOutcome {
  ok: boolean;
  /** Valeur mesurée ou éléments en cause, affichés sous le critère. */
  detail?: string;
}

export interface QualityCriterion {
  id: string;
  category: QualityCategory;
  severity: Severity;
  title: string;
  /** Seuil attendu, écrit en toutes lettres. */
  target: string;
  /** Absent : critère à vérifier à la main. */
  check?: (input: QualityInput) => CheckOutcome;
  /** Correction automatique : modifie le document et renvoie ce qui a changé (null si rien à faire). */
  fix?: (doc: Document) => string | null;
}

export const CATEGORIES: readonly { id: QualityCategory; label: string; goal: string }[] = [
  { id: "performance", label: "Performance", goal: "La page se charge vite et ne bouge pas pendant le chargement." },
  { id: "accessibility", label: "Accessibilité", goal: "La page est utilisable au clavier et au lecteur d'écran." },
  { id: "best-practices", label: "Bonnes pratiques", goal: "Le code est valide, sûr et sans balise obsolète." },
  { id: "seo", label: "SEO", goal: "Les moteurs de recherche comprennent et affichent bien la page." },
];

/** Une catégorie est validée à partir de 90 % des critères automatiques réussis, et aucun critère obligatoire en échec. */
export const PASS_SCORE = 90;

const kb = (text: string) => new Blob([text]).size / 1024;
const list = (items: string[], max = 3) =>
  items.length === 0 ? undefined : `${items.slice(0, max).join(", ")}${items.length > max ? `… (+${items.length - max})` : ""}`;
const all = (doc: Document, selector: string) => Array.from(doc.querySelectorAll(selector));
const tag = (el: Element) => `<${el.localName}${el.id ? ` id="${el.id}"` : ""}>`;


/** CSS de la feuille liée + des balises <style> : c'est là que vivent les animations. */
const allCss = ({ css, doc }: QualityInput) => css + all(doc, "style").map((x) => x.textContent ?? "").join("\n");
const hasAnimation = (source: string) => /@keyframes|\banimation(-name)?\s*:|\btransition\s*:/i.test(source);
const LAYOUT_PROPS = /^(width|height|top|left|right|bottom|margin[\w-]*|padding[\w-]*|font-size|border-width)$/i;

function accessibleName(el: Element): string {
  return (
    el.getAttribute("aria-label")?.trim() ||
    (el.hasAttribute("aria-labelledby") ? "labelledby" : "") ||
    (el.textContent ?? "").trim() ||
    (el.querySelector("img[alt]:not([alt=''])") ? "img" : "") ||
    el.getAttribute("title")?.trim() ||
    ""
  );
}

function fieldHasLabel(doc: Document, el: Element): boolean {
  if (el.getAttribute("aria-label")?.trim() || el.getAttribute("aria-labelledby")) return true;
  if (el.closest("label")) return true;
  return el.id !== "" && doc.querySelector(`label[for="${CSS.escape(el.id)}"]`) !== null;
}

export const CRITERIA: readonly QualityCriterion[] = [
  // ───────── Performance ─────────
  {
    id: "perf-weight",
    category: "performance",
    severity: "required",
    title: "Poids HTML + CSS raisonnable",
    target: "100 Ko ou moins",
    check: ({ html, css }) => {
      const size = kb(html) + kb(css);
      return { ok: size <= 100, detail: `${size.toFixed(1)} Ko` };
    },
  },
  {
    id: "perf-dom",
    category: "performance",
    severity: "recommended",
    title: "Arbre DOM léger",
    target: "800 éléments ou moins",
    check: ({ doc }) => {
      const count = doc.querySelectorAll("*").length;
      return { ok: count <= 800, detail: `${count} éléments` };
    },
  },
  {
    id: "perf-img-size",
    category: "performance",
    severity: "required",
    title: "Images avec largeur et hauteur déclarées (évite le saut de mise en page)",
    target: "100 % des images ont width et height",
    check: ({ doc }) => {
      const bad = all(doc, "img").filter((i) => !i.hasAttribute("width") || !i.hasAttribute("height"));
      return { ok: bad.length === 0, detail: list(bad.map(tag)) };
    },
  },
  {
    id: "perf-img-lazy",
    category: "performance",
    severity: "recommended",
    title: "Images hors écran chargées à la demande",
    target: "loading=\"lazy\" sur toutes les images sauf la première",
    check: ({ doc }) => {
      const bad = all(doc, "img").slice(1).filter((i) => i.getAttribute("loading") !== "lazy");
      return { ok: bad.length === 0, detail: list(bad.map(tag)) };
    },
    fix: (doc) => {
      const imgs = all(doc, "img").slice(1).filter((i) => i.getAttribute("loading") !== "lazy");
      imgs.forEach((i) => i.setAttribute("loading", "lazy"));
      return imgs.length ? `loading="lazy" ajouté à ${imgs.length} image(s)` : null;
    },
  },
  {
    id: "perf-scripts",
    category: "performance",
    severity: "required",
    title: "Aucun script externe bloquant l'affichage",
    target: "<script src> avec defer, async ou type=\"module\"",
    check: ({ doc }) => {
      const bad = all(doc, "script[src]").filter(
        (s) => !s.hasAttribute("defer") && !s.hasAttribute("async") && s.getAttribute("type") !== "module",
      );
      return { ok: bad.length === 0, detail: list(bad.map((s) => s.getAttribute("src") ?? "")) };
    },
    fix: (doc) => {
      const scripts = all(doc, "script[src]").filter(
        (x) => !x.hasAttribute("defer") && !x.hasAttribute("async") && x.getAttribute("type") !== "module",
      );
      scripts.forEach((x) => x.setAttribute("defer", ""));
      return scripts.length ? `defer ajouté à ${scripts.length} script(s)` : null;
    },
  },
  {
    id: "perf-import",
    category: "performance",
    severity: "recommended",
    title: "Pas de @import dans le CSS (chaîne de requêtes)",
    target: "0 @import",
    check: ({ css, doc }) => {
      const count = (css.match(/@import/gi) ?? []).length + all(doc, "style").filter((s) => /@import/i.test(s.textContent ?? "")).length;
      return { ok: count === 0, detail: count ? `${count} @import` : undefined };
    },
  },
  {
    id: "perf-anim-props",
    category: "performance",
    severity: "recommended",
    title: "Animations limitées à transform et opacity (pas de recalcul de mise en page)",
    target: "Aucun @keyframes ne modifie width, height, top, left, margin, padding…",
    check: (input) => {
      const bad = new Set<string>();
      for (const [, body] of allCss(input).matchAll(/@keyframes\s+[\w-]+\s*\{((?:[^{}]*\{[^}]*\})*)\s*\}/gi)) {
        for (const [, prop] of body.matchAll(/([\w-]+)\s*:/g)) if (LAYOUT_PROPS.test(prop)) bad.add(prop);
      }
      return { ok: bad.size === 0, detail: list([...bad]) };
    },
  },
  {
    id: "perf-real",
    category: "performance",
    severity: "recommended",
    title: "Mesure réelle : LCP ≤ 2,5 s, CLS ≤ 0,1, TBT ≤ 200 ms",
    target: "Relevés dans Lighthouse ou PageSpeed sur la page publiée",
  },

  // ───────── Accessibilité ─────────
  {
    id: "a11y-lang",
    category: "accessibility",
    severity: "required",
    title: "Langue de la page déclarée",
    target: "<html lang=\"fr\"> (ou autre code valide)",
    check: ({ doc }) => {
      const lang = doc.documentElement.getAttribute("lang")?.trim() ?? "";
      return { ok: /^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(lang), detail: lang ? `lang="${lang}"` : "lang absent" };
    },
    fix: (doc) => {
      if (/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(doc.documentElement.getAttribute("lang")?.trim() ?? "")) return null;
      doc.documentElement.setAttribute("lang", "fr");
      return 'lang="fr" ajouté à <html>';
    },
  },
  {
    id: "a11y-alt",
    category: "accessibility",
    severity: "required",
    title: "Toute image a un attribut alt",
    target: "100 % des images (alt=\"\" si décorative)",
    check: ({ doc }) => {
      const bad = all(doc, "img").filter((i) => !i.hasAttribute("alt"));
      return { ok: bad.length === 0, detail: list(bad.map(tag)) };
    },
    fix: (doc) => {
      const imgs = all(doc, "img").filter((i) => !i.hasAttribute("alt"));
      imgs.forEach((i) => i.setAttribute("alt", ""));
      return imgs.length ? `alt="" ajouté à ${imgs.length} image(s) (à décrire si elles portent une information)` : null;
    },
  },
  {
    id: "a11y-h1",
    category: "accessibility",
    severity: "required",
    title: "Un seul titre de niveau 1",
    target: "Exactement 1 <h1>",
    check: ({ doc }) => {
      const count = doc.querySelectorAll("h1").length;
      return { ok: count === 1, detail: `${count} <h1>` };
    },
  },
  {
    id: "a11y-headings",
    category: "accessibility",
    severity: "required",
    title: "Hiérarchie des titres sans saut",
    target: "h1 → h2 → h3, jamais h1 → h3",
    check: ({ doc }) => {
      const levels = all(doc, "h1,h2,h3,h4,h5,h6").map((h) => Number(h.localName[1]));
      const jump = levels.findIndex((level, i) => i > 0 && level > levels[i - 1] + 1);
      return { ok: jump === -1, detail: jump === -1 ? undefined : `h${levels[jump - 1]} puis h${levels[jump]}` };
    },
  },
  {
    id: "a11y-names",
    category: "accessibility",
    severity: "required",
    title: "Boutons et liens avec un nom lisible",
    target: "Texte visible ou aria-label sur 100 % des boutons et liens",
    check: ({ doc }) => {
      const bad = all(doc, "a[href], button").filter((el) => accessibleName(el) === "");
      return { ok: bad.length === 0, detail: list(bad.map(tag)) };
    },
  },
  {
    id: "a11y-labels",
    category: "accessibility",
    severity: "required",
    title: "Chaque champ de formulaire a une étiquette",
    target: "<label for>, <label> englobant ou aria-label",
    check: ({ doc }) => {
      const bad = all(doc, "input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea").filter(
        (el) => !fieldHasLabel(doc, el),
      );
      return { ok: bad.length === 0, detail: list(bad.map(tag)) };
    },
  },
  {
    id: "a11y-landmarks",
    category: "accessibility",
    severity: "recommended",
    title: "Zone principale identifiée",
    target: "Un <main> (ou role=\"main\")",
    check: ({ doc }) => ({ ok: doc.querySelector("main, [role=main]") !== null }),
  },
  {
    id: "a11y-focus",
    category: "accessibility",
    severity: "required",
    title: "Contour de focus jamais supprimé",
    target: "0 règle outline: none sans remplacement",
    check: ({ css, doc }) => {
      const source = css + all(doc, "style").map((s) => s.textContent ?? "").join("");
      const bad = /:focus[^{]*\{[^}]*outline\s*:\s*(none|0)\b(?![^}]*(box-shadow|border))/i.test(source);
      return { ok: !bad };
    },
  },
  {
    id: "a11y-motion",
    category: "accessibility",
    severity: "required",
    title: "Animations désactivables (« réduire les animations »)",
    target: "Toute animation ou transition est accompagnée d'un bloc @media (prefers-reduced-motion)",
    check: (input) => {
      const source = allCss(input);
      return { ok: !hasAnimation(source) || /prefers-reduced-motion/i.test(source) };
    },
    fix: (doc) => {
      const source = all(doc, "style").map((x) => x.textContent ?? "").join("\n");
      if (!hasAnimation(source) || /prefers-reduced-motion/i.test(source)) return null;
      const style = doc.createElement("style");
      style.textContent =
        "@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none!important;transition:none!important}}";
      doc.head.append(style);
      return "bloc prefers-reduced-motion ajouté";
    },
  },
  {
    id: "a11y-manual",
    category: "accessibility",
    severity: "required",
    title: "Contraste, clavier et lecteur d'écran",
    target: "Texte ≥ 4,5:1 (7:1 visé), parcours complet au clavier, lecture au lecteur d'écran sans blocage",
  },

  // ───────── Bonnes pratiques ─────────
  {
    id: "bp-doctype",
    category: "best-practices",
    severity: "required",
    title: "Doctype HTML5",
    target: "<!doctype html> en première ligne",
    check: ({ html }) => ({ ok: /^\s*<!doctype html>/i.test(html) }),
  },
  {
    id: "bp-charset",
    category: "best-practices",
    severity: "required",
    title: "Encodage UTF-8 déclaré",
    target: "<meta charset=\"utf-8\">",
    check: ({ doc }) => ({ ok: /utf-8/i.test(doc.querySelector("meta[charset]")?.getAttribute("charset") ?? "") }),
    fix: (doc) => {
      if (/utf-8/i.test(doc.querySelector("meta[charset]")?.getAttribute("charset") ?? "")) return null;
      doc.querySelector("meta[charset]")?.remove();
      const meta = doc.createElement("meta");
      meta.setAttribute("charset", "utf-8");
      doc.head.prepend(meta);
      return "<meta charset=\"utf-8\"> ajouté";
    },
  },
  {
    id: "bp-https",
    category: "best-practices",
    severity: "required",
    title: "Ressources en HTTPS",
    target: "0 ressource en http://",
    check: ({ doc }) => {
      const bad = all(doc, "[src], link[href]")
        .map((el) => el.getAttribute("src") ?? el.getAttribute("href") ?? "")
        .filter((url) => url.startsWith("http://"));
      return { ok: bad.length === 0, detail: list(bad) };
    },
  },
  {
    id: "bp-noopener",
    category: "best-practices",
    severity: "required",
    title: "Liens externes ouverts dans un nouvel onglet sécurisés",
    target: "target=\"_blank\" accompagné de rel=\"noopener\"",
    check: ({ doc }) => {
      const bad = all(doc, "a[target=_blank]").filter((a) => !/\bnoopener\b/.test(a.getAttribute("rel") ?? ""));
      return { ok: bad.length === 0, detail: list(bad.map(tag)) };
    },
    fix: (doc) => {
      const links = all(doc, "a[target=_blank]").filter((a) => !/\bnoopener\b/.test(a.getAttribute("rel") ?? ""));
      links.forEach((a) => a.setAttribute("rel", `${a.getAttribute("rel") ?? ""} noopener`.trim()));
      return links.length ? `rel="noopener" ajouté à ${links.length} lien(s)` : null;
    },
  },
  {
    id: "bp-ids",
    category: "best-practices",
    severity: "required",
    title: "Identifiants uniques",
    target: "0 id en double",
    check: ({ doc }) => {
      const seen = new Set<string>();
      const dupes = new Set<string>();
      for (const el of all(doc, "[id]")) (seen.has(el.id) ? dupes : seen).add(el.id);
      return { ok: dupes.size === 0, detail: list([...dupes]) };
    },
  },
  {
    id: "bp-inline-handlers",
    category: "best-practices",
    severity: "recommended",
    title: "Pas de gestionnaire d'événement dans le HTML",
    target: "0 attribut onclick, onload…",
    check: ({ doc }) => {
      const bad = all(doc, "*").filter((el) => el.getAttributeNames().some((n) => n.startsWith("on")));
      return { ok: bad.length === 0, detail: list(bad.map(tag)) };
    },
  },
  {
    id: "bp-deprecated",
    category: "best-practices",
    severity: "recommended",
    title: "Aucune balise obsolète",
    target: "Ni <font>, <center>, <marquee>, <blink>",
    check: ({ doc }) => {
      const bad = all(doc, "font, center, marquee, blink");
      return { ok: bad.length === 0, detail: list(bad.map(tag)) };
    },
  },
  {
    id: "bp-stylesheet",
    category: "best-practices",
    severity: "required",
    title: "Feuille de style liée présente",
    target: "Chaque <link rel=\"stylesheet\"> local pointe vers un fichier du projet",
    check: ({ doc }) => {
      const local = all(doc, "link[rel=stylesheet]").map((l) => l.getAttribute("href") ?? "").filter((h) => !/^(https?:)?\/\//.test(h));
      return { ok: local.length === 0 || local.every((h) => h === "page.css"), detail: list(local.filter((h) => h !== "page.css")) };
    },
  },

  // ───────── SEO ─────────
  {
    id: "seo-title",
    category: "seo",
    severity: "required",
    title: "Titre de page utile",
    target: "<title> de 10 à 60 caractères",
    check: ({ doc }) => {
      const length = (doc.title ?? "").trim().length;
      return { ok: length >= 10 && length <= 60, detail: `${length} caractères` };
    },
  },
  {
    id: "seo-description",
    category: "seo",
    severity: "required",
    title: "Meta description",
    target: "<meta name=\"description\"> de 50 à 160 caractères",
    check: ({ doc }) => {
      const length = (doc.querySelector("meta[name=description]")?.getAttribute("content") ?? "").trim().length;
      return { ok: length >= 50 && length <= 160, detail: length ? `${length} caractères` : "absente" };
    },
  },
  {
    id: "seo-viewport",
    category: "seo",
    severity: "required",
    title: "Page adaptée au mobile",
    target: "<meta name=\"viewport\" content=\"width=device-width…\">",
    check: ({ doc }) => ({
      ok: /width\s*=\s*device-width/i.test(doc.querySelector("meta[name=viewport]")?.getAttribute("content") ?? ""),
    }),
    fix: (doc) => {
      if (/width\s*=\s*device-width/i.test(doc.querySelector("meta[name=viewport]")?.getAttribute("content") ?? "")) return null;
      doc.querySelector("meta[name=viewport]")?.remove();
      const meta = doc.createElement("meta");
      meta.setAttribute("name", "viewport");
      meta.setAttribute("content", "width=device-width, initial-scale=1");
      doc.head.append(meta);
      return "<meta name=\"viewport\"> adaptatif ajouté";
    },
  },
  {
    id: "seo-h1",
    category: "seo",
    severity: "required",
    title: "Un <h1> non vide qui décrit la page",
    target: "1 <h1> avec du texte",
    check: ({ doc }) => {
      const h1 = doc.querySelectorAll("h1");
      return { ok: h1.length === 1 && (h1[0].textContent ?? "").trim().length > 0 };
    },
  },
  {
    id: "seo-link-text",
    category: "seo",
    severity: "recommended",
    title: "Textes de liens explicites",
    target: "Ni « cliquez ici », ni « en savoir plus » seuls",
    check: ({ doc }) => {
      const bad = all(doc, "a[href]").filter((a) => /^(cliquez ici|ici|en savoir plus|lien|click here)$/i.test((a.textContent ?? "").trim()));
      return { ok: bad.length === 0, detail: list(bad.map((a) => `« ${(a.textContent ?? "").trim()} »`)) };
    },
  },
  {
    id: "seo-links",
    category: "seo",
    severity: "recommended",
    title: "Liens explorables",
    target: "Aucun href vide, « # » seul ou javascript:",
    check: ({ doc }) => {
      const bad = all(doc, "a").filter((a) => {
        const href = a.getAttribute("href");
        return href === null || href.trim() === "" || href.trim() === "#" || /^javascript:/i.test(href);
      });
      return { ok: bad.length === 0, detail: list(bad.map(tag)) };
    },
  },
  {
    id: "seo-lang",
    category: "seo",
    severity: "recommended",
    title: "Langue déclarée pour le référencement",
    target: "<html lang> renseigné",
    check: ({ doc }) => ({ ok: (doc.documentElement.getAttribute("lang") ?? "").trim() !== "" }),
  },
];

export interface CriterionResult {
  criterion: QualityCriterion;
  status: CheckStatus;
  detail?: string;
}

export interface CategoryReport {
  id: QualityCategory;
  label: string;
  goal: string;
  results: CriterionResult[];
  /** Pourcentage de critères automatiques réussis (100 s'il n'y en a aucun). */
  score: number;
  passed: boolean;
}

export function parseQualityInput(html: string, css: string): QualityInput {
  return { doc: new DOMParser().parseFromString(html, "text/html"), html, css };
}

export function runQualityCheck(input: QualityInput): CategoryReport[] {
  return CATEGORIES.map((category) => {
    const results = CRITERIA.filter((c) => c.category === category.id).map<CriterionResult>((criterion) => {
      if (!criterion.check) return { criterion, status: "manual" };
      const outcome = criterion.check(input);
      return { criterion, status: outcome.ok ? "pass" : "fail", detail: outcome.detail };
    });
    const auto = results.filter((r) => r.status !== "manual");
    const score = auto.length === 0 ? 100 : Math.round((auto.filter((r) => r.status === "pass").length / auto.length) * 100);
    const requiredFailed = results.some((r) => r.status === "fail" && r.criterion.severity === "required");
    return { ...category, results, score, passed: score >= PASS_SCORE && !requiredFailed };
  });
}

export interface AutoFixResult {
  html: string;
  /** Une phrase par correction appliquée. */
  applied: string[];
}

/** Applique toutes les corrections automatiques. Le doctype est réécrit à chaque fois (bp-doctype). */
export function applyAutoFixes(html: string): AutoFixResult {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const applied: string[] = [];
  if (!/^\s*<!doctype html>/i.test(html)) applied.push("<!doctype html> ajouté");
  for (const criterion of CRITERIA) {
    const message = criterion.fix?.(doc);
    if (message) applied.push(message);
  }
  return { html: `<!doctype html>\n${doc.documentElement.outerHTML}\n`, applied };
}

/** Moyenne des scores par catégorie sur plusieurs écrans ; une catégorie n'est validée que si elle l'est sur tous. */
export function mergeReports(perScreen: CategoryReport[][]): CategoryReport[] {
  return CATEGORIES.map((category, i) => {
    const reports = perScreen.map((r) => r[i]);
    const score = Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length);
    return { ...reports[0], id: category.id, score, passed: reports.every((r) => r.passed) };
  });
}
