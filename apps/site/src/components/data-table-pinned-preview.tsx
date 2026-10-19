"use client";

import {
  DataTable,
  DataTableColumnHeader,
  dataTableFeatures,
  selectionColumn,
} from "@cadence-clinical/ui/data-table";
import {
  createColumnHelper,
  useTable,
  type ColumnPinningState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { useState } from "react";

// All content is synthetic.
interface Booking {
  id: string;
  clinic: string;
  clinician: string;
  day: string;
  room: string;
  note: string;
  minutes: number;
}

const BOOKINGS: Booking[] = [
  {
    id: "b-1",
    clinic: "General clinic",
    clinician: "Dr Example",
    day: "Monday",
    room: "Room 1",
    note: "Bring the previous letter",
    minutes: 15,
  },
  {
    id: "b-2",
    clinic: "Pre-admission and anaesthetic review clinic",
    clinician: "Dr Sample",
    day: "Tuesday",
    room: "Room 2",
    note: "Interpreter booked",
    minutes: 30,
  },
  {
    id: "b-3",
    clinic: "Wound clinic",
    clinician: "Dr Placeholder",
    day: "Wednesday",
    room: "Room 3",
    note: "Transport arranged by the clinic",
    minutes: 45,
  },
  {
    id: "b-4",
    clinic: "Review clinic",
    clinician: "Dr Example",
    day: "Thursday",
    room: "Room 1",
    note: "Needs a longer appointment",
    minutes: 60,
  },
];

const helper = createColumnHelper<typeof dataTableFeatures, Booking>();

const columns = helper.columns([
  selectionColumn<Booking>({ rowLabel: (row) => `${row.clinic}, ${row.day}` }),
  helper.accessor("clinic", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Clinic" />,
    meta: { label: "Clinic" },
    size: 180,
  }),
  helper.accessor("clinician", { header: "Clinician" }),
  helper.accessor("day", { header: "Day" }),
  helper.accessor("room", { header: "Room" }),
  helper.accessor("note", {
    header: "Note",
    cell: ({ getValue }) => <span className="whitespace-nowrap">{getValue()}</span>,
  }),
  helper.accessor("minutes", { header: "Minutes", meta: { align: "end" } }),
]);

/** A data table narrower than its columns, with the selection and the clinic pinned. */
export function DataTablePinnedPreview() {
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    start: ["select", "clinic"],
    end: [],
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const table = useTable({
    features: dataTableFeatures,
    data: BOOKINGS,
    columns,
    getRowId: (row) => row.id,
    state: { columnPinning, rowSelection },
    onColumnPinningChange: setColumnPinning,
    onRowSelectionChange: setRowSelection,
  });
  return (
    <div className="not-prose preview-surface my-6 grid gap-3 rounded-lg border p-4">
      <div className="max-w-lg min-w-0 rounded-md border">
        <DataTable table={table} aria-label="Bookings" />
      </div>
    </div>
  );
}
