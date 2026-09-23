---
"@cadence-clinical/ui": minor
---

Date picker: in `mode="time"`, `value`, `defaultValue` and `onValueChange` take the time of day as a string, such as `"14:30"`, instead of a `Date`. A time on its own used to be joined to today on the device's clock and in its time zone, which guessed the day. The props are now a union on `mode`, so a `Date` passed to a time, or a string to a date, does not compile.
