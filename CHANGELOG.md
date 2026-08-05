# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] — 2026-08-05

### Added

- Real logo, replacing the placeholder icon. Source artwork lives in `assets/`,
  outside both builds so it is not shipped inside the extension package.
- The mark now appears in the popup header, and the wordmark heads the README.
- `tools/icons.ps1`, which regenerates the four icon sizes from
  `assets/logo.png`. It crops to the artwork's opaque bounds first — scaling the
  padded square directly left the toolbar icon looking undersized — and firms up
  alpha at 16 and 32 px, where the shard trail otherwise faded to pale noise.

## [1.3.0] — 2026-08-04

### Added

- Popup footer showing the running version on the left and a "See on GitHub"
  link on the right. Both read from the manifest, so each build reports its own
  version and the URL is not duplicated in code.
- `homepage_url` in both manifests.

## [1.2.0] — 2026-08-04

### Added

- Firefox support, as a separate `firefox/` build. Requires Firefox 139 or newer,
  where `browser.tabGroups` shipped.
- `lib/api.js`, which resolves the extension namespace once. Firefox's `chrome`
  shim is callback-based, so awaiting it returns `undefined` rather than a result
  — the promise-based `browser` namespace is preferred where it exists.
- `tools/sync.mjs`, mirroring `chromium/` into `firefox/`. Only `manifest.json`
  differs between the two builds.
- `test/parity.test.mjs`, which fails if the two builds drift apart and covers
  both branches of the namespace resolution.
- README with install steps for both browsers and a feature checklist, this
  changelog, and the GPL-3.0 license.

### Changed

- The Chromium extension moved from the repository root into `chromium/`.
  Existing installations must be re-loaded from the new path.
- "Other bookmarks" is now resolved across browsers — Chromium ids it `2`,
  Firefox ids it `unfiled_____`.

### Removed

- The "Open folder" button on Firefox, where the bookmark manager is a Library
  window with no navigable URL and the button could never work.

## [1.1.0] — 2026-08-04

### Added

- **Group folders** setting: group folders are hoisted above the loose tabs by
  default, or left in tab order.
- Settings moved into the popup, alongside the save button, applying immediately.
  Changing one re-reads the preview, so the tab count and destination never go
  stale above the Save button.

### Changed

- Default parent folder is now `TabsExplode Saved Tabs`. Folders saved by earlier
  versions are left untouched.
- The separate options page was removed; `options_ui` now points at the popup, so
  there is only one copy of the settings UI.

## [1.0.0] — 2026-08-04

### Added

- Bookmark every open tab in one click, with tab groups preserved as folders and
  tab-strip order preserved throughout.
- Confirmation popup with an editable, timestamped folder name.
- Settings for scope, after-save behaviour, and destination.
- Saving runs in the service worker, so a popup dismissed mid-save cannot leave a
  half-written folder behind.
- Untitled groups are numbered; duplicate group names get a ` (2)` suffix.

[1.4.0]: https://github.com/badjuice/TabsExplode/releases/tag/v1.4.0
[1.3.0]: https://github.com/badjuice/TabsExplode/releases/tag/v1.3.0
[1.2.0]: https://github.com/badjuice/TabsExplode/releases/tag/v1.2.0
[1.1.0]: https://github.com/badjuice/TabsExplode/releases/tag/v1.1.0
[1.0.0]: https://github.com/badjuice/TabsExplode/releases/tag/v1.0.0
