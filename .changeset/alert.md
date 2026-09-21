---
"@cadence-clinical/ui": minor
"@cadence-clinical/tokens": patch
---

Alert, with shadcn's part names and the four statuses. A status carries its fill, its border token, an icon with its own outline and the status in words for a screen reader, so it never rests on colour. `critical` and `warning` are announced at once and the rest politely, the message is at full contrast, and the action drops under the words when the alert is narrow. The tokens now assert the page's text colour on every status fill.
