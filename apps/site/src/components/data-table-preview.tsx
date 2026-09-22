"use client";

import { Badge } from "@cadence-clinical/ui";
import {
  DataTable,
  DataTableColumnHeader,
  dataTableFeatures,
  DataTablePagination,
  DataTableViewOptions,
  selectionColumn,
} from "@cadence-clinical/ui/data-table";
import {
  createColumnHelper,
  useTable,
  type ColumnVisibilityState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";

// All content is synthetic.
interface Appointment {
  id: string;
  clinic: string;
  day: string;
  status: "Booked" | "Cancelled";
  minutes: number;
}

const CLINICS = ["General clinic", "Review clinic", "Pre-admission clinic", "Wound clinic"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const APPOINTMENTS: Appointment[] = Array.from({ length: 12 }, (_, index) => ({
  id: `appt-${index + 1}`,
  clinic: CLINICS[index % CLINICS.length] ?? "",
  day: DAYS[index % DAYS.length] ?? "",
  status: index % 5 === 3 ? "Cancelled" : "Booked",
  minutes: 15 + (index % 4) * 15,
}));

const helper = createColumnHelper<typeof dataTableFeatures, Appointment>();

const columns = helper.columns([
  selectionColumn<Appointment>({ rowLabel: (row) => `${row.clinic}, ${row.day}` }),
  helper.accessor("clinic", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Clinic" />,
    meta: { label: "Clinic" },
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

/** A live data table for the docs. Its state lives here, as it would in an app. */
export function DataTablePreview() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const table = useTable({
    features: dataTableFeatures,
    data: APPOINTMENTS,
    columns,
    getRowId: (row) => row.id,
    state: { sorting, rowSelection, columnVisibility, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  });
  return (
    <div className="not-prose my-6 grid gap-3 rounded-lg border bg-background p-4">
      <div className="flex justify-end">
        <DataTableViewOptions table={table} />
      </div>
      <div className="rounded-md border">
        <DataTable table={table} aria-label="Appointments" />
      </div>
      <DataTablePagination table={table} pageSizes={[5, 10]} />
    </div>
  );
}
