"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import {
  intervalForSpan,
  linearScale,
  niceTicks,
  timeTicks,
  type TimeTick,
} from "@/lib/chart-scale";
import { cn } from "@/lib/cn";

/**
 * The severity steps a band or a point can take its colour from. They are fixed tokens, the same
 * in every theme, and a band always has words or a shape beside its colour.
 */
type TrackTone =
  "severity-1" | "severity-2" | "severity-3" | "severity-4" | "severity-5" | "severity-6";

// Each class written out whole, so Tailwind finds it.
const BAND_FILL: Readonly<Record<TrackTone, string>> = {
  "severity-1": "fill-severity-1-subtle",
  "severity-2": "fill-severity-2-subtle",
  "severity-3": "fill-severity-3-subtle",
  "severity-4": "fill-severity-4-subtle",
  "severity-5": "fill-severity-5-subtle",
  "severity-6": "fill-severity-6-subtle",
};
const MARK_FILL: Readonly<Record<TrackTone, string>> = {
  "severity-1": "fill-severity-1",
  "severity-2": "fill-severity-2",
  "severity-3": "fill-severity-3",
  "severity-4": "fill-severity-4",
  "severity-5": "fill-severity-5",
  "severity-6": "fill-severity-6",
};

/** The width of the column of track names, and the plot's width before it has been measured. */
const LABEL_WIDTH_PX = 160;
const DEFAULT_PLOT_WIDTH_PX = 720;

interface TrackChartContextValue {
  readonly fromMs: number;
  readonly toMs: number;
  readonly spanMs: number;
  readonly pxPerMs: number;
  readonly contentWidthPx: number;
  /** The part of time in view, with a margin of one span either side, so a scroll finds it drawn. */
  readonly drawnFromMs: number;
  readonly drawnToMs: number;
  /** The first moment in view. */
  readonly viewStartMs: number;
  readonly ticks: readonly TimeTick[];
  readonly timeZone: string;
  readonly locale: string;
  readonly hourCycle: "h23" | "h12";
  readonly crosshairMs: number | undefined;
  readonly x: (timeMs: number) => number;
  readonly setPlotWidth: (widthPx: number) => void;
  readonly setViewStart: (timeMs: number) => void;
  readonly setCrosshair: (timeMs: number | undefined) => void;
  readonly scroller: { current: HTMLDivElement | null };
}

const TrackChartContext = createContext<TrackChartContextValue | null>(null);

function useTrackChartContext(part: string): TrackChartContextValue {
  const context = use(TrackChartContext);
  if (!context) throw new Error(`${part} must be inside a TrackChart.`);
  return context;
}

/** What a toolbar inside a TrackChart can do: move to the start or the end of the data. */
interface TrackChartControls {
  readonly scrollToStart: () => void;
  readonly scrollToEnd: () => void;
  /** The first and last moments in view. */
  readonly viewFromMs: number;
  readonly viewToMs: number;
}

/** The controls of the TrackChart around the calling component. */
function useTrackChart(): TrackChartControls {
  const { scroller, viewStartMs, spanMs, fromMs, toMs } = useTrackChartContext("useTrackChart");
  const viewFromMs = Math.min(Math.max(fromMs, viewStartMs), toMs);
  return {
    scrollToStart: () => {
      scroller.current?.scrollTo({ left: 0 });
    },
    scrollToEnd: () => {
      const box = scroller.current;
      if (box) box.scrollTo({ left: box.scrollWidth });
    },
    viewFromMs,
    viewToMs: Math.min(viewFromMs + spanMs, toMs),
  };
}

/** The props of TrackChart. */
interface TrackChartProps extends ComponentProps<"div"> {
  /** The first and last moments the chart can scroll to, in milliseconds since the epoch. */
  fromMs: number;
  toMs: number;
  /** How much time is in view at once, in milliseconds. */
  spanMs: number;
  /** The IANA time zone the axis is drawn in, such as `Australia/Melbourne`. */
  timeZone: string;
  /** Defaults to `en-AU`. */
  locale?: string;
  /** Defaults to the 24 hour clock. */
  hourCycle?: "h23" | "h12";
}

/**
 * A chart of tracks on one shared time axis, which scrolls sideways through time. Put a toolbar,
 * a `TrackChartBody` holding a `TrackChartAxis` and the tracks, and anything else inside it. Only
 * the time in view, and a span either side, is drawn, so a long record costs no more than a short
 * one. It opens at the latest time.
 */
