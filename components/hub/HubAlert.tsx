/**
 * Message d'erreur annoncé immédiatement par les lecteurs d'écran (role="alert").
 * Le mot « Erreur » est écrit en toutes lettres : l'information ne repose pas sur la couleur rouge.
 */
export function HubAlert({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-xl border-2 border-red-400 bg-red-950/60 p-4 text-base text-red-100">
      <strong className="font-bold text-white">Erreur : </strong>
      {children}
    </div>
  );
}

/** Message de chargement / d'état, annoncé poliment (sans interrompre la lecture). */
export function HubStatus({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="text-base text-zinc-300">
      {children}
    </p>
  );
}
