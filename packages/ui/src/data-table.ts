/**
 * The data table, on TanStack Table. It has its own entry point so that a consumer who never uses
 * it is not made to install TanStack Table: docs/decisions/0014-headless-libraries.md.
 */
export {
  DataTable,
  DataTableCellText,
  DataTableColumnHeader,
  DataTableEditableCell,
  dataTableFeatures,
  DataTablePagination,
  DataTableViewOptions,
  selectionColumn,
  useDataTableRowLines,
} from "@/components/cadence/data-table";
export type {
  DataTableCellEditorProps,
  DataTableCellTextProps,
  DataTableColumnHeaderProps,
  DataTableEditableCellProps,
  DataTableEditablePopoverCellProps,
  DataTableEditableTextCellProps,
  DataTableGroup,
  DataTableGroupingProps,
  DataTableGroupTone,
  DataTableColumnMeta,
  DataTableFeatures,
  DataTableInstance,
  DataTablePaginationProps,
  DataTableProps,
  DataTableRowLines,
  DataTableViewOptionsProps,
} from "@/components/cadence/data-table";
