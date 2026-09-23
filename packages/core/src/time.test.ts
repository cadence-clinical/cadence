import { describe, expect, it } from "vitest";

import { describeTime } from "./time";

const MELBOURNE = { now: "2026-09-23T15:00:00+10:00", timeZone: "Australia/Melbourne" };
const at = (iso: string) => Date.parse(iso);

describe("describeTime", () => {
  it.each([
    ["earlier today", "2026-09-23T09:30:00+10:00", "Today", "09:30"],
    ["the last minute of yesterday", "2026-09-22T23:59:00+10:00", "Yesterday", "23:59"],
    ["a day this year", "2026-09-18T18:21:00+10:00", "Fri, 18 Sept", "18:21"],
    ["a day in another year", "2025-12-04T18:21:00+11:00", "Thu, 4 Dec 2025", "18:21"],
  ])("describes %s", (_name, iso, day, time) => {
    expect(describeTime(at(iso), MELBOURNE)).toMatchObject({ day, time });
  });

  it("measures the day in the stated time zone, not the offset the time was written with", () => {
    // 23:30 in Perth is already the next day in Melbourne.
    const time = at("2026-09-22T23:30:00+08:00");
    expect(describeTime(time, MELBOURNE).day).toBe("Today");
    expect(describeTime(time, { ...MELBOURNE, timeZone: "Australia/Perth" }).day).toBe("Yesterday");
  });

  it("finds yesterday across a change to daylight saving time", () => {
    const description = describeTime(at("2026-10-04T01:00:00+10:00"), {
      now: "2026-10-05T01:00:00+11:00",
      timeZone: "Australia/Melbourne",
    });
    expect(description).toMatchObject({ dayKey: "2026-10-04", day: "Yesterday" });
  });

  it("writes the full date and time for a screen reader", () => {
    expect(describeTime(at("2026-09-18T18:21:00+10:00"), MELBOURNE).full).toBe(
      "Friday 18 September 2026, 18:21",
    );
  });

  it("takes now in milliseconds, a 12 hour clock and its own words", () => {
    const description = describeTime(at("2026-09-23T21:30:00+10:00"), {
      now: at(MELBOURNE.now),
      timeZone: MELBOURNE.timeZone,
      hourCycle: "h12",
      words: { today: "Heute", yesterday: "Gestern" },
    });
    expect(description).toMatchObject({ day: "Heute", time: "9:30 pm" });
  });

  it("throws when now is not a time", () => {
    expect(() => describeTime(0, { ...MELBOURNE, now: "soon" })).toThrow(
      /now "soon" is not a time/,
    );
  });
});
