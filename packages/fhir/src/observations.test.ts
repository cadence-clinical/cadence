import { describe, expect, it } from "vitest";

import { observationSeries, type ObservationSeriesOptions } from "./observations";
import { LOCAL, LOINC, UCUM, VITALS_PAGES, vital } from "./test/fixtures";

const VITALS: ObservationSeriesOptions = {
  series: [
    { key: "heart-rate", match: [{ system: LOINC, code: "8867-4" }] },
    { key: "systolic", match: [{ system: LOINC, code: "8480-6" }] },
    { key: "diastolic", match: [{ system: LOINC, code: "8462-4" }] },
    { key: "spo2", match: [{ system: LOINC, code: "2708-6" }] },
    // A site code with no LOINC equivalent is matched the same way.
    { key: "sedation", match: [{ system: LOCAL, code: "4001" }] },
  ],
};

/** The ids of a series' readings, oldest first. */
function ids(result: ReturnType<typeof observationSeries>, key: string): string[] {
  return result.series.find((series) => series.key === key)?.readings.map(({ id }) => id) ?? [];
}

describe("observationSeries, on two pages of a vital signs search", () => {
  const result = observationSeries(VITALS_PAGES, VITALS);

  it("keeps both heart rates taken at one moment, in time then id order", () => {
    expect(ids(result, "heart-rate")).toEqual([
      "Observation/hr-monitor-0",
      "Observation/hr-monitor-1",
      "Observation/hr-pulse-1",
    ]);
  });

  it("names each heart rate's source by its own code", () => {
    const [, monitored, palpated] =
      result.series.find(({ key }) => key === "heart-rate")?.readings ?? [];
    expect(monitored?.code.text).toBe("Heart Rate Monitored");
    expect(palpated?.code.text).toBe("Peripheral Pulse Rate");
  });

  it("reads blood pressure from the panel's components, and names the panel", () => {
    const systolic = result.series.find(({ key }) => key === "systolic")?.readings[0];
    expect(systolic).toMatchObject({
      id: "Observation/bp-1#component[0]",
      resource: "Observation/bp-1",
      panel: { text: "Blood pressure panel with all children optional" },
      time: "2026-09-20T09:31:10+10:00",
      value: { kind: "quantity", quantity: { value: 124, ucum: "mm[Hg]", unitText: "mmHg" } },
    });
    expect(ids(result, "diastolic")).toEqual(["Observation/bp-1#component[1]"]);
  });

  it("keeps the source's interpretation and reference range as the source's", () => {
    const spo2 = result.series.find(({ key }) => key === "spo2")?.readings[0];
    expect(spo2?.source.interpretation[0]?.codings).toContainEqual({
      system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
      code: "N",
      display: "Normal",
    });
    expect(spo2?.source.referenceRanges[0]).toMatchObject({
      low: { value: 10, ucum: "%" },
      high: { value: 20, ucum: "%" },
    });
  });

  it("keeps an answer written only as text", () => {
    const sedation = result.series.find(({ key }) => key === "sedation")?.readings[0];
    expect(sedation?.value).toEqual({
      kind: "concept",
      concept: { codings: [], text: "0 - Awake and alert" },
    });
  });

  it("puts readings that match no series in others, oldest first", () => {
    expect(result.others.map(({ id }) => id)).toEqual([
      "Observation/spo2-1#component[0]",
      "Observation/comment-1",
    ]);
    expect(result.others[1]?.value).toEqual({ kind: "text", text: "Synthetic comment." });
  });

  it("reports the repeated resource and the OperationOutcome, and nothing else", () => {
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "duplicate-id",
        severity: "warning",
        resource: "Observation/hr-pulse-1",
      }),
      expect.objectContaining({
        code: "unexpected-resource",
        severity: "warning",
        resource: "OperationOutcome/outcome-1",
        path: "input[1].entry[4].resource",
      }),
    ]);
  });

  it("returns every series asked for, even an empty one", () => {
    const empty = observationSeries([], { series: [{ key: "temperature", match: [] }] });
    expect(empty).toEqual({
      series: [{ key: "temperature", readings: [] }],
      others: [],
      excluded: [],
      issues: [],
    });
  });
});

