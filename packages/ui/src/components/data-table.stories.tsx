import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  createColumnHelper,
  useTable,
  type ColumnPinningState,
  type ColumnVisibilityState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { Ellipsis, PanelRightOpen, Pencil, Printer, Trash2 } from "lucide-react";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";

import { Badge } from "@/components/cadence/badge";
import { Button } from "@/components/cadence/button";
import { Calendar } from "@/components/cadence/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";
import { Switch } from "@/components/cadence/switch";
import {
  DataTable,
  DataTableCellText,
  DataTableColumnHeader,
  DataTableEditableCell,
  dataTableFeatures,
  DataTablePagination,
  DataTableViewOptions,
  selectionColumn,
  useDataTableRowLines,
  type DataTableGroup,
  type DataTableRowLines,
} from "@/components/cadence/data-table";

// All content is synthetic.
interface Appointment {
  id: string;
  clinic: string;
  clinician: string;
  day: string;
  status: "Booked" | "Cancelled";
  minutes: number;
}

const CLINICS = ["General clinic", "Review clinic", "Pre-admission clinic", "Wound clinic"];
const CLINICIANS = ["Dr Example", "Dr Sample", "Dr Placeholder"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const APPOINTMENTS: Appointment[] = Array.from({ length: 23 }, (_, index) => ({
  id: `appt-${index + 1}`,
  clinic: CLINICS[index % CLINICS.length] ?? "",
  clinician: CLINICIANS[index % CLINICIANS.length] ?? "",
  day: DAYS[index % DAYS.length] ?? "",
  status: index % 7 === 3 ? "Cancelled" : "Booked",
  minutes: 15 + (index % 4) * 15,
}));

const reminders = fn();
const reschedule = fn();

const helper = createColumnHelper<typeof dataTableFeatures, Appointment>();

const columns = helper.columns([
  selectionColumn<Appointment>({ rowLabel: (row) => `${row.clinic}, ${row.day}` }),
  helper.accessor("clinic", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Clinic" />,
    meta: { label: "Clinic" },
  }),
  helper.accessor("clinician", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Clinician" />,
    meta: { label: "Clinician" },
  }),
  helper.accessor("day", { header: "Day" }),
  helper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant={getValue() === "Cancelled" ? "warning" : "secondary"}>{getValue()}</Badge>
    ),
  }),
  helper.accessor("minutes", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Minutes" />,
    meta: { label: "Minutes", align: "end" },
  }),
]);

/**
 * What a row's actions look like: a menu for the row, and a switch for a setting that applies at
 * once. Both stop the row's own handlers, so acting on a row never also selects it.
 */
const actionsColumn = helper.display({
  id: "actions",
  header: () => <span className="sr-only">Actions</span>,
  meta: { label: "Actions", align: "end" },
  cell: ({ row }) => (
    <div className="flex items-center justify-end gap-control-gap">
      <Switch
        aria-label={`Send a reminder for ${row.original.clinic}, ${row.original.day}`}
        defaultChecked={row.index % 2 === 0}
        onCheckedChange={reminders}
      />
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" iconOnly />}>
          <Ellipsis aria-hidden />
          {`Actions for ${row.original.clinic}, ${row.original.day}`}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={reschedule}>
            <Pencil aria-hidden />
            Reschedule
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Printer aria-hidden />
            Print letter
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Trash2 aria-hidden />
            Cancel appointment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
});

const withActions = [...columns, actionsColumn];

function AppointmentsTable({
  data = APPOINTMENTS,
  actions = false,
}: {
  data?: Appointment[];
  actions?: boolean;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const table = useTable({
    features: dataTableFeatures,
    data,
    columns: actions ? withActions : columns,
    getRowId: (row) => row.id,
    state: { sorting, rowSelection, columnVisibility, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  });
  return (
    <div className="grid max-w-3xl gap-3">
      <div className="flex justify-end">
        <DataTableViewOptions table={table} />
      </div>
      <div className="min-w-0 rounded-md border">
        <DataTable table={table} aria-label="Appointments" />
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}

// The table instance comes from `useTable` inside the story, so the story's component is the
// one that builds it, and `DataTable` itself has no args to set.
const meta = {
  title: "Patterns/DataTable",
  component: AppointmentsTable,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AppointmentsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("table", { name: "Appointments" })).toBeVisible();
    // Ten of twenty-three rows on the first page, plus the heading row.
    await expect(canvas.getAllByRole("row")).toHaveLength(11);
    await expect(canvas.getByText("Page 1 of 3")).toBeVisible();
  },
};

// Pressing a heading sorts the column, and the heading cell says which way.
export const SortsFromTheHeading: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = canvas.getByRole("columnheader", { name: "Minutes" });
    await expect(heading).not.toHaveAttribute("aria-sort");

    await userEvent.click(within(heading).getByRole("button", { name: "Minutes" }));
    await waitFor(() => expect(heading).toHaveAttribute("aria-sort", "ascending"));
    const first = canvas.getAllByRole("row")[1];
    await expect(first).toHaveTextContent("15");

    await userEvent.click(within(heading).getByRole("button", { name: "Minutes" }));
    await waitFor(() => expect(heading).toHaveAttribute("aria-sort", "descending"));
    await expect(canvas.getAllByRole("row")[1]).toHaveTextContent("60");

    // A column that cannot be sorted is words only.
    await expect(
      within(canvas.getByRole("columnheader", { name: "Day" })).queryByRole("button"),
    ).not.toBeInTheDocument();
  },
};

// A chosen row is marked as selected and by its ticked checkbox, and the count says so in words.
export const SelectsRows: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("checkbox", { name: "Select General clinic, Monday" });
    await userEvent.click(first);
    await expect(first).toBeChecked();
    const row = first.closest("tr");
    await expect(row).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByText("1 of 23 rows selected")).toBeVisible();

    // Some selected: the page's checkbox is half-checked. All: it is checked.
    const all = canvas.getByRole("checkbox", { name: "Select all rows on this page" });
    await expect(all).toHaveAttribute("aria-checked", "mixed");
    await userEvent.click(all);
    await expect(all).toBeChecked();
    await expect(canvas.getByText("10 of 23 rows selected")).toBeVisible();
  },
};

