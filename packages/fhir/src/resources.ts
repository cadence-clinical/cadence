/**
 * Collects the resources in an input: a resource, a Bundle, or a list of either, such as the
 * pages of a search. What is not a resource is reported, never dropped silently.
 */

import { reportAt, isRecord, stringField, type ReadContext, type UnknownRecord } from "./read";

/** A resource found in the input, with where it was. */
export interface FoundResource {
  readonly type: string;
  readonly id: string | undefined;
  readonly raw: UnknownRecord;
  /** Where it sits in the input, such as `input[1].entry[3].resource`. */
  readonly at: string;
}

/** Every resource in the input, in the order they appear. */
export function collectResources(log: ReadContext, input: unknown, at = "input"): FoundResource[] {
  if (Array.isArray(input)) {
    return input.flatMap((item: unknown, index) => collectResources(log, item, `${at}[${index}]`));
  }

  const type = isRecord(input) ? input["resourceType"] : undefined;
  if (!isRecord(input) || typeof type !== "string") {
    reportAt(
      log,
      "error",
      "not-a-resource",
      at,
      "This item is not a FHIR resource, so it was left out.",
    );
    return [];
  }

  if (type !== "Bundle") return [{ type, id: stringField(input, "id"), raw: input, at }];

  const entries = input["entry"];
  if (entries === undefined) return [];
  if (!Array.isArray(entries)) {
    reportAt(
      log,
      "warning",
      "invalid-element",
      `${at}.entry`,
      "The Bundle's entries are not a list, so none were read.",
    );
    return [];
  }
  return entries.flatMap((entry: unknown, index) => {
    const entryAt = `${at}.entry[${index}]`;
    if (!isRecord(entry) || entry["resource"] === undefined) {
      reportAt(log, "warning", "missing-resource", entryAt, "A Bundle entry has no resource.");
      return [];
    }
    return collectResources(log, entry["resource"], `${entryAt}.resource`);
  });
}
