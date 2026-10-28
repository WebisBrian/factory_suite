// Génération locale (sans IA, sans clé, hors ligne) du visuel et des posts réseaux sociaux d'un projet.
// Le visuel est dessiné dans un <canvas> à partir du nom et de la description du projet.

export type HubVisualFormat = "square" | "landscape" | "portrait";

export const HUB_VISUAL_FORMATS: Record<
  HubVisualFormat,
  { label: string; usage: string; size: string }
> = {
  square: { label: "Carré", usage: "Instagram, Facebook", size: "1024x1024" },
  landscape: { label: "Paysage", usage: "LinkedIn, X", size: "1536x864" },
  portrait: { label: "Portrait", usage: "Stories, Reels", size: "864x1536" },
};

export interface HubSocialPost {
  network: string;
  text: string;
  hashtags: string[];
}

export interface HubSocialCopy {
  posts: HubSocialPost[];
  altText: string;
}

export interface HubProjectBrief {
  description: string;
  audience: string;
  tone: string;
  keywords: string;
}

interface HubVisualStyle {
  label: string;
  from: string;
  to: string;
  accent: string;
}

// Fonds sombres + texte blanc : contraste ≥ 7:1 sur tout le dégradé.
export const HUB_VISUAL_STYLES: HubVisualStyle[] = [
  { label: "violet", from: "#2e1065", to: "#701a75", accent: "#f0abfc" },
  { label: "bleu nuit", from: "#0c1e3e", to: "#1e3a8a", accent: "#7dd3fc" },
  { label: "orange brûlé", from: "#431407", to: "#7c2d12", accent: "#fdba74" },
  { label: "bleu canard", from: "#042f2e", to: "#134e4a", accent: "#5eead4" },
  { label: "anthracite", from: "#0b0b10", to: "#27272a", accent: "#fde047" },
];

/** Style par défaut, stable pour un même projet. */
export function defaultHubStyleIndex(projectName: string): number {
  let hash = 0;
  for (const char of projectName) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % HUB_VISUAL_STYLES.length;
}

function firstSentence(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const match = clean.match(/^.+?[.!?](?=\s|$)/);
  return (match ? match[0] : clean).trim();
}

function keywordList(keywords: string): string[] {
  return keywords
    .split(/[,;\n]/)
    .map((word) => word.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function toHashtag(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");
}

function tagline(projectName: string, brief: HubProjectBrief): string {
  return (
    firstSentence(brief.description) ||
    `Découvrez ${projectName}, notre nouveau site web.`
  );
}

/** Posts LinkedIn / Instagram / X rédigés à partir de modèles, et texte alternatif du visuel. */
export function buildHubLocalCopy(
  projectName: string,
  brief: HubProjectBrief,
  styleIndex: number,
): HubSocialCopy {
  const name = projectName.trim() || "notre projet";
  const pitch = tagline(name, brief);
  const description = brief.description.replace(/\s+/g, " ").trim();
  const audience = brief.audience.trim();
  // Ton sérieux demandé : pas d'émojis.
  const emoji = (symbol: string) =>
    /pro|sérieu|formel|institution/i.test(brief.tone) ? "" : `${symbol} `;
  const hashtags = [
    toHashtag(name),
    ...keywordList(brief.keywords).map(toHashtag),
  ]
    .filter(Boolean)
    .filter((tag, index, all) => all.indexOf(tag) === index)
    .slice(0, 5);

  const linkedin = [
    `${emoji("🚀")}Nous lançons ${name} !`,
    description || pitch,
    audience && `Public visé : ${audience}.`,
    `${emoji("👉")}Découvrez-le dès maintenant et dites-nous ce que vous en pensez.`,
  ];
  const instagram = [
    `${emoji("✨")}${name} est en ligne !`,
    pitch,
    audience && `Pour qui ? ${audience}.`,
    `${emoji("🔗")}Lien en bio.`,
  ];

  const xTags = hashtags.slice(0, 3);
  const xSuffix = xTags.length
    ? ` ${xTags.map((tag) => `#${tag}`).join(" ")}`
    : "";
  let xText = `${name} est en ligne ! ${pitch}`;
  const xMax = 280 - xSuffix.length;
  if (xText.length > xMax) xText = `${xText.slice(0, xMax - 1).trimEnd()}…`;

  const style = HUB_VISUAL_STYLES[styleIndex % HUB_VISUAL_STYLES.length];
  const words = keywordList(brief.keywords);
  return {
    posts: [
      {
        network: "LinkedIn",
        text: linkedin.filter(Boolean).join("\n\n"),
        hashtags,
      },
      {
        network: "Instagram",
        text: instagram.filter(Boolean).join("\n\n"),
        hashtags,
      },
      { network: "X", text: xText, hashtags: xTags },
    ],
    altText:
      `Visuel promotionnel du projet « ${name} » sur fond dégradé ${style.label}. ` +
      `Texte : « ${pitch} »` +
      (words.length ? `, mots-clés : ${words.join(", ")}` : "") +
      `. Une fenêtre de navigateur stylisée évoque le site web.`,
  };
}

/** Coupe le texte en lignes de largeur maxWidth ; la dernière ligne finit par « … » si tout ne tient pas. */
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  let index = 0;
  for (; index < words.length; index++) {
    const candidate = current ? `${current} ${words[index]}` : words[index];
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[index];
      if (lines.length === maxLines) break;
    }
  }
  const overflow = lines.length === maxLines;
  if (!overflow && current) lines.push(current);
  if (overflow) {
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth)
      last = last.slice(0, -1);
    lines[maxLines - 1] = `${last.trimEnd()}…`;
  }
  return { lines, fits: !overflow };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Fenêtre de navigateur stylisée : illustre « un site web ». */
