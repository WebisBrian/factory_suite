import { validateMaquette } from "@/app/codeforge/generator/_lib/maquette";
import fixture from "@/app/codeforge/generator/_lib/maquette.fixture.json";

// Maquette de démo (copie de l'exemple Screendraft), utilisée sans project_id.
// À remplacer par `maquetteFixture` de `@/lib/fixtures` dès que le Hub le publie.
const parsed = validateMaquette(fixture);
if (!parsed.ok) throw new Error(parsed.errors.join("\n"));
export const maquetteFixture = parsed.maquette;
