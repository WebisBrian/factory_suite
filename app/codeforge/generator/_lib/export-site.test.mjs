import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { crc32 } from "node:zlib";
import ts from "typescript";

// Charge le TypeScript local sans ajouter de runner ni modifier la config partagée.
function load(name, imports = {}, globals = {}) {
  const exports = {};
  const source = readFileSync(new URL(name, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  runInNewContext(outputText, {
    exports, Blob, TextEncoder, ...globals,
    require: (name) => {
      assert.ok(name in imports, `Import inattendu : ${name}`);
      return imports[name];
    },
  });
  return exports;
}

const { validateMaquette } = load("maquette.ts");
const generator = load("generate-html.ts", { "@/app/codeforge/generator/_lib/map-tiles": load("map-tiles.ts") });
const { generateSite } = generator;
const exporter = load("export-site.ts", { "@/app/codeforge/generator/_lib/generate-html": generator });
const { siteFiles, projectFiles, createSiteZip } = exporter;
const fixture = JSON.parse(readFileSync(new URL("maquette.fixture.json", import.meta.url), "utf8"));
const oldFixture = JSON.parse(readFileSync(new URL("maquette.v1.fixture.json", import.meta.url), "utf8"));

function parse(data) {
  const result = validateMaquette(data);
  assert.equal(result.ok, true, result.errors?.join("\n"));
  return result.maquette;
}

test("importe les quatre écrans v2 et conserve les noms et tous les liens internes", () => {
  const pages = generateSite(parse(fixture));
  assert.equal(pages.length, 4);
  assert.deepEqual(Array.from(pages, (p) => p.screen.path), ["index.html", "services.html", "contact.html", "merci.html"]);
  for (const page of pages) {
    assert.ok(page.html.includes(`href="${page.cssPath}"`));
    assert.ok(page.html.includes(`data-screen-id="${page.screen.id}"`));
    for (const match of page.html.matchAll(/href="([^"]+\.html)"/g)) {
      assert.ok(pages.some((p) => p.screen.path === match[1]), `Lien cassé : ${match[1]}`);
    }
  }
  assert.ok(pages[2].html.includes('href="mailto:contact@example.com"'));
  assert.ok(pages[2].html.includes('href="#horaires"'));
  const changed = structuredClone(fixture);
  changed.screens[0].nodes[0].children[2].props.href = "ancien.html";
  assert.ok(!generateSite(parse(changed))[0].html.includes('href="ancien.html"'));
});

test("rend les formes, les deux lecteurs vidéo et les images embarquées", () => {
  const pages = generateSite(parse(fixture));
  assert.ok(pages[0].css.includes("border-radius: 50%;"));
  assert.ok(pages[0].html.includes('<polygon points="50,0 100,100 0,100"'));
  assert.ok(pages[0].html.includes('fill="#b45309"'));
  assert.ok(pages[0].html.includes('src="data:image/svg+xml;base64,'));
  assert.match(pages[0].html, /<iframe [^>]+title="Présentation de l&#39;atelier en vidéo"|<iframe [^>]+title="Présentation de l'atelier en vidéo"/);
  assert.match(pages[1].html, /<video [^>]+controls preload="metadata"/);
  for (const page of pages) {
    assert.ok(page.standaloneHtml.includes("<style>"));
    assert.ok(page.standaloneHtml.includes(page.css));
    assert.ok(!page.standaloneHtml.includes('rel="stylesheet"'));
  }
});

test("accepte toujours une maquette v1 avec le téléchargement HTML autonome", () => {
  const document = parse(oldFixture);
  assert.equal(document.schemaVersion, 2);
  assert.equal(document.screens.length, 1);
  const [page] = generateSite(document);
  assert.equal(page.screen.path, "page.html");
  assert.equal(page.cssPath, "page.css");
  assert.ok(page.standaloneHtml.includes("Donnez vie à vos idées de site web"));
});

test("rejette les écrans invalides, les collisions de fichiers et les liens sans cible", () => {
  const changes = [
    (d) => { d.screens = []; },
    (d) => { d.screens[1].id = d.screens[0].id; },
    (d) => { d.screens[1].path = "INDEX.html"; },
    (d) => { d.screens[1].path = "../contact.html"; },
    (d) => { d.screens[1].nodes[0].id = d.screens[0].nodes[0].id; },
    (d) => { d.screens[0].nodes[0].children[2].props.targetScreenId = "absent"; },
    (d) => { d.screens[0].frame.width = 0; },
    (d) => { d.screens[0].nodes[0].type = "inconnu"; },
  ];
  for (const change of changes) {
    const document = structuredClone(fixture);
    change(document);
    assert.equal(validateMaquette(document).ok, false);
  }
});

test("le ZIP contient les huit fichiers, leurs contenus UTF-8, CRC et index valides", async () => {
  const files = siteFiles(generateSite(parse(fixture)));
  const zip = createSiteZip(files);
  assert.equal(zip.type, "application/zip");
  const bytes = Buffer.from(await zip.arrayBuffer());
  let offset = 0;
  const offsets = [];
  for (const file of files) {
    offsets.push(offset);
    assert.equal(bytes.readUInt32LE(offset), 0x04034b50);
    assert.equal(bytes.readUInt16LE(offset + 6), 0x0800);
    assert.equal(bytes.readUInt16LE(offset + 8), 0);
    const size = bytes.readUInt32LE(offset + 18);
    const nameLength = bytes.readUInt16LE(offset + 26);
    assert.equal(bytes.subarray(offset + 30, offset + 30 + nameLength).toString(), file.name);
    const content = bytes.subarray(offset + 30 + nameLength, offset + 30 + nameLength + size);
    assert.equal(content.toString(), file.content);
    assert.equal(bytes.readUInt32LE(offset + 14), crc32(content));
    offset += 30 + nameLength + size;
  }
  const centralOffset = offset;
  files.forEach((file, i) => {
    assert.equal(bytes.readUInt32LE(offset), 0x02014b50);
    assert.equal(bytes.readUInt32LE(offset + 42), offsets[i]);
    const nameLength = bytes.readUInt16LE(offset + 28);
    assert.equal(bytes.subarray(offset + 46, offset + 46 + nameLength).toString(), file.name);
    offset += 46 + nameLength;
  });
  assert.equal(bytes.readUInt32LE(offset), 0x06054b50);
  assert.equal(bytes.readUInt16LE(offset + 10), 8);
  assert.equal(bytes.readUInt32LE(offset + 12), offset - centralOffset);
  assert.equal(bytes.readUInt32LE(offset + 16), centralOffset);
  assert.equal(bytes.length, offset + 22);
});

test("l'enregistrement conserve toutes les pages et page.html pour Animations", () => {
  const files = projectFiles(generateSite(parse(fixture)));
  assert.equal(files.length, 9);
  assert.equal(files.find((f) => f.name === "page.html").content, generateSite(parse(fixture))[0].standaloneHtml);
  assert.equal(projectFiles(generateSite(parse(oldFixture))).length, 2);
});

test("le bouton télécharge le site entier en démo et enregistre tous les écrans du projet", async () => {
  let blob, filename, feedback, cleanup;
  let fail = false;
  const writes = [];
  const link = { click() { filename = this.download; }, remove() {} };
  const jsx = (type, props) => ({ type, props });
  const { GeneratorOutput } = load("../_components/GeneratorOutput.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    react: { useMemo: (fn) => fn(), useState: (value) => [value, (next) => { feedback = next; }] },
    "next/link": {},
    "@/lib/project-fs": { writeProjectFile: async (...args) => { writes.push(args); } },
    "@/app/codeforge/generator/_lib/generate-html": generator,
    "@/app/codeforge/generator/_lib/export-site": exporter,
    "@/app/codeforge/generator/_lib/generator-styles": load("generator-styles.ts"),
    "@/app/codeforge/generator/_components/GeneratorPreview": {},
  }, {
    document: { createElement: () => link, body: { appendChild() {} } },
    URL: { createObjectURL(value) { if (fail) throw Error("Échec simulé"); blob = value; return "blob:test"; }, revokeObjectURL() {} },
    window: { setTimeout: (fn) => { cleanup = fn; } },
  });
  function find(node, predicate) {
    if (Array.isArray(node)) return node.map((n) => find(n, predicate)).find(Boolean);
    if (!node || typeof node !== "object") return;
    // Toutes les props, pas seulement children : le choix d'écran est passé dans `leading`.
    return predicate(node) ? node : find(Object.values(node.props ?? {}), predicate);
  }
  for (const projectId of [null, 7]) {
    const tree = GeneratorOutput({ maquette: parse(fixture), projectId, sourceLabel: "Test" });
    assert.equal(find(tree, (n) => n.type === "select").props.children.length, 4);
    const download = find(tree, (n) => n.props?.["aria-describedby"] === "generator-download-description");
    download.props.onClick();
    assert.equal(filename, "site.zip");
    assert.equal(blob.type, "application/zip");
    assert.equal(feedback.ok, true);
    cleanup();
    if (projectId !== null) {
      await find(tree, (n) => n.type === "button" && n.props.children === "Générer et enregistrer").props.onClick();
      assert.equal(writes.length, 9);
      assert.ok(writes.every(([id]) => id === 7));
      assert.ok(writes.some(([, name]) => name === "merci.html"));
    }
  }
  const legacy = GeneratorOutput({ maquette: parse(oldFixture), projectId: null, sourceLabel: "v1" });
  const button = find(legacy, (n) => n.props?.["aria-describedby"] === "generator-download-description");
  button.props.onClick();
  assert.equal(filename, "page.html");
  assert.ok((await blob.text()).includes("<style>"));
  fail = true;
  button.props.onClick();
  assert.equal(feedback.ok, false);
  assert.ok(feedback.message.startsWith("Erreur :"));
});

