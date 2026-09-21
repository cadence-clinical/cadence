# 0014. How a pattern depends on a headless library

- Status: Proposed. The maintainer has not decided. Nothing here is built.
- Date: 2026-09-22
- Builds on: [0005](0005-distribution.md) for the two channels, [0011](0011-registry.md) for the manifest and [0013](0013-component-levels.md), which says a pattern "may pair with a headless library".

## Context

The Data table is the first pattern, and it is agreed to pair with [TanStack Table](https://tanstack.com/table). It is the first Cadence component that needs a library a consumer may not want. The Vitals chart will raise the same question with a charting library, so the rule is worth deciding once.

Today every dependency of `@cadence-clinical/ui` is one that nearly every component uses: Base UI, `class-variance-authority`, `clsx`, `tailwind-merge` and `lucide-react`. The package has one JavaScript entry point, `src/index.ts`, which re-exports every component.

Two facts limit the options:

- **A barrel makes a dependency compulsory.** A bundler resolves every module the entry point re-exports before it removes what is unused. If `index.ts` re-exports a data table that imports `@tanstack/react-table`, a consumer who never uses the table still has to have TanStack installed, or the build fails to resolve it.
- **0005 makes npm the primary channel**, with the registry built from the same source so the two cannot diverge. A component that exists only in the registry would break that.

## Options

1. **A plain dependency of `ui`.** TanStack Table is installed for every consumer. It is the least work and the least surprising. Every consumer carries a library most of them will not use, and each further pattern adds another.
2. **An optional peer dependency and its own entry point.** The data table is exported from `@cadence-clinical/ui/data-table` and not from the barrel. `@tanstack/react-table` is a `peerDependency` marked optional. A consumer who imports the entry point installs TanStack, and one who does not is not asked to. The registry item lists it under `dependencies`, so the shadcn CLI installs it.
3. **The registry only**, as shadcn does: its data table is a guide, not a component. This contradicts 0005, and a copied data table carries no grade once edited, which is most of what Cadence offers a clinical team.

## Proposed decision

1. **A component that needs a library most consumers will not use gets its own entry point and an optional peer dependency** (option 2). "Most consumers" is a judgement made once per library and recorded in [docs/components.md](../components.md).
2. **The consumer owns the headless instance.** For the data table, the consumer calls `useReactTable` and passes the table to Cadence, as in shadcn's guide. Cadence renders it and supplies the parts around it: a sortable column header, the selection column, paging and the column menu. Cadence does not wrap TanStack's API. Clinical lists are sorted and paged on the server as often as in the browser, and a wrapper would have to re-expose all of that.
3. **Cadence grades what it renders, not the library.** The grade of the data table covers its markup, its keyboard behaviour and what it shows. It says nothing about TanStack's sorting or filtering being correct for a clinical purpose, and the docs say so.
4. **The library's version range is a deliberate pin**, recorded with its reason in `pnpm-workspace.yaml` like the others, and subject to the minimum release age.

## Consequences

- `packages/ui/package.json` gains an `exports` entry per such pattern, and `tsdown` gains an entry. `publint` checks both.
- The boundary rules should gain a rule that the barrel never imports an entry point with an optional peer, or the dependency becomes compulsory again without anyone noticing.
- `scripts/check-grades.mjs` reads the manifest, so it covers the new component without change. The server-render test imports from the barrel, so it has to import the new entry point as well. The docs page imports from the entry point, which shows a consumer the real import.
- Storybook and the site install TanStack as an ordinary dev dependency.
- The same rule then applies to the Vitals chart and its charting library without another decision.

## Open questions

- Whether `lucide-react` should have been an optional peer by this rule. It is used by most components, so probably not, but the icons a consumer can replace are an argument for it.
- Whether an entry point per pattern is tidier as one entry point per level, such as `@cadence-clinical/ui/patterns`. That would make the second pattern with a different library compulsory for users of the first, so this record proposes one each.
