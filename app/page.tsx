import { HubAppShowcase } from "@/components/hub/HubAppShowcase";
import { HubDashboard } from "@/components/hub/HubDashboard";

export default function HubPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:gap-12 sm:py-12">
      <div className="flex flex-col gap-3">
        <p className="text-base font-bold tracking-widest text-zinc-300 uppercase">FactorySuite Hub</p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          De la maquette à l&apos;
          <span className="bg-linear-to-r from-sky-300 via-emerald-300 to-fuchsia-300 bg-clip-text text-transparent">
            interface animée
          </span>
          .
        </h1>
        <p className="max-w-2xl text-lg text-zinc-200">
          Quatre étapes à la suite : ScreenDraft (qui génère aussi les pages HTML/CSS), puis AnimFlow, puis le contrôle qualité, puis CodeForge pour exporter le site. Chaque projet a son propre
          dossier, partagé par les trois outils.
        </p>
      </div>
      <HubAppShowcase />
      <HubDashboard />
    </main>
  );
}