function TrackChart({
  fromMs,
  toMs,
  spanMs,
  timeZone,
  locale = "en-AU",
  hourCycle = "h23",
  className,
  children,
  ...props
}: TrackChartProps) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const [plotWidthPx, setPlotWidth] = useState(DEFAULT_PLOT_WIDTH_PX);
  // Until the body has scrolled, the view is the latest span.
  const [viewStartMs, setViewStart] = useState(Math.max(fromMs, toMs - spanMs));
  const [crosshairMs, setCrosshair] = useState<number | undefined>(undefined);

  const pxPerMs = plotWidthPx / spanMs;
  const contentWidthPx = Math.max(plotWidthPx, (toMs - fromMs) * pxPerMs);
  // Never beyond the data: a tick or a stripe past the end would widen what scrolls.
  const drawnFromMs = Math.max(fromMs, viewStartMs - spanMs);
  const drawnToMs = Math.min(toMs, viewStartMs + 2 * spanMs);
  const interval = intervalForSpan(spanMs);
  // Ticks are worked out per interval, not per scroll position, so scrolling does not redo them.
  const tickFrom = Math.floor(drawnFromMs / (interval * 60_000)) * interval * 60_000;
  const ticks = useMemo(
    () => timeTicks(tickFrom, tickFrom + 4 * spanMs, interval, timeZone),
    [tickFrom, spanMs, interval, timeZone],
  );

  const value: TrackChartContextValue = {
    fromMs,
    toMs,
    spanMs,
    pxPerMs,
    contentWidthPx,
    drawnFromMs,
    drawnToMs,
    viewStartMs,
    ticks,
    timeZone,
    locale,
    hourCycle,
    crosshairMs,
    x: (timeMs) => (timeMs - fromMs) * pxPerMs,
    setPlotWidth,
    setViewStart,
    setCrosshair,
    scroller,
  };

  return (
    <TrackChartContext value={value}>
      <div
        data-slot="track-chart"
        className={cn("flex min-w-0 flex-col gap-2", className)}
        {...props}
      >
        {children}
      </div>
    </TrackChartContext>
  );
}

/** The props of TrackChartBody. */
interface TrackChartBodyProps extends ComponentProps<"div"> {
  /** The chart's name, for a screen reader, such as "Vital signs". */
  label: string;
  /**
   * The moments the arrow keys move the crosshair between, such as the time of each round of
   * observations. Without them, the arrow keys move by a tenth of the span.
   */
  snapTimes?: readonly number[];
  /** What the crosshair shows at a moment: the values there, for a tooltip and a screen reader. */
  renderCrosshair?: (timeMs: number) => ReactNode;
  /** How to read the keyboard, for a screen reader. */
  instructions?: string;
}

/**
 * The part of the chart that scrolls: the axis and the tracks. It is one stop for the keyboard.
 * The arrow keys move a crosshair through time, Home and End go to the first and last moments,
 * and Escape hides the crosshair. What the crosshair shows is also read out.
 */
