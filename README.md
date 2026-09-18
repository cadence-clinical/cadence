# Cadence Clinical

An open source design system for clinical software. Cadence gives doctors, nurses and
pharmacists interfaces that are consistent, accessible and quick to read.

> **Pre-release.** The packages are not yet on npm and the API will change. Do not use Cadence
> for patient care.

## What is here

| Path              | What it is                                                           |
| ----------------- | -------------------------------------------------------------------- |
| `packages/ui`     | Primitives built on [Base UI](https://base-ui.com) and Tailwind CSS. |
| `packages/tokens` | Colour modes, density, accents and the accent validator.             |
| `packages/core`   | The Region contract and the component grade schema. Framework-free.  |
| `packages/config` | Shared TypeScript and ESLint configuration.                          |
| `apps/site`       | The website: landing page and documentation.                         |
| `apps/storybook`  | The component workshop and browser test runner.                      |
| `docs/decisions`  | Why Cadence is built the way it is. Start here.                      |

Planned: `packages/clinical` (clinical components), `packages/fhir` (FHIR R4 to component props)
and `packages/au` (Australian conventions and cited rule sets).

## What makes it clinical

- **Status colours are fixed.** Critical, warning and success look the same in every theme. A
  brand gets an accent, and the build rejects an accent that could be read as a status.
- **Components display an interpretation. They never make one.** No component contains a
  clinical threshold.
- **Regional conventions are supplied, not built in.** Units, formats and rule sets come from a
  Region object, so another health system swaps the Region and keeps the components.
- **Every component carries a grade** that says how far it has been verified, tied to a version.

## Develop

You need Node.js 22 or later and pnpm 11.

```bash
pnpm install
pnpm build
pnpm dev            # website on :3000, Storybook on :6006
```

| Command                                         | What it does                                                                     |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `pnpm check`                                    | Format check, lint, typecheck, unit tests, build, grade check and package check. |
| `pnpm test`                                     | Unit tests.                                                                      |
| `pnpm test:browser`                             | Runs every story in a real browser: interactions and axe.                        |
| `pnpm --filter @cadence-clinical/site test:e2e` | Website smoke tests. Build the site first.                                       |
| `pnpm changeset`                                | Records a change to a published package.                                         |

See [CONTRIBUTING.md](CONTRIBUTING.md) for how a change lands.

## Clinical safety

Cadence is a presentation layer. It is not a medical device, it does not provide clinical
decision support, and it does not replace clinical judgement. You are responsible for the
clinical safety of the software you build with it.

To report a component that could mislead a clinician, open a
[clinical safety issue](https://github.com/cadence-clinical/cadence/issues/new?template=clinical-safety.yml).
Never include patient information.

## Licence

[MIT](LICENSE)