export const MovesBetweenPages: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(canvas.getByText("Page 2 of 3")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Last page" }));
    await expect(canvas.getByText("Page 3 of 3")).toBeVisible();
    // Three rows are left on the last page.
    await expect(canvas.getAllByRole("row")).toHaveLength(4);
    await expect(canvas.getByRole("button", { name: "Next page" })).toBeDisabled();

    await userEvent.click(canvas.getByRole("combobox", { name: "Rows per page" }));
    await userEvent.click(await screen.findByRole("option", { name: "50" }));
    await waitFor(() => expect(canvas.getByText("Page 1 of 1")).toBeVisible());
    await expect(canvas.getAllByRole("row")).toHaveLength(24);
  },
};

export const HidesAColumn: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("columnheader", { name: "Clinician" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Columns" }));
    await userEvent.click(await screen.findByRole("menuitemcheckbox", { name: "Clinician" }));
    await waitFor(() =>
      expect(canvas.queryByRole("columnheader", { name: "Clinician" })).not.toBeInTheDocument(),
    );
    // The selection column cannot be hidden, so it is not offered.
    await expect(
      screen.queryByRole("menuitemcheckbox", { name: "Selection" }),
    ).not.toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { data: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("cell", { name: "Nothing to show." })).toBeVisible();
    await expect(canvas.getByText("Page 1 of 1")).toBeVisible();
  },
};

// A row's actions: a switch that applies at once, and a menu for the rest. Acting on a row does
// not select it.
export const WithRowActions: Story = {
  args: { actions: true },
  play: async ({ canvasElement }) => {
    reminders.mockClear();
    reschedule.mockClear();
    const canvas = within(canvasElement);
    // The actions column's heading is for a screen reader, and each control names its own row.
    await expect(canvas.getByRole("columnheader", { name: "Actions" })).toBeVisible();
    const row = "General clinic, Monday";

    const reminder = canvas.getByRole("switch", { name: `Send a reminder for ${row}` });
    await userEvent.click(reminder);
    await expect(reminders).toHaveBeenCalledOnce();

    await userEvent.click(canvas.getByRole("button", { name: `Actions for ${row}` }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /Reschedule/ }));
    await expect(reschedule).toHaveBeenCalledOnce();

    // Neither the switch nor the menu selected the row.
    await expect(canvas.getByText("0 of 23 rows selected")).toBeVisible();
  },
};

// The columns fit, so there is no sideways scroll. A sort button used to hang past the last
// column's padding, which put a scrollbar under every table.
export const FittingColumnsDoNotScroll: Story = {
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector("[data-slot=table-container]");
    if (!(box instanceof HTMLElement)) throw new Error("No table container");
    await expect(box.scrollWidth).toBe(box.clientWidth);

    // The words of a sortable heading start where a plain heading's do.
    const canvas = within(canvasElement);
    const inset = (cell: HTMLElement) => {
      const text = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT).nextNode();
      if (!text) throw new Error("The heading has no words");
      const range = document.createRange();
      range.selectNodeContents(text);
      return Math.round(range.getBoundingClientRect().left - cell.getBoundingClientRect().left);
    };
    await expect(inset(canvas.getByRole("columnheader", { name: "Clinic" }))).toBe(
      inset(canvas.getByRole("columnheader", { name: "Day" })),
    );
  },
};

export const Comfortable: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const row = within(canvasElement).getAllByRole("row")[1];
    await expect(row?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  },
};

// A wide table in a narrow place: the clinic and its checkbox stay in view while the rest scrolls.
interface Booking extends Appointment {
  room: string;
  bookedBy: string;
  note: string;
}

const ROOMS = ["Room 1", "Room 2", "Room 3"];
const NOTES = [
  "Bring the previous letter",
  "Interpreter booked",
  "Transport arranged by the clinic",
  "Needs a longer appointment",
];

const BOOKINGS: Booking[] = APPOINTMENTS.slice(0, 6).map((appointment, index) => ({
  ...appointment,
  // One long clinic name: its column keeps its size, and the name wraps between words.
  clinic: index === 2 ? "Pre-admission and anaesthetic review clinic" : appointment.clinic,
  room: ROOMS[index % ROOMS.length] ?? "",
  bookedBy: CLINICIANS[(index + 1) % CLINICIANS.length] ?? "",
  note: NOTES[index % NOTES.length] ?? "",
}));

const bookingHelper = createColumnHelper<typeof dataTableFeatures, Booking>();

const bookingColumns = bookingHelper.columns([
  selectionColumn<Booking>({ rowLabel: (row) => `${row.clinic}, ${row.day}` }),
  bookingHelper.accessor("clinic", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Clinic" />,
    meta: { label: "Clinic" },
    size: 180,
  }),
  bookingHelper.accessor("clinician", { header: "Clinician" }),
  bookingHelper.accessor("day", { header: "Day" }),
  bookingHelper.accessor("room", { header: "Room" }),
  bookingHelper.accessor("bookedBy", { header: "Booked by" }),
  bookingHelper.accessor("note", {
    header: "Note",
    cell: ({ getValue }) => <span className="whitespace-nowrap">{getValue()}</span>,
  }),
  bookingHelper.accessor("minutes", { header: "Minutes", meta: { align: "end" } }),
]);

function PinnedTable({ width = "max-w-md" }: { width?: string }) {
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    start: ["select", "clinic"],
    end: [],
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({ "appt-3": true });
  const table = useTable({
    features: dataTableFeatures,
    data: BOOKINGS,
    columns: bookingColumns,
    getRowId: (row) => row.id,
    state: { columnPinning, rowSelection },
    onColumnPinningChange: setColumnPinning,
    onRowSelectionChange: setRowSelection,
  });
  return (
    <div className={`min-w-0 rounded-md border ${width}`}>
      <DataTable table={table} aria-label="Bookings" />
    </div>
  );
}

