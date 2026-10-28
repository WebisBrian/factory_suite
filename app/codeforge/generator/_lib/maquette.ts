/**
 * Contrat de la maquette reçue de Screendraft (fichier `maquette.json`).
 *
 * Contrat local compatible Screendraft v2 : un squad n'importe pas le
 * code d'un autre. À remplacer par `@/lib/contracts` dès que le Hub le publie.
 */

export const MAQUETTE_FILE = "maquette.json";
export const SUPPORTED_SCHEMA_VERSION = 2;

export type HexColor = `#${string}`;

export type Maquette = {
  schemaVersion: typeof SUPPORTED_SCHEMA_VERSION;
  id: string;
  name: string;
  screens: [MaquetteScreen, ...MaquetteScreen[]];
};

export type MaquetteScreen = {
  id: string;
  name: string;
  path: string;
  frame: MaquetteFrame;
  nodes: MaquetteNode[];
};

export type MaquetteFrame = {
  device: "desktop" | "mobile";
  width: number;
  height: number;
  backgroundColor: HexColor;
};

export type MaquetteNodeStyle = {
  backgroundColor?: HexColor;
  color?: HexColor;
  fontSize?: number;
  fontWeight?: 400 | 500 | 600 | 700;
  textAlign?: "left" | "center" | "right";
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: HexColor;
};

type BaseNode = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: MaquetteNodeStyle;
};

export type MaquetteNode =
  | (BaseNode & { type: "section"; children: MaquetteNode[] })
  | (BaseNode & { type: "title"; props: { text: string; level: 1 | 2 | 3 } })
  | (BaseNode & { type: "text"; props: { text: string } })
  | (BaseNode & { type: "image"; props: { src: string; alt: string; fit: "cover" | "contain" } })
  | (BaseNode & { type: "button"; props: { label: string; href?: string; targetScreenId?: string } })
  | (BaseNode & { type: "shape"; props: { shape: "circle" | "rectangle" | "triangle" } })
  | (BaseNode & { type: "video"; props: { src: string; kind: "embed" | "file"; title: string } })
  | (BaseNode & {
      type: "map";
      props: { latitude: number; longitude: number; zoom: number; title: string; markers: MaquetteMapMarker[] };
    });

export type MaquetteMapMarker = { id: string; label: string; latitude: number; longitude: number };

export type MaquetteNodeType = MaquetteNode["type"];

export type ParseResult = { ok: true; maquette: Maquette } | { ok: false; errors: string[] };

type Json = Record<string, unknown>;

const NODE_TYPES: readonly string[] = ["section", "title", "text", "image", "button", "shape", "video", "map"];
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const MAX_ERRORS = 20;

/** Lit un texte JSON et vérifie qu'il respecte le contrat de la maquette. */
export function parseMaquette(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { ok: false, errors: [`Le fichier n'est pas un JSON valide : ${detail}`] };
  }
  return validateMaquette(data);
}

