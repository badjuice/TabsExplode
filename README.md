<p align="center">
  <img src="assets/logo-wordmark.png" alt="TabsExplode" width="380">
</p>

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

## Why this exists

I use several different browsers, and none of them solved this properly. The
built-in "Bookmark all tabs" flattens everything into a single folder, and the
extensions I could find either did the same thing or handled tab groups badly
enough to be useless — no folder per group, or group membership dropped on the
floor entirely. I wanted the structure I actually work in to survive the save.

It was built with Claude because of time, not ability. I have a lot of ideas and
very little room to implement them all — some are things I genuinely need, some
just make my work easier or faster, and some are side projects I want to see
exist. This was one of them, and the assistance is what moved it from an idea to
something I actually use.

## Install

Neither build needs compiling. Get the code first:

```bash
git clone https://github.com/badjuice/TabsExplode.git
```

Or download the ZIP from the GitHub page and extract it somewhere permanent —
both browsers load the extension from that folder and will break if you move or
delete it later.

### Chromium

Chrome, Edge, Brave, Vivaldi, Opera, Helium, ungoogled-chromium, Arc.

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. **Load unpacked** → select the `chromium/` folder (the one containing
   `manifest.json`, not a folder inside it)

The extension stays installed across restarts.

### Firefox

Firefox 139 or newer, and forks on a 139+ base — Zen, LibreWolf, Waterfox,
Floorp.

1. Open `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on…**
3. Select `firefox/manifest.json`

Temporary add-ons are removed when the browser restarts, so this has to be
repeated each session. A signed build for permanent installation is on the
roadmap.

On Zen specifically: its nested **tab folders** are Zen's own feature, separate
from Firefox's native tab groups. Native groups are read normally; whether Zen's
tab folders surface through the same API is untested. If saved folders come out
named `Group 1`, `Group 2` instead of your real group names, they don't.

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

Two floors, both set by when the tab-groups API became available: **Chromium 89**
(March 2021) and **Firefox 139**. Both are old enough that any browser still
receiving updates clears them comfortably — the numbers below matter only if you
are pinned to something ancient.

| Browser | Minimum | Notes |
| --- | --- | --- |
| Chrome | 89 | Where `chrome.tabGroups` shipped |
| Edge | 89 | Tracks Chrome release for release |
| Brave | 1.22 | The first Brave built on Chromium 89 |
| Vivaldi | 3.7 | 3.6 was still on Chromium 88 |
| Opera | ~75 | The Chromium 89 generation |
| Helium | any release | Chromium-based and well past the floor |
| ungoogled-chromium | 89 | Tracks Chromium directly |
| Firefox | 139 | Where `browser.tabGroups` shipped |
| Safari | — | Not supported; would need an Xcode conversion |

Other Chromium forks not listed here work too — the requirement is simply a
Chromium 89 or newer base with the extension system intact.

Tab-group support is feature-detected rather than assumed, so on a browser that
lacks the API tabs still group correctly; only the folder names fall back to
`Group 1`, `Group 2`. That also means the extension degrades instead of breaking
on a fork that has stripped parts of the extension surface.

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
