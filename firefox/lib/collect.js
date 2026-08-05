import { api } from "./api.js";

const UNGROUPED = -1;

// Reads the open windows into an ordered plan. Pure read: nothing here touches
// bookmarks or tabs, so the popup can call it to preview exactly what a save
// would write.
export async function collect(scope, currentWindowId) {
  const windowIds =
    scope === "all"
      ? (await api.windows.getAll({ windowTypes: ["normal"] })).map((win) => win.id)
      : [currentWindowId];

  const counts = { windows: 0, tabs: 0, groups: 0, skipped: 0, hidden: 0 };
  const stores = new Set();
  const collected = [];

  for (const windowId of windowIds) {
    const titles = await groupTitles(windowId);
    const nodes = [];
    const tabIds = [];
    let untitled = 0;
    let open = null;

    // tabs.query, not windows.get({ populate: true }). Zen hides every tab
    // belonging to an inactive Space, and the populated window object leaves
    // hidden tabs out — so a save silently captured only the active Space.
    // tabs.query returns them unless `hidden` is passed as a filter.
    const tabs = (await api.tabs.query({ windowId })).sort((a, b) => a.index - b.index);
    for (const tab of tabs) {
      if (!tab.url) {
        counts.skipped++;
        continue;
      }
      const entry = { title: tab.title || tab.url, url: tab.url };
      tabIds.push(tab.id);
      counts.tabs++;
      // A hidden tab belongs to a Space that isn't the active one.
      if (tab.hidden) counts.hidden++;
      if (tab.cookieStoreId) stores.add(tab.cookieStoreId);

      const groupId = tab.groupId ?? UNGROUPED;
      if (groupId === UNGROUPED) {
        open = null;
        nodes.push({ kind: "tab", ...entry });
        continue;
      }

      if (!open || open.groupId !== groupId) {
        const title = titles.get(groupId)?.trim();
        open = {
          kind: "group",
          groupId,
          name: title || `Group ${++untitled}`,
          tabs: [],
        };
        nodes.push(open);
        counts.groups++;
      }
      open.tabs.push(entry);
    }

    if (!nodes.length) continue;
    counts.windows++;
    collected.push({ windowId, nodes, tabIds });
  }

  collected.forEach((win, i) => {
    win.label = `Window ${i + 1}`;
  });

  // Zen exposes no Spaces API. Container-bound Spaces show up as distinct
  // cookie stores, which is the only signal available — and it is a signal for
  // containers, not Spaces as such, so the popup treats it as a lower bound.
  counts.stores = stores.size;
  return { windows: collected, counts };
}

// tabGroups is core Chromium, but a fork could drop it. Tabs still carry
// groupId either way, so grouping survives its absence; only the folder names
// fall back to "Group 1", "Group 2".
async function groupTitles(windowId) {
  if (!api.tabGroups?.query) return new Map();
  try {
    const groups = await api.tabGroups.query({ windowId });
    return new Map(groups.map((group) => [group.id, group.title]));
  } catch {
    return new Map();
  }
}
