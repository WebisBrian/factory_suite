"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProjectFsError, readProjectText, useProjectId, writeProjectFile } from "@/lib/project-fs";
import {
  CRITERIA,
  applyAutoFixes,
  mergeReports,
  PASS_SCORE,
  parseQualityInput,
  runQualityCheck,
  type CategoryReport,
  type CriterionResult,
} from "@/app/quality/_lib/quality-criteria";
import { pageFixtureCss, pageFixtureHtml } from "@/app/quality/_lib/quality-fixture";
import {
  qualityCard,
  qualityCode,
  qualityDisplay,
  qualityError,
  qualityLink,
  qualityPaper,
  qualityPrimaryButton,
  qualityToggleButton,
  qualitySectionTitle,
  toolHref,
} from "@/app/quality/_lib/quality-styles";

const HTML_FILE = "page.html";
const MAQUETTE_FILE = "maquette.json";
const REPORT_FILE = "qualite.json";
const fixedName = (path: string) => path.replace(/\.html$/i, ".corrige.html");

type Page = { path: string; name: string; html: string; css: string };
type Fixed = { html: string; applied: string[] };
type Load = { status: "ok"; pages: Page[]; label: string } | { status: "missing" } | { status: "error"; message: string };

const STATUS_LABEL = { pass: "Réussi", fail: "Échec", manual: "À vérifier à la main" } as const;
// Icône + texte : l'état n'est jamais porté par la couleur seule.
const STATUS_MARK = { pass: "✓", fail: "✗", manual: "?" } as const;

function describeError(e: unknown): string {
  return e instanceof ProjectFsError || e instanceof Error ? e.message : String(e);
}

/** Écrans listés par maquette.json (un fichier HTML chacun) ; à défaut, la page unique page.html. */
async function listScreens(projectId: number): Promise<{ path: string; name: string }[]> {
  try {
    const text = await readProjectText(projectId, MAQUETTE_FILE);
    const data: unknown = text === null ? null : JSON.parse(text);
    const screens = (data as { screens?: { path?: unknown; name?: unknown }[] } | null)?.screens;
    const list = (screens ?? []).flatMap((s) =>
      typeof s.path === "string" ? [{ path: s.path, name: typeof s.name === "string" ? s.name : s.path }] : [],
    );
    if (list.length > 0) return list;
  } catch (e) {
    if (e instanceof ProjectFsError) throw e;
    // maquette.json illisible : on retombe sur la page unique.
  }
  return [{ path: HTML_FILE, name: "Page" }];
}

