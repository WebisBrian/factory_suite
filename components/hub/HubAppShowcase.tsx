import Link from "next/link";
import { HubAppIcon } from "@/components/hub/HubAppIcon";
import { hubCard } from "@/components/hub/hub-styles";
import { HUB_TOOLS, hubToolHref } from "@/components/hub/hub-tools";

/** Les applis de la suite, ouvrables en mode démo (fixtures, sans project_id). */
export function HubAppShowcase() {
  return (
    <section aria-labelledby="hub-tools-title" className="flex flex-col gap-4">
      <h2 id="hub-tools-title" className="text-2xl font-bold text-white">
        Les outils, en démonstration
      </h2>
      <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {HUB_TOOLS.map((tool, index) => (
          <li key={tool.slug}>
            <Link
              href={hubToolHref(tool, null)}
              aria-label={`Étape ${index + 1} : ${tool.label}, ${tool.description}. Ouvrir en mode démonstration`}
              className={`group relative flex h-full flex-col gap-4 overflow-hidden p-5 transition-all motion-safe:hover:-translate-y-1 ${hubCard} ${tool.theme.hover}`}
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute -top-10 -right-10 size-32 rounded-full opacity-30 blur-3xl transition-opacity group-hover:opacity-60 ${tool.theme.glow}`}
              />
              <div className="relative flex items-center justify-between">
                <HubAppIcon tool={tool} size="lg" />
                <span aria-hidden className="font-mono text-base text-zinc-300">
                  Étape {index + 1}
                </span>
              </div>
              <div className="relative">
                <h3 className="text-xl font-bold text-white">{tool.label}</h3>
                <p className="text-base text-zinc-300">{tool.description}</p>
              </div>
              <span className={`relative text-base font-bold underline underline-offset-4 ${tool.theme.text}`}>
                Ouvrir en démo
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
