// Exercises collect() and write() against a fake chrome API, so the ordering
// and grouping rules can be checked without loading the extension.
//   node test/logic.test.mjs
import { pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert";

// Runs against the Chromium build; parity.test.mjs guarantees firefox/ is the
// same code, so testing one covers both.
const EXT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "chromium");

// ---- fake bookmark store -------------------------------------------------
let nextId = 100;
let nodes;
function resetBookmarks() {
  nodes = new Map();
  // root "0" with the two permanent folders Chromium ships
  nodes.set("0", { id: "0", title: "", children: [] });
  nodes.set("1", { id: "1", parentId: "0", title: "Bookmarks bar", children: [] });
  nodes.set("2", { id: "2", parentId: "0", title: "Other bookmarks", children: [] });
  nodes.get("0").children.push(nodes.get("1"), nodes.get("2"));
}

const bookmarks = {
  async create({ parentId, title, url }) {
    const node = { id: String(nextId++), parentId, title, url };
    if (!url) node.children = [];
    nodes.set(node.id, node);
    nodes.get(parentId).children.push(node);
    return node;
  },
  async getChildren(id) {
    return nodes.get(id).children ?? [];
  },
  async getTree() {
    return [nodes.get("0")];
  },
  async get(id) {
    return [nodes.get(id)];
  },
};

function render(node, depth = 0) {
  const pad = "  ".repeat(depth);
  const lines = [];
  for (const child of node.children ?? []) {
    lines.push(`${pad}${child.title}${child.url ? "" : "/"}`);
    if (!child.url) lines.push(...render(child, depth + 1));
  }
  return lines;
}

// ---- fake tab state ------------------------------------------------------
// index 0 pinned, then a group, a loose tab, an untitled group, and a second
// group whose title collides with the first.
const WIN_A = {
  id: 1,
  tabs: [
    { id: 10, index: 0, url: "https://pin.example", title: "Pinned", pinned: true, groupId: -1 },
    { id: 11, index: 1, url: "https://news.example", title: "HN", groupId: -1 },
    { id: 12, index: 2, url: "https://a.example", title: "A", groupId: 7 },
    { id: 13, index: 3, url: "https://b.example", title: "B", groupId: 7 },
    { id: 14, index: 4, url: "https://loose.example", title: "Loose", groupId: -1 },
    { id: 15, index: 5, url: "https://c.example", title: "C", groupId: 8 },
    { id: 16, index: 6, url: "", title: "Broken", groupId: 8 },
    // Stands in for a Zen Space that isn't the active one: hidden, and in its
    // own container. It must still be collected — missing these was the bug.
    {
      id: 17,
      index: 7,
      url: "https://d.example",
      title: "D",
      groupId: 9,
      hidden: true,
      cookieStoreId: "firefox-container-2",
    },
  ],
};
const WIN_B = {
  id: 2,
  tabs: [{ id: 20, index: 0, url: "https://solo.example", title: "Solo", groupId: -1 }],
};
const GROUPS = {
  1: [
    { id: 7, title: "Research", windowId: 1 },
    { id: 8, title: "", windowId: 1 },
    { id: 9, title: "Research", windowId: 1 },
  ],
  2: [],
};

// lib/api.js captures globalThis.chrome once, at module load. So the stub is
// installed before the dynamic imports below and then mutated in place —
// reassigning globalThis.chrome later would leave `api` pointing at the old
// object and every call would land on a dead stub.
const CHROME = {
  bookmarks,
  storage: { local: { async get() { return {}; }, async set() {} } },
  windows: {
    async get(id) {
      return [WIN_A, WIN_B].find((w) => w.id === id);
    },
    async getAll() {
      return [WIN_A, WIN_B].map(({ id }) => ({ id }));
    },
  },
  // collect() reads tabs through tabs.query, not windows.populate, so that
  // Space-hidden tabs are included. The fake mirrors that.
  tabs: {
    async query({ windowId }) {
      const win = [WIN_A, WIN_B].find((w) => w.id === windowId);
      return win ? [...win.tabs] : [];
    },
  },
  tabGroups: {
    async query({ windowId }) {
      return GROUPS[windowId];
    },
  },
};
globalThis.chrome = CHROME;

function installChrome({ tabGroups = true } = {}) {
  if (tabGroups) {
    CHROME.tabGroups = { async query({ windowId }) { return GROUPS[windowId]; } };
  } else {
    delete CHROME.tabGroups;
  }
}

