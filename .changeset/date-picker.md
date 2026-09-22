---
"@cadence-clinical/ui": minor
---

Add Date picker, shadcn's date picker with an input, from its own entry point `@cadence-clinical/ui/date-picker`. `mode` asks for a date, a date and a time, or a time. What is typed is read in the locale's order, so 03/04/2026 is 3 April where the day comes first, a date that does not exist is marked wrong rather than rolled into the next month, and the year is written in full.
