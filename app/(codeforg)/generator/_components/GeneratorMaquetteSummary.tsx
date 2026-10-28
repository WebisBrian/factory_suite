import type { ReactNode } from "react";
import { countNodes, type Maquette, type MaquetteNode } from "@/app/(codeforg)/generator/_lib/maquette";

const NODE_LABELS: Record<MaquetteNode["type"], string> = {
  section: "Section",
  title: "Titre",
  text: "Texte",
  image: "Image",
  button: "Bouton",
};

function nodeContent(node: MaquetteNode): string {
  switch (node.type) {
    case "section":
      return `${node.children.length} élément(s)`;
    case "title":
      return `h${node.props.level} · ${node.props.text}`;
    case "text":
      return node.props.text;
    case "image":
      return node.props.alt || node.props.src;
    case "button":
      return node.props.label;
  }
}

export function GeneratorMaquetteSummary({ maquette, sourceLabel }: { maquette: Maquette; sourceLabel: string }) {
  const { frame } = maquette;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-300">Maquette reçue</p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-100">{maquette.name}</h2>
          <p className="text-sm text-zinc-500">{sourceLabel}</p>
        </div>
        <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-xs text-zinc-200">{maquette.id}</code>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GeneratorStat label="Format" value={frame.device === "desktop" ? "Desktop" : "Mobile"} />
        <GeneratorStat label="Dimensions" value={`${frame.width} × ${frame.height} px`} />
        <GeneratorStat
          label="Fond"
          value={
            <span className="flex items-center gap-2">
              <span className="size-3.5 rounded-sm ring-1 ring-white/20" style={{ backgroundColor: frame.backgroundColor }} />
              <span className="font-mono">{frame.backgroundColor}</span>
            </span>
          }
        />
        <GeneratorStat label="Éléments" value={String(countNodes(maquette.nodes))} />
      </dl>

      <h3 className="mt-6 text-sm font-semibold text-zinc-200">Arborescence</h3>
      <div className="mt-2 overflow-x-auto rounded-xl bg-black/30 p-3">
        {maquette.nodes.length === 0 ? (
          <p className="text-sm text-zinc-500">La maquette ne contient aucun élément.</p>
        ) : (
          <GeneratorNodeTree nodes={maquette.nodes} />
        )}
      </div>
    </section>
  );
}

function GeneratorStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-zinc-100">{value}</dd>
    </div>
  );
}

function GeneratorNodeTree({ nodes }: { nodes: MaquetteNode[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {nodes.map((node) => (
        <li key={node.id}>
          <div className="flex min-w-max items-center gap-3 rounded-lg px-2 py-1 text-sm hover:bg-white/5">
            <span className="w-16 shrink-0 text-xs font-medium text-emerald-300">{NODE_LABELS[node.type]}</span>
            <span className="max-w-md truncate text-zinc-200">{nodeContent(node)}</span>
            <span className="font-mono text-xs text-zinc-500">
              {node.x},{node.y} · {node.width}×{node.height}
            </span>
          </div>
          {node.type === "section" && node.children.length > 0 && (
            <div className="ml-4 border-l border-white/10 pl-2">
              <GeneratorNodeTree nodes={node.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
