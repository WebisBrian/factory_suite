import { findPreset } from "@/app/(anime-flow)/animations/_lib/animation-library";
import { DEFAULT_TRIGGER_EVENT, type TriggerEventId } from "@/app/(anime-flow)/animations/_lib/trigger-events";

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

/**
 * Pose une animation sur un élément. Si l'élément en avait déjà une, on garde
 * son déclencheur et son délai ; la durée repart de celle de la nouvelle animation.
 */
export function withPreset(presetId: string, previous: ElementAnimation | null): ElementAnimation {
  return {
    animation: presetId,
    event: previous?.event ?? DEFAULT_TRIGGER_EVENT,
    duration: findPreset(presetId)?.duration ?? 600,
    delay: previous?.delay ?? 0,
  };
}
