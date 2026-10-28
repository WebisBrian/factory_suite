"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationPreset } from "@/app/(anime-flow)/animations/_lib/animation-library";

const SELECTED_ATTR = "data-anime-flow-selected";
// Les variables de la charte n'existent pas dans l'iframe : couleurs en dur (voir _brand/BRAND.md,
// « Élément sélectionné »). Double contour blanc + violet, visible sur une page claire comme sombre.
const SELECTED_CSS = `[${SELECTED_ATTR}] {
  outline: 3px solid #ffffff !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 9px #6d28d9 !important;
}`;

/** Animation à jouer sur l'élément sélectionné. `nonce` change à chaque demande, pour rejouer la même. */
export type PreviewPlay = { preset: AnimationPreset; nonce: number };

type Props = {
  html: string;
  selectedId: string | null;
  play?: PreviewPlay | null;
};

/** Aperçu de la page dans une iframe isolée, avec l'élément sélectionné entouré. */
export function AnimationsPreview({ html, selectedId, play = null }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState<Document | null>(null);

  function handleLoad() {
    const loaded = frame.current?.contentDocument ?? null;
    if (loaded) {
      const style = loaded.createElement("style");
      style.textContent = SELECTED_CSS;
      loaded.head.append(style);
    }
    setDoc(loaded);
  }

  useEffect(() => {
    if (!doc) return;
    doc.querySelector(`[${SELECTED_ATTR}]`)?.removeAttribute(SELECTED_ATTR);
    const element = selectedId ? doc.getElementById(selectedId) : null;
    if (!element) return;
    element.setAttribute(SELECTED_ATTR, "");
    // Défilement instantané : pas d'animation imposée à l'utilisateur.
    element.scrollIntoView({ block: "nearest" });
  }, [doc, selectedId]);

  // Joué une fois par demande (bouton « Tester ») ; l'appelant vérifie « réduire les animations ».
  useEffect(() => {
    if (!doc || !play || !selectedId) return;
    doc.getElementById(selectedId)?.animate(play.preset.keyframes, {
      duration: play.preset.duration,
      easing: play.preset.easing,
      iterations: 1,
    });
    // selectedId volontairement absent : changer de sélection ne rejoue pas l'animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, play]);

  return (
    <section aria-labelledby="animations-preview-title" className="flex flex-col gap-3">
      <h2 id="animations-preview-title" className="text-xl font-semibold">
        Aperçu
      </h2>
      {/* Sans allow-scripts : les scripts de la page ne tournent pas, mais on garde l'accès au DOM. */}
      <iframe
        ref={frame}
        title="Aperçu de votre page"
        srcDoc={html}
        sandbox="allow-same-origin"
        onLoad={handleLoad}
        className="h-[70vh] w-full rounded-2xl border border-(--line) bg-white"
      />
    </section>
  );
}
