# 0018. The example apps sync in real time, on Yjs

- Status: Accepted
- Date: 2026-10-18
- Builds on: [0002](0002-clinical-logic-boundary.md), [0014](0014-headless-libraries.md)
- Research: [Rich-text editor and real-time sync](../research/editor-and-sync.md)

## Context

Two of the features being prototyped are shared as they are used. A patient list is worked
through by a team on a ward round at the same time, and a discharge summary is drafted, reviewed
and completed by more than one person. A prototype that only draws presence and change markers
can't show whether the design survives two people editing at once, a dropped connection or a
change arriving while someone reads. The maintainer decided on 2026-10-18 that the example apps
have a working sync layer, not only those states.

Cadence is a design system: it designs the interface and the flows, not the product behind them.
The sync layer exists so the example apps can demonstrate live interaction truthfully. It is not
infrastructure that Cadence recommends or supports for production.

## Decision

1. **The example apps include a working real-time sync layer.** People on the same patient list
   or discharge summary see each other's presence and edits as they happen, and the apps show
   what happens offline, on reconnection and when edits conflict.
2. **The sync layer is Yjs, with a Hocuspocus server.** Both are MIT licensed and run with the
   example apps, with no hosted service involved. One document holds each patient list and one
   each discharge summary, sharing one connection. Presence travels as Yjs awareness. Hocuspocus
   comes from the same maintainers as the Document editor's library (0020), which tests against it.
3. **Components stay independent of the sync technology.** Presence, change markers and review
   state are view models in `core`, passed to components as props, in the same way FHIR types are
   kept out of components (0002, 0016). No Yjs type appears in a component's API. The only Yjs
   code in a package is an optional collaboration entry point for the Document editor, with its
   libraries as optional peers (0014).
4. **The sync server is part of the example apps' development setup**, run locally or alongside a
   deployed demo. How a product hosts its sync, and where, is outside Cadence.

## Consequences

- A consumer can drive the same components from another sync layer, such as a FHIR subscription
  or a Postgres-backed service, by mapping it to the same view models.
- A shared document that merges concurrent edits suits text that several people write. For
  structured clinical data, such as a bed, a status or an acuity, a real deployment needs a server
  that is the authority and an audit trail. The example apps use Yjs for the list to demonstrate
  the interaction, and their documentation says so.
- Only synthetic data ever passes through the sync layer.
- Yjs 14 is in release candidates under a new package name, while Hocuspocus and Tiptap's binding
  still require Yjs 13. A migration is likely within a year. The version is pinned in
  `pnpm-workspace.yaml`, with the reason, when it is added.
