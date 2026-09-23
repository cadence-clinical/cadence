import { describe, expect, it } from "vitest";

import type { ObservationReading, ObservationValue } from "./observation";
import {
  applyObservationSchema,
  checkObservationSchema,
  defineObservationSchema,
  type ObservationSchema,
} from "./observation-schema";

// Synthetic levels and bands for tests. The numbers are chosen to look like no clinical
// measurement, and none of them is a clinical threshold.
const LOCAL = "https://ehr.example.org/codes";
const V3 = "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation";

const SCHEMA = defineObservationSchema({
  levels: [
    { key: "in", label: "Within range", short: "I", severity: "severity-0" },
    { key: "watch", label: "Watch", short: "W", severity: "severity-2" },
    { key: "act", label: "Act now", short: "A", severity: "severity-5" },
  ],
  series: [
    {
      key: "rate",
      label: "Synthetic rate",
      match: [{ system: LOCAL, code: "rate" }],
      ucum: "/min",
      range: { min: 0, max: 500 },
      bands: [
        { level: "act", below: 100 },
        { level: "watch", from: 100, below: 200 },
        { level: "in", from: 200, below: 300 },
        { level: "watch", from: 300, below: 400 },
        { level: "act", from: 400 },
      ],
    },
    {
      key: "partial",
      label: "Synthetic partial",
      match: [],
      ucum: "/min",
      bands: [{ level: "watch", from: 0, below: 10 }],
    },
    {
      key: "score",
      label: "Synthetic score",
      match: [],
      ucum: "{score}",
      bands: [
        { level: "in", from: 0, below: 3 },
        { level: "act", from: 3 },
      ],
    },
    {
      key: "response",
      label: "Synthetic response",
      match: [],
      answers: [
        { level: "in", match: [{ system: LOCAL, code: "A" }] },
        { level: "act", text: ["Unresponsive"] },
      ],
    },
    { key: "unbanded", label: "Synthetic unbanded", match: [] },
  ],
  interpretationLabels: [{ system: V3, code: "LU", label: "Very low" }],
});

let counter = 0;

/** A reading with the given value, at the given minute past a synthetic hour. */
function reading(
  value: ObservationValue,
  minute = 0,
  fields: Partial<ObservationReading> = {},
): ObservationReading {
  counter += 1;
  const time = `2026-09-20T08:${String(minute).padStart(2, "0")}:00Z`;
  return {
    id: `Observation/r${counter}`,
    resource: `Observation/r${counter}`,
    code: { codings: [{ system: LOCAL, code: "rate" }] },
    status: "final",
    time,
    timeMs: Date.parse(time),
    value,
    source: { interpretation: [], referenceRanges: [] },
    ...fields,
  };
}

const perMinute = (value: number, comparator?: "<" | "<=" | ">" | ">="): ObservationValue => ({
  kind: "quantity",
  quantity: { value, ucum: "/min", ...(comparator === undefined ? {} : { comparator }) },
});

/** The band one reading gets in one series. */
function bandOf(key: string, value: ObservationValue) {
  return applyObservationSchema([{ key, readings: [reading(value)] }], SCHEMA)[0]?.readings[0]
    ?.band;
}

describe("checkObservationSchema", () => {
  const base: ObservationSchema = {
    levels: [{ key: "a", label: "A", short: "A", severity: "severity-0" }],
    series: [],
  };

  it("finds nothing wrong with a schema that can be applied", () => {
    expect(checkObservationSchema(SCHEMA)).toEqual([]);
  });

  it.each([
    [
      "a level key used twice",
      {
        ...base,
        levels: [
          ...base.levels,
          { key: "a", label: "Again", short: "", severity: "severity-1" as const },
        ],
      },
      /level key "a" is used twice/,
    ],
    [
      "a series defined twice",
      {
        ...base,
        series: [
          { key: "s", label: "S", match: [] },
          { key: "s", label: "S", match: [] },
        ],
      },
      /"s" is defined twice/,
    ],
    [
      "a range whose min is not below its max",
      { ...base, series: [{ key: "s", label: "S", match: [], range: { min: 5, max: 5 } }] },
      /min is not below its max/,
    ],
    [
      "bands with no unit",
      { ...base, series: [{ key: "s", label: "S", match: [], bands: [{ level: "a" }] }] },
      /bands but no unit/,
    ],
    [
      "a band's level that is not defined",
      {
        ...base,
        series: [{ key: "s", label: "S", match: [], ucum: "1", bands: [{ level: "b" }] }],
      },
      /level "b", which is not defined/,
    ],
    [
      "an answer's level that is not defined",
      {
        ...base,
        series: [{ key: "s", label: "S", match: [], answers: [{ level: "c", text: ["x"] }] }],
      },
      /level "c", which is not defined/,
    ],
    [
      "a band that holds no value",
      {
        ...base,
        series: [
          {
            key: "s",
            label: "S",
            match: [],
            ucum: "1",
            bands: [{ level: "a", from: 5, below: 5 }],
          },
        ],
      },
      /from 5 below 5, which holds no value/,
    ],
    [
      "bands that overlap",
      {
        ...base,
        series: [
          {
            key: "s",
            label: "S",
            match: [],
            ucum: "1",
            bands: [
              { level: "a", from: 10 },
              { level: "a", below: 12 },
            ],
          },
        ],
      },
      /overlap at 10/,
    ],
    [
      "two bands open below",
      {
        ...base,
        series: [
          { key: "s", label: "S", match: [], ucum: "1", bands: [{ level: "a" }, { level: "a" }] },
        ],
      },
      /overlap at -Infinity/,
    ],
    [
      "a gap between bands",
      {
        ...base,
        series: [
          {
            key: "s",
            label: "S",
            match: [],
            ucum: "1",
            bands: [
              { level: "a", from: 35, below: 40 },
              { level: "a", from: 30, below: 34 },
            ],
          },
        ],
      },
      /gap between 34 and 35/,
    ],
    [
      "an interpretation code with two labels",
      {
        ...base,
        interpretationLabels: [
          { system: V3, code: "H", label: "High" },
          { system: V3, code: "H", label: "Above" },
        ],
      },
      /code .*\|H has two labels/,
    ],
  ])("reports %s", (_name, schema, problem) => {
    expect(checkObservationSchema(schema)).toEqual([expect.stringMatching(problem)]);
  });

  it("is what defineObservationSchema and applyObservationSchema throw with", () => {
    const wrong: ObservationSchema = {
      ...base,
      series: [{ key: "s", label: "S", match: [], bands: [{ level: "a" }] }],
    };
    expect(() => defineObservationSchema(wrong)).toThrow(
      /cannot be applied:\n- Series "s" has bands but no unit/,
    );
    expect(() => applyObservationSchema([], wrong)).toThrow(/cannot be applied/);
  });
});

