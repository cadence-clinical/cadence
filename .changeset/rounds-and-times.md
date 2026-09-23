---
"@cadence-clinical/core": minor
---

Add `groupRounds`, which groups readings taken close together into rounds for a flowsheet's columns, and `describeTime`, which describes a time as "Today", "Yesterday" or a short date and a 24 hour time, in a time zone the caller states. An observation level now has a `short` label for dense displays, and a series definition an optional `unitLabel`.
