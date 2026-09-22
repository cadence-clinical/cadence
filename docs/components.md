# Component plan

The components Cadence intends to build, by [level](decisions/0013-component-levels.md), in build order. This is a working document: edit it. A component is built only when its status is **agreed**.

| Status   | Means                                                       |
| -------- | ----------------------------------------------------------- |
| Built    | Merged or in an open pull request                           |
| Agreed   | The maintainer has asked for it, or approved it             |
| Proposed | Suggested, with the reason. Not built until agreed          |
| Planned  | Intended, and agreed one at a time when its turn comes      |
| Deferred | Agreed in principle, and set aside until something needs it |

The maintainer approved this plan on 2026-09-20, and asked for Skeleton, Marker, Slider, Collapsible, Empty, Sheet, Drawer, Calendar, Date picker and Toast on 2026-09-22.

Sections 1 to 4 are general components in `packages/ui`. [Clinical components](#clinical-components) follow them.

## 1. Primitives

One control or one element. Built first, in this order, because the composites need them.

| Component   | Status   | Base UI primitive | Why                                                                                           |
| ----------- | -------- | ----------------- | --------------------------------------------------------------------------------------------- |
| Button      | Built    | Button            |                                                                                               |
| Typeset     | Built    | None              | Long-form text. Cadence has no Text component (decision 0012).                                |
| Label       | Built    | None              |                                                                                               |
| Input       | Built    | Input             |                                                                                               |
| Select      | Built    | Select            |                                                                                               |
| Toggle      | Built    | Toggle            |                                                                                               |
| Textarea    | Built    | None              | Field needs it: free-text notes are the most common clinical input.                           |
| Checkbox    | Built    | Checkbox          | Field needs it, and the data table needs it for row selection.                                |
| Radio group | Built    | Radio group       | Field needs it: one choice from a few, all visible at once.                                   |
| Switch      | Built    | Switch            | Field needs it for a setting that applies at once.                                            |
| Table       | Built    | None              | The data table is built on it. Asked for with TanStack Table.                                 |
| Separator   | Built    | Separator         | The sidebar and menus need it.                                                                |
| Badge       | Built    | None              | A short status or count, in tables and items. Carries its border token.                       |
| Tooltip     | Built    | Tooltip           | The collapsed sidebar needs it to name its icons.                                             |
| Spinner     | Built    | None              | A pending Button composes it. shadcn has no `isLoading` prop.                                 |
| Skeleton    | Built    | None              | Holds the shape of content while it loads, so the page does not jump when it arrives.         |
| Marker      | Built    | None              | A line of small text, plain or between two rules, such as a date between the items of a list. |
| Slider      | Built    | Slider            | A setting chosen from a range. Not for a clinical value, which is typed exactly.              |
| Section     | Deferred | None              | A layout primitive. Skipped for now, and revisited with the layouts if one of them needs it.  |

## 2. Composites

A small group of parts or primitives that works as one unit.

| Component     | Status | Built on                         | Why                                                                                                  |
| ------------- | ------ | -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Card          | Built  | None                             |                                                                                                      |
| Item          | Built  | None                             | A row of media, title, description and actions.                                                      |
| Field         | Built  | Base UI Field, Label, the inputs | Label, control, description and error as one unit. The label sits 4px (`gap-1`) above its control.   |
| Tabs          | Built  | Base UI Tabs                     |                                                                                                      |
| Alert         | Built  | None                             | The first status surface: fill, border token, icon and text, never colour alone.                     |
| Dialog        | Built  | Base UI Dialog, Button           | One task over the page, such as editing a record. The sidebar also needs a sheet on a phone.         |
| Alert dialog  | Built  | Base UI Alert dialog, Button     | Confirming a destructive action. It must be answered, and a press outside does not close it.         |
| Popover       | Built  | Base UI Popover                  | The data table's filters and column settings.                                                        |
| Dropdown menu | Built  | Base UI Menu                     | Row actions in the data table, and the sidebar's user menu. No submenus.                             |
| Toggle group  | Built  | Base UI Toggle group, Toggle     | A set of filters or text styles. A view switch must have an answer, so it is Tabs.                   |
| Collapsible   | Built  | Base UI Collapsible              | Shows and hides one section, such as earlier entries or further detail.                              |
| Empty         | Built  | None                             | What a list or panel shows when it has nothing in it, and what to do next. List and detail needs it. |
| Sheet         | Built  | Base UI Dialog, Button           | A panel from the edge of the screen, for a task beside the page rather than over it.                 |
| Drawer        | Agreed | Base UI Drawer                   | A panel from the bottom of a phone screen that can be swiped away.                                   |

## 3. Patterns

A discrete section of an interface with behaviour of its own.

| Component   | Status | Built on                                                         | Why                                                                                                                            |
| ----------- | ------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Data table  | Built  | TanStack Table 9, Table, Checkbox, Button, Select, Dropdown menu | Sorting, selection, paging and column visibility. Its own entry point: decision 0014.                                          |
| Sidebar     | Built  | Button, Separator, Tooltip, Dialog, Input                        | Collapsible application navigation.                                                                                            |
| Form        | Built  | Base UI Form, Field, Alert, Button, Spinner                      | A group of fields with one error summary.                                                                                      |
| Calendar    | Agreed | react-day-picker, Button                                         | A month of days to choose from. Whether react-day-picker gets its own entry point (decision 0014) is decided when it is built. |
| Date picker | Agreed | Calendar, Popover, Button                                        | A date chosen from a calendar, for a date near today. A date the user already knows, such as a date of birth, is typed.        |
| Toast       | Agreed | Base UI Toast, Button                                            | A short message that something happened, such as a record saved. Never the only place an error is shown, because it goes away. |

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
