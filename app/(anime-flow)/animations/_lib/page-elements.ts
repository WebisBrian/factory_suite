/**
 * Liste les éléments animables d'une page HTML produite par le Générateur.
 *
 * Convention du Générateur : chaque élément porte un `id` CSS, plus
 * `data-node-id` (id dans la maquette) et `data-node-type` (section, title,
 * text, image, button). Un élément animable est un élément qui a un `id` ;
 * c'est cet id qui sera stocké dans la config des animations (`elementId`).
 */

export type PageElement = {
  id: string;
  /** Nom lisible par l'utilisateur et le lecteur d'écran, ex. « Bouton « Contact » ». */
  name: string;
  children: PageElement[];
};

const MAX_LABEL_LENGTH = 40;

const KIND_BY_TAG: Record<string, string> = {
  h1: "Titre principal",
  h2: "Titre",
  h3: "Sous-titre",
  h4: "Sous-titre",
  h5: "Sous-titre",
  h6: "Sous-titre",
  p: "Texte",
  img: "Image",
  button: "Bouton",
  a: "Lien",
  section: "Section",
  header: "En-tête",
  footer: "Pied de page",
  nav: "Menu",
  ul: "Liste",
  li: "Élément de liste",
};

/** Le type de la maquette prime sur la balise : un bouton avec lien est généré en <a>. */
const KIND_BY_NODE_TYPE: Record<string, string> = {
  section: "Section",
  text: "Texte",
  image: "Image",
  button: "Bouton",
};

/** Arbre des éléments qui ont un id, dans l'ordre de la page. */
export function listPageElements(html: string): PageElement[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return collect(doc.body);
}

/** Les éléments à plat, dans l'ordre de la page. */
export function flattenElements(elements: PageElement[]): PageElement[] {
  return elements.flatMap((element) => [element, ...flattenElements(element.children)]);
}

function collect(parent: Element): PageElement[] {
  return Array.from(parent.children).flatMap((child) => {
    // Un conteneur sans id n'est pas animable, mais ses descendants peuvent l'être.
    if (!child.id) return collect(child);
    return [{ id: child.id, name: describe(child), children: collect(child) }];
  });
}

function describe(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const kind = KIND_BY_NODE_TYPE[element.getAttribute("data-node-type") ?? ""] ?? KIND_BY_TAG[tag] ?? "Élément";
  const label = labelOf(element, tag);
  return label ? `${kind} « ${truncate(label)} »` : kind;
}

function labelOf(element: Element, tag: string): string {
  if (tag === "img") return element.getAttribute("alt") ?? "";
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;
  // Une section est nommée par son premier titre.
  if (tag === "section" || tag === "header" || tag === "footer") {
    return element.querySelector("h1, h2, h3, h4, h5, h6")?.textContent ?? "";
  }
  return element.textContent ?? "";
}

function truncate(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > MAX_LABEL_LENGTH ? `${clean.slice(0, MAX_LABEL_LENGTH - 1)}…` : clean;
}
