# 0005. Distribute as npm packages and a shadcn registry from one source

- Status: Accepted
- Date: 2026-09-18

## Context

Two distribution models exist for this kind of library. A versioned package keeps every consumer
on the same, fixable code. A shadcn-style registry copies source into the consumer's repository,
which they then own and may change.

## Decision

Ship both from the start. The npm packages under `@cadence-clinical/*` are the primary channel.
A shadcn-compatible registry is served from the website.

Components are authored once, in the packages. The registry is built from that source with
imports rewritten, so the two channels cannot diverge.

## Consequences

- Clinical display rules stay consistent for package consumers, and a display bug is fixed by a
  version bump.
- Registry copies that are edited carry no grade (see 0004). The docs say so wherever the
  registry is offered.
- The registry build is not implemented yet.