describe("observationSeries values", () => {
  const readOne = (fields: Record<string, unknown>) => {
    const { valueQuantity: _value, ...base } = vital("one");
    const result = observationSeries({ ...base, ...fields }, { series: [] });
    return { value: result.others[0]?.value, issues: result.issues };
  };

  it.each([
    [
      "a quantity with a comparator",
      { valueQuantity: { value: 0.5, comparator: "<", system: UCUM, code: "mmol/L" } },
      { kind: "quantity", quantity: { value: 0.5, comparator: "<", ucum: "mmol/L" } },
    ],
    ["an integer", { valueInteger: 14 }, { kind: "integer", value: 14 }],
    ["zero, which is a value", { valueInteger: 0 }, { kind: "integer", value: 0 }],
    ["a negative integer", { valueInteger: -3 }, { kind: "integer", value: -3 }],
    ["a boolean", { valueBoolean: false }, { kind: "boolean", value: false }],
    ["an empty string, which is text", { valueString: "" }, { kind: "text", text: "" }],
    [
      "a coded value",
      { valueCodeableConcept: { coding: [{ system: LOCAL, code: "A", display: "Alert" }] } },
      { kind: "concept", concept: { codings: [{ system: LOCAL, code: "A", display: "Alert" }] } },
    ],
    [
      "an absent value with a reason",
      { dataAbsentReason: { text: "Patient asleep" } },
      { kind: "absent", reason: { codings: [], text: "Patient asleep" } },
    ],
  ])("reads %s", (_name, fields, expected) => {
    const { value, issues } = readOne(fields);
    expect(value).toEqual(expected);
    expect(issues).toEqual([]);
  });

  it("keeps a quantity with no UCUM unit, with the unit as written, and warns", () => {
    const { value, issues } = readOne({ valueQuantity: { value: 36.8, unit: "degrees" } });
    expect(value).toEqual({ kind: "quantity", quantity: { value: 36.8, unitText: "degrees" } });
    expect(issues.map(({ code }) => code)).toEqual(["no-ucum-unit"]);
    expect(issues[0]?.message).toContain('"degrees"');
  });

  it("keeps a quantity with no unit at all, and says it is a bare number", () => {
    const { issues } = readOne({ valueQuantity: { value: 3 } });
    expect(issues[0]?.message).toMatch(/bare number/);
  });

  it("does not take a unit from a system that is not UCUM", () => {
    const { value } = readOne({ valueQuantity: { value: 3, system: "https://other", code: "x" } });
    expect(value).toEqual({ kind: "quantity", quantity: { value: 3 } });
  });

  it("shows a value as absent when its reason cannot be read", () => {
    const { value, issues } = readOne({ dataAbsentReason: "asleep" });
    expect(value).toEqual({ kind: "absent" });
    expect(issues).toEqual([
      expect.objectContaining({ code: "invalid-element", path: "Observation.dataAbsentReason" }),
    ]);
  });
});

describe("observationSeries times", () => {
  it.each([
    [
      "effectiveInstant",
      { effectiveInstant: "2026-09-20T08:00:00.123Z" },
      "2026-09-20T08:00:00.123Z",
    ],
    [
      "the start of effectivePeriod",
      { effectivePeriod: { start: "2026-09-20T08:00:00+10:00", end: "2026-09-20T09:00:00+10:00" } },
      "2026-09-20T08:00:00+10:00",
    ],
  ])("reads %s", (_name, fields, time) => {
    const { effectiveDateTime: _time, ...base } = vital("one");
    const result = observationSeries({ ...base, ...fields }, { series: [] });
    expect(result.others[0]?.time).toBe(time);
    expect(result.others[0]?.timeMs).toBe(Date.parse(time));
  });
});

