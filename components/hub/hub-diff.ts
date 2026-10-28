export interface HubDiffLine {
  kind: "same" | "added" | "removed";
  text: string;
}

/** Au-delà, le calcul (LCS en O(n×m)) serait trop lourd pour le navigateur. */
const MAX_CELLS = 4_000_000;

/** JSON reformaté sur plusieurs lignes, pour que le diff soit lisible même si le fichier est minifié. */
export function hubComparableText(filename: string, text: string): string {
  if (!filename.toLowerCase().endsWith(".json")) return text;
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

/** Diff ligne à ligne. Renvoie null si les fichiers sont trop gros pour être comparés. */
export function hubDiffLines(before: string, after: string): HubDiffLine[] | null {
  const a = before === "" ? [] : before.split("\n");
  const b = after === "" ? [] : after.split("\n");
  if (a.length * b.length > MAX_CELLS) return null;

  // lcs[i][j] = longueur de la plus longue sous-séquence commune de a[i..] et b[j..]
  const lcs = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const lines: HubDiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      lines.push({ kind: "same", text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      lines.push({ kind: "removed", text: a[i++] });
    } else {
      lines.push({ kind: "added", text: b[j++] });
    }
  }
  while (i < a.length) lines.push({ kind: "removed", text: a[i++] });
  while (j < b.length) lines.push({ kind: "added", text: b[j++] });
  return lines;
}
