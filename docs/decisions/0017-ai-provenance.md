# 0017. AI-drafted content is always marked and linked to its source

- Status: Accepted
- Date: 2026-10-18
- Builds on: [0002](0002-clinical-logic-boundary.md)

## Context

One of the features being prototyped is a discharge summary that an AI drafts and a doctor
reviews and completes. Drafted text reads as fluently as text a clinician wrote. Once it is in a
record, a reader cannot tell which statements a person checked, and a statement the model invented
looks as authoritative as one copied from a result. A reviewer can check a statement against its
evidence only if they can find that evidence.

## Decision

1. **Text an AI drafted is marked as AI-drafted wherever Cadence shows it**: in the draft, after a
   clinician accepts or edits it, and in the signed record. The mark says what drafted the text
   and, once it has been reviewed, who reviewed it. It is never shown by colour alone.
2. **Each drafted statement links to the source it was drawn from**, such as a note, a result or
   an observation, so that a reviewer can open it. A statement with no source is shown as having
   none. It is neither hidden nor presented as sourced.
3. **Components display the provenance they are given and never infer it**, as they display an
   interpretation and never make one (0002). Whether text was drafted by an AI, and what its
   sources are, arrive as data. In FHIR, a `Provenance` resource can carry them where the source
   system records it. Where it doesn't, as with Oracle Health's documented API (0019), the app
   records them itself.
4. **The rule covers everything Cadence publishes**: its components, stories, example apps,
   skills and documentation. Software built with Cadence supplies the provenance its components
   display.

## Consequences

- The AI provenance and Section review components proposed in [docs/components.md](../components.md)
  show the mark and record each review, and Diff view shows what a reviewer changed.
- The `fhir` package will need a transform for `Provenance`, and the synthetic ward data needs
  provenance for every drafted section, held as app data where the source system can't record it.
- A summary that loses its mark or its sources when it is exported, printed or copied breaks the
  rule, so exports carry both.
- The guardrails skill states the rule, and so does the conventions header that the next Claude
  Design sync uploads.
