# 0009. Hosting, visual regression and release

- Status: Accepted
- Date: 2026-09-18

## Decision

- **Workflow.** `main` is protected. Every change lands by pull request with the `CI passed`
  check required. Commits follow Conventional Commits.
- **Hosting.** Vercel hosts the website and Storybook as two projects, with a preview deployment
  for each pull request. `cadenceclinical.app` is the canonical origin and
  `cadenceclinical.com.au` redirects to it. The origin is set in one place,
  `apps/site/src/lib/shared.ts`, because registry URLs are built from it.
- **Visual regression.** Chromatic. Its accept or reject step is where a person decides whether
  a visual change is intended, which is the decision the grade lifecycle depends on (see 0004).
- **Release.** Changesets opens a version pull request, and merging it publishes to npm through
  trusted publishing (OIDC) with provenance, so the repository holds no npm token. `core`,
  `tokens`, `ui`, `clinical` and `fhir` version together (the maintainer chose this on
  2026-09-23, so a Cadence version means one thing); Region packages will version independently.
  All packages stay below 1.0.0 until the first clinical components are verified.
- **Licence.** MIT, with a clinical-use disclaimer in the README and the docs.

## Publishing from CI is waiting on npm

Updated 2026-10-17: 0.1.0 is on npm, published by the maintainer by hand, and each package lists
the Release workflow as its trusted publisher. Publishing from CI is still off (`NPM_PUBLISH` is
`false`), because npm refuses this repository's GitHub OIDC tokens: GitHub gives repositories
created after 15 July 2026 an ID-based token subject, and npm's trusted publishing matches only
the older `repo:owner/name` form ([npm/cli#9969](https://github.com/npm/cli/issues/9969)).
Until npm accepts it, the maintainer publishes each release by hand, as `.changeset/README.md`
describes, and the repository still holds no npm token. When npm does, set `NPM_PUBLISH` to
`true`.
