export interface HubTool {
  slug: "screendraft" | "generator" | "animations";
  /** Route de l'outil si elle diffère de `/${slug}` (Générateur : app/codeforge/). */
  path?: string;
  label: string;
  /** Monogramme affiché dans l'icône de l'appli (style suite créative). */
  monogram: string;
  description: string;
  /** Fichier produit par l'outil dans le dossier du projet : sa présence marque l'étape comme faite. */
  outputFile: string;
  /** Classes Tailwind complètes (pas de concaténation, sinon Tailwind ne les génère pas). */
  theme: {
    /** Fond de l'icône. */
    icon: string;
    /** Couleur du monogramme et des accents texte. */
    text: string;
    /** Bordure / halo au survol. */
    hover: string;
    /** Halo diffus derrière les tuiles. */
    glow: string;
  };
}

/** Les 3 outils, dans l'ordre du pipeline. */
export const HUB_TOOLS: readonly HubTool[] = [
  {
    slug: "screendraft",
    label: "Screendraft",
    monogram: "Sd",
    description: "Maquette → JSON",
    outputFile: "maquette.json",
    theme: {
      icon: "bg-[#001e36] ring-2 ring-sky-300",
      text: "text-sky-300",
      hover: "hover:border-sky-300 hover:shadow-sky-500/20",
      glow: "bg-sky-500/30",
    },
  },
  {
    slug: "generator",
    path: "/codeforge/generator",
    label: "Générateur",
    monogram: "Gn",
    description: "JSON → HTML/CSS",
    outputFile: "page.html",
    theme: {
      icon: "bg-[#062b1f] ring-2 ring-emerald-300",
      text: "text-emerald-300",
      hover: "hover:border-emerald-300 hover:shadow-emerald-500/20",
      glow: "bg-emerald-500/30",
    },
  },
  {
    slug: "animations",
    label: "Animations",
    monogram: "An",
    description: "HTML/CSS → animations",
    // Nom proposé dans le guide des squads : Animations n'écrit encore aucun fichier.
    outputFile: "animations.json",
    theme: {
      icon: "bg-[#2a0a3d] ring-2 ring-fuchsia-300",
      text: "text-fuchsia-300",
      hover: "hover:border-fuchsia-300 hover:shadow-fuchsia-500/20",
      glow: "bg-fuchsia-500/30",
    },
  },
];

/** Lien vers un outil. Sans projectId : mode démo (fixtures). */
export function hubToolHref(tool: HubTool, projectId: number | null): string {
  const path = tool.path ?? `/${tool.slug}`;
  return projectId === null ? path : `${path}?project_id=${projectId}`;
}
