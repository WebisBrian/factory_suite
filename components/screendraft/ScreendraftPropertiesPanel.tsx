import type { ChangeEvent, Dispatch } from "react";
import { ScreendraftDepthControls } from "@/components/screendraft/ScreendraftDepthControls";
import { ScreendraftNodeProperties } from "@/components/screendraft/ScreendraftNodeProperties";
import {
  FRAME_PRESETS,
  MAX_FRAME_HEIGHT,
  MIN_FRAME_HEIGHT,
  findPreset,
  isValidFrameHeight,
} from "@/components/screendraft/screendraft-formats";
import type { ScreendraftAction } from "@/components/screendraft/screendraft-reducer";
import type { Frame } from "@/components/screendraft/screendraft-schema";
import type { NodeLocation } from "@/components/screendraft/screendraft-tree";

const DEVICE_GROUPS: { device: Frame["device"]; label: string }[] = [
  { device: "desktop", label: "Desktop" },
  { device: "mobile", label: "Mobile" },
];

// Une maquette importée peut avoir une largeur qui ne correspond à aucun format proposé.
const CUSTOM_FORMAT = "custom";

const FIELD_CLASS =
  "w-full rounded-(--radius-sm) border border-(--line-strong) bg-(--surface-raised) px-(--space-2) py-(--space-1) text-(--ink)";

type ScreendraftPropertiesPanelProps = {
  frame: Frame;
  selection: NodeLocation | null;
  dispatch: Dispatch<ScreendraftAction>;
};

/** Contenu et profondeur de l'élément sélectionné, puis propriétés de la maquette. Le reste viendra avec SCRUM-8. */
export function ScreendraftPropertiesPanel({
  frame,
  selection,
  dispatch,
}: ScreendraftPropertiesPanelProps) {
  const preset = findPreset(frame);

  function handleFormatChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = FRAME_PRESETS.find((option) => String(option.width) === event.target.value);
    if (next) dispatch({ type: "set-format", format: next });
  }

  // Validée à la sortie du champ (ou sur Entrée) pour laisser taper librement.
  function commitHeight(input: HTMLInputElement) {
    const height = Number(input.value);
    if (!isValidFrameHeight(height)) {
      input.value = String(frame.height);
      return;
    }
    if (height !== frame.height) dispatch({ type: "set-frame-height", height });
  }

  return (
    <aside className="w-64 shrink-0 overflow-y-auto border-l border-(--line) bg-(--surface-raised) p-(--space-4)">
      {selection && <ScreendraftNodeProperties node={selection.node} dispatch={dispatch} />}
      {selection && <ScreendraftDepthControls location={selection} dispatch={dispatch} />}
      <h2 className="text-label pb-(--space-2) text-(--ink-muted)">
        Maquette
      </h2>
      <div className="text-body-sm flex flex-col gap-(--space-3)">
        <label className="flex flex-col gap-(--space-1)">
          <span className="text-(--ink-muted)">Format</span>
          <select
            value={preset ? String(preset.width) : CUSTOM_FORMAT}
            onChange={handleFormatChange}
            className={FIELD_CLASS}
          >
            {!preset && (
              <option value={CUSTOM_FORMAT} disabled>
                Personnalisé — {frame.width} px
              </option>
            )}
            {DEVICE_GROUPS.map(({ device, label }) => (
              <optgroup key={device} label={label}>
                {FRAME_PRESETS.filter((option) => option.device === device).map((option) => (
                  <option key={option.width} value={option.width}>
                    {option.label} — {option.width} px
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-(--space-3)">
          <div className="flex flex-col gap-(--space-1)">
            <span className="text-(--ink-muted)">Largeur (px)</span>
            <p className="text-code rounded-(--radius-sm) border border-(--line) px-(--space-2) py-(--space-1) text-(--ink-muted) tabular-nums">
              {frame.width}
            </p>
          </div>
          <label className="flex flex-col gap-(--space-1)">
            <span className="text-(--ink-muted)">Hauteur (px)</span>
            <input
              key={frame.height}
              type="number"
              inputMode="numeric"
              min={MIN_FRAME_HEIGHT}
              max={MAX_FRAME_HEIGHT}
              step={1}
              defaultValue={frame.height}
              onBlur={(event) => commitHeight(event.currentTarget)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              className={`${FIELD_CLASS} text-code tabular-nums`}
            />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-(--ink-muted)">Fond</span>
          <span className="flex items-center gap-(--space-2)">
            <span
              className="size-4 rounded-(--radius-sm) border border-(--line-strong)"
              style={{ backgroundColor: frame.backgroundColor }}
            />
            <span className="text-code rounded-(--radius-sm) bg-(--canvas) px-(--space-1) text-(--ink) uppercase">
              {frame.backgroundColor}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}
