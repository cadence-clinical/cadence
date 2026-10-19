# Synthetic ward

A small, hand-made synthetic ward for prototyping: one unit, General Medicine, with three day
teams, an after-hours team, allied health staff, 26 patients, and a directory of ten registered
patients who are on no list. It's shared by every feature's prototypes. Every
person, identifier, time and value is invented, and none is clinical advice.

`ward.json` is generated: change `generate.mjs` and run it again, never the JSON.

```sh
node prototypes/synthetic-ward/generate.mjs
```

## What it covers

Each patient carries what the patient list's flows need:

| Case                                                                    | Patients                         |
| ----------------------------------------------------------------------- | -------------------------------- |
| On a team, with acuity, flags, jobs and recent observations and results | Most                             |
| Two patients with similar names, marked `similarTo`                     | Chris Taylor and Kris Taylor     |
| A referral phoned in, one imported from a referral system               | Noah Bennett, Olivia Grant       |
| An expected patient: a placeholder not yet linked to a URN              | `patient-23`                     |
| An incoming transfer, with its handover as its first comment            | Carmen Delgado                   |
| Left hospital with a job still open; left hospital and ready to archive | Stanley Ruiz; Ruth Abernathy     |
| Marked important overnight, with an AI-drafted synopsis and its sources | Graham Whitlock, Brian Kowalczyk |
| Stable and collapsed overnight, then a source system raises a review    | George Papadakis                 |
| Audit lists, one with a manual removal; a private personal list         | `auditLists`, `personalLists`    |
| What the simulated teammates do, minute by minute                       | `simulation`                     |
| The team's comments: one to three on most team patients, none on some   | `comments`                       |
| When each job was made and by whom, for a patient's timeline            | `jobs[].createdAt`, `createdBy`  |
| The latest note, allied health (PT, SW, OT) and discharge barriers      | Every patient on a team          |
| Registered patients on no list, for Add patient, with similar names     | `directory`                      |

## Rules it follows

- **Its shape follows decision 0019.** `sources` says which fields a real system would serve over
  FHIR (from Oracle Health's Millennium R4 APIs) and which the patient list holds itself. A
  deterioration signal is `supplied`: it comes from a source system, and the list only shows it.
- **Identifiers are obviously fake.** URNs start `SYN-`. Names are invented, and read naturally so
  testers react to them as they would to a real list.
- **Nothing is interpreted.** Observations and results are values with units, with no bands or
  flags of their own. Each carries the abbreviation and display unit the ward writes ("K",
  "µmol/L") beside its UCUM unit, so a screen shows them as given. Audit criteria values are left
  for the list's owner to choose.
- **A note's summary is its opening line as written**, not generated text. Allied health states
  (`not-needed`, `referred`, `seen`, `cleared`) are recorded by the team, and `sources.notes` says
  where each field would come from.
- **Acuity's scale is a placeholder** (`high`, `medium`, `low`) until the maintainer names one.

A Synthea-based generator replaces this ward later (decision 0019). It must cover the same cases.
