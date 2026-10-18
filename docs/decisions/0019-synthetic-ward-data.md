# 0019. Synthetic ward data is adapted from Synthea, within what Oracle Health serves

- Status: Accepted
- Date: 2026-10-18
- Builds on: [0016](0016-fhir-transforms.md)
- Research: [Oracle Health Millennium Platform FHIR R4 APIs](../research/oracle-millennium-fhir-r4.md)

## Context

The prototypes, Storybook and the example apps need clinical data that looks real, and Cadence
never uses real patient information. Data that looks real but carries resources or fields no
clinical system would serve produces designs that can't be built. The maintainer decided on
2026-10-18 to adapt Synthea's output, with Oracle Health's Millennium Platform FHIR R4 APIs as
the reference for which resources and fields a real system serves.

## Decision

1. **The dataset is generated with Synthea** (Apache-2.0) **and adapted**, from a fixed seed, so
   the same seed always gives the same data.
2. **It contains only what Oracle's R4 APIs serve**, as documented in version 2026.04.23 of
   Oracle's documentation. In particular:
   - no `EpisodeOfCare`, `Flag`, `Composition`, `MedicationStatement`, `Task`, `List`, or
     standalone `PractitionerRole` or `Medication`, none of which Oracle exposes;
   - notes are a `DocumentReference` whose content is a `Binary`;
   - locations run facility, building, nursing unit, room, bed, linked by `partOf`;
   - codes are given twice where Oracle gives a standard and a proprietary coding.
3. **Data a feature needs that Oracle doesn't serve is app data, kept apart.** A patient list's
   membership, the jobs and comments of a ward round, and whether text was drafted by an AI have
   no home in Oracle's APIs. The dataset ships them separately and labels them as data the app
   holds, not data the EHR serves.
4. **Nothing Australian is invented.** Oracle's documentation names no Australian identifier or
   code system beyond its Asia-Pacific host. Until an Australian site's identifiers and codings
   are taken from a published source, the dataset uses what Oracle documents, and the gap is
   recorded rather than filled from memory.

## Consequences

- A design can't rely on a ward census from the EHR: Oracle can't list the patients in a
  location, so a ward list starts from patients the app knows about.
- The AI provenance rule (0017) is met in the app layer for this source, because Oracle's
  documented `Provenance` can't record that an AI drafted something.
- Each resource the features read needs a transform in `fhir`, agreed one at a time (0016).
- The research is a summary of Oracle's documentation at one version. When Oracle publishes a new
  version, the dataset's limits are checked against it again.
