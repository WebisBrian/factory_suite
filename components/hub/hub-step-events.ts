// Les outils ne s'importent pas entre eux : ils préviennent la barre d'étapes du Hub par un évènement.
// La barre le déclenche avant de changer d'étape ; un outil y répond en renvoyant une promesse
// (true : on peut partir, false : on reste, l'outil affiche lui-même l'erreur).

const STEP_LEAVE_EVENT = "hub:step-leave";

type StepLeaveDetail = { waitFor: Promise<boolean>[] };

/** À appeler par un outil qui doit agir avant le départ (ex. enregistrer). Renvoie la fonction de désinscription. */
export function onStepLeave(handler: () => Promise<boolean> | boolean): () => void {
  const listener = (event: Event) => {
    (event as CustomEvent<StepLeaveDetail>).detail.waitFor.push(Promise.resolve(handler()));
  };
  window.addEventListener(STEP_LEAVE_EVENT, listener);
  return () => window.removeEventListener(STEP_LEAVE_EVENT, listener);
}

/** Demande aux outils s'ils sont prêts à partir. Vrai si aucun ne s'y oppose. */
export async function requestStepLeave(): Promise<boolean> {
  const detail: StepLeaveDetail = { waitFor: [] };
  window.dispatchEvent(new CustomEvent<StepLeaveDetail>(STEP_LEAVE_EVENT, { detail }));
  const results = await Promise.all(detail.waitFor);
  return results.every(Boolean);
}
