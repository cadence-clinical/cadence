"use client";

import {
  describeTime,
  groupRounds,
  type InterpretedReading,
  type InterpretedSeries,
  type ObservationLevel,
  type ObservationValue,
  type RoundTotal,
  type SeverityStep,
  type UnbandedReason,
} from "@cadence-clinical/core";
import { Rows3 } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { Button } from "@/components/cadence/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/cadence/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/cadence/tooltip";
import { cn } from "@/lib/cn";

/** Every word the table shows or reads out. The defaults are en-AU. */
interface ObservationTableMessages {
  /** The heading of the column of series names. */
  observation: string;
  today: string;
  yesterday: string;
  /** Shown for a value that was not recorded. */
  absent: string;
  yes: string;
  no: string;
  /** Read before the source's own interpretation, such as "Source: High". */
  source: string;
  /** Read for a change, such as "up 2 since 09:30". */
  up: string;
  down: string;
  unchanged: string;
  since: string;
  /** Shown when there is nothing to show. */
  empty: string;
  /** The button that shows or hides rows, and the heading of its menu. */
  rows: string;
  showRows: string;
  /** Shown for a round whose total is missing a required series. */
  incomplete: string;
  /** Read before the series an incomplete total is missing. */
  missing: string;
  /** Read when an escalation, not the sum, set a total's level. */
  escalated: string;
  /** Why a value has no band, read out and shown on hover. */
  unbanded: Readonly<
    Record<Exclude<UnbandedReason, "no-bands" | "not-banded-kind" | "absent">, string>
  >;
}

const MESSAGES: ObservationTableMessages = {
  observation: "Observation",
  today: "Today",
  yesterday: "Yesterday",
  absent: "Not recorded",
  yes: "Yes",
  no: "No",
  source: "Source",
  up: "up",
  down: "down",
  unchanged: "no change",
  since: "since",
  empty: "No observations in this period.",
  rows: "Rows",
  showRows: "Show rows",
  incomplete: "Incomplete",
  missing: "Missing",
  escalated: "Raised by a single observation, whatever the sum",
  unbanded: {
    "outside-bands": "Outside every band",
    "unit-mismatch": "Not banded: a different unit",
    "no-unit": "Not banded: no unit",
    comparator: "Not banded: a bound, not an exact value",
    "unknown-answer": "Not banded: an answer the schema does not know",
  },
};

/** The edge of a value in each band. Written out whole so Tailwind finds each class. */
const BAND_BORDER: Readonly<Record<SeverityStep, string>> = {
  "severity-0": "border-severity-0-border",
  "severity-1": "border-severity-1-border",
  "severity-2": "border-severity-2-border",
  "severity-3": "border-severity-3-border",
  "severity-4": "border-severity-4-border",
  "severity-5": "border-severity-5-border",
  "severity-6": "border-severity-6-border",
};

/** The fill of a value in each band. */
const BAND_FILL: Readonly<Record<SeverityStep, string>> = {
  "severity-0": "bg-severity-0-subtle",
  "severity-1": "bg-severity-1-subtle",
  "severity-2": "bg-severity-2-subtle",
  "severity-3": "bg-severity-3-subtle",
  "severity-4": "bg-severity-4-subtle",
  "severity-5": "bg-severity-5-subtle",
  "severity-6": "bg-severity-6-subtle",
};

/** Reasons that mean the schema could not judge a value, as against having nothing to judge. */
function isUnjudged(reason: UnbandedReason): reason is keyof ObservationTableMessages["unbanded"] {
  return reason !== "no-bands" && reason !== "not-banded-kind" && reason !== "absent";
}

/** A value in words, as the source gave it. Nothing is rounded or converted. */
function valueText(
  value: ObservationValue,
  messages: ObservationTableMessages,
  number: Intl.NumberFormat,
): string {
  switch (value.kind) {
    case "quantity": {
      const { comparator, value: amount } = value.quantity;
      return `${comparator === undefined ? "" : `${comparator} `}${number.format(amount)}`;
    }
    case "integer":
      return number.format(value.value);
    case "concept": {
      const [coding] = value.concept.codings;
      return value.concept.text ?? coding?.display ?? coding?.code ?? "";
    }
    case "text":
      return value.text;
    case "boolean":
      return value.value ? messages.yes : messages.no;
    case "absent":
      return messages.absent;
  }
}

/**
 * The unit a value is shown with. The row names its unit once, so a value carries its own only
 * when it differs from the row's or the row names none: a value is never shown without its unit.
 */