function rowOf(element: HTMLElement): HTMLElement {
  const row = element.closest("tr");
  if (!row) throw new Error("Not in a row");
  return row;
}

function scrollBox(canvasElement: HTMLElement): HTMLElement {
  const box = canvasElement.querySelector("[data-slot=table-container]");
  if (!(box instanceof HTMLElement)) throw new Error("No table container");
  return box;
}

/** The bar that marks a chosen row, drawn at the start of its first cell, or `null` if none. */
function markOf(cell: Element): { width: number } | null {
  const mark = getComputedStyle(cell, "::before");
  if (mark.content === "none" || mark.content === "") return null;
  return { width: parseFloat(mark.width) };
}

/** Whether the element on top at the middle of `cell` is the cell or something inside it. */
function isOnTop(cell: HTMLElement): boolean {
  const rect = cell.getBoundingClientRect();
  const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  return top !== null && cell.contains(top);
}

// Scrolled sideways, the pinned columns stay where they were, and nothing shows through them. The
// pinned column nearest the scrolling ones shows an edge once something is under it.
export const PinnedColumns: Story = {
  render: () => <PinnedTable />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = scrollBox(canvasElement);
    await expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);
    const table = canvas.getByRole("table", { name: "Bookings" });
    await expect(table).not.toHaveAttribute("data-scroll-start");

    const checkbox = canvas.getByRole("checkbox", { name: "Select Review clinic, Tuesday" });
    const clinic = within(rowOf(checkbox)).getByRole("cell", { name: "Review clinic" });
    const heading = canvas.getByRole("columnheader", { name: "Clinic" });
    const before = clinic.getBoundingClientRect().left;
    const headingBefore = heading.getBoundingClientRect().left;

    box.scrollLeft = 200;
    await waitFor(() => expect(table).toHaveAttribute("data-scroll-start"));
    await expect(clinic.getBoundingClientRect().left).toBe(before);
    await expect(heading.getBoundingClientRect().left).toBe(headingBefore);
    // The second pinned column starts where the first ends.
    const select = checkbox.closest("td");
    if (!select) throw new Error("No selection cell");
    await expect(clinic.getBoundingClientRect().left).toBe(select.getBoundingClientRect().right);
    // Opaque: what has scrolled under the pinned cells is behind them, on a plain and a chosen row.
    await expect(isOnTop(clinic)).toBe(true);
    await expect(isOnTop(heading)).toBe(true);
    const chosen = canvas.getByRole("cell", {
      name: "Pre-admission and anaesthetic review clinic",
    });
    await expect(chosen.closest("tr")).toHaveAttribute("aria-selected", "true");
    await expect(isOnTop(chosen)).toBe(true);
    await expect(getComputedStyle(chosen).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

    // The chosen row has a second mark that is not colour: a bar at the start of its first cell,
    // which is pinned, so the bar stays in view while the rest of the row scrolls under it.
    const chosenFirst = chosen.closest("tr")?.cells[0];
    if (!chosenFirst) throw new Error("No first cell");
    await expect(markOf(chosenFirst)?.width).toBe(3);
    await expect(chosenFirst.getBoundingClientRect().left).toBe(
      select.getBoundingClientRect().left,
    );
    await expect(markOf(select)).toBeNull();

    // The column with a size keeps it, and its long name wraps inside it.
    await expect(Math.round(heading.getBoundingClientRect().width)).toBe(180);
    await expect(Math.round(chosen.getBoundingClientRect().width)).toBe(180);

    // Focus that moves into a scrolling column scrolls it clear of the pinned columns.
    await expect(parseFloat(getComputedStyle(box).scrollPaddingLeft)).toBeCloseTo(
      clinic.getBoundingClientRect().right - select.getBoundingClientRect().left,
      0,
    );

    // A pinned control still works.
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
  },
};

export const PinnedColumnsComfortable: Story = {
  render: () => <PinnedTable />,
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = scrollBox(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "Select Review clinic, Tuesday" });
    const clinic = within(rowOf(checkbox)).getByRole("cell", { name: "Review clinic" });
    const select = canvas
      .getByRole("checkbox", { name: "Select Review clinic, Tuesday" })
      .closest("td");
    if (!select) throw new Error("No selection cell");
    box.scrollLeft = 200;
    // The selection column is wider when comfortable, and the clinic still starts where it ends.
    await waitFor(() =>
      expect(clinic.getBoundingClientRect().left).toBe(select.getBoundingClientRect().right),
    );
    await expect(isOnTop(clinic)).toBe(true);
  },
};

// On a phone, pinned columns that would cover more than two thirds of the table stop sticking,
// so there is room to scroll through the rest.
export const PinnedColumnsOnAPhone: Story = {
  render: () => <PinnedTable width="w-64" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "Bookings" });
    await waitFor(() => expect(table).toHaveAttribute("data-pinning", "off"));
    const checkbox = canvas.getByRole("checkbox", { name: "Select Review clinic, Tuesday" });
    const clinic = within(rowOf(checkbox)).getByRole("cell", { name: "Review clinic" });
    const before = clinic.getBoundingClientRect().left;
    scrollBox(canvasElement).scrollLeft = 120;
    await waitFor(() => expect(clinic.getBoundingClientRect().left).toBeLessThan(before));
  },
};

// Editing in place. The note is text, and the day is chosen from a calendar.
interface Visit {
  id: string;
  clinic: string;
  note: string;
  next: Date | null;
}

const REFERENCE = new Date(2026, 9, 19);

const VISITS: Visit[] = [
  {
    id: "visit-1",
    clinic: "General clinic",
    note: "Bring the previous letter",
    next: new Date(2026, 9, 21),
  },
  { id: "visit-2", clinic: "Review clinic", note: "", next: null },
  { id: "visit-3", clinic: "Wound clinic", note: "Dressing change", next: new Date(2026, 9, 23) },
];

const dayFormat = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" });

