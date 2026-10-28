"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { readProjectText, useProjectId } from "@/lib/project-fs";
import { AnimationsElementBar } from "@/app/(anime-flow)/animations/_components/AnimationsElementBar";
import { AnimationsElementSettings } from "@/app/(anime-flow)/animations/_components/AnimationsElementSettings";
import { AnimationsPreview } from "@/app/(anime-flow)/animations/_components/AnimationsPreview";
import { findPreset } from "@/app/(anime-flow)/animations/_lib/animation-library";
import { listPageElements, PAGE_FILE, type PageElement } from "@/app/(anime-flow)/animations/_lib/page-elements";
import { pageHtmlFixture } from "@/app/(anime-flow)/animations/_lib/page-fixture";
import {
  DEFAULT_TRIGGER_EVENT,
  findTriggerEvent,
  type TriggerEventId,
} from "@/app/(anime-flow)/animations/_lib/trigger-events";

/** Animation posée sur un élément : laquelle, et ce qui la déclenche. */
type ElementAnimation = { animation: string; event: TriggerEventId };

type ProjectLoad = { status: "ok"; html: string } | { status: "missing" } | { status: "fs-error"; message: string };

async function loadProjectPage(projectId: number): Promise<ProjectLoad> {
  try {
    const html = await readProjectText(projectId, PAGE_FILE);
    return html === null ? { status: "missing" } : { status: "ok", html };
  } catch (e) {
    return { status: "fs-error", message: e instanceof Error ? e.message : String(e) };
  }
}

/** Pour les annonces : « Animation Rebond, au clic. » */
function describeAnimation(animation: ElementAnimation | undefined): string {
  const preset = animation ? findPreset(animation.animation) : null;
  if (!animation || !preset) return "Aucune animation.";
  return `Animation ${preset.name}, ${findTriggerEvent(animation.event).phrase}.`;
}

const noSubscribe = () => () => {};

/** false au rendu serveur, true dans le navigateur (sans écart d'hydratation). */
function useIsBrowser(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

export function AnimationsApp() {
  const projectId = useProjectId();
  const isBrowser = useIsBrowser();
  const [projectLoad, setProjectLoad] = useState<ProjectLoad | null>(null);
  const [selected, setSelected] = useState<PageElement | null>(null);
  /** Animations posées, par id d'élément. Un élément sans animation n'a pas d'entrée. */
  const [animationByElement, setAnimationByElement] = useState<Record<string, ElementAnimation>>({});
  const [announcement, setAnnouncement] = useState("");

  // Chargement initial de la page du projet (si l'accès est déjà accordé).
  useEffect(() => {
    if (projectId === null) return;
    let cancelled = false;
    loadProjectPage(projectId).then((next) => {
      if (!cancelled) setProjectLoad(next);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Mode démo : fixture. Mode projet : page.html lu sur le disque.
  const html = projectId === null ? pageHtmlFixture : projectLoad?.status === "ok" ? projectLoad.html : null;
  // DOMParser n'existe que dans le navigateur.
  const elements = useMemo(() => (html === null || !isBrowser ? null : listPageElements(html)), [html, isBrowser]);

  // Relance depuis un clic : déclenche l'invite d'autorisation si besoin.
  async function handleReload() {
    if (projectId === null) return;
    setSelected(null);
    setProjectLoad(await loadProjectPage(projectId));
  }

  const selectedAnimation = selected ? (animationByElement[selected.id] ?? null) : null;

  function handleSelect(element: PageElement) {
    setSelected(element);
    setAnnouncement(`${element.name} sélectionné. ${describeAnimation(animationByElement[element.id])}`);
  }

  function handlePresetChange(presetId: string | null) {
    if (!selected) return;
    const next = { ...animationByElement };
    if (presetId === null) {
      delete next[selected.id];
      setAnnouncement(`Animation retirée de ${selected.name}.`);
    } else {
      // On garde le déclencheur déjà choisi quand on change seulement d'animation.
      next[selected.id] = { animation: presetId, event: selectedAnimation?.event ?? DEFAULT_TRIGGER_EVENT };
      setAnnouncement(`${describeAnimation(next[selected.id])} Ajoutée à ${selected.name}.`);
    }
    setAnimationByElement(next);
  }

  function handleEventChange(event: TriggerEventId) {
    if (!selected || !selectedAnimation) return;
    const updated = { ...selectedAnimation, event };
    setAnimationByElement({ ...animationByElement, [selected.id]: updated });
    setAnnouncement(`${describeAnimation(updated)} Sur ${selected.name}.`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-100">Animations</h1>
          <p className="text-lg text-zinc-300">Choisissez un élément de votre page pour l&apos;animer.</p>
        </div>
        <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1 text-lg font-medium text-fuchsia-200">
          {projectId === null ? "Mode démo" : `Projet #${projectId}`}
        </span>
      </header>

      {/* Annonce les actions aux lecteurs d'écran. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {projectId !== null && projectLoad && projectLoad.status !== "ok" && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-lg text-red-200">
          <p>
            {projectLoad.status === "missing"
              ? `${PAGE_FILE} introuvable dans le projet ${projectId} : passez d'abord par le Générateur.`
              : projectLoad.message}
          </p>
          <div className="mt-2 flex gap-6">
            <button type="button" onClick={handleReload} className="min-h-11 underline">
              Réessayer
            </button>
            <Link href="/" className="inline-flex min-h-11 items-center underline">
              Retour au Hub
            </Link>
          </div>
        </div>
      )}

      {html === null || elements === null ? (
        projectLoad?.status !== "missing" &&
        projectLoad?.status !== "fs-error" && <p className="text-lg text-zinc-300">Lecture de {PAGE_FILE}…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(18rem,1fr)_2fr]">
          <AnimationsElementBar elements={elements} selectedId={selected?.id ?? null} onSelect={handleSelect} />
          <div className="flex flex-col gap-6">
            {selected ? (
              <AnimationsElementSettings
                elementName={selected.name}
                presetId={selectedAnimation?.animation ?? null}
                event={selectedAnimation?.event ?? DEFAULT_TRIGGER_EVENT}
                onPresetChange={handlePresetChange}
                onEventChange={handleEventChange}
              />
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/3 p-5 text-lg text-zinc-300">
                Sélectionnez un élément dans la liste pour lui choisir une animation.
              </p>
            )}
            <AnimationsPreview html={html} selectedId={selected?.id ?? null} />
          </div>
        </div>
      )}
    </div>
  );
}
