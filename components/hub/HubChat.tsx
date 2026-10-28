"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { ProjectInfo } from "@/lib/project-fs";
import { HubLogo } from "@/components/hub/HubAppIcon";
import { HubChatText, hubChatPlainText } from "@/components/hub/HubChatText";
import {
  HUB_CHAT_SUGGESTIONS,
  HUB_CHAT_WELCOME,
  isHubChatNo,
  isHubChatYes,
  respondToHubChat,
  type HubChatConfirmation,
  type HubChatMessage,
  type HubChatReply,
} from "@/components/hub/hub-chat";
import { checkHubGuide, stopHubGuide, type HubGuide } from "@/components/hub/hub-chat-guide";
import { loadHubChatSession, saveHubChatSession } from "@/components/hub/hub-chat-session";
import {
  hubDangerButton,
  hubInput,
  hubPrimaryButton,
  hubSectionLabel,
  hubSmallButton,
} from "@/components/hub/hub-styles";
import { HUB_TOOLS } from "@/components/hub/hub-tools";

const WELCOME: HubChatMessage = { id: 0, author: "assistant", text: HUB_CHAT_WELCOME };

type PendingConfirmation = HubChatConfirmation & { messageId: number };

function HubChatBubble({
  message,
  showActions,
  children,
}: {
  message: HubChatMessage;
  /** Liens affichés sur le dernier message seulement : ceux des anciens messages seraient périmés. */
  showActions: boolean;
  children?: React.ReactNode;
}) {
  const fromUser = message.author === "user";
  return (
    // L'auteur est écrit en toutes lettres : l'alignement et la couleur ne sont qu'un indice de plus.
    <li className={`flex ${fromUser ? "justify-end" : ""}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 text-base break-words ${
          message.isError
            ? "border-2 border-red-400 bg-red-950/60 text-red-50"
            : fromUser
              ? "border-2 border-violet-300 bg-violet-950 text-white"
              : "border border-zinc-500 bg-[#1b1b24] text-zinc-100"
        }`}
      >
        <p className="mb-1 text-sm font-bold text-zinc-200">{fromUser ? "Vous" : "Assistant"}</p>
        {fromUser ? (
          <p className="whitespace-pre-line">{message.text}</p>
        ) : (
          <HubChatText
            text={message.text}
            prefix={message.isError && <strong className="font-bold text-white">Erreur : </strong>}
          />
        )}
        {showActions && message.actions && message.actions.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {message.actions.map((action) => (
              <li key={action.href}>
                <Link href={action.href} className={hubPrimaryButton}>
                  {action.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {children}
      </div>
    </li>
  );
}

/** Largeur maximale du bouton d'ouverture, bordure comprise (classe max-w-[8rem]). */
const LAUNCHER_MAX_WIDTH_REM = 8;
/** En dessous de cette largeur de contenu, on ne lui réserve pas de colonne : il passe en barre en bas. */
const MIN_CONTENT_WIDTH_REM = 28;

/**
 * Assistant du Hub : bouton flottant qui ouvre une fenêtre modale (<dialog> natif).
 * showModal() gère le piège du focus, la touche Échap et rend le reste de la page inerte.
 */
export function HubChat() {
  const [messages, setMessages] = useState<HubChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(null);
  const [guide, setGuide] = useState<HubGuide | null>(null);
  const [currentProject, setCurrentProject] = useState<ProjectInfo | null>(null);
  /** Parcours en cours au chargement du Hub : l'utilisateur revient d'un outil, on vérifiera l'étape. */
  const [guideCheckDue, setGuideCheckDue] = useState(false);
  const [restored, setRestored] = useState(false);
  const router = useRouter();
  const nextId = useRef(1);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const inputId = useId();
  const suggestionsId = useId();

  function scrollToLastMessage() {
    const log = logRef.current;
    // Défilement instantané : aucun mouvement animé.
    if (log) log.scrollTop = log.scrollHeight;
  }

  useEffect(scrollToLastMessage, [messages, pending]);

  // Reprise de la conversation après un passage dans un outil. Lue après le montage :
  // le rendu de l'export statique n'a pas de sessionStorage.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(loadHubChatSession()).then((session) => {
      if (cancelled) return;
      if (session && session.messages.length > 0) {
        setMessages(session.messages);
        setGuide(session.guide);
        setCurrentProject(session.currentProject);
        setGuideCheckDue(session.guide !== null);
        nextId.current = Math.max(...session.messages.map((message) => message.id)) + 1;
      }
      setRestored(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (restored) saveHubChatSession({ messages, guide, currentProject });
  }, [messages, guide, currentProject, restored]);

  // Le bouton reste visible pendant le défilement sans jamais recouvrir le contenu :
  // - "margin" : il flotte dans la marge vide à droite du contenu ;
  // - "reserve" : marge trop étroite → la page se resserre à droite pour lui laisser une colonne libre ;
  // - "bar" : petit écran → barre fixe en bas (le bas de page a déjà une marge pour qu'elle ne cache rien).
  // Mesuré en rem → suit le réglage A−/A+.
  const [launcherMode, setLauncherMode] = useState<"margin" | "reserve" | "bar">("margin");
  useEffect(() => {
    const page = launcherRef.current?.parentElement;
    if (!page) return;
    const basePadding = parseFloat(getComputedStyle(page).paddingRight);
    const measure = () => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const needed = LAUNCHER_MAX_WIDTH_REM * rem + 2 * rem;
      const pageRect = page.getBoundingClientRect();
      const margin = document.documentElement.clientWidth - (pageRect.right - basePadding);
      const extra = Math.max(0, needed - margin);
      const contentWidth = pageRect.width - 2 * basePadding - extra;
      const mode = extra === 0 ? "margin" : contentWidth >= MIN_CONTENT_WIDTH_REM * rem ? "reserve" : "bar";
      page.style.paddingRight = mode === "reserve" ? `${basePadding + extra}px` : "";
      setLauncherMode(mode);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(page);
    observer.observe(document.documentElement);
    return () => {
      observer.disconnect();
      page.style.paddingRight = "";
    };
  }, []);

  function openChat() {
    dialogRef.current?.showModal();
    scrollToLastMessage();
    if (guide && guideCheckDue && !pending) {
      setGuideCheckDue(false);
      // Vérification lancée depuis ce clic : Chrome peut y redemander l'accès au dossier.
      void answer(() => checkHubGuide(guide, false));
    } else {
      inputRef.current?.focus();
    }
  }

  function closeChat() {
    dialogRef.current?.close();
  }

  function push(message: Omit<HubChatMessage, "id">): number {
    const id = nextId.current++;
    setMessages((previous) => [...previous, { ...message, id }]);
    return id;
  }

  async function answer(getReply: () => Promise<HubChatReply>) {
    setPending(true);
    setAnnouncement("L'assistant prépare sa réponse…");
    let reply: HubChatReply;
    try {
      reply = await getReply();
    } catch (e) {
      reply = { text: e instanceof Error ? e.message : String(e), isError: true };
    }
    const id = push({ author: "assistant", text: reply.text, isError: reply.isError, actions: reply.actions });
    if (reply.guide !== undefined) setGuide(reply.guide);
    if (reply.currentProject !== undefined) setCurrentProject(reply.currentProject);
    setAnnouncement(`Assistant : ${reply.isError ? "Erreur : " : ""}${hubChatPlainText(reply.text)}`);
    setPending(false);
    if (reply.navigateTo) {
      closeChat();
      router.push(reply.navigateTo);
    } else if (reply.confirmation) {
      // Le focus ira sur « Annuler » (autoFocus) : le choix sans risque est celui par défaut.
      setConfirmation({ ...reply.confirmation, messageId: id });
    } else {
      inputRef.current?.focus();
    }
  }

  function send(text: string) {
    const request = text.trim();
    if (!request || pending) return;
    push({ author: "user", text: request });
    setDraft("");
    const awaiting = confirmation;
    setConfirmation(null);
    if (awaiting && isHubChatYes(request)) void answer(awaiting.run);
    else if (awaiting && isHubChatNo(request)) void answer(async () => ({ text: awaiting.cancelText }));
    // Autre demande pendant une confirmation : l'action en attente est abandonnée.
    else void answer(() => respondToHubChat(request, { guide, currentProject }));
  }

  function handleConfirm(awaiting: PendingConfirmation) {
    setConfirmation(null);
    push({ author: "user", text: awaiting.label });
    void answer(awaiting.run);
  }

  function handleCancel(awaiting: PendingConfirmation) {
    setConfirmation(null);
    push({ author: "user", text: "Annuler" });
    void answer(async () => ({ text: awaiting.cancelText }));
  }

  function handleStopGuide(current: HubGuide) {
    push({ author: "user", text: "Arrêter le parcours" });
    void answer(async () => stopHubGuide(current));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(draft);
  }

  function handleClear() {
    setMessages([WELCOME]);
    setConfirmation(null);
    // Nouvelle conversation : on oublie le projet dont on parlait (le parcours guidé, lui, continue).
    setCurrentProject(null);
    setAnnouncement("Conversation effacée.");
    inputRef.current?.focus();
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={openChat}
        aria-haspopup="dialog"
        // Compact (en colonne, 8rem max) pour tenir dans la marge ; en barre pleine largeur sur petit écran.
        className={`fixed z-40 flex items-center justify-center gap-x-2 gap-y-1 border-zinc-300 bg-[#14141b] px-3 py-2 text-center text-base font-bold text-white shadow-lg shadow-black/50 transition-colors hover:bg-[#1f1f2a] ${
          launcherMode === "bar"
            ? "inset-x-0 bottom-0 min-h-14 flex-row flex-wrap border-t-2"
            : "right-4 bottom-4 max-w-[8rem] flex-col rounded-2xl border-2"
        }`}
      >
        <HubLogo size="sm" />
        Assistant
        {guide && (
          <span className="text-sm font-semibold text-zinc-200">
            {guideCheckDue ? "Vérifier l'étape" : "Étape"} {guide.step + 1} sur {HUB_TOOLS.length}
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        // Retour du focus sur le bouton d'ouverture, quelle que soit la façon de fermer (Échap, ×).
        onClose={() => launcherRef.current?.focus()}
        // Clic sur le fond assombri (hors du panneau) : ferme la fenêtre.
        onClick={(event) => event.target === event.currentTarget && closeChat()}
        className="fixed inset-auto right-4 bottom-4 m-0 max-h-[calc(100dvh-2rem)] w-[min(30rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-zinc-500 bg-[#14141b] p-0 text-zinc-100 shadow-2xl shadow-black/60 backdrop:bg-black/60"
      >
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col gap-3 p-4">
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HubLogo size="sm" />
              <h2 id={titleId} className="text-xl font-bold text-white">
                Assistant
              </h2>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleClear} disabled={messages.length === 1} className={hubSmallButton}>
                Effacer
              </button>
              <button type="button" onClick={closeChat} aria-label="Fermer l'assistant" className={hubSmallButton}>
                <span aria-hidden className="text-xl leading-none">
                  ×
                </span>
              </button>
            </div>
          </header>

          {/* Le parcours guidé a son propre bandeau, qui nomme déjà le projet. */}
          {!guide && currentProject && (
            <p className="rounded-xl border border-zinc-500 px-3 py-2 text-base text-zinc-100">
              <strong className="font-bold text-white">Projet en cours :</strong> {currentProject.name} (n°
              {currentProject.id})
            </p>
          )}

          {guide && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-sky-300 bg-sky-950/50 px-3 py-2">
              <p className="text-base text-zinc-100">
                <strong className="font-bold text-white">Parcours guidé :</strong> {guide.projectName}, étape{" "}
                {guide.step + 1} sur {HUB_TOOLS.length} ({HUB_TOOLS[guide.step].label})
              </p>
              <button
                type="button"
                onClick={() => handleStopGuide(guide)}
                disabled={pending}
                aria-label={`Arrêter le parcours guidé du projet ${guide.projectName}`}
                className={hubSmallButton}
              >
                Arrêter
              </button>
            </div>
          )}

          {/* Zone défilante focusable : on peut la parcourir au clavier (flèches). */}
          <div
            ref={logRef}
            tabIndex={0}
            aria-label="Conversation avec l'assistant"
            className="min-h-32 flex-1 overflow-y-auto rounded-xl border border-zinc-700 bg-[#0f0f15] p-3"
          >
            <ol className="flex flex-col gap-4">
              {messages.map((message, index) => (
                <HubChatBubble key={message.id} message={message} showActions={index === messages.length - 1}>
                  {confirmation?.messageId === message.id && (
                    <div role="group" aria-label="Confirmer l'action" className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCancel(confirmation)}
                        autoFocus
                        className={hubSmallButton}
                      >
                        Annuler
                      </button>
                      <button type="button" onClick={() => handleConfirm(confirmation)} className={hubDangerButton}>
                        {confirmation.label}
                      </button>
                    </div>
                  )}
                </HubChatBubble>
              ))}
            </ol>
            {pending && (
              <p aria-hidden className="mt-3 text-base text-zinc-300">
                L&apos;assistant prépare sa réponse…
              </p>
            )}
          </div>

          {/* Seules les réponses de l'assistant sont annoncées, pas la demande qu'on vient de taper. */}
          <p role="status" className="sr-only">
            {announcement}
          </p>

          {messages.length === 1 && (
            <div role="group" aria-labelledby={suggestionsId} className="flex flex-col gap-2">
              <p id={suggestionsId} className={hubSectionLabel}>
                Exemples de demandes
              </p>
              <ul className="flex flex-wrap gap-2">
                {HUB_CHAT_SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => send(suggestion)}
                      disabled={pending}
                      aria-label={`Envoyer la demande : ${suggestion}`}
                      className={hubSmallButton}
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-1">
            <label htmlFor={inputId} className="text-base font-semibold text-zinc-100">
              Votre demande
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                ref={inputRef}
                id={inputId}
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={500}
                autoComplete="off"
                className={`min-w-0 flex-1 ${hubInput}`}
              />
              <button type="submit" disabled={pending || draft.trim() === ""} className={hubPrimaryButton}>
                {pending ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