describe("observationSeries selection", () => {
  const readings = [
    vital("early", { effectiveDateTime: "2026-09-20T07:59:59+10:00" }),
    vital("start", { effectiveDateTime: "2026-09-20T08:00:00+10:00" }),
    vital("end", { effectiveDateTime: "2026-09-20T09:00:00+10:00" }),
  ];
  const heartRate = [{ key: "hr", match: [{ system: LOINC, code: "8867-4" }] }];

  it("keeps readings at or after the start and before the end", () => {
    const result = observationSeries(readings, {
      series: heartRate,
      period: { start: "2026-09-20T08:00:00+10:00", end: "2026-09-20T09:00:00+10:00" },
    });
    expect(ids(result, "hr")).toEqual(["Observation/start"]);
  });

  it("accepts a period open on either side", () => {
    expect(
      ids(
        observationSeries(readings, {
          series: heartRate,
          period: { start: "2026-09-19T22:00:00Z" },
        }),
        "hr",
      ),
    ).toEqual(["Observation/start", "Observation/end"]);
    expect(
      ids(
        observationSeries(readings, {
          series: heartRate,
          period: { end: "2026-09-20T08:00:00+10:00" },
        }),
        "hr",
      ),
    ).toEqual(["Observation/early"]);
  });

  it("keeps only the readings a predicate accepts", () => {
    const result = observationSeries(readings, {
      series: heartRate,
      where: (reading) => reading.resource !== "Observation/start",
    });
    expect(ids(result, "hr")).toEqual(["Observation/early", "Observation/end"]);
  });

  it("leaves out cancelled, entered-in-error and registered observations by default, and lists them", () => {
    const result = observationSeries(
      [
        vital("wrong", { status: "entered-in-error" }),
        vital("cancelled", { status: "cancelled" }),
        vital("registered", { status: "registered" }),
        vital("amended", { status: "amended" }),
      ],
      { series: heartRate },
    );
    expect(ids(result, "hr")).toEqual(["Observation/amended"]);
    expect(result.excluded).toEqual([
      { resource: "Observation/wrong", status: "entered-in-error" },
      { resource: "Observation/cancelled", status: "cancelled" },
      { resource: "Observation/registered", status: "registered" },
    ]);
    expect(result.issues).toEqual([]);
  });

  it("orders readings at one moment by id, whatever order they arrive in", () => {
    const a = vital("a");
    const b = vital("b");
    expect(ids(observationSeries([a, b], { series: heartRate }), "hr")).toEqual([
      "Observation/a",
      "Observation/b",
    ]);
    expect(ids(observationSeries([b, a], { series: heartRate }), "hr")).toEqual([
      "Observation/a",
      "Observation/b",
    ]);
  });

  it("reads the statuses asked for by name", () => {
    const result = observationSeries([vital("wrong", { status: "entered-in-error" })], {
      series: heartRate,
      statuses: ["entered-in-error"],
    });
    expect(ids(result, "hr")).toEqual(["Observation/wrong"]);
  });

  it("puts a reading in every series it matches", () => {
    const result = observationSeries(readings[0], {
      series: [
        heartRate[0] ?? { key: "", match: [] },
        { key: "also", match: [{ system: LOINC, code: "8867-4" }] },
      ],
    });
    expect(ids(result, "hr")).toEqual(["Observation/early"]);
    expect(ids(result, "also")).toEqual(["Observation/early"]);
  });

  it.each([
    [
      {
        series: [
          { key: "a", match: [] },
          { key: "a", match: [] },
        ],
      },
      /"a" is used twice/,
    ],
    [{ series: [], period: { start: "2026-09-20" } }, /period.start "2026-09-20"/],
    [{ series: [], period: { end: "2026-09-20T08:00:00" } }, /period.end/],
  ])("throws for a mistake in the options: %#", (options, message) => {
    expect(() => observationSeries([], options)).toThrow(message);
  });
});

/** An Observation with a field replaced by something invalid. */
const broken = (fields: Record<string, unknown>) => ({ ...vital("bad"), ...fields });
const { valueQuantity: _value, ...noValue } = vital("bad");
const component = (fields: Record<string, unknown>) => ({
  ...noValue,
  component: [{ code: { coding: [{ system: LOINC, code: "8480-6" }] }, ...fields }],
});

