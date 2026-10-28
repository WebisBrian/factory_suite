"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { readProjectText, writeProjectFile } from "@/lib/project-fs";
import { HubAlert, HubStatus } from "@/components/hub/HubAlert";
import {
  HUB_VISUAL_FORMATS,
  HUB_VISUAL_STYLES,
  buildHubLocalCopy,
  defaultHubStyleIndex,
  renderHubLocalVisual,
  type HubProjectBrief,
  type HubVisualFormat,
} from "@/components/hub/hub-local-visual";
import {
  hubInput,
  hubPrimaryButton,
  hubSectionLabel,
  hubSmallButton,
} from "@/components/hub/hub-styles";

/** Fichier du projet géré par le Hub : description et réglages du visuel. */
const COMMUNICATION_FILE = "hub-communication.json";
const visualFilename = (format: HubVisualFormat) => `hub-visuel-${format}.png`;

interface CommunicationFile {
  brief: HubProjectBrief;
  format: HubVisualFormat;
  style: number;
}

interface Visual {
  url: string;
  blob: Blob;
}

const EMPTY_BRIEF: HubProjectBrief = {
  description: "",
  audience: "",
  tone: "",
  keywords: "",
};
const FORMATS = Object.keys(HUB_VISUAL_FORMATS) as HubVisualFormat[];

