---
"@cadence-clinical/core": minor
"@cadence-clinical/fhir": minor
---

Add the observation view model to `core`, and the first `fhir` transform. `observationSeries` reads FHIR R4 Observations, from a resource, a Bundle or the pages of a search, into series selected by coding and period. It checks every field it reads, keeps each value's unit, the source's interpretation and its reference range, and returns everything it could not read as a list of issues rather than dropping it.
