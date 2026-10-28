"use client";

import { useEffect, useId, useRef, useState } from "react";
import { HubLogo } from "@/components/hub/HubAppIcon";
import {
  HUB_CHAT_SUGGESTIONS,
  HUB_CHAT_WELCOME,
  respondToHubChat,
  type HubChatMessage,
} from "@/components/hub/hub-chat";
import { hubInput, hubPrimaryButton, hubSectionLabel, hubSmallButton } from "@/components/hub/hub-styles";

const WELCOME: HubChatMessage = { id: 0, author: "assistant", text: HUB_CHAT_WELCOME };

function HubChatBubble({ message }: { message: HubChatMessage }) {
  const fromUser = message.author === "user";
  return (
    // L'auteur est écrit en toutes lettres : l'alignement et la couleur ne sont qu'un indice de plus.
    <li className={`flex ${fromUser ? "justify-end" : ""}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-2 text-base break-words ${
          message.isError
            ? "border-2 border-red-400 bg-red-950/60 text-red-50"
            : fromUser
              ? "border-2 border-violet-300 bg-violet-950 text-white"
              : "border border-zinc-500 bg-[#1b1b24] text-zinc-100"
        }`}
      >
        <p className="text-sm font-bold text-zinc-200">{fromUser ? "Vous" : "Assistant"}</p>
        <p className="whitespace-pre-line">
          {message.isError && <strong className="font-bold text-white">Erreur : </strong>}
          {message.text}
        </p>
      </div>
    </li>
  );
}

/**
 * Assistant du Hub : bouton flottant qui ouvre une fenêtre modale (<dialog> natif).
 * showModal() gère le piège du focus, la touche Échap et rend le reste de la page inerte.
 */
export function HubChat() {
  const [messages, setMessages] = useState<HubChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [announcement, setAnnouncement] = useState("");
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

  function openChat() {
    dialogRef.current?.showModal();
    scrollToLastMessage();
    inputRef.current?.focus();
  }

  function closeChat() {
    dialogRef.current?.close();
  }

  function push(message: Omit<HubChatMessage, "id">) {
    const id = nextId.current++;
    setMessages((previous) => [...previous, { ...message, id }]);
  }

  async function send(text: string) {
    const request = text.trim();
    if (!request || pending) return;
    push({ author: "user", text: request });
    setDraft("");
    setPending(true);
    setAnnouncement("L'assistant prépare sa réponse…");
    try {
      const reply = await respondToHubChat(request);
      push({ author: "assistant", text: reply.text, isError: reply.isError });
      setAnnouncement(`Assistant : ${reply.isError ? "Erreur : " : ""}${reply.text}`);
    } catch (e) {
      const text = e instanceof Error ? e.message : String(e);
      push({ author: "assistant", text, isError: true });
      setAnnouncement(`Assistant : Erreur : ${text}`);
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(draft);
  }

  function handleClear() {
    setMessages([WELCOME]);
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
        className="fixed right-4 bottom-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-zinc-300 bg-[#14141b] py-2 pr-5 pl-2 text-base font-bold text-white shadow-lg shadow-black/50 transition-colors hover:bg-[#1f1f2a]"
      >
        <HubLogo size="sm" />
        Assistant
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

          {/* Zone défilante focusable : on peut la parcourir au clavier (flèches). */}
          <div
            ref={logRef}
            tabIndex={0}
            aria-label="Conversation avec l'assistant"
            className="min-h-32 flex-1 overflow-y-auto rounded-xl border border-zinc-700 bg-[#0f0f15] p-3"
          >
            <ol className="flex flex-col gap-3">
              {messages.map((message) => (
                <HubChatBubble key={message.id} message={message} />
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
                      onClick={() => void send(suggestion)}
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
