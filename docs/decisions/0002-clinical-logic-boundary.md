# 0002. Components display an interpretation and never make one

- Status: Accepted
- Date: 2026-09-18

## Context

A component that shows a heart rate of 130 in red has decided that 130 is abnormal. That
threshold varies by site, by patient age and by criteria a clinician has modified for one
patient. A design system that ships a default threshold makes that decision for every patient on
every screen, and moves towards being software as a medical device.

## Decision

1. Components in `ui` and `clinical` are render-only. They take an interpretation as a prop
   (for example normal, abnormal or critical, mapped from FHIR `Observation.interpretation` and
   `referenceRange`) and display it. They contain no clinical thresholds and compute no scores.
2. Published clinical rule sets ship in opt-in Region packages (see 0003). Australia is first:
   `@cadence-clinical/au` carries national sources, with Victoria as the first state variant.
3. Every rule set records its source, the source's version and licence, the date it was last
   checked, and its own grade (see 0004).
4. Only publicly published sources go into a Region package. A health service's internal
   criteria need that service's written permission and a public citation first.

## Consequences

- A consumer never displays a threshold they did not choose to supply.
- The licence terms of each source (for example ADDS and ViCTOR) must be confirmed by someone
  qualified before its rule set is published. This is an open risk, not a formality.
- The Victorian adult rule set will be added when its values and source are supplied.
- A lint rule stops `ui` and `clinical` from importing a Region package, so the boundary cannot
  erode by accident.
