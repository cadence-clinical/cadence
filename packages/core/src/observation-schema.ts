/**
 * The observation schema: what a consumer or a Region supplies to interpret observations. It
 * holds the words for each level, the thresholds that place a value in a band, and the words for
 * the source's own interpretation codes. A pure function applies it to a view model, so a
 * component draws the band it is given and holds no threshold
 * (docs/decisions/0016-fhir-transforms.md).
 *
 * Cadence ships no schema. A published one belongs in a Region package as the data of a cited,
 * graded `RuleSet`.
 */

import type { ObservationRound } from "./rounds";
import type {
  CodingMatch,
  Comparator,
  Concept,
  ObservationReading,
  ObservationSeries,
  ObservationSeriesSelection,
} from "./observation";

/**
 * The fixed, ordered severity scale a level draws its colour from, lowest first. A schema picks a
 * step for each level and cannot supply a colour of its own, so what a colour means is the same
 * in every schema (docs/decisions/0015-charts.md). The tokens package gives each step its colour.
 */
export const SEVERITY_SCALE = [
  "severity-0",
  "severity-1",
  "severity-2",
  "severity-3",
  "severity-4",
  "severity-5",
  "severity-6",
] as const;

/** One step of the severity scale. */
export type SeverityStep = (typeof SEVERITY_SCALE)[number];

/** A level a band can place a value in, such as "Score 2" or "Yellow zone". */
export interface ObservationLevel {
  /** Unique within the schema. */
  readonly key: string;
  /** The level in words. It is shown with the colour, so the colour is never the only signal. */
  readonly label: string;
  /**
   * A few characters for the level where there is no room for its words, such as `2` beside a
   * value in a table cell. A level at step 0 may leave it empty.
   */
  readonly short: string;
  readonly severity: SeverityStep;
  /**
   * What a reading at this level adds to a total score, such as an early warning score. Leave it
   * out for a schema with no total, or for a level that escalates a total on its own.
   */
  readonly score?: number;
}

/**
 * A band of values that places a reading in a level. It runs from `from`, included, up to
 * `below`, not included, so two bands written as 30 to 34 and 35 to 39 are entered as 30 below 35
 * and 35 below 40, and no value falls between them. Leave `from` or `below` out for no limit.
 */
export interface ObservationBand {
  /** The key of the level this band places a value in. */
  readonly level: string;
  readonly from?: number;
  readonly below?: number;
}

/** A coded answer, such as a level of consciousness, and the level it places a reading in. */
export interface ObservationAnswer {
  readonly level: string;
  /** Codes that give this answer. */
  readonly match?: readonly CodingMatch[];
  /** Text that gives this answer, compared exactly after trimming, for answers with no code. */
  readonly text?: readonly string[];
}

/** One series: what it matches, what it is called, and how its values are banded. */
export interface ObservationSeriesDefinition extends ObservationSeriesSelection {
  /** The series in words, such as "Respiratory rate". */
  readonly label: string;
  /**
   * The UCUM unit the bands are written in. A reading in any other unit is not banded, so a
   * temperature in degrees Fahrenheit is never compared with thresholds in Celsius. A series of
   * scores, such as a sedation score given as a whole number, uses `{score}`.
   */
  readonly ucum?: string;
  /** The unit in words for people to read, such as "breaths/min" for `/min`. */
  readonly unitLabel?: string;
  /** The range to show by default, in `ucum`. */
  readonly range?: { readonly min: number; readonly max: number };
  /** Bands for numeric values, in `ucum`. They must not overlap or leave a gap. */
  readonly bands?: readonly ObservationBand[];
  /** Levels for coded answers. */
  readonly answers?: readonly ObservationAnswer[];
}

/** Words for one of the source's interpretation codes, such as "Very low" for `LU`. */
export interface InterpretationLabel extends CodingMatch {
  readonly label: string;
}

/** A reading at any of `fromLevels` puts its round's total at `level` at least, whatever the sum. */
export interface ObservationEscalation {
  readonly fromLevels: readonly string[];
  readonly level: string;
}

/**
 * A total score for each round, such as an early warning score: the sum of the scores of the
 * levels its readings are in. The schema states it. Cadence adds it up and holds no value of it.
 */
export interface ObservationTotal {
  /** The total in words, such as "Total score". */
  readonly label: string;
  /**
   * The series a round must have a scored reading of for its total to be complete. A total with
   * one missing would read lower than it is, so it is shown as incomplete.
   */
  readonly requires: readonly string[];
  /** Bands for the total, in `{score}`, placing it in one of the schema's levels. */
  readonly bands?: readonly ObservationBand[];
  /** Levels that raise a round's total on their own, such as a value that calls for help. */
  readonly escalations?: readonly ObservationEscalation[];
}

