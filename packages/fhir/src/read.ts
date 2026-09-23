/**
 * Readers for FHIR R4 datatypes. Each takes `unknown`, checks the fields it reads, and returns a
 * view-model value or `undefined`. A part it has to leave out is reported to the log.
 */

import {
  COMPARATORS,
  type Coding,
  type Comparator,
  type Concept,
  type Quantity,
  type ReferenceRange,
} from "@cadence-clinical/core";

import { report, type IssueCode, type IssueLog, type IssueSeverity } from "./issues";

/** The UCUM code system's URI, as FHIR writes it. */
export const UCUM_SYSTEM = "http://unitsofmeasure.org";

/** Where a reader is working: the log, and the resource its issues belong to. */
export interface ReadContext extends IssueLog {
  readonly resource?: string;
}

/** A JSON object whose fields are still unchecked. */
export type UnknownRecord = Readonly<Record<string, unknown>>;

/** True for a JSON object: not null, not an array. */
export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Records an issue against the context's resource. */
export function reportAt(
  context: ReadContext,
  severity: IssueSeverity,
  code: IssueCode,
  path: string,
  message: string,
): void {
  report(context, {
    severity,
    code,
    path,
    message,
    ...(context.resource === undefined ? {} : { resource: context.resource }),
  });
}

/** The field as a string, or undefined when it is missing or not a string. */
export function stringField(record: UnknownRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function isComparator(value: unknown): value is Comparator {
  return COMPARATORS.some((comparator) => comparator === value);
}

/**
 * Reads a Coding. Returns undefined, and reports it, when the coding or any of its string fields
 * is the wrong type, because a code with a wrong system would match the wrong series.
 */
function readCoding(context: ReadContext, raw: unknown, path: string): Coding | undefined {
  if (!isRecord(raw)) {
    reportAt(
      context,
      "warning",
      "invalid-element",
      path,
      "A coding is not an object, so it was left out.",
    );
    return undefined;
  }
  const coding: Record<string, string> = {};
  for (const key of ["system", "code", "display"] as const) {
    const value = raw[key];
    if (value === undefined) continue;
    if (typeof value !== "string") {
      reportAt(
        context,
        "warning",
        "invalid-element",
        `${path}.${key}`,
        `A coding's ${key} is not a string, so the coding was left out.`,
      );
      return undefined;
    }
    coding[key] = value;
  }
  return coding;
}

/**
 * Reads a CodeableConcept. Returns undefined when it is not an object. A coding or text that
 * cannot be read is left out and reported, and the rest of the concept is kept.
 */
export function readConcept(context: ReadContext, raw: unknown, path: string): Concept | undefined {
  if (!isRecord(raw)) return undefined;

  const codings: Coding[] = [];
  const rawCodings = raw["coding"];
  if (Array.isArray(rawCodings)) {
    rawCodings.forEach((rawCoding: unknown, index) => {
      const coding = readCoding(context, rawCoding, `${path}.coding[${index}]`);
      if (coding) codings.push(coding);
    });
  } else if (rawCodings !== undefined) {
    reportAt(
      context,
      "warning",
      "invalid-element",
      `${path}.coding`,
      "The codings are not a list, so they were left out.",
    );
  }

  const text = raw["text"];
  if (text !== undefined && typeof text !== "string") {
    reportAt(
      context,
      "warning",
      "invalid-element",
      `${path}.text`,
      "The text is not a string, so it was left out.",
    );
  }

  return typeof text === "string" ? { codings, text } : { codings };
}

/** True when a concept says something: at least one coding or some text. */
export function hasMeaning(concept: Concept): boolean {
  return concept.codings.length > 0 || (concept.text !== undefined && concept.text.trim() !== "");
}

/**
 * Reads a Quantity. Returns undefined when its value is not a finite number, or when its
 * comparator is one FHIR does not define: dropping an unreadable comparator would turn "less
 * than 0.5" into "0.5". A quantity without a UCUM unit is kept, and a warning says so.
 */
export function readQuantity(
  context: ReadContext,
  raw: unknown,
  path: string,
): Quantity | undefined {
  if (!isRecord(raw)) return undefined;

  const value = raw["value"];
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;

  const comparator = raw["comparator"];
  if (comparator !== undefined && !isComparator(comparator)) return undefined;

  const unitText = stringField(raw, "unit");
  const code = stringField(raw, "code");
  const ucum = stringField(raw, "system") === UCUM_SYSTEM ? code : undefined;
  if (ucum === undefined) {
    reportAt(
      context,
      "warning",
      "no-ucum-unit",
      path,
      unitText === undefined
        ? "The quantity has no unit. It was kept as a bare number."
        : `The quantity has no UCUM unit. It was kept with the unit "${unitText}" as written.`,
    );
  }

  return {
    value,
    ...(ucum === undefined ? {} : { ucum }),
    ...(unitText === undefined ? {} : { unitText }),
    ...(comparator === undefined ? {} : { comparator }),
  };
}

/**
 * Reads a reference range. Returns undefined, and reports it, when the range or one of its bounds
 * cannot be read: half a range would read as no limit on that side.
 */
export function readReferenceRange(
  context: ReadContext,
  raw: unknown,
  path: string,
): ReferenceRange | undefined {
  const leaveOut = (message: string): void => {
    reportAt(context, "warning", "invalid-element", path, message);
  };
  if (!isRecord(raw)) {
    leaveOut("A reference range is not an object, so it was left out.");
    return;
  }

  const range: { low?: Quantity; high?: Quantity; type?: Concept; text?: string } = {};
  for (const bound of ["low", "high"] as const) {
    if (raw[bound] === undefined) continue;
    const quantity = readQuantity(context, raw[bound], `${path}.${bound}`);
    if (!quantity) {
      leaveOut(`A reference range's ${bound} cannot be read, so the range was left out.`);
      return;
    }
    range[bound] = quantity;
  }

  if (raw["type"] !== undefined) {
    const type = readConcept(context, raw["type"], `${path}.type`);
    if (type) range.type = type;
    else
      reportAt(
        context,
        "warning",
        "invalid-element",
        `${path}.type`,
        "A reference range's type is not an object, so it was left out.",
      );
  }

  const text = stringField(raw, "text");
  if (text !== undefined) range.text = text;

  if (range.low === undefined && range.high === undefined && range.text === undefined) {
    leaveOut("A reference range has no low, no high and no text, so it was left out.");
    return;
  }
  return range;
}

/**
 * Reads a list of CodeableConcepts, such as an interpretation. Anything that is not a concept
 * with meaning is left out and reported.
 */
export function readConcepts(context: ReadContext, raw: unknown, path: string): Concept[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    reportAt(
      context,
      "warning",
      "invalid-element",
      path,
      "The element is not a list, so it was left out.",
    );
    return [];
  }
  const concepts: Concept[] = [];
  raw.forEach((item: unknown, index) => {
    const concept = readConcept(context, item, `${path}[${index}]`);
    if (concept && hasMeaning(concept)) concepts.push(concept);
    else
      reportAt(
        context,
        "warning",
        "invalid-element",
        `${path}[${index}]`,
        "An entry has no coding and no text, so it was left out.",
      );
  });
  return concepts;
}

