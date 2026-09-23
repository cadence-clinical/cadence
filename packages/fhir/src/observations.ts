/**
 * FHIR R4 Observations to the observation view model in core. The input is `unknown`: every
 * field is checked before it is used, and anything left out is reported as an issue
 * (docs/decisions/0016-fhir-transforms.md).
 */

import {
  OBSERVATION_STATUSES,
  type Concept,
  type ObservationReading,
  type ObservationSeries,
  type ObservationSeriesSelection,
  type ObservationStatus,
  type ObservationValue,
} from "@cadence-clinical/core";

import { type TransformIssue } from "./issues";
import {
  hasMeaning,
  isRecord,
  readConcept,
  readConcepts,
  readQuantity,
  parseFullTime,
  readMoment,
  readReferenceRanges,
  reportAt,
  stringField,
  type ReadContext,
  type UnknownRecord,
} from "./read";

/**
 * The statuses read by default. A cancelled observation has no result, an entered-in-error one
 * must not be shown as data, and a registered one has no value yet. A consumer who needs any of
 * them asks for it by name.
 */
export const DEFAULT_OBSERVATION_STATUSES: readonly ObservationStatus[] = [
  "preliminary",
  "final",
  "amended",
  "corrected",
];

/** What to read, and from when. */
export interface ObservationSeriesOptions {
  /** The series to build, in order. A reading that matches none of them is in `others`. */
  readonly series: readonly ObservationSeriesSelection[];
  /**
   * Keep readings at or after `start` and before `end`. Each is ISO 8601 with a time and an
   * offset. Leave either out for no limit on that side.
   */
  readonly period?: { readonly start?: string; readonly end?: string };
  /** Keep a reading only when this returns true, for a selection a coding cannot express. */
  readonly where?: (reading: ObservationReading) => boolean;
  /** The statuses to read. Defaults to `DEFAULT_OBSERVATION_STATUSES`. */
  readonly statuses?: readonly ObservationStatus[];
}

/** An observation left out because of its status, which is a choice rather than a problem. */
export interface ExcludedObservation {
  readonly resource: string;
  readonly status: ObservationStatus;
}

/** What `observationSeries` returns. */
export interface ObservationSeriesResult {
  /** One series per selection, in the order given, including those with no readings. */
  readonly series: readonly ObservationSeries[];
  /** Readings in the period that match no series, oldest first. */
  readonly others: readonly ObservationReading[];
  /** Observations left out because of their status. */
  readonly excluded: readonly ExcludedObservation[];
  readonly issues: readonly TransformIssue[];
}

/** The value[x] names this transform reads, and the kind each becomes. */
const SUPPORTED_VALUES = [
  "valueQuantity",
  "valueCodeableConcept",
  "valueString",
  "valueInteger",
  "valueBoolean",
] as const;

type SupportedValue = (typeof SUPPORTED_VALUES)[number];

function isSupportedValue(key: string): key is SupportedValue {
  return SUPPORTED_VALUES.some((name) => name === key);
}

function isStatus(value: unknown): value is ObservationStatus {
  return OBSERVATION_STATUSES.some((status) => status === value);
}

/** Checks the period once, because a wrong period is a mistake in the calling code. */
function periodBounds(period: ObservationSeriesOptions["period"]): {
  startMs: number;
  endMs: number;
} {
  const bound = (value: string | undefined, fallback: number, name: string): number => {
    if (value === undefined) return fallback;
    const ms = parseFullTime(value);
    if (ms === undefined) {
      throw new Error(
        `observationSeries: period.${name} "${value}" is not ISO 8601 with a time and an offset, such as 2026-09-23T08:00:00+10:00.`,
      );
    }
    return ms;
  };
  return {
    startMs: bound(period?.start, -Infinity, "start"),
    endMs: bound(period?.end, Infinity, "end"),
  };
}

