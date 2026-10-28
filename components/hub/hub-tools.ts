import screendraftMark from "@/components/hub/logos/screendraft-mark.svg";
import codeforgeMark from "@/components/hub/logos/codeforge-mark.svg";
import animflowMark from "@/components/hub/logos/animflow-mark.svg";

export interface HubTool {
  slug: "screendraft" | "generator" | "animations";
  /** Route de l'outil si elle diffère de `/${slug}` (CodeForge : app/codeforge/). */
  path?: string;
  label: string;
  /** Monogramme affiché dans l'icône de l'appli (style suite créative). */
  monogram: string;
  /** Logo de l'outil (SVG dans components/hub/logos/), affiché à la place du monogramme. */
  logo?: string;
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
    label: "ScreenDraft",
    monogram: "Sd",
    logo: screendraftMark.src,
    description: "Maquette → JSON",
    theme: {
      icon: "bg-[#2348FF] ring-2 ring-sky-300",
      text: "text-sky-300",
      hover: "hover:border-sky-300 hover:shadow-sky-500/20",
      glow: "bg-sky-500/30",
    },
  },
  {
    slug: "generator",
    path: "/codeforge/generator",
    label: "CodeForge",
    monogram: "Cf",
    logo: codeforgeMark.src,
    description: "JSON → HTML/CSS",
    theme: {
      icon: "bg-[#0B7A53] ring-2 ring-emerald-300",
      text: "text-emerald-300",
      hover: "hover:border-emerald-300 hover:shadow-emerald-500/20",
      glow: "bg-emerald-500/30",
    },
  },
  {
    slug: "animations",
    label: "AnimFlow",
    monogram: "Af",
    logo: animflowMark.src,
    description: "HTML/CSS → animations",
    theme: {
      icon: "bg-[#A3168F] ring-2 ring-fuchsia-300",
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
