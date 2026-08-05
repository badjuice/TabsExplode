import { api, isGecko } from "./api.js";

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

// Chromium ids the tree root "0", Firefox "root________".
const TREE_ROOT = isGecko ? "root________" : "0";

// Only the top-level folders are ever needed. getChildren fetches exactly
// those; bookmarks.getTree() would serialise every bookmark in the profile,
// which grows with each save and is what made the popup slow to populate.
export async function getRootFolders() {
  try {
    const children = await api.bookmarks.getChildren(TREE_ROOT);
    if (children.length) return children.filter((child) => !child.url);
  } catch {
    // Unrecognised root id on some fork. Fall back to the whole-tree read.
  }
  const [root] = await api.bookmarks.getTree();
  return (root.children ?? []).filter((child) => !child.url);
}

// `roots` is optional so callers that already have them don't refetch.
export async function resolveRootId(settings, roots) {
  const folders = roots ?? (await getRootFolders());
  if (settings.rootId && folders.some((folder) => folder.id === settings.rootId)) {
    return settings.rootId;
  }
  const other = folders.find((folder) => OTHER_BOOKMARKS.includes(folder.id));
  return (other ?? folders[1] ?? folders[0]).id;
}
