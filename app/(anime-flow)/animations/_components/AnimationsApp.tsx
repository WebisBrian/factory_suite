"use client";

import "@/app/(anime-flow)/animations/_brand/anime-flow-theme.css";
import animflowMark from "@/app/(anime-flow)/animations/_brand/logos/animflow-mark.svg";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { readProjectText, useProjectId } from "@/lib/project-fs";
import {
  AnimationsElementBar,
  elementButtonId,
} from "@/app/(anime-flow)/animations/_components/AnimationsElementBar";
import { AnimationsElementSettings } from "@/app/(anime-flow)/animations/_components/AnimationsElementSettings";
import { AnimationsExport } from "@/app/(anime-flow)/animations/_components/AnimationsExport";
import { AnimationsCustomEditor } from "@/app/(anime-flow)/animations/_components/AnimationsCustomEditor";
import { AnimationsPageSource } from "@/app/(anime-flow)/animations/_components/AnimationsPageSource";
import { AnimationsPreview, type PreviewPlay } from "@/app/(anime-flow)/animations/_components/AnimationsPreview";
import {
  buildConfig,
  CONFIG_FILE,
  parseConfig,
  type ElementAnimation,
  type RestoredConfig,
} from "@/app/(anime-flow)/animations/_lib/animation-config";
import { ANIMATION_PRESETS, findPreset, type AnimationPreset } from "@/app/(anime-flow)/animations/_lib/animation-library";
import { flattenElements, listPageElements, type PageElement } from "@/app/(anime-flow)/animations/_lib/page-elements";
import { pageHtmlFixture } from "@/app/(anime-flow)/animations/_lib/page-fixture";
import {
  inlineStylesheet,
  missingStylesheets,
  PAGE_FILE,
  STYLE_FILE,
} from "@/app/(anime-flow)/animations/_lib/page-source";
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

type ImportedPage = { fileName: string; html: string };

async function loadProjectPage(projectId: number): Promise<ProjectLoad> {
  try {
    const html = await readProjectText(projectId, PAGE_FILE);
    if (html === null) return { status: "missing" };
    // Sans page.css, la page s'affiche quand même, sans ses styles.
    const css = await readProjectText(projectId, STYLE_FILE);
    const configText = await readProjectText(projectId, CONFIG_FILE);
    const restored = configText === null ? null : parseConfig(configText);
    return {
      status: "ok",
      html: css === null ? html : inlineStylesheet(html, css),
      restored,
      invalidConfig: configText !== null && restored === null,
    };
  } catch (e) {
    return { status: "fs-error", message: e instanceof Error ? e.message : String(e) };
  }
}