/** A schema for interpreting observations. */
export interface ObservationSchema {
  /** The levels, in order of severity, lowest first. */
  readonly levels: readonly ObservationLevel[];
  readonly series: readonly ObservationSeriesDefinition[];
  /** Words for the source's interpretation codes. A code with none keeps the source's words. */
  readonly interpretationLabels?: readonly InterpretationLabel[];
  /** A total score for each round. */
  readonly total?: ObservationTotal;
}

/** Why a reading has no band. Each reason is shown differently from "normal". */
export type UnbandedReason =
  /** The schema has no bands or answers for this series. */
  | "no-bands"
  /** The value is outside every band. */
  | "outside-bands"
  /** The value's unit is not the unit the bands are written in. */
  | "unit-mismatch"
  /** The value has no UCUM unit, so its unit cannot be compared. */
  | "no-unit"
  /** The value has a comparator, and the range it could be in crosses a band edge. */
  | "comparator"
  /** A coded answer that no answer in the schema matches. */
  | "unknown-answer"
  /** A kind of value that bands do not apply to, such as text. */
  | "not-banded-kind"
  /** The value is absent. */
  | "absent";

/** The band the schema placed a reading in, or why it placed it in none. */
export type ReadingBand =
  | { readonly kind: "level"; readonly level: ObservationLevel }
  | { readonly kind: "none"; readonly reason: UnbandedReason };

/** How a numeric reading compares with the latest reading before it in the same series. */
export interface ReadingChange {
  /** The earlier reading's id. */
  readonly previousId: string;
  /**
   * This value less the earlier one, rounded to the finer precision of the two. Undefined when
   * the two cannot be compared, such as values in different units.
   */
  readonly change?: number;
  /** Milliseconds between the two readings. */
  readonly elapsedMs: number;
}

/** A reading with what the schema says about it, beside what the source said. */
export interface InterpretedReading extends ObservationReading {
  readonly band: ReadingBand;
  /** The source's interpretation codes in the schema's words, or the source's own words. */
  readonly sourceLabels: readonly string[];
  /** Undefined for the first numeric reading in its series, and for values that are not numeric. */
  readonly previous?: ReadingChange;
}

/** A series with its definition, when the schema has one, and its interpreted readings. */
export interface InterpretedSeries {
  readonly key: string;
  readonly definition?: ObservationSeriesDefinition;
  readonly readings: readonly InterpretedReading[];
}

/** The UCUM unit for a score, which is how a whole-number value is read. */
const SCORE = "{score}";

/** A band or answer with its level looked up. */
interface Resolved<T> {
  readonly rule: T;
  readonly level: ObservationLevel;
}

/** A series definition with its bands' and answers' levels looked up. */
interface ResolvedSeries {
  readonly definition: ObservationSeriesDefinition;
  readonly bands: readonly Resolved<ObservationBand>[];
  readonly answers: readonly Resolved<ObservationAnswer>[];
}

/** Collects what is wrong with the shape of a set of bands: an empty band, an overlap or a gap. */
function checkBandShape(name: string, bands: readonly ObservationBand[], problems: string[]): void {
  for (const band of bands) {
    if (band.from !== undefined && band.below !== undefined && band.from >= band.below) {
      problems.push(
        `${name} has a band from ${band.from} below ${band.below}, which holds no value.`,
      );
    }
  }
  const ordered = [...bands].sort((a, b) => (a.from ?? -Infinity) - (b.from ?? -Infinity));
  ordered.forEach((band, index) => {
    const next = ordered[index + 1];
    if (next === undefined) return;
    const end = band.below ?? Infinity;
    const start = next.from ?? -Infinity;
    if (end > start) problems.push(`${name} has bands that overlap at ${start}.`);
    if (end < start) {
      problems.push(
        `${name} has a gap between ${end} and ${start}, where a value would get no band.`,
      );
    }
  });
}

