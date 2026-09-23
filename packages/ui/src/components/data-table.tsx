"use client";

import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  type Column,
  type ReactTable,
  type RowData,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Settings2,
} from "lucide-react";
import { useId, type ComponentProps, type HTMLAttributes, type ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/cadence/button";
import { Checkbox } from "@/components/cadence/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/cadence/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/cadence/table";
import { cn } from "@/lib/cn";

/** What a column may say about itself, beyond its data. */
interface DataTableColumnMeta {
  /** The column's name in words, for the column menu. Defaults to a `header` that is a string. */
  label?: string;
  /** `end` aligns a column of numbers to the end. */
  align?: "start" | "end";
}

/**
 * The TanStack Table features the data table renders: sorting, filtering, selection, paging and
 * column visibility. Pass this to `useTable`, so that the table has the methods the parts call.
 * TanStack Table 9 leaves out any feature that is not registered.
 */
const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
  columnMeta: metaHelper<DataTableColumnMeta>(),
});

/** The type of `dataTableFeatures`, for `ColumnDef`, `Column`, `Row` and `ReactTable`. */
type DataTableFeatures = typeof dataTableFeatures;

/** A table built with `dataTableFeatures`. */
type DataTableInstance<TData extends RowData> = ReactTable<DataTableFeatures, TData>;

/** The Table's props, plus the TanStack table and what to say when there are no rows. */
type DataTableProps<TData extends RowData> = Omit<ComponentProps<typeof Table>, "children"> & {
  table: DataTableInstance<TData>;
  /** Shown as the only row when there is nothing to show. */
  emptyMessage?: ReactNode;
};

/** ARIA's word for a sort direction. */
function ariaSort(direction: false | "asc" | "desc"): "ascending" | "descending" | undefined {
  if (direction === "asc") return "ascending";
  if (direction === "desc") return "descending";
  return undefined;
}

/**
 * Renders a TanStack table: sorting, filtering, selection and paging are yours, through the
 * table you pass in, and Cadence draws what the table says. Name it with `aria-label`.
 *
 * A sorted column says so on its heading, a chosen row is marked as selected, and a table with
 * no rows says so in words.
 */
function DataTable<TData extends RowData>({
  table,
  emptyMessage = "Nothing to show.",
  className,
  ...props
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows;
  return (
    <Table data-slot="data-table" className={className} {...props}>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                aria-sort={ariaSort(header.column.getIsSorted())}
                data-align={header.column.columnDef.meta?.align}
                // A sort button fills its cell and carries the cell's padding, so that its words
                // line up with a plain heading's and nothing hangs over the table's edge.
                className="has-data-[slot=data-table-sort]:p-0 data-[align=end]:text-end"
              >
                {header.isPlaceholder ? null : <table.FlexRender header={header} />}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={table.getVisibleLeafColumns().length}
              className="h-[calc(var(--control-height)*2)] text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow
              key={row.id}
              aria-selected={row.getIsSelected() ? true : undefined}
              data-state={row.getIsSelected() ? "selected" : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  data-align={cell.column.columnDef.meta?.align}
                  className="data-[align=end]:text-end"
                >
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

/**
 * A column and the words that head it, plus the props of the element that shows them: a `button`
 * when the column sorts, and a `span` when it does not.
 */
interface DataTableColumnHeaderProps<TData extends RowData, TValue> extends Omit<
  HTMLAttributes<HTMLElement>,
  "title" | "children"
> {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
}

/**
 * A column heading that sorts the column when pressed: first ascending, then descending. The
 * heading cell says which, and the arrow shows it. A column that cannot be sorted is words only.
 */
function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
  onClick,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <span data-slot="data-table-column-header" className={className} {...props}>
        {title}
      </span>
    );
  }
  const sorted = column.getIsSorted();
  const toEnd = column.columnDef.meta?.align === "end";
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-slot="data-table-sort"
      {...props}
      className={cn(
        // It fills the cell, so its words sit where a plain heading's do and it adds no width.
        // No border: a Button's transparent one would put its words a pixel further in.
        "h-auto min-h-control-sm w-full rounded-none border-0 px-container-sm py-1 font-medium",
        toEnd ? "justify-end text-end" : "justify-start text-start",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        column.toggleSorting(sorted === "asc");
      }}
    >
      {title}
      {sorted === "desc" ? (
        <ArrowDown aria-hidden data-icon="inline-end" />
      ) : sorted === "asc" ? (
        <ArrowUp aria-hidden data-icon="inline-end" />
      ) : (
        <ChevronsUpDown aria-hidden data-icon="inline-end" className="text-muted-foreground" />
      )}
    </Button>
  );
}

