import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AppShell,
  AppShellContent,
  AppShellHeader,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ListDetail,
  ListDetailDetail,
  ListDetailList,
  ModeToggle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  toast,
  Toaster,
  TooltipProvider,
} from "@cadence-clinical/ui";
import {
  DataTable,
  dataTableFeatures,
  type DataTableRowLines,
} from "@cadence-clinical/ui/data-table";
import { useTable, type SortingState } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useId, useMemo, useRef, useState } from "react";

import { useRoute } from "../router";
import {
  formatDay,
  ward,
  wardNow,
  type DirectoryPatient,
  type Job,
  type Patient,
  type PatientComment,
} from "../ward";
import { AddPatient } from "./add-patient";
import { AppSidebar, USER, type ListGroup } from "./app-sidebar";
import { EDIT_WINDOW_MS, type CommentThreadActions } from "./comment-thread";
import { displayName, IdentityPhrase, PatientIdentity } from "./patient-identity";
import {
  activityFor,
  PatientPane,
  type ActivityFilter,
  type Change,
  type PanePosition,
  type PatientChanges,
  type SessionActivity,
} from "./patient-pane";
import { PatientScreen } from "./patient-screen";
import { RowActions } from "./row-actions";
import {
  admittingView,
  GROUP_BY,
  groupingFor,
  INCOMING_REASON,
  INCOMING_REASON_ID,
  lastComment,
  patientCount,
  phoneSummary,
  PINNED,
  VIEW_GROUPINGS,
  VIEWS,
  viewFor,
  type GroupById,
  type ListActions,
  type ViewId,
} from "./views";

const GROUPS: ListGroup[] = [
  {
    id: "team",
    label: "Team",
    icon: "team",
    lists: [
      { id: "admitting", label: "Admitting" },
      ...ward.teams.map((team) => ({ id: team.id, label: team.name })),
    ],
  },
  {
    id: "after-hours",
    label: "After hours",
    icon: "after-hours",
    lists: [{ id: "after-hours", label: ward.unit.name }],
  },
];

const LISTS = GROUPS.flatMap((group) => group.lists);

/** How long a removal can be undone from its toast. The toast waits while it has focus or a hover. */
const REMOVE_UNDO_MS = 10_000;

/** How many lines each row of the table holds. */
const ROW_LINES = [
  { value: "2", label: "2 lines" },
  { value: "3", label: "3 lines" },
];

/** The patient as the list shows them: the synthetic record with this session's changes on top. */
function withChanges(patient: Patient, changes: PatientChanges | undefined): Patient {
  if (!changes) return patient;
  return {
    ...patient,
    workingProblem: changes.workingProblem?.value ?? patient.workingProblem,
    expectedDischarge: changes.expectedDischarge
      ? changes.expectedDischarge.value
      : patient.expectedDischarge,
  };
}

const BASE = "/patient-list/a";

function onList(
  listId: string,
  accepted: Record<string, boolean>,
  patients: readonly Patient[],
): Patient[] {
  if (listId === "admitting") return patients.filter((p) => p.listState === "received");
  if (listId === "after-hours")
    return patients.filter((p) => p.team !== null && p.listState === "on-team");
  return patients.filter(
    (p) =>
      p.team === listId &&
      p.listState !== "received" &&
      p.listState !== "left-hospital" &&
      (p.listState !== "incoming" || accepted[p.id]),
  );
}

function incomingTo(
  listId: string,
  accepted: Record<string, boolean>,
  patients: readonly Patient[],
): Patient[] {
  return patients.filter((p) => p.team === listId && p.listState === "incoming" && !accepted[p.id]);
}

/** The patient names in view, in the order they are shown: the table's, or the phone's cards. */
function namesInView(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-patient]")).filter(
    (name) => name.offsetParent !== null,
  );
}

/** Moves focus to a patient's name, wherever the list shows it. Says whether it could. */
function focusPatient(id: string): boolean {
  const name = namesInView().find((element) => element.dataset.patient === id);
  name?.focus();
  return name !== undefined;
}

/** The patient shown after this one, or before it at the end: where focus goes when it leaves. */
function neighbourOf(id: string): string | undefined {
  const names = namesInView();
  const index = names.findIndex((element) => element.dataset.patient === id);
  if (index === -1) return undefined;
  return (names[index + 1] ?? names[index - 1])?.dataset.patient;
}

/** A row's actions button, which focus goes back to when its confirmation is cancelled. */
function actionsButton(id: string): HTMLElement | undefined {
  return Array.from(
    document.querySelectorAll<HTMLElement>(`[data-row-actions="${CSS.escape(id)}"]`),
  ).find((element) => element.offsetParent !== null);
}

/** A comment added in this session, by the signed-in user, at the prototype's clock. */
function newComment(text: string, count: number): PatientComment {
  return {
    id: `session-comment-${String(count)}`,
    author: USER.name,
    role: "Registrar, GMU A",
    at: wardNow(),
    text,
  };
}

