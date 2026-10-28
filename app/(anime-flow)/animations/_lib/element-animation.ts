import { findPreset, type AnimationPreset } from "@/app/(anime-flow)/animations/_lib/animation-library";
import {
  DEFAULT_TRIGGER_EVENT,
  findTriggerEvent,
  type TriggerEventId,
} from "@/app/(anime-flow)/animations/_lib/trigger-events";

/** Animation posée sur un élément de la page. Durées en millisecondes. */
export type ElementAnimation = {
  animation: string;
  event: TriggerEventId;
  duration: number;
  delay: number;
};

/** Bornes des réglages : pas d'animation trop longue par défaut (exigence accessibilité). */
export const DURATION_LIMITS = { min: 100, max: 5000 } as const;
export const DELAY_LIMITS = { min: 0, max: 5000 } as const;

export function clampMs(value: number, limits: { min: number; max: number }): number {
  return Math.min(limits.max, Math.max(limits.min, Math.round(value)));
}

/** Résumé lisible : « Rebond, au clic, 0,8 s, après 0,5 s ». */
export function summarizeAnimation(
  animation: ElementAnimation,
  customAnimations: readonly AnimationPreset[] = [],
): string {
  const seconds = (ms: number) => `${(ms / 1000).toLocaleString("fr-FR")} s`;
  const name = findPreset(animation.animation, customAnimations)?.name ?? animation.animation;
  const delay = animation.delay > 0 ? `, après ${seconds(animation.delay)}` : "";
  return `${name}, ${findTriggerEvent(animation.event).phrase}, ${seconds(animation.duration)}${delay}`;
}

/**
 * Pose une animation sur un élément. Si l'élément en avait déjà une, on garde
 * son déclencheur et son délai ; la durée repart de celle de la nouvelle animation.
 */
export function withPreset(
  presetId: string,
  previous: ElementAnimation | null,
  customAnimations: readonly AnimationPreset[] = [],
): ElementAnimation {
  return {
    animation: presetId,
    event: previous?.event ?? DEFAULT_TRIGGER_EVENT,
    duration: findPreset(presetId, customAnimations)?.duration ?? 600,
    delay: previous?.delay ?? 0,
  };
}
