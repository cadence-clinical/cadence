"use client";

import {
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIcon,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
  ToggleGroup,
  ToggleGroupItem,
} from "@cadence-clinical/ui";
import { FlaskConical, MessageSquare, NotebookPen, PencilLine } from "lucide-react";
import { useState } from "react";

// All content is synthetic.
const FILTERS = [
  { value: "all", label: "All" },
  { value: "comments", label: "Comments" },
  { value: "notes", label: "Notes" },
  { value: "results", label: "Results" },
  { value: "changes", label: "Changes" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

const EVENTS = [
  {
    id: "change",
    filter: "changes",
    kind: "Change",
    icon: PencilLine,
    who: "Dr Tom Ellis",
    at: "2026-10-19T08:03:00+11:00",
    time: "08:03",
    what: "Changed the expected discharge to Wed 21 Oct, from Tue 20 Oct.",
  },
  {
    id: "comment",
    filter: "comments",
    kind: "Comment",
    icon: MessageSquare,
    who: "RN Kate Morgan, Nurse unit manager",
    at: "2026-10-19T05:00:00+11:00",
    time: "05:00",
    what: "Daughter visiting at 1100, keen to talk about going home.",
  },
  {
    id: "results",
    filter: "results",
    kind: "Results",
    icon: FlaskConical,
    who: undefined,
    at: "2026-10-18T21:00:00+11:00",
    time: "Sun 21:00",
    what: "Hb 118 g/L · Cr 74 µmol/L",
  },
  {
    id: "note",
    filter: "notes",
    kind: "Note",
    icon: NotebookPen,
    who: "Dr Mei Chen",
    at: "2026-10-18T09:00:00+11:00",
    time: "Sun 09:00",
    what: "Ward round note: improving on IV antibiotics. Plan to switch to oral tomorrow.",
  },
] as const;

/**
 * A timeline with a filter for the docs: a toggle group of kinds, where releasing the pressed kind
 * shows them all again.
 */
export function TimelineFilterPreview() {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = EVENTS.filter((event) => filter === "all" || event.filter === filter);
  return (
    <div className="not-prose preview-surface my-6 flex justify-center rounded-lg border p-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <ToggleGroup
          aria-label="Show in the timeline"
          variant="outline"
          size="sm"
          spacing={0}
          value={[filter]}
          onValueChange={(value: string[]) => {
            setFilter(FILTERS.find((item) => item.value === value[0])?.value ?? "all");
          }}
        >
          {FILTERS.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Timeline variant="connected" aria-label="Activity, newest first">
          {shown.map((event) => {
            const Icon = event.icon;
            return (
              <TimelineItem key={event.id}>
                <TimelineIcon>
                  <Icon />
                </TimelineIcon>
                <TimelineHeader>
                  <TimelineTitle>{event.kind}</TimelineTitle>
                  {event.who === undefined ? null : <span>{event.who}</span>}
                  <TimelineTime dateTime={event.at}>{event.time}</TimelineTime>
                </TimelineHeader>
                <TimelineContent>{event.what}</TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      </div>
    </div>
  );
}
