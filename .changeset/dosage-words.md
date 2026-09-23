---
"@cadence-clinical/core": minor
---

Add `describeDosage` and `quantityWords`, which write a dosage in the order and terms of the National Guidelines for On-Screen Display of Medicines Information: the DOSE label, frequency in the guidelines' terms, "when required for …", and the most in 24 hours, for a clinician or in plain words for a patient. Units are written as the guidelines write them, with no trailing zeros, a leading zero, a thousands separator and a non-breaking space. Where a dosage cannot be written from its parts, the prescriber's text is used as written. A "when required" dosage with no reason or no maximum reports the gap.
