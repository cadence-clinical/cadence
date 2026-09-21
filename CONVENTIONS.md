# Conventions

How code is written in Cadence. [CONTRIBUTING.md](CONTRIBUTING.md) covers how a change lands, [AGENTS.md](AGENTS.md) covers commands and layout, and [docs/decisions](docs/decisions/README.md) covers why the architecture is what it is.

A rule a tool can enforce is enforced by the tool. This file records the rest, and the reason for each. Every rule carries a tag:

| Tag       | Enforced by                                                 |
| --------- | ----------------------------------------------------------- |
| `tsc`     | The TypeScript compiler                                     |
| `lint`    | ESLint or Prettier                                          |
| `test`    | A unit test, a story run in a browser, or a visual snapshot |
| `ci`      | A script in CI: grades, package checks, commit messages     |
| `review`  | People. No tool checks it                                   |
| `planned` | Should be enforced by a tool and is not yet                 |

## 1. Assumptions

- **Cadence displays. It does not decide.** No clinical thresholds, scoring or decision support in any package except a cited Region rule set. `review`
- **React 19, ESM only, TypeScript strict.** No CommonJS output and no support for older React. `tsc`
- **Browsers from the last two years**: Chrome and Edge 111, Safari 16.4, Firefox 128. Use the platform (`Intl`, container queries, OKLCH, `:has`) before a library. `review`
- **Consumers run Tailwind CSS v4.** Components ship class names, not compiled CSS. `review`
- **Server-safe.** Every component renders on the server. No browser globals at module scope or during render. `"use client"` only in files that use hooks or event handlers. `test` (each component is rendered without a DOM) and `review`
- **Desktop, tablet and phone are all first-class**, at compact and comfortable density. `test`
- **Synthetic data only.** Identifiers in fixtures are obviously fake. No patient information anywhere. `review`
- **Left-to-right only.** There is no right-to-left requirement, so physical utilities (`pl-`, `mr-`) are fine. `review`
- **Australian English in prose** (colour, licence, organisation). **Identifiers follow the platform** (`color`, `center`), because CSS and the DOM spell it that way. `review`

## 2. TypeScript

- `strict` and `noUncheckedIndexedAccess` stay on. An index into an array or record may be `undefined`, so handle it. `tsc`
- **No `any`.** Use `unknown` and narrow. `lint`
- **No non-null assertions (`!`) and no type assertions (`as`)**, except `as const`. If the compiler cannot see what you know, fix the type. Tests may assert to build invalid input. `lint`
- **Data from outside is `unknown` until parsed.** A FHIR resource, a JSON file and a URL parameter are never cast to a type. `review`
- **`interface` for object shapes, `type` for unions, mapped types and function types.** `lint`
- **Discriminated unions over optional fields and boolean flags.** Make invalid states unrepresentable. Exhaustive `switch` with a `never` check. `lint` (the switch) and `review`
- **No `enum`, no `namespace`, no parameter properties.** Use an `as const` object and derive the union from it. These features are not erasable, so they break type-stripping tools. `tsc` (`erasableSyntaxOnly`)
- **Named exports only.** Default exports only where a framework requires one: Next.js routes, Storybook meta and config files. `lint`
- **Explicit return types on exported functions.** Inference inside function bodies. React components are exempt. `lint`
- **`import type` for types**, inline with value imports. `lint`
- **`readonly` on inputs.** Never mutate an argument. `review`
- **Imports inside a component package use consumer-shaped aliases**: `@/lib/cn`, `@/components/cadence/button`. They are mapped in the package's tsconfig `paths` and are exactly what the import will be once the registry installs the file in someone's project. No relative imports between source files ([decision 0011](docs/decisions/0011-registry.md)). `lint`
- **The package entry is the only barrel.** `src/index.ts` lists every public export by name. Anything it does not export is private. `review`

## 3. Functions over classes

