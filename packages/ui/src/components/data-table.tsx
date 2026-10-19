"use client";

import {
  columnFilteringFeature,
  columnPinningFeature,
  columnSizingFeature,
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
  type Header,
  type ReactTable,
  type Row,
  type RowData,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Pencil,
  Settings2,
} from "lucide-react";
import {
  createContext,
  use,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { Button, buttonVariants, type ButtonProps } from "@/components/cadence/button";
import { Checkbox } from "@/components/cadence/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";
import { Input } from "@/components/cadence/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/cadence/popover";
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
  /**
   * The column's width as a CSS length, in place of `size`, for a width that follows the density,
   * such as `calc(9em + 2 * var(--container-padding-sm))`. An `em` is the cell's text size, so the
   * column grows with its text when the density is comfortable. Like `size`, it is the width,
   * minimum width and maximum width of the heading and every cell.
   */
  width?: string;
}

/**
 * How many lines of text every row of a data table holds. Each row is that tall, whatever is in
 * it, and text set to follow the row is cut to that many lines.
 */
type DataTableRowLines = 2 | 3;

const RowLinesContext = createContext<DataTableRowLines | undefined>(undefined);

/**
 * The lines every row holds, from the data table a cell is in: `2`, `3`, or `undefined` when the
 * table leaves its rows to fit their content. A cell that lays out its content differently for
 * three lines reads it here.
 */
function useDataTableRowLines(): DataTableRowLines | undefined {
  return use(RowLinesContext);
}

// A row's height: its lines of text, a 2px gap between each, as two lines in a cell are laid out,
// and the cell's padding above and below. A cell's height in a table is its least height, so every
// row is this tall as long as its content keeps to the lines.
const ROW_HEIGHT: Record<DataTableRowLines, string> = {
  2: "h-[calc(2lh+0.125rem+var(--container-padding-sm)*1.5)]",
  3: "h-[calc(3lh+0.25rem+var(--container-padding-sm)*1.5)]",
};

const LINE_CLAMP: Record<1 | 2 | 3, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
};

/** The clamp for text that keeps to the row's lines, less the lines kept for something else. */
function rowClamp(lines: DataTableRowLines | undefined, reserve: 0 | 1): string | undefined {
  if (lines === undefined) return undefined;
  const kept = lines - reserve;
  if (kept <= 1) return LINE_CLAMP[1];
  return kept === 2 ? LINE_CLAMP[2] : LINE_CLAMP[3];
}

/**
 * TanStack Table's column sizing, except that a column's `size` stays unset until you set it.
 * TanStack Table gives every column a size of 150 by default. The data table gives a fixed width
 * only to a column whose size was asked for, so a column without one still fits its content, and
 * TanStack Table still counts it as 150 wide where it needs a number.
 */
const columnSizingWhenSetFeature = {
  ...columnSizingFeature,
  getDefaultColumnDef: () => ({ minSize: 20, maxSize: Number.MAX_SAFE_INTEGER }),
};

/**
 * The TanStack Table features the data table renders: sorting, filtering, selection, paging,
 * column visibility, column pinning and column sizes. Pass this to `useTable`, so that the table
 * has the methods the parts call. TanStack Table 9 leaves out any feature that is not registered.
 */
const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnPinningFeature,
  columnSizingFeature: columnSizingWhenSetFeature,
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

/** How a group of rows looks: `info` for a group that needs attention, such as incoming patients. */
type DataTableGroupTone = "default" | "info";

/** One group of rows: its own body in the table, under a heading row. */
interface DataTableGroup {
  /** What `getGroupId` returns for a row in this group. */
  id: string;
  /** The group's name, shown in its heading row and naming its collapse button. */
  label: string;
  /** `info` fills the heading and the rows with the info tone. Defaults to `default`. */
  tone?: DataTableGroupTone;
  /** `false` leaves out the collapse button, so the group is always open. Defaults to `true`. */
  collapsible?: boolean;
  /** Said after the count in the heading row, such as "waiting for this team to accept". */
  description?: ReactNode;
}

/** The props that group a data table's rows. */
interface DataTableGroupingProps<TData extends RowData> {
  /**
   * The groups, in the order they are shown. A group with no rows is not shown. A row whose group
   * is not listed goes into a group of its own after these, named by its id, so no row is hidden.
   */
  groups: readonly DataTableGroup[];
  /** The id of the group a row belongs to. */
  getGroupId: (row: TData) => string;
  /** The count in a group's heading row, such as "2 patients". Defaults to "1 row" and "2 rows". */
  groupCount?: (count: number) => string;
  /** The ids of the collapsed groups. Leave it out to let the table hold its own. */
  collapsedGroups?: readonly string[];
  /** The ids of the groups that start collapsed, when the table holds its own. */
  defaultCollapsedGroups?: readonly string[];
  /** Called with the ids of the collapsed groups when a group is collapsed or expanded. */
  onCollapsedGroupsChange?: (collapsedGroups: string[]) => void;
}