const saved = fn();

const visitHelper = createColumnHelper<typeof dataTableFeatures, Visit>();

/**
 * The columns are made once, as TanStack Table asks. A column made again on every render would
 * remount its cells, and an editable cell would lose its place after a save.
 */
function visitColumns(update: (id: string, change: Partial<Visit>) => void) {
  return visitHelper.columns([
    visitHelper.accessor("clinic", { header: "Clinic" }),
    visitHelper.accessor("note", {
      header: "Note",
      cell: ({ row }) => (
        <DataTableEditableCell
          label={`Note for ${row.original.clinic}`}
          value={row.original.note}
          placeholder="No note"
          readOnly={row.original.clinic === "Wound clinic"}
          onValueChange={(note) => {
            update(row.original.id, { note });
          }}
        />
      ),
    }),
    visitHelper.accessor("next", {
      header: "Next visit",
      cell: ({ row }) => (
        <DataTableEditableCell
          label={`Next visit for ${row.original.clinic}`}
          value={row.original.next}
          onValueChange={(next) => {
            update(row.original.id, { next });
          }}
          editor={({ value, onValueChange }) => (
            <>
              <Calendar
                mode="single"
                required
                // The chosen day takes focus when the calendar opens, as in a date picker.
                // eslint-disable-next-line jsx-a11y/no-autofocus -- focus moves into the popover the person just opened
                autoFocus
                selected={value ?? undefined}
                defaultMonth={value ?? REFERENCE}
                today={REFERENCE}
                onSelect={onValueChange}
              />
              {value ? (
                <div className="flex justify-end border-t p-container-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onValueChange(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              ) : null}
            </>
          )}
        >
          {row.original.next ? (
            dayFormat.format(row.original.next)
          ) : (
            <span className="text-muted-foreground">Not booked</span>
          )}
        </DataTableEditableCell>
      ),
    }),
  ]);
}

function EditableTable({ initial = VISITS }: { initial?: Visit[] }) {
  const [visits, setVisits] = useState(initial);
  const [columns] = useState(() =>
    visitColumns((id, change) => {
      saved(id, change);
      setVisits((current) =>
        current.map((visit) => (visit.id === id ? { ...visit, ...change } : visit)),
      );
    }),
  );
  const table = useTable({
    features: dataTableFeatures,
    data: visits,
    columns,
    getRowId: (row) => row.id,
  });
  return (
    <div className="max-w-xl min-w-0 rounded-md border">
      <DataTable table={table} aria-label="Visits" />
    </div>
  );
}

// Pressed, the cell becomes an Input with the value. Enter saves, focus returns to the cell, the
// change is announced, and the row is no taller while editing.
export const EditsText: Story = {
  render: () => <EditableTable />,
  play: async ({ canvasElement }) => {
    saved.mockClear();
    const canvas = within(canvasElement);
    const cell = canvas.getByRole("button", {
      name: "Note for General clinic: Bring the previous letter",
    });
    const row = rowOf(cell);
    const height = row.getBoundingClientRect().height;

    await userEvent.click(cell);
    const field = canvas.getByRole("textbox", { name: "Note for General clinic" });
    await expect(field).toHaveFocus();
    await expect(field).toHaveValue("Bring the previous letter");
    await expect(row.getBoundingClientRect().height).toBe(height);

    await userEvent.clear(field);
    await userEvent.type(field, "Bring the referral{Enter}");
    await expect(saved).toHaveBeenCalledWith("visit-1", { note: "Bring the referral" });
    const after = canvas.getByRole("button", {
      name: "Note for General clinic: Bring the referral",
    });
    await waitFor(() => expect(after).toHaveFocus());
    await expect(canvas.getByText("Note for General clinic updated")).toBeInTheDocument();
    await expect(row.getBoundingClientRect().height).toBe(height);
  },
};

// From the keyboard: Tab reaches the cell, Enter edits it, and leaving the Input saves it.
export const EditsTextFromTheKeyboard: Story = {
  render: () => <EditableTable />,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    saved.mockClear();
    const canvas = within(canvasElement);
    const cell = canvas.getByRole("button", { name: "Note for Review clinic: No note" });
    cell.focus();
    await userEvent.keyboard("{Enter}");
    const field = canvas.getByRole("textbox", { name: "Note for Review clinic" });
    await expect(field).toHaveFocus();
    await expect(field).toHaveValue("");
    await userEvent.type(field, "Interpreter booked");
    await userEvent.tab();
    await expect(saved).toHaveBeenCalledWith("visit-2", { note: "Interpreter booked" });
    // Leaving with Tab moves on: focus goes where Tab sent it, not back to the cell.
    await expect(
      canvas.getByRole("button", { name: "Note for Review clinic: Interpreter booked" }),
    ).not.toHaveFocus();
  },
};

// Escape puts the value back, saves nothing and returns focus to the cell.
export const CancelsAnEdit: Story = {
  render: () => <EditableTable />,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    saved.mockClear();
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Note for General clinic: Bring the previous letter" }),
    );
    const field = canvas.getByRole("textbox", { name: "Note for General clinic" });
    await userEvent.type(field, " and the scans");
    await userEvent.keyboard("{Escape}");
    await expect(saved).not.toHaveBeenCalled();
    const cell = canvas.getByRole("button", {
      name: "Note for General clinic: Bring the previous letter",
    });
    await waitFor(() => expect(cell).toHaveFocus());
    await expect(canvas.queryByRole("textbox")).not.toBeInTheDocument();
  },
};

