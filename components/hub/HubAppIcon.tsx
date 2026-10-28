import type { HubTool } from "@/components/hub/hub-tools";

const sizes = {
  sm: "size-7 rounded-md text-sm",
  md: "size-10 rounded-lg text-base",
  lg: "size-14 rounded-xl text-xl",
} as const;

/** Icône carrée de l'outil : son logo s'il en a un, sinon un monogramme façon suite créative. */
export function HubAppIcon({ tool, size = "md" }: { tool: HubTool; size?: keyof typeof sizes }) {
  if (tool.logo) {
    return (
      <span aria-hidden className={`inline-flex shrink-0 overflow-hidden ${sizes[size]} ${tool.theme.icon}`}>
        {/* Décoratif : le nom de l'outil est toujours écrit à côté. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- export statique, pas d'optimisation d'image */}
        <img src={tool.logo} alt="" className="size-full" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center font-bold tracking-tight ${sizes[size]} ${tool.theme.icon} ${tool.theme.text}`}
    >
      {tool.monogram}
    </span>
  );
}

/** Logo FactorySuite (dégradé multicolore). */
export function HubLogo({ size = "md" }: { size?: keyof typeof sizes }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center bg-linear-to-br from-orange-700 via-pink-700 to-violet-700 font-bold tracking-tight text-white shadow-lg shadow-pink-500/20 ${sizes[size]}`}
    >
      Fs
    </span>
  );
}
