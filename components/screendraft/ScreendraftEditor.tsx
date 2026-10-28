import { ScreendraftCanvas } from "@/components/screendraft/ScreendraftCanvas";
import { ScreendraftPalette } from "@/components/screendraft/ScreendraftPalette";
import { ScreendraftPropertiesPanel } from "@/components/screendraft/ScreendraftPropertiesPanel";
import type { Maquette } from "@/components/screendraft/screendraft-schema";

/** Éditeur plein écran, dans l'espace laissé sous la barre du Hub. */
export function ScreendraftEditor({ draft }: { draft: Maquette }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <span
          aria-hidden
          className="inline-flex size-6 items-center justify-center rounded-md bg-[#001e36] text-[11px] font-bold tracking-tight text-sky-300 ring-1 ring-sky-400/40"
        >
          Sd
        </span>
        <span className="text-sm font-semibold">Screendraft</span>
        <span className="text-zinc-600">/</span>
        <span className="truncate text-sm text-zinc-400">{draft.name}</span>
      </header>

      <div className="flex min-h-0 flex-1">
        <ScreendraftPalette />
        <ScreendraftCanvas draft={draft} />
        <ScreendraftPropertiesPanel frame={draft.frame} />
      </div>
    </div>
  );
}
