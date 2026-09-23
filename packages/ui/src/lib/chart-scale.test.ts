import { describe, expect, it } from "vitest";

import { intervalForSpan, linearScale, niceTicks, timeTicks } from "@/lib/chart-scale";

const HOUR = 3_600_000;

describe("linearScale", () => {
  it("maps the domain onto the range, either way round", () => {
    const y = linearScale([0, 100], [200, 0]);
    expect([y(0), y(50), y(100)]).toEqual([200, 100, 0]);
  });

  it("puts every value in the middle when the domain has no width", () => {
    expect(linearScale([5, 5], [0, 10])(5)).toBe(5);
  });
});

describe("niceTicks", () => {
  it.each([
    [0, 60, 4, [0, 20, 40, 60]],
    [35, 42, 4, [36, 38, 40, 42]],
    [0, 1, 4, [0, 0.5, 1]],
    [0, 1, 10, [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]],
    [70, 100, 3, [70, 80, 90, 100]],
  ])("from %d to %d, about %d ticks", (min, max, count, ticks) => {
    expect(niceTicks(min, max, count)).toEqual(ticks);
  });

  it("gives the one value for a range with no width", () => {
    expect(niceTicks(3, 3)).toEqual([3]);
  });
});

describe("timeTicks", () => {
  it("falls on local 4 hour boundaries in Melbourne, not UTC", () => {
    const from = Date.parse("2026-09-22T00:00:00+10:00");
    const ticks = timeTicks(from, from + 12 * HOUR, 240, "Australia/Melbourne");
    expect(ticks.map(({ timeMs }) => new Date(timeMs).toISOString())).toEqual([
      "2026-09-21T14:00:00.000Z",
      "2026-09-21T18:00:00.000Z",
      "2026-09-21T22:00:00.000Z",
      "2026-09-22T02:00:00.000Z",
    ]);
    expect(ticks[0]?.isDayStart).toBe(true);
    expect(ticks.map(({ stripe }) => stripe)).toEqual([0, 1, 0, 1]);
  });

  it("falls on the local hour in a zone half an hour off", () => {
    const from = Date.parse("2026-09-22T00:00:00+09:30");
    const [first] = timeTicks(from, from + HOUR, 60, "Australia/Adelaide");
    expect(first?.timeMs).toBe(from);
  });

  it("keeps a day's ticks on local midnight across a change to daylight saving time", () => {
    const from = Date.parse("2026-10-03T12:00:00+10:00");
    const days = timeTicks(from, from + 48 * HOUR, 24 * 60, "Australia/Melbourne");
    expect(days.map(({ timeMs }) => new Date(timeMs).toISOString())).toEqual([
      "2026-10-03T14:00:00.000Z",
      "2026-10-04T13:00:00.000Z",
    ]);
    // Alternate days are striped, however the range is cut.
    expect(days[0]?.stripe).not.toBe(days[1]?.stripe);
  });

  it("throws for an interval that does not divide a day", () => {
    expect(() => timeTicks(0, HOUR, 7 * 60, "UTC")).toThrow(/does not divide a day/);
  });
});

describe("intervalForSpan", () => {
  it.each([
    [72, 1440],
    [24, 360],
    [12, 240],
    [6, 120],
    [4, 60],
    [2, 30],
    [1, 15],
  ])("gives a %d hour span ticks every %d minutes", (hours, minutes) => {
    expect(intervalForSpan(hours * HOUR)).toBe(minutes);
  });
});
