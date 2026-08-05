// Generated from CHANGELOG.md by tools/changelog.mjs. Do not edit by hand.
export const RELEASES = [
  {
    "version": "1.9.0",
    "date": "2026-08-05",
    "sections": [
      {
        "kind": "Changed",
        "items": [
          "The About toggle moved from the footer to the brand row, top right. The views differ in height, so a footer-mounted button shifted out from under the cursor on every click; the brand row is the one strip whose position never moves.",
          "Cancel, Close and the toggle carry a gradient outline at rest and fill with the gradient on hover. A CSS border cannot take a gradient, so these use two background layers: the page colour clipped to the padding box, the gradient clipped to the border box, with a transparent border between them.",
          "Dropdowns and text fields take the same gradient border on hover and focus, replacing the flat accent outline.",
          "Dropdowns draw their own chevron. Setting any background-image on a select removes the native arrow, so it had to be supplied."
        ]
      }
    ]
  },
  {
    "version": "1.8.0",
    "date": "2026-08-05",
    "sections": [
      {
        "kind": "Changed",
        "items": [
          "The popup now uses the logo's colours. Headings and the brand name carry the amber-to-red gradient, and the Save button is filled with it. The accent was still the blue placeholder from before the logo existed, so nothing on screen matched the icon.",
          "Every button has a visible border or fill, so none of them read as plain text.",
          "About and Back collapsed into one toggle button in the bottom-right of the footer, bordered and aligned against the version on the opposite edge."
        ]
      }
    ]
  },
  {
    "version": "1.7.1",
    "date": "2026-08-05",
    "sections": [
      {
        "kind": "Changed",
        "items": [
          "The footer now carries the version and an About link only. \"See on GitHub\" moved into the About panel, next to the credits."
        ]
      }
    ]
  },
  {
    "version": "1.7.0",
    "date": "2026-08-05",
    "sections": [
      {
        "kind": "Added",
        "items": [
          "About panel in the popup, reached from the footer and hidden until asked for. Carries the development credits and the full changelog.",
          "tools/changelog.mjs, which generates chromium/lib/changelog.js from this file. parity.test.mjs fails if the generated copy falls behind, so the in-app changelog cannot drift from this one."
        ]
      },
      {
        "kind": "Changed",
        "items": [
          "Removed every em-dash from the README, this changelog, the popup text and the source comments, and stopped using them."
        ]
      }
    ]
  },
  {
    "version": "1.6.0",
    "date": "2026-08-05",
    "sections": [
      {
        "kind": "Changed",
        "items": [
          "Saves now cover the active Zen Space only, and say so. Zen exposes no Spaces API, so a saved folder cannot record which Space a tab came from; pooling every Space into one unlabelled folder was worse than leaving them out. The popup reports how many tabs were skipped, so nothing disappears silently.",
          "Dropped the space count from the summary line. It was inferred from cookie stores, which only detects container-bound Spaces and would have been wrong for anyone whose Spaces have no container assigned."
        ]
      }
    ]
  },
  {
    "version": "1.5.1",
    "date": "2026-08-05",
    "sections": [
      {
        "kind": "Fixed",
        "items": [
          "Popup settings took a visible moment to populate, and got worse the more the extension was used. getRootFolders() called bookmarks.getTree(), which serialises every bookmark in the profile. It ran three times per open: twice in the popup, once in the background preview. It now reads only the root's children via bookmarks.getChildren(), resolveRootId() accepts already-fetched folders instead of refetching, and the popup loads settings and preview in parallel. On a 2,000-bookmark profile this drops one popup open from 6,009 serialised nodes to 4."
        ]
      }
    ]
  },
  {
    "version": "1.5.0",
    "date": "2026-08-05",
    "sections": [
      {
        "kind": "Fixed",
        "items": [
          "Tabs in inactive Zen Spaces were silently omitted from saves. collect() read tabs via windows.get({ populate: true }), which excludes hidden tabs. Zen hides every tab belonging to a Space that isn't active. It now reads through tabs.query(), which returns them."
        ]
      },
      {
        "kind": "Added",
        "items": [
          "The summary line reports spaces when they are detectable, and a note when a save includes tabs from other spaces."
        ]
      }
    ]
  },
  {
    "version": "1.4.0",
    "date": "2026-08-05",
    "sections": [
      {
        "kind": "Added",
        "items": [
          "Real logo, replacing the placeholder icon. Source artwork lives in assets/, outside both builds so it is not shipped inside the extension package.",
          "The mark now appears in the popup header, and the wordmark heads the README.",
          "tools/icons.ps1, which regenerates the four icon sizes from assets/logo.png. It crops to the artwork's opaque bounds first, because scaling the padded 1254x1254 square directly left the toolbar icon looking undersized. It also firms up alpha at 16 and 32 px, where the shard trail otherwise faded to pale noise."
        ]
      }
    ]
  },
  {
    "version": "1.3.0",
    "date": "2026-08-04",
    "sections": [
      {
        "kind": "Added",
        "items": [
          "Popup footer showing the running version on the left and a \"See on GitHub\" link on the right. Both read from the manifest, so each build reports its own version and the URL is not duplicated in code.",
          "homepage_url in both manifests."
        ]
      }
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-08-04",
    "sections": [
      {
        "kind": "Added",
        "items": [
          "Firefox support, as a separate firefox/ build. Requires Firefox 139 or newer, where browser.tabGroups shipped.",
          "lib/api.js, which resolves the extension namespace once. Firefox's chrome shim is callback-based, so awaiting it returns undefined rather than a result. The promise-based browser namespace is preferred where it exists.",
          "tools/sync.mjs, mirroring chromium/ into firefox/. Only manifest.json differs between the two builds.",
          "test/parity.test.mjs, which fails if the two builds drift apart and covers both branches of the namespace resolution.",
          "README with install steps for both browsers and a feature checklist, this changelog, and the GPL-3.0 license."
        ]
      },
      {
        "kind": "Changed",
        "items": [
          "The Chromium extension moved from the repository root into chromium/. Existing installations must be re-loaded from the new path.",
          "\"Other bookmarks\" is now resolved across browsers. Chromium ids it 2, Firefox ids it unfiled_____."
        ]
      },
      {
        "kind": "Removed",
        "items": [
          "The \"Open folder\" button on Firefox, where the bookmark manager is a Library window with no navigable URL and the button could never work."
        ]
      }
    ]
  },
  {
    "version": "1.1.0",
    "date": "2026-08-04",
    "sections": [
      {
        "kind": "Added",
        "items": [
          "Group folders setting: group folders are hoisted above the loose tabs by default, or left in tab order.",
          "Settings moved into the popup, alongside the save button, applying immediately. Changing one re-reads the preview, so the tab count and destination never go stale above the Save button."
        ]
      },
      {
        "kind": "Changed",
        "items": [
          "Default parent folder is now TabsExplode Saved Tabs. Folders saved by earlier versions are left untouched.",
          "The separate options page was removed; options_ui now points at the popup, so there is only one copy of the settings UI."
        ]
      }
    ]
  },
  {
    "version": "1.0.0",
    "date": "2026-08-04",
    "sections": [
      {
        "kind": "Added",
        "items": [
          "Bookmark every open tab in one click, with tab groups preserved as folders and tab-strip order preserved throughout.",
          "Confirmation popup with an editable, timestamped folder name.",
          "Settings for scope, after-save behaviour, and destination.",
          "Saving runs in the service worker, so a popup dismissed mid-save cannot leave a half-written folder behind.",
          "Untitled groups are numbered; duplicate group names get a  (2) suffix."
        ]
      }
    ]
  }
];
