import { defaultThemeLinks } from "@/components/screendraft/screendraft-mockup-theme";
import type { DraftNode, DraftNodeType, ShapeKind } from "@/components/screendraft/screendraft-schema";

let cloneCount = 0;

/**
 * Copie d'un élément à coller, décalée de `offset` px. Lui et ses enfants reçoivent
 * de nouveaux id : un id doit rester unique dans le document.
 */
export function cloneNode(node: DraftNode, offset: number): DraftNode {
  const id = `${node.type}_${Date.now()}_${++cloneCount}`;
  const copy = { ...node, id, x: node.x + offset, y: node.y + offset };
  if (copy.type !== "section") return copy;
  return { ...copy, children: copy.children.map((child) => cloneNode(child, 0)) };
}

/**
 * Position (x = y) d'un élément inséré depuis la palette, `index` étant le nombre d'éléments
 * déjà au premier niveau : chaque insertion est un peu décalée pour ne pas les empiler.
 */
export function insertionOffset(index: number): number {
  return 40 + (index % 5) * 32;
}

/**
 * Nouvel élément inséré depuis la palette, au premier niveau du frame.
 * Couleurs par défaut conformes WCAG AA sur le fond blanc du frame et sur une section :
 * texte ≥ 4.5:1, formes et bordures ≥ 3:1.
 */
export function createNode(type: DraftNodeType, index: number, shape: ShapeKind = "rectangle"): DraftNode {
  const node = createBaseNode(type, index, shape);
  // Reprend la charte : ses couleurs, tailles et arrondi suivront ses modifications.
  return { ...node, themeLinks: defaultThemeLinks(node) };
}

/** Styles de secours, remplacés par ceux de la charte à l'ajout dans la maquette. */
function createBaseNode(type: DraftNodeType, index: number, shape: ShapeKind): DraftNode {
  const offset = insertionOffset(index);
  const base = { id: `${type}_${Date.now()}_${index}`, x: offset, y: offset };

  switch (type) {
    case "text":
      return {
        ...base,
        type,
        width: 360,
        height: 96,
        style: { color: "#111827", fontSize: 28, fontWeight: 500, textAlign: "left" },
        props: { text: "Nouveau texte" },
      };
    case "title":
      return {
        ...base,
        type,
        width: 420,
        height: 64,
        style: { color: "#111827", fontSize: 36, fontWeight: 700, textAlign: "left" },
        props: { text: "Nouveau titre", level: 2 },
      };
    case "section":
      return {
        ...base,
        type,
        width: 420,
        height: 220,
        style: { backgroundColor: "#e0f2fe", borderRadius: 16, borderWidth: 1, borderColor: "#0284c7" },
        children: [],
      };
    case "image":
      return {
        ...base,
        type,
        width: 260,
        height: 180,
        style: { borderRadius: 12 },
        props: {
          src: "https://placehold.co/520x360/e0f2fe/0369a1?text=Image",
          alt: "Image de maquette",
          fit: "cover",
        },
      };
    // Sans lien au départ : l'utilisateur le colle dans le panneau de propriétés.
    case "video":
      return {
        ...base,
        type,
        width: 480,
        height: 270,
        style: { backgroundColor: "#0f172a", borderRadius: 12 },
        props: { src: "", kind: "embed", title: "Vidéo" },
      };
    case "shape":
      return {
        ...base,
        type,
        width: 160,
        height: 160,
        style: { backgroundColor: "#0284c7", borderWidth: 0, borderColor: "#0369a1" },
        props: { shape },
      };
    case "button":
      return {
        ...base,
        type,
        width: 180,
        height: 52,
        style: {
          backgroundColor: "#0369a1",
          color: "#ffffff",
          fontSize: 16,
          fontWeight: 600,
          textAlign: "center",
          borderRadius: 10,
        },
        props: { label: "Nouveau bouton" },
      };
  }
}
