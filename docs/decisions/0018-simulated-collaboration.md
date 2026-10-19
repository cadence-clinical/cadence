# 0018. Prototypes simulate live collaboration

- Status: Accepted
- Date: 2026-10-18
- Builds on: [0002](0002-clinical-logic-boundary.md)
- Research: [Rich-text editing and real-time sync: feasibility](../research/editor-and-sync.md)

## Context

Two of the features being prototyped are shared as they are used. A patient list is worked
through by a team on a ward round at the same time, and a discharge summary is drafted, reviewed
and completed by more than one person. A prototype that never shows other people at work can't
test whether the design survives a teammate editing the same patient, a change arriving while
someone reads, or a dropped connection.

Cadence's outputs are interfaces, flows and prototypes that demonstrate how something could work.
They connect to nothing. In the maintainer's words on 2026-10-18: "the outputs of this repo will
only be UI/UX/flows/prototypes to demonstrate (not actually connected to anything, but merely
show how it could work)".

## Decision

1. **Prototypes simulate collaboration.** Scripted teammates appear in the prototype, open
   patients, add jobs, leave comments and edit sections on a timeline, inside one browser, with no
   server. The script can also cut the connection, deliver changes while the participant is
   reading, and make two edits collide, so every collaboration state can be shown on cue.
2. **Every session sees the same events.** Because the script is fixed, each participant in user
   testing meets the same changes at the same moments, and their reactions can be compared.
3. **Components take collaboration state as data.** Presence, change markers and review state are
   view models in `core`, passed to components as props, in the same way FHIR types are kept out
   of components (0016). The simulation fills them in a prototype; a product would fill them from
   whatever it builds.
4. **Cadence doesn't choose the technology a real product would use.** Research confirmed that
   live presence, shared lists and simultaneous editing of rich text are feasible with mature,
   open-source tools. Which tools a product uses is for whoever builds it.

## Consequences

- A collaboration state that a prototype can't trigger on cue hasn't been designed yet.
- The simulation is part of each prototype's synthetic data (0019): a timeline of what the scripted
  teammates do.
- A prototype that shows two participants on two devices editing together isn't possible with
  this approach. If user testing needs it, that is a new decision.
