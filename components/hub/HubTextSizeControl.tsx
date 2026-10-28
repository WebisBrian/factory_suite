"use client";

import { useSyncExternalStore } from "react";
import {
  HUB_TEXT_SCALES,
  readHubTextScale,
  setHubTextScale,
  subscribeHubTextScale,
} from "@/components/hub/hub-text-scale";

const controlButton =
  "flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-zinc-400 px-2 font-bold text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-400 group-data-light/nav:border-zinc-500 group-data-light/nav:text-[#2e2e2e] group-data-light/nav:hover:bg-black/5 group-data-light/nav:disabled:border-zinc-300 group-data-light/nav:disabled:text-zinc-500";

/** Boutons A− / A+ : agrandit tout le texte de l'app (100 % à 200 %), mémorisé dans le navigateur. */
export function HubTextSizeControl() {
  const scale = useSyncExternalStore(subscribeHubTextScale, readHubTextScale, () => 1);
  const index = HUB_TEXT_SCALES.findIndex((step) => step === scale);
  const percent = `${Math.round(scale * 100)} %`;

  return (
    <div role="group" aria-label="Taille du texte" className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setHubTextScale(HUB_TEXT_SCALES[index - 1])}
        disabled={index <= 0}
        aria-label="Réduire la taille du texte"
        title="Réduire la taille du texte"
        className={controlButton}
      >
        A−
      </button>
      <button
        type="button"
        onClick={() => setHubTextScale(1)}
        aria-label={`Taille du texte : ${percent}. Activer pour revenir à 100 %`}
        title="Revenir à la taille normale"
        className="min-h-10 min-w-16 rounded-lg px-2 text-base text-zinc-200 hover:bg-white/10 group-data-light/nav:text-[#454545] group-data-light/nav:hover:bg-black/5"
      >
        <span aria-live="polite">{percent}</span>
      </button>
      <button
        type="button"
        onClick={() => setHubTextScale(HUB_TEXT_SCALES[index + 1])}
        disabled={index >= HUB_TEXT_SCALES.length - 1}
        aria-label="Agrandir la taille du texte"
        title="Agrandir la taille du texte"
        className={`${controlButton} text-lg`}
      >
        A+
      </button>
    </div>
  );
}
