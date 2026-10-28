"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { listProjectHistory, readFileVersion, restoreFileVersion, type FileVersion } from "@/lib/project-fs";
import { HubAlert, HubStatus } from "@/components/hub/HubAlert";
import { onHubProjectsChanged } from "@/components/hub/hub-project-events";
import { hubComparableText, hubDiffLines, type HubDiffLine } from "@/components/hub/hub-diff";
import { hubInput, hubSectionLabel, hubSmallButton } from "@/components/hub/hub-styles";

const MAX_PREVIEW_BYTES = 1024 * 1024;
const DIFF_CONTEXT = 3;

const dayFormat = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const dateTimeFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "medium" });

// Bouton bascule : l'état actif est porté par aria-pressed ET par un soulignement épais (pas que la couleur).
const toggleButton = (active: boolean) =>
  `min-h-10 rounded-lg px-3 text-base transition-colors ${
    active ? "bg-white/15 font-bold text-white underline decoration-4 underline-offset-8" : "text-zinc-200 hover:bg-white/10"
  }`;

// Diff : bleu / orange (paire lisible par les daltoniens) + signe + / − + texte pour lecteur d'écran.
const DIFF_STYLES: Record<HubDiffLine["kind"], { row: string; sign: string; spoken: string }> = {
  added: { row: "bg-sky-950 text-sky-100", sign: "+", spoken: "Ajouté : " },
  removed: { row: "bg-orange-950 text-orange-100", sign: "−", spoken: "Supprimé : " },
  same: { row: "text-zinc-300", sign: " ", spoken: "" },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

/** Valeur pour <input type="datetime-local"> (heure locale). */
function toLocalInputValue(timestamp: number): string {
  const date = new Date(timestamp - new Date(timestamp).getTimezoneOffset() * 60_000);
  return date.toISOString().slice(0, 16);
}

function versionKey(version: FileVersion): string {
  return `${version.filename}/${version.versionId}`;
}

type Viewer = { version: FileVersion; previous: FileVersion | null; mode: "content" | "diff" };
type ViewerResult =
  | { key: string; kind: "text"; current: string; previous: string | null }
  | { key: string; kind: "unavailable"; reason: string };

async function readVersionText(projectId: number, version: FileVersion): Promise<string | null> {
  if (version.size > MAX_PREVIEW_BYTES) return null;
  const file = await readFileVersion(projectId, version.filename, version.versionId);
  if (!file) return null;
  const text = await file.text();
  return text.includes("\u0000") ? null : text;
}

async function loadViewer(projectId: number, viewer: Viewer, key: string): Promise<ViewerResult> {
  try {
    const current = await readVersionText(projectId, viewer.version);
    if (current === null) return { key, kind: "unavailable", reason: "Aperçu indisponible (fichier binaire ou trop volumineux)." };
    const previous = viewer.mode === "diff" && viewer.previous ? await readVersionText(projectId, viewer.previous) : null;
    return { key, kind: "text", current, previous };
  } catch (e) {
    return { key, kind: "unavailable", reason: e instanceof Error ? e.message : String(e) };
  }
}

async function downloadVersion(projectId: number, version: FileVersion): Promise<void> {
  const file = await readFileVersion(projectId, version.filename, version.versionId);
  if (!file) return;
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  const stamp = toLocalInputValue(version.savedAt).replace(/[T:]/g, "-");
  link.download = `${stamp}_${version.filename}`;
  link.click();
  URL.revokeObjectURL(url);
}

function HubDiffView({ lines }: { lines: HubDiffLine[] }) {
  // Affiche les lignes modifiées avec quelques lignes de contexte ; replie le reste.
  const visible = lines.map((line, index) =>
    lines
      .slice(Math.max(0, index - DIFF_CONTEXT), index + DIFF_CONTEXT + 1)
      .some((near) => near.kind !== "same"),
  );
  const added = lines.filter((line) => line.kind === "added").length;
  const removed = lines.filter((line) => line.kind === "removed").length;

  const rows: React.ReactNode[] = [];
  let hidden = 0;
  const pushGap = (key: string) => {
    rows.push(
      <div key={key} className="px-3 py-1 text-zinc-300 italic">
        … {hidden} ligne{hidden > 1 ? "s" : ""} identique{hidden > 1 ? "s" : ""}
      </div>,
    );
    hidden = 0;
  };
  lines.forEach((line, index) => {
    if (!visible[index]) {
      hidden++;
      return;
    }
    if (hidden > 0) pushGap(`gap-${index}`);
    const style = DIFF_STYLES[line.kind];
    rows.push(
      <div key={index} className={`px-3 whitespace-pre-wrap break-all ${style.row}`}>
        <span aria-hidden className="mr-2 inline-block w-3 font-bold select-none">
          {style.sign}
        </span>
        <span className="sr-only">{style.spoken}</span>
        {line.text}
      </div>,
    );
  });
  if (hidden > 0) pushGap("gap-end");

  return (
    <div className="flex flex-col gap-2">
      <p className="text-base">
        <span className="font-bold text-sky-200">
          + {added} ligne{added > 1 ? "s" : ""} ajoutée{added > 1 ? "s" : ""}
        </span>
        {", "}
        <span className="font-bold text-orange-200">
          − {removed} ligne{removed > 1 ? "s" : ""} supprimée{removed > 1 ? "s" : ""}
        </span>
      </p>
      {added + removed === 0 ? (
        <p className="text-base text-zinc-300">Contenu identique à la version précédente.</p>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-label="Lignes modifiées"
          className="max-h-[60vh] overflow-auto rounded-lg border border-zinc-700 bg-black/40 py-2 font-mono text-base leading-relaxed"
        >
          {rows}
        </div>
      )}
    </div>
  );
}

function HubVersionViewer({ projectId, viewer, onClose }: { projectId: number; viewer: Viewer; onClose: () => void }) {
  const key = `${versionKey(viewer.version)}:${viewer.mode}`;
  const [result, setResult] = useState<ViewerResult | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();

  useEffect(() => {
    let cancelled = false;
    loadViewer(projectId, viewer, key).then((next) => !cancelled && setResult(next));
    return () => {
      cancelled = true;
    };
  }, [projectId, viewer, key]);

  // À l'ouverture, le focus va sur le titre de l'aperçu : le lecteur d'écran l'annonce.
  useEffect(() => {
    titleRef.current?.focus();
  }, [key]);

  const ready = result?.key === key ? result : null;
  const subtitle =
    viewer.mode === "diff"
      ? viewer.previous
        ? `Changements entre le ${dateTimeFormat.format(viewer.previous.savedAt)} et le ${dateTimeFormat.format(viewer.version.savedAt)}`
        : `Première version enregistrée, le ${dateTimeFormat.format(viewer.version.savedAt)}`
      : `Contenu au ${dateTimeFormat.format(viewer.version.savedAt)}`;

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3 rounded-xl border-2 border-zinc-500 bg-black/30 p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 id={titleId} ref={titleRef} tabIndex={-1} className="font-mono text-lg font-bold break-all text-white">
            {viewer.version.filename}
          </h4>
          <p className="text-base text-zinc-300">{subtitle}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fermer l'aperçu" className={hubSmallButton}>
          Fermer
        </button>
      </header>

      {ready === null ? (
        <HubStatus>Chargement…</HubStatus>
      ) : ready.kind === "unavailable" ? (
        <p className="text-base text-zinc-300">{ready.reason}</p>
      ) : viewer.mode === "diff" ? (
        (() => {
          const lines = hubDiffLines(
            hubComparableText(viewer.version.filename, ready.previous ?? ""),
            hubComparableText(viewer.version.filename, ready.current),
          );
          return lines ? (
            <HubDiffView lines={lines} />
          ) : (
            <p className="text-base text-zinc-300">Fichiers trop volumineux pour être comparés.</p>
          );
        })()
      ) : (
        <pre
          tabIndex={0}
          aria-label={`Contenu de ${viewer.version.filename}`}
          className="max-h-[60vh] overflow-auto rounded-lg border border-zinc-700 bg-black/40 p-3 font-mono text-base leading-relaxed whitespace-pre-wrap break-all text-zinc-100"
        >
          {hubComparableText(viewer.version.filename, ready.current)}
        </pre>
      )}
    </section>
  );
}

