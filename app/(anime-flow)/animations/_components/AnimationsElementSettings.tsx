"use client";

import { useId } from "react";
import { AnimationsSecondsField } from "@/app/(anime-flow)/animations/_components/AnimationsSecondsField";
import {
  ANIMATION_PRESETS,
  describeEffect,
  findPreset,
  type AnimationPreset,
} from "@/app/(anime-flow)/animations/_lib/animation-library";
import {
  DELAY_LIMITS,
  DURATION_LIMITS,
  type ElementAnimation,
} from "@/app/(anime-flow)/animations/_lib/element-animation";
import { FIELD_CLASS, SECONDARY_BUTTON } from "@/app/(anime-flow)/animations/_lib/field-styles";
import {
  findTriggerEvent,
  TRIGGER_EVENTS,
  type TriggerEventId,
} from "@/app/(anime-flow)/animations/_lib/trigger-events";

const NO_ANIMATION = "none";

/** id des réglages, pour y amener le focus depuis « Modifier ». */
export const SETTINGS_ID = "animations-settings";

type Props = {
  /** null : aucune animation. */
  animation: ElementAnimation | null;
  customAnimations: readonly AnimationPreset[];
  onPresetChange: (presetId: string | null) => void;
  onEventChange: (event: TriggerEventId) => void;
  onTimingChange: (timing: Partial<Pick<ElementAnimation, "duration" | "delay">>) => void;
  onPreview: () => void;
};

/**
 * Réglages de l'élément sélectionné : l'animation et son déclencheur (deux listes déroulantes,
 * avec la description du choix courant), puis sa durée et son délai.
 */
export function AnimationsElementSettings({
  animation,
  customAnimations,
  onPresetChange,
  onEventChange,
  onTimingChange,
  onPreview,
}: Props) {
  const uid = useId();
  const preset = animation ? findPreset(animation.animation, customAnimations) : null;
  const presetDescription = preset ? describeEffect(preset, animation?.duration) : "L'élément reste immobile.";

  return (
    <div id={SETTINGS_ID} tabIndex={-1} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label htmlFor={`${uid}-animation`} className="text-sm font-semibold">
          Animation
        </label>
        <select
          id={`${uid}-animation`}
          value={animation?.animation ?? NO_ANIMATION}
          onChange={(e) => onPresetChange(e.target.value === NO_ANIMATION ? null : e.target.value)}
          aria-describedby={`${uid}-animation-description`}
          className={FIELD_CLASS}
        >
          <option value={NO_ANIMATION}>Aucune animation</option>
          <optgroup label="Bibliothèque">
            {ANIMATION_PRESETS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </optgroup>
          {customAnimations.length > 0 && (
            <optgroup label="Mes animations">
              {customAnimations.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <p id={`${uid}-animation-description`} className="text-sm text-(--ink-muted)">
          {presetDescription}
        </p>
      </div>

      {/* Sans animation, il n'y a rien à déclencher ni à régler. */}
      {animation && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${uid}-event`} className="text-sm font-semibold">
              Déclencheur
            </label>
            <select
              id={`${uid}-event`}
              value={animation.event}
              onChange={(e) => {
                const next = TRIGGER_EVENTS.find((trigger) => trigger.id === e.target.value);
                if (next) onEventChange(next.id);
              }}
              aria-describedby={`${uid}-event-description`}
              className={FIELD_CLASS}
            >
              {TRIGGER_EVENTS.map((trigger) => (
                <option key={trigger.id} value={trigger.id}>
                  {trigger.name}
                </option>
              ))}
            </select>
            <p id={`${uid}-event-description`} className="text-sm text-(--ink-muted)">
              {findTriggerEvent(animation.event).description}
            </p>
          </div>

          {/* key : la durée repart de celle de l'animation quand on en change. */}
          <fieldset key={animation.animation}>
            <legend className="text-sm font-semibold">Durée et délai</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              <AnimationsSecondsField
                label="Durée"
                valueMs={animation.duration}
                limits={DURATION_LIMITS}
                onChange={(duration) => onTimingChange({ duration })}
              />
              <AnimationsSecondsField
                label="Délai avant de démarrer"
                valueMs={animation.delay}
                limits={DELAY_LIMITS}
                onChange={(delay) => onTimingChange({ delay })}
              />
            </div>
          </fieldset>

          <button type="button" onClick={onPreview} className={`${SECONDARY_BUTTON} self-start`}>
            <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-current">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
            </svg>
            Prévisualiser
          </button>
        </>
      )}
    </div>
  );
}
