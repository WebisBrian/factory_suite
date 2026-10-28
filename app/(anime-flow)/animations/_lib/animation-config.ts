/**
 * Config des animations exportée pour l'intégration (`animations.json`),
 * lue par le script `animations.js` sur le site généré.
 *
 * Elle sert aussi à restaurer le travail quand on rouvre le projet.
 */

import { findPreset, type AnimationPreset } from "@/app/(anime-flow)/animations/_lib/animation-library";
import { PAGE_FILE } from "@/app/(anime-flow)/animations/_lib/page-elements";
import { TRIGGER_EVENTS, type TriggerEventId } from "@/app/(anime-flow)/animations/_lib/trigger-events";

export const CONFIG_FILE = "animations.json";
export const SCRIPT_FILE = "animations.js";

/** Animation posée sur un élément : laquelle, et ce qui la déclenche. */
export type ElementAnimation = { animation: string; event: TriggerEventId };

export type ConfigAnimation = {
  name: string;
  /** Audiodescription : ce que fait l'animation. */
  description: string;
  keyframes: Keyframe[];
  duration: number;
  easing: string;
  custom: boolean;
};

export type AnimeFlowConfig = {
  version: 1;
  page: string;
  /** Par id d'animation. */
  animations: Record<string, ConfigAnimation>;
  elements: { elementId: string; animation: string; event: TriggerEventId }[];
};

/** Les animations utilisées, plus toutes les personnalisées (pour ne pas les perdre). */
export function buildConfig(
  animationByElement: Record<string, ElementAnimation>,
  customAnimations: readonly AnimationPreset[],
): AnimeFlowConfig {
  const animations: Record<string, ConfigAnimation> = {};
  const elements: AnimeFlowConfig["elements"] = [];

  function addAnimation(preset: AnimationPreset) {
    animations[preset.id] = {
      name: preset.name,
      description: preset.effect,
      keyframes: preset.keyframes,
      duration: preset.duration,
      easing: preset.easing,
      custom: preset.custom === true,
    };
  }

  customAnimations.forEach(addAnimation);
  for (const [elementId, { animation, event }] of Object.entries(animationByElement)) {
    const preset = findPreset(animation, customAnimations);
    if (!preset) continue;
    addAnimation(preset);
    elements.push({ elementId, animation, event });
  }

  return { version: 1, page: PAGE_FILE, animations, elements };
}

export function serializeConfig(config: AnimeFlowConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}

/** Ce qu'on récupère d'un `animations.json` pour reprendre le travail. */
export type RestoredConfig = {
  animationByElement: Record<string, ElementAnimation>;
  customAnimations: AnimationPreset[];
};

/** null si le texte n'est pas une config valide. */
export function parseConfig(text: string): RestoredConfig | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.version !== 1 || !isRecord(data.animations) || !Array.isArray(data.elements)) {
    return null;
  }

  const customAnimations: AnimationPreset[] = [];
  for (const [id, raw] of Object.entries(data.animations)) {
    const animation = parseAnimation(raw);
    if (!animation) return null;
    if (animation.custom) {
      customAnimations.push({
        id,
        name: animation.name,
        effect: animation.description,
        keyframes: animation.keyframes,
        duration: animation.duration,
        easing: animation.easing,
        custom: true,
      });
    }
  }

  const animationByElement: Record<string, ElementAnimation> = {};
  for (const raw of data.elements) {
    if (!isRecord(raw) || typeof raw.elementId !== "string" || typeof raw.animation !== "string") return null;
    const event = TRIGGER_EVENTS.find((trigger) => trigger.id === raw.event);
    if (!event) return null;
    animationByElement[raw.elementId] = { animation: raw.animation, event: event.id };
  }

  return { animationByElement, customAnimations };
}

function parseAnimation(raw: unknown): ConfigAnimation | null {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.description !== "string" ||
    typeof raw.duration !== "number" ||
    typeof raw.easing !== "string" ||
    !Array.isArray(raw.keyframes)
  ) {
    return null;
  }
  const keyframes: Keyframe[] = [];
  for (const frame of raw.keyframes) {
    if (!isRecord(frame)) return null;
    const keyframe: Keyframe = {};
    for (const [property, value] of Object.entries(frame)) {
      if (typeof value !== "string" && typeof value !== "number") return null;
      keyframe[property] = value;
    }
    keyframes.push(keyframe);
  }
  return {
    name: raw.name,
    description: raw.description,
    keyframes,
    duration: raw.duration,
    easing: raw.easing,
    custom: raw.custom === true,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
