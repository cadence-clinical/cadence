import {
  Badge,
  Button,
  Checkbox,
  cn,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@cadence-clinical/ui";
import { Calendar } from "@cadence-clinical/ui/calendar";
import {
  DataTableCellText,
  DataTableColumnHeader,
  DataTableEditableCell,
  type DataTableFeatures,
  type DataTableGroup,
  type DataTableRowLines,
} from "@cadence-clinical/ui/data-table";
import {
  createColumnHelper,
  type ColumnPinningState,
  type SortingState,
} from "@tanstack/react-table";
import { enAU } from "react-day-picker/locale";

import {
  daysSince,
  dischargeDays,
  formatDischarge,
  formatTime,
  fromIsoDate,
  TODAY,
  toIsoDate,
  type Job,
  type Patient,
  type PatientComment,
} from "../ward";
import type { ReactElement } from "react";

import {
  AlliedHealthCell,
  BarriersCell,
  LastCommentCell,
  NoteCell,
  ResultsCell,
  VitalsCell,
} from "./cells";
import { PatientIdentity, type Identified } from "./patient-identity";
import { RowActions } from "./row-actions";

/** The variants of a team's list: each has its own columns, actions and order. */
export const VIEWS = [
  { id: "ward-round", label: "Ward round" },
  { id: "jobs", label: "Jobs" },
  { id: "handover", label: "Handover" },
  { id: "review", label: "Review" },
] as const;

/** Which variant of the list is showing. */
export type ViewId = (typeof VIEWS)[number]["id"];

/** What the list remembers while the prototype runs: nothing is saved anywhere. */
export interface ListActions {
  /** Opens the patient's summary in the pane beside the list. */
  open: (patientId: string) => void;
  /** The address of the patient's own screen, which the name links to. */
  hrefFor: (patient: Patient) => string;
  /** People not in the synthetic ward, such as patients added in this session. */
  others: readonly Identified[];
  isSeen: (patient: Patient) => boolean;
  setSeen: (patientId: string, seen: boolean) => void;
  isImportant: (patient: Patient) => boolean;
  setImportant: (patientId: string, important: boolean) => void;
  isReviewed: (patientId: string) => boolean;
  setReviewed: (patientId: string, reviewed: boolean) => void;
  openJobs: (patient: Patient) => Job[];
  completeJob: (patientId: string, jobId: string) => void;
  /** Changes the working problem: held in the page's state only, as the prototype saves nothing. */
  setWorkingProblem: (patient: Patient, value: string) => void;
  /** Changes the expected date of discharge, or clears it with `null`. */
  setExpectedDischarge: (patient: Patient, value: string | null) => void;
  /** Whether a patient is waiting for this team to accept them. */
  isIncoming: (patient: Patient) => boolean;
  /** Accepts an incoming patient onto the team's list. */
  accept: (patientId: string) => void;
  /** The patient's comments, oldest first, with any added in this session. */
  commentsFor: (patient: Patient) => PatientComment[];
  /** The list showing: what kind it is, and its name, such as "GMU A". */
  list: { kind: "team" | "after-hours" | "admitting"; label: string };
  /** Asks to remove a patient from this list. The list confirms before it removes them. */
  requestRemove: (patient: Patient) => void;
}

/** The id of the words that say why an incoming patient's controls are disabled. */
export const INCOMING_REASON_ID = "incoming-reason";

/** Why an incoming patient's controls are disabled, for a screen reader and in a tooltip. */
export const INCOMING_REASON = "Accept this patient onto the team to change this.";

/**
 * A column width that follows the density: `em` for what grows with the text, pixels for what does
 * not (the similar-name icon and its gap), and the cell's padding on both sides.
 */
function fit(em: number, px: number): string {
  return `calc(${String(em)}em + ${String(px)}px + 2 * var(--container-padding-sm))`;
}

/** Which list a column is sized for: a team's, or the admitting list, which holds expected patients. */
export type ListKind = "team" | "admitting";

/**
 * Bed and Patient lead every view, at the same widths, and stay in view while the rest scrolls
 * sideways. Names and URNs never wrap or get cut, so each Patient width is the widest identity the
 * list can hold, measured in the browser at the compact, touch and comfortable densities (13, 14
 * and 15px text) and written in `em`, so it follows the density. Each has 2px to spare. Round 4 in
 * iterations.md has the measurements.
 *
 * - A team's list holds the ward's named patients and anyone added from the hospital's directory.
 *   In two lines the widest is a second line, such as "69, female · SYN-100224": 12.45em. In three
 *   lines the URN has a line of its own, and the widest is a directory patient's name with the
 *   similar-name icon, "Thomas Brennan": 7.86em and 22px.
 * - The admitting list also holds expected patients. In two lines the widest is "60M referred by
 *   HITH for APO" with "Expect": 17.65em and 16px. In three lines "Expect" moves to the second
 *   line, and the description alone is 14.35em.
 */
const PATIENT_WIDTH: Record<ListKind, Record<DataTableRowLines, string>> = {
  team: { 2: fit(12.45, 2), 3: fit(7.86, 24) },
  admitting: { 2: fit(17.65, 18), 3: fit(14.35, 2) },
};

/**
 * The Bed heading, "Bed" with its sort icon, is wider than any bed ("401 A", "No bed"), so it sets
 * the width: its words, the icon, which follows the density by its own token, and the padding.
 */
const BED_WIDTH = "calc(2.45em + var(--control-icon) + 2 * var(--container-padding-sm))";

/**
 * The columns pinned to each side. The last column, the row's actions, stays in view at the end.
 */
export const PINNED: Record<"team" | "admitting", ColumnPinningState> = {
  team: { start: ["bed", "patient"], end: ["actions"] },
  admitting: { start: ["patient"], end: ["actions"] },
};

/** Only a patient on a team has a working problem and a discharge date the team can change. */
function isEditable(patient: Patient): boolean {
  return patient.team !== null;
}

const helper = createColumnHelper<DataTableFeatures, Patient>();

function name(patient: Patient): string {
  return `${patient.firstName} ${patient.lastName}`;
}

/** Bed as words, such as "12 A". */
export function bedLabel(patient: Patient): string {
  if (!patient.bed) return patient.leftHospital ? "Left hospital" : "No bed";
  return `${patient.bed.room} ${patient.bed.bed}`;
}

/** An acuity level as written on screen: "High". */
export function acuityLabel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

// The order the placeholder scale sorts in. The clinician sets the level; the list only orders it.
const ACUITY_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

/** The open job due soonest, then the open jobs with no time. */
export function nextJob(jobs: Job[]): Job | undefined {
  return [...jobs].sort(
    (a, b) =>
      (a.due ? Date.parse(a.due) : Number.POSITIVE_INFINITY) -
      (b.due ? Date.parse(b.due) : Number.POSITIVE_INFINITY),
  )[0];
}

/** The calendar that sets an expected discharge, with Clear while one is set. */
function DischargeCalendar({
  value,
  onValueChange,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
}) {
  const selected = value ? fromIsoDate(value) : undefined;
  return (
    <>
      <Calendar
        mode="single"
        required
        locale={enAU}
        // The chosen day, or the ward's today, takes focus when the calendar opens.
        // eslint-disable-next-line jsx-a11y/no-autofocus -- focus moves into the popover just opened
        autoFocus
        today={fromIsoDate(TODAY)}
        selected={selected}
        defaultMonth={selected ?? fromIsoDate(TODAY)}
        onSelect={(day) => {
          onValueChange(toIsoDate(day));
        }}
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
  );
}

/**
 * A control of an incoming patient's, disabled until the team accepts them. It stays in view, so
 * the row keeps its shape, and says why: a screen reader hears the reason as the control's
 * description, and a pointer gets it in a tooltip. The Incoming group's heading says it too.
 */
function UntilAccepted({ isLocked, children }: { isLocked: boolean; children: ReactElement }) {
  if (!isLocked) return children;
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex w-fit" />}>{children}</TooltipTrigger>
      <TooltipContent>{INCOMING_REASON}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The latest comment, with any added in this session. A revoked comment is still the latest: the
 * column says it was revoked rather than showing an older comment as if it were the last word.
 */
export function lastComment(patient: Patient, actions: ListActions): PatientComment | undefined {
  return actions.commentsFor(patient).at(-1);
}

/** The column every list shows: the latest comment, so a team reads a handover before accepting. */
function lastCommentColumn(actions: ListActions, lines: DataTableRowLines) {
  return helper.accessor((row) => lastComment(row, actions)?.at ?? "", {
    id: "comment",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last comment" />,
    meta: { label: "Last comment" },
    sortDescFirst: true,
    sortUndefined: "last",
    cell: ({ row }) => (
      <LastCommentCell comment={lastComment(row.original, actions)} lines={lines} />
    ),
  });
}

/**
 * The width of the last column: one small icon button and the cell's padding, so pinning it at the
 * end costs as little of the table as it can.
 */
const ACTIONS_WIDTH = "calc(var(--control-height-sm) + 2 * var(--container-padding-sm))";

/**
 * The last column, pinned to the end: the row's actions, behind one icon button. A click anywhere
 * else on the row opens the summary, but a row cannot take focus, and the name opens the patient's
 * own screen, so the menu's Show summary is the keyboard's way to the pane. Accept for an incoming
 * patient is in the menu too, which keeps the column as narrow as the button.
 */
function actionsColumn(actions: ListActions) {
  return helper.display({
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    meta: { label: "Actions", align: "end", width: ACTIONS_WIDTH },
    enableHiding: false,
    cell: ({ row }) => <RowActions patient={row.original} actions={actions} />,
  });
}

/** Text cut to the row's lines, at a width for two-line rows and a narrower one for three. */
function clampedText(
  text: string,
  lines: DataTableRowLines,
  widths: [string, string],
  muted = false,
) {
  return (
    <DataTableCellText
      className={cn(lines === 3 ? widths[1] : widths[0], muted && "text-muted-foreground")}
    >
      {text}
    </DataTableCellText>
  );
}

/** Badges on one line in a two-line row, and wrapping onto a second line in a three-line row. */
function badges(items: readonly string[], lines: DataTableRowLines) {
  return (
    <span className={cn("flex gap-1", lines === 3 ? "max-w-44 flex-wrap" : "flex-nowrap")}>
      {items.map((item) => (
        <Badge key={item} variant="secondary" className="whitespace-nowrap">
          {item}
        </Badge>
      ))}
    </span>
  );
}

function columnsFor(view: ViewId, actions: ListActions, lines: DataTableRowLines) {
  const locked = (row: Patient) => actions.isIncoming(row);
  // An incoming patient's controls are disabled, described by the reason.
  const lockedProps = (row: Patient) =>
    locked(row) ? { disabled: true, "aria-describedby": INCOMING_REASON_ID } : {};
  const bed = helper.accessor((patient) => bedLabel(patient), {
    id: "bed",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Bed" />,
    meta: { label: "Bed", width: BED_WIDTH },
    sortFn: "alphanumeric",
    cell: ({ getValue }) => <span className="whitespace-nowrap">{getValue()}</span>,
  });
  // The patient sorts by last name, and the search matches the name and the URN.
  const patient = helper.accessor(
    (row) => `${row.lastName} ${row.firstName} ${row.urn ?? ""} ${row.expected?.description ?? ""}`,
    {
      id: "patient",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Patient" />,
      meta: { label: "Patient", width: PATIENT_WIDTH.team[lines] },
      filterFn: "includesString",
      cell: ({ row }) => (
        <PatientIdentity
          patient={row.original}
          href={actions.hrefFor(row.original)}
          others={actions.others}
          lines={lines}
        />
      ),
    },
  );
  const problem = helper.accessor("workingProblem", {
    header: "Working problem",
    meta: { label: "Working problem" },
    enableSorting: false,
    cell: ({ row }) => (
      <UntilAccepted isLocked={locked(row.original)}>
        <DataTableEditableCell
          label={`Working problem for ${name(row.original)}`}
          value={row.original.workingProblem}
          placeholder="Not set"
          readOnly={!isEditable(row.original)}
          className={lines === 3 ? "w-40" : "w-52"}
          {...lockedProps(row.original)}
          onValueChange={(value) => {
            actions.setWorkingProblem(row.original, value);
          }}
        />
      </UntilAccepted>
    ),
  });
  const day = helper.accessor(
    (row) => (row.admittedAt ? daysSince(row.admittedAt) + 1 : undefined),
    {
      id: "day",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Day" />,
      meta: { label: "Day", align: "end" },
      sortUndefined: "last",
      cell: ({ getValue }) => getValue() ?? "",
    },
  );
  const edd = helper.accessor((row) => row.expectedDischarge ?? undefined, {
    id: "edd",
    header: ({ column }) => <DataTableColumnHeader column={column} title="EDD" />,
    meta: { label: "Expected discharge" },
    sortUndefined: "last",
    cell: ({ row }) => (
      <UntilAccepted isLocked={locked(row.original)}>
        <DataTableEditableCell
          label={`Expected discharge for ${name(row.original)}`}
          value={row.original.expectedDischarge ?? null}
          readOnly={!isEditable(row.original)}
          {...lockedProps(row.original)}
          onValueChange={(value) => {
            actions.setExpectedDischarge(row.original, value);
          }}
          editor={({ value, onValueChange }) => (
            <DischargeCalendar value={value} onValueChange={onValueChange} />
          )}
        >
          <span className="whitespace-nowrap">
            {formatDischarge(row.original.expectedDischarge)}
          </span>
        </DataTableEditableCell>
      </UntilAccepted>
    ),
  });
  const acuity = helper.accessor((row) => ACUITY_ORDER[row.acuity?.level ?? ""] ?? 0, {
    id: "acuity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Acuity" />,
    meta: { label: "Acuity" },
    sortDescFirst: true,
    cell: ({ row }) =>
      row.original.acuity ? (
        <Badge variant="outline" className="whitespace-nowrap">
          {acuityLabel(row.original.acuity.level)}
        </Badge>
      ) : null,
  });
  const flags = helper.accessor((row) => row.flags.join(", "), {
    id: "flags",
    header: "Flags",
    meta: { label: "Flags" },
    enableSorting: false,
    cell: ({ row }) => badges(row.original.flags, lines),
  });
  const comment = lastCommentColumn(actions, lines);
  const rowActions = actionsColumn(actions);

  if (view === "jobs") {
    return helper.columns([
      bed,
      patient,
      helper.accessor((row) => nextJob(actions.openJobs(row))?.text ?? "", {
        id: "next",
        header: "Next job",
        meta: { label: "Next job" },
        enableSorting: false,
        cell: ({ getValue }) =>
          getValue() === "" ? (
            <span className="text-muted-foreground">No open jobs</span>
          ) : (
            clampedText(getValue(), lines, ["w-60", "w-44"])
          ),
      }),
      helper.accessor(
        (row) => {
          const due = nextJob(actions.openJobs(row))?.due;
          return due ? Date.parse(due) : undefined;
        },
        {
          id: "due",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Due" />,
          meta: { label: "Due" },
          sortUndefined: "last",
          cell: ({ row }) => {
            const due = nextJob(actions.openJobs(row.original))?.due;
            return <span className="whitespace-nowrap">{due ? formatTime(due) : "No time"}</span>;
          },
        },
      ),
      helper.accessor((row) => nextJob(actions.openJobs(row))?.assignee ?? "", {
        id: "assignee",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Assigned to" />,
        meta: { label: "Assigned to" },
        cell: ({ row, getValue }) => (
          <span className="whitespace-nowrap">
            {getValue() === row.original.team ? "The team" : getValue()}
          </span>
        ),
      }),
      helper.accessor((row) => actions.openJobs(row).length, {
        id: "open-jobs",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Open" />,
        meta: { label: "Open jobs", align: "end" },
      }),
      helper.display({
        id: "done",
        header: () => <span className="sr-only">Done</span>,
        meta: { label: "Done", align: "end" },
        cell: ({ row }) => {
          const job = nextJob(actions.openJobs(row.original));
          if (!job) return null;
          return (
            <UntilAccepted isLocked={locked(row.original)}>
              <Button
                variant="outline"
                size="sm"
                aria-label={`Done: ${job.text}, for ${name(row.original)}`}
                {...lockedProps(row.original)}
                onClick={() => {
                  actions.completeJob(row.original.id, job.id);
                }}
              >
                Done
              </Button>
            </UntilAccepted>
          );
        },
      }),
      comment,
      rowActions,
    ]);
  }

  if (view === "handover") {
    return helper.columns([
      bed,
      patient,
      helper.accessor((row) => (actions.isImportant(row) ? 1 : 0), {
        id: "important",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Important" />,
        meta: { label: "Important overnight" },
        sortDescFirst: true,
        cell: ({ row }) => (
          <UntilAccepted isLocked={locked(row.original)}>
            <Switch
              aria-label={`Important overnight: ${name(row.original)}`}
              checked={actions.isImportant(row.original)}
              {...lockedProps(row.original)}
              onCheckedChange={(checked) => {
                actions.setImportant(row.original.id, checked);
              }}
            />
          </UntilAccepted>
        ),
      }),
      helper.accessor((row) => row.overnight?.reason ?? "", {
        id: "reason",
        header: "Reason",
        meta: { label: "Reason" },
        enableSorting: false,
        cell: ({ getValue }) => clampedText(getValue(), lines, ["w-48", "w-36"]),
      }),
      helper.accessor((row) => row.overnight?.synopsis ?? "Not written yet", {
        id: "synopsis",
        header: "Synopsis",
        meta: { label: "Synopsis" },
        enableSorting: false,
        cell: ({ row, getValue }) =>
          clampedText(getValue(), lines, ["w-64", "w-52"], !row.original.overnight),
      }),
      helper.accessor((row) => row.overnight?.todo?.length ?? 0, {
        id: "todo",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Overnight jobs" />,
        meta: { label: "Overnight jobs", align: "end" },
      }),
      acuity,
      comment,
      rowActions,
    ]);
  }

  if (view === "review") {
    return helper.columns([
      bed,
      patient,
      helper.accessor((row) => row.latestResults?.[0]?.at ?? "", {
        id: "results",
        header: "Results",
        meta: { label: "Results" },
        enableSorting: false,
        cell: ({ row }) => <ResultsCell results={row.original.latestResults} lines={lines} />,
      }),
      helper.accessor((row) => row.latestObservations?.at ?? "", {
        id: "vitals",
        header: "Vitals",
        meta: { label: "Vitals" },
        enableSorting: false,
        cell: ({ row }) => (
          <VitalsCell observations={row.original.latestObservations} lines={lines} />
        ),
      }),
      helper.accessor((row) => row.latestNote?.at ?? "", {
        id: "note",
        header: "Latest note",
        meta: { label: "Latest note" },
        enableSorting: false,
        cell: ({ row }) => <NoteCell note={row.original.latestNote} />,
      }),
      helper.display({
        id: "allied-health",
        header: "Allied health",
        meta: { label: "Allied health" },
        cell: ({ row }) => (
          <AlliedHealthCell
            alliedHealth={row.original.alliedHealth}
            patientName={name(row.original)}
          />
        ),
      }),
      helper.accessor((row) => (row.dischargeBarriers ?? []).join(", "), {
        id: "barriers",
        header: "Discharge barriers",
        meta: { label: "Discharge barriers" },
        enableSorting: false,
        cell: ({ row }) => <BarriersCell barriers={row.original.dischargeBarriers} lines={lines} />,
      }),
      edd,
      comment,
      helper.display({
        id: "reviewed",
        header: "Reviewed",
        meta: { label: "Reviewed today" },
        cell: ({ row }) => (
          <UntilAccepted isLocked={locked(row.original)}>
            <Checkbox
              aria-label={`Reviewed today: ${name(row.original)}`}
              checked={actions.isReviewed(row.original.id)}
              {...lockedProps(row.original)}
              onCheckedChange={(checked) => {
                actions.setReviewed(row.original.id, checked);
              }}
            />
          </UntilAccepted>
        ),
      }),
      rowActions,
    ]);
  }

  return helper.columns([
    bed,
    patient,
    problem,
    day,
    edd,
    acuity,
    flags,
    helper.accessor((row) => actions.openJobs(row).length, {
      id: "jobs",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Jobs" />,
      meta: { label: "Open jobs", align: "end" },
      cell: ({ getValue }) => (getValue() > 0 ? `${String(getValue())} open` : "None"),
    }),
    comment,
    helper.display({
      id: "seen",
      header: "Seen",
      meta: { label: "Seen today" },
      cell: ({ row }) => (
        <UntilAccepted isLocked={locked(row.original)}>
          <Checkbox
            aria-label={`Seen today: ${name(row.original)}`}
            checked={actions.isSeen(row.original)}
            {...lockedProps(row.original)}
            onCheckedChange={(checked) => {
              actions.setSeen(row.original.id, checked);
            }}
          />
        </UntilAccepted>
      ),
    }),
    rowActions,
  ]);
}

/**
 * A view's columns, the order it starts in, and which patients it shows. `lines` is how many lines
 * each row holds, which sets how wide the columns are and how much each cell shows.
 */
export function viewFor(view: ViewId, actions: ListActions, lines: DataTableRowLines = 2) {
  const sorting: Record<ViewId, SortingState> = {
    "ward-round": [{ id: "bed", desc: false }],
    jobs: [{ id: "due", desc: false }],
    handover: [
      { id: "important", desc: true },
      { id: "bed", desc: false },
    ],
    review: [{ id: "edd", desc: false }],
  };
  return {
    columns: columnsFor(view, actions, lines),
    sorting: sorting[view],
    // The jobs view lists the patients with something left to do, and anyone incoming.
    include: (patient: Patient) =>
      view !== "jobs" || actions.isIncoming(patient) || actions.openJobs(patient).length > 0,
  };
}

/** The admitting list's columns: referrals waiting for an owner to accept or decline them. */
export function admittingView(actions: ListActions, lines: DataTableRowLines) {
  const columns = helper.columns([
    helper.accessor(
      (row) =>
        `${row.lastName} ${row.firstName} ${row.urn ?? ""} ${row.expected?.description ?? ""}`,
      {
        id: "patient",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Patient" />,
        meta: { label: "Patient", width: PATIENT_WIDTH.admitting[lines] },
        filterFn: "includesString",
        cell: ({ row }) => (
          <PatientIdentity
            patient={row.original}
            href={actions.hrefFor(row.original)}
            others={actions.others}
            lines={lines}
          />
        ),
      },
    ),
    helper.accessor((row) => (row.referral ? Date.parse(row.referral.receivedAt) : undefined), {
      id: "received",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Received" />,
      meta: { label: "Received" },
      sortUndefined: "last",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.referral ? formatTime(row.original.referral.receivedAt) : ""}
        </span>
      ),
    }),
    helper.accessor((row) => row.referral?.source ?? "", {
      id: "source",
      header: ({ column }) => <DataTableColumnHeader column={column} title="From" />,
      meta: { label: "From" },
      cell: ({ row, getValue }) =>
        clampedText(row.original.referral?.system ? `${getValue()}, imported` : getValue(), lines, [
          "w-48",
          "w-40",
        ]),
    }),
    helper.accessor((row) => row.referral?.reason ?? row.workingProblem, {
      id: "reason",
      header: "Reason",
      meta: { label: "Reason" },
      enableSorting: false,
      cell: ({ getValue }) => clampedText(getValue(), lines, ["w-60", "w-44"]),
    }),
    helper.accessor((row) => row.referral?.urgency ?? "", {
      id: "urgency",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Urgency" />,
      meta: { label: "Urgency" },
      cell: ({ getValue }) => <span className="whitespace-nowrap">{getValue()}</span>,
    }),
    helper.accessor((row) => row.referral?.owner ?? "", {
      id: "owner",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
      meta: { label: "Owner" },
      cell: ({ getValue }) =>
        getValue() ? (
          <span className="whitespace-nowrap">{getValue()}</span>
        ) : (
          <Badge variant="warning" className="whitespace-nowrap">
            No owner
          </Badge>
        ),
    }),
    lastCommentColumn(actions, lines),
    actionsColumn(actions),
  ]);
  return { columns, sorting: [{ id: "received", desc: true }] satisfies SortingState };
}

