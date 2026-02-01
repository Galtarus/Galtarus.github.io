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