function ownUnit(reading: InterpretedReading, unitLabel: string | undefined): string | undefined {
  const { band, value } = reading;
  if (value.kind !== "quantity") return undefined;
  const differs =
    band.kind === "none" && (band.reason === "unit-mismatch" || band.reason === "no-unit");
  return unitLabel === undefined || differs
    ? (value.quantity.unitText ?? value.quantity.ucum)
    : undefined;
}

/** The props of the Observation table. */
interface ObservationTableProps extends Omit<ComponentProps<"div">, "children"> {
  /**
   * The series to show, one row each, in order: what `applyObservationSchema` returns. The table
   * shows the band each value was given. It works nothing out itself.
   */
  series: readonly InterpretedSeries[];
  /** The table's name, for a screen reader, such as "Vital signs". */
  label: string;
  /** The moment "today" is measured from: ISO 8601 with an offset, or milliseconds. */
  now: string | number;
  /** The IANA time zone times are shown in, such as `Australia/Melbourne`. */
  timeZone: string;
  /** Defaults to `en-AU`. */
  locale?: string;
  /** Defaults to the 24 hour clock. */
  hourCycle?: "h23" | "h12";
  /**
   * Readings within this many milliseconds of a round's first reading share its column. Defaults
   * to five minutes. Set 0 to give every time its own column.
   */
  roundWindowMs?: number;
  /**
   * A total for each round, from `scoreRounds`, shown in a last row. Group the rounds with the
   * same `roundWindowMs` as the table: a total whose round is not a column throws.
   */
  totals?: { readonly label: string; readonly rounds: readonly RoundTotal[] };
  /** The keys of the rows to hide at first. The total's row is `TOTAL_ROW`. */
  defaultHiddenRows?: readonly string[];
  /** Called with the keys of the hidden rows when the reader shows or hides one. */
  onHiddenRowsChange?: (keys: string[]) => void;
  /** Words to replace the en-AU defaults. */
  messages?: Partial<ObservationTableMessages>;
}

/** The key of the total's row, for hiding it. */
const TOTAL_ROW = "(total)";

/** The fill and edge of a level, and whether it is shown at all. Step 0 is not. */
function levelClasses(level: ObservationLevel | undefined): string | false {
  const step = level?.severity;
  return (
    step !== undefined &&
    step !== "severity-0" &&
    cn("border font-semibold", BAND_BORDER[step], BAND_FILL[step])
  );
}

/** A level's short label in a box of its own, before the number, so it is never read as part of it. */
function LevelBox({ level }: { level: ObservationLevel | undefined }) {
  if (level === undefined || level.severity === "severity-0" || level.short === "") return null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "self-center rounded-xs border bg-background px-0.5 text-control-sm leading-none",
        BAND_BORDER[level.severity],
      )}
    >
      {level.short}
    </span>
  );
}

/** Where a focusable value sits in the grid: its row, its place within the cell, and its column. */
interface Place {
  readonly row: number;
  readonly sub: number;
  readonly col: number;
}

function placeOf(element: HTMLElement): Place {
  return {
    row: Number(element.dataset["row"]),
    sub: Number(element.dataset["sub"]),
    col: Number(element.dataset["col"]),
  };
}

/** The next value in a direction, for moving through the table with the arrow keys. */
function nextPlace(
  all: readonly HTMLElement[],
  from: HTMLElement,
  key: string,
): HTMLElement | undefined {
  const here = placeOf(from);
  const places = all.map((element) => ({ element, ...placeOf(element) }));
  const inRow = places.filter(({ row, sub }) => row === here.row && sub === here.sub);
  const byCol = (a: Place, b: Place) => a.col - b.col;
  const byRow = (a: Place, b: Place) => a.row - b.row || a.sub - b.sub;
  switch (key) {
    case "ArrowRight":
      return inRow.filter(({ col }) => col > here.col).sort(byCol)[0]?.element;
    case "ArrowLeft":
      return inRow
        .filter(({ col }) => col < here.col)
        .sort(byCol)
        .at(-1)?.element;
    case "Home":
      return inRow.sort(byCol)[0]?.element;
    case "End":
      return inRow.sort(byCol).at(-1)?.element;
    case "ArrowDown":
      return places
        .filter(({ col }) => col === here.col)
        .filter((place) => byRow(place, here) > 0)
        .sort(byRow)[0]?.element;
    case "ArrowUp":
      return places
        .filter(({ col }) => col === here.col)
        .filter((place) => byRow(place, here) < 0)
        .sort(byRow)
        .at(-1)?.element;
    default:
      return undefined;
  }
}

