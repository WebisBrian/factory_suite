"use client";

import { useId, type FocusEvent } from "react";
import { clampMs } from "@/app/(anime-flow)/animations/_lib/element-animation";

type Props = {
  label: string;
  /** Valeur en millisecondes. */
  valueMs: number;
  limits: { min: number; max: number };
  onChange: (valueMs: number) => void;
};

const toSeconds = (ms: number) => (ms / 1000).toLocaleString("fr-FR");

/**
 * Champ de durée saisi en secondes, stocké en millisecondes.
 * Non contrôlé : la saisie « 0, » reste possible. Le parent change la `key` pour le réinitialiser.
 */
export function AnimationsSecondsField({ label, valueMs, limits, onChange }: Props) {
  const id = useId();
  const hintId = `${id}-hint`;

  function emit(seconds: number) {
    if (Number.isFinite(seconds)) onChange(clampMs(seconds * 1000, limits));
  }

  // Une valeur hors bornes est ramenée dans les bornes en quittant le champ.
  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const seconds = event.target.valueAsNumber;
    const ms = Number.isFinite(seconds) ? clampMs(seconds * 1000, limits) : valueMs;
    event.target.value = String(ms / 1000);
    onChange(ms);
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {label} (secondes)
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step={0.1}
        min={limits.min / 1000}
        max={limits.max / 1000}
        defaultValue={valueMs / 1000}
        aria-describedby={hintId}
        onChange={(event) => emit(event.target.valueAsNumber)}
        onBlur={handleBlur}
        className="min-h-10 w-32 rounded-lg border-2 border-(--line-strong) bg-(--surface-raised) px-3 text-base"
      />
      <p id={hintId} className="text-sm text-(--ink-muted)">
        Entre {toSeconds(limits.min)} et {toSeconds(limits.max)} secondes.
      </p>
    </div>
  );
}
