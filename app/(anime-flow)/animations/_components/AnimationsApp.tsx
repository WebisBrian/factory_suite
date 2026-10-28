"use client";

import "@/app/(anime-flow)/animations/_brand/anime-flow-theme.css";
import animflowMark from "@/app/(anime-flow)/animations/_brand/logos/animflow-mark.svg";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { readProjectText, useProjectId } from "@/lib/project-fs";
import {
  AnimationsElementBar,
  elementButtonId,
} from "@/app/(anime-flow)/animations/_components/AnimationsElementBar";
import {
  AnimationsElementSettings,
  SETTINGS_ID,
} from "@/app/(anime-flow)/animations/_components/AnimationsElementSettings";
import {
  AnimationsExportButtons,
  AnimationsIntegration,
  useAnimationsExport,
} from "@/app/(anime-flow)/animations/_components/AnimationsExport";
import { AnimationsCustomEditor } from "@/app/(anime-flow)/animations/_components/AnimationsCustomEditor";
import { AnimationsPageImport, useFileDrop } from "@/app/(anime-flow)/animations/_components/AnimationsPageImport";
import { AnimationsPanelSection } from "@/app/(anime-flow)/animations/_components/AnimationsPanelSection";
import { AnimationsPlacedList } from "@/app/(anime-flow)/animations/_components/AnimationsPlacedList";
import {
  AnimationsPreview,
  type AnimationsPreviewHandle,
} from "@/app/(anime-flow)/animations/_components/AnimationsPreview";
import {
  AnimationsSidePanel,
  type SidePanelView,
} from "@/app/(anime-flow)/animations/_components/AnimationsSidePanel";
import {
  buildConfig,
  CONFIG_FILE,
  parseConfig,
  type RestoredConfig,
} from "@/app/(anime-flow)/animations/_lib/animation-config";
import {
  ANIMATION_PRESETS,
  describeEffect,
  describePreset,
  findPreset,
  type AnimationPreset,
} from "@/app/(anime-flow)/animations/_lib/animation-library";
import { withPreset, type ElementAnimation } from "@/app/(anime-flow)/animations/_lib/element-animation";
import { ERROR_BOX, SECONDARY_BUTTON } from "@/app/(anime-flow)/animations/_lib/field-styles";
import { flattenElements, listPageElements, type PageElement } from "@/app/(anime-flow)/animations/_lib/page-elements";
import { pageHtmlFixture } from "@/app/(anime-flow)/animations/_lib/page-fixture";
import {
  inlineStylesheet,
  missingStylesheets,
  PAGE_FILE,
  STYLE_FILE,
} from "@/app/(anime-flow)/animations/_lib/page-source";
import { findTriggerEvent, type TriggerEventId } from "@/app/(anime-flow)/animations/_lib/trigger-events";

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
  const preview = useRef<AnimationsPreviewHandle>(null);
  /** Élément survolé, dans la liste ou dans l'aperçu : entouré des deux côtés. */
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [panelView, setPanelView] = useState<SidePanelView>("settings");

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
    sourceLabel = imported.fileName;
  } else if (projectId === null) {
    html = pageHtmlFixture;
    sourceLabel = "page de démo";
  } else if (projectLoad?.status === "ok") {
    html = projectLoad.html;
    sourceLabel = PAGE_FILE;
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
      next[selected.id] = withPreset(presetId, selectedAnimation, customAnimations);
      setAnnouncement(`${describeAnimation(next[selected.id], customAnimations)} Ajoutée à ${selected.name}.`);
    }
    setAnimationByElement(next);
  }

  // « Tester » de l'éditeur : l'animation en cours de création, avec sa durée, sans délai.
  function handleTest(preset: AnimationPreset): string {
    if (!selected) return "Sélectionnez d'abord un élément pour tester l'animation.";
    if (!preview.current?.play(selected.id, preset, preset.duration, 0)) {
      return `Test impossible : ${selected.name} est introuvable dans la page.`;
    }
    return `${preset.name} jouée sur ${selected.name} dans l'aperçu.`;
  }

  function handleCreate(preset: AnimationPreset): string {
    const nextCustom = [...customAnimations, preset];
    setCustomAnimations(nextCustom);
    if (!selected) return `Animation « ${preset.name} » créée : choisissez un élément pour l'appliquer.`;
    setAnimationByElement({
      ...animationByElement,
      [selected.id]: withPreset(preset.id, selectedAnimation, nextCustom),
    });
    return `Animation « ${preset.name} » créée et appliquée à ${selected.name}.`;
  }

  function handleEventChange(event: TriggerEventId) {
    if (!selected || !selectedAnimation) return;
    const updated = { ...selectedAnimation, event };
    setAnimationByElement({ ...animationByElement, [selected.id]: updated });
    setAnnouncement(`${describeAnimation(updated, customAnimations)} Sur ${selected.name}.`);
  }

  // Pas d'annonce : le lecteur d'écran lit déjà la valeur saisie dans le champ.
  function handleTimingChange(timing: Partial<Pick<ElementAnimation, "duration" | "delay">>) {
    if (!selected || !selectedAnimation) return;
    setAnimationByElement({ ...animationByElement, [selected.id]: { ...selectedAnimation, ...timing } });
  }

  // Seulement les animations des éléments présents dans la page affichée, dans l'ordre de la page.
  const placed = useMemo(
    () =>
      flattenElements(elements ?? []).flatMap((element) => {
        const animation = animationByElement[element.id];
        return animation ? [{ element, animation }] : [];
      }),
    [elements, animationByElement],
  );

  function handleEdit(element: PageElement) {
    handleSelect(element);
    setPanelView("settings");
    // Amène le clavier sur les réglages, une fois le panneau affiché.
    requestAnimationFrame(() => document.getElementById(SETTINGS_ID)?.focus());
  }

  function handleRemove(element: PageElement) {
    const next = { ...animationByElement };
    delete next[element.id];
    setAnimationByElement(next);
    setAnnouncement(`Animation retirée de ${element.name}.`);
  }

  // Lecture sur demande : jouée même si le système réduit les animations.
  function handlePreview() {
    if (!selected || !selectedAnimation) return;
    const preset = findPreset(selectedAnimation.animation, customAnimations);
    if (!preset || !preview.current?.play(selected.id, preset, selectedAnimation.duration, selectedAnimation.delay)) {
      setAnnouncement(`Aperçu impossible : ${selected.name} est introuvable dans la page.`);
      return;
    }
    // Audiodescription : ce que fait l'animation, pour qui ne la voit pas.
    const delay =
      selectedAnimation.delay > 0
        ? ` Après ${(selectedAnimation.delay / 1000).toLocaleString("fr-FR")} s d'attente.`
        : "";
    setAnnouncement(`Aperçu. ${describePreset(preset, selectedAnimation.duration)}${delay}`);
  }

  const exporter = useAnimationsExport(projectId, config, setAnnouncement);
  const drop = useFileDrop(handleFiles);

  // Création depuis le panneau : annonce, puis retour aux réglages (où l'animation est appliquée).
  function handleCreateFromEditor(preset: AnimationPreset): string {
    const message = handleCreate(preset);
    setAnnouncement(message);
    setPanelView("settings");
    return message;
  }

  const projectError =
    !imported && projectId !== null && projectLoad && projectLoad.status !== "ok" ? projectLoad : null;
  const missing = html === null ? [] : missingStylesheets(html);
  const exportState = exporter.state;
  const hasMessages =
    projectError !== null ||
    (projectLoad?.status === "ok" && projectLoad.invalidConfig) ||
    importError !== null ||
    missing.length > 0 ||
    exportState !== null;

  return (
    // Le Hub n'impose pas de hauteur : comme Screendraft, l'outil occupe exactement l'espace sous
    // la barre du Hub et seuls ses panneaux défilent. En petit écran, les colonnes s'empilent et la
    // page défile (sinon le texte agrandi ne tiendrait pas).
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="anime-flow flex flex-1 flex-col lg:absolute lg:inset-0 lg:overflow-hidden">
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-(--line) bg-(--surface-raised) px-4 py-2">
          <h1 className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            {/* Logo décoratif : le titre « Animations » juste à côté nomme déjà l'outil. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- next/image est exclu par l'export statique. */}
            <img src={animflowMark.src} alt="" width={40} height={40} className="size-10 shrink-0" />
            <span className="text-2xl font-semibold">Animations</span>
            {sourceLabel && (
              <>
                <span aria-hidden className="text-sm text-(--ink-muted)">
                  /
                </span>
                <span className="sr-only">, </span>
                <span className="min-w-0 text-sm font-normal break-words text-(--ink-muted)">{sourceLabel}</span>
              </>
            )}
          </h1>
          <span className="rounded-full border border-(--motion) bg-(--motion-soft) px-3 py-1 text-sm font-medium">
            {projectId === null ? "Mode démo" : `Projet #${projectId}`}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <AnimationsPageImport
              canReloadProject={projectId !== null}
              canCancelImport={imported !== null}
              onFiles={handleFiles}
              onReloadProject={handleReload}
              onCancelImport={handleCancelImport}
            />
            <AnimationsExportButtons
              projectId={projectId}
              saving={exportState?.status === "saving"}
              onSave={exporter.save}
              onDownload={exporter.download}
            />
          </div>
        </header>

        {/* Annonce les actions aux lecteurs d'écran. */}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {hasMessages && (
          <div className="flex shrink-0 flex-col gap-2 border-b border-(--line) bg-(--surface) px-4 py-2">
            {projectError && (
              <div role="alert" className={`${ERROR_BOX} flex flex-wrap items-center gap-x-6`}>
                <p>
                  Erreur :{" "}
                  {projectError.status === "missing"
                    ? `${PAGE_FILE} introuvable dans le projet ${projectId} : passez d'abord par le Générateur, ou importez une page.`
                    : projectError.message}
                </p>
                <button type="button" onClick={handleReload} className="min-h-10 underline">
                  Réessayer
                </button>
                <Link href="/" className="inline-flex min-h-10 items-center underline">
                  Retour au Hub
                </Link>
              </div>
            )}
            {projectLoad?.status === "ok" && projectLoad.invalidConfig && (
              <p role="alert" className={ERROR_BOX}>
                Erreur : {CONFIG_FILE} est illisible. Les animations repartent de zéro ; l&apos;enregistrement
                remplacera ce fichier.
              </p>
            )}
            {importError && (
              <p role="alert" className={ERROR_BOX}>
                Erreur : {importError}
              </p>
            )}
            {missing.length > 0 && (
              <p className="rounded-xl border-2 border-(--line-strong) p-3 text-sm">
                Cette page utilise {missing.join(", ")} : importez-le avec la page pour voir ses couleurs et sa mise en
                page.
              </p>
            )}
            {exportState?.status === "done" && (
              <div className="flex flex-wrap items-center gap-x-6 rounded-xl border-2 border-(--motion) bg-(--motion-soft) px-3 text-sm">
                <p className="py-2">
                  <span aria-hidden>✓ </span>
                  {exportState.message}
                </p>
                <button type="button" onClick={exporter.dismiss} className="min-h-10 underline">
                  Masquer le message
                </button>
              </div>
            )}
            {exportState?.status === "error" && (
              <div role="alert" className={`${ERROR_BOX} flex flex-wrap items-center gap-x-6`}>
                <p>Erreur : {exportState.message}</p>
                {exportState.showHubLink && (
                  <Link href="/" className="inline-flex min-h-10 items-center underline">
                    Retour au Hub
                  </Link>
                )}
                <button type="button" onClick={exporter.dismiss} className="min-h-10 underline">
                  Masquer le message
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
          {/* Panneau de gauche : comme Screendraft, des sections repliables qui défilent d'un bloc. */}
          <aside
            aria-label="Éléments et animations"
            className="relative border-b border-(--line) bg-(--surface-raised) py-1 lg:w-72 lg:max-w-[30vw] lg:shrink-0 lg:overflow-y-auto lg:overscroll-contain lg:border-r lg:border-b-0"
          >
            <AnimationsPanelSection
              id="elements"
              headingId="animations-elements-title"
              title="Éléments de la page"
              count={elementById.size}
              isFirst
            >
              {elements ? (
                <AnimationsElementBar
                  elements={elements}
                  selectedId={selected?.id ?? null}
                  hoveredId={hoveredId}
                  onSelect={handleSelect}
                  onHover={setHoveredId}
                  labelledBy="animations-elements-title"
                />
              ) : (
                <p className="text-sm text-(--ink-muted)">Aucune page chargée.</p>
              )}
            </AnimationsPanelSection>

            <AnimationsPanelSection
              id="placed"
              headingId="animations-placed-title"
              title="Animations posées"
              count={placed.length}
            >
              <AnimationsPlacedList
                items={placed}
                customAnimations={customAnimations}
                onEdit={handleEdit}
                onRemove={handleRemove}
              />
            </AnimationsPanelSection>

            <AnimationsPanelSection
              id="custom"
              headingId="animations-custom-title"
              title="Mes animations"
              count={customAnimations.length}
              defaultOpen={false}
            >
              <div className="flex flex-col gap-3">
                {customAnimations.length === 0 ? (
                  <p className="text-sm text-(--ink-muted)">
                    Pas encore d&apos;animation personnalisée : créez la vôtre si la bibliothèque ne suffit pas.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {customAnimations.map((preset) => (
                      <li key={preset.id} className="text-sm">
                        <span className="font-semibold">{preset.name}</span>
                        <span className="block text-(--ink-muted)">{describeEffect(preset)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => setPanelView("editor")}
                  aria-pressed={panelView === "editor"}
                  className={`${SECONDARY_BUTTON} self-start`}
                >
                  <span aria-hidden>+</span> Créer une animation
                </button>
              </div>
            </AnimationsPanelSection>

            <AnimationsPanelSection
              id="integration"
              headingId="animations-integration-title"
              title="Intégration"
              defaultOpen={false}
            >
              <AnimationsIntegration animatedCount={config.elements.length} />
            </AnimationsPanelSection>
          </aside>

          {/* Centre : l'aperçu, qui accepte aussi le dépôt de page.html et page.css. */}
          <div className="relative flex min-w-0 flex-1 flex-col p-4 lg:min-h-0" {...drop.handlers}>
            {html !== null && elements !== null ? (
              <AnimationsPreview
                html={html}
                selectedId={selected?.id ?? null}
                hoveredId={hoveredId}
                elementNames={elementNames}
                onHoverId={setHoveredId}
                onSelectId={handleSelectId}
                onMissedClick={handleMissedClick}
                onEscape={handleDeselect}
                ref={preview}
              />
            ) : projectError ? (
              <p className="text-sm text-(--ink-muted)">
                Aucune page à afficher. Importez une page, ou glissez-déposez {PAGE_FILE} et son CSS ici.
              </p>
            ) : (
              <p role="status" className="text-sm text-(--ink-muted)">
                Lecture de {PAGE_FILE}…
              </p>
            )}
            {/* Au-dessus de l'iframe, qui garderait sinon pour elle les évènements de dépôt. */}
            {drop.dragging && (
              <div className="absolute inset-2 z-10 flex items-center justify-center rounded-xl border-4 border-dashed border-(--motion) bg-(--motion-soft) p-6 text-center text-lg font-semibold">
                Déposez {PAGE_FILE} et son fichier CSS pour animer cette page
              </div>
            )}
          </div>

          <AnimationsSidePanel
            view={panelView}
            selectedName={selected?.name ?? null}
            onBack={() => setPanelView("settings")}
            settings={
              <AnimationsElementSettings
                // key : les champs de durée repartent des valeurs de l'élément choisi.
                key={selected?.id}
                animation={selectedAnimation}
                customAnimations={customAnimations}
                onPresetChange={handlePresetChange}
                onEventChange={handleEventChange}
                onTimingChange={handleTimingChange}
                onPreview={handlePreview}
              />
            }
            editor={
              <AnimationsCustomEditor
                selectedName={selected?.name ?? null}
                takenNames={[...ANIMATION_PRESETS, ...customAnimations].map((preset) => preset.name)}
                takenIds={[...ANIMATION_PRESETS, ...customAnimations].map((preset) => preset.id)}
                onTest={handleTest}
                onCreate={handleCreateFromEditor}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