/** Checks a schema and looks up every level it refers to, collecting what is wrong. */
function resolve(schema: ObservationSchema): {
  problems: string[];
  series: Map<string, ResolvedSeries>;
  totalBands: Resolved<ObservationBand>[];
} {
  const problems: string[] = [];
  const levels = new Map<string, ObservationLevel>();

  for (const level of schema.levels) {
    if (levels.has(level.key)) problems.push(`The level key "${level.key}" is used twice.`);
    levels.set(level.key, level);
  }

  const series = new Map<string, ResolvedSeries>();
  for (const definition of schema.series) {
    const name = `Series "${definition.key}"`;
    if (series.has(definition.key)) problems.push(`${name} is defined twice.`);

    if (definition.range && definition.range.min >= definition.range.max) {
      problems.push(`${name} has a range whose min is not below its max.`);
    }

    const withLevels = <T extends { readonly level: string }>(rules: readonly T[]): Resolved<T>[] =>
      rules.flatMap((rule) => {
        const level = levels.get(rule.level);
        if (level) return [{ rule, level }];
        problems.push(`${name} refers to the level "${rule.level}", which is not defined.`);
        return [];
      });

    const bands = definition.bands ?? [];
    if (bands.length > 0 && definition.ucum === undefined) {
      problems.push(`${name} has bands but no unit. Bands need the unit they are written in.`);
    }
    checkBandShape(name, bands, problems);

    series.set(definition.key, {
      definition,
      bands: withLevels(bands),
      answers: withLevels(definition.answers ?? []),
    });
  }

  const totalBands: Resolved<ObservationBand>[] = [];
  const { total } = schema;
  if (total) {
    const name = `The total "${total.label}"`;
    for (const key of total.requires) {
      const required = series.get(key);
      if (!required) {
        problems.push(`${name} requires the series "${key}", which is not defined.`);
        continue;
      }
      const escalating = new Set((total.escalations ?? []).flatMap(({ fromLevels }) => fromLevels));
      for (const { level } of [...required.bands, ...required.answers]) {
        // A level that escalates on its own, such as a call for help, needs no score.
        if (level.score === undefined && !escalating.has(level.key)) {
          problems.push(`${name} adds up "${key}", whose level "${level.key}" has no score.`);
        }
      }
    }
    checkBandShape(name, total.bands ?? [], problems);
    for (const rule of total.bands ?? []) {
      const level = levels.get(rule.level);
      if (level) totalBands.push({ rule, level });
      else problems.push(`${name} has a band at the level "${rule.level}", which is not defined.`);
    }
    for (const { fromLevels, level } of total.escalations ?? []) {
      for (const key of [...fromLevels, level]) {
        if (!levels.has(key))
          problems.push(`${name} escalates with the level "${key}", which is not defined.`);
      }
    }
  }

  const labelled = new Set<string>();
  for (const { system, code } of schema.interpretationLabels ?? []) {
    const id = `${system}|${code}`;
    if (labelled.has(id)) problems.push(`The interpretation code ${id} has two labels.`);
    labelled.add(id);
  }

  return { problems, series, totalBands };
}

/** Returns the problems with a schema. An empty array means it can be applied. */
export function checkObservationSchema(schema: ObservationSchema): string[] {
  return resolve(schema).problems;
}

/**
 * Checks a schema and returns it. Throws with every problem when it cannot be applied, because a
 * schema written in code with overlapping bands is a mistake to fix before anything is shown.
 */
export function defineObservationSchema<const TSchema extends ObservationSchema>(
  schema: TSchema,
): TSchema {
  const { problems } = resolve(schema);
  if (problems.length > 0) {
    throw new Error(`The observation schema cannot be applied:\n- ${problems.join("\n- ")}`);
  }
  return schema;
}

function inBand(value: number, band: ObservationBand): boolean {
  return (
    (band.from === undefined || value >= band.from) &&
    (band.below === undefined || value < band.below)
  );
}

/**
 * The band for a number, which a comparator turns into a range. "Less than 5" is banded only when
 * one band holds every value below 5, down to no limit: otherwise the true value could be in
 * either of two bands.
 */
function numericBand(
  value: number,
  comparator: Comparator | undefined,
  bands: readonly Resolved<ObservationBand>[],
): Resolved<ObservationBand> | UnbandedReason {
  const lowest = bands.find(({ rule }) => rule.from === undefined);
  const highest = bands.find(({ rule }) => rule.below === undefined);
  const reach = (band: Resolved<ObservationBand> | undefined, holds: boolean) =>
    band && holds ? band : "comparator";

  switch (comparator) {
    case undefined:
      return bands.find(({ rule }) => inBand(value, rule)) ?? "outside-bands";
    case "<":
      return reach(lowest, (lowest?.rule.below ?? Infinity) >= value);
    case "<=":
      return reach(lowest, (lowest?.rule.below ?? Infinity) > value);
    case ">":
    case ">=":
      // Both need every value from here up: a band open above that starts at or before the value.
      return reach(highest, (highest?.rule.from ?? -Infinity) <= value);
  }
}