function TrackChartBody({
  label,
  snapTimes = [],
  renderCrosshair,
  instructions = "Use the left and right arrow keys to move through time.",
  className,
  children,
  ...props
}: TrackChartBodyProps) {
  const chart = useTrackChartContext("TrackChartBody");
  const {
    scroller,
    setPlotWidth,
    setViewStart,
    setCrosshair,
    crosshairMs,
    fromMs,
    toMs,
    pxPerMs,
    x,
  } = chart;
  const instructionsId = useId();
  const [isFromKeyboard, setIsFromKeyboard] = useState(false);

  // Measure the plot, and follow the scroll so only what is near the view is drawn.
  useEffect(() => {
    const box = scroller.current;
    if (!box) return;
    let frame = 0;
    const measure = () => {
      setPlotWidth(Math.max(1, box.clientWidth - LABEL_WIDTH_PX));
    };
    const follow = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setViewStart(fromMs + box.scrollLeft / pxPerMs);
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    box.addEventListener("scroll", follow, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      box.removeEventListener("scroll", follow);
    };
  }, [scroller, setPlotWidth, setViewStart, fromMs, pxPerMs]);

  const { spanMs } = chart;
  // Open at the latest time, and stay there as the chart is measured and grows, or the span
  // changes, until the reader scrolls back through time.
  useEffect(() => {
    const box = scroller.current;
    const content = box?.firstElementChild?.nextElementSibling;
    if (!box) return;
    let isPinned = true;
    let pinnedLeft = 0;
    const pin = () => {
      if (!isPinned) return;
      box.scrollTo({ left: box.scrollWidth });
      pinnedLeft = box.scrollLeft;
    };
    // Only a scroll back towards earlier times lets go.
    const follow = () => {
      // At the end first: when the content narrows, the browser pulls the scroll back to the new
      // end, which is not the reader scrolling away.
      if (box.scrollLeft + box.clientWidth >= box.scrollWidth - 1) isPinned = true;
      else if (box.scrollLeft < pinnedLeft - 1) isPinned = false;
    };
    pin();
    const observer = new ResizeObserver(pin);
    observer.observe(box);
    if (content) observer.observe(content);
    box.addEventListener("scroll", follow, { passive: true });
    return () => {
      observer.disconnect();
      box.removeEventListener("scroll", follow);
    };
  }, [scroller, spanMs, toMs]);

  const timeAt = useCallback(
    (clientX: number): number | undefined => {
      const box = scroller.current;
      if (!box) return undefined;
      const left = clientX - box.getBoundingClientRect().left + box.scrollLeft - LABEL_WIDTH_PX;
      if (left < 0) return undefined;
      return Math.min(toMs, Math.max(fromMs, fromMs + left / pxPerMs));
    },
    [scroller, fromMs, toMs, pxPerMs],
  );

  // With snap times, the crosshair goes to the nearest, so its line and what it shows agree.
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    setIsFromKeyboard(false);
    const at = timeAt(event.clientX);
    if (at === undefined || snapTimes.length === 0) {
      setCrosshair(at);
      return;
    }
    setCrosshair(
      snapTimes.reduce((best, time) => (Math.abs(time - at) < Math.abs(best - at) ? time : best)),
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const sorted = [...snapTimes].sort((a, b) => a - b);
    const current = crosshairMs ?? sorted.at(-1) ?? toMs;
    const step = chart.spanMs / 10;
    let next: number | undefined;
    switch (event.key) {
      case "ArrowRight":
        next =
          sorted.length > 0
            ? sorted.find((time) => time > current)
            : Math.min(toMs, current + step);
        break;
      case "ArrowLeft":
        next =
          sorted.length > 0
            ? sorted.findLast((time) => time < current)
            : Math.max(fromMs, current - step);
        break;
      case "Home":
        next = sorted[0] ?? fromMs;
        break;
      case "End":
        next = sorted.at(-1) ?? toMs;
        break;
      case "Escape":
        setCrosshair(undefined);
        return;
      default:
        return;
    }
    event.preventDefault();
    if (next === undefined) return;
    setIsFromKeyboard(true);
    setCrosshair(next);
    // Keep the crosshair in view.
    const box = scroller.current;
    if (box) {
      const left = x(next);
      const width = box.clientWidth - LABEL_WIDTH_PX;
      if (left < box.scrollLeft || left > box.scrollLeft + width) {
        box.scrollTo({ left: left - width / 2 });
      }
    }
  };

  const crosshair = crosshairMs === undefined ? null : renderCrosshair?.(crosshairMs);

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the chart is operated from the keyboard and the pointer, as its instructions say
    <div
      data-slot="track-chart-body"
      ref={scroller}
      role="group"
      aria-roledescription="chart"
      aria-label={label}
      aria-describedby={instructionsId}
      // One stop for the keyboard. The arrow keys move the crosshair, and a scrolling box must take
      // focus or a keyboard could not reach what is out of view.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the chart is operated from the keyboard, as its instructions say
      tabIndex={0}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        if (!isFromKeyboard) setCrosshair(undefined);
      }}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        setCrosshair(undefined);
      }}
      className={cn(
        "relative min-w-0 overflow-x-auto rounded-md border outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    >
      <span id={instructionsId} className="sr-only">
        {instructions}
      </span>
      {/* Clipped across, so a label at the last moment cannot widen what scrolls. */}
      <div
        className="relative overflow-x-clip"
        style={{ width: LABEL_WIDTH_PX + chart.contentWidthPx }}
      >
        {children}
        {crosshairMs === undefined ? null : (
          <TrackChartCrosshair timeMs={crosshairMs} content={crosshair} />
        )}
      </div>
      {/* What the crosshair shows, read out when the keyboard moves it. */}
      <div aria-live="polite" className="sr-only">
        {isFromKeyboard ? crosshair : null}
      </div>
    </div>
  );
}

