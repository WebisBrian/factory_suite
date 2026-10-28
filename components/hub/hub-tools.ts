export interface HubTool {
  slug: "screendraft" | "generator" | "animations";
  label: string;
  /** Monogramme affiché dans l'icône de l'appli (style suite créative). */
  monogram: string;
  description: string;
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
    theme: {
      icon: "bg-[#001e36] ring-1 ring-sky-400/40",
      text: "text-sky-300",
      hover: "hover:border-sky-400/60 hover:shadow-sky-500/20",
      glow: "bg-sky-500/30",
    },
  },
  {
    slug: "generator",
    label: "Générateur",
    monogram: "Gn",
    description: "JSON → HTML/CSS",
    theme: {
      icon: "bg-[#062b1f] ring-1 ring-emerald-400/40",
      text: "text-emerald-300",
      hover: "hover:border-emerald-400/60 hover:shadow-emerald-500/20",
      glow: "bg-emerald-500/30",
    },
  },
  {
    slug: "animations",
    label: "Animations",
    monogram: "An",
    description: "HTML/CSS → animations",
    theme: {
      icon: "bg-[#2a0a3d] ring-1 ring-fuchsia-400/40",
      text: "text-fuchsia-300",
      hover: "hover:border-fuchsia-400/60 hover:shadow-fuchsia-500/20",
      glow: "bg-fuchsia-500/30",
    },
  },
];

/** Lien vers un outil. Sans projectId : mode démo (fixtures). */
export function hubToolHref(tool: HubTool, projectId: number | null): string {
  return projectId === null ? `/${tool.slug}` : `/${tool.slug}?project_id=${projectId}`;
}
