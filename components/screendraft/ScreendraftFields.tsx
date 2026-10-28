import type { ReactNode } from "react";
import type { HexColor } from "@/components/screendraft/screendraft-schema";

export const FIELD_CLASS =
  "w-full rounded-(--radius-sm) border border-(--line-strong) bg-(--surface-raised) px-(--space-2) py-(--space-1) text-(--ink)";

/** Groupe de champs du panneau, séparé du suivant par un filet. */
export function ScreendraftFieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-(--space-4) border-b border-(--line) pb-(--space-4)">
      <h2 className="text-label pb-(--space-2) text-(--ink-muted)">{title}</h2>
      <div className="text-body-sm flex flex-col gap-(--space-3)">{children}</div>
    </section>
  );
}

export function ScreendraftField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-(--space-1)">
      <span className="text-(--ink-muted)">{label}</span>
      {children}
    </label>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
};

/**
 * Nombre entier validé à la sortie du champ (ou sur Entrée) pour laisser taper librement.
 * Une valeur hors limites est refusée et le champ reprend la valeur actuelle.
 */
export function ScreendraftNumberField({ label, value, min, max, onCommit }: NumberFieldProps) {
  function commit(input: HTMLInputElement) {
    const next = Number(input.value);
    if (input.value === "" || !Number.isInteger(next) || next < min || next > max) {
      input.value = String(value);
      return;
    }
    if (next !== value) onCommit(next);
  }

  return (
    <ScreendraftField label={label}>
      <input
        // Recréé quand la valeur change ailleurs (glisser sur le canvas, annulation).
        key={value}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        defaultValue={value}
        onBlur={(event) => commit(event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className={`${FIELD_CLASS} text-code tabular-nums`}
      />
    </ScreendraftField>
  );
}

type ColorFieldProps = {
  label: string;
  value: HexColor | undefined;
  /** Couleur montrée quand l'élément n'en définit pas (rendu par défaut). */
  fallback: HexColor;
  onChange: (value: HexColor) => void;
  /** Proposé seulement si la couleur peut être retirée (ex. fond transparent). */
  onClear?: () => void;
};

/** Le sélecteur natif ne gère que #rrggbb : la transparence éventuelle (#rrggbbaa) est conservée. */
export function ScreendraftColorField({ label, value, fallback, onChange, onClear }: ColorFieldProps) {
  const color = value ?? fallback;
  const alpha = color.length === 9 ? color.slice(7) : "";

  return (
    <div className="flex items-center justify-between gap-(--space-2)">
      <span className="text-(--ink-muted)">{label}</span>
      <span className="flex items-center gap-(--space-2)">
        <span className="text-code text-(--ink) uppercase">{value ?? "Aucune"}</span>
        <input
          type="color"
          aria-label={label}
          value={color.slice(0, 7)}
          onChange={(event) => onChange(`${event.target.value}${alpha}` as HexColor)}
          className="size-7 cursor-pointer rounded-(--radius-sm) border border-(--line-strong) bg-(--surface-raised)"
        />
        {onClear && value && (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Retirer : ${label}`}
            title="Retirer"
            className="rounded-(--radius-sm) px-(--space-1) text-(--ink-muted) hover:bg-(--canvas) hover:text-(--ink)"
          >
            ×
          </button>
        )}
      </span>
    </div>
  );
}

type SelectFieldProps<T extends string | number> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

export function ScreendraftSelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) {
  return (
    <ScreendraftField label={label}>
      <select
        value={String(value)}
        onChange={(event) => {
          const option = options.find((item) => String(item.value) === event.target.value);
          if (option) onChange(option.value);
        }}
        className={FIELD_CLASS}
      >
        {options.map((option) => (
          <option key={option.value} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </ScreendraftField>
  );
}
