# 0004. Every component carries a grade tied to a version

- Status: Accepted. The grading matrix was decided on 2026-10-17.
- Date: 2026-09-18

## Context

Clinical teams need to know how far a component has been verified before they rely on it. This
is Cadence's main point of difference from a general design system.

## Decision

1. Every component declares its grade in its package's manifest. The provisional levels are
   draft, tested, usability-tested, safety-assessed and in-production (see the matrix below). The manifest was a `meta.json` beside
   each component until [0011](0011-registry.md) made it the package's `registry.json`.
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

## The grading matrix

Decided by the maintainer on 2026-10-17. Each level includes everything below it.

| Level              | Requires                                                                                                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `draft`            | Nothing. In development.                                                                                                                                                                           |
| `tested`           | Stories that pass their interaction tests and axe in Chromium and WebKit, and a keyboard pass. CI checks it, so it needs no evidence record.                                                       |
| `usability-tested` | At least two practising clinicians work through a written scenario script and record their findings. One run uses VoiceOver and one NVDA. Every finding that could cause a misreading is resolved. |
| `safety-assessed`  | A hazard record for each way the component could be misread or misused, with its prevention in the component, a test or the guidance, reviewed by at least two practising clinicians.              |
| `in-production`    | A record of which version is in use in a live clinical system, since when, and who confirms it.                                                                                                    |

- **Clinician verification is split in two.** Usability testing and hazard review are different evidence, so they are different levels. Usability comes first, so the hazard review can draw on what the sessions found.
- **Who verifies.** A registered, practising clinician in a discipline that would use the component. The author may be one of the reviewers when at least one other clinician also reviews.
- **A screen reader pass is part of usability testing,** not of `tested`, so `tested` stays something CI can check alone. This answers the question `CONVENTIONS.md` left for this session.
- **A component's grade is not capped by its parts.** Reviewing a pattern exercises the components inside it as that pattern uses them, so the grade applies to that composition. Each part keeps its own grade. This answers the question in [0013](0013-component-levels.md).
- **A safety assessment of a component is not a product's safety case,** and the docs say so.
- Evidence records follow the templates in `docs/evidence/README.md`.

The levels `clinician-verified` and `in-production` were provisional, and no component had reached either, so renaming them breaks no grade.