// A date opens a calendar. Choosing a day saves it, Escape saves nothing, and Clear empties it.
export const EditsADate: Story = {
  render: () => <EditableTable />,
  play: async ({ canvasElement }) => {
    saved.mockClear();
    const canvas = within(canvasElement);
    const cell = canvas.getByRole("button", { name: "Next visit for General clinic: 21 Oct" });
    await userEvent.click(cell);
    const calendar = await screen.findByRole("dialog", { name: "Next visit for General clinic" });
    await userEvent.click(within(calendar).getByRole("button", { name: /October 28th, 2026/ }));
    await expect(saved).toHaveBeenCalledWith("visit-1", { next: new Date(2026, 9, 28) });
    const after = canvas.getByRole("button", { name: "Next visit for General clinic: 28 Oct" });
    await waitFor(() => expect(after).toHaveFocus());
    await expect(canvas.getByText("Next visit for General clinic updated")).toBeInTheDocument();

    // Escape closes the calendar and changes nothing.
    saved.mockClear();
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("dialog", { name: "Next visit for General clinic" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Next visit for General clinic" }),
      ).not.toBeInTheDocument(),
    );
    await expect(saved).not.toHaveBeenCalled();
    await waitFor(() => expect(after).toHaveFocus());

    // Clear empties a date that may be empty.
    await userEvent.click(after);
    const again = await screen.findByRole("dialog", { name: "Next visit for General clinic" });
    await userEvent.click(within(again).getByRole("button", { name: "Clear" }));
    await expect(saved).toHaveBeenCalledWith("visit-1", { next: null });
    await expect(
      canvas.getByRole("button", { name: "Next visit for General clinic: Not booked" }),
    ).toBeVisible();
  },
};

// A cell that cannot be edited here is plain text, with nothing to press.
export const ReadOnlyCell: Story = {
  render: () => <EditableTable />,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("cell", { name: "Dressing change" })).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: /^Note for Wound clinic/ }),
    ).not.toBeInTheDocument();
  },
};

export const EditableComfortable: Story = {
  render: () => <EditableTable />,
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByRole("button", {
      name: "Note for General clinic: Bring the previous letter",
    });
    const row = rowOf(cell);
    const height = row.getBoundingClientRect().height;
    await userEvent.click(cell);
    await expect(canvas.getByRole("textbox", { name: "Note for General clinic" })).toHaveFocus();
    await expect(row.getBoundingClientRect().height).toBe(height);
    // The cell is at least as tall as a comfortable target.
    await expect(cell.getBoundingClientRect().height).toBeGreaterThanOrEqual(36);
  },
};

// Grouped rows. Unconfirmed appointments come first, in the info tone, and cannot be collapsed.
// The days follow in the week's order, not the alphabet's.
interface Slot extends Booking {
  isConfirmed: boolean;
}

const SLOTS: Slot[] = APPOINTMENTS.slice(0, 12).map((appointment, index) => ({
  ...appointment,
  room: ROOMS[index % ROOMS.length] ?? "",
  bookedBy: CLINICIANS[(index + 1) % CLINICIANS.length] ?? "",
  note: NOTES[index % NOTES.length] ?? "",
  isConfirmed: index !== 3 && index !== 10,
}));

const SLOT_GROUPS = [
  {
    id: "unconfirmed",
    label: "Unconfirmed",
    tone: "info",
    collapsible: false,
    description: "· waiting for the clinic to confirm",
  },
  ...DAYS.map((day) => ({ id: day, label: day })),
] as const satisfies readonly DataTableGroup[];

const slotHelper = createColumnHelper<typeof dataTableFeatures, Slot>();

const slotColumns = slotHelper.columns([
  selectionColumn<Slot>({ rowLabel: (row) => `${row.clinic}, ${row.day}` }),
  slotHelper.accessor("clinic", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Clinic" />,
    meta: { label: "Clinic" },
    size: 180,
  }),
  slotHelper.accessor("clinician", { header: "Clinician" }),
  slotHelper.accessor("room", { header: "Room" }),
  slotHelper.accessor("note", {
    header: "Note",
    cell: ({ getValue }) => <span className="whitespace-nowrap">{getValue()}</span>,
  }),
  slotHelper.accessor("minutes", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Minutes" />,
    meta: { label: "Minutes", align: "end" },
  }),
]);

function GroupedTable({ width = "max-w-3xl" }: { width?: string }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const table = useTable({
    features: dataTableFeatures,
    data: SLOTS,
    columns: slotColumns,
    getRowId: (row) => row.id,
    state: {
      sorting,
      rowSelection,
      columnPinning: { start: ["select", "clinic"], end: [] },
      pagination: { pageIndex: 0, pageSize: 50 },
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
  });
  return (
    <div className={`min-w-0 rounded-md border ${width}`}>
      <DataTable
        table={table}
        aria-label="Appointments by day"
        groups={SLOT_GROUPS}
        getGroupId={(row) => (row.isConfirmed ? row.day : "unconfirmed")}
        groupCount={(count) => (count === 1 ? "1 appointment" : `${String(count)} appointments`)}
        defaultCollapsedGroups={["Friday"]}
      />
    </div>
  );
}

/** The heading row of each group, in the order the table shows them. */
function groupHeadings(canvasElement: HTMLElement): HTMLElement[] {
  return Array.from(
    canvasElement.querySelectorAll<HTMLElement>("[data-slot=data-table-group-heading] th"),
  );
}

/** The data rows of the group whose heading starts with `label`. */
function rowsOfGroup(canvasElement: HTMLElement, label: string): HTMLTableRowElement[] {
  const heading = groupHeadings(canvasElement).find((cell) => cell.textContent.startsWith(label));
  const body = heading?.closest("tbody");
  if (!body) throw new Error(`No group ${label}`);
  return Array.from(body.querySelectorAll<HTMLTableRowElement>("tr[data-slot=table-row]"));
}

// Each group is a body with a heading row that names it and counts its rows. The groups keep the
// order they were given, and the group that cannot collapse has no button.
export const GroupedRows: Story = {
  render: () => <GroupedTable />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(groupHeadings(canvasElement).map((cell) => cell.textContent)).toEqual([
      "Unconfirmed 2 appointments· waiting for the clinic to confirm",
      "Monday 2 appointments",
      "Tuesday 3 appointments",
      "Wednesday 2 appointments",
      // One row is counted in the singular.
      "Thursday 1 appointment",
      "Friday 2 appointments",
    ]);
    // A heading row heads its group: one cell across every column.
    const first = groupHeadings(canvasElement)[0];
    await expect(first).toHaveAttribute("scope", "rowgroup");
    await expect(first).toHaveAttribute("colspan", "6");
    await expect(within(first ?? canvasElement).queryByRole("button")).not.toBeInTheDocument();
    await expect(rowsOfGroup(canvasElement, "Unconfirmed")).toHaveLength(2);
    // Friday starts collapsed: its heading and count stay, its rows do not.
    const friday = canvas.getByRole("button", { name: "Friday 2 appointments" });
    await expect(friday).toHaveAttribute("aria-expanded", "false");
    await expect(rowsOfGroup(canvasElement, "Friday")).toHaveLength(0);
  },
};

