import type { DraftNode } from "@/app/screen-draft/_lib/schema";

export function ScreenDraftPropertiesPanel({ node, onChange }: { node: DraftNode | null; onChange?: (node: DraftNode) => void }) {
  if (!node) return <aside className="rounded-xl border border-white/10 p-4 text-sm text-zinc-500">Aucun élément sélectionné.</aside>;
  return (
    <aside className="rounded-xl border border-white/10 p-4">
      <h2 className="font-medium text-white">Propriétés</h2>
      <label className="mt-4 block text-xs text-zinc-400">
        Position X
        <input type="number" value={node.x} onChange={(event) => onChange?.({ ...node, x: Number(event.target.value) })} className="mt-1 w-full rounded border border-white/10 bg-black/20 p-2 text-white" />
      </label>
      <label className="mt-3 block text-xs text-zinc-400">
        Position Y
        <input type="number" value={node.y} onChange={(event) => onChange?.({ ...node, y: Number(event.target.value) })} className="mt-1 w-full rounded border border-white/10 bg-black/20 p-2 text-white" />
      </label>
    </aside>
  );
}
