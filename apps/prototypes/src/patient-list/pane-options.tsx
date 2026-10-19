import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Comment,
  CommentAuthor,
  CommentHeader,
  CommentList,
  CommentRole,
  CommentText,
  CommentTime,
  Status,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  TooltipProvider,
} from "@cadence-clinical/ui";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FlaskConical,
  HeartPulse,
  ListChecks,
  MessageSquare,
  NotebookPen,
  PencilLine,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  formatDischarge,
  formatShortTime,
  formatTime,
  teamName,
  ward,
  withUnit,
  type Patient,
} from "../ward";
import { DISCIPLINES, alliedHealthState } from "./cells";
import { PatientIdentity } from "./patient-identity";

// A proposals page: four ways to lay out option A's right pane, for the maintainer to choose
// between. Static, with Margaret Holloway's synthetic record. The chosen one goes into the
// library (or composes library parts) before the prototype uses it.

const team = ward.patients.filter((p) => p.team === "team-a" && p.listState === "on-team");
const found = ward.patients.find((p) => p.id === "patient-01");
if (!found) throw new Error("The synthetic ward has no patient-01.");
const patient: Patient = found;
const position = team.findIndex((p) => p.id === patient.id) + 1;
const openJobs = patient.jobs.filter((job) => job.status === "open");
const comments = [...patient.comments].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

function bed(p: Patient): string {
  return p.bed ? `${p.bed.room} ${p.bed.bed}` : "No bed";
}

/** The pane's top, the same in every option: who, where, and how to move or leave. */
function Header() {
  return (
    <div className="flex flex-col gap-2 border-b p-container">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" iconOnly aria-label="Previous patient">
          <ChevronLeft aria-hidden />
        </Button>
        <span className="text-muted-foreground">{`${String(position)} of ${String(team.length)}`}</span>
        <Button variant="ghost" size="sm" iconOnly aria-label="Next patient">
          <ChevronRight aria-hidden />
        </Button>
        <span className="ml-auto flex gap-1">
          <Button variant="ghost" size="sm">
            <ExternalLink aria-hidden />
            Open patient
          </Button>
          <Button variant="ghost" size="sm" iconOnly aria-label="Close">
            <X aria-hidden />
          </Button>
        </span>
      </div>
      <PatientIdentity patient={patient} href="#" />
      <p className="text-muted-foreground">
        {`${bed(patient)} · ${teamName(patient.team)} · EDD ${formatDischarge(patient.expectedDischarge)}`}
      </p>
    </div>
  );
}

function Composer() {
  return (
    <div className="flex flex-col gap-2">
      <Textarea aria-label="Add a comment" placeholder="Add a comment" rows={2} />
      <Button size="sm" className="self-end">
        Post
      </Button>
    </div>
  );
}

function Thread({ limit }: { limit?: number }) {
  return (
    <CommentList>
      {comments.slice(0, limit).map((comment) => (
        <Comment key={comment.id} render={<li />}>
          <CommentHeader>
            <CommentAuthor>{comment.author}</CommentAuthor>
            <CommentRole>{comment.role}</CommentRole>
            <CommentTime dateTime={comment.at}>{formatShortTime(comment.at)}</CommentTime>
          </CommentHeader>
          <CommentText>{comment.text}</CommentText>
        </Comment>
      ))}
    </CommentList>
  );
}

function AlliedHealth() {
  if (!patient.alliedHealth) return <p className="text-muted-foreground">Not recorded</p>;
  const alliedHealth = patient.alliedHealth;
  return (
    <ul className="flex flex-col gap-1">
      {DISCIPLINES.map((discipline) => {
        const state = alliedHealthState(alliedHealth[discipline.key]);
        const Icon = state.icon;
        return (
          <li key={discipline.key}>
            <Status tone={state.tone}>
              <Icon aria-hidden data-icon="inline-start" />
              {`${discipline.name}: ${state.meaning}`}
            </Status>
          </li>
        );
      })}
    </ul>
  );
}

function Plan() {
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-container gap-y-1">
      <dt className="text-muted-foreground">Problem</dt>
      <dd>{patient.workingProblem}</dd>
      <dt className="text-muted-foreground">EDD</dt>
      <dd>{formatDischarge(patient.expectedDischarge)}</dd>
      <dt className="text-muted-foreground">Barriers</dt>
      <dd className="flex flex-wrap gap-1">
        {(patient.dischargeBarriers ?? []).length === 0
          ? "None recorded"
          : patient.dischargeBarriers?.map((barrier) => (
              <Badge key={barrier} variant="secondary">
                {barrier}
              </Badge>
            ))}
      </dd>
    </dl>
  );
}

