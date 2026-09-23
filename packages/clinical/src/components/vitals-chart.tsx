"use client";

import {
  describeTime,
  groupRounds,
  labelFor,
  type InterpretedReading,
  type InterpretedSeries,
  type LabelStyle,
  type ObservationRound,
  type ObservationSchema,
  type ObservationSeriesDefinition,
  type SeverityStep,
} from "@cadence-clinical/core";
import { ChevronsLeft, ChevronsRight, Rows3 } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";

import { Button } from "@/components/cadence/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/cadence/tooltip";
import {
  TrackChart,
  TrackChartAxis,
  TrackChartBody,
  TrackChartEvents,
  TrackChartLine,
  TrackChartPoints,
  TrackChartRange,
  TrackChartTrack,
  useTrackChart,
  type TrackBand,
  type TrackEvent,
  type TrackMarkedPoint,
  type TrackRange,
  type TrackTone,
} from "@/components/cadence/track-chart";
import { cn } from "@/lib/cn";

const HOUR_MS = 3_600_000;

/** A span of time the chart can show at once. */
interface VitalsSpan {
  readonly key: string;
  /** The span in words, on its toggle, such as "12h". */
  readonly label: string;
  readonly ms: number;
}

const SPANS: readonly VitalsSpan[] = [
  { key: "2h", label: "2h", ms: 2 * HOUR_MS },
  { key: "4h", label: "4h", ms: 4 * HOUR_MS },
  { key: "6h", label: "6h", ms: 6 * HOUR_MS },
  { key: "12h", label: "12h", ms: 12 * HOUR_MS },
  { key: "1d", label: "1d", ms: 24 * HOUR_MS },
  { key: "3d", label: "3d", ms: 72 * HOUR_MS },
];

/**
 * How a track is laid out: one series as a line; a pair such as systolic and diastolic, with
 * another series such as heart rate drawn across it; or answers in words.
 */
type VitalsTrack =
  | {
      readonly kind: "line";
      readonly key: string;
      readonly series: string;
      readonly heightPx?: number;
    }
  | {
      readonly kind: "pair";
      readonly key: string;
      readonly label: string;
      readonly shortLabel?: string;
      /** The series whose bands the track shows. */
      readonly high: string;
      readonly low: string;
      readonly middle?: string;
      /** A series drawn as a line across the pair, such as heart rate. */
      readonly line?: string;
      readonly heightPx?: number;
    }
  | {
      readonly kind: "events";
      readonly key: string;
      readonly label: string;
      readonly shortLabel?: string;
      readonly series: readonly string[];
      readonly heightPx?: number;
    };

/** Which range of values a track shows. */
type RangeMode = "default" | "fit-all" | "fit-view";

/** Every word the chart shows or reads out. The defaults are en-AU. */
interface VitalsChartMessages {
  start: string;
  latest: string;
  tracks: string;
  showTracks: string;
  span: string;
  range: string;
  rangeDefault: string;
  rangeFitAll: string;
  rangeFitView: string;
  absent: string;
  empty: string;
}

const MESSAGES: VitalsChartMessages = {
  start: "Start",
  latest: "Latest",
  tracks: "Tracks",
  showTracks: "Show tracks",
  span: "Time in view",
  range: "Range of values",
  rangeDefault: "Default",
  rangeFitAll: "Fit all",
  rangeFitView: "Fit view",
  absent: "Not recorded",
  empty: "No observations in this period.",
};

const TONE: Readonly<Record<SeverityStep, TrackTone | undefined>> = {
  "severity-0": undefined,
  "severity-1": "severity-1",
  "severity-2": "severity-2",
  "severity-3": "severity-3",
  "severity-4": "severity-4",
  "severity-5": "severity-5",
  "severity-6": "severity-6",
};

function toneOf(reading: InterpretedReading): TrackTone | undefined {
  return reading.band.kind === "level" ? TONE[reading.band.level.severity] : undefined;
}