describe("observationSeries issues", () => {
  it.each([
    // What the input is
    ["a number", 42, "not-a-resource", "error", "input"],
    ["an object with no resourceType", { id: "x" }, "not-a-resource", "error", "input"],
    ["a Patient", { resourceType: "Patient", id: "p1" }, "unexpected-resource", "warning", "input"],
    [
      "a Patient with no id",
      { resourceType: "Patient" },
      "unexpected-resource",
      "warning",
      "input",
    ],
    [
      "a Bundle entry that is not a list",
      { resourceType: "Bundle", entry: {} },
      "invalid-element",
      "warning",
      "input.entry",
    ],
    [
      "a Bundle entry with no resource",
      { resourceType: "Bundle", entry: [{ fullUrl: "x" }] },
      "missing-resource",
      "warning",
      "input.entry[0]",
    ],
    [
      "a Bundle entry that is not an object",
      { resourceType: "Bundle", entry: [3] },
      "missing-resource",
      "warning",
      "input.entry[0]",
    ],
    // The observation
    ["no id", broken({ id: undefined }), "missing-id", "error", "input"],
    ["an empty id", broken({ id: "" }), "missing-id", "error", "input"],
    [
      "an unknown status",
      broken({ status: "done" }),
      "invalid-status",
      "error",
      "Observation.status",
    ],
    ["no code", broken({ code: undefined }), "invalid-code", "error", "Observation.code"],
    [
      "a code with nothing in it",
      broken({ code: { coding: [], text: " " } }),
      "invalid-code",
      "error",
      "Observation.code",
    ],
    // Its time
    [
      "a schedule for a time",
      broken({ effectiveTiming: {} }),
      "unsupported-time",
      "error",
      "Observation.effectiveTiming",
    ],
    [
      "no time",
      broken({ effectiveDateTime: undefined }),
      "missing-time",
      "error",
      "Observation.effectiveDateTime",
    ],
    [
      "a period with no start",
      broken({ effectiveDateTime: undefined, effectivePeriod: { end: "2026-09-20T08:00:00Z" } }),
      "missing-time",
      "error",
      "Observation.effectivePeriod.start",
    ],
    [
      "a period that is not an object",
      broken({ effectiveDateTime: undefined, effectivePeriod: "today" }),
      "missing-time",
      "error",
      "Observation.effectivePeriod.start",
    ],
    [
      "an instant that is not a string",
      broken({ effectiveDateTime: undefined, effectiveInstant: 1 }),
      "missing-time",
      "error",
      "Observation.effectiveInstant",
    ],
    [
      "a date alone",
      broken({ effectiveDateTime: "2026-09-20" }),
      "imprecise-time",
      "error",
      "Observation.effectiveDateTime",
    ],
    [
      "a month alone",
      broken({ effectiveDateTime: "2026-09" }),
      "imprecise-time",
      "error",
      "Observation.effectiveDateTime",
    ],
    [
      "a time with no seconds",
      broken({ effectiveDateTime: "2026-09-20T08:00+10:00" }),
      "invalid-time",
      "error",
      "Observation.effectiveDateTime",
    ],
    [
      "a time with no offset",
      broken({ effectiveDateTime: "2026-09-20T08:00:00" }),
      "invalid-time",
      "error",
      "Observation.effectiveDateTime",
    ],
    [
      "a month that does not exist",
      broken({ effectiveDateTime: "2026-13-01T08:00:00Z" }),
      "invalid-time",
      "error",
      "Observation.effectiveDateTime",
    ],
    // Its value
    ["no value and no reason", noValue, "missing-value", "error", "Observation"],
    ["two values", broken({ valueString: "also" }), "multiple-values", "error", "Observation"],
    [
      "a range",
      { ...noValue, valueRange: { low: { value: 1 } } },
      "unsupported-value",
      "error",
      "Observation.valueRange",
    ],
    [
      "a quantity that is not an object",
      broken({ valueQuantity: 80 }),
      "invalid-value",
      "error",
      "Observation.valueQuantity",
    ],
    [
      "a quantity with no number",
      broken({ valueQuantity: { value: "80", system: UCUM, code: "/min" } }),
      "invalid-value",
      "error",
      "Observation.valueQuantity",
    ],
    [
      "a quantity with a comparator FHIR does not define",
      broken({ valueQuantity: { value: 1, comparator: "~" } }),
      "invalid-value",
      "error",
      "Observation.valueQuantity",
    ],
    [
      "a coded value with nothing in it",
      { ...noValue, valueCodeableConcept: {} },
      "invalid-value",
      "error",
      "Observation.valueCodeableConcept",
    ],
    [
      "a coded value that is not an object",
      { ...noValue, valueCodeableConcept: "A" },
      "invalid-value",
      "error",
      "Observation.valueCodeableConcept",
    ],
    [
      "text that is not a string",
      { ...noValue, valueString: 3 },
      "invalid-value",
      "error",
      "Observation.valueString",
    ],
    [
      "an integer with a fraction",
      { ...noValue, valueInteger: 1.5 },
      "invalid-value",
      "error",
      "Observation.valueInteger",
    ],
    [
      "an integer written as a string",
      { ...noValue, valueInteger: "2" },
      "invalid-value",
      "error",
      "Observation.valueInteger",
    ],
    [
      "a boolean written as a word",
      { ...noValue, valueBoolean: "yes" },
      "invalid-value",
      "error",
      "Observation.valueBoolean",
    ],
    // Its components
    [
      "components that are not a list",
      broken({ component: {} }),
      "invalid-element",
      "warning",
      "Observation.component",
    ],
    [
      "a component that is not an object",
      { ...noValue, component: [7] },
      "invalid-value",
      "error",
      "Observation.component[0]",
    ],
    [
      "a component with no code",
      component({ code: undefined, valueInteger: 1 }),
      "invalid-code",
      "error",
      "Observation.component[0].code",
    ],
    [
      "a component with no value",
      component({}),
      "missing-value",
      "error",
      "Observation.component[0]",
    ],
    // What the source said about the value
    [
      "an interpretation that is not a list",
      broken({ interpretation: {} }),
      "invalid-element",
      "warning",
      "Observation.interpretation",
    ],
    [
      "an interpretation with nothing in it",
      broken({ interpretation: [{}] }),
      "invalid-element",
      "warning",
      "Observation.interpretation[0]",
    ],
    [
      "reference ranges that are not a list",
      broken({ referenceRange: {} }),
      "invalid-element",
      "warning",
      "Observation.referenceRange",
    ],
    [
      "a reference range that is not an object",
      broken({ referenceRange: [1] }),
      "invalid-element",
      "warning",
      "Observation.referenceRange[0]",
    ],
    [
      "a reference range with an unreadable bound",
      broken({ referenceRange: [{ low: { value: "x" } }] }),
      "invalid-element",
      "warning",
      "Observation.referenceRange[0]",
    ],
    [
      "a reference range with nothing in it",
      broken({ referenceRange: [{}] }),
      "invalid-element",
      "warning",
      "Observation.referenceRange[0]",
    ],
    [
      "a reference range type that is not an object",
      broken({ referenceRange: [{ text: "x", type: "normal" }] }),
      "invalid-element",
      "warning",
      "Observation.referenceRange[0].type",
    ],
    // Codings
    [
      "a coding that is not an object",
      broken({ code: { coding: ["8867-4"], text: "Heart rate" } }),
      "invalid-element",
      "warning",
      "Observation.code.coding[0]",
    ],
    [
      "a coding with a code that is not a string",
      broken({ code: { coding: [{ system: LOINC, code: 8867 }], text: "Heart rate" } }),
      "invalid-element",
      "warning",
      "Observation.code.coding[0].code",
    ],
    [
      "codings that are not a list",
      broken({ code: { coding: {}, text: "Heart rate" } }),
      "invalid-element",
      "warning",
      "Observation.code.coding",
    ],
    [
      "text that is not a string",
      broken({ code: { coding: [{ system: LOINC, code: "8867-4" }], text: 1 } }),
      "invalid-element",
      "warning",
      "Observation.code.text",
    ],
  ])("reports %s", (_name, input, code, severity, path) => {
    const { issues } = observationSeries(input, { series: [] });
    expect(issues).toContainEqual(expect.objectContaining({ code, severity, path }));
  });

  it("names the resource an issue belongs to", () => {
    const { issues } = observationSeries(broken({ status: "done" }), { series: [] });
    expect(issues[0]?.resource).toBe("Observation/bad");
  });

  it("keeps the rest of a concept when one coding cannot be read", () => {
    const { others } = observationSeries(
      broken({ code: { coding: [7, { system: LOINC, code: "8867-4" }] } }),
      { series: [] },
    );
    expect(others[0]?.code).toEqual({ codings: [{ system: LOINC, code: "8867-4" }] });
  });

  it("keeps a reference range with text alone, and its type", () => {
    const { others } = observationSeries(
      broken({ referenceRange: [{ text: "Synthetic", type: { text: "normal" } }] }),
      { series: [] },
    );
    expect(others[0]?.source.referenceRanges).toEqual([
      { text: "Synthetic", type: { codings: [], text: "normal" } },
    ]);
  });

  it("reads nothing, and reports nothing, from a Bundle with no entries", () => {
    expect(
      observationSeries({ resourceType: "Bundle", type: "searchset" }, { series: [] }).issues,
    ).toEqual([]);
  });

  it("keeps a panel's components when its own value cannot be read", () => {
    const { others, issues } = observationSeries(
      { ...component({ valueInteger: 1 }), valueString: 3 },
      { series: [] },
    );
    expect(others.map(({ id }) => id)).toEqual(["Observation/bad#component[0]"]);
    expect(issues).toEqual([
      expect.objectContaining({ code: "invalid-value", path: "Observation.valueString" }),
    ]);
  });
});
