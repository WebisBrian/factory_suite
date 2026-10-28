"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listProjectHistory, readFileVersion, restoreFileVersion, type FileVersion } from "@/lib/project-fs";
import { hubComparableText, hubDiffLines, type HubDiffLine } from "@/components/hub/hub-diff";

const MAX_PREVIEW_BYTES = 1024 * 1024;
const DIFF_CONTEXT = 3;

const dayFormat = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const dateTimeFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium" });

const ghostButton =
  "rounded-md px-2 py-0.5 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40";
const tabButton = (active: boolean) =>
  `rounded-full px-3 py-1 text-xs transition-colors ${active ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white"}`;

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
  lines.forEach((line, index) => {
    if (!visible[index]) {
      hidden++;
      return;
    }
    if (hidden > 0) {
      rows.push(
        <div key={`gap-${index}`} className="px-3 py-0.5 text-zinc-500 italic">
          … {hidden} ligne{hidden > 1 ? "s" : ""} identique{hidden > 1 ? "s" : ""}
        </div>,
      );
      hidden = 0;
    }
    const style =
      line.kind === "added"
        ? "bg-emerald-500/15 text-emerald-200"
        : line.kind === "removed"
          ? "bg-red-500/15 text-red-200"
          : "text-zinc-400";
    const sign = line.kind === "added" ? "+" : line.kind === "removed" ? "−" : " ";
    rows.push(
      <div key={index} className={`px-3 whitespace-pre-wrap break-all ${style}`}>
        <span className="mr-2 select-none opacity-60">{sign}</span>
        {line.text}
      </div>,
    );
  });
  if (hidden > 0) {
    rows.push(
      <div key="gap-end" className="px-3 py-0.5 text-zinc-500 italic">
        … {hidden} ligne{hidden > 1 ? "s" : ""} identique{hidden > 1 ? "s" : ""}
      </div>,
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs">
        <span className="text-emerald-300">+{added} ajoutée{added > 1 ? "s" : ""}</span>{" "}
        <span className="text-red-300">−{removed} supprimée{removed > 1 ? "s" : ""}</span>
      </p>
      {added + removed === 0 ? (
        <p className="text-sm text-zinc-500">Contenu identique à la version précédente.</p>
      ) : (
        <div className="max-h-96 overflow-auto rounded-lg bg-black/40 py-2 font-mono text-xs leading-5">{rows}</div>
      )}
    </div>
  );
}

