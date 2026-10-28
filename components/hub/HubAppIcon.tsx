import type { HubTool } from "@/components/hub/hub-tools";

const sizes = {
  sm: "size-7 rounded-md text-xs",
  md: "size-10 rounded-lg text-sm",
  lg: "size-14 rounded-xl text-xl",
} as const;

/** Icône carrée à monogramme, façon suite créative. */
export function HubAppIcon({ tool, size = "md" }: { tool: HubTool; size?: keyof typeof sizes }) {
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
      className={`inline-flex shrink-0 items-center justify-center bg-linear-to-br from-orange-500 via-pink-500 to-violet-600 font-bold tracking-tight text-white shadow-lg shadow-pink-500/20 ${sizes[size]}`}
    >
      Fs
    </span>
  );
}
