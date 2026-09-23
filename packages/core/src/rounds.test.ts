import { describe, expect, it } from "vitest";

import type { ObservationReading } from "./observation";
import { groupRounds } from "./rounds";

const MINUTE = 60_000;
const BASE = Date.parse("2026-09-20T08:00:00Z");

/** A reading at the given number of seconds after a synthetic start. */
function reading(id: string, seconds: number): ObservationReading {
  const timeMs = BASE + seconds * 1000;
  return {
    id,
    resource: id,
    code: { codings: [] },
    status: "final",
    time: new Date(timeMs).toISOString(),
    timeMs,
    value: { kind: "integer", value: 1 },
    source: { interpretation: [], referenceRanges: [] },
  };
}

const ids = (rounds: ReturnType<typeof groupRounds>) =>
  rounds.map(({ readings }) =>
    Object.fromEntries(
      Object.entries(readings).map(([key, list]) => [key, list.map(({ id }) => id)]),
    ),
  );

describe("groupRounds", () => {
  it("puts a round spread over 90 seconds in one column, headed by its first time", () => {
    const rounds = groupRounds(
      [
        { key: "hr", readings: [reading("hr-1", 29), reading("hr-2", 89)] },
        { key: "rr", readings: [reading("rr-1", 0)] },
      ],
      5 * MINUTE,
    );
    expect(rounds).toHaveLength(1);
    expect(rounds[0]).toMatchObject({ timeMs: BASE, lastTimeMs: BASE + 89_000 });
    // Two heart rates in one round are both kept.
    expect(ids(rounds)).toEqual([{ rr: ["rr-1"], hr: ["hr-1", "hr-2"] }]);
  });

  it("starts a new round after the window, measured from the round's first reading", () => {
    // Readings every four minutes never chain into one long round.
    const rounds = groupRounds(
      [
        {
          key: "hr",
          readings: [reading("a", 0), reading("b", 240), reading("c", 480), reading("d", 720)],
        },
      ],
      5 * MINUTE,
    );
    expect(ids(rounds)).toEqual([{ hr: ["a", "b"] }, { hr: ["c", "d"] }]);
  });

  it("includes a reading exactly at the window's end", () => {
    expect(
      groupRounds([{ key: "hr", readings: [reading("a", 0), reading("b", 300)] }], 5 * MINUTE),
    ).toHaveLength(1);
  });

  it.each([
    ["b", "a"],
    ["a", "b"],
  ])(
    "gives each time its own round with a window of zero, and orders one moment by id: %s, %s",
    (first, second) => {
      const rounds = groupRounds(
        [{ key: "hr", readings: [reading(first, 0), reading(second, 0), reading("c", 1)] }],
        0,
      );
      expect(ids(rounds)).toEqual([{ hr: ["a", "b"] }, { hr: ["c"] }]);
    },
  );

  it("returns no rounds for no readings", () => {
    expect(groupRounds([], MINUTE)).toEqual([]);
  });

  it.each([-1, Number.NaN, Infinity])("throws for a window of %s", (windowMs) => {
    expect(() => groupRounds([], windowMs)).toThrow(/windowMs/);
  });
});
