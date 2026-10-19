import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TooltipProvider,
} from "@cadence-clinical/ui";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { formatDischarge, teamName, ward, type Patient } from "../ward";
import { PatientIdentity } from "./patient-identity";
import { acuityLabel, bedLabel } from "./views";

// A proposals page: four ways to group the list, drawn with static markup for the maintainer to
// choose between. The chosen one goes into the library before the prototype uses it.

interface Group {
  id: string;
  label: string;
  incoming?: boolean;
  patients: Patient[];
}

const team = ward.patients.filter((p) => p.team === "team-a" && p.listState === "on-team");
const incoming = ward.patients.filter((p) => p.team === "team-a" && p.listState === "incoming");
const TODAY = ward.now.slice(0, 10);

function eddGroup(patient: Patient): string {
  const edd = patient.expectedDischarge;
  if (!edd) return "Not set";
  const days = Math.round((Date.parse(edd) - Date.parse(TODAY)) / 86_400_000);
  if (days < 0) return "Passed";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return "Later";
}

const GROUPS: Group[] = [
  { id: "incoming", label: "Incoming", incoming: true, patients: incoming },
  ...["Passed", "Today", "Tomorrow", "Later", "Not set"]
    .map((label) => ({
      id: label,
      label,
      patients: team.filter((p) => eddGroup(p) === label),
    }))
    .filter((group) => group.patients.length > 0),
];

const GROUP_BY = [
  { value: "none", label: "No grouping" },
  { value: "edd", label: "Expected discharge" },
  { value: "acuity", label: "Acuity" },
  { value: "room", label: "Room" },
  { value: "seen", label: "Seen today" },
];

