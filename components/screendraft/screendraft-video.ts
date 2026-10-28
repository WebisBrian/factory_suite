import type { VideoNode } from "@/components/screendraft/screendraft-schema";

export type ParsedVideoUrl =
  | { ok: true; src: string; kind: VideoNode["props"]["kind"] }
  | { ok: false; error: string };

const YOUTUBE_ID = /^[\w-]{11}$/;
const VIDEO_FILE = /\.(mp4|webm|ogg|ogv|mov)$/i;

/**
 * Transforme le lien collé par l'utilisateur en URL lisible telle quelle :
 * lecteur intégrable dans une iframe (YouTube, Vimeo) ou fichier vidéo.
 * La vidéo n'est jamais téléchargée ni copiée dans le projet, seul le lien est gardé.
 */
export function parseVideoUrl(input: string): ParsedVideoUrl {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { ok: false, error: "ce n'est pas une adresse web valide (elle doit commencer par https://)." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "le lien doit commencer par https://." };
  }

  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  const youtubeId = findYoutubeId(host, url);
  if (youtubeId) return { ok: true, kind: "embed", src: `https://www.youtube-nocookie.com/embed/${youtubeId}` };

  const vimeoId = host === "vimeo.com" || host === "player.vimeo.com" ? url.pathname.match(/(\d+)\/?$/)?.[1] : undefined;
  if (vimeoId) return { ok: true, kind: "embed", src: `https://player.vimeo.com/video/${vimeoId}` };

  if (VIDEO_FILE.test(url.pathname)) return { ok: true, kind: "file", src: url.href };

  return {
    ok: false,
    error: "lien non reconnu. Utilisez une vidéo YouTube, Vimeo ou un fichier .mp4, .webm ou .ogg.",
  };
}

function findYoutubeId(host: string, url: URL): string | undefined {
  let id: string | null | undefined;
  if (host === "youtu.be") id = url.pathname.split("/")[1];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, first, second] = url.pathname.split("/");
    id = first === "watch" ? url.searchParams.get("v") : ["embed", "shorts", "live"].includes(first) ? second : null;
  }
  return id && YOUTUBE_ID.test(id) ? id : undefined;
}