function matchesCode(concept: Concept, matches: readonly CodingMatch[]): boolean {
  return concept.codings.some((coding) =>
    matches.some((match) => coding.system === match.system && coding.code === match.code),
  );
}

function bandReading(reading: ObservationReading, series: ResolvedSeries | undefined): ReadingBand {
  const none = (reason: UnbandedReason): ReadingBand => ({ kind: "none", reason });
  const placed = (band: Resolved<unknown> | UnbandedReason): ReadingBand =>
    typeof band === "string" ? none(band) : { kind: "level", level: band.level };

  if (!series || (series.bands.length === 0 && series.answers.length === 0))
    return none("no-bands");

  const { value } = reading;
  switch (value.kind) {
    case "absent":
      return none("absent");
    case "text":
    case "boolean":
      return none("not-banded-kind");
    case "concept": {
      const text = value.concept.text?.trim();
      const answer = series.answers.find(
        ({ rule }) =>
          matchesCode(value.concept, rule.match ?? []) ||
          (rule.text ?? []).some((option) => option.trim() === text),
      );
      return placed(answer ?? "unknown-answer");
    }
    case "integer":
      // A whole number carries no unit of its own. It is banded only in a series of scores.
      if (series.definition.ucum !== SCORE) return none("unit-mismatch");
      return placed(numericBand(value.value, undefined, series.bands));
    case "quantity": {
      const { quantity } = value;
      if (quantity.ucum === undefined) return none("no-unit");
      if (quantity.ucum !== series.definition.ucum) return none("unit-mismatch");
      return placed(numericBand(quantity.value, quantity.comparator, series.bands));
    }
  }
}

/** The number of decimal places a number was written with. */
function decimals(value: number): number {
  const [, fraction = ""] = String(value).split(".");
  return fraction.length;
}

/** The number and unit of a reading, when it has an exact number to compare. */
function numeric(reading: ObservationReading): { value: number; unit?: string } | undefined {
  const { value } = reading;
  if (value.kind === "integer") return { value: value.value, unit: SCORE };
  if (value.kind === "quantity" && value.quantity.comparator === undefined) {
    return {
      value: value.quantity.value,
      ...(value.quantity.ucum === undefined ? {} : { unit: value.quantity.ucum }),
    };
  }
  return undefined;
}

function changeFrom(
  reading: ObservationReading,
  earlier: readonly ObservationReading[],
): ReadingChange | undefined {
  const current = numeric(reading);
  if (!current) return undefined;
  // The latest numeric reading strictly before this one. Two readings at one moment, such as a
  // monitored and a counted heart rate, are not compared with each other.
  const previous = earlier.findLast(
    (candidate) => candidate.timeMs < reading.timeMs && numeric(candidate) !== undefined,
  );
  if (!previous) return undefined;
  const before = numeric(previous);
  const elapsedMs = reading.timeMs - previous.timeMs;
  if (before?.unit === undefined || before.unit !== current.unit) {
    return { previousId: previous.id, elapsedMs };
  }

  // Subtracting 35.6 from 35 gives -0.6000000000000014. Round to the precision the values had.
  const factor = 10 ** Math.max(decimals(current.value), decimals(before.value));
  const change = Math.round((current.value - before.value) * factor) / factor;
  return { previousId: previous.id, change, elapsedMs };
}

function sourceLabels(
  reading: ObservationReading,
  labels: readonly InterpretationLabel[],
): string[] {
  return reading.source.interpretation.flatMap((concept) => {
    const own = labels.find((label) => matchesCode(concept, [label]))?.label;
    const coding = concept.codings[0];
    const words = own ?? concept.text ?? coding?.display ?? coding?.code;
    return words === undefined ? [] : [words];
  });
}

/**
 * Applies a schema to series of readings. Each reading gains the band the schema places it in,
 * or the reason it has none, the source's interpretation in the schema's words, and how it
 * compares with the reading before it. Nothing the source said is replaced: its interpretation
 * stays beside the schema's band.
 *
 * Throws when the schema cannot be applied, with every problem `checkObservationSchema` finds.
 */