function HubVersionViewer({ projectId, viewer, onClose }: { projectId: number; viewer: Viewer; onClose: () => void }) {
  const key = `${versionKey(viewer.version)}:${viewer.mode}`;
  const [result, setResult] = useState<ViewerResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadViewer(projectId, viewer, key).then((next) => !cancelled && setResult(next));
    return () => {
      cancelled = true;
    };
  }, [projectId, viewer, key]);

  const ready = result?.key === key ? result : null;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate font-mono text-sm text-white">{viewer.version.filename}</h4>
          <p className="text-xs text-zinc-500">
            {viewer.mode === "diff"
              ? viewer.previous
                ? `Changements entre ${dateTimeFormat.format(viewer.previous.savedAt)} et ${dateTimeFormat.format(viewer.version.savedAt)}`
                : `Première version enregistrée (${dateTimeFormat.format(viewer.version.savedAt)})`
              : `Contenu au ${dateTimeFormat.format(viewer.version.savedAt)}`}
          </p>
        </div>
        <button type="button" onClick={onClose} className={ghostButton}>
          Fermer
        </button>
      </header>

      {ready === null ? (
        <p className="text-sm text-zinc-500">Chargement…</p>
      ) : ready.kind === "unavailable" ? (
        <p className="text-sm text-zinc-500">{ready.reason}</p>
      ) : viewer.mode === "diff" ? (
        (() => {
          const lines = hubDiffLines(
            hubComparableText(viewer.version.filename, ready.previous ?? ""),
            hubComparableText(viewer.version.filename, ready.current),
          );
          return lines ? (
            <HubDiffView lines={lines} />
          ) : (
            <p className="text-sm text-zinc-500">Fichiers trop volumineux pour être comparés.</p>
          );
        })()
      ) : (
        <pre className="max-h-96 overflow-auto rounded-lg bg-black/40 p-3 font-mono text-xs leading-5 whitespace-pre-wrap break-all text-zinc-200">
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

  const load = useCallback(async () => {
    try {
      setVersions(await listProjectHistory(projectId));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [projectId]);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRestoring(null);
    }
  }

  function renderActions(version: FileVersion) {
    const key = versionKey(version);
    return (
      <div className="flex shrink-0 flex-wrap justify-end gap-0.5">
        <button type="button" onClick={() => setViewer({ version, previous: previousOf(version), mode: "diff" })} className={ghostButton}>
          Changements
        </button>
        <button type="button" onClick={() => setViewer({ version, previous: null, mode: "content" })} className={ghostButton}>
          Contenu
        </button>
        <button type="button" onClick={() => downloadVersion(projectId, version)} className={ghostButton}>
          Télécharger
        </button>
        {!latestKeys.has(key) && (
          <button type="button" onClick={() => handleRestore(version)} disabled={restoring !== null} className={ghostButton}>
            {restoring === key ? "Restauration…" : "Restaurer"}
          </button>
        )}
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (versions === null) return <p className="text-sm text-zinc-500">Chargement de l&apos;historique…</p>;
  if (versions.length === 0) {
    return <p className="text-sm text-zinc-500">Aucune modification enregistrée pour l&apos;instant.</p>;
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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-full bg-white/5 p-0.5">
          <button type="button" onClick={() => setMode("timeline")} className={tabButton(mode === "timeline")}>
            Chronologie
          </button>
          <button type="button" onClick={() => setMode("at-date")} className={tabButton(mode === "at-date")}>
            État à une date
          </button>
        </div>
        <select
          value={fileFilter}
          onChange={(event) => setFileFilter(event.target.value)}
          aria-label="Filtrer par fichier"
          className="rounded-full border border-white/15 bg-[#16161d] px-3 py-1 text-xs text-zinc-200"
        >
          <option value="">Tous les fichiers</option>
          {filenames.map((filename) => (
            <option key={filename} value={filename}>
              {filename}
            </option>
          ))}
        </select>
      </div>

      {mode === "timeline" ? (
        <div className="flex max-h-80 flex-col gap-3 overflow-auto pr-1">
          {days.map((day) => (
            <div key={day.label}>
              <h4 className="mb-1 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">{day.label}</h4>
              <ol className="divide-y divide-white/5 rounded-xl border border-white/5 bg-black/20 text-sm">
                {day.items.map((version) => (
                  <li key={versionKey(version)} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                    <span className="font-mono text-xs text-zinc-400">{timeFormat.format(version.savedAt)}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-zinc-200">
                      {version.filename}
                      {latestKeys.has(versionKey(version)) && (
                        <span className="ml-2 rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-sans text-[10px] text-emerald-300">
                          actuelle
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-zinc-500">{formatSize(version.size)}</span>
                    {renderActions(version)}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            Afficher le projet tel qu&apos;il était le
            <input
              type="datetime-local"
              value={atDate}
              onChange={(event) => setAtDate(event.target.value)}
              className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-sm text-white scheme-dark"
            />
          </label>
          <ul className="divide-y divide-white/5 rounded-xl border border-white/5 bg-black/20 text-sm">
            {snapshot.map(({ filename, version }) => (
              <li key={filename} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                <span className="min-w-0 flex-1 truncate font-mono text-zinc-200">{filename}</span>
                {version ? (
                  <>
                    <span className="text-xs text-zinc-500">version du {dateTimeFormat.format(version.savedAt)}</span>
                    {renderActions(version)}
                  </>
                ) : (
                  <span className="text-xs text-zinc-500 italic">n&apos;existait pas encore</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {viewer && <HubVersionViewer projectId={projectId} viewer={viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}
