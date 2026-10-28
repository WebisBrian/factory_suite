"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { findPreset, playAnimation } from "@/app/(anime-flow)/animations/_lib/animation-library";
import type { ElementAnimation } from "@/app/(anime-flow)/animations/_lib/element-animation";
import { pageWidth } from "@/app/(anime-flow)/animations/_lib/page-source";

export type AnimationsPreviewHandle = {
  /** Joue l'animation sur l'élément dans l'aperçu. Renvoie false si l'élément est introuvable. */
  play: (elementId: string, animation: ElementAnimation) => boolean;
};

const SELECTED_ATTR = "data-anime-flow-selected";
// Les variables de la charte n'existent pas dans l'iframe : couleurs en dur (voir _brand/BRAND.md,
// « Élément sélectionné »). Double contour blanc + violet, visible sur une page claire comme sombre.
const SELECTED_CSS = `[${SELECTED_ATTR}] {
  outline: 3px solid #ffffff !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 9px #6d28d9 !important;
}`;

type Props = {
  html: string;
  selectedId: string | null;
  ref?: Ref<AnimationsPreviewHandle>;
};

/**
 * Aperçu de la page dans une iframe isolée, avec l'élément sélectionné entouré.
 * Une page de largeur fixe (celles du Générateur) est réduite pour tenir dans la largeur disponible.
 */
export function AnimationsPreview({ html, selectedId, ref }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  const [boxSize, setBoxSize] = useState<{ width: number; height: number } | null>(null);

  // Lecture sur demande explicite de l'utilisateur : jouée même si son système réduit les animations.
  useImperativeHandle(
    ref,
    () => ({
      play(elementId, animation) {
        const element = doc?.getElementById(elementId);
        const preset = findPreset(animation.animation);
        if (!element || !preset) return false;
        element.scrollIntoView({ block: "nearest" });
        playAnimation(element, preset, animation.duration, animation.delay);
        return true;
      },
    }),
    [doc],
  );

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

  return (
    <section aria-labelledby="animations-preview-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="animations-preview-title" className="text-lg font-semibold">
          Aperçu
        </h2>
        {width && scale < 1 && (
          <p className="text-sm text-(--ink-muted)">
            Page de {width} px, affichée à {Math.round(scale * 100)} % pour tenir dans l&apos;écran.
          </p>
        )}
      </div>
      {/* Fond blanc : c'est la page de l'utilisateur, pas l'interface de l'outil. */}
      <div ref={box} className="relative h-[75vh] w-full overflow-hidden rounded-2xl border border-(--line) bg-white">
        {/* Sans allow-scripts : les scripts de la page ne tournent pas, mais on garde l'accès au DOM. */}
        <iframe
          ref={frame}
          title="Aperçu de votre page"
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
