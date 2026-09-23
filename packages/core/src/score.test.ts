import { describe, expect, it } from "vitest";

import type { ObservationReading } from "./observation";
import {
  applyObservationSchema,
  checkObservationSchema,
  defineObservationSchema,
  scoreRounds,
  type ObservationSchema,
} from "./observation-schema";
import { groupRounds } from "./rounds";

// A synthetic schema with a total. The bands and scores are arbitrary: they show how a total is
// added up, and are not a clinical score.
const SCHEMA = defineObservationSchema({
  levels: [
    { key: "zero", label: "Score 0", short: "", severity: "severity-0", score: 0 },
    { key: "one", label: "Score 1", short: "1", severity: "severity-1", score: 1 },
    { key: "three", label: "Score 3", short: "3", severity: "severity-3", score: 3 },
    { key: "call", label: "Call for help", short: "E", severity: "severity-6" },
    { key: "watch", label: "Watch", short: "W", severity: "severity-2" },
  ],
  series: [
    {
      key: "a",
      label: "A",
      match: [],
      ucum: "{score}",
      bands: [
        { level: "call", below: 0 },
        { level: "zero", from: 0, below: 10 },
        { level: "one", from: 10, below: 20 },
        { level: "three", from: 20 },
      ],
    },
    {
      key: "b",
      label: "B",
      match: [],
      ucum: "{score}",
      bands: [
        { level: "zero", below: 10 },
        { level: "three", from: 10 },
      ],
    },
    {
      // Scored when it is there, but not required, as a supplementary treatment would be.
      key: "extra",
      label: "Extra",
      match: [],
      ucum: "{score}",
      bands: [
        { level: "zero", below: 1 },
        { level: "one", from: 1 },
      ],
    },
    { key: "noted", label: "Noted", match: [], ucum: "{score}", bands: [{ level: "watch" }] },
  ],
  total: {
    label: "Total",
    requires: ["a", "b"],
    bands: [
      { level: "zero", below: 1 },
      { level: "one", from: 1, below: 4 },
      { level: "three", from: 4 },
    ],
    escalations: [{ fromLevels: ["call"], level: "call" }],
  },
});

let counter = 0;
const at = (
  seconds: number,
  key: string,
  value: number,
): { key: string; reading: ObservationReading } => {
  counter += 1;
  const timeMs = Date.parse("2026-09-20T08:00:00Z") + seconds * 1000;
  return {
    key,
    reading: {
      id: `r${counter}`,
      resource: `Observation/r${counter}`,
      code: { codings: [] },
      status: "final",
      time: new Date(timeMs).toISOString(),
      timeMs,
      value: { kind: "integer", value },
      source: { interpretation: [], referenceRanges: [] },
    },
  };
};

/** Scores one round made of the given readings. */
function score(
  readings: { key: string; reading: ObservationReading }[],
  schema: ObservationSchema = SCHEMA,
) {
  const keys = [...new Set(readings.map(({ key }) => key))];
  const series = keys.map((key) => ({
    key,
    readings: readings.filter((entry) => entry.key === key).map(({ reading }) => reading),
  }));
  const [total] = scoreRounds(
    groupRounds(applyObservationSchema(series, schema), 5 * 60_000),
    schema,
  );
  return total;
}

