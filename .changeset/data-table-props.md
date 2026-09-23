---
"@cadence-clinical/ui": patch
---

Data table: `DataTableColumnHeader`, `DataTablePagination` and `DataTableViewOptions` take the props of the element they render, not only `className`, and merge `className` last. The column header's `onClick` runs before it sorts. `DataTableViewOptionsProps` is exported. The rows-per-page label's id comes from `useId`, so two paginations on one page no longer share one, and a column heading that cannot sort carries `data-slot="data-table-column-header"`.
