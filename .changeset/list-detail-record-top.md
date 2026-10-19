---
"@cadence-clinical/ui": patch
---

List and detail: on a phone, a record that opens now starts at its top. It was focused where the list had been scrolled to, so a long record opened part way down, and a record could open with its top, and its way back, under a sticky header. The list and the record now scroll to just below the header, using `--header-height`. Its grade stays tested.