describe("applyObservationSchema bands", () => {
  it.each([
    ["the lowest band, open below", "rate", perMinute(50), "act"],
    ["a band's lower edge, which it includes", "rate", perMinute(100), "watch"],
    ["just below a band's upper edge", "rate", perMinute(199.9), "watch"],
    ["the middle band", "rate", perMinute(250), "in"],
    ["the highest band, open above", "rate", perMinute(400), "act"],
    ["less than a value inside the band open below", "rate", perMinute(50, "<"), "act"],
    ["less than that band's upper edge", "rate", perMinute(100, "<"), "act"],
    ["more than a value inside the band open above", "rate", perMinute(450, ">"), "act"],
    ["at least that band's lower edge", "rate", perMinute(400, ">="), "act"],
    ["a score in a series with no unit", "score", { kind: "integer", value: 4 }, "act"],
    ["zero, which is a value", "score", { kind: "integer", value: 0 }, "in"],
    [
      "a coded answer",
      "response",
      { kind: "concept", concept: { codings: [{ system: LOCAL, code: "A" }] } },
      "in",
    ],
    [
      "an answer written as text, compared after trimming",
      "response",
      { kind: "concept", concept: { codings: [], text: " Unresponsive " } },
      "act",
    ],
  ] satisfies [string, string, ObservationValue, string][])(
    "places %s",
    (_name, key, value, level) => {
      expect(bandOf(key, value)).toMatchObject({ kind: "level", level: { key: level } });
    },
  );

  it.each([
    ["a value outside every band", "partial", perMinute(20), "outside-bands"],
    [
      "a value in another unit",
      "rate",
      { kind: "quantity", quantity: { value: 250, ucum: "/h" } },
      "unit-mismatch",
    ],
    [
      "a quantity with no UCUM unit",
      "rate",
      { kind: "quantity", quantity: { value: 250, unitText: "bpm" } },
      "no-unit",
    ],
    [
      "a whole number in a series that is not of scores",
      "rate",
      { kind: "integer", value: 250 },
      "unit-mismatch",
    ],
    [
      "less than a value in a band that is not open below",
      "rate",
      perMinute(150, "<"),
      "comparator",
    ],
    ["at most a band's upper edge", "rate", perMinute(100, "<="), "comparator"],
    [
      "more than a value in a band that is not open above",
      "rate",
      perMinute(350, ">"),
      "comparator",
    ],
    ["a comparator where no band is open that way", "partial", perMinute(5, "<"), "comparator"],
    ["a comparator where no band is open above", "partial", perMinute(5, ">"), "comparator"],
    ["at most, where no band is open below", "partial", perMinute(5, "<="), "comparator"],
    ["at least, where no band is open above", "partial", perMinute(5, ">="), "comparator"],
    ["an absent value", "rate", { kind: "absent" }, "absent"],
    ["text", "rate", { kind: "text", text: "250" }, "not-banded-kind"],
    ["true or false", "rate", { kind: "boolean", value: true }, "not-banded-kind"],
    [
      "an answer the schema does not know",
      "response",
      { kind: "concept", concept: { codings: [], text: "Drowsy" } },
      "unknown-answer",
    ],
    [
      "an answer with no text and no known code",
      "response",
      { kind: "concept", concept: { codings: [{ system: LOCAL, code: "Z" }] } },
      "unknown-answer",
    ],
    ["a series with no bands or answers", "unbanded", perMinute(250), "no-bands"],
    ["a series the schema does not define", "other", perMinute(250), "no-bands"],
  ] satisfies [string, string, ObservationValue, string][])(
    "does not band %s",
    (_name, key, value, reason) => {
      expect(bandOf(key, value)).toEqual({ kind: "none", reason });
    },
  );

  it("attaches the definition when the schema has one", () => {
    const [known, unknown] = applyObservationSchema(
      [
        { key: "rate", readings: [] },
        { key: "other", readings: [] },
      ],
      SCHEMA,
    );
    expect(known?.definition?.label).toBe("Synthetic rate");
    expect(unknown).toEqual({ key: "other", readings: [] });
  });
});

