export function ScreenDraftResizeHandles({ onResize }: { onResize?: (width: number, height: number) => void }) {
  return <button type="button" aria-label="Redimensionner" onClick={() => onResize?.(0, 0)} className="absolute -right-1 -bottom-1 size-3 cursor-se-resize rounded-sm bg-sky-500" />;
}
