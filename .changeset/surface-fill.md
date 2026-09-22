---
"@cadence-clinical/ui": patch
---

Card, Dialog, Alert Dialog and Popover make their own colour the fill of the controls inside them. Fields, checkboxes and outline buttons fill with `background`, the page colour, so a field in a card now matches the card. Nothing changes in light mode at standard contrast, where the page and a card are both white. In dark mode, and under a brand whose page has its own colour, controls in these surfaces take the surface's colour instead of the page's.
