"use client";

import { useEffect, useRef, useState } from "react";

type Zoom = "fit" | number;

const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const;

const BUTTON_CLASS =
  "min-h-10 rounded-full border border-zinc-500 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10 disabled:opacity-60 aria-pressed:border-emerald-300 aria-pressed:bg-emerald-300 aria-pressed:text-black";

/** Iframe à la taille réelle de la maquette, avec zoom (ajusté à la largeur ou par paliers). */
export function GeneratorPreview({ html, name, width, height }: { html: string; name: string; width: number; height: number }) {
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
      direction === 1 ? ZOOM_STEPS.find((s) => s > scale + 0.001) : [...ZOOM_STEPS].reverse().find((s) => s < scale - 0.001);
    if (next !== undefined) setZoom(next);
  }

  return (
    <div className="mt-4">
      <div role="group" aria-label="Zoom de l'aperçu" className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => step(-1)} disabled={scale <= ZOOM_STEPS[0] + 0.001} aria-label="Réduire le zoom" className={BUTTON_CLASS}>
          − Zoom
        </button>
        <button type="button" onClick={() => step(1)} disabled={scale >= ZOOM_STEPS[ZOOM_STEPS.length - 1] - 0.001} aria-label="Augmenter le zoom" className={BUTTON_CLASS}>
          + Zoom
        </button>
        <button type="button" onClick={() => setZoom("fit")} aria-pressed={zoom === "fit"} className={BUTTON_CLASS}>
          Ajuster à la largeur
        </button>
        <button type="button" onClick={() => setZoom(1)} aria-pressed={zoom === 1} className={BUTTON_CLASS}>
          Taille réelle (100 %)
        </button>
        <p role="status" className="text-sm text-zinc-200">
          Zoom : {percent} % · Page de {width} × {height} px
        </p>
      </div>

      {/* Zone défilable focusable : permet de parcourir une page zoomée au clavier. */}
      <div
        ref={container}
        role="region"
        aria-label="Aperçu de la page générée, zone défilable"
        tabIndex={0}
        className="mt-3 max-h-[80vh] overflow-auto rounded-xl ring-1 ring-zinc-500"
      >
        <div style={{ width: width * scale, height: height * scale }}>
          <iframe
            title={`Aperçu de la page générée « ${name} », ${width} par ${height} pixels`}
            srcDoc={html}
            sandbox=""
            width={width}
            height={height}
            className="origin-top-left border-0 bg-white"
            style={{ transform: `scale(${scale})` }}
          />
        </div>
      </div>
    </div>
  );
}
