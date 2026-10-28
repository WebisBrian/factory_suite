import Link from "next/link";
import { HubAppIcon } from "@/components/hub/HubAppIcon";
import { HUB_TOOLS, hubToolHref } from "@/components/hub/hub-tools";

/** Les 3 applis de la suite, ouvrables en mode démo (fixtures, sans project_id). */
export function HubAppShowcase() {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {HUB_TOOLS.map((tool, index) => (
        <Link
          key={tool.slug}
          href={hubToolHref(tool, null)}
          className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/3 p-5 shadow-xl shadow-transparent transition-all hover:-translate-y-1 ${tool.theme.hover}`}
        >
          <div
            className={`pointer-events-none absolute -top-10 -right-10 size-32 rounded-full opacity-40 blur-3xl transition-opacity group-hover:opacity-80 ${tool.theme.glow}`}
          />
          <div className="relative flex items-center justify-between">
            <HubAppIcon tool={tool} size="lg" />
            <span className="font-mono text-xs text-zinc-600">0{index + 1}</span>
          </div>
          <div className="relative">
            <h3 className="font-semibold text-white">{tool.label}</h3>
            <p className="text-sm text-zinc-400">{tool.description}</p>
          </div>
          <span className={`relative text-xs font-medium ${tool.theme.text}`}>Ouvrir en démo →</span>
        </Link>
      ))}
    </section>
  );
}