/** A data table whose rows are not grouped. */
interface DataTableUngroupedProps {
  groups?: undefined;
  getGroupId?: undefined;
  groupCount?: undefined;
  collapsedGroups?: undefined;
  defaultCollapsedGroups?: undefined;
  onCollapsedGroupsChange?: undefined;
}

/**
 * The Table's props, plus the TanStack table, what to say when there are no rows, and, to group
 * the rows, `groups` and `getGroupId`.
 */
type DataTableProps<TData extends RowData> = Omit<ComponentProps<typeof Table>, "children"> & {
  table: DataTableInstance<TData>;
  /** Shown as the only row when there is nothing to show. */
  emptyMessage?: ReactNode;
  /**
   * Called when a row is clicked anywhere but on a control inside it, such as a button, a link or
   * a checkbox, and not when the click ends a selection of text. It is a shortcut for the pointer
   * only: a row cannot take focus, so put a control in each row that does the same, for the
   * keyboard and for a screen reader.
   */
  onRowClick?: (row: Row<DataTableFeatures, TData>) => void;
  /**
   * How many lines of text every row holds, `2` or `3`. Every row is then that tall, and text in a
   * `DataTableCellText` or a `DataTableEditableCell` is cut to that many lines. Leave it out, and
   * each row fits its content.
   */
  rowLines?: DataTableRowLines;
} & (DataTableGroupingProps<TData> | DataTableUngroupedProps);

// What a click on a row leaves alone: anything that does something of its own when pressed.
const INTERACTIVE =
  "a[href], button, input, select, textarea, label, summary, [contenteditable=''], [contenteditable=true], [role=button], [role=checkbox], [role=switch], [role=radio], [role=link], [role=menuitem], [role=option], [role=combobox], [role=slider], [role=tab], [tabindex]:not([tabindex='-1'])";

/**
 * Whether a click on a row is meant for the row: it landed inside the row's own element, not in a
 * popover rendered elsewhere whose events reach the row through React, not on a control in the
 * row, and not at the end of a selection of text.
 */
function isRowClick(event: MouseEvent<HTMLTableRowElement>): boolean {
  const { target, currentTarget } = event;
  if (!(target instanceof Element) || !currentTarget.contains(target)) return false;
  const control = target.closest(INTERACTIVE);
  if (control && currentTarget.contains(control)) return false;
  const selection = currentTarget.ownerDocument.getSelection();
  return selection === null || selection.isCollapsed;
}

/** The rows of one group, in the order the table has them. */
interface GroupedRows<TData extends RowData> {
  group: DataTableGroup;
  rows: Row<DataTableFeatures, TData>[];
}

/**
 * Splits the table's rows into the groups, in the groups' order. The rows keep the table's order
 * inside each group, so a column's sort applies within every group.
 */
function groupRows<TData extends RowData>(
  rows: readonly Row<DataTableFeatures, TData>[],
  groups: readonly DataTableGroup[],
  getGroupId: (row: TData) => string,
): GroupedRows<TData>[] {
  const byId = new Map<string, Row<DataTableFeatures, TData>[]>();
  for (const row of rows) {
    const id = getGroupId(row.original);
    const members = byId.get(id);
    if (members) members.push(row);
    else byId.set(id, [row]);
  }
  const known = new Set(groups.map((group) => group.id));
  const listed = groups.flatMap((group) => {
    const members = byId.get(group.id);
    return members ? [{ group, rows: members }] : [];
  });
  const unlisted = [...byId.entries()]
    .filter(([id]) => !known.has(id))
    .map(([id, members]) => ({ group: { id, label: id }, rows: members }));
  return [...listed, ...unlisted];
}

function rowCount(count: number): string {
  return count === 1 ? "1 row" : `${String(count)} rows`;
}

// A group's rows take a lighter shade of its heading's fill, so the heading and its rows read as
// one unit. The shade is a custom property, so a pinned cell can paint it over its own background.
const GROUP_BODY: Record<DataTableGroupTone, string> = {
  default: "[--data-table-group-fill:color-mix(in_oklab,var(--color-muted)_30%,transparent)]",
  info: "[--data-table-group-fill:color-mix(in_oklab,var(--color-info-subtle)_40%,transparent)]",
};