export function HubProjectHistory({ projectId, onRestored }: { projectId: number; onRestored: () => Promise<void> }) {
  const [versions, setVersions] = useState<FileVersion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"timeline" | "at-date">("timeline");
  const [fileFilter, setFileFilter] = useState("");
  const [atDate, setAtDate] = useState(() => toLocalInputValue(Date.now()));
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const filterId = useId();
  const dateId = useId();

  const load = useCallback(async () => {
    try {
      setVersions(await listProjectHistory(projectId));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [projectId]);

  // Action faite par l'assistant (ex. restauration d'une version) : on recharge.
  useEffect(() => onHubProjectsChanged(() => void load()), [load]);

  useEffect(() => {
    let cancelled = false;
    listProjectHistory(projectId).then(
      (next) => !cancelled && setVersions(next),
      (e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const filenames = useMemo(
    () => [...new Set((versions ?? []).map((version) => version.filename))].sort((a, b) => a.localeCompare(b)),
    [versions],
  );

  /** Version précédente du même fichier (la liste est triée du plus récent au plus ancien). */
  const previousOf = useCallback(
    (version: FileVersion): FileVersion | null =>
      (versions ?? []).find((other) => other.filename === version.filename && other.savedAt < version.savedAt) ?? null,
    [versions],
  );

  const latestKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const filename of filenames) {
      const latest = (versions ?? []).find((version) => version.filename === filename);
      if (latest) keys.add(versionKey(latest));
    }
    return keys;
  }, [versions, filenames]);

  async function handleRestore(version: FileVersion) {
    setRestoring(versionKey(version));
    try {
      await restoreFileVersion(projectId, version.filename, version.versionId);
      await Promise.all([load(), onRestored()]);
      setViewer(null);
      setAnnouncement(`${version.filename} restauré à la version du ${dateTimeFormat.format(version.savedAt)}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRestoring(null);
    }
  }

  function renderActions(version: FileVersion) {
    const key = versionKey(version);
    const which = `${version.filename}, version du ${dateTimeFormat.format(version.savedAt)}`;
    return (
      <div role="group" aria-label={`Actions pour ${which}`} className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setViewer({ version, previous: previousOf(version), mode: "diff" })}
          aria-label={`Voir les changements de ${which}`}
          className={hubSmallButton}
        >
          Changements
        </button>
        <button
          type="button"
          onClick={() => setViewer({ version, previous: null, mode: "content" })}
          aria-label={`Voir le contenu de ${which}`}
          className={hubSmallButton}
        >
          Contenu
        </button>
        <button
          type="button"
          onClick={() => downloadVersion(projectId, version)}
          aria-label={`Télécharger ${which}`}
          className={hubSmallButton}
        >
          Télécharger
        </button>
        {!latestKeys.has(key) && (
          <button
            type="button"
            onClick={() => handleRestore(version)}
            disabled={restoring !== null}
            aria-label={`Restaurer ${which}`}
            className={hubSmallButton}
          >
            {restoring === key ? "Restauration…" : "Restaurer"}
          </button>
        )}
      </div>
    );
  }

  if (error) return <HubAlert>{error}</HubAlert>;
  if (versions === null) return <HubStatus>Chargement de l&apos;historique…</HubStatus>;
  if (versions.length === 0) {
    return <p className="text-base text-zinc-300">Aucune modification enregistrée pour l&apos;instant.</p>;
  }

  const filtered = fileFilter ? versions.filter((version) => version.filename === fileFilter) : versions;

  // Regroupement par jour pour la chronologie.
  const days: { label: string; items: FileVersion[] }[] = [];
  for (const version of filtered) {
    const label = dayFormat.format(version.savedAt);
    const day = days.at(-1);
    if (day?.label === label) day.items.push(version);
    else days.push({ label, items: [version] });
  }

  // État du projet à une date : dernière version de chaque fichier enregistrée avant cette date.
  const atTimestamp = new Date(atDate).getTime();
  const snapshot = filenames
    .filter((filename) => !fileFilter || filename === fileFilter)
    .map((filename) => ({
      filename,
      version: versions.find((version) => version.filename === filename && version.savedAt <= atTimestamp) ?? null,
    }));

  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div role="group" aria-label="Mode d'affichage de l'historique" className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("timeline")}
            aria-pressed={mode === "timeline"}
            className={toggleButton(mode === "timeline")}
          >
            Chronologie
          </button>
          <button
            type="button"
            onClick={() => setMode("at-date")}
            aria-pressed={mode === "at-date"}
            className={toggleButton(mode === "at-date")}
          >
            État à une date
          </button>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={filterId} className="text-sm font-semibold text-zinc-200">
            Fichier affiché
          </label>
          <select id={filterId} value={fileFilter} onChange={(event) => setFileFilter(event.target.value)} className={hubInput}>
            <option value="">Tous les fichiers</option>
            {filenames.map((filename) => (
              <option key={filename} value={filename}>
                {filename}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mode === "timeline" ? (
        <div className="flex flex-col gap-4">
          {days.map((day) => (
            <section key={day.label} aria-label={day.label}>
              <h4 className={`mb-2 ${hubSectionLabel}`}>{day.label}</h4>
              <ol className="divide-y divide-zinc-700 rounded-xl border border-zinc-700 text-base">
                {day.items.map((version) => (
                  <li key={versionKey(version)} className="flex flex-col gap-2 px-3 py-3">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono font-bold text-white">{timeFormat.format(version.savedAt)}</span>
                      <span className="font-mono break-all text-zinc-100">{version.filename}</span>
                      {latestKeys.has(versionKey(version)) && (
                        <span className="rounded-full border border-zinc-300 px-2 text-sm font-semibold text-white">
                          version actuelle
                        </span>
                      )}
                      <span className="text-sm text-zinc-300">{formatSize(version.size)}</span>
                    </p>
                    {renderActions(version)}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={dateId} className="text-base font-semibold text-zinc-100">
              Afficher le projet tel qu&apos;il était le
            </label>
            <input
              id={dateId}
              type="datetime-local"
              value={atDate}
              onChange={(event) => setAtDate(event.target.value)}
              className={`self-start scheme-dark ${hubInput}`}
            />
          </div>
          <ul className="divide-y divide-zinc-700 rounded-xl border border-zinc-700 text-base">
            {snapshot.map(({ filename, version }) => (
              <li key={filename} className="flex flex-col gap-2 px-3 py-3">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono break-all text-zinc-100">{filename}</span>
                  <span className="text-sm text-zinc-300">
                    {version ? `version du ${dateTimeFormat.format(version.savedAt)}` : "n'existait pas encore à cette date"}
                  </span>
                </p>
                {version && renderActions(version)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {viewer && <HubVersionViewer projectId={projectId} viewer={viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}
