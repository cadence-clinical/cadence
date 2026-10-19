import {
  Badge,
  cn,
  Comment,
  CommentAuthor,
  CommentEdited,
  CommentHeader,
  CommentRevoked,
  CommentText,
  CommentTime,
  Status,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type StatusTone,
} from "@cadence-clinical/ui";
import { DataTableCellText, type DataTableRowLines } from "@cadence-clinical/ui/data-table";
import { CircleCheck, Clock, Eye, Minus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  formatShortTime,
  withUnit,
  type AlliedHealth,
  type LatestNote,
  type Observations,
  type PatientComment,
  type Result,
} from "../ward";

/**
 * The four allied health states the maintainer chose (2026-10-19), each with its own icon, its word
 * and its tone: grey, amber, blue and green. The team records the state: the list never works it out.
 */
export const ALLIED_HEALTH_STATES: Record<
  string,
  { tone: StatusTone; icon: LucideIcon; word: string; meaning: string }
> = {
  "not-needed": { tone: "neutral", icon: Minus, word: "Not needed", meaning: "not needed" },
  referred: { tone: "warning", icon: Clock, word: "Referred", meaning: "referred, waiting" },
  seen: { tone: "info", icon: Eye, word: "Seen", meaning: "seen, with follow-up" },
  cleared: {
    tone: "success",
    icon: CircleCheck,
    word: "Cleared",
    meaning: "cleared for discharge",
  },
};

/** The three disciplines, in the order the cell shows them. */
export const DISCIPLINES = [
  { key: "pt", short: "PT", name: "Physiotherapy" },
  { key: "sw", short: "SW", name: "Social work" },
  { key: "ot", short: "OT", name: "Occupational therapy" },
] as const;

/** A state the data holds, or a plain "Not recorded" for one this prototype does not know. */
export function alliedHealthState(state: string) {
  return (
    ALLIED_HEALTH_STATES[state] ?? {
      tone: "neutral" as const,
      icon: Minus,
      word: "Not recorded",
      meaning: "not recorded",
    }
  );
}

/** The three states in words, such as "PT seen, with follow-up; SW not needed; OT referred, waiting". */
export function alliedHealthWords(alliedHealth: AlliedHealth): string {
  return DISCIPLINES.map(
    (discipline) =>
      `${discipline.short} ${alliedHealthState(alliedHealth[discipline.key]).meaning}`,
  ).join("; ");
}

/**
 * PT, SW and OT in one line of a cell, "PT ✓ · SW ◷ · OT –", each an icon in its tone. The whole
 * cell is one button whose name, and tooltip, say the three states in words: one tab stop a row.
 */
