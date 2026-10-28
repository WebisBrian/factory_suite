"use client";

export type AnimationsChoice<T extends string> = {
  value: T;
  name: string;
  description: string;
};

type Props<T extends string> = {
  legend: string;
  /** Nom du groupe de boutons radio, unique dans la page. */
  name: string;
  choices: readonly AnimationsChoice<T>[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * Groupe de choix en cartes. Boutons radio natifs : flèches du clavier, et
 * nom + description lus par le lecteur d'écran.
 */
export function AnimationsChoiceGroup<T extends string>({ legend, name, choices, value, onChange }: Props<T>) {
  return (
    <fieldset>
      <legend className="text-lg font-semibold text-zinc-100">{legend}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {choices.map((choice) => {
          const checked = choice.value === value;
          const descriptionId = `${name}-${choice.value}-description`;
          return (
            <label
              key={choice.value}
              className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border-2 p-3 has-focus-visible:outline-4 has-focus-visible:outline-offset-2 has-focus-visible:outline-white ${
                checked ? "border-fuchsia-300 bg-fuchsia-500/15" : "border-white/15 hover:bg-white/10"
              }`}
            >
              <input
                type="radio"
                name={name}
                checked={checked}
                onChange={() => onChange(choice.value)}
                aria-describedby={descriptionId}
                className="mt-1 size-6 shrink-0 accent-fuchsia-400"
              />
              <span className="flex flex-col">
                <span className={`text-lg text-zinc-100 ${checked ? "font-semibold" : ""}`}>{choice.name}</span>
                <span id={descriptionId} className="text-lg text-zinc-300">
                  {choice.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
