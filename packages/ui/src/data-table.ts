/**
 * The data table, on TanStack Table. It has its own entry point so that a consumer who never uses
 * it is not made to install TanStack Table: docs/decisions/0014-headless-libraries.md.
 */
export {
  DataTable,
  DataTableColumnHeader,
  dataTableFeatures,
  DataTablePagination,
  DataTableViewOptions,
  selectionColumn,
} from "@/components/cadence/data-table";
export type {
  DataTableColumnHeaderProps,
  DataTableColumnMeta,
  DataTableFeatures,
  DataTableInstance,
  DataTablePaginationProps,
  DataTableProps,
} from "@/components/cadence/data-table";
