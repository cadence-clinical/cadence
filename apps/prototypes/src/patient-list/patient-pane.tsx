import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  buttonVariants,
  CommentEdited,
  CommentProvenance,
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
  Empty,
  EmptyDescription,
  EmptyHeader,
  ListDetailBack,
  Status,
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIcon,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@cadence-clinical/ui";
import {
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  HeartPulse,
  ListChecks,
  MessageSquare,
  NotebookPen,
  PencilLine,
  SquareArrowOutUpRight,
  X,
  type LucideIcon,
} from "lucide-react";
import { useId, useRef, type ReactNode, type RefObject } from "react";

import {
  formatDischarge,
  formatShortTime,
  formatTime,
  teamName,
  withUnit,
  type Job,
  type LatestNote,
  type Observations,
  type Patient,
  type PatientComment,
  type Result,
} from "../ward";
import { alliedHealthState, DISCIPLINES } from "./cells";
import {
  CommentComposer,
  commentItemProps,
  CommentThreadProvider,
  ThreadComment,
  type CommentThreadActions,
} from "./comment-thread";
import { displayName, PatientIdentity, type Identified } from "./patient-identity";
import { acuityLabel, bedLabel } from "./views";

/** A change made in this session: the value, who made it and when, in the ward's time. */
export interface Change<T> {
  value: T;
  by: string;
  at: string;
}

/** What the signed-in user has changed about one patient while the prototype runs. */
export interface PatientChanges {
  workingProblem?: Change<string>;
  expectedDischarge?: Change<string | null>;
}

/**
 * One thing that happened to a patient, for the pane's timeline: a comment, a note, a set of
 * results or observations, a job made or done, or a change to their details or their place on a
 * list. Each says when, and who where the data says.
 */
export type Activity =
  | { kind: "comment"; id: string; at: string; comment: PatientComment }
  | { kind: "note"; id: string; at: string; note: LatestNote }
  | { kind: "results"; id: string; at: string; results: readonly Result[] }
  | { kind: "observations"; id: string; at: string; observations: Observations }
  | {
      kind: "job";
      id: string;
      at: string;
      by: string;
      job: Job;
      action: "created" | "completed";
    }
  | { kind: "change"; id: string; at: string; by: string; text: string };

/** What this session adds to a patient's timeline: changes made, and jobs done. */
export type SessionActivity = Extract<Activity, { kind: "job" | "change" }>;

type ActivityKind = Activity["kind"];

/** Each kind's name, said before who and when, and its icon, used for that kind only. */
const KINDS: Record<ActivityKind, { label: string; icon: LucideIcon }> = {
  comment: { label: "Comment", icon: MessageSquare },
  note: { label: "Note", icon: NotebookPen },
  results: { label: "Results", icon: FlaskConical },
  observations: { label: "Observations", icon: HeartPulse },
  job: { label: "Job", icon: ListChecks },
  change: { label: "Change", icon: PencilLine },
};

/**
 * The timeline's filters, in the order they are shown. Results shows observations as well, as the
 * Review view's Results and Vitals sit side by side. There is no "none": a released filter is All.
 */
export const ACTIVITY_FILTERS = [
  { value: "all", label: "All", kinds: [] },
  { value: "comments", label: "Comments", kinds: ["comment"] },
  { value: "notes", label: "Notes", kinds: ["note"] },
  { value: "results", label: "Results", kinds: ["results", "observations"] },
  { value: "jobs", label: "Jobs", kinds: ["job"] },
  { value: "changes", label: "Changes", kinds: ["change"] },
] as const satisfies readonly { value: string; label: string; kinds: readonly ActivityKind[] }[];

/** Which kinds the timeline shows. */
export type ActivityFilter = (typeof ACTIVITY_FILTERS)[number]["value"];

function shows(filter: ActivityFilter, kind: ActivityKind): boolean {
  const kinds: readonly ActivityKind[] =
    ACTIVITY_FILTERS.find((item) => item.value === filter)?.kinds ?? [];
  return filter === "all" || kinds.includes(kind);
}

