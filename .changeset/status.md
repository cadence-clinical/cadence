---
"@cadence-clinical/ui": minor
---

Add Status, a state shown as an icon and a word with no surface, such as "Referred" or "Cleared". `tone` is `neutral`, `info`, `success`, `warning` or `critical`, and colours only the icon, with the status's text token, so the words keep their contrast on any row. The icon is passed as a child with `data-icon`, and the words say the state, so it is never shown by colour alone. It renders a `span` with `data-slot="status"` and `data-tone`, and takes Base UI's `render`.
