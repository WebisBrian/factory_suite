"use client";

import { useId, useState, type FormEvent } from "react";
import type { AnimationPreset } from "@/app/(anime-flow)/animations/_lib/animation-library";
import {
  CSS_PROPERTIES,
  DEFAULT_DRAFT,
  EASINGS,
  errorKey,
  findCssProperty,
  MAX_DURATION,
  MIN_DURATION,
  toPreset,
  validateCustomAnimation,
  type CustomDraft,
  type CustomStep,
} from "@/app/(anime-flow)/animations/_lib/custom-animations";

type Props = {
  /** Nom de l'élément sélectionné, null si aucun. */
  selectedName: string | null;
  /** Noms et ids déjà utilisés (bibliothèque + personnalisées). */
  takenNames: readonly string[];
  takenIds: readonly string[];
  /** Joue l'animation sur l'élément sélectionné, dans l'aperçu ; renvoie le message de confirmation. */
  onTest: (preset: AnimationPreset) => string;
  /** Ajoute l'animation ; renvoie le message de confirmation. */
  onCreate: (preset: AnimationPreset) => string;
};

const FIELD = "min-h-12 rounded-xl border-2 border-(--line-strong) bg-(--surface-raised) px-3 text-lg";
const SECONDARY_BUTTON =
  "min-h-12 rounded-full border-2 border-(--line-strong) bg-(--surface-raised) px-5 text-lg font-semibold hover:bg-(--motion-soft)";
const PRIMARY_BUTTON =
  "min-h-12 rounded-full bg-(--motion) px-6 text-lg font-semibold text-(--on-motion) hover:bg-(--motion-strong)";

