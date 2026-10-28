/** Évènements qui déclenchent une animation sur le site final. */

export type TriggerEventId = "load" | "scroll" | "hover" | "click";

export type TriggerEvent = {
  id: TriggerEventId;
  name: string;
  /** Audiodescription lue par le lecteur d'écran. */
  description: string;
  /** Fin de phrase pour les annonces : « Rebond se jouera au clic. » */
  phrase: string;
};

export const TRIGGER_EVENTS: readonly TriggerEvent[] = [
  {
    id: "load",
    name: "Au chargement",
    description: "L'animation se joue dès que la page s'affiche.",
    phrase: "au chargement de la page",
  },
  {
    id: "scroll",
    name: "Au défilement",
    description: "L'animation se joue quand l'élément apparaît à l'écran en faisant défiler la page.",
    phrase: "quand l'élément apparaît à l'écran",
  },
  {
    id: "hover",
    name: "Au survol",
    // Le focus clavier compte comme un survol : l'animation reste accessible sans souris.
    description: "L'animation se joue quand la souris passe sur l'élément, ou quand il reçoit le focus au clavier.",
    phrase: "au survol",
  },
  {
    id: "click",
    name: "Au clic",
    description: "L'animation se joue quand on clique sur l'élément.",
    phrase: "au clic",
  },
];

export const DEFAULT_TRIGGER_EVENT: TriggerEventId = "load";

export function findTriggerEvent(id: TriggerEventId): TriggerEvent {
  // Le type garantit que l'id existe dans la liste.
  return TRIGGER_EVENTS.find((event) => event.id === id)!;
}
