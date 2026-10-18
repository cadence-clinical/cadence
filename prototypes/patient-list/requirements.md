# Patient list: requirements

Status: draft for the maintainer's review (2026-10-18)

Each requirement traces to the brief (B), an assumption (A#) or a guardrail (G#), and has a
status: **confirmed** (from the brief or a confirmed assumption), **assumed** (my reading, to
check) or **question**. These describe what the design must do. How a product would build it is
outside Cadence (G9).

## Clinical safety

| #   | Requirement                                                                                                                                                                                                                                                                                                                                                                                      | Traces to   | Status                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------- |
| S1  | Acuity is set by a clinician and always shown with who set it and when. The list never works acuity out.                                                                                                                                                                                                                                                                                         | B, G1       | Confirmed                                    |
| S2  | Importance shows its source: a clinician's priority or flag, a deterioration signal from a source system, or an AI model. A deterioration signal is shown as given; the list doesn't detect deterioration.                                                                                                                                                                                       | A16, G1     | Confirmed                                    |
| S3  | Importance marked by an AI model is labelled as AI and links to what it was based on.                                                                                                                                                                                                                                                                                                            | A16, G2     | Confirmed                                    |
| S4  | An audit list's criteria are always visible with the list. The person who builds it chooses every value; the builder offers no default thresholds.                                                                                                                                                                                                                                               | A10, G1, G3 | Confirmed                                    |
| S5  | A patient removed by hand from an audit list shows who removed them and when, and the removal applies to that list only.                                                                                                                                                                                                                                                                         | A11         | Confirmed                                    |
| S6  | AI-drafted text in the list, such as a draft synopsis, is marked as AI-drafted and linked to its sources until a clinician reviews it.                                                                                                                                                                                                                                                           | A8, G2      | Confirmed                                    |
| S7  | Once a clinician reviews and confirms it, AI-drafted text can enter the medical record as a note, and the note stays marked as having started from an AI draft, with who confirmed it: "it should remain marked for transparency and auditing".                                                                                                                                                  | A8, G2      | Confirmed                                    |
| S8  | Status, acuity, flags and importance are never shown by colour alone.                                                                                                                                                                                                                                                                                                                            | G4          | Confirmed                                    |
| S9  | Names, problems and notes wrap and are never truncated, including on a phone.                                                                                                                                                                                                                                                                                                                    | G5          | Confirmed                                    |
| S10 | Each row identifies the patient by first and last name, age, gender and URN, with the date of birth on mouse-over. Patients on the same list with similar details are indicated. The date of birth also appears on keyboard focus and on tap, so it isn't hover-only. **Question:** what counts as similar (the same surname, a similar-sounding name, the same date of birth) is for discovery. | G10         | Confirmed; the focus and tap part is assumed |
| S11 | A job outside a nurse's scope can't be completed by them, and the list shows which jobs are within their scope.                                                                                                                                                                                                                                                                                  | A12         | Confirmed                                    |
| S12 | A collapsed patient on the after-hours list becomes active and visible when they deteriorate or are marked important. Collapsing never hides a change from the person on call.                                                                                                                                                                                                                   | B           | Confirmed                                    |
| S13 | A transfer or a referral isn't complete until the receiving team accepts it, so a patient is never without a team.                                                                                                                                                                                                                                                                               | B, A18      | Confirmed                                    |
| S14 | Archival is suggested, never automatic by default, and a team member confirms it.                                                                                                                                                                                                                                                                                                                | B, A17      | Confirmed                                    |
| S15 | An expected patient is a placeholder clearly marked as not yet registered, and stays so until someone links it to a URN and an encounter, checking identifiers as they do.                                                                                                                                                                                                                       | B (round 5) | Confirmed                                    |
| S16 | Every referral has an owner who accepts or declines it; none is left without one. An imported referral shows the system it came from.                                                                                                                                                                                                                                                            | B (round 5) | Confirmed                                    |

## Data

What each part of the list shows, and where it comes from. **Source** is the FHIR R4 resource and
element, or **app data** where the list holds it itself. **Oracle** says whether Oracle Health's
Millennium FHIR R4 APIs serve it (docs version 2026.04.23, `docs/research/oracle-millennium-fhir-r4.md`).
The synthetic data follows this table (decision 0019).

| Shown                                                              | Source                                                               | Oracle                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------- |
| Name, age, sex, identifiers                                        | `Patient`                                                            | Yes                                                     |
| Bed and ward                                                       | `Encounter.location` (facility, building, nursing unit, room, bed)   | Yes; the location may be contained in the encounter     |
| Days since admission                                               | `Encounter.period.start`                                             | Yes                                                     |
| Admitting and treating clinicians                                  | `Encounter.participant`                                              | Yes                                                     |
| Working problem                                                    | The referral (app data), or `Condition` (encounter diagnosis)        | `Condition`: yes                                        |
| Left hospital, and how                                             | `Encounter.status`, `Encounter.hospitalization.dischargeDisposition` | Yes; the status can lag behind `period.end`             |
| Unit, team and list membership                                     | App data (A6)                                                        | No `List`; an encounter can't be searched by location   |
| Referral: source, referrer, urgency, reason, summary, initial plan | App data (A7)                                                        | No                                                      |
| An expected patient before linking                                 | App data: a placeholder, like a `contained` patient                  | Not until linked                                        |
| An imported referral's basic details                               | A separate referral system (simulated)                               | Not Oracle                                              |
| Acuity                                                             | App data, set by a clinician (S1)                                    | No                                                      |
| Flags                                                              | App data (A13)                                                       | No `Flag`                                               |
| Jobs and their assignment                                          | App data (A7)                                                        | No `Task`                                               |
| Comments, seen and complete marks                                  | App data (A7)                                                        | No                                                      |
| Handover notes, synopsis and progress                              | App data; once confirmed, may become a note (S7)                     | A note is `DocumentReference` with its text in `Binary` |
| History in the list system                                         | App data (A14)                                                       | No                                                      |
| Deterioration signal                                               | Supplied by a source system (S2)                                     | Not as a resource; it would come from elsewhere         |
| Audit criteria: demographics                                       | `Patient`                                                            | Yes                                                     |
| Audit criteria: conditions                                         | `Condition`                                                          | Yes                                                     |
| Audit criteria: latest observations and labs                       | `Observation` (vital signs, laboratory), `DiagnosticReport`          | Yes, searched per patient                               |
| Audit criteria: medicines                                          | `MedicationRequest`, `MedicationAdministration`                      | Yes, searched per patient                               |

**A finding for whoever builds the product (G9):** every clinical search in Oracle's APIs needs a
patient, so criteria evaluated across a whole hospital would need another source of data. The
prototype shows audit lists working as designed, from synthetic data.

## Collaboration

Shown in the prototype by simulated teammates (decision 0018).

| #   | Requirement                                                                                                                                                       | Traces to | Status    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------- |
| C1  | Everyone on the same list sees its patients, order, jobs, comments, flags, acuity and marks change as others edit.                                                | A4        | Confirmed |
| C2  | Presence shows who else has the list open, and which patient or field they are editing.                                                                           | A4        | Assumed   |
| C3  | A change made while someone is reading never moves a row under their pointer or finger. It's announced, and shown when they choose.                               | A4        | Assumed   |
| C4  | When two people edit the same job or field, the second sees the conflict and chooses, rather than one edit silently replacing the other.                          | A4        | Assumed   |
| C5  | On a phone with a poor connection, changes made offline are kept, shown as not yet shared, and sent on reconnection. Data shown while offline says how old it is. | A3, A4    | Assumed   |
| C6  | Referral and transfer are accepted by the receiving team; the morning hand-back is acknowledged. Which response a handover needs is a setting.                    | A18       | Confirmed |

## Accessibility, devices and density

| #   | Requirement                                                                                                                      | Traces to      | Status    |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------- |
| D1  | Desktops and bedside workstations at compact density; phones at the touch default, for fast ward rounds and reference on the go. | A3             | Confirmed |
| D2  | Everything that can be done by dragging, such as reordering rows, can also be done with the keyboard and without dragging.       | CONVENTIONS §6 | Assumed   |
| D3  | Live changes are announced politely to screen readers, without interrupting what the person is doing.                            | C3             | Assumed   |
| D4  | A collapsed group on the after-hours list says how many patients it holds, and expands with the keyboard.                        | S12            | Assumed   |
| D5  | Live reordering and incoming changes respect reduced motion.                                                                     | C3             | Assumed   |

## Cadence components that cover it

**Already built:** Data table and Table (the list), Item (a phone row), Badge and Marker (status and
flags), Checkbox (seen and complete), Dropdown menu (row actions), Collapsible (the collapsed
stable patients), Dialog, Sheet and Drawer (referral, transfer and handover forms; Drawer on a
phone), Form and Field (the forms), Select and Toggle group (filters and settings), Tabs (switching
lists), Popover and Tooltip, Empty (an empty list), Skeleton (loading), Toast (a change saved),
Alert (a conflict or offline), Sidebar, Application shell and List and detail (the frame).

**Proposed in the component plan (#117):** Patient row, Patient list, Presence, Change indicator,
Filter bar, Combobox, Command, Comment thread, Task item, Avatar, Patient banner, and Timeline (the
history).

**Possibly missing, to confirm when prototyping:** a criteria builder for audit lists, and the
referral and handover forms as compositions. Stage 6 records what the prototype actually needs in
`gaps.md`.