/** Checks the series keys once. Two series with one key would be indistinguishable. */
function checkSelections(selections: readonly ObservationSeriesSelection[]): void {
  const keys = new Set<string>();
  for (const { key } of selections) {
    if (keys.has(key)) {
      throw new Error(
        `observationSeries: the series key "${key}" is used twice. Give each series its own key.`,
      );
    }
    keys.add(key);
  }
}

/** The time an observation was made, or undefined, reported, when it has none that can be used. */
function readTime(
  context: ReadContext,
  raw: UnknownRecord,
): { time: string; timeMs: number } | undefined {
  const error = (code: "unsupported-time", path: string, message: string): void => {
    reportAt(context, "error", code, path, message);
  };

  if (raw["effectiveTiming"] !== undefined) {
    error(
      "unsupported-time",
      "Observation.effectiveTiming",
      "The observation's time is a schedule, which cannot be placed on a timeline. It was left out.",
    );
    return;
  }

  let time: string | undefined;
  let path: string;
  const period = raw["effectivePeriod"];
  if (period !== undefined) {
    path = "Observation.effectivePeriod.start";
    time = isRecord(period) ? stringField(period, "start") : undefined;
  } else if (raw["effectiveInstant"] !== undefined) {
    path = "Observation.effectiveInstant";
    time = stringField(raw, "effectiveInstant");
  } else {
    path = "Observation.effectiveDateTime";
    time = stringField(raw, "effectiveDateTime");
  }

  // The time the result was issued is not when it was observed, so it is not used instead.
  return readMoment(context, time, path, "observation");
}

/**
 * Reads the value[x] of an observation or a component. Returns `none` when it has no value and
 * no reason for one, and `invalid` when its value cannot be read, which is reported.
 */
function readValue(
  context: ReadContext,
  raw: UnknownRecord,
  path: string,
): ObservationValue | "none" | "invalid" {
  const keys = Object.keys(raw).filter((key) => key.startsWith("value"));
  const [key] = keys;

  if (key === undefined) {
    const reason = raw["dataAbsentReason"];
    if (reason === undefined) return "none";
    const concept = readConcept(context, reason, `${path}.dataAbsentReason`);
    if (concept && hasMeaning(concept)) return { kind: "absent", reason: concept };
    reportAt(
      context,
      "warning",
      "invalid-element",
      `${path}.dataAbsentReason`,
      "The reason the value is absent cannot be read. The value is shown as absent with no reason.",
    );
    return { kind: "absent" };
  }

  const invalid = (
    code: "multiple-values" | "invalid-value" | "unsupported-value",
    message: string,
    at = `${path}.${key}`,
  ): "invalid" => {
    reportAt(context, "error", code, at, message);
    return "invalid";
  };

  if (keys.length > 1) {
    return invalid(
      "multiple-values",
      `There is more than one value (${keys.join(", ")}), so the value was left out.`,
      path,
    );
  }
  if (!isSupportedValue(key)) {
    return invalid(
      "unsupported-value",
      `A value of type ${key} is not read yet, so it was left out.`,
    );
  }

  const value = raw[key];
  switch (key) {
    case "valueQuantity": {
      const quantity = readQuantity(context, value, `${path}.${key}`);
      return quantity
        ? { kind: "quantity", quantity }
        : invalid(
            "invalid-value",
            "The quantity has no number or has a comparator FHIR does not define, so it was left out.",
          );
    }
    case "valueCodeableConcept": {
      const concept = readConcept(context, value, `${path}.${key}`);
      return concept && hasMeaning(concept)
        ? { kind: "concept", concept }
        : invalid(
            "invalid-value",
            "The coded value has no coding and no text, so it was left out.",
          );
    }
    case "valueString":
      return typeof value === "string"
        ? { kind: "text", text: value }
        : invalid("invalid-value", "The text value is not a string, so it was left out.");
    case "valueInteger":
      return Number.isInteger(value) && typeof value === "number"
        ? { kind: "integer", value }
        : invalid("invalid-value", "The integer value is not an integer, so it was left out.");
    case "valueBoolean":
      return typeof value === "boolean"
        ? { kind: "boolean", value }
        : invalid(
            "invalid-value",
            "The true-or-false value is not true or false, so it was left out.",
          );
  }
}

