"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationPreset } from "@/app/(anime-flow)/animations/_lib/animation-library";

const SELECTED_ATTR = "data-anime-flow-selected";
const HOVER_ATTR = "data-anime-flow-hover";
const LABEL_ID = "anime-flow-inspector-label";
// Les variables de la charte n'existent pas dans l'iframe : couleurs en dur (voir _brand/BRAND.md,
// « Élément sélectionné » et « Élément survolé »). Double contour blanc + violet pour la sélection,
// visible sur une page claire comme sombre ; pointillés violets + étiquette spark pour le survol.
const INSPECTOR_CSS = `[${SELECTED_ATTR}] {
  outline: 3px solid #ffffff !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 9px #6d28d9 !important;
}
[${HOVER_ATTR}]:not([${SELECTED_ATTR}]) {
  outline: 3px dashed #6d28d9 !important;
  outline-offset: 2px !important;
}
body { cursor: crosshair; }
#${LABEL_ID} {
  position: fixed;
  z-index: 2147483647;
  pointer-events: none;
  max-width: calc(100vw - 16px);
  padding: 4px 10px;
  border-radius: 8px;
  background: #e879f9;
  color: #1a1033;
  font: 600 1.125rem/1.3 "Atkinson Hyperlegible", system-ui, sans-serif;
}`;

/** Animation à jouer sur l'élément sélectionné. `nonce` change à chaque demande, pour rejouer la même. */
export type PreviewPlay = { preset: AnimationPreset; nonce: number };

type Props = {
  html: string;
  selectedId: string | null;
  /** Nom lisible de chaque élément animable, par id : seuls ceux-là sont sélectionnables. */
  elementNames: ReadonlyMap<string, string>;
  /** Clic sur un élément de l'aperçu. */
  onSelectId: (id: string) => void;
  play?: PreviewPlay | null;
};

/**
 * Aperçu de la page dans une iframe isolée, utilisable comme un inspecteur :
 * survol = contour + nom de l'élément, clic = sélection.
 */
export function AnimationsPreview({ html, selectedId, elementNames, onSelectId, play = null }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  // Les écouteurs de l'iframe sont posés une fois au chargement : ils lisent les props à jour ici.
  const latest = useRef({ elementNames, onSelectId });
  useEffect(() => {
    latest.current = { elementNames, onSelectId };
  });

  function handleLoad() {
    const loaded = frame.current?.contentDocument ?? null;
    if (loaded) {
      const style = loaded.createElement("style");
      style.textContent = INSPECTOR_CSS;
      loaded.head.append(style);
      attachInspector(loaded, () => latest.current);
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
      <p id="animations-preview-help" className="text-lg text-(--ink-muted)">
        Cliquez sur un élément de l&apos;aperçu pour le sélectionner. Au clavier, utilisez la liste « Éléments de la
        page ».
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

type InspectorProps = Pick<Props, "elementNames" | "onSelectId">;

/** Survol et clic dans l'iframe, comme l'inspecteur du navigateur. */
function attachInspector(doc: Document, getProps: () => InspectorProps) {
  const label = doc.createElement("div");
  label.id = LABEL_ID;
  label.hidden = true;
  label.setAttribute("aria-hidden", "true");
  doc.body.append(label);

  /** L'élément animable le plus proche : la cible elle-même, ou son plus proche ancêtre listé. */
  function animatableFrom(target: EventTarget | null): Element | null {
    // instanceof avec l'Element de l'iframe : celui de la page parente ne reconnaît pas ses nœuds.
    const FrameElement = doc.defaultView?.Element;
    let node = FrameElement && target instanceof FrameElement ? target : null;
    const { elementNames } = getProps();
    while (node && !(node.id && elementNames.has(node.id))) node = node.parentElement;
    return node;
  }

  function clearHover() {
    doc.querySelector(`[${HOVER_ATTR}]`)?.removeAttribute(HOVER_ATTR);
    label.hidden = true;
  }

  doc.addEventListener("mouseover", (event) => {
    const element = animatableFrom(event.target);
    clearHover();
    if (!element) return;
    element.setAttribute(HOVER_ATTR, "");
    label.textContent = getProps().elementNames.get(element.id) ?? "";
    label.hidden = false;
    // Au-dessus de l'élément, ou dessous s'il touche le haut de l'aperçu.
    const rect = element.getBoundingClientRect();
    const top = rect.top - label.offsetHeight - 6;
    label.style.top = `${top >= 0 ? top : rect.bottom + 6}px`;
    label.style.left = `${Math.max(8, rect.left)}px`;
  });
  doc.documentElement.addEventListener("mouseleave", clearHover);
  doc.addEventListener("scroll", clearHover, { passive: true });

  doc.addEventListener("click", (event) => {
    // Pas de navigation ni d'envoi de formulaire dans l'aperçu.
    event.preventDefault();
    const element = animatableFrom(event.target);
    if (element) getProps().onSelectId(element.id);
  });
}
