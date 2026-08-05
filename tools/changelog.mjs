// Generates chromium/lib/changelog.js from CHANGELOG.md so the popup's About
// panel can never drift from the real changelog.
//   node tools/changelog.mjs
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SOURCE = join(ROOT, "CHANGELOG.md");
export const TARGET = join(ROOT, "chromium", "lib", "changelog.js");

// The popup renders plain text, so inline Markdown is flattened here rather
// than shipping a parser to the client.
function plain(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .trim();
}

export function parse(markdown) {
  const releases = [];
  let release = null;
  let section = null;

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trimEnd();

    const heading = line.match(/^## \[([^\]]+)\]\s*[—–-]\s*(.+)$/);
    if (heading) {
      release = { version: heading[1], date: heading[2].trim(), sections: [] };
      releases.push(release);
      section = null;
      continue;
    }
    if (!release) continue; // preamble above the first release
    if (/^\[[^\]]+\]:\s/.test(line)) continue; // trailing link-reference block

    const subheading = line.match(/^### (.+)$/);
    if (subheading) {
      section = { kind: subheading[1].trim(), items: [] };
      release.sections.push(section);
      continue;
    }

    const bullet = line.match(/^- (.+)$/);
    if (bullet && section) {
      section.items.push(plain(bullet[1]));
      continue;
    }

    // Wrapped continuation of the bullet above.
    if (section?.items.length && /^\s+\S/.test(raw)) {
      const last = section.items.length - 1;
      section.items[last] = plain(`${section.items[last]} ${line.trim()}`);
    }
  }

  return releases;
}

export function render(releases) {
  return [
    "// Generated from CHANGELOG.md by tools/changelog.mjs. Do not edit by hand.",
    `export const RELEASES = ${JSON.stringify(releases, null, 2)};`,
    "",
  ].join("\n");
}

export async function build() {
  return render(parse(await readFile(SOURCE, "utf8")));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = await build();
  await writeFile(TARGET, output, "utf8");
  const count = JSON.parse(output.slice(output.indexOf("["), output.lastIndexOf("]") + 1)).length;
  console.log(`wrote chromium/lib/changelog.js (${count} releases)`);
}