function Jobs() {
  return openJobs.length === 0 ? (
    <p className="text-muted-foreground">No open jobs</p>
  ) : (
    <ul className="flex flex-col gap-1">
      {openJobs.map((job) => (
        <li key={job.id} className="flex flex-col">
          <span>{job.text}</span>
          <span className="text-muted-foreground">
            {`${job.assignee === patient.team ? "The team" : job.assignee}${job.due ? `, due ${formatTime(job.due)}` : ""}`}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Note() {
  const note = patient.latestNote;
  if (!note) return <p className="text-muted-foreground">No notes</p>;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium">{note.type}</span>
      <span className="text-muted-foreground">{`${note.author}, ${formatTime(note.at)}`}</span>
      <p>{note.summary}</p>
    </div>
  );
}

function Vitals() {
  const observations = patient.latestObservations;
  if (!observations) return <p className="text-muted-foreground">No observations</p>;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground">{formatTime(observations.at)}</span>
      <ul className="flex flex-wrap gap-x-container gap-y-1">
        {observations.values.map((value) => (
          <li
            key={value.code}
          >{`${value.abbreviation} ${withUnit(value.value, value.unitDisplay)}`}</li>
        ))}
      </ul>
    </div>
  );
}

function Results() {
  const results = patient.latestResults ?? [];
  if (results.length === 0) return <p className="text-muted-foreground">No recent results</p>;
  return (
    <ul className="flex flex-col gap-1">
      {results.map((result) => (
        <li key={result.code}>
          {`${result.abbreviation} ${withUnit(result.value, result.unitDisplay)}`}
          <span className="text-muted-foreground">{` · ${formatShortTime(result.at)}`}</span>
        </li>
      ))}
    </ul>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <h3 className="font-medium">{children}</h3>;
}

/** A: tabs under the header, one subject a tab. */
function OptionA() {
  return (
    <>
      <Header />
      <Tabs defaultValue="overview" className="p-container">
        <TabsList aria-label="Patient details">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comments">{`Comments (${String(comments.length)})`}</TabsTrigger>
          <TabsTrigger value="jobs">{`Jobs (${String(openJobs.length)})`}</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="flex flex-col gap-container pt-container">
          <Plan />
          <Heading>Allied health</Heading>
          <AlliedHealth />
          <Heading>Latest note</Heading>
          <Note />
          <Heading>Vitals</Heading>
          <Vitals />
        </TabsContent>
      </Tabs>
    </>
  );
}

function Section({
  title,
  icon,
  count,
  children,
  open = true,
}: {
  title: string;
  icon: ReactNode;
  count?: number;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <Collapsible defaultOpen={open} className="group/section border-b">
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-container py-2 text-left font-medium">
        {icon}
        {title}
        {count === undefined ? null : <Badge variant="secondary">{count}</Badge>}
        <ChevronDown
          aria-hidden
          className="ml-auto size-4 transition-transform group-data-open/section:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-container pb-container">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** B: one scroll of collapsible sections, comments first, with the composer kept at the bottom. */
function OptionB() {
  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section
          title="Comments"
          icon={<MessageSquare aria-hidden className="size-4" />}
          count={comments.length}
        >
          <Thread limit={2} />
          {comments.length > 2 ? (
            <Button variant="link" size="sm" className="px-0">
              {`Show all ${String(comments.length)}`}
            </Button>
          ) : null}
        </Section>
        <Section title="Plan" icon={<PencilLine aria-hidden className="size-4" />}>
          <Plan />
        </Section>
        <Section title="Allied health" icon={<ListChecks aria-hidden className="size-4" />}>
          <AlliedHealth />
        </Section>
        <Section
          title="Jobs"
          icon={<ListChecks aria-hidden className="size-4" />}
          count={openJobs.length}
        >
          <Jobs />
        </Section>
        <Section
          title="Latest note"
          icon={<NotebookPen aria-hidden className="size-4" />}
          open={false}
        >
          <Note />
        </Section>
        <Section
          title="Vitals and results"
          icon={<HeartPulse aria-hidden className="size-4" />}
          open={false}
        >
          <Vitals />
        </Section>
      </div>
      <div className="border-t p-container">
        <Composer />
      </div>
    </div>
  );
}

interface Activity {
  id: string;
  at: string;
  kind: "Comment" | "Note" | "Result" | "Change" | "Job";
  who: string;
  text: string;
}

// Everything that happened to the patient, newest first: the pane as one timeline.
const activity: Activity[] = [
  ...patient.comments.map((c) => ({
    id: c.id,
    at: c.at,
    kind: "Comment" as const,
    who: c.author,
    text: c.text,
  })),
  ...(patient.latestNote
    ? [
        {
          id: "note",
          at: patient.latestNote.at,
          kind: "Note" as const,
          who: patient.latestNote.author,
          text: `${patient.latestNote.type}: ${patient.latestNote.summary}`,
        },
      ]
    : []),
  ...(patient.latestResults ?? []).slice(0, 1).map((r) => ({
    id: `result-${r.code}`,
    at: r.at,
    kind: "Result" as const,
    who: "Pathology",
    text: (patient.latestResults ?? [])
      .map((x) => `${x.abbreviation} ${withUnit(x.value, x.unitDisplay)}`)
      .join(" · "),
  })),
  {
    id: "change",
    at: ward.now,
    kind: "Change" as const,
    who: "Dr Tom Ellis",
    text: `Changed EDD to ${formatDischarge(patient.expectedDischarge)}`,
  },
].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

const KIND_ICON = {
  Comment: MessageSquare,
  Note: NotebookPen,
  Result: FlaskConical,
  Change: PencilLine,
  Job: ListChecks,
};

/** C: a summary at a glance, then one timeline of everything, filterable. */
function OptionC() {
  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex flex-col gap-container border-b p-container">
        <Plan />
        <div className="flex flex-wrap gap-x-container gap-y-1">
          {patient.alliedHealth
            ? DISCIPLINES.map((discipline) => {
                const state = alliedHealthState(patient.alliedHealth?.[discipline.key] ?? "");
                const Icon = state.icon;
                return (
                  <Status key={discipline.key} tone={state.tone}>
                    <Icon aria-hidden data-icon="inline-start" />
                    {`${discipline.short} ${state.word}`}
                  </Status>
                );
              })
            : null}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-container overflow-y-auto p-container">
        <ToggleGroup aria-label="Show" defaultValue={["all"]} size="sm">
          {["All", "Comments", "Notes", "Results", "Changes"].map((label) => (
            <ToggleGroupItem key={label} value={label.toLowerCase()}>
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ol className="flex flex-col gap-container">
          {activity.map((item) => {
            const Icon = KIND_ICON[item.kind];
            return (
              <li key={item.id} className="flex gap-2">
                <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-muted-foreground">
                    {`${item.kind} · ${item.who} · ${formatShortTime(item.at)}`}
                  </span>
                  <span>{item.text}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="border-t p-container">
        <Composer />
      </div>
    </div>
  );
}

function SmallCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** D: a stack of cards, one subject each, with comments in their own card. */
function OptionD() {
  return (
    <>
      <Header />
      <div className="flex flex-col gap-container bg-muted/40 p-container">
        <SmallCard title="Plan">
          <Plan />
        </SmallCard>
        <SmallCard title={`Comments (${String(comments.length)})`}>
          <div className="flex flex-col gap-container">
            <Thread limit={2} />
            <Composer />
          </div>
        </SmallCard>
        <div className="grid grid-cols-2 gap-container">
          <SmallCard title="Allied health">
            <AlliedHealth />
          </SmallCard>
          <SmallCard title={`Jobs (${String(openJobs.length)})`}>
            <Jobs />
          </SmallCard>
        </div>
        <SmallCard title="Latest note">
          <Note />
        </SmallCard>
        <div className="grid grid-cols-2 gap-container">
          <SmallCard title="Vitals">
            <Vitals />
          </SmallCard>
          <SmallCard title="Results">
            <Results />
          </SmallCard>
        </div>
      </div>
    </>
  );
}

function Option({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-2">
      <h2 className="text-title font-medium">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
      {/* The pane at the width it has beside the list: 26rem. */}
      <div className="h-[56rem] w-[26rem] overflow-hidden rounded-lg border bg-background shadow-sm">
        <div className="flex h-full flex-col overflow-y-auto">{children}</div>
      </div>
    </section>
  );
}

/** Four ways to lay out option A's right pane, for the maintainer to choose between. */
export function PaneOptions() {
  return (
    <TooltipProvider>
      <main className="flex flex-col gap-8 p-container text-body">
        <header className="flex flex-col gap-1">
          <a className="w-fit text-primary-text underline" href="#/">
            All prototypes
          </a>
          <h1 className="text-title font-medium">Patient list: ways to lay out the right pane</h1>
          <p className="max-w-3xl text-muted-foreground">
            The pane opens when a row is clicked. Every option shares the header: previous and next
            patient without closing the pane (for working down the list on a round), open the full
            patient, close, then the patient&apos;s identity, bed, team and EDD.
          </p>
          <p className="max-w-3xl">
            <Badge variant="success">Chosen</Badge>{" "}
            {"The maintainer chose C, the summary and timeline, on 19 October 2026. "}
            <a className="text-primary-text underline" href="#/patient-list/a">
              Option A
            </a>
            {" now opens it, with real state, in round 6. These four stay as they were proposed."}
          </p>
        </header>
        <div className="flex flex-wrap gap-8">
          <Option
            id="a"
            title="A. Tabs"
            description="One subject a tab: Overview, Comments, Jobs, Results. Short, but comments are a click away."
          >
            <OptionA />
          </Option>
          <Option
            id="b"
            title="B. Sections"
            description="One scroll of collapsible sections, comments first, with the comment box kept at the bottom."
          >
            <OptionB />
          </Option>
          <Option
            id="c"
            title="C. Summary and timeline (chosen)"
            description="The plan and allied health at a glance, then everything that happened as one filterable timeline."
          >
            <OptionC />
          </Option>
          <Option
            id="d"
            title="D. Cards"
            description="A card a subject, two side by side where they're short, comments with their own box."
          >
            <OptionD />
          </Option>
        </div>
      </main>
    </TooltipProvider>
  );
}
