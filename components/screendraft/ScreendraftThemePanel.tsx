import type { Dispatch } from "react";
import {
  ScreendraftColorField,
  ScreendraftFieldGroup,
  ScreendraftNumberField,
} from "@/components/screendraft/ScreendraftFields";
import {
  THEME_COLORS,
  THEME_TEXT_SIZES,
} from "@/components/screendraft/screendraft-mockup-theme";
import type { ScreendraftAction } from "@/components/screendraft/screendraft-reducer";
import type { Theme } from "@/components/screendraft/screendraft-schema";

// Bornes des champs, en px.
const MAX_TEXT_SIZE = 400;
const MAX_RADIUS = 200;

/**
 * Charte graphique de la maquette (SCRUM-12). Chaque modification met à jour, sur tous
 * les écrans, les éléments qui suivent la charte ; ceux réglés à la main ne bougent pas.
 */
export function ScreendraftThemePanel({
  theme,
  dispatch,
}: {
  theme: Theme;
  dispatch: Dispatch<ScreendraftAction>;
}) {
  return (
    <ScreendraftFieldGroup title="Charte graphique">
      <p className="text-(--ink-muted)">
        Appliquée aux éléments liés à la charte, sur tous les écrans. Les nouveaux éléments la suivent.
      </p>
      {THEME_COLORS.map(({ key, label }) => (
        <ScreendraftColorField
          key={key}
          label={label}
          value={theme.colors[key]}
          fallback={theme.colors[key]}
          onChange={(color) => dispatch({ type: "set-theme", patch: { colors: { [key]: color } } })}
        />
      ))}
      <div className="grid grid-cols-2 gap-(--space-3)">
        {THEME_TEXT_SIZES.map(({ key, label }) => (
          <ScreendraftNumberField
            key={key}
            label={`${label} (px)`}
            value={theme.textSizes[key]}
            min={1}
            max={MAX_TEXT_SIZE}
            onCommit={(size) => dispatch({ type: "set-theme", patch: { textSizes: { [key]: size } } })}
          />
        ))}
        <ScreendraftNumberField
          label="Arrondi (px)"
          value={theme.radius}
          min={0}
          max={MAX_RADIUS}
          onCommit={(radius) => dispatch({ type: "set-theme", patch: { radius } })}
        />
      </div>
    </ScreendraftFieldGroup>
  );
}
