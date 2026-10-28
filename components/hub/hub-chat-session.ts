// Conversation de l'assistant gardée le temps de l'onglet (sessionStorage) : le parcours guidé
// fait quitter le Hub pour un outil, la conversation doit être là au retour.
// Donnée propre au Hub, jamais lue par les outils (les échanges entre outils passent par les fichiers projet).

import type { HubChatMessage } from "@/components/hub/hub-chat";
import type { HubGuide } from "@/components/hub/hub-chat-guide";

const STORAGE_KEY = "factorysuite-hub-assistant";

export interface HubChatSession {
  messages: HubChatMessage[];
  guide: HubGuide | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMessage(value: unknown): value is HubChatMessage {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    (value.author === "user" || value.author === "assistant") &&
    typeof value.text === "string"
  );
}

function isGuide(value: unknown): value is HubGuide {
  return (
    isRecord(value) &&
    typeof value.projectId === "number" &&
    typeof value.projectName === "string" &&
    typeof value.step === "number" &&
    typeof value.stepStartedAt === "number"
  );
}

/** Session enregistrée, ou null (absente, illisible ou stockage bloqué). */
export function loadHubChatSession(): HubChatSession | null {
  try {
    const data: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (!isRecord(data) || !Array.isArray(data.messages) || !data.messages.every(isMessage)) return null;
    return { messages: data.messages, guide: isGuide(data.guide) ? data.guide : null };
  } catch {
    return null;
  }
}

export function saveHubChatSession(session: HubChatSession): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Stockage plein ou bloqué : la conversation reste utilisable, elle ne survivra juste pas au départ du Hub.
  }
}
