# 0004. Every component carries a grade tied to a version

- Status: Accepted. The grading matrix itself is pending.
- Date: 2026-09-18

## Context

Clinical teams need to know how far a component has been verified before they rely on it. This
is Cadence's main point of difference from a general design system.

## Decision

1. Every component has a `meta.json` beside its source that declares its grade. The provisional
   levels are draft, tested, clinician-verified and in-production.
2. A grade above tested is a claim about one version. It names the version that was reviewed and
   references evidence records kept in `docs/evidence/`.
3. A change that alters how a component looks or behaves returns it to tested until it is
   reviewed again. A change with no visual difference keeps the grade. Chromatic decides which
   kind of change it is.
4. A grade applies to the published component only. A copy installed from the registry and then
   edited carries no grade.
5. CI enforces what it can: `scripts/check-grades.mjs` rejects a grade above tested without a
   version and evidence, and a grade of tested or above without stories.
6. Grades are shown in the docs and Storybook, and exposed to the agent skill.

## Open

The grading matrix: final level names, the criteria and review protocol for each level, who may
verify, and whether an author may verify their own component.