export function AlliedHealthCell({
  alliedHealth,
  patientName,
}: {
  alliedHealth: AlliedHealth | undefined;
  patientName: string;
}) {
  if (!alliedHealth)
    return <span className="whitespace-nowrap text-muted-foreground">Not recorded</span>;
  const words = alliedHealthWords(alliedHealth);
  return (
    <Tooltip>
      <TooltipTrigger
        render={<button type="button" />}
        aria-label={`Allied health for ${patientName}: ${words}`}
        className="inline-flex items-center gap-1.5 rounded-sm whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {DISCIPLINES.map((discipline, index) => {
          const state = alliedHealthState(alliedHealth[discipline.key]);
          const Icon = state.icon;
          return (
            <span key={discipline.key} className="inline-flex items-center gap-1.5">
              {index > 0 ? (
                <span aria-hidden className="text-muted-foreground">
                  ·
                </span>
              ) : null}
              <Status tone={state.tone}>
                {discipline.short}
                <Icon aria-hidden data-icon="inline-end" />
              </Status>
            </span>
          );
        })}
      </TooltipTrigger>
      <TooltipContent>
        <ul>
          {DISCIPLINES.map((discipline) => (
            <li key={discipline.key}>
              {`${discipline.name}: ${alliedHealthState(alliedHealth[discipline.key]).meaning}`}
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

/** Lines of a cell, none of which wraps, in the text's colour but for the last `muted` lines. */
function Lines({ lines, muted = 0 }: { lines: readonly ReactNode[]; muted?: number }) {
  return (
    <span className="flex flex-col gap-0.5 whitespace-nowrap tabular-nums">
      {lines.map((line, index) => (
        // The lines are in a fixed order and never move, so a line's place is its identity.
        <span
          key={index}
          className={index >= lines.length - muted ? "text-muted-foreground" : undefined}
        >
          {line}
        </span>
      ))}
    </span>
  );
}

/** Splits words into `count` lines of nearly equal length, the longer lines first. */
function inLines(words: readonly string[], count: number): string[] {
  const size = Math.ceil(words.length / count);
  return Array.from({ length: count }, (_, index) =>
    words.slice(index * size, (index + 1) * size).join(" · "),
  ).filter((line) => line !== "");
}

/**
 * The latest results as given, "K 5.4 mmol/L · Cr 168 µmol/L", then when. Never highlighted. In a
 * three-line row the results take two lines, so the column is narrower.
 */
export function ResultsCell({
  results,
  lines = 2,
}: {
  results: Result[] | undefined;
  lines?: DataTableRowLines;
}) {
  if (!results || results.length === 0) {
    return <span className="whitespace-nowrap text-muted-foreground">No recent results</span>;
  }
  const times = [...new Set(results.map((result) => formatShortTime(result.at)))].join(", ");
  const words = results.map(
    (result) => `${result.abbreviation} ${withUnit(result.value, result.unitDisplay)}`,
  );
  return <Lines lines={[...inLines(words, lines - 1), times]} muted={1} />;
}

/**
 * The latest set of observations, with abbreviations and units as the data gives them, over the
 * row's lines, and the time after the last value. No value is marked: the list holds no thresholds.
 */
export function VitalsCell({
  observations,
  lines = 2,
}: {
  observations: Observations | undefined;
  lines?: DataTableRowLines;
}) {
  if (!observations)
    return <span className="whitespace-nowrap text-muted-foreground">No observations</span>;
  const words = observations.values.map(
    (value) => `${value.abbreviation} ${withUnit(value.value, value.unitDisplay)}`,
  );
  const shown = inLines(words, lines);
  const last = (
    <>
      {shown.at(-1)}
      <span className="text-muted-foreground">{` · ${formatShortTime(observations.at)}`}</span>
    </>
  );
  return <Lines lines={[...shown.slice(0, -1), last]} />;
}

/**
 * The latest note: its type, author and time, then its opening words, cut to the lines left in
 * the row: one in a two-line row, two in a three-line row.
 */
export function NoteCell({ note }: { note: LatestNote | undefined }) {
  if (!note) return <span className="whitespace-nowrap text-muted-foreground">No notes yet</span>;
  return (
    <span className="flex flex-col gap-0.5">
      <span className="whitespace-nowrap">
        <span className="font-medium">{note.type}</span>
        <span className="text-muted-foreground">{` · ${note.author} · ${formatShortTime(note.at)}`}</span>
      </span>
      {/* The first line sets the column's width, and the opening words are cut to it. */}
      <DataTableCellText reserveLines={1} className="w-0 min-w-full text-muted-foreground">
        {note.summary}
      </DataTableCellText>
    </span>
  );
}

/**
 * Discharge barriers as badges, or "None": on one line in a two-line row, and wrapping onto a
 * second line in a three-line row.
 */
export function BarriersCell({
  barriers,
  lines,
}: {
  barriers: string[] | undefined;
  /** Leave it out outside the table, where the badges wrap to the space they have. */
  lines?: DataTableRowLines;
}) {
  if (!barriers || barriers.length === 0)
    return <span className="text-muted-foreground">None</span>;
  return (
    <span
      className={cn(
        "flex gap-1",
        lines === 2 ? "flex-nowrap" : "flex-wrap",
        lines === 3 && "max-w-48",
      )}
    >
      {barriers.map((barrier) => (
        <Badge key={barrier} variant="secondary" className="whitespace-nowrap">
          {barrier}
        </Badge>
      ))}
    </span>
  );
}

/**
 * The latest comment in two lines, or three in a three-line row, or "No comments". A revoked
 * comment is struck through and says "Revoked". The whole thread is in the patient's detail.
 */
export function LastCommentCell({
  comment,
  lines = 2,
}: {
  comment: PatientComment | undefined;
  lines?: DataTableRowLines;
}) {
  if (!comment) return <span className="whitespace-nowrap text-muted-foreground">No comments</span>;
  return (
    <Comment
      size="compact"
      status={comment.revoked ? "revoked" : "active"}
      lines={lines === 3 ? 2 : 1}
      className={lines === 3 ? "w-48" : "w-56"}
    >
      <CommentText>{comment.text}</CommentText>
      <CommentHeader>
        {comment.revoked ? (
          <CommentRevoked
            by={comment.revoked.by}
            time={formatShortTime(comment.revoked.at)}
            dateTime={comment.revoked.at}
          />
        ) : null}
        <CommentAuthor>{comment.author}</CommentAuthor>
        <CommentTime dateTime={comment.at}>{formatShortTime(comment.at)}</CommentTime>
        {comment.editedAt && !comment.revoked ? <CommentEdited /> : null}
      </CommentHeader>
    </Comment>
  );
}
