import { HubToolCard } from "@/components/hub/HubToolCard";
import { HUB_TOOLS } from "@/components/hub/hub-tools";

export default function HubHomePage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Bienvenue dans FactorySuite
        </h1>
        <p className="max-w-2xl text-fg-muted">
          La chaîne de production d&apos;interfaces en trois étapes : de la
          maquette au HTML/CSS, puis aux animations. Choisissez un outil pour
          commencer.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {HUB_TOOLS.map((tool) => (
          <HubToolCard key={tool.href} tool={tool} />
        ))}
      </div>
    </div>
  );
}