/**
 * The number to plot for a reading, or undefined when it cannot go on the track's scale: a value
 * in another unit, a bound such as less than 95, or a value not recorded. Those are shown in words
 * at their time instead, so a number is never drawn on the wrong scale.
 */
function plottable(
  reading: InterpretedReading,
  definition: ObservationSeriesDefinition | undefined,
): number | undefined {
  const { value } = reading;
  if (value.kind === "integer")
    return definition?.ucum === "{score}" || definition?.ucum === undefined
      ? value.value
      : undefined;
  if (value.kind !== "quantity" || value.quantity.comparator !== undefined) return undefined;
  return definition?.ucum === undefined || value.quantity.ucum === definition.ucum
    ? value.quantity.value
    : undefined;
}

/** A reading in words, as the source gave it. */
function readingText(
  reading: InterpretedReading,
  number: Intl.NumberFormat,
  absent: string,
): string {
  const { value } = reading;
  switch (value.kind) {
    case "quantity": {
      const { comparator, value: amount, unitText, ucum } = value.quantity;
      const unit = unitText ?? ucum;
      return `${comparator === undefined ? "" : `${comparator} `}${number.format(amount)}${unit === undefined ? "" : ` ${unit}`}`;
    }
    case "integer":
      return number.format(value.value);
    case "concept":
      return (
        value.concept.text ??
        value.concept.codings[0]?.display ??
        value.concept.codings[0]?.code ??
        ""
      );
    case "text":
      return value.text;
    case "boolean":
      return String(value.value);
    case "absent":
      return absent;
  }
}

/** Bands for a track from a series definition. The lowest step has no fill. */
function bandsOf(
  series: InterpretedSeries | undefined,
  levels: ReadonlyMap<string, SeverityStep>,
): TrackBand[] {
  return (series?.definition?.bands ?? []).flatMap((band) => {
    const step = levels.get(band.level);
    const tone = step === undefined ? undefined : TONE[step];
    return tone === undefined
      ? []
      : [
          {
            tone,
            ...(band.from === undefined ? {} : { from: band.from }),
            ...(band.below === undefined ? {} : { below: band.below }),
          },
        ];
  });
}

/** The props of the Vitals chart. */
interface VitalsChartProps extends Omit<ComponentProps<"div">, "children"> {
  /** The series, from `applyObservationSchema`. The chart shows the bands they were given. */
  series: readonly InterpretedSeries[];
  /** The schema the series were interpreted with, for the colour of each of its bands. */
  schema: ObservationSchema;
  /** The tracks, top to bottom, and which series each shows. */
  tracks: readonly VitalsTrack[];
  /** The chart's name, shown and read out, such as "Adult observation chart". */
  label: string;
  /** The moment the chart is read at: ISO 8601 with an offset, or milliseconds. */
  now: string | number;
  timeZone: string;
  locale?: string;
  hourCycle?: "h23" | "h12";
  /** The spans to choose from. Defaults to 2 hours to 3 days. */
  spans?: readonly VitalsSpan[];
  /** The span shown first, by key. Defaults to `1d`. */
  defaultSpan?: string;
  /** Short names, such as RR, or full ones. Defaults to short. */
  labelStyle?: LabelStyle;
  /** Readings within this many milliseconds of a round's first reading are one round. */
  roundWindowMs?: number;
  messages?: Partial<VitalsChartMessages>;
}

/**
 * Vital signs on stacked tracks over one time axis, with the bands an observation schema gave
 * them. Choose the time in view, move to the start or the latest, show and hide tracks, and fit
 * each track's range to the values. A value that cannot go on its track's scale is written at its
 * time instead. Offer the Observation table beside it: the chart shows the shape, the table every
 * value.
 */
