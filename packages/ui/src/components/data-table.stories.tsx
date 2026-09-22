import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  createColumnHelper,
  useTable,
  type ColumnVisibilityState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { Ellipsis, Pencil, Printer, Trash2 } from "lucide-react";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";

import { Badge } from "@/components/cadence/badge";
import { Button } from "@/components/cadence/button";
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
  DataTableColumnHeader,
  dataTableFeatures,
  DataTablePagination,
  DataTableViewOptions,
  selectionColumn,
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
