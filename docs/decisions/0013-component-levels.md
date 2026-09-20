# 0013. Component levels: built from the bottom up

- Status: Accepted. The initial components in each level are proposed in [docs/components.md](../components.md) and are the maintainer's to confirm.
- Date: 2026-09-20
- Builds on: [0004](0004-component-grading.md) for grades and [0011](0011-registry.md) for the manifest.

## Context

Cadence will hold components of very different weight: a button, a field, a data table, an application shell. Without a shared idea of level, a simple component grows dependencies on complex ones, the build order is arbitrary, and nobody can say how much review a component needs.

[Atomic design](https://atomicdesign.bradfrost.com/chapter-2/) (Brad Frost) names five stages: atoms, molecules, organisms, templates and pages. Cadence uses it as a guide and keeps its own plainer names, because "primitive" is already the word Base UI, shadcn and this repository use.

## Decision

1. **Every component has one of four levels, and a fifth exists outside the packages.**

   | Level     | Atomic design | What it is                                                                                         | Examples                     |
   | --------- | ------------- | -------------------------------------------------------------------------------------------------- | ---------------------------- |
   | Primitive | Atom          | One control or one element. It cannot be broken down further and stay useful.                      | Button, Input, Label, Select |
   | Composite | Molecule      | A small group of parts or primitives that works as one unit.                                       | Card, Field, Item, Tabs      |
   | Pattern   | Organism      | A discrete section of an interface with behaviour of its own. It may pair with a headless library. | Data table, Sidebar          |
   | Layout    | Template      | Places patterns in the frame of a page. It holds no content of its own.                            | Application shell            |
   | Screen    | Page          | A layout filled with content. Screens live in the example apps and are never shipped in a package. | The example apps             |

2. **How to place a component.** Ask what a user would call it. One thing to operate or read is a primitive, however many parts Base UI gives it, so a select is a primitive. A unit that arranges content or combines primitives is a composite. A section of a screen that sorts, filters, navigates or otherwise behaves is a pattern.

3. **Domain is a separate question.** A component is general (`packages/ui`) or clinical (`packages/clinical`), at any level. A display of one quantity with its unit is a clinical primitive, and an observation chart is a clinical pattern. The manifest's `meta` therefore carries `level` and `domain`, which replace `category`.

4. **Dependencies only point down.** A component never imports a component from a level above its own, and a primitive imports no other component. `scripts/check-grades.mjs` enforces both from the manifest. A clinical component may import a general one, never the reverse, which the package boundary rules already enforce.

5. **Build from the bottom up.** A component is built when everything beneath it that it needs exists and is at least tested. Atomic design is "not a linear process", and neither is this: a pattern is what shows which primitives are missing, so the plan is drawn top-down and built bottom-up.

6. **The level is visible everywhere**: in the manifest, as the group in Storybook and in the docs sidebar, and on each component's page.

## Consequences

- `meta.category` becomes `meta.level` and `meta.domain`. The published `meta.json` changes shape before its first release.
- The level says how much can go wrong. A pattern carries more clinical context than a primitive, so the grading matrix (0004) can ask more of it. Whether a component's grade may exceed the lowest grade among the components it imports is a question for that session.
- A component that is hard to place is usually two components.
