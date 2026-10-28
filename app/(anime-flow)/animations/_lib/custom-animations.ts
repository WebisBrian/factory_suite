/**
 * Animations créées par l'utilisateur : étapes (keyframes) et propriétés CSS.
 *
 * Mêmes garde-fous que la bibliothèque : jouée une seule fois, et pas plus de
 * 3 changements de luminosité ou de couleur par seconde (risque de crise).
 */

import type { AnimationPreset } from "@/app/(anime-flow)/animations/_lib/animation-library";

export type CssProperty = {
  /** Nom CSS, pour CSS.supports : « background-color ». */
  css: string;
  /** Nom dans un keyframe de la Web Animations API : « backgroundColor ». */
  key: string;
  label: string;
  /** Exemple de valeur, affiché en aide. */
  example: string;
  /** Change la luminosité ou la couleur : compte pour le garde-fou anti-clignotement. */
  flashing: boolean;
};

export const CSS_PROPERTIES: readonly CssProperty[] = [
  { css: "opacity", key: "opacity", label: "Opacité", example: "0.5", flashing: true },
  { css: "translate", key: "translate", label: "Déplacement", example: "0 32px", flashing: false },
  { css: "scale", key: "scale", label: "Échelle", example: "1.2", flashing: false },
  { css: "rotate", key: "rotate", label: "Rotation", example: "15deg", flashing: false },
  { css: "transform", key: "transform", label: "Transformation", example: "translateY(-16px) scale(1.1)", flashing: false },
  { css: "background-color", key: "backgroundColor", label: "Couleur de fond", example: "#6d28d9", flashing: true },
  { css: "color", key: "color", label: "Couleur du texte", example: "#ffffff", flashing: true },
  { css: "border-radius", key: "borderRadius", label: "Arrondi des coins", example: "24px", flashing: false },
  { css: "filter", key: "filter", label: "Filtre", example: "blur(4px)", flashing: true },
];

export const EASINGS: readonly { value: string; label: string }[] = [
  { value: "ease-out", label: "Ralentit à la fin (ease-out)" },
  { value: "ease-in", label: "Accélère au début (ease-in)" },
  { value: "ease-in-out", label: "Accélère puis ralentit (ease-in-out)" },
  { value: "ease", label: "Naturel (ease)" },
  { value: "linear", label: "Vitesse constante (linear)" },
];

export const MIN_DURATION = 200;
export const MAX_DURATION = 5000;
/** Changements de luminosité ou de couleur tolérés sur une seconde. */
const MAX_FLASHES_PER_SECOND = 3;

export type CustomPropertyValue = { property: string; value: string };
/** Une étape : sa position dans l'animation (0 à 100 %) et les valeurs qu'elle fixe. */
export type CustomStep = { offset: number; properties: CustomPropertyValue[] };
export type CustomDraft = { name: string; duration: number; easing: string; steps: CustomStep[] };

export const DEFAULT_DRAFT: CustomDraft = {
  name: "",
  duration: 600,
  easing: "ease-out",
  steps: [
    { offset: 0, properties: [{ property: "opacity", value: "0" }] },
    { offset: 100, properties: [{ property: "opacity", value: "1" }] },
  ],
};

export function findCssProperty(css: string): CssProperty | null {
  return CSS_PROPERTIES.find((property) => property.css === css) ?? null;
}

/** Clés des erreurs, pour les lier à leur champ. */
export const errorKey = {
  name: "name",
  duration: "duration",
  steps: "steps",
  flashing: "flashing",
  offset: (step: number) => `step-${step}-offset`,
  value: (step: number, row: number) => `step-${step}-value-${row}`,
};