/**
 * A column of checkboxes that select rows. The heading's checkbox selects every row on the page,
 * and is half-checked while only some are. Each checkbox is named, so a screen reader hears what
 * it selects: give `rowLabel` for a better name than the row's number.
 */
function selectionColumn<TData extends RowData>(options?: { rowLabel?: (row: TData) => string }) {
  const helper = createColumnHelper<DataTableFeatures, TData>();
  return helper.display({
    id: "select",
    enableSorting: false,
    enableHiding: false,
    meta: { label: "Selection" },
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all rows on this page"
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={!table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()}
        onCheckedChange={(checked) => {
          table.toggleAllPageRowsSelected(checked);
        }}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select ${options?.rowLabel?.(row.original) ?? `row ${row.index + 1}`}`}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(checked) => {
          row.toggleSelected(checked);
        }}
      />
    ),
  });
}

/** A `div`'s props, plus the table and the page sizes to offer. */
interface DataTablePaginationProps<TData extends RowData> extends ComponentProps<"div"> {
  table: DataTableInstance<TData>;
  pageSizes?: readonly number[];
}

/**
 * Where the reader is in the rows: how many are selected, the rows per page, which page this
 * is, and buttons to move. It wraps on a narrow screen, and says the page in words.
 */
function DataTablePagination<TData extends RowData>({
  table,
  pageSizes = [10, 20, 50],
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const pageSizeLabelId = useId();
  const selected = table.getFilteredSelectedRowModel().rows.length;
  const total = table.getFilteredRowModel().rows.length;
  const page = table.state.pagination.pageIndex + 1;
  const pages = Math.max(table.getPageCount(), 1);
  const sizes = pageSizes.map(String);
  return (
    <div
      data-slot="data-table-pagination"
      {...props}
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-control",
        className,
      )}
    >
      <p aria-live="polite" className="text-muted-foreground tabular-nums">
        {selected} of {total} {total === 1 ? "row" : "rows"} selected
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <span id={pageSizeLabelId}>Rows per page</span>
          <Select
            items={sizes.map((size) => ({ value: size, label: size }))}
            value={String(table.state.pagination.pageSize)}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger size="sm" aria-labelledby={pageSizeLabelId} className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p aria-live="polite" className="tabular-nums">
          Page {page} of {pages}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            iconOnly
            onClick={() => {
              table.firstPage();
            }}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft aria-hidden />
            First page
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconOnly
            onClick={() => {
              table.previousPage();
            }}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft aria-hidden />
            Previous page
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconOnly
            onClick={() => {
              table.nextPage();
            }}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight aria-hidden />
            Next page
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconOnly
            onClick={() => {
              table.lastPage();
            }}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight aria-hidden />
            Last page
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The name of a column in words, for the column menu. */
function columnLabel<TData extends RowData>(column: Column<DataTableFeatures, TData>): string {
  const { meta, header } = column.columnDef;
  if (meta?.label) return meta.label;
  return typeof header === "string" ? header : column.id;
}

/** The props of the Button that opens the menu, plus the table. */
interface DataTableViewOptionsProps<TData extends RowData> extends Omit<
  ButtonProps,
  "children" | "render"
> {
  table: DataTableInstance<TData>;
}

/** A menu that shows or hides each column that can be hidden. */
function DataTableViewOptions<TData extends RowData>({
  table,
  className,
  ...props
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" {...props} className={className} />}
      >
        <Settings2 aria-hidden data-icon="inline-start" />
        Columns
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Show columns</DropdownMenuLabel>
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(checked) => {
                  column.toggleVisibility(checked);
                }}
              >
                {columnLabel(column)}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export {
  DataTable,
  DataTableColumnHeader,
  dataTableFeatures,
  DataTablePagination,
  DataTableViewOptions,
  selectionColumn,
};
export type {
  DataTableColumnHeaderProps,
  DataTableColumnMeta,
  DataTableFeatures,
  DataTableInstance,
  DataTablePaginationProps,
  DataTableProps,
  DataTableViewOptionsProps,
};