/**
 * A flowsheet of observations: one row per series and one column per round, oldest to newest,
 * opening at the newest. A round is the readings taken within a few minutes of each other, as a
 * set of vital signs is. Each value shows the band a schema gave it, by fill, edge and short
 * label, and its change since the value before. Its details are in a tooltip, and read out.
 *
 * The values are one stop for the keyboard: Tab reaches the grid, and the arrow keys, Home and
 * End move between values, each showing its tooltip.
 */
function ObservationTable({
  series,
  label,
  now,
  timeZone,
  locale = "en-AU",
  hourCycle = "h23",
  roundWindowMs = 5 * 60_000,
  totals,
  defaultHiddenRows = [],
  onHiddenRowsChange,
  messages: ownMessages,
  className,
  ...props
}: ObservationTableProps) {
  const messages = { ...MESSAGES, ...ownMessages };
  const rootRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set(defaultHiddenRows));
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  // Columns come from every series, shown or not, so hiding a row never moves a column.
  const rounds = groupRounds(series, roundWindowMs);
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 20 });
  const describe = (timeMs: number) =>
    describeTime(timeMs, {
      now,
      timeZone,
      locale,
      hourCycle,
      words: { today: messages.today, yesterday: messages.yesterday },
    });

  const columns = rounds.map((round) => ({ round, when: describe(round.timeMs) }));
  const days = columns.reduce<{ key: string; day: string; span: number }[]>((all, { when }) => {
    const last = all.at(-1);
    if (last?.key === when.dayKey) last.span += 1;
    else all.push({ key: when.dayKey, day: when.day, span: 1 });
    return all;
  }, []);

  const totalsByTime = new Map(totals?.rounds.map((total) => [total.timeMs, total]));
  for (const timeMs of totalsByTime.keys()) {
    if (!rounds.some((round) => round.timeMs === timeMs)) {
      throw new Error(
        `ObservationTable: a total's round, at ${new Date(timeMs).toISOString()}, is not a column. Group the rounds for scoreRounds with the table's roundWindowMs.`,
      );
    }
  }

  const nameOf = (key: string): string => {
    const found = series.find((entry) => entry.key === key);
    const [first] = found?.readings ?? [];
    return found?.definition?.label ?? first?.code.text ?? first?.code.codings[0]?.display ?? key;
  };

  // Open at the newest round, on the right, and stay there while the table grows, as it does
  // when its font arrives, until the reader scrolls back through time.
  const newest = rounds.at(-1)?.timeMs;
  useEffect(() => {
    const box = rootRef.current?.querySelector<HTMLElement>("[data-slot=table-container]");
    if (!box) return;
    let isPinned = true;
    let pinnedLeft = 0;
    const pin = () => {
      if (!isPinned) return;
      box.scrollLeft = box.scrollWidth;
      pinnedLeft = box.scrollLeft;
    };
    // Only a scroll back towards older rounds lets go. The table growing, or the scroll event from
    // pinning arriving after it has grown, does not.
    const follow = () => {
      if (box.scrollLeft < pinnedLeft - 1) isPinned = false;
      else if (box.scrollLeft + box.clientWidth >= box.scrollWidth - 1) isPinned = true;
    };
    pin();
    // The table grows as its font arrives, and the box changes width with the page.
    const observer = new ResizeObserver(pin);
    observer.observe(box);
    if (box.firstElementChild) observer.observe(box.firstElementChild);
    box.addEventListener("scroll", follow, { passive: true });
    return () => {
      observer.disconnect();
      box.removeEventListener("scroll", follow);
    };
  }, [newest]);

  if (rounds.length === 0) {
    return (
      <div
        data-slot="observation-table"
        className={cn("text-body text-muted-foreground", className)}
        {...props}
      >
        <p>{messages.empty}</p>
      </div>
    );
  }

  const describeReading = (
    reading: InterpretedReading,
    unitLabel: string | undefined,
  ): string[] => {
    const unit =
      reading.value.kind === "quantity" ? (ownUnit(reading, unitLabel) ?? unitLabel) : undefined;
    const lines = [
      `${valueText(reading.value, messages, number)}${unit === undefined ? "" : ` ${unit}`}`,
    ];
    if (reading.band.kind === "level") lines.push(reading.band.level.label);
    else if (isUnjudged(reading.band.reason)) lines.push(messages.unbanded[reading.band.reason]);
    const at = describe(reading.timeMs);
    lines.push(at.full);
    const { previous } = reading;
    if (previous?.change !== undefined) {
      const { change } = previous;
      const direction = change > 0 ? messages.up : change < 0 ? messages.down : messages.unchanged;
      const amount = change === 0 ? "" : ` ${number.format(Math.abs(change))}`;
      const before = describe(reading.timeMs - previous.elapsedMs);
      const when = before.dayKey === at.dayKey ? before.time : `${before.day} ${before.time}`;
      lines.push(`${direction}${amount} ${messages.since} ${when}`);
    }
    if (reading.sourceLabels.length > 0) {
      lines.push(`${messages.source}: ${reading.sourceLabels.join(", ")}`);
    }
    return lines;
  };

  const describeTotal = (total: RoundTotal): string[] => {
    const lines =
      total.kind === "complete"
        ? [`${totals?.label ?? ""} ${number.format(total.total)}`]
        : [
            `${totals?.label ?? ""}: ${messages.incomplete}`,
            `${messages.missing}: ${total.missing.map(nameOf).join(", ")}`,
          ];
    if (total.level) lines.push(total.level.label);
    if (total.isEscalated) lines.push(messages.escalated);
    // What added to the total. A part that scored nothing adds nothing to read.
    for (const part of total.parts) {
      if (part.score !== 0) lines.push(`${nameOf(part.seriesKey)} ${number.format(part.score)}`);
    }
    return lines;
  };

  // The one value the Tab key reaches: the last one focused, or the first in the newest round.
  const lastRound = rounds.at(-1);
  const visible = series.filter(({ key }) => !hidden.has(key));
  const defaultId =
    visible.map(({ key }) => lastRound?.readings[key]?.[0]?.id).find((id) => id !== undefined) ??
    (lastRound && totalsByTime.has(lastRound.timeMs) ? `total@${lastRound.timeMs}` : undefined);
  const tabStop = activeId ?? defaultId;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const from = event.target;
    if (!(from instanceof HTMLElement) || from.dataset["row"] === undefined) return;
    const all = [...(rootRef.current?.querySelectorAll<HTMLElement>("[data-row]") ?? [])];
    const next = nextPlace(all, from, event.key);
    if (!next) return;
    event.preventDefault();
    next.focus();
  };

  const toggleRow = (key: string, isShown: boolean) => {
    const next = new Set(hidden);
    if (isShown) next.delete(key);
    else next.add(key);
    setHidden(next);
    onHiddenRowsChange?.([...next]);
  };

  const dayEdge = (index: number) =>
    columns[index - 1]?.when.dayKey !== columns[index]?.when.dayKey && "border-l";

  const valueTrigger = (
    id: string,
    place: Place,
    lines: readonly string[],
    className: string,
    children: ReactNode,
    data: Record<`data-${string}`, string | undefined> = {},
  ) => (
    <Tooltip key={id}>
      <TooltipTrigger
        render={
          <span
            data-slot="observation-value"
            data-row={place.row}
            data-sub={place.sub}
            data-col={place.col}
            {...data}
            data-id={id}
            tabIndex={id === tabStop ? 0 : -1}
            className={cn(
              "inline-flex items-baseline gap-1 rounded-sm px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
          />
        }
      >
        <span className="sr-only">{lines.join(", ")}</span>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </TooltipContent>
    </Tooltip>
  );

  const rowNames = [
    ...series.map(({ key }) => ({ key, name: nameOf(key) })),
    ...(totals ? [{ key: TOTAL_ROW, name: totals.label }] : []),
  ];

  return (
    <div
      data-slot="observation-table"
      ref={rootRef}
      // As wide as its table, up to its place, so the Rows button sits at the table's edge.
      className={cn("flex w-fit max-w-full min-w-0 flex-col gap-2", className)}
      {...props}
    >
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <Rows3 aria-hidden data-icon="inline-start" />
            {messages.rows}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{messages.showRows}</DropdownMenuLabel>
              {rowNames.map(({ key, name }) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={!hidden.has(key)}
                  onCheckedChange={(checked) => {
                    toggleRow(key, checked);
                  }}
                >
                  {name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <TooltipProvider>
        <Table aria-label={label} className="w-auto border-separate border-spacing-0">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                rowSpan={2}
                className="sticky left-0 z-10 min-w-32 border-r border-b bg-background align-bottom"
              >
                {messages.observation}
              </TableHead>
              {days.map((day) => (
                <TableHead
                  key={day.key}
                  scope="colgroup"
                  colSpan={day.span}
                  className="border-b border-l text-muted-foreground"
                >
                  {day.day}
                </TableHead>
              ))}
            </TableRow>
            <TableRow className="hover:bg-transparent">
              {columns.map(({ round, when }, index) => (
                <TableHead key={round.timeMs} className={cn("border-b text-end", dayEdge(index))}>
                  <time dateTime={round.time}>
                    <span className="sr-only">{when.full}</span>
                    <span aria-hidden="true">{when.time}</span>
                  </time>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody
            onKeyDown={handleKeyDown}
            // The value last focused is the one Tab returns to.
            onFocus={(event) => {
              if (event.target instanceof HTMLElement && event.target.dataset["id"] !== undefined) {
                setActiveId(event.target.dataset["id"]);
              }
            }}
          >
            {visible.map(({ key, definition }, row) => {
              const unitLabel = definition?.unitLabel;
              return (
                <TableRow key={key}>
                  <TableHead
                    scope="row"
                    className="sticky left-0 z-10 min-w-32 border-r border-b bg-background font-medium"
                  >
                    {nameOf(key)}
                    {unitLabel === undefined ? null : (
                      <span className="block text-control-sm font-normal text-muted-foreground">
                        {unitLabel}
                      </span>
                    )}
                  </TableHead>
                  {columns.map(({ round }, col) => (
                    <TableCell
                      key={round.timeMs}
                      className={cn("border-b text-end align-top", dayEdge(col))}
                    >
                      <span className="flex flex-col items-end gap-0.5">
                        {(round.readings[key] ?? []).map((reading, sub) => {
                          const { band, previous, value } = reading;
                          const level = band.kind === "level" ? band.level : undefined;
                          const isUnjudgedValue = band.kind === "none" && isUnjudged(band.reason);
                          const unit = ownUnit(reading, unitLabel);
                          const change = previous?.change;
                          return valueTrigger(
                            reading.id,
                            { row, sub, col },
                            describeReading(reading, unitLabel),
                            cn(
                              // A number and its unit stay on one line. Words wrap between words.
                              (value.kind === "quantity" || value.kind === "integer") &&
                                "whitespace-nowrap",
                              levelClasses(level),
                              isUnjudgedValue && "border border-dashed border-input",
                              value.kind === "absent" && "text-muted-foreground",
                            ),
                            <>
                              <LevelBox level={level} />
                              <span aria-hidden="true">
                                {valueText(value, messages, number)}
                                {unit === undefined ? null : ` ${unit}`}
                              </span>
                              {isUnjudgedValue ? (
                                <span
                                  aria-hidden="true"
                                  className="text-control-sm text-muted-foreground"
                                >
                                  ?
                                </span>
                              ) : null}
                              {change === undefined ? null : (
                                <span
                                  aria-hidden="true"
                                  className="text-control-sm font-normal text-muted-foreground"
                                >
                                  {change > 0 ? "▲" : change < 0 ? "▼" : "="}
                                  {change === 0 ? null : number.format(Math.abs(change))}
                                </span>
                              )}
                            </>,
                            {
                              "data-severity": level?.severity,
                              "data-unbanded": band.kind === "none" ? band.reason : undefined,
                            },
                          );
                        })}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
            {totals && !hidden.has(TOTAL_ROW) ? (
              <TableRow data-slot="observation-total">
                <TableHead
                  scope="row"
                  className="sticky left-0 z-10 min-w-32 border-t-2 border-r bg-background font-semibold"
                >
                  {totals.label}
                </TableHead>
                {columns.map(({ round }, col) => {
                  const total = totalsByTime.get(round.timeMs);
                  return (
                    <TableCell
                      key={round.timeMs}
                      className={cn("border-t-2 text-end align-top", dayEdge(col))}
                    >
                      {total === undefined
                        ? null
                        : valueTrigger(
                            `total@${round.timeMs}`,
                            { row: visible.length, sub: 0, col },
                            describeTotal(total),
                            cn(
                              "whitespace-nowrap",
                              levelClasses(total.level),
                              total.kind === "incomplete" &&
                                "border border-dashed border-input font-normal text-muted-foreground",
                            ),
                            <>
                              <LevelBox level={total.level} />
                              <span aria-hidden="true">
                                {total.kind === "complete"
                                  ? number.format(total.total)
                                  : messages.incomplete}
                              </span>
                            </>,
                            { "data-severity": total.level?.severity, "data-total": total.kind },
                          )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
}

export { ObservationTable, TOTAL_ROW };
export type { ObservationTableMessages, ObservationTableProps };