export function validateMaquette(data: unknown): ParseResult {
  const errors: string[] = [];
  const fail = (path: string, message: string) => errors.push(`${path} : ${message}`);

  if (!isObject(data)) return { ok: false, errors: ["La racine du JSON doit être un objet."] };

  if (data.schemaVersion !== 1 && data.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    return {
      ok: false,
      errors: [
        `schemaVersion ${JSON.stringify(data.schemaVersion)} non pris en charge (attendu : 1 ou ${SUPPORTED_SCHEMA_VERSION}).`,
      ],
    };
  }
  checkString(data, "id", "racine", fail);
  checkString(data, "name", "racine", fail);

  // Les anciennes maquettes à un écran restent importables.
  const screens = data.schemaVersion === 1
    ? [{ id: data.id, name: data.name, path: "page.html", frame: data.frame, nodes: data.nodes }]
    : data.screens;
  const ids = new Set<string>();
  const screenIds = new Set<string>();
  const paths = new Set<string>();
  if (!Array.isArray(screens) || screens.length === 0) {
    fail("screens", "au moins un écran attendu");
  } else {
    screens.forEach((screen, i) => {
      const at = `screens[${i}]`;
      if (!isObject(screen)) { fail(at, "objet attendu"); return; }
      checkString(screen, "name", at, fail);
      if (typeof screen.id !== "string" || screen.id.length === 0 || screenIds.has(screen.id)) {
        fail(`${at}.id`, "identifiant non vide et unique attendu");
      } else screenIds.add(screen.id);
      // Noms plats compatibles avec le ZIP, les liens locaux et project-fs.
      if (typeof screen.path !== "string" || !/^[a-z0-9][a-z0-9_-]*\.html$/i.test(screen.path) || screen.path.length > 200) {
        fail(`${at}.path`, "nom de fichier HTML attendu (ex. contact.html)");
      } else if (paths.has(screen.path.toLowerCase())) {
        fail(`${at}.path`, "nom de fichier déjà utilisé");
      } else paths.add(screen.path.toLowerCase());
      validateScreen(screen, at, ids, fail);
    });
    const checkTargets = (nodes: unknown) => {
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        if (!isObject(node)) continue;
        if (node.type === "button" && isObject(node.props) && typeof node.props.targetScreenId === "string" && !screenIds.has(node.props.targetScreenId)) {
          fail(`bouton ${String(node.id)}`, "écran cible introuvable");
        }
        if (node.type === "section") checkTargets(node.children);
      }
    };
    screens.forEach((screen) => { if (isObject(screen)) checkTargets(screen.nodes); });
  }

  if (errors.length > 0) {
    const extra = errors.length - MAX_ERRORS;
    return { ok: false, errors: extra > 0 ? [...errors.slice(0, MAX_ERRORS), `… et ${extra} autre(s) erreur(s).`] : errors };
  }
  return { ok: true, maquette: { schemaVersion: SUPPORTED_SCHEMA_VERSION, id: data.id as string, name: data.name as string, screens: screens as Maquette["screens"] } };
}

function validateScreen(data: Json, path: string, ids: Set<string>, fail: (path: string, message: string) => void) {
  if (!isObject(data.frame)) {
    fail(`${path}.frame`, "objet attendu");
  } else {
    const frame = data.frame;
    if (frame.device !== "desktop" && frame.device !== "mobile") fail(`${path}.frame.device`, '"desktop" ou "mobile" attendu');
    checkPositive(frame, "width", `${path}.frame`, fail);
    checkPositive(frame, "height", `${path}.frame`, fail);
    checkColor(frame, "backgroundColor", `${path}.frame`, fail);
  }

  if (!Array.isArray(data.nodes)) {
    fail(`${path}.nodes`, "tableau attendu");
  } else {
    data.nodes.forEach((node, i) => validateNode(node, `${path}.nodes[${i}]`, ids, fail));
  }
}

