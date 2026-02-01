# Timeline DEVLOG

## Cycle 1 — skeleton + routing + demo data

- Created `/timeline/` as a self-contained static SPA (no build tooling).
- Implemented hash routing (`#/`, `#/entry/<id>`, `#/edit/<id>`, `#/about`).
- Added demo entries and basic timeline + entry detail + placeholder editor.
- Added click-to-load YouTube embed using `youtube-nocookie.com`.

Next: implement real browse UI + stronger entry details.

## Cycle 2 — browse UI + entry detail

- Timeline route now matches the requested layout:
  - Desktop: horizontal scrollable timeline on the left + right-panel preview for the selected entry.
  - Mobile: vertical list; tapping an entry opens the dedicated detail route.
- Entry detail route improved with prev/next navigation.

## Cycle 3 — editor + persistence

- Implemented add/edit entry form (`#/edit/new` and `#/edit/<id>`).
- Save/update/delete entries persisted to `localStorage`.
- Basic validation (title required; date optional but must be YYYY-MM-DD if provided).

## Cycle 4 — polish (search/filter, CSP, a11y/perf basics)

- Added search + tag filter on the timeline view.
- Tweaked CSP to explicitly allow YouTube frames (nocookie + youtube.com) and https images.
- Improved focus visibility for keyboard users.
- `ui.el()` now correctly applies `value`/`checked` as properties (needed for `<select>` state).

## Cycle 5 — entry images (vertical slice)

- Added optional `imageUrl` field to entries.
- Editor supports editing an https image URL.
- Entry detail renders the image (lazy-loaded, no-referrer).

What to review:
- Create/edit an entry, set an `https://…` image URL, ensure it shows on the entry detail page.

## Cycle 6 — import/export + reset (vertical slice)

- Added JSON export/import and “Reset to demo” controls on the About page.
- Import validates basic shape and replaces local data.

What to review:
- Go to About → Export JSON.
- Modify/delete some entries → About → Reset to demo.
- About → Import JSON (use the exported file) and confirm it restores your data.