/** One line under the patient on a phone, saying what the view is about. */
export function phoneSummary(view: ViewId | "admitting", patient: Patient, actions: ListActions) {
  const bed = bedLabel(patient);
  if (view === "admitting") {
    const referral = patient.referral;
    if (!referral) return patient.workingProblem;
    return `${formatTime(referral.receivedAt)} · ${referral.source} · ${referral.owner ?? "No owner"}`;
  }
  if (view === "jobs") {
    const job = nextJob(actions.openJobs(patient));
    return `${bed} · ${job ? `${job.text}${job.due ? `, ${formatTime(job.due)}` : ""}` : "No open jobs"}`;
  }
  if (view === "handover") {
    return `${bed} · ${actions.isImportant(patient) ? "Important · " : ""}${patient.overnight?.synopsis ?? "No synopsis yet"}`;
  }
  if (view === "review") {
    const barriers = patient.dischargeBarriers ?? [];
    return `${bed} · EDD ${formatDischarge(patient.expectedDischarge)} · ${barriers.length > 0 ? barriers.join(", ") : "No barriers"}`;
  }
  return `${bed} · ${patient.workingProblem} · EDD ${formatDischarge(patient.expectedDischarge)}`;
}

/** What a team's list can be grouped by. Each view offers the ones that make sense for it. */
export const GROUP_BY = [
  { value: "none", label: "No grouping" },
  { value: "edd", label: "Expected discharge" },
  { value: "acuity", label: "Acuity" },
  { value: "room", label: "Room" },
  { value: "seen", label: "Seen today" },
  { value: "assignee", label: "Assigned to" },
  { value: "important", label: "Important overnight" },
] as const;