/** Lit la page HTML et sa feuille de style parmi les fichiers importés. */
async function readImportedPage(files: File[]): Promise<ImportedPage | null> {
  const htmlFile = files.find((file) => /\.html?$/i.test(file.name));
  if (!htmlFile) return null;
  const cssFile = files.find((file) => /\.css$/i.test(file.name));
  const html = await htmlFile.text();
  return {
    fileName: htmlFile.name,
    html: cssFile ? inlineStylesheet(html, await cssFile.text(), cssFile.name) : html,
  };
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
  const [imported, setImported] = useState<ImportedPage | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PageElement | null>(null);
  /** Animations posées, par id d'élément. Un élément sans animation n'a pas d'entrée. */
  const [animationByElement, setAnimationByElement] = useState<Record<string, ElementAnimation>>({});
  const [customAnimations, setCustomAnimations] = useState<AnimationPreset[]>([]);
  const [previewPlay, setPreviewPlay] = useState<PreviewPlay | null>(null);
  /** Élément survolé, dans la liste ou dans l'aperçu : entouré des deux côtés. */
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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

  // Priorité : page importée à la main, puis fixture en mode démo, puis page du projet.
  let html: string | null = null;
  let sourceLabel: string | null = null;
  if (imported) {
    html = imported.html;
    sourceLabel = `Page importée : ${imported.fileName}.`;
  } else if (projectId === null) {
    html = pageHtmlFixture;
    sourceLabel = "Page de démo.";
  } else if (projectLoad?.status === "ok") {
    html = projectLoad.html;
    sourceLabel = `${PAGE_FILE} du projet #${projectId}.`;
  }
  // DOMParser n'existe que dans le navigateur.
  const elements = useMemo(() => (html === null || !isBrowser ? null : listPageElements(html)), [html, isBrowser]);
  const elementById = useMemo(() => new Map(flattenElements(elements ?? []).map((e) => [e.id, e])), [elements]);
  const elementNames = useMemo(() => new Map([...elementById].map(([id, e]) => [id, e.name])), [elementById]);

  function changePage(announce: string) {
    // L'élément sélectionné n'existe peut-être pas dans la nouvelle page.
    setSelected(null);
    setHoveredId(null);
    setImportError(null);
    setAnnouncement(announce);
  }

  // Relance depuis un clic : déclenche l'invite d'autorisation si besoin.
  async function handleReload() {
    if (projectId === null) return;
    setImported(null);
    changePage(`Chargement de ${PAGE_FILE} du projet.`);
    applyLoad(await loadProjectPage(projectId));
  }

  async function handleFiles(files: File[]) {
    const page = await readImportedPage(files);
    if (!page) {
      setImportError("Choisissez un fichier HTML (.html), avec son fichier CSS si la page en a un.");
      return;
    }
    setImported(page);
    changePage(`Page ${page.fileName} importée.`);
  }

  function handleCancelImport() {
    setImported(null);
    changePage("Import annulé.");
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
    if (!element) return;
    handleSelect(element);
    // La liste se cale sur l'élément choisi, sans défilement animé.
    document.getElementById(elementButtonId(id))?.scrollIntoView({ block: "nearest" });
  }

  function handleMissedClick() {
    setAnnouncement("Cet endroit n'est pas animable : cliquez sur un élément entouré.");
  }

  function handleDeselect() {
    if (!selected) return;
    setSelected(null);
    setAnnouncement(`Sélection retirée de ${selected.name}.`);
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
        <div className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            {/* Logo décoratif : le titre « Animations » juste à côté nomme déjà l'outil. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- next/image est exclu par l'export statique. */}
            <img src={animflowMark.src} alt="" width={48} height={48} className="size-12 shrink-0" />

            <div>
              <h1 className="text-3xl font-semibold">Animations</h1>
              <p className="text-lg text-(--ink-muted)">Importez votre page, puis choisissez les éléments à animer.</p>
            </div>
          </div>
          <span className="rounded-full border border-(--motion) bg-(--motion-soft) px-4 py-1 text-lg font-medium">
            {projectId === null ? "Mode démo" : `Projet #${projectId}`}
          </span>
        </div>
      </header>

      {/* Pleine largeur : la page à animer doit s'afficher en grand. */}
      <div className="flex w-full flex-col gap-6 px-6 py-8">
        {/* Annonce les actions aux lecteurs d'écran. */}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <AnimationsPageSource
          sourceLabel={sourceLabel}
          missingStylesheets={html === null ? [] : missingStylesheets(html)}
          importError={importError}
          canReloadProject={projectId !== null}
          canCancelImport={imported !== null}
          onFiles={handleFiles}
          onReloadProject={handleReload}
          onCancelImport={handleCancelImport}
        />

        {!imported && projectId !== null && projectLoad && projectLoad.status !== "ok" && (
          <div
            role="alert"
            className="rounded-xl border-2 border-(--danger) bg-(--danger-soft) p-4 text-lg text-(--danger)"
          >
            <p>
              {projectLoad.status === "missing"
                ? `${PAGE_FILE} introuvable dans le projet ${projectId} : passez d'abord par le Générateur, ou importez une page.`
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
          <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
            <AnimationsElementBar
              elements={elements}
              selectedId={selected?.id ?? null}
              hoveredId={hoveredId}
              onSelect={handleSelect}
              onHover={setHoveredId}
            />
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
                hoveredId={hoveredId}
                elementNames={elementNames}
                onHoverId={setHoveredId}
                onSelectId={handleSelectId}
                onMissedClick={handleMissedClick}
                onEscape={handleDeselect}
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
