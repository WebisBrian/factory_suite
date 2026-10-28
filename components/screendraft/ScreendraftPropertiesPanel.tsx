import type { Frame } from "@/components/screendraft/screendraft-schema";

const DEVICE_LABELS: Record<Frame["device"], string> = {
  desktop: "Desktop",
  mobile: "Mobile",
};

/** Propriétés de la maquette. Celles d'un élément viendront avec la sélection (SCRUM-8). */
export function ScreendraftPropertiesPanel({ frame }: { frame: Frame }) {
  return (
    <aside className="w-64 shrink-0 border-l border-(--line) bg-(--surface-raised) p-(--space-4)">
      <h2 className="text-label pb-(--space-2) text-(--ink-muted)">
        Maquette
      </h2>
      <dl className="text-body-sm grid grid-cols-[auto_1fr] items-center gap-x-(--space-4) gap-y-(--space-2)">
        <dt className="text-(--ink-muted)">Format</dt>
        <dd>{DEVICE_LABELS[frame.device]}</dd>
        <dt className="text-(--ink-muted)">Taille</dt>
        <dd className="text-code tabular-nums">
          {frame.width} × {frame.height} px
        </dd>
        <dt className="text-(--ink-muted)">Fond</dt>
        <dd className="flex items-center gap-(--space-2)">
          <span
            className="size-4 rounded-(--radius-sm) border border-(--line-strong)"
            style={{ backgroundColor: frame.backgroundColor }}
          />
          <span className="text-code rounded-(--radius-sm) bg-(--canvas) px-(--space-1) text-(--ink) uppercase">
            {frame.backgroundColor}
          </span>
        </dd>
      </dl>
    </aside>
  );
}