/** The vertical line at the crosshair's moment, its time, and what it shows. */
function TrackChartCrosshair({ timeMs, content }: { timeMs: number; content: ReactNode }) {
  const { x, contentWidthPx, timeZone, locale, hourCycle } =
    useTrackChartContext("TrackChartCrosshair");
  const left = LABEL_WIDTH_PX + x(timeMs);
  // The tooltip sits right of the line, and flips left near the end so it stays in the chart.
  const isNearEnd = x(timeMs) > contentWidthPx - 240;
  const time = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: hourCycle === "h23" ? "2-digit" : "numeric",
    minute: "2-digit",
    hourCycle,
  }).format(timeMs);
  return (
    <div
      data-slot="track-chart-crosshair"
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 z-20 w-px bg-foreground/60"
      style={{ left }}
    >
      <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded-sm bg-foreground px-1 text-control-sm text-background tabular-nums">
        {time}
      </span>
      {content ? (
        // The look of a Tooltip. It follows the pointer, which a tooltip anchored to a trigger
        // cannot, so it is drawn here.
        <div
          data-slot="track-chart-tooltip"
          className={cn(
            "absolute top-8 w-max max-w-xs rounded-md bg-foreground px-2 py-1 text-control-sm leading-snug text-background",
            isNearEnd ? "right-2" : "left-2",
          )}
        >
          {content}
        </div>
      ) : null}
    </div>
  );
}

/** The props of TrackChartAxis. */
interface TrackChartAxisProps extends ComponentProps<"div"> {
  /** Shown above the column of track names. */
  label?: ReactNode;
}

/** The time axis: the time at each tick, and the date where a day starts. */
function TrackChartAxis({ label, className, ...props }: TrackChartAxisProps) {
  const { ticks, x, drawnFromMs, drawnToMs, timeZone, locale, hourCycle, contentWidthPx } =
    useTrackChartContext("TrackChartAxis");
  const time = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: hourCycle === "h23" ? "2-digit" : "numeric",
    minute: "2-digit",
    hourCycle,
  });
  const date = new Intl.DateTimeFormat(locale, { timeZone, day: "numeric", month: "short" });
  return (
    <div
      data-slot="track-chart-axis"
      aria-hidden="true"
      className={cn("flex h-10 border-b", className)}
      {...props}
    >
      <div
        className="sticky left-0 z-10 shrink-0 border-r bg-background px-container-sm text-control-sm text-muted-foreground"
        style={{ width: LABEL_WIDTH_PX }}
      >
        {label}
      </div>
      <div className="relative" style={{ width: contentWidthPx }}>
        {ticks
          .filter(({ timeMs }) => timeMs >= drawnFromMs && timeMs <= drawnToMs)
          .map(({ timeMs, isDayStart }) => (
            <span
              key={timeMs}
              className="absolute top-1 -translate-x-1/2 text-center text-control-sm leading-tight whitespace-nowrap tabular-nums"
              style={{ left: x(timeMs) }}
            >
              {time.format(timeMs)}
              {isDayStart ? (
                <span className="block text-muted-foreground">{date.format(timeMs)}</span>
              ) : null}
            </span>
          ))}
      </div>
    </div>
  );
}

/** A band behind a track's values, from one value to another, in a step's colour. */
interface TrackBand {
  readonly from?: number;
  readonly below?: number;
  readonly tone: TrackTone;
}

interface TrackContextValue {
  readonly y: (value: number) => number;
  readonly heightPx: number;
}

const TrackContext = createContext<TrackContextValue | null>(null);

function useTrack(part: string): TrackContextValue & TrackChartContextValue {
  const chart = useTrackChartContext(part);
  const track = use(TrackContext);
  if (!track) throw new Error(`${part} must be inside a TrackChartTrack.`);
  return { ...chart, ...track };
}