/**
 * Everything that happened to a patient, newest first: the synthetic ward's comments, latest
 * note, results, observations, jobs, acuity, transfer and referral, and this session's changes.
 * Two things at the same moment keep the order they happened in, the later one first.
 */
export function activityFor(
  patient: Patient,
  comments: readonly PatientComment[],
  session: readonly SessionActivity[],
): Activity[] {
  // Results taken together are one item: a set, at its time.
  const resultSets = new Map<string, Result[]>();
  for (const result of patient.latestResults ?? []) {
    resultSets.set(result.at, [...(resultSets.get(result.at) ?? []), result]);
  }
  const items: Activity[] = [
    ...comments.map((comment) => ({
      kind: "comment" as const,
      id: comment.id,
      at: comment.at,
      comment,
    })),
    ...(patient.latestNote
      ? [{ kind: "note" as const, id: "note", at: patient.latestNote.at, note: patient.latestNote }]
      : []),
    ...[...resultSets].map(([at, results]) => ({
      kind: "results" as const,
      id: `results-${at}`,
      at,
      results,
    })),
    ...(patient.latestObservations
      ? [
          {
            kind: "observations" as const,
            id: "observations",
            at: patient.latestObservations.at,
            observations: patient.latestObservations,
          },
        ]
      : []),
    ...patient.jobs.flatMap((job) => [
      {
        kind: "job" as const,
        id: `${job.id}-created`,
        at: job.createdAt,
        by: job.createdBy,
        job,
        action: "created" as const,
      },
      ...(job.completedAt && job.completedBy
        ? [
            {
              kind: "job" as const,
              id: `${job.id}-completed`,
              at: job.completedAt,
              by: job.completedBy,
              job,
              action: "completed" as const,
            },
          ]
        : []),
    ]),
    ...(patient.acuity
      ? [
          {
            kind: "change" as const,
            id: "acuity",
            at: patient.acuity.setAt,
            by: patient.acuity.setBy,
            text: `Set acuity to ${acuityLabel(patient.acuity.level)}.`,
          },
        ]
      : []),
    ...(patient.transfer
      ? [
          {
            kind: "change" as const,
            id: "transfer",
            at: patient.transfer.sentAt,
            by: patient.transfer.sentBy,
            text: `Transferred from ${teamName(patient.transfer.from)} to ${teamName(patient.transfer.to)}, waiting to be accepted.`,
          },
        ]
      : []),
    ...(patient.referral
      ? [
          {
            kind: "change" as const,
            id: "referral",
            at: patient.referral.receivedAt,
            by: patient.referral.referrer,
            text: `Referred by ${patient.referral.source}: ${patient.referral.reason}.`,
          },
        ]
      : []),
    ...session,
  ];
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => Date.parse(b.item.at) - Date.parse(a.item.at) || b.index - a.index)
    .map(({ item }) => item);
}

/** Who did it, as the header says: a comment's author with their role. */
function whoOf(item: Activity): string | undefined {
  switch (item.kind) {
    case "comment":
      return `${item.comment.author}, ${item.comment.role}`;
    case "note":
      return item.note.author;
    // The synthetic ward does not say who performed a test or took a set of observations, so the
    // header leaves who out rather than guess (gaps.md).
    case "results":
    case "observations":
      return undefined;
    case "job":
    case "change":
      return item.by;
    default: {
      const unknown: never = item;
      return unknown;
    }
  }
}

