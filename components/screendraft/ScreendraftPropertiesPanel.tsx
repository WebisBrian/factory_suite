import type { ChangeEvent, Dispatch, ReactNode } from "react";
import { ScreendraftCreateComponent } from "@/components/screendraft/ScreendraftCreateComponent";
import { ScreendraftDepthControls } from "@/components/screendraft/ScreendraftDepthControls";
import { ScreendraftInstanceControls } from "@/components/screendraft/ScreendraftInstanceControls";
import type { CustomComponent } from "@/components/screendraft/screendraft-components";
import { ScreendraftNodeProperties } from "@/components/screendraft/ScreendraftNodeProperties";
import { ScreendraftThemePanel } from "@/components/screendraft/ScreendraftThemePanel";
import {
  FRAME_PRESETS,
  MAX_FRAME_HEIGHT,
  MIN_FRAME_HEIGHT,
  findPreset,
  isValidFrameHeight,
} from "@/components/screendraft/screendraft-formats";
import type { ScreendraftAction } from "@/components/screendraft/screendraft-reducer";
import type { DraftNode, Frame, Screen, Theme } from "@/components/screendraft/screendraft-schema";
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
  /** Écran actif. */
  screen: Screen;
  /** Une maquette garde au moins un écran : le dernier ne peut pas être supprimé. */
  canDeleteScreen: boolean;
  selection: NodeLocation | null;
  /** Écran de l'élément sélectionné. */
  selectionScreenId: string | null;
  screens: Screen[];
  /** Charte graphique de la maquette, montrée quand rien n'est sélectionné. */
  theme: Theme;
  onSendToScreen: (nodeId: string, screenId: string) => void;
  dispatch: Dispatch<ScreendraftAction>;
  /** Bibliothèque du projet, pour retrouver le composant d'une instance. */
  components: CustomComponent[];
  componentHandlers: ScreendraftComponentHandlers;
  /** Panneau d'une sélection multiple (`selection` est alors null), ou null. */
  multiSelection: ReactNode;
};

/** Actions sur les composants custom : elles écrivent la bibliothèque avant de modifier la maquette. */
export type ScreendraftComponentHandlers = {
  create: (name: string, node: DraftNode) => void;
  update: (node: DraftNode) => void;
  reset: (id: string, component: CustomComponent) => void;
  detach: (id: string) => void;
};

/**
 * Composant, propriétés, profondeur et écran de l'élément sélectionné,
 * puis propriétés de l'écran actif.
 */
export function ScreendraftPropertiesPanel({
  screen,
  canDeleteScreen,
  selection,
  selectionScreenId,
  screens,
  theme,
  onSendToScreen,
  dispatch,
  components,
  componentHandlers,
  multiSelection,
}: ScreendraftPropertiesPanelProps) {
  const { frame } = screen;
  const preset = findPreset(frame);

  function handleFormatChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = FRAME_PRESETS.find((option) => String(option.width) === event.target.value);
    if (next) dispatch({ type: "set-format", screenId: screen.id, format: next });
  }

  // Un nom vide n'est pas gardé : l'écran reprend un nom par défaut en sortant du champ.
  function commitName(input: HTMLInputElement) {
    if (input.value.trim() === "") dispatch({ type: "rename-screen", screenId: screen.id, name: "Sans nom" });
  }

  // Validée à la sortie du champ (ou sur Entrée) pour laisser taper librement.
  function commitHeight(input: HTMLInputElement) {
    const height = Number(input.value);
    if (!isValidFrameHeight(height)) {
      input.value = String(frame.height);
      return;
    }
    if (height !== frame.height) dispatch({ type: "set-frame-height", screenId: screen.id, height });
  }

  return (
    <aside aria-label="Propriétés" className="w-72 max-w-[32vw] shrink-0 overflow-y-auto border-l border-(--line) bg-(--surface-raised) p-(--space-4)">
      {selection?.node.componentId !== undefined && (
        <ScreendraftInstanceControls
          node={selection.node}
          component={components.find((item) => item.id === selection.node.componentId)}
          screens={screens}
          onUpdate={componentHandlers.update}
          onReset={componentHandlers.reset}
          onDetach={componentHandlers.detach}
        />
      )}
      {selection && (
        <ScreendraftNodeProperties
          node={selection.node}
          screens={screens}
          screenId={selectionScreenId}
          theme={theme}
          dispatch={dispatch}
        />
      )}
      {multiSelection}
      {!selection && !multiSelection && <ScreendraftThemePanel theme={theme} dispatch={dispatch} />}
      {selection && <ScreendraftDepthControls location={selection} dispatch={dispatch} />}
      {/* Équivalent clavier du glisser vers un autre écran. */}
      {selection && selectionScreenId && screens.length > 1 && (
        <section className="mb-(--space-4) border-b border-(--line) pb-(--space-4)">
          <label className="text-body-sm flex flex-col gap-(--space-1)">
            <span className="text-label text-(--ink-muted)">Écran de l’élément</span>
            <select
              value={selectionScreenId}
              onChange={(event) => onSendToScreen(selection.node.id, event.target.value)}
              className={FIELD_CLASS}
            >
              {screens.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}
      {selection && selection.node.componentId === undefined && (
        <ScreendraftCreateComponent
          key={selection.node.id}
          node={selection.node}
          onCreate={componentHandlers.create}
        />
      )}
      <h2 className="text-label pb-(--space-2) text-(--ink-muted)">
        Écran
      </h2>
      <div className="text-body-sm flex flex-col gap-(--space-3)">
        <label className="flex flex-col gap-(--space-1)">
          <span className="text-(--ink-muted)">Nom</span>
          <input
            type="text"
            value={screen.name}
            onChange={(event) =>
              dispatch({ type: "rename-screen", screenId: screen.id, name: event.target.value })
            }
            onBlur={(event) => commitName(event.currentTarget)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className={FIELD_CLASS}
          />
        </label>

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
              key={`${screen.id}:${frame.height}`}
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

        <button
          type="button"
          disabled={!canDeleteScreen}
          title={canDeleteScreen ? undefined : "Une maquette garde au moins un écran"}
          onClick={() => dispatch({ type: "delete-screen", screenId: screen.id })}
          className="text-body-sm mt-(--space-2) rounded-(--radius-md) border border-(--line-strong) bg-(--surface-raised) px-(--space-2) py-(--space-1) text-(--danger) hover:border-(--danger) disabled:border-(--line) disabled:text-(--line-strong) disabled:hover:border-(--line)"
        >
          Supprimer l’écran
        </button>
      </div>
    </aside>
  );
}
