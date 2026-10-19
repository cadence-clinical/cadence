"use client";

import { Button } from "@cadence-clinical/ui";
import { Calendar } from "@cadence-clinical/ui/calendar";
import {
  DataTable,
  DataTableEditableCell,
  dataTableFeatures,
} from "@cadence-clinical/ui/data-table";
import { createColumnHelper, useTable } from "@tanstack/react-table";
import { useState } from "react";
import { enAU } from "react-day-picker/locale";

// All content is synthetic.
interface Visit {
  id: string;
  clinic: string;
  note: string;
  next: Date | null;
}

const VISITS: Visit[] = [
  {
    id: "v-1",
    clinic: "General clinic",
    note: "Bring the previous letter",
    next: new Date(2026, 9, 21),
  },
  { id: "v-2", clinic: "Review clinic", note: "", next: null },
  { id: "v-3", clinic: "Wound clinic", note: "Dressing change", next: new Date(2026, 9, 23) },
];

const dayFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const helper = createColumnHelper<typeof dataTableFeatures, Visit>();

/** The columns, made once: a column made on every render would remount its cells. */
function visitColumns(update: (id: string, change: Partial<Visit>) => void) {
  return helper.columns([
    helper.accessor("clinic", { header: "Clinic" }),
    helper.accessor("note", {
      header: "Note",
      cell: ({ row }) => (
        <DataTableEditableCell
          label={`Note for ${row.original.clinic}`}
          value={row.original.note}
          placeholder="No note"
          onValueChange={(note) => {
            update(row.original.id, { note });
          }}
        />
      ),
    }),
    helper.accessor("next", {
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
                locale={enAU}
                selected={value ?? undefined}
                defaultMonth={value ?? new Date(2026, 9, 19)}
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

/** A data table whose note is edited as text and whose next visit is chosen from a calendar. */
export function DataTableEditablePreview() {
  const [visits, setVisits] = useState(VISITS);
  const [columns] = useState(() =>
    visitColumns((id, change) => {
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
    <div className="not-prose preview-surface my-6 grid gap-3 rounded-lg border p-4">
      <div className="min-w-0 rounded-md border">
        <DataTable table={table} aria-label="Visits" />
      </div>
    </div>
  );
}
