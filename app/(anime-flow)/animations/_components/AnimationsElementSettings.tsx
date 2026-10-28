"use client";

import { useId } from "react";
import {
  ANIMATION_PRESETS,
  describeEffect,
  findPreset,
  type AnimationPreset,
} from "@/app/(anime-flow)/animations/_lib/animation-library";
import { FIELD_CLASS } from "@/app/(anime-flow)/animations/_lib/field-styles";
import {
  findTriggerEvent,
  TRIGGER_EVENTS,
  type TriggerEventId,
} from "@/app/(anime-flow)/animations/_lib/trigger-events";

const NO_ANIMATION = "none";

type Props = {
  /** null : aucune animation. */
  presetId: string | null;
  event: TriggerEventId;
  customAnimations: readonly AnimationPreset[];
  onPresetChange: (presetId: string | null) => void;
  onEventChange: (event: TriggerEventId) => void;
};

/**
 * Réglages de l'élément sélectionné : l'animation, puis ce qui la déclenche.
 * Deux listes déroulantes ; la description du choix courant est lue avec le champ.
 */
export function AnimationsElementSettings({ presetId, event, customAnimations, onPresetChange, onEventChange }: Props) {
  const uid = useId();
  const preset = presetId ? findPreset(presetId, customAnimations) : null;
  const presetDescription = preset ? describeEffect(preset) : "L'élément reste immobile.";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label htmlFor={`${uid}-animation`} className="text-lg font-semibold">
          Animation
        </label>
        <select
          id={`${uid}-animation`}
          value={presetId ?? NO_ANIMATION}
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
        <p id={`${uid}-animation-description`} className="text-lg text-(--ink-muted)">
          {presetDescription}
        </p>
      </div>

      {/* Sans animation, il n'y a rien à déclencher. */}
      {presetId !== null && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`${uid}-event`} className="text-lg font-semibold">
            Déclencheur
          </label>
          <select
            id={`${uid}-event`}
            value={event}
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
          <p id={`${uid}-event-description`} className="text-lg text-(--ink-muted)">
            {findTriggerEvent(event).description}
          </p>
        </div>
      )}
    </div>
  );
}
