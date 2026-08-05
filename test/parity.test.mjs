// Guards the two builds against drift. Only manifest.json may differ between
// chromium/ and firefox/ — everything else is mirrored by tools/sync.mjs, and a
// fix landing in one build but not the other should fail here rather than ship.
//   node test/parity.test.mjs
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = "manifest.json";

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) return console.log(`PASS  ${name}`);
  failures++;
  console.log(`FAIL  ${name}\n  actual:   ${JSON.stringify(actual)}\n  expected: ${JSON.stringify(expected)}`);
}

async function walk(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, base)));
    else out.push(relative(base, full).split(sep).join("/"));
  }
  return out.sort();
}

const chromiumFiles = (await walk(join(ROOT, "chromium"))).filter((f) => f !== MANIFEST);
const firefoxFiles = (await walk(join(ROOT, "firefox"))).filter((f) => f !== MANIFEST);

check("same file list", chromiumFiles, firefoxFiles);

let identical = 0;
for (const file of chromiumFiles) {
  if (!firefoxFiles.includes(file)) continue;
  const [a, b] = await Promise.all([
    readFile(join(ROOT, "chromium", file)),
    readFile(join(ROOT, "firefox", file)),
  ]);
  if (a.equals(b)) identical++;
  else check(`identical: ${file}`, "differs", "identical");
}
check("every shared file byte-identical", identical, chromiumFiles.length);

// The manifests must stay in lockstep on the things that are not browser-specific.
const manifests = await Promise.all(
  ["chromium", "firefox"].map(async (dir) =>
    JSON.parse(await readFile(join(ROOT, dir, MANIFEST), "utf8")),
  ),
);
check("same version", manifests[0].version, manifests[1].version);
check("same name", manifests[0].name, manifests[1].name);
check("same permissions", manifests[0].permissions, manifests[1].permissions);
check("chromium uses a service worker", typeof manifests[0].background.service_worker, "string");
check("firefox uses background scripts", manifests[1].background.scripts, ["background.js"]);
check("firefox declares a gecko id", typeof manifests[1].browser_specific_settings?.gecko?.id, "string");

// lib/api.js is the whole Firefox port in three lines, and neither browser is
// available here, so both branches are exercised against fakes.
const apiUrl = pathToFileURL(join(ROOT, "chromium", "lib", "api.js")).href;

globalThis.chrome = { marker: "chromium" };
const chromiumApi = await import(`${apiUrl}?chromium`);
check("falls back to chrome", chromiumApi.api.marker, "chromium");
check("isGecko false on chromium", chromiumApi.isGecko, false);

globalThis.browser = { marker: "gecko" };
const geckoApi = await import(`${apiUrl}?gecko`);
check("prefers browser when present", geckoApi.api.marker, "gecko");
check("isGecko true on firefox", geckoApi.isGecko, true);
delete globalThis.browser;

console.log(failures ? `\n${failures} failing` : "\nall green");
process.exit(failures ? 1 : 0);
