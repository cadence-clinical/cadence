---
"@cadence-clinical/core": patch
---

`Region` is read-only all the way down: every field, including `dateTime`, is `readonly`, and `defineRegion` freezes the lineage, the date and time settings and each map as well as the region. `ComponentGrade`'s fields are read-only too.