/** The props of TrackChartTrack. */
interface TrackChartTrackProps extends Omit<ComponentProps<"div">, "children"> {
  /** The track's name, such as "Respiratory rate". */
  label: ReactNode;
  /** A line under the name, such as the unit. */
  description?: ReactNode;
  /** The range of values the track shows, bottom to top. Leave it out for a track of events. */
  domain?: readonly [number, number];
  /** Bands behind the values, from the schema's levels. */
  bands?: readonly TrackBand[];
  /** The track's height in pixels. */
  heightPx?: number;
  /** The track's marks: lines, points, ranges and events. */
  children?: ReactNode;
}

/**
 * One track: its name on the left, which stays in place as the chart scrolls, and its values on
 * the shared time axis, over its bands and the alternating stripes of time.
 */
function TrackChartTrack({
  label,
  description,
  domain,
  bands = [],
  heightPx = 72,
  className,
  children,
  ...props
}: TrackChartTrackProps) {
  const { contentWidthPx, ticks, x, drawnFromMs, drawnToMs } =
    useTrackChartContext("TrackChartTrack");
  const padding = 10;
  const y = domain ? linearScale(domain, [heightPx - padding, padding]) : () => heightPx / 2;
  const visibleTicks = ticks.filter(({ timeMs }) => timeMs <= drawnToMs);
  const axisTicks = domain ? niceTicks(domain[0], domain[1], heightPx >= 96 ? 4 : 2) : [];

  return (
    <TrackContext value={{ y, heightPx }}>
      <div
        data-slot="track-chart-track"
        className={cn("flex border-b last:border-b-0", className)}
        {...props}
      >
        <div
          className="sticky left-0 z-10 flex shrink-0 justify-between gap-1 border-r bg-background px-container-sm py-1"
          style={{ width: LABEL_WIDTH_PX, height: heightPx }}
        >
          <div className="min-w-0">
            <div className="text-control-sm font-medium">{label}</div>
            {description === undefined ? null : (
              <div className="text-control-sm text-muted-foreground">{description}</div>
            )}
          </div>
          {axisTicks.length > 0 ? (
            <div
              aria-hidden="true"
              className="relative w-8 shrink-0 text-end text-control-sm text-muted-foreground tabular-nums"
            >
              {axisTicks.map((tick) => (
                <span
                  key={tick}
                  className="absolute right-0 -translate-y-1/2"
                  // Kept inside the track, so the top tick does not run into the track above.
                  style={{ top: Math.min(Math.max(y(tick) - 4, 6), heightPx - 10) }}
                >
                  {tick}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <svg
          aria-hidden="true"
          width={contentWidthPx}
          height={heightPx}
          className="block shrink-0 overflow-visible"
        >
          {/* Alternate intervals of time are shaded, so the reader keeps their place. */}
          {visibleTicks.map((tick, index) => {
            const next = visibleTicks[index + 1];
            if (
              tick.stripe === 0 ||
              tick.timeMs < drawnFromMs - (next ? next.timeMs - tick.timeMs : 0)
            )
              return null;
            return (
              <rect
                key={tick.timeMs}
                x={x(tick.timeMs)}
                width={Math.max(0, x(next?.timeMs ?? drawnToMs) - x(tick.timeMs))}
                y={0}
                height={heightPx}
                className="fill-muted"
              />
            );
          })}
          {domain
            ? bands.map((band) => {
                const top = y(Math.min(band.below ?? domain[1], domain[1]));
                const bottom = y(Math.max(band.from ?? domain[0], domain[0]));
                if (bottom <= top) return null;
                return (
                  <rect
                    key={`${band.from ?? "-"}:${band.below ?? "+"}`}
                    data-tone={band.tone}
                    x={0}
                    width={contentWidthPx}
                    y={top}
                    height={bottom - top}
                    className={cn(BAND_FILL[band.tone], "opacity-80")}
                  />
                );
              })
            : null}
          {children}
        </svg>
      </div>
    </TrackContext>
  );
}

/** A value at a moment, for a line or a point. */
interface TrackPoint {
  readonly timeMs: number;
  readonly value: number;
}

/** The points near the view, with one either side so a line runs off the edge. */
function nearView<T extends { readonly timeMs: number }>(
  items: readonly T[],
  fromMs: number,
  toMs: number,
): T[] {
  const first = items.findIndex(({ timeMs }) => timeMs >= fromMs);
  if (first === -1) return items.slice(-1);
  let last = first;
  while (last < items.length && (items[last]?.timeMs ?? Infinity) <= toMs) last += 1;
  return items.slice(Math.max(0, first - 1), last + 1);
}

/** The props of TrackChartLine. */
interface TrackChartLineProps extends Omit<ComponentProps<"path">, "points"> {
  /** The values, oldest first. */
  points: readonly TrackPoint[];
}

/** A line through a track's values, oldest to newest. */
function TrackChartLine({ points, className, ...props }: TrackChartLineProps) {
  const { x, y, drawnFromMs, drawnToMs } = useTrack("TrackChartLine");
  const shown = nearView(points, drawnFromMs, drawnToMs);
  if (shown.length < 2) return null;
  const d = shown
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.timeMs)},${y(point.value)}`)
    .join("");
  return (
    <path
      data-slot="track-chart-line"
      d={d}
      className={cn("fill-none stroke-muted-foreground stroke-[1.5]", className)}
      {...props}
    />
  );
}

/** A value to mark, with its label and the step of a band it is in. */
interface TrackMarkedPoint extends TrackPoint {
  /** Printed beside the point, such as "92". */
  readonly label?: string;
  /** The band's step. A point in a band is drawn larger, ringed, and in its colour. */
  readonly tone?: TrackTone;
}

/** The props of TrackChartPoints. */
interface TrackChartPointsProps extends Omit<ComponentProps<"g">, "points"> {
  points: readonly TrackMarkedPoint[];
  /** The fill of a point in no band, such as `fill-primary` to match its line. */
  pointClassName?: string;
  /** The least room, in pixels, between two printed labels. Labels closer than this are left off. */
  labelGapPx?: number;
}

/**
 * A mark at each value, with its label printed above it. Where labels would collide, a value in a
 * band and the newest value keep theirs and others are left off: every value is still in the
 * crosshair's tooltip.
 */
function TrackChartPoints({
  points,
  labelGapPx = 26,
  pointClassName = "fill-foreground",
  className,
  ...props
}: TrackChartPointsProps) {
  const { x, y, drawnFromMs, drawnToMs } = useTrack("TrackChartPoints");
  const shown = nearView(points, drawnFromMs, drawnToMs);
  const newest = points.at(-1);

  // Banded values first, then the newest, then the rest, newest first.
  const priority = (point: TrackMarkedPoint) =>
    point.tone !== undefined ? 0 : point === newest ? 1 : 2;
  const placed: number[] = [];
  const labelled = new Set<TrackMarkedPoint>();
  for (const point of [...shown].sort((a, b) => priority(a) - priority(b) || b.timeMs - a.timeMs)) {
    if (point.label === undefined) continue;
    const left = x(point.timeMs);
    if (placed.every((other) => Math.abs(other - left) >= labelGapPx)) {
      placed.push(left);
      labelled.add(point);
    }
  }

  return (
    <g data-slot="track-chart-points" className={className} {...props}>
      {shown.map((point) => {
        const cx = x(point.timeMs);
        const cy = y(point.value);
        return (
          <g key={point.timeMs} data-tone={point.tone}>
            <circle
              cx={cx}
              cy={cy}
              r={point.tone === undefined ? 3 : 5}
              className={cn(
                point.tone === undefined ? pointClassName : MARK_FILL[point.tone],
                // A ring sets a banded value apart by shape as well as colour.
                point.tone !== undefined && "stroke-background stroke-2",
              )}
            />
            {labelled.has(point) ? (
              <text
                x={cx}
                y={cy - 8}
                textAnchor="middle"
                className={cn(
                  "fill-foreground text-[11px] tabular-nums",
                  point.tone !== undefined && "font-semibold",
                )}
              >
                {point.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

/** A pair of values at a moment, such as systolic and diastolic, and one between them. */
interface TrackRange {
  readonly timeMs: number;
  readonly high: number;
  readonly low: number;
  /** A value between, such as the mean arterial pressure, marked with a cross. */
  readonly middle?: number;
  readonly highLabel?: string;
  readonly lowLabel?: string;
  readonly tone?: TrackTone;
}

/** The props of TrackChartRange. */
interface TrackChartRangeProps extends ComponentProps<"g"> {
  ranges: readonly TrackRange[];
}

/**
 * A pair of values at each moment, joined: the high one marked with a triangle pointing down onto
 * the line, the low one with a triangle pointing up, as paper charts mark blood pressure.
 */
function TrackChartRange({ ranges, className, ...props }: TrackChartRangeProps) {
  const { x, y, drawnFromMs, drawnToMs } = useTrack("TrackChartRange");
  return (
    <g data-slot="track-chart-range" className={className} {...props}>
      {nearView(ranges, drawnFromMs, drawnToMs).map((range) => {
        const cx = x(range.timeMs);
        const top = y(range.high);
        const bottom = y(range.low);
        const fill = range.tone === undefined ? "fill-foreground" : MARK_FILL[range.tone];
        return (
          <g key={range.timeMs} data-tone={range.tone}>
            <line x1={cx} x2={cx} y1={top} y2={bottom} className="stroke-muted-foreground" />
            <path d={`M${cx - 5},${top - 6}L${cx + 5},${top - 6}L${cx},${top}Z`} className={fill} />
            <path
              d={`M${cx - 5},${bottom + 6}L${cx + 5},${bottom + 6}L${cx},${bottom}Z`}
              className={fill}
            />
            {range.middle === undefined ? null : (
              <path
                d={`M${cx - 3},${y(range.middle) - 3}L${cx + 3},${y(range.middle) + 3}M${cx + 3},${y(range.middle) - 3}L${cx - 3},${y(range.middle) + 3}`}
                className="stroke-foreground stroke-[1.5]"
              />
            )}
            {range.highLabel === undefined ? null : (
              <text
                x={cx}
                y={top - 9}
                textAnchor="middle"
                className="fill-foreground text-[11px] tabular-nums"
              >
                {range.highLabel}
              </text>
            )}
            {range.lowLabel === undefined ? null : (
              <text
                x={cx}
                y={bottom + 17}
                textAnchor="middle"
                className="fill-foreground text-[11px] tabular-nums"
              >
                {range.lowLabel}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Something recorded at a moment in words, such as the device oxygen was given by. */
interface TrackEvent {
  readonly timeMs: number;
  readonly text: string;
  readonly tone?: TrackTone;
}

/** The props of TrackChartEvents. */
interface TrackChartEventsProps extends ComponentProps<"g"> {
  events: readonly TrackEvent[];
}

/**
 * Words at moments, each on a short tick. An event is never cut short: it is written in full, and
 * one that would run into the next moves down a lane.
 */
function TrackChartEvents({ events, className, ...props }: TrackChartEventsProps) {
  const { x, heightPx, drawnFromMs, drawnToMs } = useTrack("TrackChartEvents");
  const shown = nearView(events, drawnFromMs, drawnToMs);
  // Estimate each event's width from its length, to move a crowded one to the next lane.
  const lanes: number[] = [];
  const placed = shown.map((event) => {
    const left = x(event.timeMs);
    const right = left + 12 + event.text.length * 6.5;
    let lane = lanes.findIndex((end) => end <= left);
    if (lane === -1) lane = lanes.length;
    lanes[lane] = right;
    return { event, left, lane };
  });
  return (
    <g data-slot="track-chart-events" className={className} {...props}>
      {placed.map(({ event, left, lane }) => {
        const top = 4 + (lane % 2) * ((heightPx - 8) / 2);
        return (
          <g key={`${event.timeMs}:${event.text}`} data-tone={event.tone}>
            <line x1={left} x2={left} y1={top} y2={top + 18} className="stroke-muted-foreground" />
            <text
              x={left + 4}
              y={top + 13}
              className={cn(
                "fill-foreground text-[11px]",
                event.tone !== undefined && "font-semibold",
              )}
            >
              {event.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export {
  TrackChart,
  TrackChartAxis,
  TrackChartBody,
  TrackChartEvents,
  TrackChartLine,
  TrackChartPoints,
  TrackChartRange,
  TrackChartTrack,
  useTrackChart,
};
export type {
  TrackBand,
  TrackChartAxisProps,
  TrackChartBodyProps,
  TrackChartControls,
  TrackChartEventsProps,
  TrackChartLineProps,
  TrackChartPointsProps,
  TrackChartProps,
  TrackChartRangeProps,
  TrackChartTrackProps,
  TrackEvent,
  TrackMarkedPoint,
  TrackPoint,
  TrackRange,
  TrackTone,
};
