"use client";

import "@/app/(anime-flow)/animations/_brand/anime-flow-theme.css";
import animflowMark from "@/app/(anime-flow)/animations/_brand/logos/animflow-mark.svg";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { readProjectText, useProjectId } from "@/lib/project-fs";
import { AnimationsElementBar } from "@/app/(anime-flow)/animations/_components/AnimationsElementBar";
import { AnimationsElementSettings } from "@/app/(anime-flow)/animations/_components/AnimationsElementSettings";
import { AnimationsExport } from "@/app/(anime-flow)/animations/_components/AnimationsExport";
import { AnimationsCustomEditor } from "@/app/(anime-flow)/animations/_components/AnimationsCustomEditor";
import { AnimationsPreview, type PreviewPlay } from "@/app/(anime-flow)/animations/_components/AnimationsPreview";
import {
  buildConfig,
  CONFIG_FILE,
  parseConfig,
  type ElementAnimation,
  type RestoredConfig,
} from "@/app/(anime-flow)/animations/_lib/animation-config";
import { ANIMATION_PRESETS, findPreset, type AnimationPreset } from "@/app/(anime-flow)/animations/_lib/animation-library";
import { flattenElements, listPageElements, PAGE_FILE, type PageElement } from "@/app/(anime-flow)/animations/_lib/page-elements";
import { pageHtmlFixture } from "@/app/(anime-flow)/animations/_lib/page-fixture";
import {
  DEFAULT_TRIGGER_EVENT,
  findTriggerEvent,
  type TriggerEventId,
} from "@/app/(anime-flow)/animations/_lib/trigger-events";

type ProjectLoad =
  | {
      status: "ok";
      html: string;
      /** Travail enregistré lors d'une session précédente (animations.json), null s'il n'y en a pas. */
      restored: RestoredConfig | null;
      /** animations.json existe mais n'a pas pu être lu. */
      invalidConfig: boolean;
    }
  | { status: "missing" }
  | { status: "fs-error"; message: string };

async function loadProjectPage(projectId: number): Promise<ProjectLoad> {
  try {
    const html = await readProjectText(projectId, PAGE_FILE);
    if (html === null) return { status: "missing" };
    const configText = await readProjectText(projectId, CONFIG_FILE);
    const restored = configText === null ? null : parseConfig(configText);
    return { status: "ok", html, restored, invalidConfig: configText !== null && restored === null };
  } catch (e) {
    return { status: "fs-error", message: e instanceof Error ? e.message : String(e) };
  }
}