/** Reads a list of reference ranges. Anything that cannot be read is left out and reported. */
export function readReferenceRanges(
  context: ReadContext,
  raw: unknown,
  path: string,
): ReferenceRange[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    reportAt(
      context,
      "warning",
      "invalid-element",
      path,
      "The reference ranges are not a list, so they were left out.",
    );
    return [];
  }
  const ranges: ReferenceRange[] = [];
  raw.forEach((item: unknown, index) => {
    const range = readReferenceRange(context, item, `${path}[${index}]`);
    if (range) ranges.push(range);
  });
  return ranges;
}

/** A full FHIR dateTime or instant: a date, a time to the second and an offset. */
const FULL_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
/** A FHIR dateTime with no time of day: a year, a month or a date. */
const PARTIAL_DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

/** Milliseconds since the epoch for a full time, or undefined when it is not one. */
export function parseFullTime(value: string): number | undefined {
  if (!FULL_TIME.test(value)) return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
}

/**
 * Checks a moment that must be placed on a timeline: a date, a time of day and an offset. Returns
 * undefined, reported as an error, when it is missing, is a date alone, or is not a valid time.
 * `subject` names what the time belongs to in the message, such as "observation".
 */
export function readMoment(
  context: ReadContext,
  time: string | undefined,
  path: string,
  subject: string,
): { time: string; timeMs: number } | undefined {
  if (time === undefined) {
    reportAt(
      context,
      "error",
      "missing-time",
      path,
      `The ${subject} has no time, so it was left out.`,
    );
    return undefined;
  }
  if (PARTIAL_DATE.test(time)) {
    reportAt(
      context,
      "error",
      "imprecise-time",
      path,
      `The ${subject}'s time "${time}" has no time of day, so it was left out.`,
    );
    return undefined;
  }
  const timeMs = parseFullTime(time);
  if (timeMs === undefined) {
    reportAt(
      context,
      "error",
      "invalid-time",
      path,
      `The ${subject}'s time "${time}" is not a valid date and time with an offset, so it was left out.`,
    );
    return undefined;
  }
  return { time, timeMs };
}
