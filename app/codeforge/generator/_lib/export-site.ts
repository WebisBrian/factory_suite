import { HTML_FILE, type GeneratedPage } from "@/app/codeforge/generator/_lib/generate-html";

export type ExportFile = { name: string; content: string };

/** Un HTML et un CSS par écran, placés ensemble pour conserver les liens relatifs. */
export function siteFiles(pages: GeneratedPage[]): ExportFile[] {
  return pages.flatMap((page) => [
    { name: page.screen.path, content: page.html },
    { name: page.cssPath, content: page.css },
  ]);
}

/** page.html reste le point d'entrée lu par l'outil Animations. */
export function projectFiles(pages: GeneratedPage[]): ExportFile[] {
  const files = siteFiles(pages);
  const entry = files.find((file) => file.name.toLowerCase() === HTML_FILE);
  if (entry) {
    entry.content = pages.find((page) => page.screen.path === entry.name)!.standaloneHtml;
  } else {
    files.push({ name: HTML_FILE, content: pages[0].standaloneHtml });
  }
  return files;
}

/** ZIP sans compression (méthode STORE), créé dans le navigateur sans dépendance. */
export function createSiteZip(files: ExportFile[]): Blob {
  const encoder = new TextEncoder();
  const localParts: BlobPart[] = [];
  const centralParts: BlobPart[] = [];
  let offset = 0;
  let centralSize = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const checksum = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // Noms UTF-8.
    local.setUint16(12, 0x0021, true); // 1980-01-01, date DOS valide.
    local.setUint32(14, checksum, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    localParts.push(local.buffer, name.buffer, data.buffer);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0x0800, true);
    central.setUint16(14, 0x0021, true);
    central.setUint32(16, checksum, true);
    central.setUint32(20, data.length, true);
    central.setUint32(24, data.length, true);
    central.setUint16(28, name.length, true);
    central.setUint32(42, offset, true);
    centralParts.push(central.buffer, name.buffer);
    offset += 30 + name.length + data.length;
    centralSize += 46 + name.length;
  }

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...localParts, ...centralParts, end.buffer], { type: "application/zip" });
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
