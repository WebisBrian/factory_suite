import { DEFAULT_THEME } from "@/components/screendraft/screendraft-mockup-theme";
import type { Maquette } from "@/components/screendraft/screendraft-schema";
import { bakeryTemplate } from "@/components/screendraft/templates/screendraft-template-bakery";
import { blogTemplate } from "@/components/screendraft/templates/screendraft-template-blog";
import {
  defineTemplate,
  desktopFrame,
  screen,
  type ScreendraftTemplate,
} from "@/components/screendraft/templates/screendraft-template-builder";
import { eventTemplate } from "@/components/screendraft/templates/screendraft-template-event";
import { landingTemplate } from "@/components/screendraft/templates/screendraft-template-landing";
import { portfolioTemplate } from "@/components/screendraft/templates/screendraft-template-portfolio";

export type { ScreendraftTemplate };

/** Point de départ sans contenu, proposé en premier. */
export const blankTemplate = defineTemplate(
  "blank",
  "Maquette vierge",
  "Un écran vide au format ordinateur, pour partir de zéro.",
  DEFAULT_THEME,
  [screen("screen_1", "Écran 1", desktopFrame(1024), [])],
);

/** Maquettes par défaut, proposées à l'import dans un nouveau projet. */
export const SCREENDRAFT_TEMPLATES: readonly ScreendraftTemplate[] = [
  blankTemplate,
  landingTemplate,
  portfolioTemplate,
  bakeryTemplate,
  blogTemplate,
  eventTemplate,
];

/** Copie indépendante du modèle, prête à être enregistrée en `maquette.json` du projet. */
export function createMaquetteFromTemplate(template: ScreendraftTemplate, projectId: number): Maquette {
  return { ...structuredClone(template.maquette), id: `maquette_${projectId}` };
}