// A group collapses and expands from its heading, with the pointer or the keyboard.
export const CollapsesAGroup: Story = {
  render: () => <GroupedTable />,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const monday = canvas.getByRole("button", { name: "Monday 2 appointments" });
    await expect(monday).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(monday);
    await expect(monday).toHaveAttribute("aria-expanded", "false");
    await expect(rowsOfGroup(canvasElement, "Monday")).toHaveLength(0);
    await expect(canvas.getByText("Monday")).toBeVisible();

    await userEvent.keyboard("{Enter}");
    await expect(monday).toHaveAttribute("aria-expanded", "true");
    await expect(rowsOfGroup(canvasElement, "Monday")).toHaveLength(2);
    await userEvent.keyboard(" ");
    await expect(monday).toHaveAttribute("aria-expanded", "false");
    await expect(monday).toHaveFocus();
  },
};

// The column's sort applies within each group, and the groups keep their order.
export const SortsWithinGroups: Story = {
  render: () => <GroupedTable />,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const minutes = (label: string) =>
      rowsOfGroup(canvasElement, label).map((row) => Number(row.lastElementChild?.textContent));
    const heading = canvas.getByRole("columnheader", { name: "Minutes" });
    await userEvent.click(within(heading).getByRole("button", { name: "Minutes" }));
    await waitFor(() => expect(heading).toHaveAttribute("aria-sort", "ascending"));
    await expect(minutes("Monday")).toEqual([...minutes("Monday")].sort((a, b) => a - b));
    await userEvent.click(within(heading).getByRole("button", { name: "Minutes" }));
    await waitFor(() => expect(heading).toHaveAttribute("aria-sort", "descending"));
    await expect(minutes("Tuesday")).toEqual([...minutes("Tuesday")].sort((a, b) => b - a));
    await expect(groupHeadings(canvasElement)[0]).toHaveTextContent(/^Unconfirmed/);
    await expect(groupHeadings(canvasElement)[1]).toHaveTextContent(/^Monday/);
  },
};

// Pinned columns stay pinned and line up inside the groups, and a group's heading stays in view.
export const PinnedColumnsInGroups: Story = {
  render: () => <GroupedTable width="max-w-md" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = scrollBox(canvasElement);
    await expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);
    const heading = canvas.getByRole("columnheader", { name: "Clinic" });
    const cell = rowsOfGroup(canvasElement, "Unconfirmed")[0]?.cells[1];
    if (!(cell instanceof HTMLElement)) throw new Error("No clinic cell");
    const label = canvas.getByText("Tuesday");
    const before = {
      cell: cell.getBoundingClientRect().left,
      label: label.getBoundingClientRect().left,
    };

    box.scrollLeft = 200;
    await waitFor(() =>
      expect(canvas.getByRole("table", { name: "Appointments by day" })).toHaveAttribute(
        "data-scroll-start",
      ),
    );
    await expect(cell.getBoundingClientRect().left).toBe(before.cell);
    await expect(cell.getBoundingClientRect().left).toBe(heading.getBoundingClientRect().left);
    await expect(isOnTop(cell)).toBe(true);
    await expect(label.getBoundingClientRect().left).toBe(before.label);
  },
};

export const GroupedComfortable: Story = {
  render: () => <GroupedTable />,
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByRole("button", { name: "Monday 2 appointments" });
    await expect(toggle.getBoundingClientRect().height).toBeGreaterThanOrEqual(36);
  },
};

// A cell can be disabled, with the reason it cannot be changed yet given as its description.
export const DisabledCell: Story = {
  render: () => {
    function DisabledTable() {
      const table = useTable({
        features: dataTableFeatures,
        data: VISITS.slice(0, 1),
        columns: visitHelper.columns([
          visitHelper.accessor("clinic", { header: "Clinic" }),
          visitHelper.accessor("note", {
            header: "Note",
            cell: ({ row }) => (
              <DataTableEditableCell
                label={`Note for ${row.original.clinic}`}
                value={row.original.note}
                disabled
                aria-describedby="visit-locked"
                onValueChange={saved}
              />
            ),
          }),
        ]),
        getRowId: (row) => row.id,
      });
      return (
        <div className="flex max-w-xl flex-col gap-2">
          <p id="visit-locked" className="text-muted-foreground">
            The clinic has not confirmed this visit yet.
          </p>
          <div className="min-w-0 rounded-md border">
            <DataTable table={table} aria-label="Visits" />
          </div>
        </div>
      );
    }
    return <DisabledTable />;
  },
  play: async ({ canvasElement }) => {
    saved.mockClear();
    const cell = within(canvasElement).getByRole("button", {
      name: "Note for General clinic: Bring the previous letter",
    });
    await expect(cell).toBeDisabled();
    await expect(cell).toHaveAccessibleDescription("The clinic has not confirmed this visit yet.");
    await userEvent.click(cell, { pointerEventsCheck: 0 });
    await expect(within(canvasElement).queryByRole("textbox")).not.toBeInTheDocument();
  },
};

// A row that opens its record when clicked anywhere, with a button in the row that does the same
// for the keyboard and a screen reader.
const opened = fn();

