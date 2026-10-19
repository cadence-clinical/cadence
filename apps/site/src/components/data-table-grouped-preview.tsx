"use client";

import {
  DataTable,
  DataTableColumnHeader,
  dataTableFeatures,
  type DataTableGroup,
} from "@cadence-clinical/ui/data-table";
import { createColumnHelper, useTable, type SortingState } from "@tanstack/react-table";
import { useState } from "react";

// All content is synthetic.
interface Slot {
  id: string;
  clinic: string;
  day: string;
  room: string;
  minutes: number;
  isConfirmed: boolean;
}

const SLOTS: Slot[] = [
  {
    id: "s-1",
    clinic: "General clinic",
    day: "Monday",
    room: "Room 1",
    minutes: 30,
    isConfirmed: true,
  },
  {
    id: "s-2",
    clinic: "Wound clinic",
    day: "Monday",
    room: "Room 3",
    minutes: 15,
    isConfirmed: true,
  },
  {
    id: "s-3",
    clinic: "Review clinic",
    day: "Tuesday",
    room: "Room 2",
    minutes: 45,
    isConfirmed: false,
  },
  {
    id: "s-4",
    clinic: "Pre-admission clinic",
    day: "Tuesday",
    room: "Room 1",
    minutes: 60,
    isConfirmed: true,
  },
  {
    id: "s-5",
    clinic: "General clinic",
    day: "Wednesday",
    room: "Room 2",
    minutes: 15,
    isConfirmed: true,
  },
  {
    id: "s-6",
    clinic: "Review clinic",
    day: "Wednesday",
    room: "Room 3",
    minutes: 30,
    isConfirmed: true,
  },
];

// The days in the week's order, after the appointments still to confirm.
const GROUPS: DataTableGroup[] = [
  {
    id: "unconfirmed",
    label: "Unconfirmed",
    tone: "info",
    collapsible: false,
    description: "· waiting for the clinic to confirm",
  },
  { id: "Monday", label: "Monday" },
  { id: "Tuesday", label: "Tuesday" },
  { id: "Wednesday", label: "Wednesday" },
];

const helper = createColumnHelper<typeof dataTableFeatures, Slot>();

const columns = helper.columns([
  helper.accessor("clinic", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Clinic" />,
  }),
  helper.accessor("room", { header: "Room" }),
  helper.accessor("minutes", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Minutes" />,
    meta: { align: "end" },
  }),
]);

/** A data table grouped by day, with the unconfirmed appointments first. */
export function DataTableGroupedPreview() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useTable({
    features: dataTableFeatures,
    data: SLOTS,
    columns,
    getRowId: (row) => row.id,
    state: { sorting },
    onSortingChange: setSorting,
  });
  return (
    <div className="not-prose preview-surface my-6 grid gap-3 rounded-lg border p-4">
      <div className="min-w-0 rounded-md border">
        <DataTable
          table={table}
          aria-label="Appointments by day"
          groups={GROUPS}
          getGroupId={(row) => (row.isConfirmed ? row.day : "unconfirmed")}
          groupCount={(count) => (count === 1 ? "1 appointment" : `${String(count)} appointments`)}
        />
      </div>
    </div>
  );
}
