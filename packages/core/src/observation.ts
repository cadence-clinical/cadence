/**
 * The observation view model: what a clinical component is given to show an observation. It is
 * framework-free and says nothing about FHIR, so data from any source can be shaped into it. The
 * fhir package builds it from FHIR resources (docs/decisions/0016-fhir-transforms.md).
 *
 * Every field here is as the source gave it. Nothing in it is an interpretation Cadence made.
 */

/** A code from a code system, as the source gave it. */
export interface Coding {
  /** The code system's URI, for example `http://loinc.org`. */
  readonly system?: string;
  readonly code?: string;
  readonly display?: string;
}

/** One idea, as codes from one or more systems and the words the source used for it. */
export interface Concept {
  readonly codings: readonly Coding[];
  readonly text?: string;
}

/** The comparators a quantity can carry, such as a result reported as less than 0.5. */
export const COMPARATORS = ["<", "<=", ">=", ">"] as const;

/** A comparator on a quantity. */
export type Comparator = (typeof COMPARATORS)[number];

/** A measured amount: a value and its unit, which are never separated. */
export interface Quantity {
  readonly value: number;
  /** The unit as a UCUM code. Undefined when the source gave no UCUM code. */
  readonly ucum?: string;
  /** The unit as the source wrote it for people to read, such as `bpm` for `/min`. */
  readonly unitText?: string;
  readonly comparator?: Comparator;
}

/**
 * An observation's value. A value that was not recorded is `absent`, with the source's reason
 * when it gave one. It is never zero or an empty string.
 */
export type ObservationValue =
  | { readonly kind: "quantity"; readonly quantity: Quantity }
  | { readonly kind: "concept"; readonly concept: Concept }
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "integer"; readonly value: number }
  | { readonly kind: "boolean"; readonly value: boolean }
  | { readonly kind: "absent"; readonly reason?: Concept };

/** A reference range the source gave with a value. */
export interface ReferenceRange {
  readonly low?: Quantity;
  readonly high?: Quantity;
  /** What kind of range it is, such as normal or therapeutic. */
  readonly type?: Concept;
  readonly text?: string;
}

/** The statuses an observation can have, in FHIR's words. */
export const OBSERVATION_STATUSES = [
  "registered",
  "preliminary",
  "final",
  "amended",
  "corrected",
  "cancelled",
  "entered-in-error",
  "unknown",
] as const;

/** An observation's status. */
export type ObservationStatus = (typeof OBSERVATION_STATUSES)[number];

/** What the source said about a value. Cadence did not work any of it out. */
export interface SourceInterpretation {
  /** The source's interpretation codes, such as `N` or `H`. Empty when it gave none. */
  readonly interpretation: readonly Concept[];
  readonly referenceRanges: readonly ReferenceRange[];
}

/** One value observed at one time. */
export interface ObservationReading {
  /**
   * Unique within one transform's result: the resource's type and id, with the component's
   * index when the value came from a component, such as `Observation/bp1#component[0]`.
   */
  readonly id: string;
  /** The resource the value came from, such as `Observation/bp1`. */
  readonly resource: string;
  /** What was observed. For a value from a component, the component's code. */
  readonly code: Concept;
  /** For a value from a component, the code of the observation that holds it. */
  readonly panel?: Concept;
  readonly status: ObservationStatus;
  /** When it was observed: ISO 8601 with a time and an offset, as the source gave it. */
  readonly time: string;
  /** The same moment in milliseconds since the Unix epoch, for ordering and plotting. */
  readonly timeMs: number;
  readonly value: ObservationValue;
  readonly source: SourceInterpretation;
}

/** A code to match, by its system and code. */
export interface CodingMatch {
  readonly system: string;
  readonly code: string;
}

/**
 * Which readings make up a series. A reading belongs to the series when any of its codes matches
 * any entry in `match`. A consumer's own code systems are matched the same way as LOINC.
 */
export interface ObservationSeriesSelection {
  /** The series' key, such as `heart-rate`. Unique within one selection. */
  readonly key: string;
  readonly match: readonly CodingMatch[];
}

/** The readings of one series, oldest first. */
export interface ObservationSeries {
  readonly key: string;
  readonly readings: readonly ObservationReading[];
}