test("accessibilité : repère main, ordre de lecture visuel, empilement conservé et noms non vides", () => {
  const style = {};
  const maquette = parse({
    schemaVersion: 2,
    id: "a11y",
    name: "A11y",
    screens: [{
      id: "s1", name: "Accueil", path: "index.html",
      frame: { device: "desktop", width: 800, height: 600, backgroundColor: "#ffffff" },
      nodes: [
        { id: "fond", type: "shape", x: 0, y: 0, width: 800, height: 600, style, props: { shape: "rectangle" } },
        { id: "bas", type: "text", x: 40, y: 400, width: 200, height: 40, style, props: { text: "Bas" } },
        { id: "droite", type: "button", x: 400, y: 100, width: 120, height: 40, style, props: { label: "Droite" } },
        { id: "gauche", type: "title", x: 40, y: 102, width: 200, height: 40, style, props: { text: "Gauche", level: 1 } },
        { id: "vide", type: "title", x: 40, y: 500, width: 200, height: 40, style, props: { text: " ", level: 2 } },
        { id: "video", type: "video", x: 40, y: 540, width: 200, height: 40, style, props: { src: "", kind: "file", title: "" } },
      ],
    }],
  });
  const [page] = generateSite(maquette);
  assert.ok(page.html.includes('<main class="maquette-frame"'));
  const order = Array.from(page.html.matchAll(/data-node-id="([^"]+)"/g), (m) => m[1]);
  assert.deepEqual(order, ["fond", "gauche", "droite", "bas", "vide", "video"]);
  // Le dernier élément du tableau reste au-dessus, quel que soit l'ordre HTML.
  assert.ok(page.css.includes("#fond {") && /#fond \{[^}]*z-index: 1;/.test(page.css));
  assert.ok(/#gauche \{[^}]*z-index: 4;/.test(page.css));
  assert.ok(!page.html.includes("<h2"));
  assert.ok(page.html.includes('aria-label="Vidéo"'));
  assert.ok(page.css.includes(":focus-visible"));
});

test("une carte est générée en tuiles OpenStreetMap, avec ses points, sa liste texte et l'attribution", () => {
  const page = generator.generatePage({
    id: "s", name: "Carte", path: "carte.html", frame: { device: "desktop", width: 800, height: 600, backgroundColor: "#ffffff" },
    nodes: [{
      id: "map_1", type: "map", x: 0, y: 0, width: 600, height: 400, style: {},
      props: { latitude: 48.8566, longitude: 2.3522, zoom: 12, title: "Notre agence", markers: [{ id: "m1", label: "Paris", latitude: 48.8566, longitude: 2.3522 }] },
    }],
  });
  assert.match(page.html, /https:\/\/tile\.openstreetmap\.org\/12\/\d+\/\d+\.png/);
  assert.match(page.html, /aria-label="Notre agence"/);
  assert.match(page.html, /<li>Paris \(48\.8566, 2\.3522\)<\/li>/);
  assert.match(page.html, /© OpenStreetMap/);
  assert.ok(validateMaquette({ schemaVersion: 2, id: "x", name: "x", screens: [{ id: "s", name: "s", path: "a.html", frame: { device: "desktop", width: 800, height: 600, backgroundColor: "#ffffff" }, nodes: [{ id: "map_1", type: "map", x: 0, y: 0, width: 600, height: 400, style: {}, props: { latitude: 95, longitude: 0, zoom: 12, title: "t", markers: [] } }] }] }).ok === false);
});
