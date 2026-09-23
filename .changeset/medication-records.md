---
"@cadence-clinical/core": minor
"@cadence-clinical/fhir": minor
---

Add the medication view model to `core`, and `medicationRecords` to `fhir`. It reads MedicationRequest as an order with the MedicationAdministrations given against it, and MedicationStatement as a medication list entry, resolving each medicine from its own code, a contained Medication or one elsewhere in the input. Dosages keep their parts: dose or range, route, site, timing, when required and why, the most per 24 hours, and instructions. A dose not given keeps its reason. Anything entered in error is left out and listed, and a dose whose order is not in the input is reported.
