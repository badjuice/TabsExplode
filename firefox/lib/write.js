import { api } from "./api.js";

export async function write(plan, { rootId, containerName, sessionName, groupPlacement }) {
  const container = await findOrCreateFolder(rootId, containerName);
  const session = await api.bookmarks.create({
    parentId: container.id,
    title: sessionName,
  });

  const perWindowFolders = plan.windows.length > 1;
  let written = 0;

  for (const win of plan.windows) {
    const parent = perWindowFolders
      ? await api.bookmarks.create({ parentId: session.id, title: win.label })
      : session;
    const usedNames = new Set();

    for (const node of order(win.nodes, groupPlacement)) {
      if (node.kind === "tab") {
        await create(parent.id, node);
        written++;
        continue;
      }

      const folder = await api.bookmarks.create({
        parentId: parent.id,
        title: uniqueName(node.name, usedNames),
      });
      for (const tab of node.tabs) {
        await create(folder.id, tab);
        written++;
      }
    }
  }

  return { folderId: session.id, written };
}

// "top" lifts every group folder above the loose tabs; "inline" leaves each
// group where its tabs sat in the strip. Either way the relative order within
// groups and within loose tabs is untouched.
function order(nodes, groupPlacement) {
  if (groupPlacement !== "top") return nodes;
  return [
    ...nodes.filter((node) => node.kind === "group"),
    ...nodes.filter((node) => node.kind === "tab"),
  ];
}

// Awaited one at a time on purpose: bookmarks are ordered by insertion, and
// matching the tab strip's order is the whole point of this extension.
function create(parentId, { title, url }) {
  return api.bookmarks.create({ parentId, title, url });
}

async function findOrCreateFolder(parentId, title) {
  const children = await api.bookmarks.getChildren(parentId);
  const existing = children.find((child) => !child.url && child.title === title);
  return existing ?? api.bookmarks.create({ parentId, title });
}

function uniqueName(name, used) {
  let candidate = name;
  for (let n = 2; used.has(candidate); n++) candidate = `${name} (${n})`;
  used.add(candidate);
  return candidate;
}
