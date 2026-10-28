"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationPreset } from "@/app/(anime-flow)/animations/_lib/animation-library";
import { pageWidth } from "@/app/(anime-flow)/animations/_lib/page-source";
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
  /** Clic hors de tout élément animable. */
  onMissedClick: () => void;
  /** Échap dans l'aperçu : désélection. */
  onEscape: () => void;
  play?: PreviewPlay | null;
};

/**
 * Aperçu de la page dans une iframe isolée, utilisable comme un inspecteur :
 * survol = élément entouré et nommé, clic = sélection.
 * Une page de largeur fixe (celles du Générateur) est réduite pour tenir dans la largeur disponible.
 */
export function AnimationsPreview({
  html,
  selectedId,
  hoveredId,
  elementNames,
  onHoverId,
  onSelectId,
  onMissedClick,
  onEscape,
  play = null,
}: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const inspector = useRef<Inspector | null>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  const [boxSize, setBoxSize] = useState<{ width: number; height: number } | null>(null);
  // Les écouteurs de l'iframe sont posés une fois au chargement : ils lisent les props à jour ici.
  const latest = useRef({ elementNames, onHover: onHoverId, onSelect: onSelectId, onMissedClick, onEscape });
  useEffect(() => {
    latest.current = { elementNames, onHover: onHoverId, onSelect: onSelectId, onMissedClick, onEscape };
  });

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setBoxSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const width = pageWidth(html);
  const scale = width && boxSize ? Math.min(1, boxSize.width / width) : 1;

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
    <section aria-labelledby="animations-preview-title" className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 id="animations-preview-title" className="text-xl font-semibold">
          Aperçu
        </h2>
        {width && scale < 1 && (
          <p className="text-lg text-(--ink-muted)">
            Page de {width} px, affichée à {Math.round(scale * 100)} %.
          </p>
        )}
      </div>
      <p id="animations-preview-help" className="text-lg text-(--ink-muted)">
        Survolez un élément pour voir son nom, cliquez pour le sélectionner, Échap pour désélectionner. Au clavier,
        utilisez la liste « Éléments de la page ». Glissez-déposez page.html et page.css ici pour changer de page.
      </p>
      {/* Fond blanc : c'est la page de l'utilisateur, pas l'interface de l'outil. */}
      {/* Pleine hauteur en 3 colonnes ; empilé (petit écran), une hauteur fixe. */}
      <div
        ref={box}
        className="relative h-[70vh] w-full overflow-hidden rounded-xl border border-(--line) bg-white lg:h-auto lg:min-h-0 lg:flex-1"
      >
        {/* Sans allow-scripts : les scripts de la page ne tournent pas, mais on garde l'accès au DOM. */}
        <iframe
          ref={frame}
          title="Aperçu de votre page, cliquez sur un élément pour le sélectionner"
          aria-describedby="animations-preview-help"
          srcDoc={html}
          sandbox="allow-same-origin"
          onLoad={handleLoad}
          className="absolute top-0 left-0 h-full w-full"
          // Réduction : l'iframe garde la largeur réelle de la page, puis est mise à l'échelle.
          style={
            width && boxSize && scale < 1
              ? { width, height: boxSize.height / scale, transform: `scale(${scale})`, transformOrigin: "0 0" }
              : undefined
          }
        />
      </div>
    </section>
  );
}
