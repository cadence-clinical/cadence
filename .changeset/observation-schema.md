---
"@cadence-clinical/core": minor
---

Add the observation schema. `defineObservationSchema` checks a schema of levels, series, bands, coded answers and words for interpretation codes, and `applyObservationSchema` gives each reading its band, or the reason it has none, beside the source's own interpretation. Bands run from a value up to, not including, the next, and a schema whose bands overlap or leave a gap is rejected. A value is banded only in the unit its bands are written in. A level names a step of a fixed severity scale, never a colour. The change from the previous reading is rounded to the precision the values were written with. Coverage of `core` is now 100%, enforced by the test run.
