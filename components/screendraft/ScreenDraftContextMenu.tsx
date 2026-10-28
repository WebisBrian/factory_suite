export function ScreenDraftContextMenu({ onDuplicate, onDelete }: { onDuplicate?: () => void; onDelete?: () => void }) {
  return <div className="flex gap-2 rounded-lg border border-white/10 bg-[#181820] p-2 text-xs"><button type="button" onClick={onDuplicate}>Dupliquer</button><button type="button" onClick={onDelete} className="text-red-400">Supprimer</button></div>;
}