describe("applyObservationSchema changes", () => {
  const changes = (readings: ObservationReading[]) =>
    applyObservationSchema([{ key: "rate", readings }], SCHEMA)[0]?.readings.map(
      ({ previous }) => previous,
    );

  it("rounds the change to the precision the values were written with", () => {
    const [first, second] = [reading(perMinute(35.6), 0), reading(perMinute(35), 30)];
    expect(changes([first, second])).toEqual([
      undefined,
      { previousId: first.id, change: -0.6, elapsedMs: 30 * 60_000 },
    ]);
  });

  it("does not compare two readings taken at one moment", () => {
    const earlier = reading(perMinute(250), 0);
    const [monitored, counted] = [reading(perMinute(260), 10), reading(perMinute(262), 10)];
    const [, first, second] = changes([earlier, monitored, counted]) ?? [];
    expect(first).toMatchObject({ previousId: earlier.id, change: 10 });
    expect(second).toMatchObject({ previousId: earlier.id, change: 12 });
  });

  it("gives no change between different units, only the time between them", () => {
    const [before, after] = [
      reading({ kind: "quantity", quantity: { value: 1, ucum: "/h" } }, 0),
      reading(perMinute(250), 5),
    ];
    expect(changes([before, after])?.[1]).toEqual({ previousId: before.id, elapsedMs: 5 * 60_000 });
  });

  it("gives no change from a value with no UCUM unit", () => {
    const [before, after] = [
      reading({ kind: "quantity", quantity: { value: 1 } }, 0),
      reading(perMinute(250), 5),
    ];
    expect(changes([before, after])?.[1]).toEqual({ previousId: before.id, elapsedMs: 5 * 60_000 });
  });

  it("compares scores", () => {
    const [before, after] = [
      reading({ kind: "integer", value: 3 }, 0),
      reading({ kind: "integer", value: 1 }, 1),
    ];
    expect(changes([before, after])?.[1]).toMatchObject({ change: -2 });
  });

  it("skips values that are not exact numbers, and gives them no change", () => {
    const first = reading(perMinute(250), 0);
    const bounded = reading(perMinute(100, "<"), 1);
    const text = reading({ kind: "text", text: "x" }, 2);
    const last = reading(perMinute(251), 3);
    expect(changes([first, bounded, text, last])).toEqual([
      undefined,
      undefined,
      undefined,
      { previousId: first.id, change: 1, elapsedMs: 3 * 60_000 },
    ]);
  });
});

describe("applyObservationSchema source labels", () => {
  it.each([
    [
      "the schema's words for a code",
      { codings: [{ system: V3, code: "LU", display: "Significantly low" }] },
      ["Very low"],
    ],
    ["the source's text", { codings: [{ system: V3, code: "H" }], text: "High" }, ["High"]],
    ["the source's display", { codings: [{ system: V3, code: "H", display: "High" }] }, ["High"]],
    ["the source's code", { codings: [{ system: V3, code: "H" }] }, ["H"]],
    ["nothing, for a concept with no words", { codings: [{ system: V3 }] }, []],
  ])("uses %s", (_name, interpretation, labels) => {
    const interpreted = applyObservationSchema(
      [
        {
          key: "rate",
          readings: [
            reading(perMinute(250), 0, {
              source: { interpretation: [interpretation], referenceRanges: [] },
            }),
          ],
        },
      ],
      SCHEMA,
    );
    expect(interpreted[0]?.readings[0]?.sourceLabels).toEqual(labels);
  });

  it("keeps the source's words when the schema has no labels", () => {
    const source = {
      interpretation: [{ codings: [{ system: V3, code: "LU" }] }],
      referenceRanges: [],
    };
    const interpreted = applyObservationSchema(
      [{ key: "rate", readings: [reading(perMinute(1), 0, { source })] }],
      { levels: [], series: [] },
    );
    expect(interpreted[0]?.readings[0]?.sourceLabels).toEqual(["LU"]);
  });

  it("keeps the source's interpretation beside the schema's band", () => {
    const source = {
      interpretation: [{ codings: [{ system: V3, code: "N" }] }],
      referenceRanges: [],
    };
    const [interpreted] =
      applyObservationSchema(
        [{ key: "rate", readings: [reading(perMinute(50), 0, { source })] }],
        SCHEMA,
      )[0]?.readings ?? [];
    expect(interpreted?.source).toEqual(source);
    expect(interpreted?.band).toMatchObject({ kind: "level", level: { key: "act" } });
  });
});
