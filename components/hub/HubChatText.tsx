// Mise en forme des messages de l'assistant, à partir d'un texte simple :
// - ligne vide : nouveau paragraphe ;
// - « • » en début de ligne : liste à puces ; « 1. » : liste numérotée ; « ✓ » : étapes validées ;
// - **texte** : gras (<strong>).
// Le rendu reste du HTML sémantique (listes, paragraphes) : lu correctement par les lecteurs d'écran.

type BlockKind = "paragraph" | "bullets" | "numbers" | "checks";

interface Block {
  kind: BlockKind;
  lines: string[];
}

const LINE_PREFIXES: readonly [BlockKind, RegExp][] = [
  ["bullets", /^•\s+/],
  ["numbers", /^\d+\.\s+/],
  ["checks", /^✓\s+/],
];

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of text.split(/\n\s*\n/)) {
    let current = null as Block | null;
    for (const line of chunk.split("\n")) {
      if (line.trim() === "") continue;
      const prefix = LINE_PREFIXES.find(([, pattern]) => pattern.test(line));
      const kind = prefix?.[0] ?? "paragraph";
      const content = prefix ? line.replace(prefix[1], "") : line;
      if (current?.kind !== kind) {
        current = { kind, lines: [] };
        blocks.push(current);
      }
      current.lines.push(content);
    }
  }
  return blocks;
}

function HubChatInline({ text }: { text: string }) {
  // Indices impairs : texte entre ** **.
  return text.split(/\*\*(.+?)\*\*/).map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-bold text-white">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

/** Texte sans balises de mise en forme, pour les annonces des lecteurs d'écran. */
export function hubChatPlainText(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^[•✓]\s+/gm, "");
}

export function HubChatText({ text, prefix }: { text: string; prefix?: React.ReactNode }) {
  const blocks = parseBlocks(text);
  const startsWithParagraph = blocks[0]?.kind === "paragraph";
  return (
    <div className="flex flex-col gap-2">
      {prefix && !startsWithParagraph && <p>{prefix}</p>}
      {blocks.map((block, index) => {
        const items = block.lines.map((line, i) => (
          <li key={i}>
            {block.kind === "checks" && (
              <span aria-hidden className="mr-2 font-bold text-sky-300">
                ✓
              </span>
            )}
            <HubChatInline text={line} />
          </li>
        ));
        switch (block.kind) {
          case "bullets":
            return (
              <ul key={index} className="flex list-disc flex-col gap-1 pl-5">
                {items}
              </ul>
            );
          case "numbers":
            return (
              <ol key={index} className="flex list-decimal flex-col gap-1 pl-6">
                {items}
              </ol>
            );
          case "checks":
            return (
              <ul key={index} className="flex flex-col gap-1">
                {items}
              </ul>
            );
          case "paragraph":
            return (
              <p key={index}>
                {index === 0 && prefix}
                {block.lines.map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    <HubChatInline text={line} />
                  </span>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
