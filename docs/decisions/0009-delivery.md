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
  `tokens` and `ui` version together; `fhir` and Region packages will version independently.
  All packages stay below 1.0.0 until the first clinical components are verified.
- **Licence.** MIT, with a clinical-use disclaimer in the README and the docs.

## Not yet switched on

Publishing is off until the `cadence-clinical` npm organisation exists and each package lists
the Release workflow as its trusted publisher. Set the repository variable `NPM_PUBLISH` to
`true` to switch it on. The Chromatic workflow skips itself until the
`CHROMATIC_PROJECT_TOKEN` secret exists.