/** Pour les annonces : « Animation Rebond, au clic. » */
function describeAnimation(
  animation: ElementAnimation | undefined,
  customAnimations: readonly AnimationPreset[],
): string {
  const preset = animation ? findPreset(animation.animation, customAnimations) : null;
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
  const [customAnimations, setCustomAnimations] = useState<AnimationPreset[]>([]);
  const [previewPlay, setPreviewPlay] = useState<PreviewPlay | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // Reprend aussi le travail enregistré dans animations.json.
  function applyLoad(next: ProjectLoad) {
    setProjectLoad(next);
    if (next.status === "ok" && next.restored) {
      setAnimationByElement(next.restored.animationByElement);
      setCustomAnimations(next.restored.customAnimations);
    }
  }

  // Chargement initial de la page du projet (si l'accès est déjà accordé).
  useEffect(() => {
    if (projectId === null) return;
    let cancelled = false;
    loadProjectPage(projectId).then((next) => {
      if (!cancelled) applyLoad(next);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Mode démo : fixture. Mode projet : page.html lu sur le disque.
  const html = projectId === null ? pageHtmlFixture : projectLoad?.status === "ok" ? projectLoad.html : null;
  // DOMParser n'existe que dans le navigateur.
  const elements = useMemo(() => (html === null || !isBrowser ? null : listPageElements(html)), [html, isBrowser]);
  const elementById = useMemo(() => new Map(flattenElements(elements ?? []).map((e) => [e.id, e])), [elements]);
  const elementNames = useMemo(() => new Map([...elementById].map(([id, e]) => [id, e.name])), [elementById]);

  // Relance depuis un clic : déclenche l'invite d'autorisation si besoin.
  async function handleReload() {
    if (projectId === null) return;
    setSelected(null);
    applyLoad(await loadProjectPage(projectId));
  }

  const config = useMemo(
    () => buildConfig(animationByElement, customAnimations),
    [animationByElement, customAnimations],
  );

  const selectedAnimation = selected ? (animationByElement[selected.id] ?? null) : null;

  function handleSelect(element: PageElement) {
    setSelected(element);
    setAnnouncement(`${element.name} sélectionné. ${describeAnimation(animationByElement[element.id], customAnimations)}`);
  }

  // Clic dans l'aperçu : même sélection (et même annonce) que depuis la liste.
  function handleSelectId(id: string) {
    const element = elementById.get(id);
    if (element) handleSelect(element);
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
      setAnnouncement(`${describeAnimation(next[selected.id], customAnimations)} Ajoutée à ${selected.name}.`);
    }
    setAnimationByElement(next);
  }

  function handleTest(preset: AnimationPreset): string {
    if (!selected) return "Sélectionnez d'abord un élément pour tester l'animation.";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return "Test impossible : votre système demande de réduire les animations.";
    }
    setPreviewPlay({ preset, nonce: (previewPlay?.nonce ?? 0) + 1 });
    return `${preset.name} jouée sur ${selected.name} dans l'aperçu.`;
  }

  function handleCreate(preset: AnimationPreset): string {
    setCustomAnimations([...customAnimations, preset]);
    if (!selected) return `Animation « ${preset.name} » créée : choisissez un élément pour l'appliquer.`;
    setAnimationByElement({
      ...animationByElement,
      [selected.id]: { animation: preset.id, event: selectedAnimation?.event ?? DEFAULT_TRIGGER_EVENT },
    });
    return `Animation « ${preset.name} » créée et appliquée à ${selected.name}.`;
  }

  function handleEventChange(event: TriggerEventId) {
    if (!selected || !selectedAnimation) return;
    const updated = { ...selectedAnimation, event };
    setAnimationByElement({ ...animationByElement, [selected.id]: updated });
    setAnnouncement(`${describeAnimation(updated, customAnimations)} Sur ${selected.name}.`);
  }

  return (
    <div className="anime-flow flex flex-1 flex-col">
      <header className="border-b border-(--line) bg-(--surface-raised)">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <div className="flex items-center gap-4">
            {/* Logo décoratif : le titre « Animations » juste à côté nomme déjà l'outil. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- next/image est exclu par l'export statique. */}
            <img src={animflowMark.src} alt="" width={48} height={48} className="size-12 shrink-0" />

            <div>
              <h1 className="text-3xl font-semibold">Animations</h1>
              <p className="text-lg text-(--ink-muted)">Choisissez un élément de votre page pour l&apos;animer.</p>
            </div>
          </div>
          <span className="rounded-full border border-(--motion) bg-(--motion-soft) px-4 py-1 text-lg font-medium">
            {projectId === null ? "Mode démo" : `Projet #${projectId}`}
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        {/* Annonce les actions aux lecteurs d'écran. */}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {projectId !== null && projectLoad && projectLoad.status !== "ok" && (
          <div
            role="alert"
            className="rounded-xl border-2 border-(--danger) bg-(--danger-soft) p-4 text-lg text-(--danger)"
          >
            <p>
              {projectLoad.status === "missing"
                ? `${PAGE_FILE} introuvable dans le projet ${projectId} : passez d'abord par le Générateur.`
                : projectLoad.message}
            </p>
            <div className="mt-2 flex gap-6">
              <button type="button" onClick={handleReload} className="min-h-12 underline">
                Réessayer
              </button>
              <Link href="/" className="inline-flex min-h-12 items-center underline">
                Retour au Hub
              </Link>
            </div>
          </div>
        )}

        {projectLoad?.status === "ok" && projectLoad.invalidConfig && (
          <p role="alert" className="rounded-xl border-2 border-(--danger) bg-(--danger-soft) p-4 text-lg text-(--danger)">
            Erreur : {CONFIG_FILE} est illisible. Les animations repartent de zéro ; l&apos;enregistrement remplacera
            ce fichier.
          </p>
        )}

        {html === null || elements === null ? (
          projectLoad?.status !== "missing" &&
          projectLoad?.status !== "fs-error" && <p className="text-lg text-(--ink-muted)">Lecture de {PAGE_FILE}…</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(18rem,1fr)_2fr]">
            <AnimationsElementBar elements={elements} selectedId={selected?.id ?? null} onSelect={handleSelect} />
            <div className="flex flex-col gap-6">
              {selected ? (
                <AnimationsElementSettings
                  elementName={selected.name}
                  presetId={selectedAnimation?.animation ?? null}
                  event={selectedAnimation?.event ?? DEFAULT_TRIGGER_EVENT}
                  customAnimations={customAnimations}
                  onPresetChange={handlePresetChange}
                  onEventChange={handleEventChange}
                />
              ) : (
                <p className="rounded-2xl border border-(--line) bg-(--surface-raised) p-5 text-lg text-(--ink-muted)">
                  Sélectionnez un élément dans la liste ou cliquez dessus dans l&apos;aperçu pour lui choisir une
                  animation.
                </p>
              )}
              <AnimationsCustomEditor
                selectedName={selected?.name ?? null}
                takenNames={[...ANIMATION_PRESETS, ...customAnimations].map((preset) => preset.name)}
                takenIds={[...ANIMATION_PRESETS, ...customAnimations].map((preset) => preset.id)}
                onTest={handleTest}
                onCreate={handleCreate}
              />
              <AnimationsPreview
                html={html}
                selectedId={selected?.id ?? null}
                elementNames={elementNames}
                onSelectId={handleSelectId}
                play={previewPlay}
              />
              <AnimationsExport projectId={projectId} config={config} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
