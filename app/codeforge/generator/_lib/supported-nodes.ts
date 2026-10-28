// Éléments que ce générateur sait produire. ScreenDraft en propose d'autres (carte, carrousel) :
// ils sont retirés avant la validation, sinon toute la maquette serait refusée.
const SUPPORTED_TYPES: ReadonlySet<string> = new Set(["section", "title", "text", "image", "button", "shape", "video"]);

type JsonNode = { type?: unknown; children?: unknown };

/**
 * Retire récursivement les éléments non pris en charge d'un `maquette.json`.
 * Un texte qui n'est pas du JSON est rendu tel quel : la validation donnera le bon message d'erreur.
 */
export function dropUnsupportedNodes(text: string): { json: string; skipped: string[] } {
  let data: { screens?: { nodes?: unknown }[]; nodes?: unknown };
  try {
    data = JSON.parse(text);
  } catch {
    return { json: text, skipped: [] };
  }
  if (typeof data !== "object" || data === null) return { json: text, skipped: [] };

  const skipped = new Set<string>();
  const keep = (nodes: unknown): unknown =>
    Array.isArray(nodes)
      ? nodes
          .filter((node: JsonNode) => {
            const supported = typeof node?.type === "string" && SUPPORTED_TYPES.has(node.type);
            if (!supported) skipped.add(String(node?.type));
            return supported;
          })
          .map((node: JsonNode) => (node.children ? { ...node, children: keep(node.children) } : node))
      : nodes;

  // Version 2 : les éléments sont dans chaque écran ; version 1 : directement à la racine.
  if (Array.isArray(data.screens)) data.screens = data.screens.map((screen) => ({ ...screen, nodes: keep(screen.nodes) }));
  if (data.nodes) data.nodes = keep(data.nodes);
  return { json: JSON.stringify(data), skipped: [...skipped] };
}