function ClickableTable() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [visits, setVisits] = useState(VISITS);
  const [columns] = useState(() => [
    ...visitColumns((id, change) => {
      saved(id, change);
      setVisits((current) =>
        current.map((visit) => (visit.id === id ? { ...visit, ...change } : visit)),
      );
    }),
    visitHelper.display({
      id: "open",
      header: () => <span className="sr-only">Open</span>,
      meta: { label: "Open", align: "end" },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          onClick={() => {
            opened(row.original.id);
            setOpenId(row.original.id);
          }}
        >
          <PanelRightOpen aria-hidden />
          {`Open ${row.original.clinic}`}
        </Button>
      ),
    }),
  ]);
  const table = useTable({
    features: dataTableFeatures,
    data: visits,
    columns,
    getRowId: (row) => row.id,
    // The open visit is the chosen row, so the table marks it.
    state: { rowSelection: openId ? { [openId]: true } : {} },
  });
  const open = visits.find((visit) => visit.id === openId);
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <div className="min-w-0 rounded-md border">
        <DataTable
          table={table}
          aria-label="Visits"
          onRowClick={(row) => {
            opened(row.original.id);
            setOpenId(row.original.id);
          }}
        />
      </div>
      <p aria-live="polite">{open ? `Showing ${open.clinic}` : "No visit open"}</p>
    </div>
  );
}

function rowNamed(canvasElement: HTMLElement, clinic: string): HTMLElement {
  return rowOf(within(canvasElement).getByRole("cell", { name: clinic }));
}

// A click anywhere in the row that is not on a control opens it, and the open row is marked.
export const OpensARowWithAClick: Story = {
  render: () => <ClickableTable />,
  play: async ({ canvasElement }) => {
    opened.mockClear();
    const canvas = within(canvasElement);
    const row = rowNamed(canvasElement, "Review clinic");
    await userEvent.click(within(row).getByRole("cell", { name: "Review clinic" }));
    await expect(opened).toHaveBeenCalledWith("visit-2");
    await expect(canvas.getByText("Showing Review clinic")).toBeVisible();
    await expect(row).toHaveAttribute("aria-selected", "true");
    await expect(getComputedStyle(row).cursor).toBe("pointer");
    // The open row is marked by a bar at the start of its first cell as well as by its fill.
    const first = row.querySelector("td");
    if (!first) throw new Error("No first cell");
    await expect(markOf(first)?.width).toBe(3);
    const other = rowNamed(canvasElement, "Wound clinic").querySelector("td");
    if (!other) throw new Error("No first cell");
    await expect(markOf(other)).toBeNull();
  },
};

// The keyboard and a screen reader use the button in the row, which does the same.
export const OpensARowFromTheKeyboard: Story = {
  render: () => <ClickableTable />,
  play: async ({ canvasElement }) => {
    opened.mockClear();
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Open Wound clinic" });
    button.focus();
    await userEvent.keyboard("{Enter}");
    await expect(opened).toHaveBeenCalledWith("visit-3");
    await expect(canvas.getByText("Showing Wound clinic")).toBeVisible();
    // The row itself is not a tab stop.
    await expect(rowNamed(canvasElement, "Wound clinic")).not.toHaveAttribute("tabindex");
  },
};

// A control in the row keeps its own click: editing a cell, or choosing a day in its calendar,
// which is rendered elsewhere on the page, never also opens the row.
export const ControlsInARowKeepTheirClick: Story = {
  render: () => <ClickableTable />,
  play: async ({ canvasElement }) => {
    opened.mockClear();
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Note for General clinic: Bring the previous letter" }),
    );
    await userEvent.keyboard("{Escape}");
    await userEvent.click(
      canvas.getByRole("button", { name: "Next visit for General clinic: 21 Oct" }),
    );
    const calendar = await screen.findByRole("dialog", { name: "Next visit for General clinic" });
    await userEvent.click(within(calendar).getByRole("button", { name: /October 28th, 2026/ }));
    await expect(saved).toHaveBeenCalledWith("visit-1", { next: new Date(2026, 9, 28) });
    await expect(opened).not.toHaveBeenCalled();
    await expect(canvas.getByText("No visit open")).toBeVisible();
  },
};

// Selecting a cell's text to copy it does not open the row.
export const SelectingTextDoesNotOpenTheRow: Story = {
  render: () => <ClickableTable />,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    opened.mockClear();
    const cell = within(canvasElement).getByRole("cell", { name: "Review clinic" });
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(cell);
    selection?.removeAllRanges();
    selection?.addRange(range);
    cell.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await expect(opened).not.toHaveBeenCalled();
    selection?.removeAllRanges();
    cell.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await expect(opened).toHaveBeenCalledWith("visit-2");
  },
};

export const ClickableRowsComfortable: Story = {
  render: () => <ClickableTable />,
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Open General clinic" });
    await expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(36);
  },
};

// Rows of two or three lines. Every row is as tall as its lines, whatever is in it, and text that
// follows the row is cut to its lines, so a three-line row shows more in a narrower column.
interface Referral {
  id: string;
  clinic: string;
  room: string;
  reason: string;
  from: string;
  summary: string;
}

const REFERRALS: Referral[] = [
  {
    id: "ref-1",
    clinic: "General clinic",
    room: "Room 1",
    reason: "Review of the previous letter and the results that came back after it was sent",
    from: "Dr Example, 08:10",
    summary:
      "Asked to see again within the week. The results are attached to the referral, and the family would like to be there.",
  },
  {
    id: "ref-2",
    clinic: "Review clinic",
    room: "Room 2",
    reason: "Dressing change",
    from: "Dr Sample, 09:30",
    summary: "Short visit.",
  },
  {
    id: "ref-3",
    clinic: "Pre-admission and anaesthetic review clinic",
    room: "Room 3",
    reason: "Before the procedure booked for next month, with the forms to complete on the day",
    from: "Dr Placeholder, 11:45",
    summary:
      "Needs the forms filled in before the day, and a phone call the week before to confirm the time and the fasting instructions.",
  },
];

const referralHelper = createColumnHelper<typeof dataTableFeatures, Referral>();

