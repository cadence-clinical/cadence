/**
 * The Region contract. A region carries every convention that differs between health systems:
 * formats, preferred units, labels and clinical rule sets. Components receive a region at
 * runtime and never import one, which is what keeps regions swappable
 * (docs/decisions/0003-region-contract.md).
 *
 * This is the minimal first cut. Sections are added as the components that need them arrive.
 */

import type { ComponentGrade } from "./grade";

/** Where a rule set's values come from. Every clinical value in a region must be traceable. */
export interface Citation {
  title: string;
  publisher: string;
  url?: string;
  /** Edition or version of the source document. */
  version?: string;
  /** ISO date the source was last checked. */
  retrieved?: string;
  /** Licence the source is published under. Must be confirmed before a rule set is published. */
  licence?: string;
}

/** A cited, graded block of clinical configuration, such as reference intervals or chart bands. */
export interface RuleSet<TData = unknown> {
  id: string;
  title: string;
  citation: Citation;
  grade: ComponentGrade;
  data: TData;
}

export interface Region {
  /** Stable identifier, for example "au" or "au-vic". */
  id: string;
  /** Identifiers of the regions this one was composed from, nearest parent first. */
  lineage: readonly string[];
  /** BCP 47 locale used for Intl formatting, for example "en-AU". */
  locale: string;
  dateTime: {
    hourCycle: "h23" | "h12";
    /** IANA time zone. Undefined means the viewer's zone. */
    timeZone?: string;
  };
  /** Preferred display unit per analyte: LOINC code to UCUM unit. */
  preferredUnits: Readonly<Record<string, string>>;
  /** Static interface strings, keyed by message id. */
  labels: Readonly<Record<string, string>>;
  ruleSets: Readonly<Record<string, RuleSet>>;
}

export type RegionDefinition = {
  id: string;
  extends?: Region;
} & Partial<Omit<Region, "id" | "lineage">>;

/**
 * Defines a region, optionally layered over a parent. Scalar settings override the parent;
 * keyed maps (units, labels, rule sets) merge by key so a state variant states only what differs.
 */
export function defineRegion(definition: RegionDefinition): Region {
  const { extends: parent, id, ...own } = definition;

  const locale = own.locale ?? parent?.locale;
  if (!locale) {
    throw new Error(`Region "${id}" needs a locale, either its own or from the region it extends.`);
  }

  return Object.freeze({
    id,
    lineage: parent ? [parent.id, ...parent.lineage] : [],
    locale,
    dateTime: { hourCycle: "h23" as const, ...parent?.dateTime, ...own.dateTime },
    preferredUnits: { ...parent?.preferredUnits, ...own.preferredUnits },
    labels: { ...parent?.labels, ...own.labels },
    ruleSets: { ...parent?.ruleSets, ...own.ruleSets },
  });
}
