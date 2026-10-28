export function ScreenDraftZoomControls({ zoom, onChange }: { zoom: number; onChange: (zoom: number) => void }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-300">
      <button type="button" onClick={() => onChange(Math.max(0.25, zoom - 0.1))}>−</button>
      <span>{Math.round(zoom * 100)}%</span>
      <button type="button" onClick={() => onChange(Math.min(2, zoom + 0.1))}>+</button>
    </div>
  );
}