/** A list of values with their units, as the data gives them. None is marked: no thresholds. */
function Values({ values }: { values: readonly { key: string; text: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-container gap-y-0.5 tabular-nums">
      {values.map((value) => (
        <li key={value.key} className="whitespace-nowrap">
          {value.text}
        </li>
      ))}
    </ul>
  );
}

/** What happened, by kind. */
function What({ item, team }: { item: Activity; team: string | null }) {
  switch (item.kind) {
    case "comment":
      return <ThreadComment comment={item.comment} />;
    case "note":
      return (
        <p>
          <span className="font-medium">{item.note.type}</span>
          {`: ${item.note.summary}`}
        </p>
      );
    case "results":
      return (
        <Values
          values={item.results.map((result) => ({
            key: result.code,
            text: `${result.abbreviation} ${withUnit(result.value, result.unitDisplay)}`,
          }))}
        />
      );
    case "observations":
      return (
        <Values
          values={item.observations.values.map((value) => ({
            key: value.code,
            text: `${value.abbreviation} ${withUnit(value.value, value.unitDisplay)}`,
          }))}
        />
      );
    case "job": {
      const job = item.job;
      if (item.action === "completed") return <p>{`Completed “${job.text}”.`}</p>;
      const assignee = job.assignee === team ? "the team" : job.assignee;
      return (
        <p>
          {`Created “${job.text}” for ${assignee}`}
          {job.due ? (
            <>
              {", due "}
              <span className="whitespace-nowrap">{formatTime(job.due)}</span>
            </>
          ) : null}
          .
        </p>
      );
    }
    case "change":
      return <p>{item.text}</p>;
    default: {
      const unknown: never = item;
      return unknown;
    }
  }
}

/** Who changed a field and when, under its value in the summary. */
function ChangedBy({ change }: { change: Change<unknown> | undefined }) {
  if (!change) return null;
  return (
    <p className="text-muted-foreground">{`Changed by ${change.by}, ${formatShortTime(change.at)}`}</p>
  );
}

/** Where the pane is in the list's rows, and the patients either side. */
export interface PanePosition {
  /** The open patient's place in the rows, from 1, or `undefined` while they are not in them. */
  index: number | undefined;
  count: number;
  previous: Patient | undefined;
  next: Patient | undefined;
}

/** An icon button with its name in a tooltip, as the pane's header has them. */
function IconButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
  className,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            // At the first or last patient, the button stays where focus is, so pressing it again
            // does nothing rather than dropping focus to the page.
            focusableWhenDisabled
            disabled={disabled}
            className={className}
            onClick={onClick}
          />
        }
      >
        <Icon aria-hidden />
        {label}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The pane's header: previous and next patient through the list's rows without closing the pane,
 * open the patient's screen, close, then who the patient is and where. On a phone, Back takes the
 * place of Close.
 */
function PaneHeader({
  patient,
  others,
  listLabel,
  href,
  position,
  onMove,
  onClose,
}: {
  patient: Patient;
  others: readonly Identified[];
  listLabel: string;
  href: string;
  position: PanePosition;
  onMove: (patientId: string) => void;
  onClose: () => void;
}) {
  const { previous, next, index, count } = position;
  const where = [
    bedLabel(patient),
    teamName(patient.team),
    patient.team ? `EDD ${formatDischarge(patient.expectedDischarge)}` : undefined,
  ].filter((part) => part !== undefined);
  return (
    <header className="flex flex-col gap-2 border-b p-container">
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
        <ListDetailBack className="mr-1">{listLabel}</ListDetailBack>
        <div role="group" aria-label={`Patients in ${listLabel}`} className="flex items-center">
          <IconButton
            label={previous ? `Previous patient: ${displayName(previous)}` : "No previous patient"}
            icon={ChevronLeft}
            disabled={!previous}
            onClick={() => {
              if (previous) onMove(previous.id);
            }}
          />
          <span className="px-1 whitespace-nowrap text-muted-foreground tabular-nums">
            {index === undefined
              ? `Not in the ${String(count)} shown`
              : `${String(index)} of ${String(count)}`}
          </span>
          <IconButton
            label={next ? `Next patient: ${displayName(next)}` : "No next patient"}
            icon={ChevronRight}
            disabled={!next}
            onClick={() => {
              if (next) onMove(next.id);
            }}
          />
        </div>
        <span className="ml-auto flex items-center gap-1">
          {/* A link, as it goes to another screen: drawn as a button, as the header's others are. */}
          <a href={href} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <SquareArrowOutUpRight aria-hidden data-icon="inline-start" />
            Open patient
          </a>
          {/* On a phone, Back closes the pane. */}
          <IconButton
            label="Close summary"
            icon={X}
            className="hidden md:inline-flex"
            onClick={onClose}
          />
        </span>
      </div>
      <PatientIdentity patient={patient} href={href} size="banner" others={others} />
      <p className="flex flex-wrap gap-x-1.5 text-muted-foreground">
        {where.map((part, partIndex) => (
          <span key={part} className="whitespace-nowrap">
            {partIndex > 0 ? (
              <span aria-hidden className="mr-1.5">
                ·
              </span>
            ) : null}
            {part}
          </span>
        ))}
      </p>
    </header>
  );
}

