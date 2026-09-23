---
"@cadence-clinical/tokens": patch
---

`createAccent` reports a seed that is not a colour in `problems` instead of throwing, and returns the default accent in its place so the result is complete. `checkBrand` reports it the same way. `assertAccent` and `assertBrand` still throw. `Brand`, `AccentDefinition` and `AccentRoles` are read-only.