const GROUP_HEADING: Record<DataTableGroupTone, string> = {
  default: "border-t border-border bg-muted text-foreground",
  info: "border-t border-info-border bg-info-subtle text-info-text",
};

const GROUP_COUNT: Record<DataTableGroupTone, string> = {
  default: "text-muted-foreground",
  info: "text-info-text",
};

// A grouped row's cells paint the row's fill over the group's, as a pinned cell does, so hovering
// or choosing a row looks the same in its pinned cells and the rest. Chrome paints a row's own
// background differently from a cell's, so the row itself paints nothing.
const GROUP_ROW =
  "bg-transparent hover:bg-transparent aria-selected:bg-transparent data-[state=selected]:bg-transparent [&>td]:bg-[linear-gradient(var(--data-table-row-fill),var(--data-table-row-fill)),linear-gradient(var(--data-table-group-fill),var(--data-table-group-fill))]";

// The collapse button and the box that stands in for it in a group that cannot collapse, so both
// kinds of heading start their words in the same place.
const GROUP_TOGGLE =
  "-mx-1.5 h-control-sm gap-1.5 px-1.5 text-control font-medium text-inherit hover:bg-background/60";

/** ARIA's word for a sort direction. */
function ariaSort(direction: false | "asc" | "desc"): "ascending" | "descending" | undefined {
  if (direction === "asc") return "ascending";
  if (direction === "desc") return "descending";
  return undefined;
}

/** Where a column is pinned, and where it sits among the columns pinned to the same side. */
interface Pin {
  side: "start" | "end";
  /** Its place among the visible columns pinned to its side, counted from that side. */
  index: number;
  /** Whether it is the pinned column nearest the columns that scroll. */
  isEdge: boolean;
}

/** Whether and where a column is pinned, from TanStack Table's column pinning. */
function pinOf<TData extends RowData>(
  column: Column<DataTableFeatures, TData>,
  startIds: readonly string[],
  endIds: readonly string[],
): Pin | undefined {
  const side = column.getIsPinned();
  if (side === "start") {
    const index = startIds.indexOf(column.id);
    return { side, index, isEdge: index === startIds.length - 1 };
  }
  if (side === "end") {
    // End columns are counted from the end, so the last column is 0.
    const index = endIds.length - 1 - endIds.indexOf(column.id);
    return { side, index, isEdge: index === endIds.length - 1 };
  }
  return undefined;
}

/**
 * The style of a pinned or sized cell. A pinned cell's offset is a custom property the table
 * measures, so it is right at either density and whatever the content. Until it is measured, as on
 * the server, the offset is the sum of the sizes TanStack Table has for the columns before it.
 */
function cellStyle<TData extends RowData>(
  column: Column<DataTableFeatures, TData>,
  pin: Pin | undefined,
  hasSize: boolean,
): CSSProperties | undefined {
  if (!pin && !hasSize) return undefined;
  const style: CSSProperties = {};
  if (hasSize) {
    const width = column.columnDef.meta?.width ?? `${String(column.getSize())}px`;
    style.width = width;
    style.minWidth = width;
    style.maxWidth = width;
  }
  if (pin?.side === "start") {
    style.insetInlineStart = `var(--data-table-start-${String(pin.index)}, ${String(column.getStart("start"))}px)`;
  } else if (pin?.side === "end") {
    style.insetInlineEnd = `var(--data-table-end-${String(pin.index)}, ${String(column.getAfter("end"))}px)`;
  }
  return style;
}

// A pinned cell sticks to its side of the scrolling box. It is opaque, so what scrolls under it
// does not show through, and it takes the row's fill on hover and when the row is chosen. The
// pinned column nearest the scrolling columns draws an edge once something is scrolled under it.
const PINNED_CELL = cn(
  "sticky z-1 bg-background bg-[linear-gradient(var(--data-table-row-fill),var(--data-table-row-fill)),linear-gradient(var(--data-table-group-fill,transparent),var(--data-table-group-fill,transparent))]",
  "group-data-[pinning=off]/data-table:static",
  "data-[pinned-edge]:after:pointer-events-none data-[pinned-edge]:after:absolute data-[pinned-edge]:after:inset-y-0 data-[pinned-edge]:after:w-px data-[pinned-edge]:after:bg-border data-[pinned-edge]:after:opacity-0 data-[pinned-edge]:after:shadow-[0_0_6px_1px] data-[pinned-edge]:after:shadow-foreground/15",
  "data-[pinned-edge]:after:transition-opacity data-[pinned-edge]:after:duration-150 motion-reduce:data-[pinned-edge]:after:transition-none",
  "data-[pinned=end]:after:start-0 data-[pinned=start]:after:end-0",
  "group-data-[scroll-end]/data-table:data-[pinned=end]:after:opacity-100 group-data-[scroll-start]/data-table:data-[pinned=start]:after:opacity-100",
  "group-data-[pinning=off]/data-table:after:hidden",
);

