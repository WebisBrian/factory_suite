import type { DraftNode, DraftNodeType, ShapeKind } from "@/components/screendraft/screendraft-schema";

/**
 * Nouvel élément inséré depuis la palette, au premier niveau du frame.
 * Chaque insertion est un peu décalée pour ne pas empiler les éléments au même endroit.
 * Couleurs par défaut conformes WCAG AA sur le fond blanc du frame et sur une section :
 * texte ≥ 4.5:1, formes et bordures ≥ 3:1.
 */
export function createNode(type: DraftNodeType, index: number, shape: ShapeKind = "rectangle"): DraftNode {
  const offset = 40 + (index % 5) * 32;
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
