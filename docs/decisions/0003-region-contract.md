# 0003. Regional conventions are supplied through a Region contract

- Status: Accepted
- Date: 2026-09-18

## Context

Clinical conventions differ by health system: units (mmol/L or mg/dL), date formats, patient
identifier labels, on-screen medicines display rules, early warning systems and FHIR profiles.
Cadence is Australia-first, and must let a deployment elsewhere swap those conventions without
forking components.

## Decision

1. `@cadence-clinical/core` defines a `Region` interface: locale, date and time settings,
   preferred unit per analyte (LOINC code to UCUM unit), interface labels and cited rule sets.
2. A Region is supplied at runtime, through a provider or as a plain function argument so
   formatters work in server components. Component packages never import a Region package.
3. Regions compose. `defineRegion({ extends: au, ... })` overrides scalar settings and merges
   keyed maps, so a state variant states only what differs from the national Region.
4. A new Region package must pass a shared contract test suite before it ships.
5. FHIR profile differences (AU Core, US Core) are adapters in the `fhir` package, selected the
   same way.

## Consequences

- Formats, units, labels and thresholds swap cleanly. Chart shape does not: an ADDS chart and a
  NEWS2 chart differ in banding and scoring model. The observation chart must therefore be
  driven by a band-definition schema from its first version, and never be coded to one system.
- The first cut of the contract is minimal. Sections are added as the components that need them
  arrive.