/** The clinic and its room on two lines, or three: a cell that lays itself out by the row's lines. */
function ClinicCell({ referral }: { referral: Referral }) {
  const lines = useDataTableRowLines();
  return (
    <span className="flex flex-col gap-0.5 whitespace-nowrap">
      <span className="font-medium">{referral.clinic}</span>
      {lines === 3 ? (
        <>
          <span className="text-muted-foreground">{referral.room}</span>
          <span className="text-muted-foreground">{referral.id.toUpperCase()}</span>
        </>
      ) : (
        <span className="text-muted-foreground">{`${referral.room} · ${referral.id.toUpperCase()}`}</span>
      )}
    </span>
  );
}

function referralColumns(update: (id: string, reason: string) => void) {
  return referralHelper.columns([
    referralHelper.accessor("clinic", {
      header: "Clinic",
      cell: ({ row }) => <ClinicCell referral={row.original} />,
    }),
    referralHelper.accessor("reason", {
      header: "Reason",
      cell: ({ row }) => (
        <DataTableEditableCell
          label={`Reason for ${row.original.clinic}`}
          value={row.original.reason}
          className="w-48"
          onValueChange={(reason) => {
            update(row.original.id, reason);
          }}
        />
      ),
    }),
    referralHelper.accessor("summary", {
      header: "Summary",
      cell: ({ row }) => (
        <span className="flex w-56 flex-col gap-0.5">
          <span className="whitespace-nowrap text-muted-foreground">{row.original.from}</span>
          <DataTableCellText reserveLines={1}>{row.original.summary}</DataTableCellText>
        </span>
      ),
    }),
  ]);
}

function LinesTable({ initial = 2 }: { initial?: DataTableRowLines }) {
  const [lines, setLines] = useState<DataTableRowLines>(initial);
  const [referrals, setReferrals] = useState(REFERRALS);
  const [columns] = useState(() =>
    referralColumns((id, reason) => {
      setReferrals((current) =>
        current.map((referral) => (referral.id === id ? { ...referral, reason } : referral)),
      );
    }),
  );
  const table = useTable({
    features: dataTableFeatures,
    data: referrals,
    columns,
    getRowId: (row) => row.id,
  });
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <Button
        variant="outline"
        className="self-start"
        onClick={() => {
          setLines(lines === 2 ? 3 : 2);
        }}
      >
        {lines === 2 ? "Show 3 lines" : "Show 2 lines"}
      </Button>
      <div className="min-w-0 rounded-md border">
        <DataTable table={table} aria-label="Referrals" rowLines={lines} />
      </div>
    </div>
  );
}

function bodyRows(canvasElement: HTMLElement): HTMLTableRowElement[] {
  const table = within(canvasElement).getByRole("table", { name: "Referrals" });
  return Array.from(table.querySelectorAll<HTMLTableRowElement>("tbody tr"));
}

/** How many lines of its own line height an element is showing. */
function linesShown(element: HTMLElement): number {
  return Math.round(element.clientHeight / parseFloat(getComputedStyle(element).lineHeight));
}

/** Checks every row is one height, give or take the last row's missing rule, and returns it. */
async function expectSameHeights(canvasElement: HTMLElement): Promise<number> {
  const heights = bodyRows(canvasElement).map((row) => row.getBoundingClientRect().height);
  const first = heights[0] ?? 0;
  for (const height of heights) await expect(Math.abs(height - first)).toBeLessThanOrEqual(1);
  return first;
}

// Two lines: every row is the same height, the summary's text keeps to one line under its header
// line, and the reason edited in place keeps to two.
export const RowLines: Story = {
  render: () => <LinesTable />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("table", { name: "Referrals" })).toHaveAttribute(
      "data-row-lines",
      "2",
    );
    const twoLines = await expectSameHeights(canvasElement);
    const summary = canvas.getByText(/Needs the forms filled in/);
    await expect(linesShown(summary)).toBe(1);
    await expect(summary.scrollHeight).toBeGreaterThan(summary.clientHeight);
    const reason = canvas.getByText(/Before the procedure booked/);
    await expect(linesShown(reason)).toBe(2);
    // The whole text is still there for a screen reader.
    await expect(summary).toHaveTextContent(/fasting instructions\.$/);

    // Three lines: every row is taller by a line, and the same text shows a line more.
    await userEvent.click(canvas.getByRole("button", { name: "Show 3 lines" }));
    const threeLines = await expectSameHeights(canvasElement);
    await expect(threeLines).toBeGreaterThan(twoLines + 15);
    await expect(linesShown(summary)).toBe(2);
    await expect(linesShown(reason)).toBe(3);
    // A cell can lay itself out by the row's lines: the room and the reference on lines of their own.
    await expect(canvas.getByText("REF-1")).toBeVisible();
  },
};

// Short text in a row of three lines leaves the row just as tall.
export const RowLinesKeepTheirHeight: Story = {
  render: () => <LinesTable initial={3} />,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    await expectSameHeights(canvasElement);
    const short = within(canvasElement).getByText("Short visit.").closest("tr");
    const first = bodyRows(canvasElement)[0];
    if (!short || !first) throw new Error("No rows");
    await expect(
      Math.abs(short.getBoundingClientRect().height - first.getBoundingClientRect().height),
    ).toBeLessThanOrEqual(1);
  },
};

export const RowLinesComfortable: Story = {
  render: () => <LinesTable initial={3} />,
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const height = await expectSameHeights(canvasElement);
    // Three lines of 15px text at a line height of 1.5, the gaps and the comfortable padding.
    await expect(height).toBeGreaterThanOrEqual(3 * 22.5 + 18);
    await expect(linesShown(within(canvasElement).getByText(/Needs the forms filled in/))).toBe(2);
  },
};

// On a phone the rows keep their lines, and the table scrolls inside its own box.
export const RowLinesOnAPhone: Story = {
  render: () => <LinesTable initial={3} />,
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  play: async ({ canvasElement }) => {
    await expectSameHeights(canvasElement);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};
