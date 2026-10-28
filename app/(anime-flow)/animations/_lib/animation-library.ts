/**
 * Bibliothèque d'animations prêtes à l'emploi, jouées avec la Web Animations API.
 *
 * Règles d'accessibilité communes à toutes les animations :
 * - jouées une seule fois (pas de boucle infinie) ;
 * - aucun clignotement : on anime la position, la taille ou l'opacité, jamais
 *   une alternance rapide de luminosité ;
 * - chaque animation a une description lue par le lecteur d'écran.
 */

export type AnimationPreset = {
  id: string;
  name: string;
  /** Ce que fait l'animation, sans la durée : « l'élément apparaît progressivement ». */
  effect: string;
  keyframes: Keyframe[];
  /** Durée par défaut, en ms. */
  duration: number;
  easing: string;
};

export const ANIMATION_PRESETS: readonly AnimationPreset[] = [
  {
    id: "fade",
    name: "Fondu",
    effect: "l'élément apparaît progressivement",
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    duration: 600,
    easing: "ease-out",
  },
  {
    id: "slide-up",
    name: "Glissement vers le haut",
    effect: "l'élément apparaît en montant depuis le bas",
    keyframes: [
      { opacity: 0, transform: "translateY(32px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    duration: 600,
    easing: "ease-out",
  },
  {
    id: "slide-down",
    name: "Glissement vers le bas",
    effect: "l'élément apparaît en descendant depuis le haut",
    keyframes: [
      { opacity: 0, transform: "translateY(-32px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    duration: 600,
    easing: "ease-out",
  },
  {
    id: "slide-left",
    name: "Glissement vers la gauche",
    effect: "l'élément apparaît en arrivant par la droite",
    keyframes: [
      { opacity: 0, transform: "translateX(32px)" },
      { opacity: 1, transform: "translateX(0)" },
    ],
    duration: 600,
    easing: "ease-out",
  },
  {
    id: "slide-right",
    name: "Glissement vers la droite",
    effect: "l'élément apparaît en arrivant par la gauche",
    keyframes: [
      { opacity: 0, transform: "translateX(-32px)" },
      { opacity: 1, transform: "translateX(0)" },
    ],
    duration: 600,
    easing: "ease-out",
  },
  {
    id: "zoom",
    name: "Zoom",
    effect: "l'élément apparaît en grandissant",
    keyframes: [
      { opacity: 0, transform: "scale(0.8)" },
      { opacity: 1, transform: "scale(1)" },
    ],
    duration: 500,
    easing: "ease-out",
  },
  {
    id: "bounce",
    name: "Rebond",
    effect: "l'élément rebondit deux fois sur place",
    keyframes: [
      { transform: "translateY(0)" },
      { transform: "translateY(-24px)", offset: 0.3 },
      { transform: "translateY(0)", offset: 0.55 },
      { transform: "translateY(-10px)", offset: 0.75 },
      { transform: "translateY(0)" },
    ],
    duration: 800,
    easing: "ease-out",
  },
  {
    id: "shake",
    name: "Secousse",
    effect: "l'élément tremble légèrement de gauche à droite",
    keyframes: [
      { transform: "translateX(0)" },
      { transform: "translateX(-8px)" },
      { transform: "translateX(8px)" },
      { transform: "translateX(-8px)" },
      { transform: "translateX(8px)" },
      { transform: "translateX(0)" },
    ],
    duration: 500,
    easing: "ease-in-out",
  },
  {
    id: "pulse",
    name: "Pulsation",
    effect: "l'élément grossit légèrement puis reprend sa taille",
    keyframes: [{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }],
    duration: 400,
    easing: "ease-in-out",
  },
];

export function findPreset(id: string): AnimationPreset | null {
  return ANIMATION_PRESETS.find((preset) => preset.id === id) ?? null;
}

/** Audiodescription : « Fondu : l'élément apparaît progressivement en 0,6 seconde. » */
export function describePreset(preset: AnimationPreset, duration = preset.duration): string {
  return `${preset.name} : ${describeEffect(preset, duration)}`;
}

/** L'effet seul, quand le nom est déjà affiché : « L'élément apparaît progressivement en 0,6 seconde. » */
export function describeEffect(preset: AnimationPreset, duration = preset.duration): string {
  const seconds = duration / 1000;
  const unit = seconds < 2 ? "seconde" : "secondes";
  const sentence = `${preset.effect} en ${seconds.toLocaleString("fr-FR")} ${unit}.`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
