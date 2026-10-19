---
"@cadence-clinical/ui": minor
---

Add Description list, pairs of a term and its details, such as a working problem or an expected discharge: `DescriptionList` (a `dl`), `DescriptionItem` (a `div` around each pair), `DescriptionTerm` and `DescriptionDetails`. The terms take a column as wide as the widest of them, up to 40% of the list, and every item shares the list's columns, so the pairs line up. With `orientation="responsive"`, the default, the list measures its own width and stacks each term over its details below 18rem. `horizontal` and `vertical` fix the layout. Terms and details wrap and are never cut short.
