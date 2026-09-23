/**
 * Scales and ticks for a chart drawn in SVG. Time ticks fall on the hour in a time zone the caller
 * states, which no charting library's time scale does: they work in UTC or in the zone of the
 * machine running them, so a server and a browser would draw different axes.
 */

/** Maps a value in `domain` to a position in `range`, in a straight line. */
export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  return (value) => (span === 0 ? (r0 + r1) / 2 : r0 + ((value - d0) / span) * (r1 - r0));
}

/**
 * Round numbers from `min` to `max` for an axis: steps of 1, 2 or 5 times a power of ten, about
 * `count` of them, within the range and including its ends when they are round.
 */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (!(max > min) || count < 1) return [min];
  const raw = (max - min) / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].find((factor) => factor * power >= raw) ?? 10) * power;
  const ticks: number[] = [];
  for (let tick = Math.ceil(min / step) * step; tick <= max + step * 1e-9; tick += step) {
    // Adding steps accumulates error: 0.1 + 0.2 is not 0.3. Round to the step's precision.
    ticks.push(Number(tick.toFixed(Math.max(0, -Math.floor(Math.log10(step))))));
  }
  return ticks;
}

const MINUTE_MS = 60_000;
const QUARTER_MS = 15 * MINUTE_MS;
const DAY_MINUTES = 24 * 60;

/** Formatters are slow to make and cheap to reuse. */
const FORMATTERS = new Map<string, Intl.DateTimeFormat>();

/** The local date and minute of the day of a moment in a time zone. */
function localParts(ms: number, timeZone: string): { day: number; minute: number } {
  let formatter = FORMATTERS.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    FORMATTERS.set(timeZone, formatter);
  }
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(formatter.formatToParts(ms).find((entry) => entry.type === type)?.value);
  const day = Date.UTC(part("year"), part("month") - 1, part("day")) / (DAY_MINUTES * MINUTE_MS);
  return { day, minute: part("hour") * 60 + part("minute") };
}

/** A time tick: its moment, whether it starts a local day, and which stripe it starts. */
export interface TimeTick {
  readonly timeMs: number;
  readonly isDayStart: boolean;
  /** 0 or 1, alternating from one interval to the next, the same wherever the range starts. */
  readonly stripe: 0 | 1;
}

/**
 * Ticks from `fromMs` to `toMs` on the local boundaries of `intervalMinutes` in `timeZone`: every
 * 4 hours falls at 00:00, 04:00, 08:00 and so on, local time. The interval divides a day, or is a
 * day. Time zones are offset from UTC in whole quarter hours, so every quarter hour is checked.
 */
export function timeTicks(
  fromMs: number,
  toMs: number,
  intervalMinutes: number,
  timeZone: string,
): TimeTick[] {
  if (intervalMinutes <= 0 || DAY_MINUTES % intervalMinutes !== 0) {
    throw new Error(`timeTicks: ${intervalMinutes} minutes does not divide a day.`);
  }
  const ticks: TimeTick[] = [];
  for (let ms = Math.ceil(fromMs / QUARTER_MS) * QUARTER_MS; ms <= toMs; ms += QUARTER_MS) {
    const { day, minute } = localParts(ms, timeZone);
    if (minute % intervalMinutes !== 0) continue;
    const index = day * (DAY_MINUTES / intervalMinutes) + minute / intervalMinutes;
    ticks.push({ timeMs: ms, isDayStart: minute === 0, stripe: index % 2 === 0 ? 0 : 1 });
  }
  return ticks;
}

/**
 * The interval, in minutes, for the ticks and stripes of a visible span: a day across three days,
 * four hours across twelve, and so on down to a quarter of an hour.
 */
export function intervalForSpan(spanMs: number): number {
  const hours = spanMs / (60 * MINUTE_MS);
  if (hours > 24) return DAY_MINUTES;
  if (hours > 12) return 6 * 60;
  if (hours > 6) return 4 * 60;
  if (hours > 4) return 2 * 60;
  if (hours > 2) return 60;
  if (hours > 1) return 30;
  return 15;
}

/** Words for the days nearest now. */
export interface FriendlyWords {
  readonly today: string;
  readonly yesterday: string;
}

/**
 * A moment in words beside its clock time: "Today", "Yesterday" or a short date, and how long ago
 * it was, such as "6 hr ago", measured from `nowMs` in `timeZone`.
 */
export function friendlyTime(
  ms: number,
  nowMs: number,
  timeZone: string,
  locale = "en-AU",
  words: FriendlyWords = { today: "Today", yesterday: "Yesterday" },
): { day: string; ago: string } {
  const days = localParts(nowMs, timeZone).day - localParts(ms, timeZone).day;
  const day =
    days === 0
      ? words.today
      : days === 1
        ? words.yesterday
        : new Intl.DateTimeFormat(locale, {
            timeZone,
            weekday: "short",
            day: "numeric",
            month: "short",
          }).format(ms);
  const minutes = Math.round((nowMs - ms) / MINUTE_MS);
  const relative = new Intl.RelativeTimeFormat(locale, { style: "short", numeric: "always" });
  const ago =
    Math.abs(minutes) < 60
      ? relative.format(-minutes, "minute")
      : Math.abs(minutes) < 48 * 60
        ? relative.format(-Math.round(minutes / 60), "hour")
        : relative.format(-Math.round(minutes / DAY_MINUTES), "day");
  return { day, ago };
}
