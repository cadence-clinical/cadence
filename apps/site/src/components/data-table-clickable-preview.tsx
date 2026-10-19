"use client";

import { Button } from "@cadence-clinical/ui";
import { DataTable, dataTableFeatures } from "@cadence-clinical/ui/data-table";
import { createColumnHelper, useTable } from "@tanstack/react-table";
import { PanelRightOpen } from "lucide-react";
import { useState } from "react";

// All content is synthetic.
interface Visit {
  id: string;
  clinic: string;
  room: string;
  note: string;
}

const VISITS: Visit[] = [
  { id: "v-1", clinic: "General clinic", room: "Room 1", note: "Bring the previous letter" },
  { id: "v-2", clinic: "Review clinic", room: "Room 2", note: "Results to discuss" },
  { id: "v-3", clinic: "Wound clinic", room: "Room 3", note: "Dressing change" },
];

const helper = createColumnHelper<typeof dataTableFeatures, Visit>();

/** A table whose rows open a visit beside it: a click on the row, or its Open button. */
export function DataTableClickablePreview() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [columns] = useState(() =>
    helper.columns([
      helper.accessor("clinic", { header: "Clinic" }),
      helper.accessor("room", { header: "Room" }),
      helper.display({
        id: "open",
        header: () => <span className="sr-only">Open</span>,
        meta: { align: "end" },
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => {
              setOpenId(row.original.id);
            }}
          >
            <PanelRightOpen aria-hidden />
            {`Open ${row.original.clinic}`}
          </Button>
        ),
      }),
    ]),
  );
  const table = useTable({
    features: dataTableFeatures,
    data: VISITS,
    columns,
    getRowId: (row) => row.id,
    state: { rowSelection: openId ? { [openId]: true } : {} },
  });
  const open = VISITS.find((visit) => visit.id === openId);
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div className="min-w-0 rounded-md border">
        <DataTable
          table={table}
          aria-label="Visits"
          onRowClick={(row) => {
            setOpenId(row.original.id);
          }}
        />
      </div>
      <p aria-live="polite" className="text-muted-foreground">
        {open ? `${open.clinic}: ${open.note}` : "Click a row, or use its Open button."}
      </p>
    </div>
  );
}
