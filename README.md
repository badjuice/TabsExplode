# TabsExplode

Bookmarks every open tab in one click and keeps your tab groups as folders —
which the browser's own "Bookmark all tabs" throws away.

Available for Chromium browsers and Firefox.

```
Other bookmarks/
└─ TabsExplode Saved Tabs/
   └─ 2026-08-04 17.20/     ← one folder per save, name editable in the popup
      ├─ Research/          ← group folders first, by default
      │  ├─ arXiv paper
      │  └─ Wikipedia — Kalman filter
      ├─ Group 1/           ← an untitled group
      │  └─ ...
      ├─ Hacker News        ← then the ungrouped tabs, in tab-strip order
      └─ Another loose tab
```

Two groups sharing a name get a ` (2)` suffix. Saving with more than one window
in scope adds a `Window 1` / `Window 2` layer; with a single window that layer is
skipped.

## Install

**Chromium** (Chrome, Edge, Brave, Vivaldi, Opera, Helium, ungoogled-chromium)

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. **Load unpacked** → select the `chromium/` folder

**Firefox** (139 or newer)

1. Open `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on…**
3. Select `firefox/manifest.json`

Temporary add-ons are removed when Firefox restarts. A signed build for
permanent installation is on the roadmap.

## Use

Click the toolbar icon. The popup shows what will be saved, lets you rename the
folder, saves on Enter, and carries all the settings underneath.

| Setting | Default |
| --- | --- |
| Save tabs from | The current window |
| Group folders | At the top — set to **In tab order** to keep each group where it sat in the strip |
| After saving | Leave tabs open |
| Save into | Other bookmarks |
| Parent folder | `TabsExplode Saved Tabs` |

Changes apply immediately. Closing tabs after a save only runs once every
bookmark is written, and each window gets a fresh blank tab first so it does not
disappear along with its last tab.

## Features

- [x] Bookmark every open tab in one click
- [x] Tab groups saved as folders, with their real titles
- [x] Group folders hoisted to the top, or left in tab order
- [x] Current window or every open window
- [x] Optional close-after-save
- [x] Configurable destination and parent folder
- [x] Settings live in the popup
- [x] Chromium support
- [x] Firefox support
- [ ] Keyboard shortcut
- [ ] Skip duplicate and junk URLs
- [ ] Popup remembers last-used choices
- [ ] Restore — rebuild windows and tab groups from a saved folder
- [ ] Published to the Chrome Web Store and AMO

## Browser support

| Browser | Minimum | Notes |
| --- | --- | --- |
| Chrome & Chromium forks | 89 | Where `chrome.tabGroups` shipped |
| Firefox | 139 | Where `browser.tabGroups` shipped |
| Safari | — | Not supported; needs an Xcode conversion |

Tab-group support is feature-detected, so on a browser that lacks the API tabs
still group correctly — only the folder names fall back to `Group 1`, `Group 2`.

## Development

Only `manifest.json` differs between the two builds. Everything else is mirrored
from `chromium/` into `firefox/`:

```bash
node tools/sync.mjs
```

Edit under `chromium/`, sync, then run both suites:

```bash
node test/logic.test.mjs && node test/parity.test.mjs
```

`logic.test.mjs` drives `collect()` and `write()` against a fake browser API,
covering tab ordering, both group placements, name collisions, the multi-window
layer, and the no-`tabGroups` fallback. `parity.test.mjs` fails if the two builds
drift apart.

## License

[GPL-3.0](LICENSE).

---

Made by [BadJuice](https://github.com/badjuice) with the assistance of
[Claude](https://claude.ai).