function VitalsChart({
  series,
  schema,
  tracks,
  label,
  now,
  timeZone,
  locale = "en-AU",
  hourCycle = "h23",
  spans = SPANS,
  defaultSpan = "1d",
  labelStyle = "short",
  roundWindowMs = 5 * 60_000,
  messages: ownMessages,
  className,
  ...props
}: VitalsChartProps) {
  const messages = { ...MESSAGES, ...ownMessages };
  const [spanKey, setSpanKey] = useState(defaultSpan);
  const [mode, setMode] = useState<RangeMode>("default");
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const span = spans.find(({ key }) => key === spanKey) ?? spans[0] ?? SPANS[4];
  const spanMs = span?.ms ?? 24 * HOUR_MS;

  const rounds = groupRounds(series, roundWindowMs);
  const nowMs = typeof now === "number" ? now : Date.parse(now);
  const firstMs = rounds[0]?.timeMs;
  const lastMs = rounds.at(-1)?.lastTimeMs;

  const title = <h2 className="text-title font-semibold">{label}</h2>;
  if (firstMs === undefined || lastMs === undefined) {
    return (
      <div data-slot="vitals-chart" className={cn("flex flex-col gap-2", className)} {...props}>
        {title}
        <p className="text-body text-muted-foreground">{messages.empty}</p>
      </div>
    );
  }
  // A little room at the start, and up to now at the end, so the newest value is not on the edge.
  const fromMs = Math.min(firstMs, lastMs - spanMs) - HOUR_MS / 2;
  const toMs = Math.max(lastMs + HOUR_MS / 2, Math.min(nowMs, lastMs + spanMs / 4));

  const nameOf = (track: VitalsTrack) => {
    if (track.kind !== "line") return { full: track.label, short: labelFor(track, labelStyle) };
    const definition = series.find(({ key }) => key === track.series)?.definition;
    const full = definition?.label ?? track.series;
    return { full, short: definition ? labelFor(definition, labelStyle) : full };
  };

  return (
    <TrackChart
      data-slot="vitals-chart"
      fromMs={fromMs}
      toMs={toMs}
      spanMs={spanMs}
      timeZone={timeZone}
      locale={locale}
      hourCycle={hourCycle}
      className={className}
      {...props}
    >
      <VitalsToolbar
        title={title}
        spans={spans}
        spanKey={span?.key ?? defaultSpan}
        onSpanChange={setSpanKey}
        mode={mode}
        onModeChange={setMode}
        tracks={tracks.map((track) => ({ key: track.key, name: nameOf(track).full }))}
        hidden={hidden}
        onHiddenChange={setHidden}
        messages={messages}
        timeZone={timeZone}
        locale={locale}
        hourCycle={hourCycle}
        now={now}
      />
      <VitalsTracks
        label={label}
        series={series}
        schema={schema}
        tracks={tracks.filter(({ key }) => !hidden.has(key))}
        rounds={rounds}
        nameOf={nameOf}
        mode={mode}
        messages={messages}
        locale={locale}
        timeZone={timeZone}
        hourCycle={hourCycle}
        now={now}
      />
    </TrackChart>
  );
}