// The row's fill as a custom property, so a pinned cell can paint it over its own opaque
// background. It matches Table's row: half muted on hover, muted when chosen.
const ROW_FILL =
  "[--data-table-row-fill:transparent] hover:[--data-table-row-fill:color-mix(in_oklab,var(--color-muted)_50%,transparent)] aria-selected:[--data-table-row-fill:var(--color-muted)] data-[state=selected]:[--data-table-row-fill:var(--color-muted)]";

// A chosen row's second mark, which is not colour: a bar at the leading edge of its first cell, as
// the Sidebar marks its active item. In a pinned first cell it stays in view while the rest scroll.
const CHOSEN_MARK =
  "before:pointer-events-none before:absolute before:inset-y-1.5 before:start-0 before:w-[3px] before:rounded-full before:bg-primary-text";

/**
 * Measures the pinned columns and writes each one's offset to the table as a custom property, and
 * marks the table while something is scrolled under a pinned side. Pinned columns stop sticking
 * when together they would cover more than two thirds of the box, because then too little is left
 * to scroll through, as on a phone.
 */
function usePinnedColumns(pinnedKey: string): RefObject<HTMLTableSectionElement | null> {
  // The heading row's parent is the table, which is measured without taking over its ref.
  const headRef = useRef<HTMLTableSectionElement>(null);
  useLayoutEffect(() => {
    const element = headRef.current?.parentElement;
    if (!(element instanceof HTMLTableElement) || pinnedKey === "") return;
    const box = element.parentElement;
    if (!box) return;
    const measure = () => {
      const head = element.tHead;
      const leaves = head ? head.rows[head.rows.length - 1] : undefined;
      const cells = leaves ? Array.from(leaves.cells) : [];
      let start = 0;
      for (const [index, cell] of cells.filter((c) => c.dataset.pinned === "start").entries()) {
        element.style.setProperty(`--data-table-start-${String(index)}`, `${String(start)}px`);
        start += cell.getBoundingClientRect().width;
      }
      let end = 0;
      const ends = cells.filter((c) => c.dataset.pinned === "end").reverse();
      for (const [index, cell] of ends.entries()) {
        element.style.setProperty(`--data-table-end-${String(index)}`, `${String(end)}px`);
        end += cell.getBoundingClientRect().width;
      }
      const isOff = start + end > (box.clientWidth * 2) / 3;
      if (isOff) element.dataset.pinning = "off";
      else delete element.dataset.pinning;
      // Something focused in a scrolling column is scrolled clear of the pinned ones, not under them.
      box.style.scrollPaddingInlineStart = isOff ? "" : `${String(start)}px`;
      box.style.scrollPaddingInlineEnd = isOff ? "" : `${String(end)}px`;
    };
    const scrolled = () => {
      const hidden = box.scrollWidth - box.clientWidth;
      element.toggleAttribute("data-scroll-start", box.scrollLeft > 0);
      element.toggleAttribute("data-scroll-end", box.scrollLeft < hidden - 1);
    };
    measure();
    scrolled();
    const observer = new ResizeObserver(() => {
      measure();
      scrolled();
    });
    observer.observe(box);
    observer.observe(element);
    for (const cell of element.querySelectorAll("th[data-pinned]")) observer.observe(cell);
    box.addEventListener("scroll", scrolled, { passive: true });
    return () => {
      observer.disconnect();
      box.removeEventListener("scroll", scrolled);
      box.style.scrollPaddingInlineStart = "";
      box.style.scrollPaddingInlineEnd = "";
    };
  }, [pinnedKey]);
  return headRef;
}

