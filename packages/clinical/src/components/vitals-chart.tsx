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
  type RoundTotal,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/cadence/tabs";
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
  /** Read for a change, such as "▲2 since 06:00". */
  since: string;
  /** Before the source's own interpretation, such as "Source: High". */
  source: string;
  /** For a value the schema could not place in a band. */
  notBanded: string;
  incomplete: string;
  missing: string;
  escalated: string;
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
  since: "since",
  source: "Source",
  notBanded: "Not banded",
  incomplete: "Incomplete",
  missing: "Missing",
  escalated: "Raised by a single observation, whatever the sum",
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
  definition?: ObservationSeriesDefinition,
): string {
  const { value } = reading;
  switch (value.kind) {
    case "quantity": {
      const { comparator, value: amount, unitText, ucum } = value.quantity;
      // In the series' own unit, the schema's words for it, such as °C for Cel.
      const unit =
        ucum !== undefined && ucum === definition?.ucum && definition.unitLabel !== undefined
          ? definition.unitLabel
          : (unitText ?? ucum);
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
  /**
   * A total for each round, from `scoreRounds`, drawn as a last track: the total, or Incomplete,
   * at each round, in its level's colour.
   */
  totals?: {
    readonly label: string;
    readonly shortLabel?: string;
    readonly rounds: readonly RoundTotal[];
  };
  messages?: Partial<VitalsChartMessages>;
}

/** The key of the total's track, for the Tracks menu. */
const TOTAL_TRACK = "(total)";

/** Lines of a tooltip, one to a line. */
function Lines({ lines }: { lines: readonly string[] }) {
  return (
    <span className="block">
      {lines.map((line, index) => (
        <span
          key={`${String(index)}:${line}`}
          className={cn("block", index === 0 && "font-semibold")}
        >
          {line}
        </span>
      ))}
    </span>
  );
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
  totals,
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
      now={now}
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
        tracks={[
          ...tracks.map((track) => ({ key: track.key, name: nameOf(track).full })),
          ...(totals ? [{ key: TOTAL_TRACK, name: totals.label }] : []),
        ]}
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
        totals={totals && !hidden.has(TOTAL_TRACK) ? totals : undefined}
        labelStyle={labelStyle}
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
  const isMode = (value: unknown): value is RangeMode =>
    value === "default" || value === "fit-all" || value === "fit-view";
  const isSpan = (value: unknown): value is string =>
    typeof value === "string" && spans.some(({ key }) => key === value);

  return (
    <div data-slot="vitals-chart-toolbar" className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {title}
      {/* A choice that always has an answer, so Tabs. They change the chart below, which is not
          a panel of its own: the range tabs change it too. */}
      <Tabs
        className="shrink-0"
        value={spanKey}
        onValueChange={(value) => {
          if (isSpan(value)) onSpanChange(value);
        }}
      >
        <TabsList aria-label={messages.span}>
          {spans.map((span) => (
            <TabsTrigger key={span.key} value={span.key}>
              {span.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
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
      <Tabs
        className="shrink-0"
        value={mode}
        onValueChange={(value) => {
          if (isMode(value)) onModeChange(value);
        }}
      >
        <TabsList aria-label={messages.range}>
          <TabsTrigger value="default">{messages.rangeDefault}</TabsTrigger>
          <TabsTrigger value="fit-all">{messages.rangeFitAll}</TabsTrigger>
          <TabsTrigger value="fit-view">{messages.rangeFitView}</TabsTrigger>
        </TabsList>
      </Tabs>
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
  totals,
  labelStyle,
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
  totals: VitalsChartProps["totals"];
  labelStyle: LabelStyle;
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

  const describe = (ms: number) => describeTime(ms, { now, timeZone, locale, hourCycle });

  // What a mark's tooltip says: the series in full, the value, its level, when, its change, and
  // what the source said.
  const detailLines = (key: string, reading: InterpretedReading): string[] => {
    const definition = byKey.get(key)?.definition;
    const lines = [
      definition?.label ?? key,
      readingText(reading, number, messages.absent, definition),
    ];
    const { band, previous, sourceLabels } = reading;
    if (band.kind === "level" && band.level.severity !== "severity-0") lines.push(band.level.label);
    if (band.kind === "none" && !["no-bands", "not-banded-kind", "absent"].includes(band.reason)) {
      lines.push(messages.notBanded);
    }
    const at = describe(reading.timeMs);
    lines.push(`${at.day} ${at.time}`);
    if (previous?.change !== undefined && previous.change !== 0) {
      const before = describe(reading.timeMs - previous.elapsedMs);
      const arrow = previous.change > 0 ? "▲" : "▼";
      lines.push(
        `${arrow}${number.format(Math.abs(previous.change))} ${messages.since} ${before.dayKey === at.dayKey ? before.time : `${before.day} ${before.time}`}`,
      );
    }
    if (sourceLabels.length > 0) lines.push(`${messages.source}: ${sourceLabels.join(", ")}`);
    return lines;
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
          detail: <Lines lines={detailLines(key, reading)} />,
          ...(tone === undefined ? {} : { tone }),
        });
      } else {
        points.push({
          timeMs: reading.timeMs,
          value,
          label: number.format(value),
          detail: <Lines lines={detailLines(key, reading)} />,
          ...(tone === undefined ? {} : { tone }),
        });
      }
    }
    return { points, events };
  };

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
        return `${name}: ${readingText(reading, number, messages.absent, definition)}${level}${trend}`;
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
  const name = ({ full, short }: { full: string; short: string }) => {
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
                label={name(nameOf(track))}
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
                  detail: (
                    <>
                      {point.detail}
                      {partner.detail}
                    </>
                  ),
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
                label={name(nameOf(track))}
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
                label={name(nameOf(track))}
                heightPx={track.heightPx ?? 48}
              >
                <TrackChartEvents events={events} />
              </TrackChartTrack>
            );
          }
        }
      })}
      {totals ? (
        <TrackChartTrack
          data-track={TOTAL_TRACK}
          label={name({ full: totals.label, short: labelFor(totals, labelStyle) })}
          heightPx={40}
        >
          <TrackChartEvents
            events={totals.rounds.map((total): TrackEvent => {
              const tone = total.level === undefined ? undefined : TONE[total.level.severity];
              const at = describe(total.timeMs);
              const lines =
                total.kind === "complete"
                  ? [`${totals.label} ${number.format(total.total)}`]
                  : [
                      `${totals.label}: ${messages.incomplete}`,
                      `${messages.missing}: ${total.missing.map((key) => byKey.get(key)?.definition?.label ?? key).join(", ")}`,
                    ];
              if (total.level) lines.push(total.level.label);
              if (total.isEscalated) lines.push(messages.escalated);
              lines.push(`${at.day} ${at.time}`);
              for (const part of total.parts) {
                if (part.score !== 0) {
                  lines.push(
                    `${byKey.get(part.seriesKey)?.definition?.label ?? part.seriesKey} ${number.format(part.score)}`,
                  );
                }
              }
              return {
                timeMs: total.timeMs,
                text: total.kind === "complete" ? number.format(total.total) : messages.incomplete,
                detail: <Lines lines={lines} />,
                ...(tone === undefined ? {} : { tone }),
              };
            })}
          />
        </TrackChartTrack>
      ) : null}
    </TrackChartBody>
  );
}

export { VitalsChart };
export type { VitalsChartMessages, VitalsChartProps, VitalsSpan, VitalsTrack };