/** The parts every reading of one observation shares. */
interface ObservationFacts {
  readonly resource: string;
  readonly status: ObservationStatus;
  readonly time: string;
  readonly timeMs: number;
  readonly code: Concept;
}

/** Reads the observation's own value and each component's, as readings. */
function readReadings(
  context: ReadContext,
  raw: UnknownRecord,
  facts: ObservationFacts,
): ObservationReading[] {
  const readings: ObservationReading[] = [];

  const reading = (
    element: UnknownRecord,
    path: string,
    id: string,
    code: Concept,
    panel?: Concept,
  ): void => {
    const value = readValue(context, element, path);
    if (value === "invalid") return;
    if (value === "none") {
      reportAt(
        context,
        "error",
        "missing-value",
        path,
        "There is no value and no reason for its absence, so it was left out.",
      );
      return;
    }
    readings.push({
      id,
      resource: facts.resource,
      code,
      ...(panel === undefined ? {} : { panel }),
      status: facts.status,
      time: facts.time,
      timeMs: facts.timeMs,
      value,
      source: {
        interpretation: readConcepts(context, element["interpretation"], `${path}.interpretation`),
        referenceRanges: readReferenceRanges(
          context,
          element["referenceRange"],
          `${path}.referenceRange`,
        ),
      },
    });
  };

  const components = raw["component"];
  if (components !== undefined && !Array.isArray(components)) {
    reportAt(
      context,
      "warning",
      "invalid-element",
      "Observation.component",
      "The components are not a list, so they were left out.",
    );
  }
  const componentList: unknown[] = Array.isArray(components) ? components : [];

  // A panel such as blood pressure carries its values in components and none of its own.
  const hasOwnValue =
    Object.keys(raw).some((key) => key.startsWith("value")) ||
    raw["dataAbsentReason"] !== undefined;
  if (hasOwnValue || componentList.length === 0) {
    reading(raw, "Observation", facts.resource, facts.code);
  }

  componentList.forEach((component: unknown, index) => {
    const path = `Observation.component[${index}]`;
    if (!isRecord(component)) {
      reportAt(
        context,
        "error",
        "invalid-value",
        path,
        "A component is not an object, so it was left out.",
      );
      return;
    }
    const code = readConcept(context, component["code"], `${path}.code`);
    if (!code || !hasMeaning(code)) {
      reportAt(
        context,
        "error",
        "invalid-code",
        `${path}.code`,
        "A component has no code, so it was left out.",
      );
      return;
    }
    reading(component, path, `${facts.resource}#component[${index}]`, code, facts.code);
  });

  return readings;
}

/** Where the transform is: the log, what has been read, and what to keep. */
interface WalkState extends ReadContext {
  readonly seen: Set<string>;
  readonly readings: ObservationReading[];
  readonly excluded: ExcludedObservation[];
  readonly statuses: readonly ObservationStatus[];
}

function readObservation(state: WalkState, raw: UnknownRecord, at: string): void {
  const id = stringField(raw, "id");
  if (id === undefined || id === "") {
    reportAt(state, "error", "missing-id", at, "An observation has no id, so it was left out.");
    return;
  }
  const resource = `Observation/${id}`;
  const context: ReadContext = { issues: state.issues, resource };

  if (state.seen.has(resource)) {
    reportAt(
      context,
      "warning",
      "duplicate-id",
      at,
      "This observation was read already, so the second copy was ignored.",
    );
    return;
  }
  state.seen.add(resource);

  const status = raw["status"];
  if (!isStatus(status)) {
    reportAt(
      context,
      "error",
      "invalid-status",
      "Observation.status",
      "The observation's status is missing or is not a FHIR status, so it was left out.",
    );
    return;
  }
  if (!state.statuses.includes(status)) {
    state.excluded.push({ resource, status });
    return;
  }

  const code = readConcept(context, raw["code"], "Observation.code");
  if (!code || !hasMeaning(code)) {
    reportAt(
      context,
      "error",
      "invalid-code",
      "Observation.code",
      "The observation has no code, so it was left out.",
    );
    return;
  }

  const time = readTime(context, raw);
  if (!time) return;

  state.readings.push(...readReadings(context, raw, { resource, status, code, ...time }));
}

