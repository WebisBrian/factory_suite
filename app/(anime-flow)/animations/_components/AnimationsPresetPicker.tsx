"use client";

import { ANIMATION_PRESETS, describeEffect } from "@/app/(anime-flow)/animations/_lib/animation-library";

type Props = {
  elementName: string;
  /** null : aucune animation. */
  presetId: string | null;
  onChange: (presetId: string | null) => void;
};

const OPTIONS = [
  { id: null, name: "Aucune animation", description: "L'élément reste immobile." },
  ...ANIMATION_PRESETS.map((preset) => ({ id: preset.id, name: preset.name, description: describeEffect(preset) })),
];

/** Choix d'une animation dans la bibliothèque pour l'élément sélectionné. */
export function AnimationsPresetPicker({ elementName, presetId, onChange }: Props) {
  return (
    <fieldset className="rounded-2xl border border-white/10 bg-white/3 p-5">
      <legend className="px-1 text-xl font-semibold text-zinc-100">Animation de : {elementName}</legend>

      {/* Boutons radio natifs : flèches du clavier, et nom + description lus par le lecteur d'écran. */}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const checked = option.id === presetId;
          const descriptionId = `animations-preset-${option.id ?? "none"}-description`;
          return (
            <label
              key={option.id ?? "none"}
              className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border-2 p-3 has-focus-visible:outline-4 has-focus-visible:outline-offset-2 has-focus-visible:outline-white ${
                checked ? "border-fuchsia-300 bg-fuchsia-500/15" : "border-white/15 hover:bg-white/10"
              }`}
            >
              <input
                type="radio"
                name="animations-preset"
                checked={checked}
                onChange={() => onChange(option.id)}
                aria-describedby={descriptionId}
                className="mt-1 size-6 shrink-0 accent-fuchsia-400"
              />
              <span className="flex flex-col">
                <span className={`text-lg text-zinc-100 ${checked ? "font-semibold" : ""}`}>{option.name}</span>
                <span id={descriptionId} className="text-lg text-zinc-300">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