/** One way of grouping the list. */
export type GroupById = (typeof GROUP_BY)[number]["value"];

const SHARED_GROUPINGS: readonly GroupById[] = ["none", "edd", "acuity", "room", "seen"];

/** The groupings a view offers, and the one it starts with, which the user can change. */
export const VIEW_GROUPINGS: Record<ViewId, { options: readonly GroupById[]; start: GroupById }> = {
  "ward-round": { options: SHARED_GROUPINGS, start: "none" },
  jobs: { options: [...SHARED_GROUPINGS, "assignee"], start: "assignee" },
  handover: { options: [...SHARED_GROUPINGS, "important"], start: "important" },
  review: { options: SHARED_GROUPINGS, start: "edd" },
};

/** Incoming patients: always first, in the info tone, and never collapsed out of sight. */
const INCOMING = {
  id: "incoming",
  label: "Incoming",
  tone: "info",
  collapsible: false,
  description: "· waiting for this team to accept",
} as const satisfies DataTableGroup;

/** The expected discharge as a group: a passed date is its own group. */
function dischargeGroup(patient: Patient): string {
  const days = dischargeDays(patient.expectedDischarge);
  if (days === undefined) return "Not set";
  if (days < 0) return "Passed";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return "Later";
}

function labelled(labels: readonly string[]): DataTableGroup[] {
  return labels.map((label) => ({ id: label, label }));
}

