import { api } from "./api.js";

export const DEFAULTS = {
  scope: "current", // "current" | "all"
  afterSave: "keep", // "keep" | "close"
  groupPlacement: "top", // "top" | "inline"
  rootId: null, // resolved from the tree when unset
  containerName: "TabsExplode Saved Tabs",
};

// Chromium ids "Other bookmarks" as "2"; Firefox ids the same folder
// "unfiled_____". The titles are localised, so they can't be matched on.
const OTHER_BOOKMARKS = ["2", "unfiled_____"];

export async function getSettings() {
  return { ...DEFAULTS, ...(await api.storage.local.get(DEFAULTS)) };
}

export async function setSettings(patch) {
  await api.storage.local.set(patch);
}

// The permanent folders differ between browsers and their titles are localised,
// so read them off the tree instead of hardcoding ids.
export async function getRootFolders() {
  const [root] = await api.bookmarks.getTree();
  return (root.children ?? []).filter((child) => !child.url);
}

export async function resolveRootId(settings) {
  const roots = await getRootFolders();
  if (settings.rootId && roots.some((folder) => folder.id === settings.rootId)) {
    return settings.rootId;
  }
  const other = roots.find((folder) => OTHER_BOOKMARKS.includes(folder.id));
  return (other ?? roots[1] ?? roots[0]).id;
}