/** Formulaire de création d'une animation : étapes (keyframes) et propriétés CSS. */
export function AnimationsCustomEditor({ selectedName, takenNames, takenIds, onTest, onCreate }: Props) {
  const uid = useId();
  const [draft, setDraft] = useState<CustomDraft>(DEFAULT_DRAFT);
  /** Les erreurs ne s'affichent qu'après une première tentative. */
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState("");

  const errors = submitted ? validateCustomAnimation(draft, takenNames) : new Map<string, string>();
  const fieldId = (key: string) => `${uid}-${key}`;
  const errorId = (key: string) => `${uid}-${key}-error`;
  const describedBy = (key: string) => (errors.has(key) ? errorId(key) : undefined);

  function updateStep(index: number, step: CustomStep) {
    setDraft({ ...draft, steps: draft.steps.map((s, i) => (i === index ? step : s)) });
  }

  // Nouvelle étape juste avant la dernière, à mi-chemin, avec les mêmes propriétés.
  function addStep() {
    const last = draft.steps[draft.steps.length - 1];
    const before = draft.steps[draft.steps.length - 2];
    const offset = Math.round((before.offset + last.offset) / 2);
    const step: CustomStep = { offset, properties: last.properties.map((row) => ({ ...row })) };
    setDraft({ ...draft, steps: [...draft.steps.slice(0, -1), step, last] });
    setStatus(`Étape ajoutée à ${offset} %.`);
  }

  function removeStep(index: number) {
    setDraft({ ...draft, steps: draft.steps.filter((_, i) => i !== index) });
    setStatus(`Étape ${index + 1} supprimée.`);
  }

  function addProperty(index: number) {
    const step = draft.steps[index];
    const unused = CSS_PROPERTIES.find((p) => !step.properties.some((row) => row.property === p.css)) ?? CSS_PROPERTIES[0];
    updateStep(index, { ...step, properties: [...step.properties, { property: unused.css, value: "" }] });
    setStatus(`Propriété ${unused.label} ajoutée à l'étape ${index + 1}.`);
  }

  function removeProperty(index: number, row: number) {
    const step = draft.steps[index];
    const label = findCssProperty(step.properties[row].property)?.label ?? "";
    updateStep(index, { ...step, properties: step.properties.filter((_, j) => j !== row) });
    setStatus(`Propriété ${label} retirée de l'étape ${index + 1}.`);
  }

  /** Le preset si le brouillon est valide, sinon null (et les erreurs s'affichent). */
  function validPreset(): AnimationPreset | null {
    setSubmitted(true);
    if (validateCustomAnimation(draft, takenNames).size > 0) {
      setStatus("");
      return null;
    }
    return toPreset(draft, takenIds);
  }

  function handleTest() {
    const preset = validPreset();
    if (!preset) return;
    if (!selectedName) {
      setStatus("Sélectionnez d'abord un élément pour tester l'animation.");
      return;
    }
    setStatus(onTest(preset));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const preset = validPreset();
    if (!preset) return;
    setStatus(onCreate(preset));
    setDraft(DEFAULT_DRAFT);
    setSubmitted(false);
  }

  return (
    <details className="rounded-2xl border border-(--line) bg-(--surface-raised) p-5">
      <summary className="min-h-12 cursor-pointer py-2 text-xl font-semibold">
        <h2 className="inline">Créer une animation</h2>
      </summary>

      <form noValidate onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
        <p className="text-lg text-(--ink-muted)">
          Décrivez l&apos;animation étape par étape : à chaque position (0 % = début, 100 % = fin), choisissez les
          propriétés CSS et leur valeur. Le navigateur fait la transition entre les étapes. L&apos;animation est jouée
          une seule fois.
        </p>

        {errors.size > 0 && (
          <div role="alert" className="rounded-xl border-2 border-(--danger) bg-(--danger-soft) p-4 text-lg text-(--danger)">
            <p className="font-semibold">Erreur : l&apos;animation n&apos;est pas valide.</p>
            <ul className="mt-2 list-disc pl-6">
              {[...errors.values()].map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={fieldId(errorKey.name)} className="text-lg font-semibold">
              Nom
            </label>
            <input
              id={fieldId(errorKey.name)}
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              aria-invalid={errors.has(errorKey.name)}
              aria-describedby={describedBy(errorKey.name)}
              className={FIELD}
            />
            <FieldError id={errorId(errorKey.name)} message={errors.get(errorKey.name)} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={fieldId(errorKey.duration)} className="text-lg font-semibold">
              Durée (ms)
            </label>
            <input
              id={fieldId(errorKey.duration)}
              type="number"
              min={MIN_DURATION}
              max={MAX_DURATION}
              step={100}
              value={Number.isNaN(draft.duration) ? "" : draft.duration}
              onChange={(e) => setDraft({ ...draft, duration: e.target.valueAsNumber })}
              aria-invalid={errors.has(errorKey.duration)}
              aria-describedby={describedBy(errorKey.duration)}
              className={FIELD}
            />
            <FieldError id={errorId(errorKey.duration)} message={errors.get(errorKey.duration)} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={fieldId("easing")} className="text-lg font-semibold">
              Rythme
            </label>
            <select
              id={fieldId("easing")}
              value={draft.easing}
              onChange={(e) => setDraft({ ...draft, easing: e.target.value })}
              className={FIELD}
            >
              {EASINGS.map((easing) => (
                <option key={easing.value} value={easing.value}>
                  {easing.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ol className="flex flex-col gap-4">
          {draft.steps.map((step, i) => {
            const number = i + 1;
            const isEdge = i === 0 || i === draft.steps.length - 1;
            return (
              <li key={i}>
                <fieldset className="flex flex-col gap-3 rounded-xl border-2 border-(--line) p-4">
                  <legend className="px-1 text-lg font-semibold">Étape {number}</legend>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={fieldId(errorKey.offset(i))} className="text-lg">
                      Position (%)
                    </label>
                    <input
                      id={fieldId(errorKey.offset(i))}
                      type="number"
                      min={0}
                      max={100}
                      value={Number.isNaN(step.offset) ? "" : step.offset}
                      onChange={(e) => updateStep(i, { ...step, offset: e.target.valueAsNumber })}
                      aria-invalid={errors.has(errorKey.offset(i))}
                      aria-describedby={describedBy(errorKey.offset(i))}
                      className={`${FIELD} max-w-40`}
                    />
                    <FieldError id={errorId(errorKey.offset(i))} message={errors.get(errorKey.offset(i))} />
                  </div>

                  <ul className="flex flex-col gap-3">
                    {step.properties.map((row, j) => {
                      const property = findCssProperty(row.property);
                      const valueKey = errorKey.value(i, j);
                      const hintId = `${fieldId(valueKey)}-hint`;
                      return (
                        <li key={j} className="flex flex-wrap items-end gap-3">
                          <div className="flex flex-col gap-1">
                            <label htmlFor={fieldId(`step-${i}-property-${j}`)} className="text-lg">
                              Propriété
                            </label>
                            <select
                              id={fieldId(`step-${i}-property-${j}`)}
                              value={row.property}
                              onChange={(e) =>
                                updateStep(i, {
                                  ...step,
                                  properties: step.properties.map((r, k) =>
                                    k === j ? { ...r, property: e.target.value } : r,
                                  ),
                                })
                              }
                              className={FIELD}
                            >
                              {CSS_PROPERTIES.map((p) => (
                                <option key={p.css} value={p.css}>
                                  {p.label} ({p.css})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex min-w-48 flex-1 flex-col gap-1">
                            <label htmlFor={fieldId(valueKey)} className="text-lg">
                              Valeur
                            </label>
                            <input
                              id={fieldId(valueKey)}
                              type="text"
                              value={row.value}
                              onChange={(e) =>
                                updateStep(i, {
                                  ...step,
                                  properties: step.properties.map((r, k) =>
                                    k === j ? { ...r, value: e.target.value } : r,
                                  ),
                                })
                              }
                              aria-invalid={errors.has(valueKey)}
                              aria-describedby={[hintId, describedBy(valueKey)].filter(Boolean).join(" ")}
                              className={`${FIELD} font-mono`}
                            />
                            <p id={hintId} className="text-lg text-(--ink-muted)">
                              Exemple : <span className="font-mono">{property?.example}</span>
                            </p>
                            <FieldError id={errorId(valueKey)} message={errors.get(valueKey)} />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProperty(i, j)}
                            aria-label={`Retirer la propriété ${property?.label ?? ""} de l'étape ${number}`}
                            className={SECONDARY_BUTTON}
                          >
                            Retirer
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => addProperty(i)}
                      aria-label={`Ajouter une propriété à l'étape ${number}`}
                      className={SECONDARY_BUTTON}
                    >
                      + Ajouter une propriété
                    </button>
                    {/* La première et la dernière étape (0 % et 100 %) sont obligatoires. */}
                    {!isEdge && (
                      <button
                        type="button"
                        onClick={() => removeStep(i)}
                        aria-label={`Supprimer l'étape ${number}`}
                        className={SECONDARY_BUTTON}
                      >
                        − Supprimer l&apos;étape
                      </button>
                    )}
                  </div>
                </fieldset>
              </li>
            );
          })}
        </ol>

        <FieldError id={errorId(errorKey.flashing)} message={errors.get(errorKey.flashing)} />

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={addStep} className={SECONDARY_BUTTON}>
            + Ajouter une étape
          </button>
          <button type="button" onClick={handleTest} className={SECONDARY_BUTTON}>
            Tester sur l&apos;élément sélectionné
          </button>
          <button type="submit" className={PRIMARY_BUTTON}>
            {selectedName ? `Créer et appliquer à ${selectedName}` : "Créer l'animation"}
          </button>
        </div>

        <p role="status" className="text-lg">
          {status}
        </p>
      </form>
    </details>
  );
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} className="text-lg font-semibold text-(--danger)">
      Erreur : {message}
    </p>
  );
}
