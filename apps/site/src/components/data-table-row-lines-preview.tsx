"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@cadence-clinical/ui";
import {
  DataTable,
  DataTableCellText,
  dataTableFeatures,
  useDataTableRowLines,
  type DataTableRowLines,
} from "@cadence-clinical/ui/data-table";
import { createColumnHelper, useTable } from "@tanstack/react-table";
import { useId, useState } from "react";

// All content is synthetic.
interface Referral {
  id: string;
  clinic: string;
  room: string;
  from: string;
  summary: string;
}

const REFERRALS: Referral[] = [
  {
    id: "ref-1",
    clinic: "General clinic",
    room: "Room 1",
    from: "Dr Example, 08:10",
    summary:
      "Asked to see again within the week. The results are attached, and the family would like to be there.",
  },
  {
    id: "ref-2",
    clinic: "Review clinic",
    room: "Room 2",
    from: "Dr Sample, 09:30",
    summary: "Short visit.",
  },
  {
    id: "ref-3",
    clinic: "Wound clinic",
    room: "Room 3",
    from: "Dr Placeholder, 11:45",
    summary:
      "Dressing change before the weekend, and a phone call on Monday to check how the wound is healing.",
  },
];

const LINES = [
  { value: "2", label: "2 lines" },
  { value: "3", label: "3 lines" },
];

/** The clinic, its room and its reference: on two lines, or three when the row holds three. */
function ClinicCell({ referral }: { referral: Referral }) {
  const lines = useDataTableRowLines();
  const reference = referral.id.toUpperCase();
  return (
    <span className="flex flex-col gap-0.5 whitespace-nowrap">
      <span className="font-medium">{referral.clinic}</span>
      {lines === 3 ? (
        <>
          <span className="text-muted-foreground">{referral.room}</span>
          <span className="text-muted-foreground">{reference}</span>
        </>
      ) : (
        <span className="text-muted-foreground">{`${referral.room} · ${reference}`}</span>
      )}
    </span>
  );
}

const helper = createColumnHelper<typeof dataTableFeatures, Referral>();

const columns = helper.columns([
  helper.accessor("clinic", {
    header: "Clinic",
    cell: ({ row }) => <ClinicCell referral={row.original} />,
  }),
  helper.accessor("summary", {
    header: "Summary",
    cell: ({ row }) => (
      <span className="flex w-64 flex-col gap-0.5">
        <span className="whitespace-nowrap text-muted-foreground">{row.original.from}</span>
        <DataTableCellText reserveLines={1}>{row.original.summary}</DataTableCellText>
      </span>
    ),
  }),
]);

/** A table whose rows hold two lines or three, chosen above it. */
export function DataTableRowLinesPreview() {
  const [lines, setLines] = useState<DataTableRowLines>(2);
  const labelId = useId();
  const table = useTable({
    features: dataTableFeatures,
    data: REFERRALS,
    columns,
    getRowId: (row) => row.id,
  });
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div className="flex items-center gap-control-gap">
        <span id={labelId} className="text-muted-foreground">
          Rows
        </span>
        <Select
          items={LINES}
          value={String(lines)}
          onValueChange={(value: string | null) => {
            setLines(value === "3" ? 3 : 2);
          }}
        >
          <SelectTrigger aria-labelledby={labelId} className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LINES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-0 rounded-md border">
        <DataTable table={table} aria-label="Referrals" rowLines={lines} />
      </div>
    </div>
  );
}