/** The summary at a glance: the facts as they stand, with allied health in words. */
function Summary({
  patient,
  changes,
  openJobs,
}: {
  patient: Patient;
  changes: PatientChanges | undefined;
  openJobs: readonly Job[];
}) {
  const alliedHealth = patient.alliedHealth;
  const barriers = patient.dischargeBarriers;
  const overnight = patient.overnight;
  const referral = patient.referral;
  return (
    <DescriptionList>
      <DescriptionItem>
        <DescriptionTerm>Working problem</DescriptionTerm>
        <DescriptionDetails>
          {patient.workingProblem || "Not set"}
          <ChangedBy change={changes?.workingProblem} />
        </DescriptionDetails>
      </DescriptionItem>
      {patient.team ? (
        <DescriptionItem>
          <DescriptionTerm>Expected discharge</DescriptionTerm>
          <DescriptionDetails>
            {formatDischarge(patient.expectedDischarge)}
            <ChangedBy change={changes?.expectedDischarge} />
          </DescriptionDetails>
        </DescriptionItem>
      ) : null}
      {barriers ? (
        <DescriptionItem>
          <DescriptionTerm>Discharge barriers</DescriptionTerm>
          <DescriptionDetails className="flex flex-wrap gap-1">
            {barriers.length === 0
              ? "None recorded"
              : barriers.map((barrier) => (
                  <Badge key={barrier} variant="secondary">
                    {barrier}
                  </Badge>
                ))}
          </DescriptionDetails>
        </DescriptionItem>
      ) : null}
      {alliedHealth ? (
        <DescriptionItem>
          <DescriptionTerm>Allied health</DescriptionTerm>
          <DescriptionDetails>
            <ul className="flex flex-wrap gap-x-container gap-y-0.5">
              {DISCIPLINES.map((discipline) => {
                const state = alliedHealthState(alliedHealth[discipline.key]);
                const Icon = state.icon;
                return (
                  <li key={discipline.key}>
                    <Status tone={state.tone}>
                      <Icon aria-hidden data-icon="inline-start" />
                      <abbr title={discipline.name} className="no-underline">
                        {discipline.short}
                      </abbr>
                      {state.word}
                    </Status>
                  </li>
                );
              })}
            </ul>
          </DescriptionDetails>
        </DescriptionItem>
      ) : null}
      {patient.team ? (
        <DescriptionItem>
          <DescriptionTerm>Open jobs</DescriptionTerm>
          {openJobs.length === 0 ? <DescriptionDetails>None</DescriptionDetails> : null}
          {openJobs.map((job) => (
            <DescriptionDetails key={job.id}>
              {job.text}
              <span className="text-muted-foreground">
                {`, ${job.assignee === patient.team ? "the team" : job.assignee}${job.due ? `, due ${formatShortTime(job.due)}` : ""}`}
              </span>
            </DescriptionDetails>
          ))}
        </DescriptionItem>
      ) : null}
      {patient.acuity ? (
        <DescriptionItem>
          <DescriptionTerm>Acuity</DescriptionTerm>
          <DescriptionDetails>{acuityLabel(patient.acuity.level)}</DescriptionDetails>
        </DescriptionItem>
      ) : null}
      {patient.conditions.length > 0 ? (
        <DescriptionItem>
          <DescriptionTerm>Problems</DescriptionTerm>
          <DescriptionDetails>{patient.conditions.join(", ")}</DescriptionDetails>
        </DescriptionItem>
      ) : null}
      {overnight ? (
        <DescriptionItem>
          <DescriptionTerm>Overnight</DescriptionTerm>
          <DescriptionDetails className="flex flex-col gap-1">
            <p>{overnight.synopsis}</p>
            <p className="text-muted-foreground">{overnight.progress}</p>
            {/* An AI-drafted synopsis stays marked, with its sources (guardrail 2). */}
            {overnight.aiDrafted?.drafted ? (
              <CommentProvenance
                drafter="Handover assistant"
                reviewedBy={overnight.aiDrafted.reviewedBy ?? undefined}
                sources={overnight.aiDrafted.sources.map((label) => ({ label }))}
              />
            ) : null}
          </DescriptionDetails>
        </DescriptionItem>
      ) : null}
      {referral ? (
        <>
          <DescriptionItem>
            <DescriptionTerm>Referral</DescriptionTerm>
            <DescriptionDetails>
              {`${referral.source}, ${formatShortTime(referral.receivedAt)}. ${referral.reason}.`}
              {referral.summary ? (
                <p className="text-muted-foreground">{referral.summary}</p>
              ) : null}
            </DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>Owner</DescriptionTerm>
            <DescriptionDetails>{referral.owner ?? "Nobody yet"}</DescriptionDetails>
          </DescriptionItem>
        </>
      ) : null}
    </DescriptionList>
  );
}