describe("scoreRounds", () => {
  it("adds up a complete round and bands the total", () => {
    expect(score([at(0, "a", 12), at(10, "b", 11)])).toMatchObject({
      kind: "complete",
      total: 4,
      level: { key: "three" },
      isEscalated: false,
    });
  });

  it("adds a series that is there but not required", () => {
    expect(score([at(0, "a", 12), at(10, "b", 1), at(20, "extra", 2)])).toMatchObject({
      total: 2,
      level: { key: "one" },
    });
  });

  it("counts the higher score when a series has two readings in a round", () => {
    const total = score([at(0, "a", 5), at(10, "a", 25), at(20, "b", 1)]);
    expect(total).toMatchObject({ kind: "complete", total: 3 });
    expect(total?.parts.find(({ seriesKey }) => seriesKey === "a")?.score).toBe(3);
  });

  it("gives no number for an incomplete round, and names what is missing", () => {
    const total = score([at(0, "a", 25)]);
    expect(total).toEqual({
      kind: "incomplete",
      timeMs: Date.parse("2026-09-20T08:00:00Z"),
      missing: ["b"],
      isEscalated: false,
      parts: [expect.objectContaining({ seriesKey: "a", score: 3 })],
    });
    expect(total).not.toHaveProperty("total");
  });

  it("escalates a round whatever its sum, complete or not", () => {
    expect(score([at(0, "a", -1), at(10, "b", 1)])).toMatchObject({
      kind: "complete",
      total: 0,
      level: { key: "call" },
      isEscalated: true,
    });
    expect(score([at(0, "a", -1)])).toMatchObject({
      kind: "incomplete",
      level: { key: "call" },
      isEscalated: true,
    });
  });

  it("keeps the sum's level when it is higher than an escalation's", () => {
    const schema = defineObservationSchema({
      ...SCHEMA,
      total: {
        ...SCHEMA.total,
        escalations: [
          { fromLevels: ["call"], level: "call" },
          { fromLevels: ["three"], level: "one" },
        ],
      },
    });
    expect(score([at(0, "a", 25), at(10, "b", 11)], schema)).toMatchObject({
      total: 6,
      level: { key: "three" },
      isEscalated: false,
    });
  });

  it("gives no level to a total outside every band", () => {
    const schema = defineObservationSchema({
      ...SCHEMA,
      total: {
        label: "Total",
        requires: ["a"],
        bands: [{ level: "one", from: 100 }],
        escalations: [{ fromLevels: ["call"], level: "call" }],
      },
    });
    const total = score([at(0, "a", 5)], schema);
    expect(total).toMatchObject({ kind: "complete", total: 0, isEscalated: false });
    expect(total).not.toHaveProperty("level");
  });

  it("does not count a reading at a level with no score, or one with no band", () => {
    const total = score([at(0, "a", 5), at(10, "b", 1), at(20, "noted", 1), at(30, "other", 1)]);
    expect(total?.parts.map(({ seriesKey }) => seriesKey)).toEqual(["a", "b"]);
  });

  it.each([
    [{ ...SCHEMA, total: undefined }, /no total/],
    [{ ...SCHEMA, levels: [] }, /cannot be applied/],
  ])("throws for a schema it cannot add up: %#", (schema, message) => {
    expect(() => scoreRounds([], schema)).toThrow(message);
  });
});

describe("checkObservationSchema, for a total", () => {
  const base: ObservationSchema = {
    levels: [
      { key: "a", label: "A", short: "", severity: "severity-0", score: 0 },
      { key: "u", label: "Unscored", short: "", severity: "severity-1" },
    ],
    series: [
      { key: "s", label: "S", match: [], ucum: "1", bands: [{ level: "a" }] },
      { key: "t", label: "T", match: [], ucum: "1", bands: [{ level: "u" }] },
    ],
  };

  it.each([
    [{ label: "Total", requires: ["missing"] }, /requires the series "missing"/],
    [{ label: "Total", requires: ["t"] }, /adds up "t", whose level "u" has no score/],
    [{ label: "Total", requires: [], bands: [{ level: "x" }] }, /band at the level "x"/],
    [
      {
        label: "Total",
        requires: [],
        bands: [
          { level: "a", below: 1 },
          { level: "a", from: 2 },
        ],
      },
      /gap between 1 and 2/,
    ],
    [
      { label: "Total", requires: [], escalations: [{ fromLevels: ["y"], level: "a" }] },
      /escalates with the level "y"/,
    ],
  ])("reports %j", (total, problem) => {
    expect(checkObservationSchema({ ...base, total })).toEqual([expect.stringMatching(problem)]);
  });

  it("accepts a total whose required series are all scored", () => {
    expect(checkObservationSchema({ ...base, total: { label: "Total", requires: ["s"] } })).toEqual(
      [],
    );
  });
});

describe("scoreRounds, with a plain total", () => {
  it("adds up with no bands and no escalations, and gives no level", () => {
    const schema = defineObservationSchema({
      ...SCHEMA,
      total: { label: "Total", requires: ["b"] },
    });
    expect(score([at(0, "b", 11)], schema)).toMatchObject({
      kind: "complete",
      total: 3,
      isEscalated: false,
    });
    expect(score([at(0, "b", 11)], schema)).not.toHaveProperty("level");
  });
});
