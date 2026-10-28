import { HubAppShowcase } from "@/components/hub/HubAppShowcase";
import { HubDashboard } from "@/components/hub/HubDashboard";

export default function HubPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-12">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase">FactorySuite Hub</p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          De la maquette à l&apos;
          <span className="bg-linear-to-r from-sky-400 via-emerald-400 to-fuchsia-400 bg-clip-text text-transparent">
            interface animée
          </span>
          .
        </h1>
        <p className="max-w-2xl text-zinc-400">
          Screendraft → Générateur → Animations. Chaque projet a son propre dossier, partagé par les trois outils.
        </p>
      </div>
      <HubAppShowcase />
      <HubDashboard />
    </main>
  );
}