function validateNode(node: unknown, path: string, ids: Set<string>, fail: (path: string, message: string) => void) {
  if (!isObject(node)) {
    fail(path, "objet attendu");
    return;
  }
  if (typeof node.type !== "string" || !NODE_TYPES.includes(node.type)) {
    fail(`${path}.type`, `un de ${NODE_TYPES.join(", ")} attendu`);
    return;
  }
  const label = typeof node.id === "string" ? `${path} (${node.id})` : path;

  if (typeof node.id !== "string" || node.id === "") {
    fail(`${path}.id`, "texte non vide attendu");
  } else if (ids.has(node.id)) {
    fail(`${path}.id`, `"${node.id}" est déjà utilisé`);
  } else {
    ids.add(node.id);
  }
  checkNumber(node, "x", label, fail);
  checkNumber(node, "y", label, fail);
  checkPositive(node, "width", label, fail);
  checkPositive(node, "height", label, fail);

  if (!isObject(node.style)) fail(`${label}.style`, "objet attendu");
  else validateStyle(node.style, `${label}.style`, fail);

  if (node.type === "section") {
    if (!Array.isArray(node.children)) fail(`${label}.children`, "tableau attendu");
    else node.children.forEach((child, i) => validateNode(child, `${label}.children[${i}]`, ids, fail));
    return;
  }

  if (!isObject(node.props)) {
    fail(`${label}.props`, "objet attendu");
    return;
  }
  const props = node.props;
  const at = `${label}.props`;
  switch (node.type) {
    case "title":
      checkString(props, "text", at, fail);
      if (props.level !== 1 && props.level !== 2 && props.level !== 3) fail(`${at}.level`, "1, 2 ou 3 attendu");
      break;
    case "text":
      checkString(props, "text", at, fail);
      break;
    case "image":
      checkString(props, "src", at, fail);
      checkString(props, "alt", at, fail);
      if (props.fit !== "cover" && props.fit !== "contain") fail(`${at}.fit`, '"cover" ou "contain" attendu');
      break;
    case "button":
      checkString(props, "label", at, fail);
      if (props.href !== undefined && typeof props.href !== "string") fail(`${at}.href`, "texte attendu");
      if (props.targetScreenId !== undefined && typeof props.targetScreenId !== "string") fail(`${at}.targetScreenId`, "texte attendu");
      break;
    case "shape":
      if (!["circle", "rectangle", "triangle"].includes(props.shape as string)) fail(`${at}.shape`, "circle, rectangle ou triangle attendu");
      break;
    case "video":
      checkString(props, "src", at, fail);
      checkString(props, "title", at, fail);
      if (props.kind !== "embed" && props.kind !== "file") fail(`${at}.kind`, "embed ou file attendu");
      break;
    case "map":
      checkString(props, "title", at, fail);
      if (typeof props.latitude !== "number" || props.latitude < -90 || props.latitude > 90) fail(`${at}.latitude`, "nombre entre -90 et 90 attendu");
      if (typeof props.longitude !== "number" || props.longitude < -180 || props.longitude > 180) fail(`${at}.longitude`, "nombre entre -180 et 180 attendu");
      if (!Number.isInteger(props.zoom) || (props.zoom as number) < 1 || (props.zoom as number) > 19) fail(`${at}.zoom`, "entier de 1 à 19 attendu");
      if (!Array.isArray(props.markers)) fail(`${at}.markers`, "tableau attendu");
      else {
        props.markers.forEach((marker, i) => {
          if (!isObject(marker) || typeof marker.label !== "string" || typeof marker.latitude !== "number" || typeof marker.longitude !== "number") {
            fail(`${at}.markers[${i}]`, "objet { label, latitude, longitude } attendu");
          }
        });
      }
      break;
  }
}

function validateStyle(style: Json, path: string, fail: (path: string, message: string) => void) {
  for (const key of ["backgroundColor", "color", "borderColor"]) {
    if (style[key] !== undefined) checkColor(style, key, path, fail);
  }
  for (const key of ["fontSize", "borderRadius", "borderWidth"]) {
    const value = style[key];
    if (value !== undefined && (typeof value !== "number" || value < 0)) fail(`${path}.${key}`, "nombre ≥ 0 attendu");
  }
  if (style.fontWeight !== undefined && ![400, 500, 600, 700].includes(style.fontWeight as number)) {
    fail(`${path}.fontWeight`, "400, 500, 600 ou 700 attendu");
  }
  if (style.textAlign !== undefined && !["left", "center", "right"].includes(style.textAlign as string)) {
    fail(`${path}.textAlign`, '"left", "center" ou "right" attendu');
  }
}

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkString(obj: Json, key: string, path: string, fail: (path: string, message: string) => void) {
  if (typeof obj[key] !== "string") fail(`${path}.${key}`, "texte attendu");
}

function checkNumber(obj: Json, key: string, path: string, fail: (path: string, message: string) => void) {
  if (typeof obj[key] !== "number" || !Number.isFinite(obj[key])) fail(`${path}.${key}`, "nombre attendu");
}

function checkPositive(obj: Json, key: string, path: string, fail: (path: string, message: string) => void) {
  const value = obj[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) fail(`${path}.${key}`, "nombre > 0 attendu");
}

function checkColor(obj: Json, key: string, path: string, fail: (path: string, message: string) => void) {
  const value = obj[key];
  if (typeof value !== "string" || !HEX_COLOR.test(value)) fail(`${path}.${key}`, 'couleur hexadécimale attendue (ex. "#0f172a")');
}

/** Nombre total d'éléments, sections imbriquées comprises. */
export function countNodes(nodes: MaquetteNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + (node.type === "section" ? countNodes(node.children) : 0), 0);
}