export function applyObservationSchema(
  series: readonly ObservationSeries[],
  schema: ObservationSchema,
): InterpretedSeries[] {
  const { problems, series: resolved } = resolve(schema);
  if (problems.length > 0) {
    throw new Error(`The observation schema cannot be applied:\n- ${problems.join("\n- ")}`);
  }

  return series.map(({ key, readings }) => {
    const found = resolved.get(key);
    return {
      key,
      ...(found === undefined ? {} : { definition: found.definition }),
      readings: readings.map((reading, index): InterpretedReading => {
        const previous = changeFrom(reading, readings.slice(0, index));
        return {
          ...reading,
          band: bandReading(reading, found),
          sourceLabels: sourceLabels(reading, schema.interpretationLabels ?? []),
          ...(previous === undefined ? {} : { previous }),
        };
      }),
    };
  });
}

/** One series' part in a round's total: the reading that scored, and its score. */
export interface TotalPart {
  readonly seriesKey: string;
  readonly readingId: string;
  readonly score: number;
}

/**
 * A round's total score. It is complete only when every series the total requires has a reading
 * in the round that scored, or that is at a level that escalates. An incomplete total gives no number: the sum of what is there would read
 * lower than the round is. Either can carry a level from an escalation.
 */
export type RoundTotal =
  | {
      readonly kind: "complete";
      /** The round's first time, which heads its column. */
      readonly timeMs: number;
      readonly total: number;
      /** The level the total's bands, or an escalation, put it in. */
      readonly level?: ObservationLevel;
      /** True when an escalation, not the sum, set the level. */
      readonly isEscalated: boolean;
      readonly parts: readonly TotalPart[];
    }
  | {
      readonly kind: "incomplete";
      readonly timeMs: number;
      /** The required series with no scored reading in the round. */
      readonly missing: readonly string[];
      /** The level an escalation put the round in, whatever else is missing. */
      readonly level?: ObservationLevel;
      readonly isEscalated: boolean;
      readonly parts: readonly TotalPart[];
    };

/**
 * Adds up each round's scores into the schema's total, such as an early warning score. Each
 * series counts once in a round: when it has two scored readings, such as two heart rates, the
 * higher score counts, so a round is never scored lower than one of its readings.
 *
 * Throws when the schema cannot be applied or has no total.
 */
export function scoreRounds(
  rounds: readonly ObservationRound<InterpretedReading>[],
  schema: ObservationSchema,
): RoundTotal[] {
  const { problems, totalBands } = resolve(schema);
  if (problems.length > 0) {
    throw new Error(`The observation schema cannot be applied:\n- ${problems.join("\n- ")}`);
  }
  const { total } = schema;
  if (!total) throw new Error("scoreRounds: the schema has no total to add up.");

  const rank = new Map(schema.levels.map((level, index) => [level.key, index]));
  const byKey = new Map(schema.levels.map((level) => [level.key, level]));
  const higher = (a: ObservationLevel | undefined, b: ObservationLevel | undefined) =>
    (rank.get(b?.key ?? "") ?? -1) > (rank.get(a?.key ?? "") ?? -1) ? b : a;
  return rounds.map((round) => {
    const parts: TotalPart[] = [];
    // A series is present when a reading scored, or when it is at a level that escalates.
    const present = new Set<string>();
    let escalation: ObservationLevel | undefined;
    for (const [seriesKey, readings] of Object.entries(round.readings)) {
      let best: TotalPart | undefined;
      for (const reading of readings) {
        if (reading.band.kind !== "level") continue;
        const { level } = reading.band;
        for (const rule of total.escalations ?? []) {
          if (rule.fromLevels.includes(level.key)) {
            escalation = higher(escalation, byKey.get(rule.level));
            present.add(seriesKey);
          }
        }
        if (level.score !== undefined && (best === undefined || level.score > best.score)) {
          best = { seriesKey, readingId: reading.id, score: level.score };
        }
      }
      if (best) {
        parts.push(best);
        present.add(seriesKey);
      }
    }

    const missing = total.requires.filter((key) => !present.has(key));
    if (missing.length > 0) {
      return {
        kind: "incomplete",
        timeMs: round.timeMs,
        missing,
        ...(escalation === undefined ? {} : { level: escalation }),
        isEscalated: escalation !== undefined,
        parts,
      };
    }

    const sum = parts.reduce((all, { score }) => all + score, 0);
    const band = numericBand(sum, undefined, totalBands);
    const summed = typeof band === "string" ? undefined : band.level;
    const level = higher(summed, escalation);
    return {
      kind: "complete",
      timeMs: round.timeMs,
      total: sum,
      ...(level === undefined ? {} : { level }),
      isEscalated: level !== undefined && level !== summed,
      parts,
    };
  });
}
