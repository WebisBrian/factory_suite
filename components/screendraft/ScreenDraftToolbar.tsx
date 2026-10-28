export function ScreenDraftToolbar({ onAddText, onUndo, onRedo }: { onAddText?: () => void; onUndo?: () => void; onRedo?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/3 p-2">
      <button type="button" onClick={onAddText} className="rounded-lg bg-sky-500 px-3 py-2 text-sm text-slate-950">+ Texte</button>
      <button type="button" onClick={onUndo} className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/10">Annuler</button>
      <button type="button" onClick={onRedo} className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/10">Rétablir</button>
    </div>
  );
}