/** Messages d'erreur par clé (voir `errorKey`). Vide si le brouillon est valide. */
export function validateCustomAnimation(draft: CustomDraft, takenNames: readonly string[]): Map<string, string> {
  const errors = new Map<string, string>();
  const name = draft.name.trim();

  if (!name) errors.set(errorKey.name, "Donnez un nom à l'animation.");
  else if (takenNames.some((taken) => taken.toLowerCase() === name.toLowerCase())) {
    errors.set(errorKey.name, `Le nom « ${name} » est déjà pris.`);
  }

  if (!Number.isFinite(draft.duration) || draft.duration < MIN_DURATION || draft.duration > MAX_DURATION) {
    errors.set(errorKey.duration, `La durée doit être comprise entre ${MIN_DURATION} et ${MAX_DURATION} ms.`);
  }

  const { steps } = draft;
  if (steps.length < 2) errors.set(errorKey.steps, "Il faut au moins 2 étapes.");

  steps.forEach((step, i) => {
    const label = `Étape ${i + 1}`;
    if (!Number.isFinite(step.offset) || step.offset < 0 || step.offset > 100) {
      errors.set(errorKey.offset(i), `${label} : la position doit être comprise entre 0 et 100 %.`);
    } else if (i === 0 && step.offset !== 0) {
      errors.set(errorKey.offset(i), `${label} : la première étape doit être à 0 %.`);
    } else if (i === steps.length - 1 && step.offset !== 100) {
      errors.set(errorKey.offset(i), `${label} : la dernière étape doit être à 100 %.`);
    } else if (i > 0 && step.offset <= steps[i - 1].offset) {
      errors.set(errorKey.offset(i), `${label} : la position doit être après celle de l'étape ${i}.`);
    }

    step.properties.forEach((row, j) => {
      const property = findCssProperty(row.property);
      const value = row.value.trim();
      if (!property) return;
      if (!value) errors.set(errorKey.value(i, j), `${label}, ${property.label} : saisissez une valeur.`);
      else if (!CSS.supports(property.css, value)) {
        errors.set(
          errorKey.value(i, j),
          `${label}, ${property.label} : « ${value} » n'est pas une valeur valide (exemple : ${property.example}).`,
        );
      }
    });
  });

  if (errors.size === 0 && flashesPerSecond(draft) > MAX_FLASHES_PER_SECOND) {
    errors.set(
      errorKey.flashing,
      `L'animation change de luminosité ou de couleur plus de ${MAX_FLASHES_PER_SECOND} fois par seconde, ce qui peut provoquer des crises. Allongez la durée ou retirez des étapes.`,
    );
  }

  return errors;
}

/**
 * Nombre maximal de changements de luminosité ou de couleur dans une fenêtre
 * d'une seconde. Un changement : deux étapes successives qui fixent des
 * valeurs différentes pour une même propriété sensible.
 */
function flashesPerSecond(draft: CustomDraft): number {
  const times: number[] = [];
  for (const property of CSS_PROPERTIES.filter((p) => p.flashing)) {
    let previous: string | null = null;
    for (const step of draft.steps) {
      const row = step.properties.find((r) => r.property === property.css);
      if (!row) continue;
      const value = row.value.trim();
      if (previous !== null && value !== previous) times.push((step.offset / 100) * draft.duration);
      previous = value;
    }
  }
  times.sort((a, b) => a - b);
  return times.reduce((max, start, i) => Math.max(max, times.slice(i).filter((t) => t < start + 1000).length), 0);
}

/** Convertit un brouillon valide en animation utilisable comme un preset. */
export function toPreset(draft: CustomDraft, takenIds: readonly string[]): AnimationPreset {
  const slug =
    draft.name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "animation";
  let id = `custom-${slug}`;
  for (let n = 2; takenIds.includes(id); n++) id = `custom-${slug}-${n}`;

  const keyframes: Keyframe[] = draft.steps.map((step) => {
    const keyframe: Keyframe = { offset: step.offset / 100 };
    for (const row of step.properties) {
      const property = findCssProperty(row.property);
      if (property) keyframe[property.key] = row.value.trim();
    }
    return keyframe;
  });

  const labels = [
    ...new Set(
      draft.steps.flatMap((step) => step.properties.map((row) => findCssProperty(row.property)?.label.toLowerCase())),
    ),
  ].filter((label): label is string => Boolean(label));

  return {
    id,
    name: draft.name.trim(),
    effect: `animation personnalisée (${labels.join(", ")})`,
    keyframes,
    duration: draft.duration,
    easing: draft.easing,
    custom: true,
  };
}
