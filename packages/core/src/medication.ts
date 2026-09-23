/**
 * The medication view model: what a medication card is given to show an order or a medication
 * list entry, and its doses. It is framework-free and says nothing about FHIR. The fhir package
 * builds it from FHIR resources, and the words are written by `describeDosage`.
 *
 * Every field is as the source gave it. Nothing is converted, rounded or worked out here.
 */

import type { Concept, Quantity } from "./observation";

/** The statuses of a medication order, in FHIR's words. */
export const MEDICATION_ORDER_STATUSES = [
  "active",
  "on-hold",
  "cancelled",
  "completed",
  "entered-in-error",
  "stopped",
  "draft",
  "unknown",
] as const;

/** A medication order's status. */
export type MedicationOrderStatus = (typeof MEDICATION_ORDER_STATUSES)[number];

/** The statuses of a medication list entry, in FHIR's words. */
export const MEDICATION_STATEMENT_STATUSES = [
  "active",
  "completed",
  "entered-in-error",
  "intended",
  "stopped",
  "on-hold",
  "unknown",
  "not-taken",
] as const;

/** A medication list entry's status. */
export type MedicationStatementStatus = (typeof MEDICATION_STATEMENT_STATUSES)[number];

/** The statuses of a dose given, or not given, in FHIR's words. */
export const ADMINISTRATION_STATUSES = [
  "in-progress",
  "not-done",
  "on-hold",
  "completed",
  "entered-in-error",
  "stopped",
  "unknown",
] as const;

/** A dose's status. `not-done` is a dose that was not given, such as one withheld or refused. */
export type AdministrationStatus = (typeof ADMINISTRATION_STATUSES)[number];

/** How much of an ingredient is in an amount of the medicine, such as 120 mg in 5 mL. */
export interface Strength {
  readonly amount: Quantity;
  /** Per this much of the medicine. Undefined for a strength per unit, such as per tablet. */
  readonly per?: Quantity;
}

/** One active ingredient and its strength. */
export interface Ingredient {
  readonly name: string;
  readonly strength?: Strength;
}

/** A medicine: its name as the source gave it, and, where known, its parts. */
export interface MedicationName {
  /** The medicine's name as the source gave it. Always shown, never shortened. */
  readonly text: string;
  readonly ingredients: readonly Ingredient[];
  /** The dose form, such as tablet or eye drops. */
  readonly form?: Concept;
}

/** The FHIR units of time a dose's timing is given in. */
export const TIME_UNITS = ["s", "min", "h", "d", "wk", "mo", "a"] as const;

/** A unit of time. */
export type TimeUnit = (typeof TIME_UNITS)[number];

/** When a dose is taken, as FHIR's Timing gives it. */
export interface DoseTiming {
  /** How many times in each period, such as 2 for twice a day. */
  readonly frequency?: number;
  /** The most times in each period, for "2 to 3 times a day". */
  readonly frequencyMax?: number;
  readonly period?: number;
  /** The longest period, for "every 6 to 8 hours". */
  readonly periodMax?: number;
  readonly periodUnit?: TimeUnit;
  /** Days of the week, as FHIR's codes: mon, tue and so on. */
  readonly dayOfWeek: readonly string[];
  /** Times of day, as the source gave them, such as 08:00:00. */
  readonly timeOfDay: readonly string[];
  /** Events of the day, as FHIR's codes: MORN, NIGHT, AC, PC and so on. */
  readonly when: readonly string[];
  /** A named timing, such as the source's own code for twice a day. */
  readonly code?: Concept;
}

/** Whether a dose is given only when needed, and for what. */
export type AsNeeded =
  { readonly kind: "no" } | { readonly kind: "yes"; readonly reason?: Concept };

/** How a medicine is taken, as one of an order's or a list entry's dosage instructions. */
export interface Dosage {
  /** The prescriber's own words, shown only when the rest cannot be written out. */
  readonly text?: string;
  readonly dose?: Quantity;
  /** A dose between two amounts, such as 1 to 2 tablets. */
  readonly doseRange?: { readonly low: Quantity; readonly high: Quantity };
  readonly route?: Concept;
  readonly site?: Concept;
  readonly timing?: DoseTiming;
  readonly asNeeded: AsNeeded;
  /** The most that may be given in 24 hours, as the source gave it. */
  readonly maxPer24Hours?: Quantity;
  readonly additionalInstructions: readonly Concept[];
  /** Instructions written for the patient. */
  readonly patientInstruction?: string;
}

/** One dose given, or not given. */
export interface Administration {
  /** The resource's type and id, such as `MedicationAdministration/a1`. */
  readonly id: string;
  readonly status: AdministrationStatus;
  /** When it was given, or due and not given: ISO 8601 with a time and an offset. */
  readonly time: string;
  readonly timeMs: number;
  readonly dose?: Quantity;
  readonly route?: Concept;
  /** Why it was not given, such as refused or withheld. */
  readonly reasons: readonly Concept[];
}

/** A medication order and the doses given against it, newest last. */
export interface MedicationOrder {
  readonly kind: "order";
  /** The resource's type and id, such as `MedicationRequest/r1`. */
  readonly id: string;
  readonly status: MedicationOrderStatus;
  readonly medication: MedicationName;
  readonly dosages: readonly Dosage[];
  /** When it was ordered: ISO 8601, as the source gave it. */
  readonly authoredOn?: string;
  readonly administrations: readonly Administration[];
}

/** An entry in a medication list: a medicine the patient takes, or has taken. */
export interface MedicationStatement {
  readonly kind: "statement";
  /** The resource's type and id, such as `MedicationStatement/s1`. */
  readonly id: string;
  readonly status: MedicationStatementStatus;
  readonly medication: MedicationName;
  readonly dosages: readonly Dosage[];
  /** When it was recorded: ISO 8601, as the source gave it. */
  readonly dateAsserted?: string;
}

/** What a medication card shows: an order with its doses, or a medication list entry. */
export type MedicationRecord = MedicationOrder | MedicationStatement;
