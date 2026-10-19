---
"@cadence-clinical/ui": minor
---

Data table: `rowLines` sets how many lines of text every row holds, `2` or `3`, and makes every row that tall. `DataTableCellText` is text in a cell cut to the row's lines with an ellipsis, or a line sooner with `reserveLines={1}`, and `DataTableEditableCell` cuts what it shows at rest the same way. `useDataTableRowLines()` gives a cell the row's lines, so it can lay itself out by them, and the table carries `data-row-lines`. A column's `meta.width` takes a CSS width in place of `size`, such as a width in `em` that follows the density. Its grade stays tested.
