"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  generatorCanvas,
  generatorSecondaryButton,
  generatorToggleButton,
} from "@/app/codeforge/generator/_lib/generator-styles";

type Zoom = "fit" | number;

const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/** Iframe à la taille réelle de la maquette, avec zoom (ajusté à la largeur ou par paliers). */
export function GeneratorPreview({
  html,
  name,
  width,
  height,
  leading,
}: {
  html: string;
  name: string;
  width: number;
  height: number;
  /** Contrôles placés avant le zoom (ex. choix de l'écran). */
  leading?: ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);
  const [zoom, setZoom] = useState<Zoom>("fit");

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setAvailableWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fitScale = availableWidth === null ? 1 : Math.min(1, availableWidth / width);
  const scale = zoom === "fit" ? fitScale : zoom;
  const percent = Math.round(scale * 100);

  function step(direction: 1 | -1) {
    const next =
      direction === 1
        ? ZOOM_STEPS.find((s) => s > scale + 0.001)
        : [...ZOOM_STEPS].reverse().find((s) => s < scale - 0.001);
    if (next !== undefined) setZoom(next);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-black/15 px-4 py-3">
        {leading}
        <div role="group" aria-label="Zoom de l'aperçu" className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={scale <= ZOOM_STEPS[0] + 0.001}
            className={generatorSecondaryButton}
          >
            {/* Nom accessible = texte visible (WCAG 2.5.3) : utilisable aussi à la commande vocale. */}
            <span aria-hidden>−&nbsp;</span>Zoom arrière
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={scale >= ZOOM_STEPS[ZOOM_STEPS.length - 1] - 0.001}
            className={generatorSecondaryButton}
          >
            <span aria-hidden>+&nbsp;</span>Zoom avant
          </button>
          <button
            type="button"
            onClick={() => setZoom("fit")}
            aria-pressed={zoom === "fit"}
            className={generatorToggleButton}
          >
            Ajuster à la largeur
          </button>
          <button type="button" onClick={() => setZoom(1)} aria-pressed={zoom === 1} className={generatorToggleButton}>
            Taille réelle (100 %)
          </button>
        </div>
        <p role="status" className="font-mono text-sm text-[#2e2e2e] sm:ml-auto">
          {percent} % · {width} × {height} px
        </p>
      </div>

      {/* Zone défilable focusable : permet de parcourir une page zoomée au clavier. */}
      <div
        ref={container}
        role="region"
        aria-label="Aperçu de la page générée, zone défilable"
        tabIndex={0}
        className={`max-h-[80vh] overflow-auto p-4 ${generatorCanvas}`}
      >
        <div className="mx-auto" style={{ width: width * scale, height: height * scale }}>
          <iframe
            title={`Aperçu de la page générée « ${name} », ${width} par ${height} pixels`}
            srcDoc={html}
            // allow-same-origin : l'aperçu envoie le Referer de l'application, exigé par OpenStreetMap pour ses tuiles
            // (sans lui : erreur 403). Aucun script n'est autorisé, la page générée reste inerte.
            sandbox="allow-same-origin"
            width={width}
            height={height}
            className="origin-top-left rounded-sm border-0 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_14px_32px_rgba(0,0,0,0.1)]"
            style={{ transform: `scale(${scale})` }}
          />
        </div>
      </div>
    </div>
  );
}
