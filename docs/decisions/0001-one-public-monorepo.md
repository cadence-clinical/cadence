# 0001. One public monorepo

- Status: Accepted
- Date: 2026-09-18

## Context

Cadence has two products: the design system packages, and the website that documents them. We
considered one repository for both, and a repository each.

## Decision

One public repository, `cadence-clinical/cadence`, holds the packages, the website, Storybook,
the agent skill and, later, the example apps. It uses pnpm workspaces, Turborepo and Changesets.

## Why

The website renders the live components. A change to a component, its stories, its
documentation page and its skill entry is one change, so it belongs in one pull request with one
CI run. With two repositories the website could only preview an unreleased component through a
canary publish, and the documentation would drift from the code.

Changesets publishes only the packages, so the website sharing the repository costs the release
process nothing.

## Consequences

- Splitting later remains possible, and is worth doing only if the website needs private content
  or a different owner.
- The repository is public from the first commit. npm provenance requires a public repository.
