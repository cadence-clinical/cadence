---
name: cadence-prototyping
description: The shared process for prototyping a clinical feature with Cadence Clinical, co-written with the maintainer and repeated for every feature (patient list, patient journey, summaries, discharge, unit dashboard and later ones). Takes a feature from a one-line idea through brief, assumptions, requirements, flows, design options and Claude Design prototypes to critiqued iterations, leaving the same set of reviewable artefacts in prototypes/<feature>/ every time. Use it whenever someone wants to prototype, design, explore or wireframe a clinical feature or screen with Cadence, work out its requirements or user flows, or pick up a feature's prototyping where it was left, even if they don't say "prototype".
---

# Prototyping a feature with Cadence

> Draft, version 0. Being refined on its first run, the patient list. Each stage below records how
> we actually work; change it when we find a better way, and note the change in the feature's
> `iterations.md`.

The aim is a prototype the team can trust, and a record of why it looks the way it does. A
prototype built on an unchecked assumption looks just as convincing as one built on a checked
fact, so this process keeps every assumption, requirement and decision visible, and gets each one
confirmed by the person who can confirm it.

**Load `cadence-guardrails` first.** Its rules hold at every stage, and a critique checks against
them.

## How we work

- **The maintainer decides; you propose.** Bring a recommendation with its reason, and the
  maintainer confirms, corrects or rejects it. Don't present your guesses as requirements.
- **Ask in rounds.** Up to five questions a round, each with why it matters and the default you'd
  assume if there's no answer. Short rounds keep answers considered. After each round, write the
  answers into the artefacts and show what changed before asking the next round.
- **Record answers as given.** Quote the maintainer's words where they carry the meaning, and
  keep their uncertainty ("probably", "for now"). A paraphrase that sounds firmer than the answer
  turns a guess into a requirement.
- **Every claim has a status.** In the artefacts, a statement is either confirmed (by whom,
  when), an assumption (open until someone confirms it) or a question. Nothing sits in between.
- **A new rule goes to the guardrails.** When the maintainer states a rule that would hold for
  every feature, propose adding it to `cadence-guardrails` with their reason, rather than burying
  it in one feature's requirements.

## Where the artefacts live

Each feature has a folder, `prototypes/<feature>/`, in the Cadence repository, reviewed in pull
requests like the rest of the repository. Start each file from `assets/templates/`. The files
build on each other, so finish a stage before relying on it in the next.

| File              | Stage | Holds                                                          |
| ----------------- | ----- | -------------------------------------------------------------- |
| `brief.md`        | 1     | Who, where, what triggers it, what done looks like             |
| `assumptions.md`  | 2     | Every assumption, its status and who confirms it               |
| `requirements.md` | 3     | Safety, data, collaboration, access, devices: each with status |
| `flows.md`        | 4     | Happy path, interruptions and every non-happy state            |
| `options.md`      | 5     | Two or three genuinely different designs, with trade-offs      |
| `gaps.md`         | 6     | Where a prototype needed a component Cadence doesn't have      |
| `iterations.md`   | 7     | Each round of critique and what changed                        |

## The stages

### 1. Brief

Find out who uses the feature, in what setting, what starts their use of it and what "done" looks
like for them. Clinical work is done by several roles at once, so name each role and what it
needs, not one generic "user". Done when the maintainer has read the brief and has nothing to add.

### 2. Assumptions

Write down everything the brief takes for granted: about the people, the setting, the data, the
devices and the organisation. Mark each confirmed, rejected or open, with who can confirm it.
Done when no open assumption would change the flows.

### 3. Requirements

Turn the brief and the confirmed assumptions into requirements, grouped as:

- clinical safety, checked against the guardrails;
- data: the FHIR R4 resources behind each thing shown, and whether the source system can serve
  them;
- collaboration: who sees what live, presence, changes made while someone is reading, and
  conflicting edits;
- accessibility: keyboard, screen readers, and the density and devices it's used at;
- the Cadence components that already cover each part.

Done when every requirement traces to the brief, an assumption or a rule.

### 4. Flows

Write the happy path first, then what interrupts it: a page, a handover, a second person editing.
Then cover every state a screen can be in: empty, loading, partial, error, offline, stale and
conflict. A flow that only works when nothing goes wrong hasn't been designed yet.

### 5. Options

Design two or three options that differ in kind, not in styling: different ways of organising the
work, not the same layout in two colours. For each, state what it assumes, what it's good and bad
at, and the questions that would tell users' preferences apart. Recommend one, with the reason.

### 6. Prototype

Build the chosen option, or each option, in Claude Design with Cadence's components and the
synthetic ward data. Wherever the prototype falls back on generic markup, record the gap in
`gaps.md`, matched to a proposed component in `docs/components.md` or as a new proposal. That's
how prototyping decides which components get built.

### 7. Critique and iterate

Check each round against the guardrails, the brief and the requirements. Log what was found and
what changed in `iterations.md`. Stop when the maintainer is satisfied, and record what is still
open.
