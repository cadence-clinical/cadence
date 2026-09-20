---
"@cadence-clinical/tokens": patch
"@cadence-clinical/ui": minor
---

Label and Input. Both follow the density set on the page. Input keeps a read-only value at full contrast, never fades its boundary or focus ring, and uses 16px text on touch devices so iOS does not zoom. The `input` and `ring` tokens are now contrast-tested against `card` as well as the page.