/** Feuilles de style locales liées par la page (le CSS d'un écran n'a pas toujours le même nom). */
function linkedStylesheets(html: string): string[] {
  return Array.from(html.matchAll(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi), ([link]) => link.match(/href=["']?([^"'\s>]+)/i)?.[1])
    .filter((href): href is string => !!href && !/^(https?:)?\/\//.test(href) && !href.includes("/"));
}

async function loadProject(projectId: number): Promise<Load> {
  try {
    const screens = await listScreens(projectId);
    const pages: Page[] = [];
    for (const screen of screens) {
      const html = await readProjectText(projectId, screen.path);
      if (html === null) continue;
      const sheets = await Promise.all(linkedStylesheets(html).map((href) => readProjectText(projectId, href)));
      pages.push({ ...screen, html, css: sheets.filter((x): x is string => x !== null).join("\n") });
    }
    if (pages.length === 0) return { status: "missing" };
    return { status: "ok", pages, label: `${pages.length} écran(s) du projet #${projectId}` };
  } catch (e) {
    return { status: "error", message: describeError(e) };
  }
}

export function QualityApp() {
  const projectId = useProjectId();
  const [load, setLoad] = useState<Load | null>(null);
  const [fixed, setFixed] = useState<Record<string, Fixed>>({});
  const [selected, setSelected] = useState(0);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (projectId === null) return;
    let cancelled = false;
    loadProject(projectId).then((next) => {
      if (!cancelled) setLoad(next);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const pages = useMemo<Page[] | null>(
    () =>
      projectId === null
        ? [{ path: "page.html", name: "Page de démo", html: pageFixtureHtml, css: pageFixtureCss }]
        : load?.status === "ok"
          ? load.pages
          : null,
    [projectId, load],
  );
  const sourceLabel = projectId === null ? "Page de démo (fixture)" : load?.status === "ok" ? load.label : "";

  // Après correction, la vérification porte sur la page corrigée : le score montre le gain réel.
  const perScreen = useMemo(
    () => pages?.map((page) => runQualityCheck(parseQualityInput(fixed[page.path]?.html ?? page.html, page.css))) ?? null,
    [pages, fixed],
  );
  const current = Math.min(selected, (pages?.length ?? 1) - 1);
  const page = pages?.[current] ?? null;
  const reports = perScreen?.[current] ?? null;
  const overall = perScreen && perScreen.length > 1 ? mergeReports(perScreen) : null;
  const currentFixed = page ? fixed[page.path] : undefined;
  const fixableCount = reports?.flatMap((r) => r.results).filter((x) => x.status === "fail" && x.criterion.fix).length ?? 0;

  async function handleReload() {
    if (projectId === null) return;
    setFixed({});
    setLoad(await loadProject(projectId));
  }

  function handleAutoFix() {
    if (!page) return;
    const result = applyAutoFixes(page.html);
    setFixed((previous) => ({ ...previous, [page.path]: result }));
    setSaveMessage({
      ok: true,
      text: result.applied.length
        ? `${page.name} : ${result.applied.length} correction(s) appliquée(s) : ${result.applied.join(" ; ")}.`
        : "Aucune correction automatique possible.",
    });
  }

  function handleDownloadFixed() {
    if (!page || !currentFixed) return;
    const url = URL.createObjectURL(new Blob([currentFixed.html], { type: "text/html" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fixedName(page.path);
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleSaveFixed() {
    if (projectId === null || !page || !currentFixed) return;
    try {
      // Fichier à part : les pages générées sont générées par ScreenDraft et ne sont jamais écrasées.
      await writeProjectFile(projectId, fixedName(page.path), currentFixed.html);
      setSaveMessage({ ok: true, text: `Page corrigée enregistrée dans ${fixedName(page.path)}.` });
    } catch (e) {
      setSaveMessage({ ok: false, text: describeError(e) });
    }
  }

  async function handleSave() {
    if (projectId === null || !pages || !perScreen) return;
    try {
      const body = pages.map((p, i) => ({
        screen: p.path,
        categories: perScreen[i].map((r) => ({
          category: r.id,
          score: r.score,
          passed: r.passed,
          criteria: r.results.map((x) => ({ id: x.criterion.id, status: x.status, detail: x.detail ?? null })),
        })),
      }));
      await writeProjectFile(projectId, REPORT_FILE, JSON.stringify(body, null, 2));
      setSaveMessage({ ok: true, text: `Rapport enregistré dans ${REPORT_FILE}.` });
    } catch (e) {
      setSaveMessage({ ok: false, text: describeError(e) });
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        <h1 className={`${qualityDisplay} text-5xl leading-tight tracking-tighter sm:text-6xl`}>Contrôle qualité</h1>
        <p className="max-w-prose text-lg text-[#454545]">
          Étape 4 : vérifie la page produite sur quatre points (performance, accessibilité, bonnes pratiques, SEO).
          Une catégorie est validée à {PASS_SCORE} % de critères réussis, sans échec sur un critère obligatoire.
        </p>
      </header>

      {projectId !== null && load?.status === "missing" && (
        <div role="alert" className={qualityError}>
          Erreur : <span className={qualityCode}>{HTML_FILE}</span> est introuvable dans le projet #{projectId}. Enregistrez la
          maquette dans{" "}
          <Link href={toolHref("/screendraft", projectId)} className={qualityLink}>
            ScreenDraft
          </Link>
          (les pages sont générées à l&apos;enregistrement), puis relancez la vérification.
        </div>
      )}
      {load?.status === "error" && (
        <div role="alert" className={qualityError}>
          Erreur : {load.message}{" "}
          <Link href="/" className={qualityLink}>
            Retour au Hub
          </Link>
        </div>
      )}
      {projectId !== null && load === null && (
        <p role="status" className="text-base text-[#454545]">
          Chargement de la page du projet…
        </p>
      )}

      {reports && page && (
        <section aria-labelledby="quality-report-title" className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="quality-report-title" className={qualitySectionTitle}>
                Résultat
              </h2>
              <p className="text-sm text-[#454545]">Source : {sourceLabel}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {projectId !== null && (
                <button type="button" onClick={handleReload} className={qualityPrimaryButton}>
                  Relancer la vérification
                </button>
              )}
              <button type="button" onClick={handleAutoFix} disabled={fixableCount === 0} className={qualityPrimaryButton}>
                Corriger automatiquement ({fixableCount})
              </button>
              {currentFixed && (
                <button type="button" onClick={handleDownloadFixed} className={qualityPrimaryButton}>
                  Télécharger la page corrigée
                </button>
              )}
              {currentFixed && projectId !== null && (
                <button type="button" onClick={handleSaveFixed} className={qualityPrimaryButton}>
                  Enregistrer la page corrigée
                </button>
              )}
              {projectId !== null && (
                <button type="button" onClick={handleSave} className={qualityPrimaryButton}>
                  Enregistrer le rapport
                </button>
              )}
            </div>
          </div>
          <div role="status">
            {saveMessage && (
              <p className={saveMessage.ok ? `${qualityPaper} p-4 text-sm text-[#2e2e2e]` : qualityError}>
                {saveMessage.ok ? "" : "Erreur : "}
                {saveMessage.text}
              </p>
            )}
          </div>
          {overall && pages && (
            <>
              <h3 className="text-xl font-medium text-[#2e2e2e]">Score global ({pages.length} écrans)</h3>
              <ScoreList label="Score global par catégorie" reports={overall} link={false} />
              <h3 className="text-xl font-medium text-[#2e2e2e]">Détail par écran</h3>
              <ul aria-label="Écrans de la maquette" className="flex flex-wrap gap-2">
                {pages.map((p, i) => (
                  <li key={p.path}>
                    <button
                      type="button"
                      aria-pressed={i === current}
                      onClick={() => setSelected(i)}
                      className={qualityToggleButton}
                    >
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h3 className="text-xl font-medium text-[#2e2e2e]">{pages && pages.length > 1 ? `Écran « ${page.name} »` : "Score par catégorie"}</h3>
          <ScoreList label="Score par catégorie" reports={reports} link />
          {reports.map((report) => (
            <QualityCategory key={report.id} report={report} />
          ))}
        </section>
      )}

      <section aria-labelledby="quality-method-title" className={`${qualityCard} flex flex-col gap-2 p-6`}>
        <h2 id="quality-method-title" className="text-xl font-medium text-[#2e2e2e]">
          Ce que cette vérification ne couvre pas
        </h2>
        <p className="max-w-prose text-base text-[#454545]">
          L&apos;analyse est statique : elle lit le HTML et le CSS, sans charger la page. Les {CRITERIA.filter((c) => !c.check).length}{" "}
          critères marqués « à vérifier à la main » (temps de chargement réel, contraste, lecteur d&apos;écran) se mesurent avec
          Lighthouse ou un lecteur d&apos;écran.
        </p>
      </section>
    </div>
  );
}

function QualityCategory({ report }: { report: CategoryReport }) {
  return (
    <section id={`quality-${report.id}`} aria-labelledby={`quality-${report.id}-title`} className={`${qualityCard} p-6`}>
      <h3 id={`quality-${report.id}-title`} className="text-2xl font-medium text-[#2e2e2e]">
        {report.label} : {report.score} %
      </h3>
      <p className="mb-4 text-base text-[#454545]">{report.goal}</p>
      <ul className="flex flex-col gap-3">
        {report.results.map((result) => (
          <QualityCriterionRow key={result.criterion.id} result={result} />
        ))}
      </ul>
    </section>
  );
}

function QualityCriterionRow({ result }: { result: CriterionResult }) {
  const { criterion, status, detail } = result;
  return (
    <li className="flex gap-3 border-t border-black/15 pt-3">
      <span aria-hidden className="w-6 shrink-0 text-lg font-bold text-[#2e2e2e]">
        {STATUS_MARK[status]}
      </span>
      <div className="min-w-0">
        <p className="text-base font-semibold text-[#2e2e2e]">
          {criterion.title} <span className="sr-only">: </span>
          <span className="text-sm font-medium text-[#454545]">
            {STATUS_LABEL[status]} · {criterion.severity === "required" ? "obligatoire" : "recommandé"}
          </span>
        </p>
        <p className="text-sm text-[#454545]">Attendu : {criterion.target}</p>
        {detail && <p className="text-sm break-words text-[#2e2e2e]">Constat : {detail}</p>}
        {status === "fail" && (
          <p className="text-sm text-[#454545]">
            {criterion.fix ? "Correction automatique possible." : "Correction manuelle nécessaire."}
          </p>
        )}
      </div>
    </li>
  );
}

function ScoreList({ label, reports, link }: { label: string; reports: CategoryReport[]; link: boolean }) {
  return (
    <ul aria-label={label} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {reports.map((report) => (
        <li key={report.id} className={`${qualityPaper} p-4`}>
          {link ? (
            <a href={`#quality-${report.id}`} className={`block ${qualityLink}`}>
              {report.label}
            </a>
          ) : (
            <p className="text-base font-semibold text-[#2e2e2e]">{report.label}</p>
          )}
          <p className="mt-2 text-4xl font-semibold text-[#2e2e2e]">{report.score} %</p>
          <p className="text-sm font-semibold text-[#2e2e2e]">{report.passed ? "✓ Validée" : "✗ Non validée"}</p>
        </li>
      ))}
    </ul>
  );
}
