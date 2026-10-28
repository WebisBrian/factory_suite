import type { Frame } from "../_lib/schema";

const DEVICE_LABELS: Record<Frame["device"], string> = {
  desktop: "Desktop",
  mobile: "Mobile",
};

/** Propriétés de la maquette. Celles d'un élément viendront avec la sélection (SCRUM-8). */
export default function PropertiesPanel({ frame }: { frame: Frame }) {
  return (
    <aside className="w-64 shrink-0 border-l border-neutral-200 bg-white">
      <h2 className="px-4 pt-4 pb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
        Maquette
      </h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-4 text-sm">
        <dt className="text-neutral-500">Format</dt>
        <dd>{DEVICE_LABELS[frame.device]}</dd>
        <dt className="text-neutral-500">Taille</dt>
        <dd className="tabular-nums">
          {frame.width} × {frame.height} px
        </dd>
        <dt className="text-neutral-500">Fond</dt>
        <dd className="flex items-center gap-2">
          <span
            className="size-4 rounded border border-neutral-300"
            style={{ backgroundColor: frame.backgroundColor }}
          />
          <span className="font-mono text-xs uppercase">{frame.backgroundColor}</span>
        </dd>
      </dl>
    </aside>
  );
}
