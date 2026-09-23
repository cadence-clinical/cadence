/**
 * What a transform reports about input it could not use as it was. Nothing is left out of a
 * result without an issue saying so (docs/decisions/0016-fhir-transforms.md).
 */

/**
 * How much of the input an issue cost. `error`: a resource, or one of its values, was left out.
 * `warning`: it was kept, and an optional part of it was left out or is incomplete.
 */
export type IssueSeverity = "error" | "warning";

/** What went wrong, as a stable code a consumer can count or filter on. */
export type IssueCode =
  /** An item in the input that is not a FHIR resource. */
  | "not-a-resource"
  /** A resource of a type the transform does not read, such as an OperationOutcome. */
  | "unexpected-resource"
  /** A Bundle entry with no resource. */
  | "missing-resource"
  /** A resource with no id, which the result has no way to name. */
  | "missing-id"
  /** A second copy of a resource already read, such as from an overlapping page. */
  | "duplicate-id"
  | "invalid-status"
  /** A code that is missing or has neither a coding nor text. */
  | "invalid-code"
  | "missing-time"
  /** A time with no time of day, such as a date alone. It cannot be placed on a timeline. */
  | "imprecise-time"
  | "invalid-time"
  /** A kind of time the transform does not read, such as a schedule. */
  | "unsupported-time"
  /** No value, no reason for its absence, and no components. */
  | "missing-value"
  | "multiple-values"
  | "invalid-value"
  /** A kind of value the transform does not read yet, such as a range or a ratio. */
  | "unsupported-value"
  /** A quantity kept without a UCUM unit. It is shown with the unit the source wrote. */
  | "no-ucum-unit"
  /** An optional element that could not be read, and was left out. */
  | "invalid-element"
  /** An order or a list entry whose medicine cannot be found, so it cannot be shown. */
  | "unresolved-medication"
  /** A dose that names no order in the input, so it cannot be shown with one. */
  | "unlinked-administration";

/** One problem with the input. */
export interface TransformIssue {
  readonly severity: IssueSeverity;
  readonly code: IssueCode;
  /** The resource, such as `Observation/abc`, when it has a type and an id. */
  readonly resource?: string;
  /**
   * Where the problem is. Inside a resource, a path from its type, such as
   * `Observation.valueQuantity.value`. Otherwise, where the item sits in the input, such as
   * `input[1].entry[3]`.
   */
  readonly path: string;
  /** A sentence saying what was wrong and what happened to it, for a log or a developer. */
  readonly message: string;
}

/** Collects the issues found during one transform. */
export interface IssueLog {
  readonly issues: TransformIssue[];
}

/** Records an issue. */
export function report(log: IssueLog, issue: TransformIssue): void {
  log.issues.push(issue);
}
