# Contributing

Cadence is early, and the maintainers are still laying foundations. Issues are welcome. Before
you start a pull request for anything larger than a fix, open an issue so we can agree on the
approach.

## How a change lands

1. Branch from `main`. `main` is protected: every change lands by pull request.
2. Write commits as [Conventional Commits](https://www.conventionalcommits.org), for example
   `feat(ui): add Tabs`. A commit hook checks the message.
3. If you changed a published package, run `pnpm changeset` and commit the file it creates.
4. Run `pnpm check` and `pnpm test:browser`.
5. Open a pull request. `CI passed` must be green, and any visual change must be accepted in
   Chromatic.

## How code is written

[CONVENTIONS.md](CONVENTIONS.md) covers TypeScript, functions over classes, React components,
styling, accessibility, clinical data, testing and linting. Each rule says how it is enforced.

## Rules that hold everywhere

These are enforced by lint or CI where possible. The reasons are in
[docs/decisions](docs/decisions/README.md).

- **No clinical thresholds in components.** A component displays the interpretation it is given.
- **Component packages never import a Region package or FHIR types.**
- **`core`, `tokens`, `fhir` and Region packages stay free of React.**
- **Status is never shown by colour alone.** Pair it with text or an icon.
- **Every status surface carries its border token.**
- **Components use semantic tokens only.** No raw colours and no `dark:` overrides.
- **Synthetic data only.** No patient information in code, stories, tests, issues or screenshots.

## Definition of done for a component

- The component, built on Base UI where a primitive exists
- `meta.json` with an honest grade
- Stories that cover its variants, with play functions for its interactions
- Passes axe in every story, at compact and comfortable density
- A deliberate layout at phone width
- A documentation page under `apps/site/content/docs/components`
- A changeset

A clinical component also needs its view-model type in `core` and its FHIR transform in `fhir`.

## Changing a graded component

A change that alters how a component looks or behaves returns it to the tested grade until it is
reviewed again. If your pull request changes a component graded above tested, say so in the
description and update its `meta.json`.