/**
 * A removal from the list: being asked about, kept after all, or done, with the patient whose name
 * takes focus once the row has gone.
 */
type Removal =
  | { patient: Patient; state: "asking" | "kept" }
  | { patient: Patient; state: "removed"; focusId: string | undefined };

/** What this session has changed about a comment: its text, when it was edited, its revocation. */
type CommentChange = Partial<Pick<PatientComment, "text" | "editedAt" | "revoked">>;

/** A date as "Wed 21 Oct", kept on one line where it wraps in a sentence. */
function wholeDay(isoDate: string): string {
  return formatDay(isoDate).replaceAll(" ", "\u00a0");
}

/** A change, or a job done, as the list records it: who and when are added as it is recorded. */
type RecordedEvent =
  { kind: "change"; text: string } | { kind: "job"; job: Job; action: "completed" };

/** A filter menu: tick the values to show, and the button says how many are ticked. */
function FilterMenu({
  label,
  options,
  chosen,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  chosen: string[];
  onChange: (chosen: string[]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        {label}
        {chosen.length > 0 ? <Badge variant="secondary">{chosen.length}</Badge> : null}
        <ChevronDown aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{`Show ${label.toLowerCase()}`}</DropdownMenuLabel>
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={chosen.includes(option.value)}
              onCheckedChange={(checked) => {
                onChange(
                  checked
                    ? [...chosen, option.value]
                    : chosen.filter((value) => value !== option.value),
                );
              }}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The list's table, and the order its rows are shown in: sorted, filtered and grouped, as on screen.
 * It lives above the table so the pane can move through the same rows. Each table (a list, a view
 * and a grouping) remembers its own sorting and its collapsed groups for the session.
 */
function useListTable({
  tableKey,
  listLabel,
  view,
  groupBy,
  patients,
  search,
  actions,
  openId,
  rowLines,
}: {
  tableKey: string;
  listLabel: string;
  view: ViewId | "admitting";
  /** How a team's list is grouped. The admitting list is not grouped. */
  groupBy: GroupById | undefined;
  patients: Patient[];
  search: string;
  actions: ListActions;
  openId: string | null;
  rowLines: DataTableRowLines;
}) {
  // The columns are made again only when the view or what the list remembers changes, as
  // TanStack Table asks: a column made on every render would remount its cells, and an edited cell
  // would lose its place. A change to a working problem or a discharge date is in the data instead.
  const definition = useMemo(
    () =>
      view === "admitting" ? admittingView(actions, rowLines) : viewFor(view, actions, rowLines),
    [view, actions, rowLines],
  );
  const [sortingByTable, setSortingByTable] = useState<Record<string, SortingState>>({});
  // The table and the phone's list share which groups are collapsed.
  const [collapsedByTable, setCollapsedByTable] = useState<Record<string, string[]>>({});
  const sorting = sortingByTable[tableKey] ?? definition.sorting;
  const table = useTable({
    features: dataTableFeatures,
    data: patients,
    columns: definition.columns,
    getRowId: (row) => row.id,
    state: {
      columnPinning: view === "admitting" ? PINNED.admitting : PINNED.team,
      sorting,
      columnFilters: search ? [{ id: "patient", value: search }] : [],
      // The open patient is the chosen row: the table marks it.
      rowSelection: openId ? { [openId]: true } : {},
      // Every patient on one page: a list is never cut short without saying so.
      pagination: { pageIndex: 0, pageSize: 200 },
    },
    onSortingChange: (updater) => {
      setSortingByTable((current) => {
        const before = current[tableKey] ?? definition.sorting;
        return {
          ...current,
          [tableKey]: typeof updater === "function" ? updater(before) : updater,
        };
      });
    },
  });
  const rows = table.getRowModel().rows;
  // Without a grouping, the list is grouped only while someone is incoming, so they stand apart.
  const isUngrouped =
    groupBy === undefined ||
    (groupBy === "none" && !patients.some((patient) => actions.isIncoming(patient)));
  const grouping = isUngrouped ? undefined : groupingFor(groupBy, patients, actions, listLabel);
  const sections = grouping
    ? grouping.groups
        .map((group) => ({
          group,
          rows: rows.filter((row) => grouping.getGroupId(row.original) === group.id),
        }))
        .filter((section) => section.rows.length > 0)
    : [{ group: undefined, rows }];
  const collapsed = collapsedByTable[tableKey] ?? [];
  const setCollapsed = (groups: string[]) => {
    setCollapsedByTable((current) => ({ ...current, [tableKey]: groups }));
  };
  return {
    table,
    rows,
    grouping,
    sections,
    collapsed,
    setCollapsed,
    // Every row, in the order shown, collapsed groups included: what Previous and Next move through.
    order: sections.flatMap((section) =>
      section.rows.map((row) => ({ patient: row.original, groupId: section.group?.id })),
    ),
  };
}

type ListTable = ReturnType<typeof useListTable>;

/** The list as a sortable table on a desktop, and as rows of the same height on a phone. */
function PatientTable({
  listLabel,
  view,
  list,
  search,
  actions,
  rowLines,
}: {
  listLabel: string;
  view: ViewId | "admitting";
  list: ListTable;
  search: string;
  actions: ListActions;
  /** How many lines each row of the table holds. The phone's cards do not change with it. */
  rowLines: DataTableRowLines;
}) {
  const { table, rows, grouping, sections, collapsed, setCollapsed } = list;
  const emptyMessage = search ? `No patients match “${search}”.` : "No patients to show.";
  const card = (patient: Patient) => {
    const incoming = actions.isIncoming(patient);
    const comment = lastComment(patient, actions);
    return (
      <li key={patient.id}>
        <Item variant="outline" size="sm">
          <ItemContent>
            <PatientIdentity
              patient={patient}
              href={actions.hrefFor(patient)}
              others={actions.others}
            />
            <ItemDescription className="truncate">
              {incoming
                ? comment
                  ? `${comment.author}: ${comment.revoked ? "Revoked: " : ""}${comment.text}`
                  : "Waiting for this team to accept"
                : phoneSummary(view, patient, actions)}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <RowActions patient={patient} actions={actions} />
          </ItemActions>
        </Item>
      </li>
    );
  };
  return (
    <>
      {/* On a phone, each group is a heading over its cards, with the same count and collapse. */}
      <div className="flex flex-col gap-container md:hidden">
        {rows.length === 0 ? <p className="text-muted-foreground">{emptyMessage}</p> : null}
        {sections.map(({ group, rows: members }) => {
          if (!group) {
            return (
              <ul key="all" className="flex flex-col gap-1">
                {members.map((row) => card(row.original))}
              </ul>
            );
          }
          const isCollapsible = group.collapsible !== false;
          const heading = (
            <>
              <span>{group.label}</span>{" "}
              <span
                className={cn(
                  "font-normal",
                  group.tone === "info" ? "text-info-text" : "text-muted-foreground",
                )}
              >
                {patientCount(members.length)}
              </span>
            </>
          );
          return (
            <Collapsible
              key={group.id}
              open={!isCollapsible || !collapsed.includes(group.id)}
              onOpenChange={(open) => {
                setCollapsed(
                  open ? collapsed.filter((id) => id !== group.id) : [...collapsed, group.id],
                );
              }}
              className="flex flex-col gap-1"
            >
              <h2
                className={cn(
                  "flex flex-wrap items-center gap-x-1.5 font-medium",
                  group.tone === "info" && "text-info-text",
                )}
              >
                {isCollapsible ? (
                  <CollapsibleTrigger
                    render={<Button variant="ghost" size="sm" className="-mx-1.5 px-1.5" />}
                  >
                    {collapsed.includes(group.id) ? (
                      <ChevronRight aria-hidden data-icon="inline-start" />
                    ) : (
                      <ChevronDown aria-hidden data-icon="inline-start" />
                    )}
                    {heading}
                  </CollapsibleTrigger>
                ) : (
                  <span>{heading}</span>
                )}
                {group.description === undefined ? null : (
                  <span className="font-normal">{group.description}</span>
                )}
              </h2>
              <CollapsibleContent>
                <ul className="flex flex-col gap-1">{members.map((row) => card(row.original))}</ul>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
      <div className="hidden min-w-0 rounded-md border md:block">
        {grouping ? (
          <DataTable
            table={table}
            aria-label={listLabel}
            emptyMessage={emptyMessage}
            groups={grouping.groups}
            getGroupId={grouping.getGroupId}
            groupCount={patientCount}
            collapsedGroups={collapsed}
            onCollapsedGroupsChange={setCollapsed}
            rowLines={rowLines}
            onRowClick={(row) => {
              actions.open(row.id);
            }}
          />
        ) : (
          <DataTable
            table={table}
            aria-label={listLabel}
            emptyMessage={emptyMessage}
            rowLines={rowLines}
            onRowClick={(row) => {
              actions.open(row.id);
            }}
          />
        )}
      </div>
    </>
  );
}

/** Option A: every list is a table, with the patient's detail beside it. */
export function PatientListA() {
  const route = useRoute();
  // "#/patient-list/a/<list>", or "#/patient-list/a/<list>/patient/<id>" for the patient's screen.
  const [listPart = "", , screenPatientId] = route.slice(BASE.length + 1).split("/");
  const listId = listPart || "team-a";
  const list = LISTS.find((item) => item.id === listId) ?? LISTS[1];
  const listLabel = list?.label ?? "";
  const listHref = `#${BASE}/${listId}`;
  const listTitle = listId === "admitting" ? "Admitting list" : listLabel;
  const listKind =
    listId === "admitting" ? "admitting" : listId === "after-hours" ? "after-hours" : "team";
  const [view, setView] = useState<ViewId>("ward-round");
  const [openId, setOpenId] = useState<string | null>(null);
  // The pane's filter holds as it moves from patient to patient, and each patient keeps their own
  // unposted comment, so a draft never follows the pane to someone else.
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState("");
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [important, setImportant] = useState<Record<string, boolean>>({});
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  // Patients removed from a list in this session, list by list: a removal applies to that list only.
  const [removed, setRemoved] = useState<Record<string, Record<string, Change<true>>>>({});
  // The removal being asked about. It outlasts the question, so the dialog keeps its words while it
  // closes and knows where focus goes: back to the row's actions, or on to the next patient.
  const [removal, setRemoval] = useState<Removal | null>(null);
  const listHeading = useRef<HTMLHeadingElement>(null);
  const [search, setSearch] = useState("");
  const [acuities, setAcuities] = useState<string[]>([]);
  const [flags, setFlags] = useState<string[]>([]);
  const [changes, setChanges] = useState<Record<string, PatientChanges>>({});
  // Patients added from the hospital's directory, and comments added, in this session only.
  const [added, setAdded] = useState<Patient[]>([]);
  const [addedComments, setAddedComments] = useState<Record<string, PatientComment[]>>({});
  const [commentChanges, setCommentChanges] = useState<Record<string, CommentChange>>({});
  // Each list remembers its own row height for the session: two lines, or three.
  const [rowLinesByList, setRowLinesByList] = useState<Record<string, DataTableRowLines>>({});
  const rowLines = rowLinesByList[listId] ?? 2;
  const rowLinesLabelId = useId();
  const allPatients = useMemo(() => [...ward.patients, ...added], [added]);
  // Each view starts with its own grouping, and the user can change it for this session.
  const [groupBy, setGroupBy] = useState<Record<ViewId, GroupById>>(() => ({
    "ward-round": VIEW_GROUPINGS["ward-round"].start,
    jobs: VIEW_GROUPINGS.jobs.start,
    handover: VIEW_GROUPINGS.handover.start,
    review: VIEW_GROUPINGS.review.start,
  }));
  const groupByLabelId = useId();
  // What happened in this session, patient by patient, for each one's timeline.
  const [events, setEvents] = useState<Record<string, SessionActivity[]>>({});
  /** Adds a change, or a job done, to a patient's timeline: by the signed-in user, now. */
  const record = useCallback((patientId: string, event: RecordedEvent) => {
    const at = wardNow();
    setEvents((current) => {
      const before = current[patientId] ?? [];
      const entry: SessionActivity = {
        ...event,
        id: `session-${patientId}-${String(before.length + 1)}`,
        at,
        by: USER.name,
      };
      return { ...current, [patientId]: [...before, entry] };
    });
  }, []);
  // The setters are made once, so the columns that use them stay the same while edits are made.
  // Each is given the patient as the list shows them, which holds the value the change replaces.
  const setWorkingProblem = useCallback(
    (patient: Patient, value: string) => {
      const before = patient.workingProblem;
      if (value === before) return;
      setChanges((current) => ({
        ...current,
        [patient.id]: {
          ...current[patient.id],
          workingProblem: { value, by: USER.name, at: wardNow() },
        },
      }));
      record(patient.id, {
        kind: "change",
        text:
          value === ""
            ? `Cleared the working problem, which was “${before}”.`
            : before === ""
              ? `Set the working problem to “${value}”.`
              : `Changed the working problem to “${value}”, from “${before}”.`,
      });
    },
    [record],
  );
  const setExpectedDischarge = useCallback(
    (patient: Patient, value: string | null) => {
      const before = patient.expectedDischarge ?? null;
      if (value === before) return;
      setChanges((current) => ({
        ...current,
        [patient.id]: {
          ...current[patient.id],
          expectedDischarge: { value, by: USER.name, at: wardNow() },
        },
      }));
      record(patient.id, {
        kind: "change",
        text:
          value === null
            ? `Cleared the expected discharge, which was ${before ? wholeDay(before) : "not set"}.`
            : before
              ? `Changed the expected discharge to ${wholeDay(value)}, from ${wholeDay(before)}.`
              : `Set the expected discharge to ${wholeDay(value)}.`,
      });
    },
    [record],
  );

  const actions: ListActions = useMemo(
    () => ({
      open: setOpenId,
      hrefFor: (patient) => `#${BASE}/${listId}/patient/${patient.id}`,
      others: added,
      commentsFor: (patient) =>
        [...patient.comments, ...(addedComments[patient.id] ?? [])].map((comment) => ({
          ...comment,
          ...commentChanges[comment.id],
        })),
      isSeen: (patient) => seen[patient.id] ?? patient.seenToday,
      setSeen: (id, value) => {
        setSeen((current) => ({ ...current, [id]: value }));
        record(id, {
          kind: "change",
          text: value ? "Marked seen today." : "Marked not seen today.",
        });
      },
      isImportant: (patient) => important[patient.id] ?? patient.overnight?.important ?? false,
      setImportant: (id, value) => {
        setImportant((current) => ({ ...current, [id]: value }));
        record(id, {
          kind: "change",
          text: value ? "Marked important overnight." : "Marked not important overnight.",
        });
      },
      isReviewed: (id) => reviewed[id] ?? false,
      setReviewed: (id, value) => {
        setReviewed((current) => ({ ...current, [id]: value }));
        record(id, {
          kind: "change",
          text: value ? "Marked reviewed." : "Marked not reviewed.",
        });
      },
      openJobs: (patient) => patient.jobs.filter((job) => job.status === "open" && !done[job.id]),
      completeJob: (patientId, jobId) => {
        setDone((current) => ({ ...current, [jobId]: true }));
        const job = allPatients
          .find((patient) => patient.id === patientId)
          ?.jobs.find((item) => item.id === jobId);
        if (job) record(patientId, { kind: "job", job, action: "completed" });
      },
      setWorkingProblem,
      setExpectedDischarge,
      isIncoming: (patient) => patient.listState === "incoming" && !accepted[patient.id],
      accept: (id) => {
        setAccepted((current) => ({ ...current, [id]: true }));
        record(id, { kind: "change", text: `Accepted onto ${listTitle}.` });
        // The row moves into its group, so focus follows the patient to their new place: their
        // name, in whichever list is showing, the table or the phone's cards.
        requestAnimationFrame(() => {
          focusPatient(id);
        });
      },
      list: { kind: listKind, label: listTitle },
      requestRemove: (patient) => {
        setRemoval({ patient, state: "asking" });
      },
    }),
    [
      seen,
      important,
      reviewed,
      done,
      accepted,
      setWorkingProblem,
      setExpectedDischarge,
      record,
      allPatients,
      listId,
      listKind,
      listTitle,
      added,
      addedComments,
      commentChanges,
    ],
  );

  const removeComment = (patientId: string, commentId: string) => {
    setAddedComments((current) => ({
      ...current,
      [patientId]: (current[patientId] ?? []).filter((comment) => comment.id !== commentId),
    }));
  };

  // Ids are counted across the session, so a deleted comment's id is never given to another.
  const [commentCount, setCommentCount] = useState(0);

  /** The thread's actions for one patient. Only the author's own comments offer them. */
  const commentActionsFor = (patientId: string): CommentThreadActions => ({
    onAdd: (text) => {
      const comment = newComment(text, commentCount + 1);
      setCommentCount((count) => count + 1);
      setAddedComments((current) => ({
        ...current,
        [patientId]: [...(current[patientId] ?? []), comment],
      }));
      // Undo is offered for as long as the comment can be deleted, and the toast goes with it.
      const id = toast.add({
        title: "Comment posted",
        description: "You can undo, edit or delete it for 10 seconds.",
        type: "success",
        timeout: EDIT_WINDOW_MS,
        actionProps: {
          children: "Undo",
          onClick: () => {
            removeComment(patientId, comment.id);
            toast.close(id);
            toast.add({ title: "Comment removed" });
          },
        },
      });
      setTimeout(() => {
        toast.close(id);
      }, EDIT_WINDOW_MS);
    },
    onEdit: (commentId, text) => {
      setCommentChanges((current) => ({
        ...current,
        [commentId]: { ...current[commentId], text, editedAt: wardNow() },
      }));
    },
    onDelete: (commentId) => {
      removeComment(patientId, commentId);
      toast.add({ title: "Comment deleted" });
    },
    onRevoke: (commentId) => {
      const patient = allPatients.find((p) => p.id === patientId);
      const comment = patient
        ? actions.commentsFor(patient).find((item) => item.id === commentId)
        : undefined;
      setCommentChanges((current) => ({
        ...current,
        [commentId]: { ...current[commentId], revoked: { by: USER.name, at: wardNow() } },
      }));
      record(patientId, {
        kind: "change",
        text: comment ? `Revoked their comment: “${comment.text}”` : "Revoked their comment.",
      });
    },
  });

  /**
   * Removes the patient being asked about from this list only, and offers Undo in a toast. Focus
   * moves to the next patient's name, or the list's heading if none is left.
   */
  const confirmRemove = () => {
    if (!removal) return;
    const patient = removal.patient;
    const fromList = listId;
    const fromLabel = listTitle;
    setRemoval({ patient, state: "removed", focusId: neighbourOf(patient.id) });
    setRemoved((current) => ({
      ...current,
      [fromList]: {
        ...current[fromList],
        [patient.id]: { value: true, by: USER.name, at: wardNow() },
      },
    }));
    if (openId === patient.id) setOpenId(null);
    record(patient.id, { kind: "change", text: `Removed from ${fromLabel}.` });
    const putBack = () => {
      record(patient.id, { kind: "change", text: `Put back on ${fromLabel}.` });
      setRemoved((current) => ({
        ...current,
        [fromList]: Object.fromEntries(
          Object.entries(current[fromList] ?? {}).filter(([id]) => id !== patient.id),
        ),
      }));
    };
    const id = toast.add({
      title: `${displayName(patient)} removed from ${fromLabel}`,
      description: "From this list only. Nothing else about them has changed.",
      timeout: REMOVE_UNDO_MS,
      actionProps: {
        children: "Undo",
        onClick: () => {
          putBack();
          toast.close(id);
          toast.add({ title: `${displayName(patient)} is back on ${fromLabel}` });
          requestAnimationFrame(() => {
            focusPatient(patient.id);
          });
        },
      },
    });
  };

  // A registered patient from the directory joins this list as a new row. On the admitting list
  // they arrive as a referral, entered by the signed-in user, with the reason they gave.
  const addPatient = (person: DirectoryPatient, reason: string) => {
    const isReferral = listId === "admitting";
    const patient: Patient = {
      id: `added-${person.id}`,
      urn: person.urn,
      firstName: person.firstName,
      lastName: person.lastName,
      age: person.age,
      gender: person.gender,
      birthDate: person.birthDate,
      bed: null,
      admittedAt: null,
      team: isReferral ? null : listId,
      listState: isReferral ? "received" : "on-team",
      workingProblem: isReferral ? reason : "",
      conditions: [],
      medicines: [],
      flags: [],
      jobs: [],
      comments: [],
      seenToday: false,
      similarTo: person.similarTo,
      expectedDischarge: isReferral ? undefined : null,
      ...(isReferral
        ? {
            referral: {
              via: "entered",
              source: `Entered by ${USER.name}`,
              referrer: USER.name,
              urgency: "Not recorded",
              reason: reason || "Not recorded yet",
              summary: "",
              plan: null,
              owner: USER.name,
              receivedAt: ward.now,
            },
          }
        : {}),
    };
    setAdded((current) => [...current, patient]);
    toast.add({
      title: `${person.firstName} ${person.lastName} added to ${isReferral ? "the admitting list" : listLabel}`,
      description: isReferral ? "As a referral you own." : "With no bed yet.",
      type: "success",
    });
  };

  const admitting = listId === "admitting";
  const onThisList = onList(listId, accepted, allPatients)
    .filter((patient) => removed[listId]?.[patient.id] === undefined)
    .map((patient) => withChanges(patient, changes[patient.id]));
  const tableView: ViewId | "admitting" = admitting ? "admitting" : view;
  // Incoming patients are in the list itself, in their own group, and the filters leave them in:
  // a patient waiting for the team is never filtered out of sight.
  const incoming = admitting
    ? []
    : incomingTo(listId, accepted, allPatients).map((patient) =>
        withChanges(patient, changes[patient.id]),
      );
  const shown = [
    ...incoming,
    ...onThisList.filter(
      (patient) =>
        (admitting || viewFor(view, actions).include(patient)) &&
        (acuities.length === 0 || acuities.includes(patient.acuity?.level ?? "none")) &&
        (flags.length === 0 || patient.flags.some((flag) => flags.includes(flag))),
    ),
  ];
  const groupOptions = admitting
    ? []
    : GROUP_BY.filter((option) => VIEW_GROUPINGS[view].options.includes(option.value));
  const found = allPatients.find((p) => p.id === openId);
  const open = found ? withChanges(found, changes[found.id]) : undefined;
  const onScreen = allPatients.find((p) => p.id === screenPatientId);
  const flagOptions = [...new Set(onThisList.flatMap((patient) => patient.flags))]
    .sort()
    .map((flag) => ({ value: flag, label: flag }));
  const filtered = search !== "" || acuities.length > 0 || flags.length > 0;
  const groupedBy = admitting ? undefined : groupBy[view];
  const tableKey = `${listId}-${tableView}-${groupedBy ?? ""}`;
  const listTable = useListTable({
    tableKey,
    listLabel,
    view: tableView,
    groupBy: groupedBy,
    patients: shown,
    search,
    actions,
    openId,
    rowLines,
  });

  // Previous and next move through the rows as shown: sorted, filtered and grouped.
  const order = listTable.order;
  const openIndex = order.findIndex((entry) => entry.patient.id === openId);
  const position: PanePosition = {
    index: openIndex === -1 ? undefined : openIndex + 1,
    count: order.length,
    // Opened from outside the rows shown, such as before a search hid them, the ends lead back in.
    previous: (openIndex === -1 ? order.at(-1) : order[openIndex - 1])?.patient,
    next: (openIndex === -1 ? order[0] : order[openIndex + 1])?.patient,
  };
  /**
   * Opens the summary of another patient in the rows, without closing the pane: the row's bar
   * follows, the row is scrolled into view, a collapsed group holding it opens, and a screen reader
   * hears who is open now.
   */
  const moveTo = (id: string) => {
    const index = order.findIndex((entry) => entry.patient.id === id);
    const entry = order[index];
    if (!entry) return;
    if (entry.groupId !== undefined && listTable.collapsed.includes(entry.groupId)) {
      listTable.setCollapsed(listTable.collapsed.filter((group) => group !== entry.groupId));
    }
    setOpenId(id);
    setAnnouncement(
      `${displayName(entry.patient)}, ${String(index + 1)} of ${String(order.length)}`,
    );
    requestAnimationFrame(() => {
      const name = namesInView().find((element) => element.dataset.patient === id);
      (name?.closest("td") ?? name)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  };
  /** Closes the summary, and focus goes to the patient's name in the list. */
  const closePane = () => {
    const id = openId;
    setOpenId(null);
    if (id === null) return;
    requestAnimationFrame(() => {
      focusPatient(id);
    });
  };

  return (
    <Toaster>
      <TooltipProvider>
        {/* Why an incoming patient's controls are disabled: each one is described by it. */}
        <p id={INCOMING_REASON_ID} hidden>
          {INCOMING_REASON}
        </p>
        {/* Says who the pane shows after Previous or Next, as the pane changes under the button. */}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
        <AppShell variant="inset">
          <AppSidebar
            groups={GROUPS}
            current={list?.id ?? ""}
            hrefFor={(id) => `#${BASE}/${id}`}
            onChoose={() => {
              setOpenId(null);
            }}
          />
          <AppShellContent>
            <AppShellHeader>
              <Breadcrumb>
                <BreadcrumbList>
                  {/* There's no page of all lists yet, so "Lists" names the group without linking. */}
                  <BreadcrumbItem className="hidden md:block">Lists</BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  {screenPatientId === undefined ? (
                    <BreadcrumbItem>
                      <BreadcrumbPage>{admitting ? "Admitting list" : listLabel}</BreadcrumbPage>
                    </BreadcrumbItem>
                  ) : (
                    <>
                      <BreadcrumbItem>
                        <BreadcrumbLink href={listHref}>
                          {admitting ? "Admitting list" : listLabel}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>
                          {onScreen ? displayName(onScreen) : "Patient"}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
              <div className="ml-auto flex items-center gap-control-gap">
                <span className="hidden text-control text-muted-foreground sm:inline">
                  Option A · synthetic data
                </span>
                <ModeToggle variant="ghost" />
              </div>
            </AppShellHeader>
            {screenPatientId !== undefined ? (
              <PatientScreen
                patient={onScreen ? withChanges(onScreen, changes[onScreen.id]) : undefined}
                listLabel={admitting ? "Admitting list" : listLabel}
                listHref={listHref}
                others={added}
              />
            ) : (
              /* List and detail gives the list a narrow pane and always shows the detail. Option A's
              list is a table, so it takes the whole width until a patient is open, and then the
              detail is the narrower pane: recorded in gaps.md. */
              <ListDetail
                className={
                  open
                    ? "md:grid-cols-[minmax(0,1fr)_clamp(20rem,30vw,26rem)]"
                    : "md:grid-cols-[minmax(0,1fr)_0]"
                }
                open={open !== undefined}
                onBack={closePane}
              >
                <ListDetailList aria-label={listLabel}>
                  <div className="flex flex-col gap-container p-container text-body">
                    <div className="flex flex-wrap items-baseline gap-x-container gap-y-1">
                      {/* Focus comes here when the last patient in view is removed. */}
                      <h1
                        ref={listHeading}
                        tabIndex={-1}
                        className="text-title font-medium outline-none"
                      >
                        {listTitle}
                      </h1>
                      <span className="text-muted-foreground">
                        {`${String(onThisList.length)} ${admitting ? "referrals" : "patients"}`}
                      </span>
                    </div>
                    {admitting ? null : (
                      <Tabs
                        value={view}
                        onValueChange={(value: ViewId) => {
                          setView(value);
                        }}
                      >
                        <TabsList aria-label="View">
                          {VIEWS.map((item) => (
                            <TabsTrigger key={item.id} value={item.id}>
                              {item.label}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    )}
                    <div className="flex flex-wrap items-center gap-control-gap">
                      <Input
                        type="search"
                        aria-label="Search by name or URN"
                        placeholder="Search name or URN"
                        className="w-full sm:w-64"
                        value={search}
                        onChange={(event) => {
                          setSearch(event.target.value);
                        }}
                      />
                      {admitting ? null : (
                        <>
                          <FilterMenu
                            label="Acuity"
                            options={[
                              { value: "high", label: "High" },
                              { value: "medium", label: "Medium" },
                              { value: "low", label: "Low" },
                              { value: "none", label: "Not set" },
                            ]}
                            chosen={acuities}
                            onChange={setAcuities}
                          />
                          <FilterMenu
                            label="Flags"
                            options={flagOptions}
                            chosen={flags}
                            onChange={setFlags}
                          />
                        </>
                      )}
                      {admitting ? null : (
                        <div className="flex items-center gap-control-gap">
                          <span id={groupByLabelId} className="text-muted-foreground">
                            Group by
                          </span>
                          <Select
                            items={groupOptions}
                            value={groupBy[view]}
                            onValueChange={(value: GroupById | null) => {
                              if (value) setGroupBy((current) => ({ ...current, [view]: value }));
                            }}
                          >
                            <SelectTrigger aria-labelledby={groupByLabelId} className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {groupOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {/* Rows of two or three lines change the table only: a phone's cards have
                      the width already, so the control is not shown there. */}
                      <div className="hidden items-center gap-control-gap md:flex">
                        <span id={rowLinesLabelId} className="text-muted-foreground">
                          Rows
                        </span>
                        <Select
                          items={ROW_LINES}
                          value={String(rowLines)}
                          onValueChange={(value: string | null) => {
                            const lines = value === "3" ? 3 : 2;
                            setRowLinesByList((current) => ({ ...current, [listId]: lines }));
                          }}
                        >
                          <SelectTrigger aria-labelledby={rowLinesLabelId} className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROW_LINES.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {filtered ? (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSearch("");
                            setAcuities([]);
                            setFlags([]);
                          }}
                        >
                          Clear filters
                        </Button>
                      ) : null}
                      <div className="sm:ml-auto">
                        <AddPatient
                          listLabel={listLabel}
                          isAdmitting={admitting}
                          excluded={
                            new Set(added.map((patient) => patient.id.replace(/^added-/, "")))
                          }
                          others={added}
                          onAdd={addPatient}
                        />
                      </div>
                    </div>
                    {onThisList.length === 0 && incoming.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyTitle>No patients on this list</EmptyTitle>
                          <EmptyDescription>
                            {admitting
                              ? "New referrals appear here when they're entered or imported."
                              : "Patients join a team's list when the team accepts them."}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <PatientTable
                        key={tableKey}
                        listLabel={listLabel}
                        view={tableView}
                        list={listTable}
                        search={search}
                        actions={actions}
                        rowLines={rowLines}
                      />
                    )}
                  </div>
                </ListDetailList>
                <ListDetailDetail
                  aria-label={open ? `Summary of ${displayName(open)}` : "Patient"}
                  className={open ? undefined : "md:hidden"}
                >
                  {open ? (
                    <PatientPane
                      patient={open}
                      others={added}
                      listLabel={listTitle}
                      href={actions.hrefFor(open)}
                      position={position}
                      onMove={moveTo}
                      onClose={closePane}
                      changes={changes[open.id]}
                      openJobs={actions.openJobs(open)}
                      comments={actions.commentsFor(open)}
                      activity={activityFor(open, actions.commentsFor(open), events[open.id] ?? [])}
                      isIncoming={actions.isIncoming(open)}
                      onAccept={() => {
                        actions.accept(open.id);
                      }}
                      commentActions={commentActionsFor(open.id)}
                      filter={activityFilter}
                      onFilterChange={setActivityFilter}
                      draft={drafts[open.id] ?? ""}
                      onDraftChange={(draft) => {
                        setDrafts((current) => ({ ...current, [open.id]: draft }));
                      }}
                    />
                  ) : null}
                </ListDetailDetail>
              </ListDetail>
            )}
          </AppShellContent>
        </AppShell>
        <AlertDialog
          open={removal?.state === "asking"}
          onOpenChange={(isOpen) => {
            // Removing closes the question too, so only an answer that is still "asking" is kept.
            if (!isOpen) {
              setRemoval((current) =>
                current?.state === "asking" ? { ...current, state: "kept" } : current,
              );
            }
          }}
        >
          <AlertDialogContent
            // Cancelled, focus goes back to the row's actions. Removed, the row has gone, so focus
            // goes to the next patient's name, or the list's heading.
            finalFocus={() => {
              if (!removal) return true;
              if (removal.state !== "removed") return actionsButton(removal.patient.id) ?? true;
              if (removal.focusId !== undefined && focusPatient(removal.focusId)) return false;
              return listHeading.current ?? true;
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>
                {removal ? (
                  <>
                    {"Remove "}
                    <IdentityPhrase person={removal.patient} />
                    {` from ${listTitle}?`}
                  </>
                ) : null}
              </AlertDialogTitle>
              <AlertDialogDescription>
                They leave this list only. Their record, comments and jobs do not change, and other
                lists still show them. You can undo it for 10 seconds.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep on list</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmRemove}>
                Remove from list
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </Toaster>
  );
}
