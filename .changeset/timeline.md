---
"@cadence-clinical/ui": minor
---

Add Timeline, things that happened in order, each with its kind, who, when and what: `Timeline` (an `ol`), `TimelineItem`, `TimelineIcon`, `TimelineHeader`, `TimelineTitle`, `TimelineTime` (a `time` element) and `TimelineContent`, which holds any content, such as a Comment. The header comes before the content, so a screen reader hears the kind, who and when before what, and the icon is hidden from it. `variant="connected"` joins each icon to the next with a rule. The icon's circle follows the density.
