import { api } from "./lib/api.js";
import { getSettings, resolveRootId } from "./lib/settings.js";
import { collect } from "./lib/collect.js";
import { write } from "./lib/write.js";

// The save runs here rather than in the popup: an action popup is destroyed as
// soon as it loses focus, which would abandon a half-written save.
api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handler = { preview, save }[message?.type];
  if (!handler) return;
  handler(message).then(sendResponse, (error) =>
    sendResponse({ ok: false, error: error?.message ?? String(error) }),
  );
  return true;
});

async function preview({ windowId }) {
  const settings = await getSettings();
  const plan = await collect(settings.scope, windowId);
  const [root] = await api.bookmarks.get(await resolveRootId(settings));
  return {
    ok: true,
    counts: plan.counts,
    destination: `${root.title} / ${settings.containerName}`,
    closesTabs: settings.afterSave === "close",
  };
}

async function save({ windowId, sessionName }) {
  const settings = await getSettings();
  const plan = await collect(settings.scope, windowId);
  if (!plan.counts.tabs) return { ok: false, error: "There are no tabs to save." };

  const result = await write(plan, {
    rootId: await resolveRootId(settings),
    containerName: settings.containerName,
    groupPlacement: settings.groupPlacement,
    sessionName,
  });

  if (settings.afterSave === "close") await closeSaved(plan);
  return { ok: true, ...result };
}

// Only reached once every bookmark has been written. A window closes along with
// its last tab, so each one gets a replacement tab before being emptied.
async function closeSaved(plan) {
  for (const win of plan.windows) {
    if (!win.tabIds.length) continue;
    try {
      await api.tabs.create({ windowId: win.windowId, active: false });
      await api.tabs.remove(win.tabIds);
    } catch {
      // Window went away on its own; the bookmarks are already safe.
    }
  }
}
