---
"@cadence-clinical/tokens": patch
---

Token names are typed. `resolveTokens` returns `ResolvedTokens`, a record keyed by the new `TokenName` union, so a lookup such as `tokens.critical` is a `string` and a misspelt name is a compile error. `checkContrast` takes the same type, and `ACCENT_NAMES` is a readonly tuple. The generated `theme.css` is unchanged.
