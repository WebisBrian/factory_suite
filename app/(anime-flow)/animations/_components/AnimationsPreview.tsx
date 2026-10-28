"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationPreset } from "@/app/(anime-flow)/animations/_lib/animation-library";
import { createInspector, type Inspector } from "@/app/(anime-flow)/animations/_lib/preview-inspector";

/** Animation à jouer sur l'élément sélectionné. `nonce` change à chaque demande, pour rejouer la même. */
export type PreviewPlay = { preset: AnimationPreset; nonce: number };

type Props = {
  html: string;
  selectedId: string | null;
  /** Élément survolé, dans l'aperçu ou dans la liste. */
  hoveredId: string | null;
  /** Nom lisible de chaque élément animable, par id : seuls ceux-là sont sélectionnables. */
  elementNames: ReadonlyMap<string, string>;
  onHoverId: (id: string | null) => void;
  /** Clic sur un élément de l'aperçu. */
  onSelectId: (id: string) => void;
  play?: PreviewPlay | null;
};

/**
 * Aperçu de la page dans une iframe isolée, utilisable comme un inspecteur :
 * survol = élément entouré et nommé, clic = sélection.
 */
export function AnimationsPreview({
  html,
  selectedId,
  hoveredId,
  elementNames,
  onHoverId,
  onSelectId,
  play = null,
}: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const inspector = useRef<Inspector | null>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  // Les écouteurs de l'iframe sont posés une fois au chargement : ils lisent les props à jour ici.
  const latest = useRef({ elementNames, onHover: onHoverId, onSelect: onSelectId });
  useEffect(() => {
    latest.current = { elementNames, onHover: onHoverId, onSelect: onSelectId };
  });

  function handleLoad() {
    inspector.current?.destroy();
    const loaded = frame.current?.contentDocument ?? null;
    inspector.current = loaded ? createInspector(loaded, () => latest.current) : null;
    setDoc(loaded);
  }

  useEffect(() => () => inspector.current?.destroy(), []);

  useEffect(() => {
    inspector.current?.select(selectedId);
  }, [doc, selectedId]);

  useEffect(() => {
    inspector.current?.highlight(hoveredId);
  }, [doc, hoveredId]);

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
      <p id="animations-preview-help" className="text-lg text-(--ink-muted)">
        Survolez un élément pour voir son nom, cliquez pour le sélectionner. Au clavier, parcourez la liste « Éléments
        de la page » : l&apos;élément est entouré dans l&apos;aperçu.
      </p>
      {/* Sans allow-scripts : les scripts de la page ne tournent pas, mais on garde l'accès au DOM. */}
      <iframe
        ref={frame}
        title="Aperçu de votre page, cliquez sur un élément pour le sélectionner"
        aria-describedby="animations-preview-help"
        srcDoc={html}
        sandbox="allow-same-origin"
        onLoad={handleLoad}
        className="h-[70vh] w-full rounded-2xl border border-(--line) bg-white"
      />
    </section>
  );
}
