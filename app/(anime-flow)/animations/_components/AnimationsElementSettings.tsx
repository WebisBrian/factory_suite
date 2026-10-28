"use client";

import {
  AnimationsChoiceGroup,
  type AnimationsChoice,
} from "@/app/(anime-flow)/animations/_components/AnimationsChoiceGroup";
import { ANIMATION_PRESETS, describeEffect } from "@/app/(anime-flow)/animations/_lib/animation-library";
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
  presetId: string | null;
  event: TriggerEventId;
  onPresetChange: (presetId: string | null) => void;
  onEventChange: (event: TriggerEventId) => void;
};

/** Réglages de l'élément sélectionné : l'animation, puis ce qui la déclenche. */
export function AnimationsElementSettings({ elementName, presetId, event, onPresetChange, onEventChange }: Props) {
  return (
    <section
      aria-labelledby="animations-settings-title"
      className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/3 p-5"
    >
      <h2 id="animations-settings-title" className="text-xl font-semibold text-zinc-100">
        Réglages de : {elementName}
      </h2>
      <AnimationsChoiceGroup
        legend="Animation"
        name="animations-preset"
        choices={PRESET_CHOICES}
        value={presetId ?? NO_ANIMATION}
        onChange={(value) => onPresetChange(value === NO_ANIMATION ? null : value)}
      />
      {/* Sans animation, il n'y a rien à déclencher. */}
      {presetId !== null && (
        <AnimationsChoiceGroup
          legend="Déclencheur"
          name="animations-event"
          choices={EVENT_CHOICES}
          value={event}
          onChange={onEventChange}
        />
      )}
    </section>
  );
}