function parseCommunicationFile(
  text: string | null,
): Partial<CommunicationFile> | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as Partial<CommunicationFile>;
  } catch {
    return null;
  }
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function HubProjectCommunication({
  projectId,
  projectName,
  onSaved,
}: {
  projectId: number;
  projectName: string;
  onSaved: () => Promise<void>;
}) {
  const [brief, setBrief] = useState<HubProjectBrief>(EMPTY_BRIEF);
  const [format, setFormat] = useState<HubVisualFormat>("square");
  const [style, setStyle] = useState(() => defaultHubStyleIndex(projectName));
  const [visual, setVisual] = useState<Visual | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ids = {
    description: useId(),
    descriptionHint: useId(),
    audience: useId(),
    tone: useId(),
    keywords: useId(),
    format: useId(),
    preview: useId(),
    posts: useId(),
  };

  const copy = useMemo(
    () => buildHubLocalCopy(projectName, brief, style),
    [projectName, brief, style],
  );
  const filename = visualFilename(format);

  // Chargement de la description enregistrée.
  useEffect(() => {
    let cancelled = false;
    readProjectText(projectId, COMMUNICATION_FILE)
      .then((text) => {
        const saved = parseCommunicationFile(text);
        if (cancelled || !saved) return;
        setBrief({ ...EMPTY_BRIEF, ...saved.brief });
        if (saved.format && saved.format in HUB_VISUAL_FORMATS)
          setFormat(saved.format);
        if (typeof saved.style === "number") setStyle(saved.style);
      })
      .catch((e: unknown) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Aperçu : redessiné automatiquement à chaque modification (après une courte pause de frappe).
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      renderHubLocalVisual(projectName, brief, format, style).then(
        (blob) =>
          !cancelled && setVisual({ url: URL.createObjectURL(blob), blob }),
        (e: unknown) => !cancelled && setError(errorMessage(e)),
      );
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loaded, projectName, brief, format, style]);

  // Libère l'ancienne image quand une nouvelle la remplace.
  useEffect(
    () => () => {
      if (visual) URL.revokeObjectURL(visual.url);
    },
    [visual],
  );

  function nextStyle() {
    const next = (style + 1) % HUB_VISUAL_STYLES.length;
    setStyle(next);
    setStatus(`Style ${HUB_VISUAL_STYLES[next].label} appliqué.`);
  }

  async function handleSave() {
    if (!visual) return;
    setBusy(true);
    setError(null);
    try {
      const content: CommunicationFile = { brief, format, style };
      await writeProjectFile(projectId, filename, visual.blob);
      await writeProjectFile(
        projectId,
        COMMUNICATION_FILE,
        JSON.stringify(content, null, 2),
      );
      await onSaved();
      setStatus(
        `Visuel et description enregistrés dans le projet (${filename} et ${COMMUNICATION_FILE}).`,
      );
    } catch (e) {
      setStatus("");
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function copyText(text: string, what: string) {
    navigator.clipboard.writeText(text).then(
      () => setStatus(`${what} copié dans le presse-papiers.`),
      () =>
        setError(
          `impossible de copier ${what.toLowerCase()}. Sélectionnez le texte à la main.`,
        ),
    );
  }

  if (!loaded)
    return <HubStatus>Chargement de la communication du projet…</HubStatus>;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-base text-zinc-200">
        Un visuel et des posts pour les réseaux sociaux sont créés
        automatiquement à partir du nom du projet. Décrivez le site pour les
        personnaliser : l&apos;aperçu se met à jour pendant que vous tapez.
      </p>

      {/* 1. Description */}
      <section
        aria-labelledby={`${ids.description}-title`}
        className="flex flex-col gap-4"
      >
        <h4 id={`${ids.description}-title`} className={hubSectionLabel}>
          Description du projet
        </h4>
        <div className="flex flex-col gap-2">
          <label
            htmlFor={ids.description}
            className="text-base font-semibold text-zinc-100"
          >
            But du site et description{" "}
            <span className="font-normal text-zinc-300">(facultatif)</span>
          </label>
          <p id={ids.descriptionHint} className="text-sm text-zinc-300">
            La première phrase sert d&apos;accroche sur le visuel.
          </p>
          <textarea
            id={ids.description}
            value={brief.description}
            onChange={(event) =>
              setBrief({ ...brief, description: event.target.value })
            }
            aria-describedby={ids.descriptionHint}
            rows={4}
            className={`${hubInput} min-h-28 resize-y`}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(
            [
              ["audience", "Public visé", "Ex. : familles du quartier"],
              ["tone", "Ton souhaité", "Ex. : chaleureux, professionnel"],
              [
                "keywords",
                "Mots-clés, séparés par des virgules",
                "Ex. : bio, local, artisanal",
              ],
            ] as const
          ).map(([field, label, example]) => (
            <div key={field} className="flex flex-col gap-2">
              <label
                htmlFor={ids[field]}
                className="text-base font-semibold text-zinc-100"
              >
                {label}{" "}
                <span className="font-normal text-zinc-300">(facultatif)</span>
              </label>
              <input
                id={ids[field]}
                type="text"
                value={brief[field]}
                onChange={(event) =>
                  setBrief({ ...brief, [field]: event.target.value })
                }
                placeholder={example}
                className={hubInput}
              />
            </div>
          ))}
        </div>
        <fieldset>
          <legend className="mb-2 text-base font-semibold text-zinc-100">
            Format du visuel
          </legend>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((value) => (
              <label
                key={value}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-zinc-500 px-3 py-1.5 text-base text-zinc-100 has-checked:border-zinc-100 has-checked:bg-white/15 has-checked:font-bold"
              >
                <input
                  type="radio"
                  name={ids.format}
                  value={value}
                  checked={format === value}
                  onChange={() => setFormat(value)}
                  className="size-5"
                />
                {HUB_VISUAL_FORMATS[value].label}
                <span className="text-sm font-normal text-zinc-300">
                  ({HUB_VISUAL_FORMATS[value].usage})
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {/* 2. Aperçu */}
      <section aria-labelledby={ids.preview} className="flex flex-col gap-4">
        <h4 id={ids.preview} className={hubSectionLabel}>
          Visuel
        </h4>
        {visual ? (
          <figure className="flex flex-col gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:), export statique */}
            <img
              src={visual.url}
              alt={copy.altText}
              className="max-h-[32rem] w-auto max-w-full self-start rounded-xl border border-zinc-500"
            />
            <figcaption className="text-base text-zinc-200">
              <strong className="text-white">Texte alternatif : </strong>
              {copy.altText}
            </figcaption>
          </figure>
        ) : (
          <HubStatus>Création du visuel…</HubStatus>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !visual}
            className={hubPrimaryButton}
          >
            {busy ? "Enregistrement…" : "Enregistrer dans le projet"}
          </button>
          {visual && (
            <a
              href={visual.url}
              download={filename}
              aria-label={`Télécharger le visuel du projet ${projectName} (${filename})`}
              className={hubSmallButton}
            >
              Télécharger le visuel
            </a>
          )}
          <button
            type="button"
            onClick={nextStyle}
            aria-label={`Changer le style du visuel (actuel : ${HUB_VISUAL_STYLES[style % HUB_VISUAL_STYLES.length].label})`}
            className={hubSmallButton}
          >
            Autre style
          </button>
          <button
            type="button"
            onClick={() => copyText(copy.altText, "Texte alternatif")}
            className={hubSmallButton}
          >
            Copier le texte alternatif
          </button>
        </div>
      </section>

      <HubStatus>{status}</HubStatus>
      {error && <HubAlert>{error}</HubAlert>}

      {/* 3. Posts */}
      <section aria-labelledby={ids.posts} className="flex flex-col gap-4">
        <h4 id={ids.posts} className={hubSectionLabel}>
          Posts prêts à publier
        </h4>
        <ul className="grid gap-3 lg:grid-cols-3">
          {copy.posts.map((post) => {
            const full = [
              post.text,
              post.hashtags.map((tag) => `#${tag}`).join(" "),
            ]
              .filter(Boolean)
              .join("\n\n");
            return (
              <li
                key={post.network}
                className="flex flex-col gap-3 rounded-xl border border-zinc-500 p-4"
              >
                <h5 className="text-lg font-bold text-white">{post.network}</h5>
                <p className="text-base break-words whitespace-pre-line text-zinc-100">
                  {full}
                </p>
                <button
                  type="button"
                  onClick={() => copyText(full, `Post ${post.network}`)}
                  aria-label={`Copier le post ${post.network}`}
                  className={`${hubSmallButton} mt-auto self-start`}
                >
                  Copier
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