// ---- run -----------------------------------------------------------------
const { collect } = await import(pathToFileURL(`${EXT}/lib/collect.js`));
const { write } = await import(pathToFileURL(`${EXT}/lib/write.js`));

async function run(scope, opts = {}) {
  resetBookmarks();
  installChrome(opts);
  const plan = await collect(scope, 1);
  const result = await write(plan, {
    rootId: "2",
    containerName: "TabsExplode Saved Tabs",
    groupPlacement: opts.groupPlacement ?? "top",
    sessionName: "2026-08-04 17.20",
  });
  return { plan, result, tree: render(nodes.get("2")).join("\n") };
}

let failures = 0;
function check(name, actual, expected) {
  try {
    assert.deepStrictEqual(actual, expected);
    console.log(`PASS  ${name}`);
  } catch {
    failures++;
    console.log(`FAIL  ${name}\n--- actual ---\n${actual}\n--- expected ---\n${expected}\n`);
  }
}

// 1. default placement: group folders hoisted above the loose tabs, relative
//    order preserved inside each bucket, collision suffixed, empty-url tab
//    skipped, no per-window folder layer.
{
  const { plan, result, tree } = await run("current");
  check(
    "hoisted single window tree",
    tree,
    [
      "TabsExplode Saved Tabs/",
      "  2026-08-04 17.20/",
      "    Research/",
      "      A",
      "      B",
      "    Group 1/",
      "      C",
      "    Research (2)/",
      "      D",
      "    Pinned",
      "    HN",
      "    Loose",
    ].join("\n"),
  );
  check("single window counts", plan.counts, {
    windows: 1, tabs: 7, groups: 3, skipped: 1, hidden: 1, stores: 1,
  });
  check("hidden Space tab was collected", tree.includes("D"), true);
  check("written count", result.written, 7);
  check("tabIds exclude skipped", plan.windows[0].tabIds, [10, 11, 12, 13, 14, 15, 17]);
}

// 1b. inline placement leaves each group where its tabs sat in the strip.
{
  const { tree } = await run("current", { groupPlacement: "inline" });
  check(
    "inline single window tree",
    tree,
    [
      "TabsExplode Saved Tabs/",
      "  2026-08-04 17.20/",
      "    Pinned",
      "    HN",
      "    Research/",
      "      A",
      "      B",
      "    Loose",
      "    Group 1/",
      "      C",
      "    Research (2)/",
      "      D",
    ].join("\n"),
  );
}

// 2. all windows: adds the Window N layer.
{
  const { plan, tree } = await run("all");
  check(
    "all windows tree",
    tree,
    [
      "TabsExplode Saved Tabs/",
      "  2026-08-04 17.20/",
      "    Window 1/",
      "      Research/",
      "        A",
      "        B",
      "      Group 1/",
      "        C",
      "      Research (2)/",
      "        D",
      "      Pinned",
      "      HN",
      "      Loose",
      "    Window 2/",
      "      Solo",
    ].join("\n"),
  );
  check("all windows counts", plan.counts, {
    windows: 2, tabs: 8, groups: 3, skipped: 1, hidden: 1, stores: 1,
  });
}

// 3. fork without chrome.tabGroups: grouping survives, names degrade.
{
  const { tree } = await run("current", { tabGroups: false });
  check(
    "no tabGroups API",
    tree,
    [
      "TabsExplode Saved Tabs/",
      "  2026-08-04 17.20/",
      "    Group 1/",
      "      A",
      "      B",
      "    Group 2/",
      "      C",
      "    Group 3/",
      "      D",
      "    Pinned",
      "    HN",
      "    Loose",
    ].join("\n"),
  );
}

// 4. second save reuses the container, adds a sibling session folder.
{
  resetBookmarks();
  installChrome();
  for (const name of ["first", "second"]) {
    const plan = await collect("current", 1);
    await write(plan, {
      rootId: "2",
      containerName: "TabsExplode Saved Tabs",
      groupPlacement: "top",
      sessionName: name,
    });
  }
  const containers = nodes.get("2").children;
  check("one container after two saves", containers.length, 1);
  check(
    "two session folders",
    containers[0].children.map((c) => c.title),
    ["first", "second"],
  );
}

console.log(failures ? `\n${failures} failing` : "\nall green");
process.exit(failures ? 1 : 0);
