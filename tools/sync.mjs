// Mirrors chromium/ into firefox/, leaving each build's manifest.json alone.
// Only the manifests genuinely differ between browsers, so everything else is
// kept byte-identical rather than maintained twice.
//   node tools/sync.mjs
import { cp, rm, readdir, mkdir } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FROM = join(ROOT, "chromium");
const TO = join(ROOT, "firefox");
const MANIFEST = "manifest.json";

// Clear the target first so files deleted from chromium/ don't linger here.
const existing = await readdir(TO, { withFileTypes: true }).catch(() => []);
for (const entry of existing) {
  if (entry.name === MANIFEST) continue;
  await rm(join(TO, entry.name), { recursive: true, force: true });
}

await mkdir(TO, { recursive: true });
await cp(FROM, TO, { recursive: true, filter: (src) => basename(src) !== MANIFEST });

console.log("synced chromium/ -> firefox/ (manifest.json left alone)");
