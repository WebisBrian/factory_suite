"use client";

import { useEffect, useRef, useState } from "react";

const SELECTED_ATTR = "data-anime-flow-selected";
const SELECTED_CSS = `[${SELECTED_ATTR}] { outline: 4px solid #d946ef !important; outline-offset: 4px !important; }`;

type Props = {
  html: string;
  selectedId: string | null;
};

/** Aperçu de la page dans une iframe isolée, avec l'élément sélectionné entouré. */
export function AnimationsPreview({ html, selectedId }: Props) {
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

  return (
    <section aria-labelledby="animations-preview-title" className="flex flex-col gap-3">
      <h2 id="animations-preview-title" className="text-xl font-semibold text-zinc-100">
        Aperçu
      </h2>
      {/* Sans allow-scripts : les scripts de la page ne tournent pas, mais on garde l'accès au DOM. */}
      <iframe
        ref={frame}
        title="Aperçu de votre page"
        srcDoc={html}
        sandbox="allow-same-origin"
        onLoad={handleLoad}
        className="h-[70vh] w-full rounded-2xl border border-white/10 bg-white"
      />
    </section>
  );
}