/** Walks resources, Bundles and lists of either, reading each Observation found. */
function walk(state: WalkState, item: unknown, at: string): void {
  if (Array.isArray(item)) {
    item.forEach((child: unknown, index) => {
      walk(state, child, `${at}[${index}]`);
    });
    return;
  }

  const resourceType = isRecord(item) ? item["resourceType"] : undefined;
  if (!isRecord(item) || typeof resourceType !== "string") {
    reportAt(
      state,
      "error",
      "not-a-resource",
      at,
      "This item is not a FHIR resource, so it was left out.",
    );
    return;
  }

  if (resourceType === "Observation") {
    readObservation(state, item, at);
    return;
  }

  if (resourceType !== "Bundle") {
    const id = stringField(item, "id");
    reportAt(
      { issues: state.issues, ...(id === undefined ? {} : { resource: `${resourceType}/${id}` }) },
      "warning",
      "unexpected-resource",
      at,
      `This resource is a ${resourceType}, not an Observation, so it was not read.`,
    );
    return;
  }

  const entries = item["entry"];
  if (entries === undefined) return;
  if (!Array.isArray(entries)) {
    reportAt(
      state,
      "warning",
      "invalid-element",
      `${at}.entry`,
      "The Bundle's entries are not a list, so none were read.",
    );
    return;
  }
  entries.forEach((entry: unknown, index) => {
    const entryAt = `${at}.entry[${index}]`;
    if (!isRecord(entry) || entry["resource"] === undefined) {
      reportAt(state, "warning", "missing-resource", entryAt, "A Bundle entry has no resource.");
      return;
    }
    walk(state, entry["resource"], `${entryAt}.resource`);
  });
}

function hasMatch(reading: ObservationReading, selection: ObservationSeriesSelection): boolean {
  return reading.code.codings.some((coding) =>
    selection.match.some((match) => coding.system === match.system && coding.code === match.code),
  );
}

/** Oldest first. Readings at one moment are ordered by id, which is unique within a result. */
function byTime(a: ObservationReading, b: ObservationReading): number {
  return a.timeMs - b.timeMs || (a.id < b.id ? -1 : 1);
}

/**
 * Reads FHIR R4 Observations into series. The input may be an Observation, a Bundle, or a list
 * of either, such as the pages of a search. Each reading is placed in every series it matches,
 * and a reading that matches none is in `others`.
 *
 * Nothing is left out silently: an observation left out because of its status is in `excluded`,
 * and anything that could not be read is in `issues`. It checks the fields it reads. It is not a
 * FHIR validator.
 *
 * Throws when `options` is wrong: two series with one key, or a period bound that is not ISO
 * 8601 with a time and an offset.
 */
export function observationSeries(
  input: unknown,
  options: ObservationSeriesOptions,
): ObservationSeriesResult {
  checkSelections(options.series);
  const { startMs, endMs } = periodBounds(options.period);

  const state: WalkState = {
    issues: [],
    seen: new Set(),
    readings: [],
    excluded: [],
    statuses: options.statuses ?? DEFAULT_OBSERVATION_STATUSES,
  };
  walk(state, input, "input");

  const kept = state.readings
    .filter(({ timeMs }) => timeMs >= startMs && timeMs < endMs)
    .filter((reading) => options.where?.(reading) ?? true)
    .sort(byTime);

  return {
    series: options.series.map((selection) => ({
      key: selection.key,
      readings: kept.filter((reading) => hasMatch(reading, selection)),
    })),
    others: kept.filter(
      (reading) => !options.series.some((selection) => hasMatch(reading, selection)),
    ),
    excluded: state.excluded,
    issues: state.issues,
  };
}
