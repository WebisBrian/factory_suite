import type { Frame } from "@/components/screendraft/screendraft-schema";

const DEVICE_LABELS: Record<Frame["device"], string> = {
  desktop: "Desktop",
  mobile: "Mobile",
};

/** Propriétés de la maquette. Celles d'un élément viendront avec la sélection (SCRUM-8). */
export function ScreendraftPropertiesPanel({ frame }: { frame: Frame }) {
  return (
    <aside className="w-64 shrink-0 border-l border-white/10 bg-white/3">
      <h2 className="px-4 pt-4 pb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
        Maquette
      </h2>
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 px-4 text-sm">
        <dt className="text-zinc-400">Format</dt>
        <dd>{DEVICE_LABELS[frame.device]}</dd>
        <dt className="text-zinc-400">Taille</dt>
        <dd className="tabular-nums">
          {frame.width} × {frame.height} px
        </dd>
        <dt className="text-zinc-400">Fond</dt>
        <dd className="flex items-center gap-2">
          <span
            className="size-4 rounded border border-white/20"
            style={{ backgroundColor: frame.backgroundColor }}
          />
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-xs text-zinc-200 uppercase">
            {frame.backgroundColor}
          </span>
        </dd>
      </dl>
    </aside>
  );
}
