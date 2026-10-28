// Moteur de l'assistant du Hub. Pour l'instant un bouchon : l'interface est prête,
// la compréhension des demandes et les actions (projets, outils) viendront ensuite.

export type HubChatAuthor = "user" | "assistant";

export interface HubChatMessage {
  id: number;
  author: HubChatAuthor;
  text: string;
  /** Réponse d'erreur : affichée avec le préfixe « Erreur : » (pas seulement en couleur). */
  isError?: boolean;
}

export interface HubChatReply {
  text: string;
  isError?: boolean;
}

/** Exemples proposés sous le champ de saisie. */
export const HUB_CHAT_SUGGESTIONS: readonly string[] = [
  "Crée un projet Boulangerie",
  "Où en est le projet 1 ?",
  "Ouvre Screendraft pour le projet 1",
];

export const HUB_CHAT_WELCOME =
  "Bonjour, je suis l'assistant FactorySuite. Décrivez ce que vous voulez faire : créer un projet, suivre son avancement ou ouvrir un outil.";

export async function respondToHubChat(request: string): Promise<HubChatReply> {
  return {
    text: `J'ai bien reçu « ${request} », mais je ne sais pas encore exécuter de demande. Cette fonction arrive bientôt.`,
  };
}
