---
"@cadence-clinical/ui": minor
---

Data table: group rows with `groups` and `getGroupId`. Each group is its own `tbody` under a heading row, a `th` with `scope="rowgroup"` across every column, with the group's label, its count from `groupCount` and an optional `description`. A collapsible group's label and count are a button with `aria-expanded`, and a collapsed group keeps its heading and count. Collapse state works controlled, with `collapsedGroups` and `onCollapsedGroupsChange`, or uncontrolled, with `defaultCollapsedGroups`. The groups keep the order they are given, a column's sort applies within each group, and a group can take the `info` tone or be marked not collapsible. A group's rows take a lighter shade of its heading's fill, pinned columns stay pinned inside groups, and a heading's words stay in view while the table scrolls sideways. Its grade stays tested.