- **Plain functions and plain data.** No classes, no `this`, no inheritance. Compose functions. `lint`
- The one exception is an `Error` subclass, when a caller needs to tell failures apart.
- **Pure by default.** Same input, same output, no side effects. `core`, `tokens`, `fhir` and Region packages are pure apart from their build scripts. `review`
- **Side effects live at the edge**: I/O, the DOM, the clock, randomness and locale. Pass `now`, the time zone and the Region in as arguments. A function that reads the clock cannot be tested and will show a different answer on a server in another zone. `review`
- **No mutable module state.** A memo cache of a pure function is fine. `review`
- **Tables over branches for clinical mappings.** A lookup keyed by LOINC code is reviewable by a clinician and testable row by row. A chain of `if` statements is neither. `review`
- **Expected failures are return values, not exceptions.** A function that can fail for a reason the caller should handle returns a result the caller must inspect (`createAccent` returns `problems`). An `assertX` wrapper throws for callers who want that. Throw only for programmer error, with a message that says what to do. Never swallow an error. `review`

## 4. React components

- **Function components.** `ref` is a prop. No `forwardRef`, `defaultProps` or `React.FC`. `review`
- **Build on the Base UI primitive when one exists.** Do not reimplement focus management, dismissal, typeahead or an ARIA pattern. `review`
- **Props extend the primitive's props**, rest props spread onto the root, and the consumer's `className` is merged last with `cn()` so it wins. `review`
- **`data-slot` on every part**, named for the part. `review`
- **Composition over configuration.** Compound parts (`Card`, `CardHeader`) before a growing list of props. Polymorphism through Base UI's `render` prop, never `as` or `asChild`. `review`
- **Variants with `cva`, named for purpose, not appearance**: `destructive`, not `red`. `review`
- **A union prop, not a set of booleans**, for states that exclude each other. `review`
- **Controlled and uncontrolled both work**, following Base UI: `value`, `defaultValue`, `onValueChange`. `test`
- **No effect for derived state.** Compute it during render. A DOM change that a test or a snapshot depends on goes in a layout effect, because passive effects are flushed late outside Vitest. `review`
- **No user-visible string is hard-coded in a clinical component.** Text comes from props or the Region, with en-AU defaults. `review`
- **Clinical components take view models from `core`**, never FHIR types, and never import a Region package. `lint`
- **Icons are `lucide-react`**, passed as components, never as string keys. An icon inside a component carries `data-icon="inline-start"` or `data-icon="inline-end"` and no size class: the component sizes and spaces it. `review`
- **There is no `Text` or `Heading` component.** Interface text is styled by the component part that shows it. Content that is not written element by element (rendered markdown, patient information, the body of a note) goes in a `typeset` container ([decision 0012](docs/decisions/0012-typography.md)). `review`
- **Every component has a level** (primitive, composite, pattern or layout) and a domain (general or clinical), declared in its manifest entry. A component never imports one from a level above its own, a primitive imports no other component, and components are built from the bottom up ([decision 0013](docs/decisions/0013-component-levels.md)). `ci`
- **Component files are flat** in `src/components`: `button.tsx` and `button.stories.tsx`. The package's `registry.json` is the manifest: it lists each component's files, dependencies, level, domain and grade. `ci`

## 5. Styling

