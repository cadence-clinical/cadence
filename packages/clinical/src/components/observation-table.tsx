"use client";

import {
  describeTime,
  groupRounds,
  type InterpretedReading,
  type InterpretedSeries,
  type ObservationValue,
  type SeverityStep,
  type UnbandedReason,
} from "@cadence-clinical/core";
import { useEffect, useRef, type ComponentProps } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/cadence/table";
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
  /** Words to replace the en-AU defaults. */
  messages?: Partial<ObservationTableMessages>;
}

/**
 * A flowsheet of observations: one row per series and one column per round, oldest to newest,
 * opening at the newest. A round is the readings taken within a few minutes of each other, as a
 * set of vital signs is. Each value shows the band a schema gave it, by fill, edge and short
 * label, and its change since the value before. The source's own interpretation is read out and
 * shown on hover beside it.
 */
function ObservationTable({
  series,
  label,
  now,
  timeZone,
  locale = "en-AU",
  hourCycle = "h23",
  roundWindowMs = 5 * 60_000,
  messages: ownMessages,
  className,
  ...props
}: ObservationTableProps) {
  const messages = { ...MESSAGES, ...ownMessages };
  const rootRef = useRef<HTMLDivElement>(null);
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

  const describeReading = (reading: InterpretedReading, unitLabel: string | undefined): string => {
    const unit =
      reading.value.kind === "quantity" ? (ownUnit(reading, unitLabel) ?? unitLabel) : undefined;
    const parts = [
      `${valueText(reading.value, messages, number)}${unit === undefined ? "" : ` ${unit}`}`,
    ];
    if (reading.band.kind === "level") parts.push(reading.band.level.label);
    else if (isUnjudged(reading.band.reason)) parts.push(messages.unbanded[reading.band.reason]);
    const { previous } = reading;
    if (previous?.change !== undefined) {
      const { change } = previous;
      const direction = change > 0 ? messages.up : change < 0 ? messages.down : messages.unchanged;
      const amount = change === 0 ? "" : ` ${number.format(Math.abs(change))}`;
      const before = describe(reading.timeMs - previous.elapsedMs);
      const at = describe(reading.timeMs);
      const when = before.dayKey === at.dayKey ? before.time : `${before.day} ${before.time}`;
      parts.push(`${direction}${amount} ${messages.since} ${when}`);
    }
    if (reading.sourceLabels.length > 0) {
      parts.push(`${messages.source}: ${reading.sourceLabels.join(", ")}`);
    }
    return parts.join(", ");
  };

  return (
    <div
      data-slot="observation-table"
      ref={rootRef}
      className={cn("min-w-0", className)}
      {...props}
    >
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
              <TableHead
                key={round.timeMs}
                className={cn(
                  "border-b text-end",
                  columns[index - 1]?.when.dayKey !== when.dayKey && "border-l",
                )}
              >
                <time dateTime={round.time} title={when.full}>
                  <span className="sr-only">{when.full}</span>
                  <span aria-hidden="true">{when.time}</span>
                </time>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {series.map(({ key, definition, readings }) => {
            const [first] = readings;
            const name =
              definition?.label ?? first?.code.text ?? first?.code.codings[0]?.display ?? key;
            const unitLabel = definition?.unitLabel;
            return (
              <TableRow key={key}>
                <TableHead
                  scope="row"
                  className="sticky left-0 z-10 min-w-32 border-r border-b bg-background font-medium"
                >
                  {name}
                  {unitLabel === undefined ? null : (
                    <span className="block text-control-sm font-normal text-muted-foreground">
                      {unitLabel}
                    </span>
                  )}
                </TableHead>
                {columns.map(({ round, when }, index) => (
                  <TableCell
                    key={round.timeMs}
                    className={cn(
                      "border-b text-end align-top",
                      columns[index - 1]?.when.dayKey !== when.dayKey && "border-l",
                    )}
                  >
                    <span className="flex flex-col items-end gap-0.5">
                      {(round.readings[key] ?? []).map((reading) => (
                        <ObservationValueCell
                          key={reading.id}
                          reading={reading}
                          text={valueText(reading.value, messages, number)}
                          description={describeReading(reading, unitLabel)}
                          unitLabel={unitLabel}
                          number={number}
                        />
                      ))}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/** One value in a cell: its band by fill, edge and short label, and its change. */
function ObservationValueCell({
  reading,
  text,
  description,
  unitLabel,
  number,
}: {
  reading: InterpretedReading;
  text: string;
  description: string;
  unitLabel: string | undefined;
  number: Intl.NumberFormat;
}) {
  const { band, previous, value } = reading;
  const step = band.kind === "level" ? band.level.severity : undefined;
  const isBanded = step !== undefined && step !== "severity-0";
  const isUnjudgedValue = band.kind === "none" && isUnjudged(band.reason);
  const unit = ownUnit(reading, unitLabel);
  const isNumber = value.kind === "quantity" || value.kind === "integer";
  const change = previous?.change;

  return (
    <span
      data-slot="observation-value"
      data-severity={step}
      data-unbanded={band.kind === "none" ? band.reason : undefined}
      title={description}
      className={cn(
        "inline-flex items-baseline gap-1 rounded-sm px-1",
        // A number and its unit stay on one line. Words wrap between words, never inside one.
        isNumber && "whitespace-nowrap",
        isBanded && cn("border font-semibold", BAND_BORDER[step], BAND_FILL[step]),
        isUnjudgedValue && "border border-dashed border-input",
        value.kind === "absent" && "text-muted-foreground",
      )}
    >
      <span className="sr-only">{description}</span>
      {/* The level's short label comes first, in a box of its own, so it cannot be read as part
          of the number beside it. */}
      {isBanded && band.kind === "level" && band.level.short !== "" ? (
        <span
          aria-hidden="true"
          className={cn(
            "self-center rounded-xs border bg-background px-0.5 text-control-sm leading-none",
            BAND_BORDER[step],
          )}
        >
          {band.level.short}
        </span>
      ) : null}
      <span aria-hidden="true">
        {text}
        {unit === undefined ? null : ` ${unit}`}
      </span>
      {isUnjudgedValue ? (
        <span aria-hidden="true" className="text-control-sm text-muted-foreground">
          ?
        </span>
      ) : null}
      {change === undefined ? null : (
        <span aria-hidden="true" className="text-control-sm font-normal text-muted-foreground">
          {change > 0 ? "▲" : change < 0 ? "▼" : "="}
          {change === 0 ? null : number.format(Math.abs(change))}
        </span>
      )}
    </span>
  );
}

export { ObservationTable };
export type { ObservationTableMessages, ObservationTableProps };
