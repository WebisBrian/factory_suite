import Editor from "./_components/Editor";
import type { ScreenDraftDocument } from "./_lib/schema";
import example from "./_lib/schema.example.json";

// En attendant l'enregistrement dans les projets, l'éditeur ouvre l'exemple.
// Un import JSON perd les types littéraux ("section", 1 | 2 | 3…), d'où l'assertion.
const exampleDraft = example as ScreenDraftDocument;

export default function ScreenDraftPage() {
  return <Editor draft={exampleDraft} />;
}