function Toolbar() {
  return (
    <div className="flex items-center gap-control-gap">
      <span className="text-muted-foreground">Group by</span>
      <Select items={GROUP_BY} defaultValue="edd">
        <SelectTrigger aria-label="Group by" className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GROUP_BY.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Head({ withGroup = false }: { withGroup?: boolean }) {
  return (
    <TableHeader>
      <TableRow>
        {withGroup ? <TableHead className="w-28">EDD</TableHead> : null}
        <TableHead className="w-20">Bed</TableHead>
        <TableHead className="w-64">Patient</TableHead>
        <TableHead>Working problem</TableHead>
        {withGroup ? null : <TableHead className="w-36">EDD</TableHead>}
        <TableHead className="w-24">Acuity</TableHead>
        <TableHead className="w-28 text-end">Jobs</TableHead>
      </TableRow>
    </TableHeader>
  );
}

/** One patient's cells. An incoming patient's row carries the handover and the Accept button. */
function Cells({ patient, incoming: isIncoming }: { patient: Patient; incoming?: boolean }) {
  return (
    <>
      <TableCell className="whitespace-nowrap">{bedLabel(patient)}</TableCell>
      <TableCell>
        <PatientIdentity patient={patient} href="#/patient-list/grouping" />
      </TableCell>
      <TableCell>
        {isIncoming && patient.transfer ? (
          <span className="flex flex-col">
            <span className="truncate">{patient.workingProblem}</span>
            <span className="truncate text-muted-foreground">
              {`From ${teamName(patient.transfer.from)}, sent by ${patient.transfer.sentBy}`}
            </span>
          </span>
        ) : (
          <span className="block max-w-72 truncate">{patient.workingProblem}</span>
        )}
      </TableCell>
    </>
  );
}

function Tail({ patient, incoming: isIncoming }: { patient: Patient; incoming?: boolean }) {
  return (
    <>
      <TableCell>
        {patient.acuity ? (
          <Badge variant="outline" className="whitespace-nowrap">
            {acuityLabel(patient.acuity.level)}
          </Badge>
        ) : null}
      </TableCell>
      <TableCell className="text-end">
        {isIncoming ? (
          <Button size="sm">Accept</Button>
        ) : (
          `${String(patient.jobs.filter((j) => j.status === "open").length)} open`
        )}
      </TableCell>
    </>
  );
}

function count(group: Group): string {
  return `${String(group.patients.length)} ${group.patients.length === 1 ? "patient" : "patients"}`;
}

/** A: a header row for each group inside one table, collapsible, with its count. */
function OptionA() {
  return (
    <Table>
      <Head />
      {GROUPS.map((group) => (
        <TableBody key={group.id}>
          <TableRow className="hover:bg-transparent">
            <TableHead
              scope="rowgroup"
              colSpan={6}
              className={
                group.incoming
                  ? "border-t border-info-border bg-info-subtle text-info-text"
                  : "border-t border-border bg-muted"
              }
            >
              <span className="flex items-center gap-2">
                {group.incoming ? (
                  <span className="size-4" />
                ) : group.label === "Later" ? (
                  <ChevronRight aria-hidden className="size-4" />
                ) : (
                  <ChevronDown aria-hidden className="size-4" />
                )}
                <span>{group.label}</span>
                <span className="font-normal text-muted-foreground">{count(group)}</span>
                {group.incoming ? (
                  <span className="font-normal">· waiting for this team to accept</span>
                ) : null}
              </span>
            </TableHead>
          </TableRow>
          {/* A collapsed group keeps its header and its count, so no patient is out of sight
              without the list saying so. */}
          {group.label === "Later"
            ? null
            : group.patients.map((patient) => (
                <TableRow
                  key={patient.id}
                  // The group's rows take a lighter shade of its header, so the header and its
                  // rows read as one group, not a banner above the table.
                  className={group.incoming ? "bg-info-subtle/40" : "bg-muted/30"}
                >
                  <Cells patient={patient} incoming={group.incoming} />
                  <TableCell className="whitespace-nowrap">
                    {group.incoming ? "" : formatDischarge(patient.expectedDischarge)}
                  </TableCell>
                  <Tail patient={patient} incoming={group.incoming} />
                </TableRow>
              ))}
        </TableBody>
      ))}
    </Table>
  );
}

/** B: a section for each group, each its own table under a heading, columns aligned. */
function OptionB() {
  return (
    <div className="flex flex-col gap-container">
      {GROUPS.map((group) => (
        <section
          key={group.id}
          className={
            group.incoming
              ? "flex flex-col gap-1 rounded-md border border-info-border bg-info-subtle p-container-sm"
              : "flex flex-col gap-1"
          }
        >
          <h3 className="flex items-center gap-2 font-medium">
            {group.incoming ? null : <ChevronDown aria-hidden className="size-4" />}
            {group.label}
            <Badge variant="secondary">{group.patients.length}</Badge>
          </h3>
          <div className="rounded-md border bg-background">
            <Table className="table-fixed">
              <Head />
              <TableBody>
                {group.patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <Cells patient={patient} incoming={group.incoming} />
                    <TableCell className="whitespace-nowrap">
                      {group.incoming ? "" : formatDischarge(patient.expectedDischarge)}
                    </TableCell>
                    <Tail patient={patient} incoming={group.incoming} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ))}
    </div>
  );
}

/** C: the group is a column on the left, named once beside its rows, as a spreadsheet does. */
function OptionC() {
  return (
    <Table>
      <Head withGroup />
      {GROUPS.map((group) => (
        <TableBody key={group.id} className="border-b-2 border-border">
          {group.patients.map((patient, index) => (
            <TableRow key={patient.id}>
              {index === 0 ? (
                <TableHead
                  scope="rowgroup"
                  rowSpan={group.patients.length}
                  className={
                    group.incoming
                      ? "border-r border-info-border bg-info-subtle align-top text-info-text"
                      : "border-r bg-muted align-top"
                  }
                >
                  <span className="flex flex-col">
                    <span>{group.label}</span>
                    <span className="font-normal text-muted-foreground">
                      {group.patients.length}
                    </span>
                  </span>
                </TableHead>
              ) : null}
              <Cells patient={patient} incoming={group.incoming} />
              <Tail patient={patient} incoming={group.incoming} />
            </TableRow>
          ))}
        </TableBody>
      ))}
    </Table>
  );
}

/** D: a thin divider row: the group's name and count on the rule, and a left edge on incoming. */
function OptionD() {
  return (
    <Table>
      <Head />
      {GROUPS.map((group) => (
        <TableBody key={group.id}>
          <TableRow className="hover:bg-transparent">
            <TableHead scope="rowgroup" colSpan={6} className="h-auto pt-3 pb-1">
              <span className="flex items-center gap-2 text-control-sm tracking-wide text-muted-foreground uppercase">
                {group.label}
                <span>·</span>
                <span>{group.patients.length}</span>
                <span className="h-px flex-1 bg-border" />
              </span>
            </TableHead>
          </TableRow>
          {group.patients.map((patient) => (
            <TableRow
              key={patient.id}
              className={group.incoming ? "border-l-4 border-l-info-border bg-info-subtle/50" : ""}
            >
              <Cells patient={patient} incoming={group.incoming} />
              <TableCell className="whitespace-nowrap">
                {group.incoming ? (
                  <Badge variant="info">Incoming</Badge>
                ) : (
                  formatDischarge(patient.expectedDischarge)
                )}
              </TableCell>
              <Tail patient={patient} incoming={group.incoming} />
            </TableRow>
          ))}
        </TableBody>
      ))}
    </Table>
  );
}

function Option({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-container bg-background p-container">
      <h2 className="text-title font-medium">{title}</h2>
      <Toolbar />
      <div className="rounded-md border">{children}</div>
    </section>
  );
}

/** Four ways to group option A's list, for the maintainer to choose between. */
export function GroupingOptions() {
  return (
    <TooltipProvider>
      <main className="mx-auto flex max-w-6xl flex-col gap-8 p-container text-body">
        <header className="flex flex-col gap-1">
          <a className="w-fit text-primary-text underline" href="#/">
            All prototypes
          </a>
          <h1 className="text-title font-medium">Patient list: ways to group</h1>
          <p className="text-muted-foreground">
            Chosen on 2026-10-19: A, header rows in one table. A passed EDD is its own group, each
            view starts with its own grouping, and flags aren&apos;t a grouping. The others are kept
            for reference.
          </p>
        </header>
        <Option id="a" title="A. Header rows in one table">
          <OptionA />
        </Option>
        <Option id="b" title="B. A section and table for each group">
          <OptionB />
        </Option>
        <Option id="c" title="C. A group column">
          <OptionC />
        </Option>
        <Option id="d" title="D. Divider rows">
          <OptionD />
        </Option>
      </main>
    </TooltipProvider>
  );
}
