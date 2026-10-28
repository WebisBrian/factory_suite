import type { Metadata } from "next";
import { ScreendraftEditor } from "@/components/screendraft/ScreendraftEditor";
import { maquetteFixture } from "@/components/screendraft/temp-fixture";

export const metadata: Metadata = {
  title: "Screendraft — FactorySuite",
  description: "Créez des maquettes de sites web à partir de composants.",
};

// Mode démo : l'éditeur ouvre la fixture. La lecture du projet (?project_id=) viendra avec project-fs.
export default function ScreendraftPage() {
  return <ScreendraftEditor initialDraft={maquetteFixture} />;
}
