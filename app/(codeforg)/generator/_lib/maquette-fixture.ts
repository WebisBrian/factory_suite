import type { Maquette } from "@/app/(codeforg)/generator/_lib/maquette";
import fixture from "@/app/(codeforg)/generator/_lib/maquette.fixture.json";

// Maquette de démo (copie de l'exemple Screendraft), utilisée sans project_id.
// À remplacer par `maquetteFixture` de `@/lib/fixtures` dès que le Hub le publie.
// Un import JSON perd les types littéraux ("section", 1 | 2 | 3…), d'où l'assertion.
export const maquetteFixture = fixture as Maquette;
