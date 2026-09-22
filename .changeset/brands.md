---
"@cadence-clinical/tokens": minor
---

Brands: a preset for the whole page, set with `data-brand`. A brand is an accent seed, light-mode surfaces and text, and fonts. `generateBrandCss` writes its CSS after `assertBrand` has checked every contrast pairing in both modes at both contrast levels. A brand cannot set a status colour, and its surfaces apply in light mode at standard contrast only, so dark mode and more contrast keep Cadence's tested neutrals. `brands.css` ships three example brands, `midnight`, `lagoon` and `cobalt`, which a page gets only by importing it. Two contrast pairings are new: `input` and `ring` on `popover`, for a control in a dialog or a popover.
