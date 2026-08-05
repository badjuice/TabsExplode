import { api } from "./api.js";

const UNGROUPED = -1;

// Reads the open windows into an ordered plan. Pure read: nothing here touches
// bookmarks or tabs, so the popup can call it to preview exactly what a save
// would write.
export async function collect(scope, currentWindowId) {
  const windows =
    scope === "all"
      ? await api.windows.getAll({ populate: true, windowTypes: ["normal"] })
      : [await api.windows.get(currentWindowId, { populate: true })];

  const counts = { windows: 0, tabs: 0, groups: 0, skipped: 0 };
  const collected = [];

  for (const win of windows) {
    const titles = await groupTitles(win.id);
    const nodes = [];
    const tabIds = [];
    let untitled = 0;
    let open = null;

    const tabs = [...(win.tabs ?? [])].sort((a, b) => a.index - b.index);
    for (const tab of tabs) {
      if (!tab.url) {
        counts.skipped++;
        continue;
      }
      const entry = { title: tab.title || tab.url, url: tab.url };
      tabIds.push(tab.id);
      counts.tabs++;

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
    collected.push({ windowId: win.id, nodes, tabIds });
  }

  collected.forEach((win, i) => {
    win.label = `Window ${i + 1}`;
  });

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
