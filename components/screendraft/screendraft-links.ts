import type { ButtonNode, DraftNode, Maquette, Screen } from "@/components/screendraft/screendraft-schema";

/**
 * Fichier HTML de chaque écran, dans l'ordre : `index.html` pour le premier, puis le nom
 * en minuscules, sans accents ni espaces (« Mentions légales » → `mentions-legales.html`).
 * Deux écrans de même nom reçoivent `contact.html`, `contact-2.html`…
 */
export function screenPaths(screens: Screen[]): Map<string, string> {
  const paths = new Map<string, string>();
  const used = new Set<string>();
  screens.forEach((screen, index) => {
    const base = index === 0 ? "index" : slugify(screen.name);
    let path = `${base}.html`;
    for (let suffix = 2; used.has(path); suffix++) path = `${base}-${suffix}.html`;
    used.add(path);
    paths.set(screen.id, path);
  });
  return paths;
}

function slugify(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  // « index » est réservé au premier écran.
  return slug === "" || slug === "index" ? "ecran" : slug;
}

/**
 * Remet en cohérence les liens du prototype : `path` de chaque écran, `href` de chaque bouton
 * lié (le `path` de son écran cible). Un bouton dont l'écran cible n'existe plus perd son lien.
 * Renvoie la même maquette si rien ne change.
 */
export function syncLinks(draft: Maquette): Maquette {
  const paths = screenPaths(draft.screens);
  let changed = false;
  const screens = draft.screens.map((screen) => {
    const path = paths.get(screen.id) ?? screen.path;
    const nodes = syncNodes(screen.nodes, paths);
    if (path === screen.path && nodes === screen.nodes) return screen;
    changed = true;
    return { ...screen, path, nodes };
  });
  return changed ? { ...draft, screens } : draft;
}

function syncNodes(nodes: DraftNode[], paths: Map<string, string>): DraftNode[] {
  let changed = false;
  const next = nodes.map((node): DraftNode => {
    if (node.type === "section") {
      const children = syncNodes(node.children, paths);
      if (children === node.children) return node;
      changed = true;
      return { ...node, children };
    }
    if (node.type !== "button" || node.props.targetScreenId === undefined) return node;
    const href = paths.get(node.props.targetScreenId);
    if (href === node.props.href) return node;
    changed = true;
    if (href !== undefined) return { ...node, props: { ...node.props, href } };
    // Écran cible supprimé : le bouton n'a plus de lien.
    const { label } = node.props;
    return { ...node, props: { label } };
  });
  return changed ? next : nodes;
}

/** Écran ouvert par un bouton dans le prototype, ou null s'il n'est lié à aucun écran. */
export function linkTarget(node: DraftNode): string | null {
  return node.type === "button" ? (node.props.targetScreenId ?? null) : null;
}

/** Bouton lié d'un écran, avec sa position dans le frame (px à l'échelle 1). */
export type ScreenLink = {
  node: ButtonNode;
  targetScreenId: string;
  rect: { x: number; y: number; width: number; height: number };
};

/** Boutons d'un écran qui mènent à un autre écran existant, sections comprises. */
export function screenLinks(screen: Screen, screens: Screen[]): ScreenLink[] {
  const ids = new Set(screens.map((other) => other.id));
  const links: ScreenLink[] = [];
  const visit = (nodes: DraftNode[], offsetX: number, offsetY: number) => {
    for (const node of nodes) {
      const x = offsetX + node.x;
      const y = offsetY + node.y;
      if (node.type === "section") visit(node.children, x, y);
      const targetScreenId = linkTarget(node);
      if (node.type === "button" && targetScreenId && ids.has(targetScreenId)) {
        links.push({ node, targetScreenId, rect: { x, y, width: node.width, height: node.height } });
      }
    }
  };
  visit(screen.nodes, 0, 0);
  return links;
}
