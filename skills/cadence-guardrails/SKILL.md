---
name: cadence-guardrails
description: The non-negotiable rules for any design, flow, prototype or code built with Cadence Clinical, the design system for clinical software. Load this before designing or prototyping any clinical screen, user flow or feature with Cadence (patient lists, summaries, charts, medication views, discharge, dashboards), before critiquing such a design, and whenever another Cadence skill says to. Use it even when the request doesn't mention safety or rules: every clinical design needs them.
---

# Cadence guardrails

These rules hold for every design, flow, prototype and line of code built with Cadence. Other
Cadence skills load this one first. Each rule says why it exists, because a rule you understand
can be applied to a case it doesn't name.

When a design would break a rule, don't quietly work around it: stop, say which rule and why, and
offer a design that keeps it. A rule changes only when the maintainer changes it here.

## Clinical safety

1. **Cadence displays an interpretation and never makes one.** No design decides that a value is
   abnormal, works out a score or band, or ranks patients by risk on its own judgement. Where a
   screen shows a status, a band or an acuity, it shows one it was given, and the design says
   where it comes from. What counts as abnormal varies by site, by patient and by criteria a
   clinician has changed for one patient, so a default threshold in a design makes that decision
   for every patient who meets it.
2. **AI-drafted content is always marked and linked to its source**: in the draft, after a
   clinician accepts or edits it, and in the signed record. The mark says what drafted the text
   and, once reviewed, who reviewed it. Each drafted statement links to the note, result or
   observation it came from. A statement with no source is shown as having none. Fluent drafted
   text looks as authoritative as text a clinician checked, and a reviewer can only check what
   they can trace.
3. **Never state a clinical value from memory.** A threshold, reference interval, dose
   convention, unit or guideline requirement appears in a design only with its published source,
   checked. If the source isn't to hand, leave a visible placeholder and list it as an open
   question.
4. **Status is never shown by colour alone.** Pair it with text or an icon. Critical, warning,
   success and info look the same in every theme and brand, and every status surface has its
   border.
5. **Text is never truncated, clipped or re-cased.** A medicine name, a patient name or a value
   that is cut off or changed in case can be misread. Long text wraps.
6. **Medicines are displayed as the national on-screen display guidelines require**, cited from
   their published source, not from memory.

## Data

7. **Synthetic data only.** No real patient information anywhere: not in prototypes, fixtures,
   screenshots or examples. Identifiers must look obviously fake.
8. **Clinical data comes from FHIR R4**, shaped by what a real system serves: Cadence's
   reference is Oracle Health's Millennium FHIR R4 APIs (`docs/research/oracle-millennium-fhir-r4.md`
   in the Cadence repository). A design that shows a clinical field no resource holds is a finding
   to raise, not a field to invent. Data that isn't a medical record, such as a list's membership
   or a ward round's jobs and comments, belongs to the app and is designed freely.

## The maintainer's rules

Rules the maintainer adds as they come up. Each records the date and, where given, the reason in
the maintainer's words.

9. **Cadence designs the interface and the flows, not the solution.** (2026-10-18) "This is a
   design (UI/UX/system) repo, we are not building the solution, but trying to create the best UI
   and flows possible." And: "the outputs of this repo will only be UI/UX/flows/prototypes to
   demonstrate (not actually connected to anything, but merely show how it could work). the goal
   is to rapidly create consistent prototypes and flows to validate ideas with users." So a
   prototype shows how the work could look, feel and behave, including every state it must
   handle, using synthetic data and simulated behaviour. It never connects to a real system, and
   it doesn't decide how a product would store, host or integrate its data. Where a design depends
   on such a question, record it as an assumption for whoever builds the product, and design for
   the answer either way.
