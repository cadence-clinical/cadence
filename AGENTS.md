# Working in this repository

Cadence Clinical is a design system for clinical software: React primitives, clinical components
built on them, and FHIR utilities. Read [docs/decisions](docs/decisions/README.md) before making
a structural change. The records there explain why the rules below exist.

## Commands

```bash
pnpm install
pnpm build                 # packages first, then apps
pnpm dev                   # website on :3000, Storybook on :6006
pnpm check                 # format, lint, typecheck, unit tests, build, grades, package checks
pnpm test:browser          # every story in a real browser: interactions and axe
pnpm --filter @cadence-clinical/site test:e2e   # website smoke tests; build the site first
pnpm changeset             # record a change to a published package
```

Run `pnpm check` and `pnpm test:browser` before you say a change is done.

## Layout

- `packages/core`: Region contract, view-model types, grade schema. No React.
- `packages/tokens`: the palette in TypeScript, `theme.css` generated from it, contrast tests.
- `packages/ui`: primitives on Base UI. Each component has its source, stories and `meta.json`
  in `src/components/<name>/`.
- `packages/config`: shared tsconfig and ESLint, including the package boundary rules.
- `apps/site`: Next.js and Fumadocs. Docs content is in `content/docs`.
- `apps/storybook`: Storybook config and the Vitest browser runner. Stories live in the packages.

## Rules

- **No clinical thresholds or scoring in components.** A component displays the interpretation
  it is given. Rule sets belong in a Region package, with a citation.
- **Never state a clinical value from memory**, in code, docs or fixtures. It needs its published
  source, checked.
- **`ui` and `clinical` never import a Region package or FHIR types.** `core`, `tokens`, `fhir`
  and Region packages never import React. ESLint enforces both.
- **Status colours are fixed.** Do not add a way to theme critical, warning, success or info.
- **Use semantic tokens only**: no raw colour values, and no `dark:` overrides in components.
  Every status surface carries its `-border` token. Never signal status by colour alone.
- **Size controls with the density scale** (`h-control`, `px-control-x`, `text-control`), so
  compact and comfortable both work. Register any new scale key in `packages/ui/src/lib/cn.ts`.
- **Change colours in `packages/tokens/src/palette.ts`**, never in generated CSS. If a contrast
  test fails, fix the token. Do not relax the test.
- **Grades are claims.** Do not raise a grade. If you change how a component graded above
  `tested` looks or behaves, lower it to `tested` and say so in the pull request.
- **Synthetic data only.** No patient information anywhere.
- **Dependency pins are deliberate** (TypeScript 6.0, ESLint 9, Vitest 4). The reasons are in
  `pnpm-workspace.yaml`. Keep pnpm's minimum release age on: widen a version range instead of
  adding an exclusion.

## Adding a component

Follow the definition of done in [CONTRIBUTING.md](CONTRIBUTING.md). Components are agreed one
at a time with the maintainer before they are built. Do not add components speculatively.

## Workflow

`main` is protected. Work on a branch, write Conventional Commits, add a changeset when a
published package changes, and open a pull request.

## Skills

Load the matching skill from `.claude/skills` before the work it covers:

- `technical-writing` for documentation, `human-writing` for site copy.
- `emil-design-eng` when building or reviewing component interaction and motion.
- `web-design-guidelines` when reviewing UI code.
- `fhir-developer-skill` when working with FHIR resources.
- `shadcn` for composition and styling rules and the registry format. Do not use it to add
  components from a registry.
- `typescript-advanced-types` when designing generic or conditional types.

All but the two writing skills are restored with `pnpm skills:install`.
