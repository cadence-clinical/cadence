---
"@cadence-clinical/clinical": minor
---

Add Observation table, the first clinical component: a flowsheet of observations, one row per series and one column per round, oldest to newest and opening at the newest. Each value shows the band an observation schema gave it by fill, edge, a short label and bold figures, and its change since the value before. A value the schema could not judge says why, a value in another unit carries its own unit, and a value not recorded says so. Its words, times and time zone are passed in.