/**
 * Renders a TanStack table: sorting, filtering, selection and paging are yours, through the
 * table you pass in, and Cadence draws what the table says. Name it with `aria-label`.
 *
 * A sorted column says so on its heading, a chosen row is marked as selected, with its fill and a
 * bar at the start of its first cell, and a table with no rows says so in words.
 *
 * A column pinned with TanStack Table's column pinning stays in view while the table scrolls
 * sideways, and a column given a `size` keeps that width in pixels, or `meta.width` as CSS.
 *
 * With `rowLines`, every row holds that many lines of text and is that tall.
 *
 * With `groups` and `getGroupId`, each group of rows is its own body under a heading row that
 * names it, counts its rows and collapses it. The groups keep their order, and a column's sort
 * applies within each group. A collapsed group keeps its heading and count.
 *
 * With `onRowClick`, a click anywhere in a row that is not on a control in it calls it with the
 * row, as a shortcut for the pointer. The keyboard needs a control in the row that does the same.
 */
function DataTable<TData extends RowData>({
  table,
  emptyMessage = "Nothing to show.",
  className,
  groups,
  getGroupId,
  groupCount = rowCount,
  collapsedGroups,
  defaultCollapsedGroups,
  onCollapsedGroupsChange,
  onRowClick,
  rowLines,
  ...props
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows;
  const [ownCollapsed, setOwnCollapsed] = useState<readonly string[]>(defaultCollapsedGroups ?? []);
  const collapsed = collapsedGroups ?? ownCollapsed;
  const toggleGroup = (id: string) => {
    const next = collapsed.includes(id)
      ? collapsed.filter((other) => other !== id)
      : [...collapsed, id];
    if (collapsedGroups === undefined) setOwnCollapsed(next);
    onCollapsedGroupsChange?.(next);
  };
  const columnCount = table.getVisibleLeafColumns().length;
  const startIds = table.getStartVisibleLeafColumns().map((column) => column.id);
  const endIds = table.getEndVisibleLeafColumns().map((column) => column.id);
  const sizing = table.state.columnSizing;
  // The measuring runs again when the pinned columns change.
  const pinnedKey =
    startIds.length + endIds.length === 0 ? "" : `${startIds.join(",")}|${endIds.join(",")}`;
  const headRef = usePinnedColumns(pinnedKey);
  const hasSize = (column: Column<DataTableFeatures, TData>) =>
    column.columnDef.size !== undefined ||
    column.columnDef.meta?.width !== undefined ||
    sizing[column.id] !== undefined;
  const headerPin = (header: Header<DataTableFeatures, TData>): Pin | undefined => {
    // A heading over several columns is pinned with its first, and is the edge with its last.
    const leaves = header.getLeafHeaders();
    const first = leaves[0]?.column ?? header.column;
    const last = leaves[leaves.length - 1]?.column ?? header.column;
    const pin = pinOf(first, startIds, endIds);
    if (!pin) return undefined;
    return { ...pin, isEdge: pinOf(last, startIds, endIds)?.isEdge ?? false };
  };
  const renderRow = (row: Row<DataTableFeatures, TData>, isGrouped: boolean) => (
    <TableRow
      key={row.id}
      aria-selected={row.getIsSelected() ? true : undefined}
      data-state={row.getIsSelected() ? "selected" : undefined}
      data-clickable={onRowClick ? "" : undefined}
      className={cn(ROW_FILL, isGrouped && GROUP_ROW, onRowClick && "cursor-pointer")}
      onClick={
        onRowClick
          ? (event) => {
              if (isRowClick(event)) onRowClick(row);
            }
          : undefined
      }
    >
      {row.getVisibleCells().map((cell, index) => {
        const pin = pinOf(cell.column, startIds, endIds);
        const isMarked = index === 0 && row.getIsSelected();
        return (
          <TableCell
            key={cell.id}
            data-align={cell.column.columnDef.meta?.align}
            data-pinned={pin?.side}
            data-pinned-edge={pin?.isEdge ? "" : undefined}
            style={cellStyle(cell.column, pin, hasSize(cell.column))}
            className={cn(
              "data-[align=end]:text-end",
              rowLines && ROW_HEIGHT[rowLines],
              pin && PINNED_CELL,
              // The mark is placed in the cell: a pinned cell is already positioned, and one that
              // has stopped sticking, or was never pinned, is made relative for it.
              isMarked && CHOSEN_MARK,
              isMarked && (pin ? "group-data-[pinning=off]/data-table:relative" : "relative"),
            )}
          >
            <table.FlexRender cell={cell} />
          </TableCell>
        );
      })}
    </TableRow>
  );
  return (
    <RowLinesContext value={rowLines}>
      <Table
        data-slot="data-table"
        data-row-lines={rowLines}
        className={cn("group/data-table", className)}
        {...props}
      >
        <TableHeader ref={headRef}>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className={ROW_FILL}>
              {headerGroup.headers.map((header) => {
                const pin = headerPin(header);
                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    aria-sort={ariaSort(header.column.getIsSorted())}
                    data-align={header.column.columnDef.meta?.align}
                    data-pinned={pin?.side}
                    data-pinned-edge={pin?.isEdge ? "" : undefined}
                    style={cellStyle(
                      header.column,
                      pin,
                      header.subHeaders.length === 0 && hasSize(header.column),
                    )}
                    className={cn(
                      // A sort button fills its cell and carries the cell's padding, so that its
                      // words line up with a plain heading's and nothing hangs over the table's edge.
                      "has-data-[slot=data-table-sort]:p-0 data-[align=end]:text-end",
                      pin && PINNED_CELL,
                    )}
                  >
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        {rows.length === 0 ? (
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="h-[calc(var(--control-height)*2)] text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          </TableBody>
        ) : groups ? (
          groupRows(rows, groups, getGroupId).map(({ group, rows: members }) => {
            const tone = group.tone ?? "default";
            const isCollapsible = group.collapsible !== false;
            const isOpen = !isCollapsible || !collapsed.includes(group.id);
            const label = (
              <>
                <span>{group.label}</span>{" "}
                <span className={cn("font-normal", GROUP_COUNT[tone])}>
                  {groupCount(members.length)}
                </span>
              </>
            );
            return (
              <TableBody
                key={group.id}
                data-slot="data-table-group"
                data-tone={tone}
                data-state={isOpen ? "open" : "closed"}
                className={GROUP_BODY[tone]}
              >
                <TableRow data-slot="data-table-group-heading" className="hover:bg-transparent">
                  <TableHead scope="rowgroup" colSpan={columnCount} className={GROUP_HEADING[tone]}>
                    {/* The heading's words stay in view while the table scrolls sideways. */}
                    <div className="sticky start-(--container-padding-sm) flex w-fit items-center gap-x-1.5">
                      {isCollapsible ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-expanded={isOpen}
                          data-slot="data-table-group-toggle"
                          className={GROUP_TOGGLE}
                          onClick={() => {
                            toggleGroup(group.id);
                          }}
                        >
                          {isOpen ? (
                            <ChevronDown aria-hidden data-icon="inline-start" />
                          ) : (
                            <ChevronRight aria-hidden data-icon="inline-start" />
                          )}
                          {label}
                        </Button>
                      ) : (
                        <span
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            GROUP_TOGGLE,
                            "pointer-events-none",
                          )}
                        >
                          <ChevronDown aria-hidden data-icon="inline-start" className="invisible" />
                          {label}
                        </span>
                      )}
                      {group.description === undefined ? null : (
                        <span className="font-normal">{group.description}</span>
                      )}
                    </div>
                  </TableHead>
                </TableRow>
                {isOpen ? members.map((row) => renderRow(row, true)) : null}
              </TableBody>
            );
          })
        ) : (
          <TableBody>{rows.map((row) => renderRow(row, false))}</TableBody>
        )}
      </Table>
    </RowLinesContext>
  );
}

/** A `span`'s props, plus how many of the row's lines to leave for something else in the cell. */
interface DataTableCellTextProps extends ComponentProps<"span"> {
  /**
   * Lines of the row the text leaves for something else in the cell, such as a line of who and
   * when above it. `1` cuts it to one line fewer than the row holds. Defaults to `0`.
   */
  reserveLines?: 0 | 1;
}

/**
 * Text in a cell that keeps to the row's lines: it wraps between words, and what does not fit in
 * the lines the data table's `rowLines` gives it is cut off with an ellipsis. So show the whole
 * text one step away, such as in the record the row opens. Give it a width, or it wraps at every
 * word in a table wider than its box. Outside a table with `rowLines`, the text is not cut.
 */
function DataTableCellText({ reserveLines = 0, className, ...props }: DataTableCellTextProps) {
  const lines = useDataTableRowLines();
  return (
    <span
      data-slot="data-table-cell-text"
      className={cn(rowClamp(lines, reserveLines), className)}
      {...props}
    />
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
        // The heading's own text size, not the small button's, so sorted and plain headings match.
        "h-auto min-h-control-sm w-full rounded-none border-0 px-container-sm py-1 text-control font-medium",
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

/** What an editor in a popover is given: the value, and how to save or cancel it. */
interface DataTableCellEditorProps<TValue> {
  /** The value as it is now. */
  value: TValue;
  /** Saves a new value: the cell passes it on, closes the editor and announces the change. */
  onValueChange: (value: TValue) => void;
  /** Closes the editor and saves nothing. Escape and a press outside do the same. */
  onCancel: () => void;
}

/** The props every editable cell takes, whatever edits it. */
interface DataTableEditableCellSharedProps<TValue> extends Omit<
  ComponentProps<"button">,
  "value" | "defaultValue" | "onChange" | "children" | "type" | "ref"
> {
  /**
   * What is being edited and for whom, such as "Working problem for Margaret Holloway". It names
   * the cell and its editor, and starts what a screen reader hears after a change.
   */
  label: string;
  /** The value. The cell holds no value of its own: it is always the one you pass. */
  value: TValue;
  /** Called with the new value when an edit is saved, and not when it is cancelled. */
  onValueChange: (value: TValue) => void;
  /** Shows the value as plain text, with nothing to press. */
  readOnly?: boolean;
  /**
   * What a screen reader hears, politely, after a change is saved. It defaults to the label and
   * "updated". Say "saved" only once your own save has succeeded.
   */
  announcement?: string;
}

/** A cell edited as text, in an Input in place of its value. */
interface DataTableEditableTextCellProps extends DataTableEditableCellSharedProps<string> {
  editor?: undefined;
  /** What the cell shows at rest. It defaults to the value. */
  children?: ReactNode;
  /** Shown, muted, while the value is empty: at rest and in the Input. */
  placeholder?: string;
}

/** A cell edited in a popover, such as a date chosen from a Calendar. */
interface DataTableEditablePopoverCellProps<
  TValue,
> extends DataTableEditableCellSharedProps<TValue> {
  /** The editor, in a popover anchored to the cell. Call `onValueChange` to save. */
  editor: (props: DataTableCellEditorProps<TValue>) => ReactNode;
  /** What the cell shows at rest, such as the date in words. */
  children: ReactNode;
  placeholder?: undefined;
}

/**
 * An editable cell's props: text edited in place, or any value edited in a popover through
 * `editor`.
 */
type DataTableEditableCellProps<TValue = string> =
  DataTableEditableTextCellProps | DataTableEditablePopoverCellProps<TValue>;

// The cell's box reaches into the cell's padding, so it can be as tall as a small control without
// making the row taller, and its words stay where the column's heading starts.
const EDITABLE_BOX =
  "-mx-[calc(var(--container-padding-sm)/2)] -my-[calc(var(--container-padding-sm)*0.75)]";

// At rest it reads as the cell's text. Pointed at or focused, it shows a boundary and a pencil:
// two signs, so neither rests on colour. A touch screen cannot point, so it always shows the pencil.
const EDITABLE_TRIGGER = cn(
  "flex min-h-control-sm min-w-control items-center gap-1 rounded-md border border-transparent px-[calc(var(--container-padding-sm)/2-1px)] text-start",
  "transition-[border-color] duration-100 ease-out-strong outline-none motion-reduce:transition-none",
  "hover:border-input focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-transparent",
  "[&>svg]:ms-auto [&>svg]:size-[calc(var(--control-icon)*0.875)] [&>svg]:shrink-0 [&>svg]:text-muted-foreground",
  "[&>svg]:opacity-0 [&>svg]:transition-opacity [&>svg]:duration-100 motion-reduce:[&>svg]:transition-none",
  "hover:[&>svg]:opacity-100 focus-visible:[&>svg]:opacity-100 data-popup-open:[&>svg]:opacity-100 pointer-coarse:[&>svg]:opacity-100",
);

/**
 * A cell that can be edited where it is: text in an Input in place of the value, or anything else,
 * such as a date, in a popover through `editor`. At rest it reads as the cell's text, and shows a
 * boundary and a pencil when pointed at or focused. Tab reaches it, and Enter or a press edits it.
 *
 * Text is saved by Enter or by leaving the Input, and Escape puts the value back. Either way,
 * Enter and Escape return focus to the cell. The editor never changes the height of the row.
 * After a save, a screen reader hears `announcement`.
 *
 * Name it with `label`, which says what is edited and for whom. With `readOnly`, it is text.
 * In a data table with `rowLines`, what it shows at rest is cut to the row's lines.
 */
function DataTableEditableCell(props: DataTableEditableTextCellProps): ReactNode;
function DataTableEditableCell<TValue>(props: DataTableEditablePopoverCellProps<TValue>): ReactNode;
function DataTableEditableCell<TValue>(props: DataTableEditableCellProps<TValue>): ReactNode {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [announced, setAnnounced] = useState<string | undefined>(undefined);
  // In a table with `rowLines`, what the cell shows at rest keeps to the row's lines.
  const clamp = rowClamp(useDataTableRowLines(), 0);
  const trigger = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement>(null);
  // Set once an edit has ended, so a blur that follows Enter or Escape saves nothing twice.
  const isSettled = useRef(false);
  const returnFocus = useRef(false);

  useLayoutEffect(() => {
    if (isEditing) {
      field.current?.focus();
      field.current?.select();
    } else if (returnFocus.current) {
      returnFocus.current = false;
      trigger.current?.focus();
    }
  }, [isEditing]);

  const {
    label,
    value: _value,
    onValueChange: _onValueChange,
    readOnly,
    announcement,
    editor: _editor,
    placeholder: _placeholder,
    children: _children,
    className,
    ...rest
  } = props;
  const message = announcement ?? `${label} updated`;
  const live = (
    // Present from the first edit, so the change that follows it is announced.
    <span aria-live="polite" className="sr-only">
      {announced}
    </span>
  );

  if (props.editor !== undefined) {
    const { editor, value, onValueChange, children } = props;
    if (readOnly) {
      return (
        <span data-slot="data-table-editable-cell" className={clamp}>
          {children}
        </span>
      );
    }
    return (
      <>
        <Popover
          open={isEditing}
          onOpenChange={(open) => {
            if (open) setAnnounced(undefined);
            setIsEditing(open);
          }}
        >
          <PopoverTrigger
            render={<button type="button" />}
            data-slot="data-table-editable-cell"
            {...rest}
            className={cn(
              EDITABLE_TRIGGER,
              EDITABLE_BOX,
              // A button does not stretch, so it is given the cell's width and the padding it reaches into.
              "w-[calc(100%+var(--container-padding-sm))]",
              className,
            )}
          >
            <span className="sr-only">{`${label}: `}</span>
            <span className={cn("min-w-0", clamp)}>{children}</span>
            <Pencil aria-hidden data-icon="inline-end" />
          </PopoverTrigger>
          <PopoverContent aria-label={label} align="start" className="w-auto p-0">
            {editor({
              value,
              onValueChange: (next) => {
                onValueChange(next);
                setAnnounced(message);
                setIsEditing(false);
              },
              onCancel: () => {
                setIsEditing(false);
              },
            })}
          </PopoverContent>
        </Popover>
        {live}
      </>
    );
  }

  const { value, onValueChange, placeholder, children } = props;
  const shown =
    children ??
    (value === "" && placeholder !== undefined ? (
      <span className="text-muted-foreground">{placeholder}</span>
    ) : (
      value
    ));
  if (readOnly) {
    return (
      <span data-slot="data-table-editable-cell" className={clamp}>
        {shown}
      </span>
    );
  }

  const finish = (save: boolean, refocus: boolean) => {
    if (isSettled.current) return;
    isSettled.current = true;
    if (save && draft !== value) {
      onValueChange(draft);
      setAnnounced(message);
    }
    returnFocus.current = refocus;
    setIsEditing(false);
  };

  return (
    <div data-slot="data-table-editable-cell" className={cn("relative", EDITABLE_BOX)}>
      <button
        ref={trigger}
        type="button"
        {...rest}
        // Hidden while editing, it still holds the cell's width and height, so nothing moves.
        className={cn(EDITABLE_TRIGGER, "w-full", isEditing && "invisible", className)}
        onClick={(event) => {
          rest.onClick?.(event);
          if (event.defaultPrevented) return;
          isSettled.current = false;
          setDraft(value);
          setAnnounced(undefined);
          setIsEditing(true);
        }}
      >
        <span className="sr-only">{`${label}: `}</span>
        <span className={cn("min-w-0", clamp)}>{shown}</span>
        <Pencil aria-hidden data-icon="inline-end" />
      </button>
      {isEditing ? (
        <Input
          ref={field}
          aria-label={label}
          // A browser's suggestions would cover the rows below.
          autoComplete="off"
          placeholder={placeholder}
          value={draft}
          className="absolute inset-0 h-full px-[calc(var(--container-padding-sm)/2-1px)] text-body"
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              finish(true, true);
            } else if (event.key === "Escape") {
              // Escape cancels the edit, and goes no further: a dialog around the table stays open.
              event.preventDefault();
              event.stopPropagation();
              finish(false, true);
            }
          }}
          onBlur={() => {
            finish(true, false);
          }}
        />
      ) : null}
      {live}
    </div>
  );
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
  DataTableCellText,
  DataTableColumnHeader,
  DataTableEditableCell,
  dataTableFeatures,
  DataTablePagination,
  DataTableViewOptions,
  selectionColumn,
  useDataTableRowLines,
};
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
};