function drawBrowser(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  accent: string,
) {
  const r = w * 0.04;
  const bar = Math.min(h * 0.14, w * 0.08);
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = Math.max(2, w * 0.006);
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(
      x + bar * (0.6 + i * 0.55),
      y + bar / 2,
      bar * 0.16,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fill();
  }
  const inner = { x: x + w * 0.07, y: y + bar + h * 0.08, w: w * 0.86 };
  ctx.fillStyle = accent;
  roundRect(ctx, inner.x, inner.y, inner.w * 0.55, h * 0.09, h * 0.03);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.30)";
  for (let i = 0; i < 3; i++) {
    roundRect(
      ctx,
      inner.x,
      inner.y + h * (0.17 + i * 0.09),
      inner.w * (0.9 - i * 0.15),
      h * 0.045,
      h * 0.02,
    );
    ctx.fill();
  }
  const cardY = inner.y + h * 0.48;
  const cardH = y + h - cardY - h * 0.08;
  if (cardH > 0) {
    const cardW = (inner.w - w * 0.04) / 3;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 1 ? accent : "rgba(255,255,255,0.18)";
      ctx.globalAlpha = i === 1 ? 0.55 : 1;
      roundRect(
        ctx,
        inner.x + i * (cardW + w * 0.02),
        cardY,
        cardW,
        cardH,
        h * 0.03,
      );
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Dessine le visuel du projet et le renvoie en PNG. */
export async function renderHubLocalVisual(
  projectName: string,
  brief: HubProjectBrief,
  format: HubVisualFormat,
  styleIndex: number,
): Promise<Blob> {
  const [width, height] = HUB_VISUAL_FORMATS[format].size
    .split("x")
    .map(Number);
  const style = HUB_VISUAL_STYLES[styleIndex % HUB_VISUAL_STYLES.length];
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  await Promise.all([
    document.fonts.load(`bold 64px ${family}`),
    document.fonts.load(`64px ${family}`),
  ]).catch(() => undefined);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error("le navigateur ne permet pas de dessiner le visuel.");

  // Fond : dégradé + halos décoratifs.
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, style.from);
  gradient.addColorStop(1, style.to);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  const unit = Math.min(width, height);
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = style.accent;
  ctx.beginPath();
  ctx.arc(width * 0.95, height * 0.05, unit * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  ctx.arc(width * 0.02, height * 0.98, unit * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const pad = unit * 0.08;
  const landscape = format === "landscape";
  const textWidth = landscape ? width * 0.52 : width - pad * 2;
  ctx.textBaseline = "top";
  let y = pad;

  // Étiquette.
  const labelSize = unit * 0.032;
  ctx.font = `bold ${labelSize}px ${family}`;
  const label = "NOUVEAU SITE WEB";
  const labelW = ctx.measureText(label).width + labelSize * 1.6;
  ctx.fillStyle = style.accent;
  roundRect(ctx, pad, y, labelW, labelSize * 2, labelSize);
  ctx.fill();
  ctx.fillStyle = "#0b0b10";
  ctx.fillText(label, pad + labelSize * 0.8, y + labelSize * 0.5);
  y += labelSize * 3;

  // Titre : réduit jusqu'à tenir sur 3 lignes.
  const name = projectName.trim() || "Mon projet";
  let titleSize = unit * (landscape ? 0.12 : 0.11);
  let title = { lines: [name], fits: true };
  for (; titleSize > unit * 0.05; titleSize *= 0.9) {
    ctx.font = `bold ${titleSize}px ${family}`;
    title = wrapLines(ctx, name, textWidth, 3);
    if (title.fits) break;
  }
  ctx.fillStyle = "#ffffff";
  for (const line of title.lines) {
    ctx.fillText(line, pad, y);
    y += titleSize * 1.12;
  }
  y += titleSize * 0.3;

  // Accroche.
  const pitchSize = Math.max(unit * 0.042, titleSize * 0.4);
  ctx.font = `${pitchSize}px ${family}`;
  ctx.fillStyle = "#f4f4f5";
  for (const line of wrapLines(
    ctx,
    tagline(name, brief),
    textWidth,
    format === "portrait" ? 5 : 3,
  ).lines) {
    ctx.fillText(line, pad, y);
    y += pitchSize * 1.35;
  }
  y += pitchSize * 0.6;

  // Mots-clés en pastilles.
  const chipSize = unit * 0.03;
  ctx.font = `bold ${chipSize}px ${family}`;
  let chipX = pad;
  for (const word of keywordList(brief.keywords)) {
    const chipW = ctx.measureText(word).width + chipSize * 1.6;
    if (chipX + chipW > pad + textWidth) break;
    ctx.strokeStyle = style.accent;
    ctx.lineWidth = Math.max(2, chipSize * 0.12);
    roundRect(ctx, chipX, y, chipW, chipSize * 2, chipSize);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(word, chipX + chipSize * 0.8, y + chipSize * 0.5);
    chipX += chipW + chipSize * 0.6;
  }
  if (chipX > pad) y += chipSize * 3;

  // Appel à l'action, en bas.
  const ctaSize = unit * 0.036;
  ctx.font = `bold ${ctaSize}px ${family}`;
  const cta = "Découvrez-le en ligne →";
  const ctaY = height - pad - ctaSize * 2.2;
  ctx.fillStyle = "#ffffff";
  roundRect(
    ctx,
    pad,
    ctaY,
    ctx.measureText(cta).width + ctaSize * 2,
    ctaSize * 2.2,
    ctaSize * 1.1,
  );
  ctx.fill();
  ctx.fillStyle = style.from;
  ctx.fillText(cta, pad + ctaSize, ctaY + ctaSize * 0.6);

  // Illustration : à droite en paysage, sinon dans l'espace libre restant.
  if (landscape) {
    const w = width * 0.36;
    drawBrowser(
      ctx,
      width - pad - w,
      (height - w * 0.75) / 2,
      w,
      w * 0.75,
      style.accent,
    );
  } else {
    const free = ctaY - pad * 0.5 - y;
    if (free > unit * 0.18) {
      const w = Math.min(width - pad * 2, (free * 4) / 3);
      drawBrowser(ctx, width - pad - w, y, w, w * 0.75, style.accent);
    }
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("impossible de créer l'image.")),
      "image/png",
    ),
  );
}
