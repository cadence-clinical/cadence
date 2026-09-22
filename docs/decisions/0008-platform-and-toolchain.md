# 0008. Platform floor and toolchain pins

- Status: Accepted
- Date: 2026-09-18

## Platform

- React 19 only.
- Evergreen browsers from the last two years: Chrome and Edge 111, Safari 16.4, Firefox 128.
  This is the Tailwind CSS v4 floor, and the theme depends on OKLCH colour.
- Desktop, tablet and phone are all first-class. Every clinical component gets a deliberate
  phone layout, tested at phone width.
- WCAG 2.2 AA is the floor, with 7:1 available through the more-contrast mode.
- Interface strings are overridable and default to en-AU.

## Stack

Next.js and Fumadocs for the website. Storybook with the Vitest addon in Playwright browser mode
for component tests, with axe run on every story as an error. Tailwind CSS v4, shadcn
conventions and Base UI for components. tsdown for package builds. pnpm, Turborepo and
Changesets for the workspace.

## Version pins

Three tools are held one major version back because something Cadence depends on has not caught
up. Each pin has a comment in `pnpm-workspace.yaml` and an ignore rule in Dependabot.

| Tool       | Pinned to | Waiting on                                                                           |
| ---------- | --------- | ------------------------------------------------------------------------------------ |
| TypeScript | 6.0       | typescript-eslint supports TypeScript below 6.1 only                                 |
| ESLint     | 9         | eslint-plugin-jsx-a11y supports ESLint 9 only, and accessibility linting is required |
| Vitest     | 4         | @storybook/addon-vitest supports Vitest 3 and 4 only                                 |

pnpm's minimum release age stays on, at seven days (`minimumReleaseAge: 10080` in
`pnpm-workspace.yaml`). A package that is compromised is usually found within days, and nothing
here is urgent enough to take a release on its first day. pnpm applies it when it resolves and
again to the committed lockfile, so a fresh release cannot arrive through a lockfile someone else
resolved. When a fresh release blocks an install, widen the version range so pnpm can pick an
older release. Do not add an exclusion.

## Data

Stories, tests and example apps use synthetic data only. No patient data enters the repository.
The packages collect no telemetry.
