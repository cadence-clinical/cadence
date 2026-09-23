---
"@cadence-clinical/clinical": minor
"@cadence-clinical/ui": minor
---

Add Vitals chart: vital signs on stacked tracks over one time axis, laid out by a `tracks` prop, with the bands an observation schema gave them. Its toolbar chooses the span from 2 hours to 3 days, moves to the start or the latest round, shows and hides tracks, and sets each track's range to the schema's, all values, or the values in view. A value that cannot go on its track's scale is written at its time instead. Track chart's crosshair now snaps to the nearest snap time, and its points take a `pointClassName`.