- **Semantic tokens only.** No raw colours, no arbitrary hex values and no `dark:` overrides. Modes are the tokens' job. `lint`
- **Status is never colour alone**, and every status surface carries its `-border` token. `review`
- **Never truncate clinical content**: medicine names, doses, units, identifiers, allergies. Wrap it. `truncate` is for navigation and decoration. `review`
- **Never change the case of text that can hold clinical content.** No `uppercase`, `capitalize` or small caps: [mixed-case lettering](https://www.safetyandquality.gov.au/sites/default/files/2024-04/mixed-case_lettering_-_principles_for_application.pdf) tells look-alike medicine names apart by capitalisation. `test` in Typeset, `review` elsewhere
- **Numbers that are compared use `tabular-nums`.** `review`
- **Size with the density scale.** Controls use `h-control`, `px-control-x` and `text-control`. Content uses `text-body`, `text-title` and `p-container`, so a card and the controls inside it change size together. No fixed `text-sm` or `p-4` in a component. A new scale key is registered in `cn.ts`, or a consumer's override silently loses. `review`
- **`gap-*`, not `space-*`. `size-*` when width equals height. `cn()` for conditional classes.** `review`
- **Motion** (the `emil-design-eng` skill has the reasoning): movement animates only `transform` and `opacity`, and colour may transition on a state change. Name the properties (never `transition-all`), keep feedback under 200ms, use none on keyboard-initiated or high-frequency actions, and remove movement under `prefers-reduced-motion`. `review`
- **Change a colour in `palette.ts`.** If a contrast test fails, fix the token. Do not relax the test. `test`
- Class order is Prettier's. `lint`

## 6. Accessibility

- **WCAG 2.2 AA is the floor.** Contrast is guaranteed by the tokens: 4.5:1 text and 3:1 boundaries, 7:1 and 4.5:1 at more contrast. `test`
- **Semantic HTML first, ARIA second.** No ARIA is better than wrong ARIA. `lint` (jsx-a11y strict) and `review`
- **Everything works from the keyboard**, with a visible focus ring that holds 3:1. `test`
- **An icon-only control has an accessible name.** Button's `iconOnly` takes it from the button's text, which it hides from sight. `test` (axe)
- **Targets are at least 24px, and 44px when comfortable.** `test`
- **Content reflows at 320px wide** with no sideways scroll. The smoke tests check the website at phone width; components at 320px are `review`.
- **Honour `prefers-reduced-motion`, `prefers-contrast` and `forced-colors`.** `review`
- **axe runs on every story and a violation fails the build.** Automated checks find only some problems, so a keyboard pass is part of done. A screen reader pass is not yet a condition of any grade; the grading matrix will revisit it. `test` and `review`

## 7. Clinical data

- **A quantity is a value and a unit together**, with the unit in UCUM. A bare number is never a clinical quantity. `review`
- **Missing is not zero.** Absence is explicit (`undefined`, with a reason where one is known). Never default a clinical value to `0` or `""`. `review`
- **Never parse a display string back into a number**, and never round for display without a documented rule per analyte. Comparators such as `<0.5` survive every transform. `test`
- **Time is ISO 8601 with an offset in data, and formatted with an explicit time zone for display.** Components never call `new Date()` for the current time: it is passed in. `review`
- **Converted values keep their original value and unit.** Unknown analytes and units pass through flagged. `test`
- **A clinical value, threshold or rule is never written from memory.** It needs its published source, checked, and the citation lives beside it. Medicines display follows the [national on-screen display guidelines](https://www.safetyandquality.gov.au/resources/national-guidelines-screen-display-medicines-information). `review`

## 8. Testing

- **Unit tests (Vitest) for pure code**: `core`, `tokens`, `fhir`, Regions. Table-driven with `it.each`. `test`
- **Stories are the component tests.** Every story runs in Chromium and WebKit. A play function asserts behaviour the way a user meets it: query by role and name, act with `userEvent`. `test`
- **Test behaviour, not implementation.** No assertions on class names or internal state, and no markup snapshots. Appearance belongs to Chromatic. `review`
- **Type tests where a type carries a guarantee**: the clinical view models in `core`, generic helpers such as `defineRegion`, and props that must reject invalid combinations. Write them in `*.test-d.ts` with Vitest's `expectTypeOf`, mostly as negative tests with `@ts-expect-error`. Plain interfaces do not need them. `test`
- **Every bug fix lands with a test that failed before it.** `review`
- **Deterministic**: no real clock, randomness or network, and a fixed time zone. `review`
- **The browser tests are never served from cache.** Turborepo runs them every time, because a rerun is how a flaky story is found. After adding an interaction test, run `pnpm test:browser` several times. `ci`
- **Clinical transforms are table-driven, and each expected value cites its source.** Edge rows are required: missing fields, unknown units, comparators, zero, negatives and extremes. `review`
- **Playwright end-to-end tests are smoke tests of the website only.** Component behaviour is not tested there. `review`
- **A change to tokens, CSS or Storybook config re-snapshots every story.** New styling sources are added to the `externals` list in `chromatic.yml`. `ci`
- **Clinical transforms require 100% branch coverage**: unit conversion, FHIR mapping and Region rule sets, enforced by coverage thresholds in those packages. Everywhere else coverage is a signal, not a target. `planned`: no such package exists yet, and the threshold goes in with the first one.

## 9. Linting and formatting

- **Prettier formats. ESLint finds bugs.** No stylistic lint rules. `lint`
- **A rule is an error or it is off.** No warnings, and lint runs with `--max-warnings 0`. `lint`
- **No `eslint-disable` or `@ts-expect-error` without a reason on the same line.** Fix the code, not the rule. `lint`
- **Linting is type-aware** (`strictTypeChecked`) in every package and app: floating promises, unsafe `any` flow, exhaustive switches. Config files are the exception, because package tsconfigs leave Node types out. `lint`
- **Package boundaries are lint rules**, in `packages/config/eslint/boundaries.js`. A new package gets its boundary there first. `lint`
- **Git hooks only format and check the commit message.** CI is the gate. `ci`

## 10. Dependencies

- **A new runtime dependency in a published package is justified in the pull request**: size, maintenance, licence and what the platform already offers. MIT, Apache-2.0, BSD and ISC only, and the SIL Open Font License for a font. `review`
- **React is a peer dependency.** Shared versions live in the pnpm catalog. `review`
- **Pins are deliberate and documented** in `pnpm-workspace.yaml`. Dependabot is told about each one. `review`
- **pnpm's minimum release age stays on.** Widen a version range before adding an exclusion. Install scripts run only for allow-listed packages. `review`
- **A third-party action's inputs come from its `action.yml`**, never from memory, and actions are pinned by commit. `review`

## 11. Naming and files

- Files `kebab-case`. Components and types `PascalCase`. Functions and variables `camelCase`. Module constants `UPPER_SNAKE_CASE`. `review`
- Booleans read as questions: `isOpen`, `hasError`, `canSubmit`. Callback props `onX`, their handlers `handleX`. `review`
- **Units in the name when the type does not carry them**: `timeoutMs`, `heightPx`. `review`
- Tests and stories sit beside the source: `region.test.ts`, `button.stories.tsx`. `review`

## 12. Comments and documentation

- **Comments say why.** The code says what. No commented-out code. A `TODO` links an issue. `review`
- **Every exported symbol has a JSDoc sentence**, plus what a type cannot say: units, ranges, what it throws. `lint` in packages. The website is an application with no public API, so it is exempt.
- Documentation follows the `technical-writing` skill, and site copy follows `human-writing`. `review`

## References

- TypeScript: [Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html), [`erasableSyntaxOnly`](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly), [typescript-eslint shared configs](https://typescript-eslint.io/users/configs/), [Google TypeScript style guide](https://google.github.io/styleguide/tsguide.html)
- Functions: [Keeping components pure](https://react.dev/learn/keeping-components-pure), [You might not need an effect](https://react.dev/learn/you-might-not-need-an-effect), [Functional core, imperative shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell)
- Components and styling: [Base UI](https://base-ui.com/react/overview/quick-start), [shadcn/ui](https://ui.shadcn.com/docs), [Tailwind CSS theme variables](https://tailwindcss.com/docs/theme)
- Accessibility: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- Testing: [Testing Library guiding principles](https://testing-library.com/docs/guiding-principles), [Storybook: writing tests](https://storybook.js.org/docs/writing-tests)
- Clinical data: [UCUM](https://ucum.org/ucum), [National guidelines for on-screen display of medicines information](https://www.safetyandquality.gov.au/resources/national-guidelines-screen-display-medicines-information) and ['Mixed-case lettering': Principles for application](https://www.safetyandquality.gov.au/sites/default/files/2024-04/mixed-case_lettering_-_principles_for_application.pdf) (ACSQHC)
- Process: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
