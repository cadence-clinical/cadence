# 0007. Units convert in the FHIR transform layer, by default

- Status: Accepted
- Date: 2026-09-18

## Context

A value can arrive in a unit the Region does not prefer, such as glucose in mg/dL under the
Australian Region. Converting silently inside a component hides arithmetic on clinical values.
Never converting leaves consumers to do it inconsistently.

## Decision

The `fhir` transform functions convert to the Region's preferred unit by default. Components
never convert: they display the value and unit they are given.

The conversion rules:

1. Conversion is keyed by LOINC code, because mass to molar factors are specific to the analyte.
2. An unknown analyte or unit passes through unchanged and flagged. The layer never guesses.
3. The view model keeps the original value and unit beside the converted ones, so the interface
   can show that a value was converted.
4. Reference ranges convert with the value. Comparators such as `<0.5` are preserved.
5. Rounding follows a documented significant-figures rule per analyte.
6. Conversion tables are covered by table-driven tests and carry their own grade.

## Consequences

A conversion bug would be a clinical display error across every consumer. The conversion code
needs a high grade before anyone relies on it, and consumers can turn conversion off.