/** A room as a group, such as "Room 401", or "No bed". */
function roomGroup(patient: Patient): string {
  return patient.bed ? `Room ${patient.bed.room}` : "No bed";
}

/** The next job's assignee as a group: the team first, then each person. */
function assigneeGroup(patient: Patient, actions: ListActions): string {
  const assignee = nextJob(actions.openJobs(patient))?.assignee;
  if (!assignee) return "No open jobs";
  return assignee === patient.team ? "The team" : assignee;
}

/**
 * The groups for a grouping, in their order, and the group each patient is in. Incoming patients
 * are their own group, first, whatever the grouping. Without a grouping, the rest of the list is
 * one group under the list's name, so the incoming patients still stand apart.
 */
export function groupingFor(
  groupBy: GroupById,
  patients: readonly Patient[],
  actions: ListActions,
  listLabel: string,
): { groups: DataTableGroup[]; getGroupId: (patient: Patient) => string } {
  const by = (groups: DataTableGroup[], idOf: (patient: Patient) => string) => ({
    groups: [INCOMING, ...groups],
    getGroupId: (patient: Patient) => (actions.isIncoming(patient) ? INCOMING.id : idOf(patient)),
  });
  switch (groupBy) {
    case "none":
      return by([{ id: "list", label: listLabel, collapsible: false }], () => "list");
    case "edd":
      return by(labelled(["Passed", "Today", "Tomorrow", "Later", "Not set"]), dischargeGroup);
    case "acuity":
      return by(labelled(["High", "Medium", "Low", "Not set"]), (patient) =>
        patient.acuity ? acuityLabel(patient.acuity.level) : "Not set",
      );
    case "room": {
      const rooms = [...new Set(patients.map(roomGroup))].sort((a, b) =>
        a.localeCompare(b, "en-AU", { numeric: true }),
      );
      return by(labelled(rooms), roomGroup);
    }
    case "seen":
      return by(labelled(["To see", "Seen"]), (patient) =>
        actions.isSeen(patient) ? "Seen" : "To see",
      );
    case "assignee": {
      const people = [...new Set(patients.map((patient) => assigneeGroup(patient, actions)))]
        .filter((group) => group !== "The team" && group !== "No open jobs")
        .sort((a, b) => a.localeCompare(b, "en-AU"));
      return by(labelled(["The team", ...people, "No open jobs"]), (patient) =>
        assigneeGroup(patient, actions),
      );
    }
    case "important":
      return by(labelled(["Important", "Stable"]), (patient) =>
        actions.isImportant(patient) ? "Important" : "Stable",
      );
    default: {
      const never: never = groupBy;
      return never;
    }
  }
}

/** A group's count in words: "1 patient", "3 patients". */
export function patientCount(count: number): string {
  return count === 1 ? "1 patient" : `${String(count)} patients`;
}
