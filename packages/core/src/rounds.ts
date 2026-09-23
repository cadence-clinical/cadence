/**
 * Rounds of observations. A nurse records a round of vital signs over a minute or two, and the
 * data carries each value's own time with nothing that groups them. A flowsheet shows a round as
 * one column, so readings close together in time are grouped here, in one tested place.
 */

import type { ObservationReading } from "./observation";

/** One round: the readings of each series taken within one window of time. */
export interface ObservationRound<TReading extends ObservationReading = ObservationReading> {
  /** The time of the round's first reading, as the source gave it. It heads the column. */
  readonly time: string;
  readonly timeMs: number;
  /** The time of the round's last reading. */
  readonly lastTimeMs: number;
  /**
   * The readings of each series in the round, oldest first, keyed by series. A series can have
   * two readings in one round, such as a heart rate from a monitor and one counted by hand, and
   * both are kept.
   */
  readonly readings: Readonly<Record<string, readonly TReading[]>>;
}

/** Series of readings, as `observationSeries` or `applyObservationSchema` returns them. */
interface SeriesOf<TReading extends ObservationReading> {
  readonly key: string;
  readonly readings: readonly TReading[];
}

/**
 * Groups the readings of every series into rounds, oldest first. A round starts at a reading and
 * takes every later reading up to `windowMs` after it, so a round can never stretch further than
 * the window, however many readings follow closely.
 *
 * Throws when `windowMs` is negative or not a finite number, which is a mistake in the calling
 * code.
 */
export function groupRounds<TReading extends ObservationReading>(
  series: readonly SeriesOf<TReading>[],
  windowMs: number,
): ObservationRound<TReading>[] {
  if (!Number.isFinite(windowMs) || windowMs < 0) {
    throw new Error(
      `groupRounds: windowMs must be a finite number of milliseconds, 0 or more. It was ${windowMs}.`,
    );
  }

  const all = series
    .flatMap(({ key, readings }) => readings.map((reading) => ({ key, reading })))
    .sort((a, b) => a.reading.timeMs - b.reading.timeMs || (a.reading.id < b.reading.id ? -1 : 1));

  const rounds: {
    time: string;
    timeMs: number;
    lastTimeMs: number;
    readings: Record<string, TReading[]>;
  }[] = [];
  for (const { key, reading } of all) {
    let round = rounds.at(-1);
    if (!round || reading.timeMs - round.timeMs > windowMs) {
      round = {
        time: reading.time,
        timeMs: reading.timeMs,
        lastTimeMs: reading.timeMs,
        readings: {},
      };
      rounds.push(round);
    }
    round.lastTimeMs = reading.timeMs;
    (round.readings[key] ??= []).push(reading);
  }
  return rounds;
}
