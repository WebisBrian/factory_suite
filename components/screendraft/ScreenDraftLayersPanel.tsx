import type { DraftNode } from "@/app/screen-draft/_lib/schema";

export function ScreenDraftLayersPanel({ nodes, selectedId, onSelect }: { nodes: DraftNode[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => <li key={node.id}><button type="button" onClick={() => onSelect(node.id)} className={`w-full rounded px-2 py-1 text-left text-sm ${selectedId === node.id ? "bg-sky-500/20 text-sky-300" : "text-zinc-400"}`}>{node.type} · {node.id}</button></li>)}
    </ul>
  );
}
