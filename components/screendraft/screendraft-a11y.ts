import type { DraftNode, NodeA11y } from "@/components/screendraft/screendraft-schema";

/*
 * SCRUM-25 : ce que les lecteurs d'écran liront pour chaque élément de la page générée.
 */

/** Types dont le texte lu est porté par leurs props (alt, title) et non par `a11y.label`. */
export function hasOwnAccessibleText(node: DraftNode): boolean {
  return node.type === "image" || node.type === "video" || node.type === "carousel";
}

/** Texte lu par défaut, sans réglage : le contenu visible de l'élément, ou rien. */
export function defaultSpokenText(node: DraftNode): string | null {
  switch (node.type) {
    case "title":
    case "text":
      return node.props.text.trim() || null;
    case "button":
      return node.props.label.trim() || null;
    case "image":
      return node.props.alt.trim() || null;
    case "video":
    case "carousel":
      return node.props.title.trim() || null;
    case "section":
    case "shape":
      return null;
  }
}

/** Ce qu'un lecteur d'écran lira pour cet élément dans la page générée ; null : rien. */
export function spokenText(node: DraftNode): string | null {
  if (node.a11y?.decorative) return null;
  if (hasOwnAccessibleText(node)) return defaultSpokenText(node);
  return node.a11y?.label?.trim() || defaultSpokenText(node);
}

/** Applique un réglage en gardant le JSON propre : un champ vide disparaît, `a11y` vide aussi. */
export function withA11y(node: DraftNode, patch: NodeA11y): DraftNode {
  const merged: NodeA11y = { ...node.a11y, ...patch };
  const next: NodeA11y = {};
  if (merged.label?.trim()) next.label = merged.label;
  if (merged.decorative) next.decorative = true;
  const { a11y: _previous, ...rest } = node;
  void _previous;
  return Object.keys(next).length > 0 ? { ...rest, a11y: next } : rest;
}

/** Attributs posés sur l'élément rendu, identiques à ceux attendus dans le HTML généré. */
export function a11yAttributes(node: DraftNode): { "aria-hidden"?: true; "aria-label"?: string } {
  if (node.a11y?.decorative) return { "aria-hidden": true };
  if (hasOwnAccessibleText(node)) return {};
  const label = node.a11y?.label?.trim();
  return label ? { "aria-label": label } : {};
}