/** The span, Start and Latest, the tracks shown, the range mode, and the dates in view. */
function VitalsToolbar({
  title,
  spans,
  spanKey,
  onSpanChange,
  mode,
  onModeChange,
  tracks,
  hidden,
  onHiddenChange,
  messages,
  timeZone,
  locale,
  hourCycle,
  now,
}: {
  title: ReactNode;
  spans: readonly VitalsSpan[];
  spanKey: string;
  onSpanChange: (key: string) => void;
  mode: RangeMode;
  onModeChange: (mode: RangeMode) => void;
  tracks: readonly { key: string; name: string }[];
  hidden: ReadonlySet<string>;
  onHiddenChange: (hidden: ReadonlySet<string>) => void;
  messages: VitalsChartMessages;
  timeZone: string;
  locale: string;
  hourCycle: "h23" | "h12";
  now: string | number;
}) {
  const { scrollToStart, scrollToEnd, viewFromMs, viewToMs } = useTrackChart();
  const describe = (ms: number) => describeTime(ms, { now, timeZone, locale, hourCycle });
  const from = describe(viewFromMs);
  const to = describe(viewToMs);
  // A choice that must have an answer: pressing the pressed toggle again keeps it pressed.
  const choose = <T extends string>(
    values: unknown[],
    set: (value: T) => void,
    isValue: (value: unknown) => value is T,
  ) => {
    const [next] = values;
    if (isValue(next)) set(next);
  };
  const isMode = (value: unknown): value is RangeMode =>
    value === "default" || value === "fit-all" || value === "fit-view";
  const isSpan = (value: unknown): value is string =>
    typeof value === "string" && spans.some(({ key }) => key === value);

  return (
    <div data-slot="vitals-chart-toolbar" className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {title}
      <ToggleGroup
        aria-label={messages.span}
        size="sm"
        spacing={0}
        value={[spanKey]}
        onValueChange={(values) => {
          choose(values, onSpanChange, isSpan);
        }}
      >
        {spans.map((span) => (
          <ToggleGroupItem key={span.key} value={span.key}>
            {span.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={scrollToStart}>
          <ChevronsLeft aria-hidden data-icon="inline-start" />
          {messages.start}
        </Button>
        <Button variant="ghost" size="sm" onClick={scrollToEnd}>
          {messages.latest}
          <ChevronsRight aria-hidden data-icon="inline-end" />
        </Button>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          <Rows3 aria-hidden data-icon="inline-start" />
          {messages.tracks}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{messages.showTracks}</DropdownMenuLabel>
            {tracks.map(({ key, name }) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={!hidden.has(key)}
                onCheckedChange={(checked) => {
                  const next = new Set(hidden);
                  if (checked) next.delete(key);
                  else next.add(key);
                  onHiddenChange(next);
                }}
              >
                {name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ToggleGroup
        aria-label={messages.range}
        size="sm"
        spacing={0}
        value={[mode]}
        onValueChange={(values) => {
          choose(values, onModeChange, isMode);
        }}
      >
        <ToggleGroupItem value="default">{messages.rangeDefault}</ToggleGroupItem>
        <ToggleGroupItem value="fit-all">{messages.rangeFitAll}</ToggleGroupItem>
        <ToggleGroupItem value="fit-view">{messages.rangeFitView}</ToggleGroupItem>
      </ToggleGroup>
      <p className="ms-auto text-control-sm text-muted-foreground tabular-nums">
        {from.day} {from.time} – {to.day} {to.time}
      </p>
    </div>
  );
}

/** The chart's body: the axis, and a track for each shown track. */
function VitalsTracks({
  label,
  series,
  schema,
  tracks,
  rounds,
  nameOf,
  mode,
  messages,
  locale,
  timeZone,
  hourCycle,
  now,
}: {
  label: string;
  series: readonly InterpretedSeries[];
  schema: ObservationSchema;
  tracks: readonly VitalsTrack[];
  rounds: readonly ObservationRound<InterpretedReading>[];
  nameOf: (track: VitalsTrack) => { full: string; short: string };
  mode: RangeMode;
  messages: VitalsChartMessages;
  locale: string;
  timeZone: string;
  hourCycle: "h23" | "h12";
  now: string | number;
}) {
  const { viewFromMs, viewToMs } = useTrackChart();
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 20 });
  const byKey = new Map(series.map((entry) => [entry.key, entry]));
  const levels = new Map(schema.levels.map((level) => [level.key, level.severity]));

  // The range a track shows: the schema's by default, or fitted to the values.
  const domainOf = (keys: readonly string[]): [number, number] | undefined => {
    const definitions = keys.map((key) => byKey.get(key)?.definition);
    const defaults = definitions.flatMap((definition) =>
      definition?.range ? [definition.range] : [],
    );
    const values = keys.flatMap((key) => {
      const entry = byKey.get(key);
      return (entry?.readings ?? [])
        .filter(({ timeMs }) => mode !== "fit-view" || (timeMs >= viewFromMs && timeMs <= viewToMs))
        .flatMap((reading) => {
          const value = plottable(reading, entry?.definition);
          return value === undefined ? [] : [value];
        });
    });
    if (mode === "default" && defaults.length > 0) {
      return [
        Math.min(...defaults.map(({ min }) => min)),
        Math.max(...defaults.map(({ max }) => max)),
      ];
    }
    if (values.length === 0) return defaults[0] ? [defaults[0].min, defaults[0].max] : undefined;
    const low = Math.min(...values);
    const high = Math.max(...values);
    const pad = Math.max((high - low) * 0.15, Math.abs(high) * 0.02, 1);
    return [low - pad, high + pad];
  };

  const pointsOf = (key: string): { points: TrackMarkedPoint[]; events: TrackEvent[] } => {
    const entry = byKey.get(key);
    const points: TrackMarkedPoint[] = [];
    const events: TrackEvent[] = [];
    for (const reading of entry?.readings ?? []) {
      const value = plottable(reading, entry?.definition);
      const tone = toneOf(reading);
      if (value === undefined) {
        events.push({
          timeMs: reading.timeMs,
          text: readingText(reading, number, messages.absent),
          ...(tone === undefined ? {} : { tone }),
        });
      } else {
        points.push({
          timeMs: reading.timeMs,
          value,
          label: number.format(value),
          ...(tone === undefined ? {} : { tone }),
        });
      }
    }
    return { points, events };
  };

  const describe = (ms: number) => describeTime(ms, { now, timeZone, locale, hourCycle });

  // The crosshair snaps to the nearest round, and lists its values as the table would.
  const nearestRound = (timeMs: number) =>
    rounds.reduce<ObservationRound<InterpretedReading> | undefined>(
      (best, round) =>
        best === undefined || Math.abs(round.timeMs - timeMs) < Math.abs(best.timeMs - timeMs)
          ? round
          : best,
      undefined,
    );
  const renderCrosshair = (timeMs: number) => {
    const round = nearestRound(timeMs);
    if (!round) return null;
    const lines = Object.entries(round.readings).flatMap(([key, readings]) => {
      const definition = byKey.get(key)?.definition;
      const name = definition?.label ?? key;
      return readings.map((reading) => {
        const level =
          reading.band.kind === "level" && reading.band.level.severity !== "severity-0"
            ? `, ${reading.band.level.label}`
            : "";
        const change = reading.previous?.change;
        const trend =
          change === undefined || change === 0
            ? ""
            : ` ${change > 0 ? "▲" : "▼"}${number.format(Math.abs(change))}`;
        return `${name}: ${readingText(reading, number, messages.absent)}${level}${trend}`;
      });
    });
    const when = describe(round.timeMs);
    return (
      <span className="block">
        <span className="block font-semibold">
          {when.day} {when.time}
        </span>
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </span>
    );
  };

  // A short name shows its full name on hover, and a screen reader reads the full name.
  const name = (track: VitalsTrack) => {
    const { full, short } = nameOf(track);
    if (short === full) return full;
    return (
      <Tooltip>
        <TooltipTrigger render={<span data-slot="vitals-track-name" />}>
          <span aria-hidden="true">{short}</span>
          <span className="sr-only">{full}</span>
        </TooltipTrigger>
        <TooltipContent>{full}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TrackChartBody
      label={label}
      snapTimes={rounds.map(({ timeMs }) => timeMs)}
      renderCrosshair={renderCrosshair}
    >
      <TrackChartAxis />
      {tracks.map((track) => {
        switch (track.kind) {
          case "line": {
            const entry = byKey.get(track.series);
            const { points, events } = pointsOf(track.series);
            return (
              <TrackChartTrack
                key={track.key}
                data-track={track.key}
                label={name(track)}
                description={entry?.definition?.unitLabel}
                domain={domainOf([track.series])}
                bands={bandsOf(entry, levels)}
                heightPx={track.heightPx ?? 88}
              >
                <TrackChartLine points={points} />
                <TrackChartPoints points={points} />
                <TrackChartEvents events={events} />
              </TrackChartTrack>
            );
          }
          case "pair": {
            const high = pointsOf(track.high);
            const low = pointsOf(track.low);
            const middle = track.middle === undefined ? undefined : pointsOf(track.middle);
            const line = track.line === undefined ? undefined : pointsOf(track.line);
            const lowAt = new Map(low.points.map((point) => [point.timeMs, point]));
            const middleOf = (timeMs: number, lowMs: number) =>
              middle?.points.find((point) => point.timeMs === timeMs || point.timeMs === lowMs)
                ?.value;
            // A pair is the high and low values of one round.
            const ranges: TrackRange[] = high.points.flatMap((point) => {
              const round = rounds.find(
                (candidate) =>
                  point.timeMs >= candidate.timeMs && point.timeMs <= candidate.lastTimeMs,
              );
              const partner =
                lowAt.get(point.timeMs) ??
                low.points.find(
                  (candidate) =>
                    round !== undefined &&
                    candidate.timeMs >= round.timeMs &&
                    candidate.timeMs <= round.lastTimeMs,
                );
              if (!partner) return [];
              const between = middleOf(point.timeMs, partner.timeMs);
              return [
                {
                  timeMs: point.timeMs,
                  high: point.value,
                  low: partner.value,
                  highLabel: point.label ?? "",
                  lowLabel: partner.label ?? "",
                  ...(between === undefined ? {} : { middle: between }),
                  ...(point.tone === undefined ? {} : { tone: point.tone }),
                },
              ];
            });
            const keys = [track.high, track.low, ...(track.line === undefined ? [] : [track.line])];
            const lineUnit =
              track.line === undefined ? undefined : byKey.get(track.line)?.definition?.unitLabel;
            const pairUnit = byKey.get(track.high)?.definition?.unitLabel;
            return (
              <TrackChartTrack
                key={track.key}
                data-track={track.key}
                label={name(track)}
                description={[pairUnit, lineUnit].filter(Boolean).join(" · ")}
                domain={domainOf(keys)}
                bands={bandsOf(byKey.get(track.high), levels)}
                heightPx={track.heightPx ?? 140}
              >
                <TrackChartRange ranges={ranges} />
                {line ? (
                  <>
                    <TrackChartLine points={line.points} className="stroke-primary" />
                    {/* No printed values across a pair: they would print over the pair's own.
                        Every value is in the crosshair's tooltip. */}
                    <TrackChartPoints
                      points={line.points.map(({ label: _label, ...point }) => point)}
                      pointClassName="fill-primary"
                    />
                  </>
                ) : null}
                <TrackChartEvents
                  events={[...high.events, ...low.events, ...(line?.events ?? [])].sort(
                    (a, b) => a.timeMs - b.timeMs,
                  )}
                />
              </TrackChartTrack>
            );
          }
          case "events": {
            const events = track.series
              .flatMap((key) =>
                (byKey.get(key)?.readings ?? []).map((reading): TrackEvent => {
                  const tone = toneOf(reading);
                  return {
                    timeMs: reading.timeMs,
                    text: readingText(reading, number, messages.absent),
                    ...(tone === undefined ? {} : { tone }),
                  };
                }),
              )
              .sort((a, b) => a.timeMs - b.timeMs);
            return (
              <TrackChartTrack
                key={track.key}
                data-track={track.key}
                label={name(track)}
                heightPx={track.heightPx ?? 48}
              >
                <TrackChartEvents events={events} />
              </TrackChartTrack>
            );
          }
        }
      })}
    </TrackChartBody>
  );
}

export { VitalsChart };
export type { VitalsChartMessages, VitalsChartProps, VitalsSpan, VitalsTrack };
