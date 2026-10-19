---
"@cadence-clinical/ui": minor
---

Add Mode toggle, shadcn's mode toggle: an icon button with a sun or a moon that opens a menu of Light, Dark and System, with the chosen mode ticked. Choosing Light or Dark sets `data-mode` on `<html>` and stores it in `localStorage` under `cadence-mode`. System removes both, so the page follows `prefers-color-scheme`. Every storage read and write is guarded, so the mode still changes where storage is blocked. `value` and `onValueChange` control it, `labels` replaces its words, and the rest of its props go to the Button. `useMode` gives any component the page's mode and follows a change made by the toggle, another tab or the device. `setMode`, `getMode` and `getResolvedMode` work outside React, and `MODE_SCRIPT` applies a remembered mode in the page's `<head>` before the first paint.
