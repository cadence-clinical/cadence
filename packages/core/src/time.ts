/**
 * Times for people to read. A clinical time is always shown in a time zone the caller states,
 * so a page rendered on a server reads the same as it does in the browser, and "today" is
 * measured from a `now` the caller passes in rather than the clock (CONVENTIONS.md, section 7).
 */

/** Words for the days nearest now. Defaults are en-AU. */
export interface DayWords {
  readonly today: string;
  readonly yesterday: string;
}

/** How to describe a time. */
export interface TimeOptions {
  /** The moment "today" is measured from: ISO 8601 with an offset, or milliseconds. */
  readonly now: string | number;
  /** An IANA time zone, such as `Australia/Melbourne`. */
  readonly timeZone: string;
  /** A BCP 47 locale. Defaults to `en-AU`. */
  readonly locale?: string;
  /** Defaults to the 24 hour clock, `h23`. */
  readonly hourCycle?: "h23" | "h12";
  readonly words?: DayWords;
}

/** A time described for display. */
export interface TimeDescription {
  /** The calendar day in the time zone, as `YYYY-MM-DD`, for grouping times by day. */
  readonly dayKey: string;
  /** "Today", "Yesterday", or the date: "Thu 4 Dec", with the year when it is not this year's. */
  readonly day: string;
  /** The time of day, such as "18:21". */
  readonly time: string;
  /** The date written out in full and the time, for a screen reader or a tooltip. */
  readonly full: string;
}

const EN_AU_WORDS: DayWords = { today: "Today", yesterday: "Yesterday" };

/** The calendar day of a moment in a time zone, as `YYYY-MM-DD`. */
function dayKeyOf(ms: number, timeZone: string): string {
  // en-CA writes a date as YYYY-MM-DD, whatever locale the reader uses.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ms);
}

/** The day before a `YYYY-MM-DD` key. Calendar arithmetic, so a daylight saving change cannot skew it. */
function dayBefore(key: string): string {
  const [year = 0, month = 1, day = 1] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
}

/**
 * Describes a time for a clinical display: the day in words where it is today or yesterday, a
 * short date otherwise, and the time of day on a 24 hour clock unless asked otherwise.
 *
 * Throws when `now` cannot be read as a time, or the time zone is not one the platform knows.
 */
export function describeTime(timeMs: number, options: TimeOptions): TimeDescription {
  const { timeZone, locale = "en-AU", hourCycle = "h23", words = EN_AU_WORDS } = options;
  const nowMs = typeof options.now === "number" ? options.now : Date.parse(options.now);
  if (Number.isNaN(nowMs)) {
    throw new Error(
      `describeTime: now "${String(options.now)}" is not a time. Pass ISO 8601 with an offset, or milliseconds.`,
    );
  }

  const dayKey = dayKeyOf(timeMs, timeZone);
  const today = dayKeyOf(nowMs, timeZone);
  const sameYear = dayKey.slice(0, 4) === today.slice(0, 4);

  const date = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(timeMs);

  const day = dayKey === today ? words.today : dayKey === dayBefore(today) ? words.yesterday : date;
  const time = new Intl.DateTimeFormat(locale, {
    timeZone,
    // A 24 hour time keeps its leading zero, 09:30. A 12 hour time does not, 9:30 pm.
    hour: hourCycle === "h23" ? "2-digit" : "numeric",
    minute: "2-digit",
    hourCycle,
  }).format(timeMs);
  const full = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(timeMs);

  return { dayKey, day, time, full: `${full}, ${time}` };
}
