import type { ScreenDraftDocument } from "../_lib/schema";
import Canvas from "./Canvas";
import Palette from "./Palette";
import PropertiesPanel from "./PropertiesPanel";

export default function Editor({ draft }: { draft: ScreenDraftDocument }) {
  return (
    <div className="flex h-dvh flex-col bg-white text-neutral-900">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-neutral-200 px-4">
        <span
          aria-hidden
          className="grid size-6 place-items-center rounded-md bg-(--sd-accent) text-xs font-bold text-white"
        >
          SD
        </span>
        <span className="font-semibold">Screen Draft</span>
        <span className="text-neutral-300">/</span>
        <span className="truncate text-sm text-neutral-600">{draft.name}</span>
      </header>

      <div className="flex min-h-0 flex-1">
        <Palette />
        <Canvas draft={draft} />
        <PropertiesPanel frame={draft.frame} />
      </div>
    </div>
  );
}
