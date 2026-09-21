# Component plan

The components Cadence intends to build, by [level](decisions/0013-component-levels.md), in build order. This is a working document: edit it. A component is built only when its status is **agreed**.

| Status   | Means                                                       |
| -------- | ----------------------------------------------------------- |
| Built    | Merged or in an open pull request                           |
| Agreed   | The maintainer has asked for it, or approved it             |
| Proposed | Suggested, with the reason. Not built until agreed          |
| Planned  | Intended, and agreed one at a time when its turn comes      |
| Deferred | Agreed in principle, and set aside until something needs it |

The maintainer approved this plan on 2026-09-20.

Sections 1 to 4 are general components in `packages/ui`. [Clinical components](#clinical-components) follow them.

## 1. Primitives

One control or one element. Built first, in this order, because the composites need them.

| Component   | Status   | Base UI primitive | Why                                                                                          |
| ----------- | -------- | ----------------- | -------------------------------------------------------------------------------------------- |
| Button      | Built    | Button            |                                                                                              |
| Typeset     | Built    | None              | Long-form text. Cadence has no Text component (decision 0012).                               |
| Label       | Built    | None              |                                                                                              |
| Input       | Built    | Input             |                                                                                              |
| Select      | Built    | Select            |                                                                                              |
| Toggle      | Built    | Toggle            |                                                                                              |
| Textarea    | Built    | None              | Field needs it: free-text notes are the most common clinical input.                          |
| Checkbox    | Built    | Checkbox          | Field needs it, and the data table needs it for row selection.                               |
| Radio group | Built    | Radio group       | Field needs it: one choice from a few, all visible at once.                                  |
| Switch      | Built    | Switch            | Field needs it for a setting that applies at once.                                           |
| Separator   | Built    | Separator         | The sidebar and menus need it.                                                               |
| Badge       | Built    | None              | A short status or count, in tables and items. Carries its border token.                      |
| Tooltip     | Built    | Tooltip           | The collapsed sidebar needs it to name its icons.                                            |
| Spinner     | Built    | None              | A pending Button composes it. shadcn has no `isLoading` prop.                                |
| Section     | Deferred | None              | A layout primitive. Skipped for now, and revisited with the layouts if one of them needs it. |

## 2. Composites

A small group of parts or primitives that works as one unit.

| Component    | Status   | Built on                         | Why                                                                                                |
| ------------ | -------- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| Card         | Built    | None                             |                                                                                                    |
| Item         | Built    | None                             | A row of media, title, description and actions.                                                    |
| Field        | Built    | Base UI Field, Label, the inputs | Label, control, description and error as one unit. The label sits 4px (`gap-1`) above its control. |
| Tabs         | Built    | Base UI Tabs                     |                                                                                                    |
| Alert        | Built    | None                             | The first status surface: fill, border token, icon and text, never colour alone.                   |
| Dialog       | Built    | Base UI Dialog, Button           | One task over the page, such as editing a record. The sidebar also needs a sheet on a phone.       |
| Alert dialog | Proposed | Base UI Alert dialog, Button     | Confirming a destructive action. It must be answered, and a press outside does not close it.       |
| Popover      | Built    | Base UI Popover                  | The data table's filters and column settings.                                                      |
| Menu         | Agreed   | Base UI Menu                     | Row actions in the data table, and the sidebar's user menu.                                        |
| Toggle group | Agreed   | Base UI Toggle group, Toggle     | One of a few views, such as chart or table.                                                        |

## 3. Patterns

A discrete section of an interface with behaviour of its own.

| Component  | Status | Built on                                              | Why                                       |
| ---------- | ------ | ----------------------------------------------------- | ----------------------------------------- |
| Data table | Agreed | TanStack Table, Checkbox, Button, Select, Input, Menu | Sorting, filtering, selection and paging. |
| Sidebar    | Agreed | Button, Separator, Tooltip, Dialog, Input             | Collapsible application navigation.       |
| Form       | Agreed | Field, Button, Alert                                  | A group of fields with one error summary. |

## 4. Layouts

Places patterns in the frame of a page.

| Component         | Status | Built on                | Why                                                                               |
| ----------------- | ------ | ----------------------- | --------------------------------------------------------------------------------- |
| Application shell | Agreed | Sidebar                 | shadcn's `sidebar-16`: a sidebar, a sticky header and an inset content area.      |
| List and detail   | Agreed | Application shell, Item | A list beside the record it selects, which is how most clinical work is laid out. |

## 5. Screens

Layouts filled with synthetic content. They live in the example apps and are not shipped.

## Clinical components

Subject-matter components in `packages/clinical`, built on the general ones above. Each is render-only: it displays an interpretation it is given and holds no threshold ([decision 0002](decisions/0002-clinical-logic-boundary.md)). Each arrives with its view model in `core` and its FHIR transform in `fhir`, and is agreed one at a time. The grading matrix comes before the first one ships.

| Component         | Status  | Level     | Built on                                                | Shows                                                           |
| ----------------- | ------- | --------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| Observation table | Planned | Pattern   | Data table, Badge                                       | Observations over time, in rows, with the interpretation given. |
| Vitals chart      | Planned | Pattern   | Card, Toggle group. The charting approach is undecided. | Vital signs over time, plotted, with the interpretation given.  |
| Medication card   | Planned | Composite | Card, Badge, Item                                       | One medicine: name, dose, route and frequency as given.         |

More will be added here as they are named. The adult and paediatric observation chart formats are a Region's to supply.

## Done ahead of the components

- **Public Sans is the default font**, shipped as `@cadence-clinical/tokens/fonts.css`. It went in before the next primitive because it changes the metrics every component is designed against.