/** The timeline of one patient's activity, filtered by kind, newest first. */
function ActivityTimeline({
  patient,
  activity,
  filter,
  onFilterChange,
  timelineRef,
}: {
  patient: Patient;
  activity: readonly Activity[];
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
  timelineRef: RefObject<HTMLOListElement | null>;
}) {
  const shown = activity.filter((item) => shows(filter, item.kind));
  const name = displayName(patient);
  const chosen = ACTIVITY_FILTERS.find((item) => item.value === filter);
  return (
    <div className="flex flex-col gap-container">
      <ToggleGroup
        aria-label="Show in the activity"
        variant="outline"
        size="sm"
        spacing={1}
        value={[filter]}
        onValueChange={(value: string[]) => {
          // Nothing pressed means the pressed filter was released: show everything.
          onFilterChange(ACTIVITY_FILTERS.find((item) => item.value === value[0])?.value ?? "all");
        }}
      >
        {ACTIVITY_FILTERS.map((item) => (
          <ToggleGroupItem key={item.value} value={item.value}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {shown.length === 0 ? (
        <Empty className="p-container">
          <EmptyHeader>
            <EmptyDescription>
              {`No ${(chosen?.label ?? "activity").toLowerCase()} in ${name}'s activity.`}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Timeline
          ref={timelineRef}
          variant="connected"
          aria-label={`${filter === "all" ? "Activity" : (chosen?.label ?? "Activity")} for ${name}, newest first`}
        >
          {shown.map((item) => {
            const kind = KINDS[item.kind];
            const Icon = kind.icon;
            const who = whoOf(item);
            const itemProps = item.kind === "comment" ? commentItemProps(item.comment) : {};
            return (
              <TimelineItem key={item.id} data-kind={item.kind} {...itemProps}>
                <TimelineIcon>
                  <Icon />
                </TimelineIcon>
                <TimelineHeader>
                  <TimelineTitle>
                    {item.kind === "job"
                      ? item.action === "created"
                        ? "Job created"
                        : "Job done"
                      : kind.label}
                  </TimelineTitle>
                  {who === undefined ? null : <span>{who}</span>}
                  <TimelineTime dateTime={item.at}>{formatShortTime(item.at)}</TimelineTime>
                  {item.kind === "comment" && item.comment.editedAt ? <CommentEdited /> : null}
                </TimelineHeader>
                <TimelineContent>
                  <What item={item} team={patient.team} />
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      )}
    </div>
  );
}

/** An incoming patient's transfer, with Accept: the team accepts before they change anything. */
function IncomingTransfer({ patient, onAccept }: { patient: Patient; onAccept: () => void }) {
  const titleId = useId();
  const transfer = patient.transfer;
  if (!transfer) return null;
  return (
    <Alert variant="info" role="region" aria-labelledby={titleId}>
      <AlertTitle id={titleId}>{`Waiting for ${teamName(transfer.to)} to accept`}</AlertTitle>
      <AlertDescription>
        <p>{`From ${teamName(transfer.from)}, sent by ${transfer.sentBy}, ${formatTime(transfer.sentAt)}. ${transfer.clinicalSummary}`}</p>
        <p>The handover is the first comment. Accept to change their details.</p>
      </AlertDescription>
      <AlertAction>
        <Button size="sm" onClick={onAccept}>
          {`Accept ${displayName(patient)}`}
        </Button>
      </AlertAction>
    </Alert>
  );
}

/** One patient's summary, activity and comment box: made again for each patient. */
function PaneBody({
  patient,
  changes,
  openJobs,
  comments,
  activity,
  isIncoming,
  onAccept,
  commentActions,
  filter,
  onFilterChange,
  draft,
  onDraftChange,
}: {
  patient: Patient;
  changes: PatientChanges | undefined;
  openJobs: readonly Job[];
  comments: readonly PatientComment[];
  activity: readonly Activity[];
  isIncoming: boolean;
  onAccept: () => void;
  commentActions: CommentThreadActions;
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
  draft: string;
  onDraftChange: (draft: string) => void;
}) {
  const summaryId = useId();
  const activityId = useId();
  const timeline = useRef<HTMLOListElement>(null);
  return (
    <CommentThreadProvider comments={comments} {...commentActions}>
      {/* From md up the summary and activity scroll between the header and the comment box. On a
      phone the page scrolls, and the comment box stays at the bottom of the screen. */}
      <div className="flex flex-col gap-container p-container md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain">
        {isIncoming ? <IncomingTransfer patient={patient} onAccept={onAccept} /> : null}
        <section aria-labelledby={summaryId}>
          <h2 id={summaryId} className="sr-only">
            Summary
          </h2>
          <Summary patient={patient} changes={changes} openJobs={openJobs} />
        </section>
        <section aria-labelledby={activityId} className="border-t pt-container">
          <h2 id={activityId} className="sr-only">
            Activity
          </h2>
          <ActivityTimeline
            patient={patient}
            activity={activity}
            filter={filter}
            onFilterChange={onFilterChange}
            timelineRef={timeline}
          />
        </section>
      </div>
      <div className="sticky bottom-0 border-t bg-background p-container md:static">
        <CommentComposer
          patient={patient}
          draft={draft}
          onDraftChange={onDraftChange}
          onPosted={() => {
            // A comment the filter would hide is shown, and scrolled to, with its Edit and Undo.
            if (!shows(filter, "comment")) onFilterChange("all");
            requestAnimationFrame(() => {
              timeline.current
                ?.querySelector("[data-kind=comment]")
                ?.scrollIntoView({ block: "nearest" });
            });
          }}
        />
      </div>
    </CommentThreadProvider>
  );
}

/**
 * Option C of the pane beside the list, as the maintainer chose it (2026-10-19): a header to move
 * through the list, the summary at a glance, one timeline of everything that happened to the
 * patient, newest first, and the comment box at the bottom.
 */
export function PatientPane({
  patient,
  others,
  listLabel,
  href,
  position,
  onMove,
  onClose,
  ...body
}: {
  patient: Patient;
  others: readonly Identified[];
  listLabel: string;
  href: string;
  position: PanePosition;
  onMove: (patientId: string) => void;
  onClose: () => void;
  changes: PatientChanges | undefined;
  openJobs: readonly Job[];
  comments: readonly PatientComment[];
  activity: readonly Activity[];
  isIncoming: boolean;
  onAccept: () => void;
  commentActions: CommentThreadActions;
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
  draft: string;
  onDraftChange: (draft: string) => void;
}): ReactNode {
  return (
    <div className="flex flex-col text-body md:min-h-0 md:flex-1">
      {/* The header stays when the pane moves to another patient, so focus stays on Next. */}
      <PaneHeader
        patient={patient}
        others={others}
        listLabel={listLabel}
        href={href}
        position={position}
        onMove={onMove}
        onClose={onClose}
      />
      <PaneBody key={patient.id} patient={patient} {...body} />
    </div>
  );
}
