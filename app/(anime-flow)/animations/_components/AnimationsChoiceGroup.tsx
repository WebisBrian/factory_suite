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
      <legend className="text-base font-semibold">{legend}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {choices.map((choice) => {
          const checked = choice.value === value;
          const descriptionId = `${name}-${choice.value}-description`;
          return (
            <label
              key={choice.value}
              className={`flex min-h-10 cursor-pointer items-start gap-3 rounded-xl border-2 p-3 has-focus-visible:outline-4 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--focus-ring) ${
                checked ? "border-(--motion) bg-(--motion-soft)" : "border-(--line) hover:border-(--line-strong)"
              }`}
            >
              <input
                type="radio"
                name={name}
                checked={checked}
                onChange={() => onChange(choice.value)}
                aria-describedby={descriptionId}
                className="mt-0.5 size-5 shrink-0 accent-(--motion)"
              />
              <span className="flex flex-col">
                <span className={`text-base ${checked ? "font-semibold" : ""}`}>{choice.name}</span>
                <span id={descriptionId} className="text-sm text-(--ink-muted)">
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
