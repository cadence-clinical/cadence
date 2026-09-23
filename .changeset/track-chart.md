---
"@cadence-clinical/ui": minor
---

Add Track chart, a composite of tracks on one shared time axis that scrolls sideways through time. Its time axis falls on the local hour in a time zone you state, with alternating stripes that follow the span. Tracks carry bands, and marks for a line, labelled points, a pair of values such as blood pressure, and events in words. The body is one stop for the keyboard: the arrow keys move a crosshair between times, and what it shows is read out. Only the time near the view is drawn. Also adds `linearScale`, `niceTicks`, `timeTicks` and `intervalForSpan`.
