# Component plan

The components Cadence intends to build, by [level](decisions/0013-component-levels.md), in build order. This is a working document: edit it. A component is built only when its status is **agreed**.

| Status   | Means                                              |
| -------- | -------------------------------------------------- |
| Built    | Merged or in an open pull request                  |
| Agreed   | The maintainer has asked for it                    |
| Proposed | Suggested, with the reason. Not built until agreed |

All of these are general components in `packages/ui`. Clinical components are planned separately, each with its FHIR transform, after the grading matrix.

## 1. Primitives

One control or one element. Built first, in this order, because the composites need them.

| Component   | Status   | Base UI primitive | Why                                                                             |
| ----------- | -------- | ----------------- | ------------------------------------------------------------------------------- |
| Button      | Built    | Button            |                                                                                 |
| Typeset     | Built    | None              | Long-form text. Cadence has no Text component (decision 0012).                  |
| Label       | Built    | None              |                                                                                 |
| Input       | Built    | Input             |                                                                                 |
| Select      | Agreed   | Select            |                                                                                 |
| Toggle      | Agreed   | Toggle            |                                                                                 |
| Textarea    | Proposed | None              | Field needs it: free-text notes are the most common clinical input.             |
| Checkbox    | Proposed | Checkbox          | Field needs it, and the data table needs it for row selection.                  |
| Radio group | Proposed | Radio group       | Field needs it: one choice from a few, all visible at once.                     |
| Switch      | Proposed | Switch            | Field needs it for a setting that applies at once.                              |
| Separator   | Proposed | Separator         | The sidebar and menus need it.                                                  |
| Badge       | Proposed | None              | A short status or count, in tables and items. Carries its border token.         |
| Tooltip     | Proposed | Tooltip           | The collapsed sidebar needs it to name its icons.                               |
| Spinner     | Proposed | None              | A pending Button composes it. shadcn has no `isLoading` prop.                   |
| Section     | Agreed   | None              | A layout primitive: a region of a page. Its parts are settled when it is built. |

## 2. Composites

A small group of parts or primitives that works as one unit.

| Component    | Status   | Built on                         | Why                                                                              |
| ------------ | -------- | -------------------------------- | -------------------------------------------------------------------------------- |
| Card         | Built    | None                             |                                                                                  |
| Item         | Agreed   | None                             | A row of media, title, description and actions.                                  |
| Field        | Agreed   | Base UI Field, Label, the inputs | Label, control, description and error as one unit.                               |
| Tabs         | Agreed   | Base UI Tabs                     |                                                                                  |
| Alert        | Proposed | None                             | The first status surface: fill, border token, icon and text, never colour alone. |
| Dialog       | Proposed | Base UI Dialog, Button           | Confirming a destructive action. The sidebar also needs a sheet on a phone.      |
| Popover      | Proposed | Base UI Popover                  | The data table's filters and column settings.                                    |
| Menu         | Proposed | Base UI Menu                     | Row actions in the data table, and the sidebar's user menu.                      |
| Toggle group | Proposed | Base UI Toggle group, Toggle     | One of a few views, such as chart or table.                                      |

## 3. Patterns

A discrete section of an interface with behaviour of its own.

| Component  | Status   | Built on                                              | Why                                       |
| ---------- | -------- | ----------------------------------------------------- | ----------------------------------------- |
| Data table | Agreed   | TanStack Table, Checkbox, Button, Select, Input, Menu | Sorting, filtering, selection and paging. |
| Sidebar    | Agreed   | Button, Separator, Tooltip, Dialog, Input             | Collapsible application navigation.       |
| Form       | Proposed | Field, Button, Alert                                  | A group of fields with one error summary. |

## 4. Layouts

Places patterns in the frame of a page.

| Component         | Status   | Built on                | Why                                                                               |
| ----------------- | -------- | ----------------------- | --------------------------------------------------------------------------------- |
| Application shell | Agreed   | Sidebar                 | shadcn's `sidebar-16`: a sidebar, a sticky header and an inset content area.      |
| List and detail   | Proposed | Application shell, Item | A list beside the record it selects, which is how most clinical work is laid out. |

## 5. Screens

Layouts filled with synthetic content. They live in the example apps and are not shipped.

## Done ahead of the components

- **Public Sans is the default font**, shipped as `@cadence-clinical/tokens/fonts.css`. It went in before the next primitive because it changes the metrics every component is designed against.
