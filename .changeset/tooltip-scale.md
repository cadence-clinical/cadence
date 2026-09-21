---
"@cadence-clinical/ui": patch
---

A Tooltip's growth now animates with its fade. Tailwind sets `scale` as a property of its own, and the tooltip was transitioning `transform`, so the fade ran and the growth snapped.
