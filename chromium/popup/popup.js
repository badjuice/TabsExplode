import { api, isGecko } from "../lib/api.js";
import {
  DEFAULTS,
  getSettings,
  setSettings,
  getRootFolders,
  resolveRootId,
} from "../lib/settings.js";

const el = (id) => document.getElementById(id);
const confirmView = el("confirm");
const doneView = el("done");
const summary = el("summary");
const nameInput = el("name");
const destination = el("destination");
const note = el("note");
const saveButton = el("save");
const openButton = el("open");
const doneText = el("done-text");

const scope = el("scope");
const groupPlacement = el("group-placement");
const afterSave = el("after-save");
const root = el("root");
const container = el("container");
const status = el("status");

let windowId = null;
let savedFolderId = null;
let flashTimer = null;

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}.${pad(now.getMinutes())}`
  );
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

async function loadSettings() {
  const [settings, roots] = await Promise.all([getSettings(), getRootFolders()]);

  root.replaceChildren(
    ...roots.map((folder) => {
      const option = document.createElement("option");
      option.value = folder.id;
      option.textContent = folder.title || `Folder ${folder.id}`;
      return option;
    }),
  );

  scope.value = settings.scope;
  groupPlacement.value = settings.groupPlacement;
  afterSave.value = settings.afterSave;
  container.value = settings.containerName;
  root.value = await resolveRootId(settings, roots);
}

async function refreshPreview() {
  const preview = await api.runtime.sendMessage({ type: "preview", windowId });
  if (!preview?.ok) {
    summary.textContent = preview?.error ?? "Could not read the open tabs.";
    saveButton.disabled = true;
    return;
  }

  const { tabs, groups, windows, skipped, hidden, stores } = preview.counts;
  const parts = [`Save ${plural(tabs, "tab")}`];
  if (groups) parts.push(`in ${plural(groups, "group")}`);
  // Spaces aren't exposed to extensions; container-bound Spaces show up as
  // separate cookie stores, which is the closest available signal.
  if (stores > 1) parts.push(`in ${plural(stores, "space")}`);
  if (windows > 1) parts.push(`across ${plural(windows, "window")}`);
  summary.textContent = parts.join(" ");
  destination.textContent = preview.destination;

  const notes = [];
  if (hidden) notes.push(`Includes ${hidden} tab${hidden === 1 ? "" : "s"} from other spaces.`);
  if (skipped) notes.push(`${plural(skipped, "tab")} without an address will be skipped.`);
  if (preview.closesTabs) notes.push("Saved tabs will be closed afterwards.");
  note.textContent = notes.join(" ");
  note.hidden = notes.length === 0;

  saveButton.disabled = tabs === 0;
  if (tabs === 0) summary.textContent = "There are no tabs to save.";
}

function flash() {
  status.textContent = "Saved";
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    status.textContent = "";
  }, 1600);
}

// Settings feed the preview — scope changes the tab count, the destination
// fields change the folder line — so every change re-reads it.
function bind(element, patch) {
  element.addEventListener("change", async () => {
    await setSettings(patch());
    flash();
    await refreshPreview();
  });
}

bind(scope, () => ({ scope: scope.value }));
bind(groupPlacement, () => ({ groupPlacement: groupPlacement.value }));
bind(afterSave, () => ({ afterSave: afterSave.value }));
bind(root, () => ({ rootId: root.value }));
bind(container, () => {
  container.value = container.value.trim() || DEFAULTS.containerName;
  return { containerName: container.value };
});

async function save() {
  saveButton.disabled = true;
  saveButton.textContent = "Saving…";

  const result = await api.runtime.sendMessage({
    type: "save",
    windowId,
    sessionName: nameInput.value.trim() || timestamp(),
  });

  if (!result?.ok) {
    summary.textContent = result?.error ?? "The save failed.";
    saveButton.textContent = "Save";
    saveButton.disabled = false;
    return;
  }

  savedFolderId = result.folderId;
  doneText.textContent = `Saved ${plural(result.written, "bookmark")}.`;
  confirmView.hidden = true;
  doneView.hidden = false;
  openButton.focus();
}

saveButton.addEventListener("click", save);
el("cancel").addEventListener("click", () => window.close());
el("dismiss").addEventListener("click", () => window.close());

nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !saveButton.disabled) save();
});

// Firefox's bookmark manager is a Library window with no navigable URL, so the
// button can never work there and is dropped rather than left dead. On Chromium
// it is still best effort: a fork may route the URL elsewhere, and failing to
// open it must not read as a failed save.
if (isGecko) {
  openButton.remove();
} else {
  openButton.addEventListener("click", async () => {
    try {
      await api.tabs.create({ url: `chrome://bookmarks/?id=${savedFolderId}` });
      window.close();
    } catch {
      openButton.textContent = "Can't open bookmarks";
      openButton.disabled = true;
    }
  });
}

// Both come from the manifest so each build reports its own version and neither
// value has to be duplicated in code.
const manifest = api.runtime.getManifest();
el("version").textContent = `v${manifest.version}`;

const repoLink = el("repo");
repoLink.href = manifest.homepage_url;
// A plain anchor in a popup won't reliably open a tab, so route through the
// tabs API and dismiss the popup afterwards.
repoLink.addEventListener("click", (event) => {
  event.preventDefault();
  api.tabs.create({ url: manifest.homepage_url });
  window.close();
});

async function init() {
  nameInput.value = timestamp();

  const [activeTab] = await api.tabs.query({ active: true, currentWindow: true });
  windowId = activeTab.windowId;

  // Independent of each other, so neither waits on the other's round trip.
  await Promise.all([loadSettings(), refreshPreview()]);

  nameInput.focus();
  nameInput.select();
}

init();
