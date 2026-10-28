"use client";

import {
  AnimationsChoiceGroup,
  type AnimationsChoice,
} from "@/app/(anime-flow)/animations/_components/AnimationsChoiceGroup";
import { AnimationsSecondsField } from "@/app/(anime-flow)/animations/_components/AnimationsSecondsField";
import { ANIMATION_PRESETS, describeEffect } from "@/app/(anime-flow)/animations/_lib/animation-library";
import {
  DELAY_LIMITS,
  DURATION_LIMITS,
  type ElementAnimation,
} from "@/app/(anime-flow)/animations/_lib/element-animation";
import { TRIGGER_EVENTS, type TriggerEventId } from "@/app/(anime-flow)/animations/_lib/trigger-events";

const NO_ANIMATION = "none";

const PRESET_CHOICES: readonly AnimationsChoice<string>[] = [
  { value: NO_ANIMATION, name: "Aucune animation", description: "L'élément reste immobile." },
  ...ANIMATION_PRESETS.map((preset) => ({ value: preset.id, name: preset.name, description: describeEffect(preset) })),
];

const EVENT_CHOICES: readonly AnimationsChoice<TriggerEventId>[] = TRIGGER_EVENTS.map((event) => ({
  value: event.id,
  name: event.name,
  description: event.description,
}));

type Props = {
  elementName: string;
  /** null : aucune animation. */
  animation: ElementAnimation | null;
  onPresetChange: (presetId: string | null) => void;
  onEventChange: (event: TriggerEventId) => void;
  onTimingChange: (timing: Partial<Pick<ElementAnimation, "duration" | "delay">>) => void;
  onPreview: () => void;
};

/** Réglages de l'élément sélectionné : l'animation, ce qui la déclenche, puis sa durée et son délai. */
export function AnimationsElementSettings({
  elementName,
  animation,
  onPresetChange,
  onEventChange,
  onTimingChange,
  onPreview,
}: Props) {
  return (
    <section
      aria-labelledby="animations-settings-title"
      className="flex flex-col gap-5 rounded-2xl border border-(--line) bg-(--surface-raised) p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="animations-settings-title" className="text-lg font-semibold">
          Réglages de : {elementName}
        </h2>
        {animation && (
          <button
            type="button"
            onClick={onPreview}
            className="min-h-10 rounded-full border-2 border-(--line-strong) bg-(--surface-raised) px-5 text-sm font-semibold hover:bg-(--motion-soft)"
          >
            Prévisualiser
          </button>
        )}
      </div>
      <AnimationsChoiceGroup
        legend="Animation"
        name="animations-preset"
        choices={PRESET_CHOICES}
        value={animation?.animation ?? NO_ANIMATION}
        onChange={(value) => onPresetChange(value === NO_ANIMATION ? null : value)}
      />
      {/* Sans animation, il n'y a rien à déclencher ni à régler. */}
      {animation && (
        <>
          <AnimationsChoiceGroup
            legend="Déclencheur"
            name="animations-event"
            choices={EVENT_CHOICES}
            value={animation.event}
            onChange={onEventChange}
          />
          {/* key : la durée repart de celle de l'animation quand on en change. */}
          <fieldset key={animation.animation}>
            <legend className="text-base font-semibold">Durée et délai</legend>
            <div className="mt-2 flex flex-wrap gap-6">
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
        </>
      )}
    </section>
  );
}
