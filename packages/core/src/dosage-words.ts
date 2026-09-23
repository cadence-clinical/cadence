/**
 * A dosage in words, as the National Guidelines for On-Screen Display of Medicines Information
 * (Australian Commission on Safety and Quality in Health Care, December 2017) set out:
 *
 * - the order of a prescription's elements, and a DOSE label (section 6.3.1);
 * - no trailing zeros, a leading zero below one, and a thousands separator (6.3.5 to 6.3.7);
 * - a non-breaking space between a number and its unit (6.3.3, 6.3.4);
 * - the on-screen units of measure (appendix 9.1) and terms for frequency (appendix 9.2);
 * - for consumers, a verb, the route within the instruction, and "do not take more than"
 *   (section 7.3.3).
 *
 * Words are written only from structured fields. Where they cannot be, the prescriber's own text
 * is used as written, and never reworded.
 */

import type { Concept, Quantity } from "./observation";
import type { Dosage, DoseTiming } from "./medication";

/** Who reads the words: a clinician, or the patient. */
export type DosageAudience = "clinician" | "patient";

/** Something a "when required" order is missing that the guidelines require. */
export type DosageGap =
  /** The reason it is taken, which the guidelines make mandatory (section 6.3.1). */
  | "indication"
  /** The most in 24 hours, which must accompany it (appendix 9.2). */
  | "maximum";

/** A dosage in words, in parts and as one line. */
export interface DosageWords {
  /** True when written from the structured fields, false when the prescriber's text is used. */
  readonly composed: boolean;
  readonly route?: string;
  readonly site?: string;
  /** The dose, such as "1 to 2 tablets". */
  readonly dose?: string;
  /** How often, such as "every 6 hours". */
  readonly frequency?: string;
  /** "when required", and what for. */
  readonly whenRequired?: string;
  /** The most in 24 hours, such as "do not exceed 8 tablets in 24 hours". */
  readonly maximum?: string;
  readonly instructions: readonly string[];
  /** Everything, in order, separated by en dashes. */
  readonly line: string;
  readonly gaps: readonly DosageGap[];
}

// A non-breaking space keeps a number with its unit (sections 6.3.3 and 6.3.4).
const NBSP = "\u00a0";
const DASH = " – ";

/** On-screen units of measure, from UCUM codes: appendix 9.1. */
const UNITS: Readonly<Record<string, { one: string; many: string }>> = {
  mg: { one: "mg", many: "mg" },
  g: { one: "g", many: "g" },
  kg: { one: "kg", many: "kg" },
  ug: { one: "microgram", many: "microgram" },
  ng: { one: "nanogram", many: "nanogram" },
  mL: { one: "mL", many: "mL" },
  // "Do not abbreviate 'litre' when used in isolation."
  L: { one: "Litre", many: "Litre" },
  uL: { one: "microlitre", many: "microlitre" },
  mmol: { one: "mmol", many: "mmol" },
  umol: { one: "micromol", many: "micromol" },
  "mmol/L": { one: "mmol/L", many: "mmol/L" },
  "mg/L": { one: "mg/L", many: "mg/L" },
  mm: { one: "mm", many: "mm" },
  cm: { one: "cm", many: "cm" },
  "%": { one: "%", many: "%" },
  // "Do not abbreviate. Use plural form where appropriate."
  U: { one: "unit", many: "units" },
  "[iU]": { one: "unit", many: "units" },
  "[IU]": { one: "unit", many: "units" },
  h: { one: "hour", many: "hours" },
  min: { one: "minute", many: "minutes" },
};

/**
 * Units of use written as words, and their plurals, such as "2 tablets". A unit not listed here
 * is written as the source gave it.
 */
const COUNT_NOUNS: Readonly<Record<string, string>> = {
  tablet: "tablets",
  capsule: "capsules",
  drop: "drops",
  puff: "puffs",
  patch: "patches",
  sachet: "sachets",
  suppository: "suppositories",
  pessary: "pessaries",
  lozenge: "lozenges",
  spray: "sprays",
  ampoule: "ampoules",
  vial: "vials",
  application: "applications",
  dose: "doses",
};

/** Numbers as the guidelines write them: no trailing zeros, a leading zero, 1,000. */
const NUMBER = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 20, useGrouping: true });

/** A quantity in words: "500 mg", "2 tablets", "10 units". */
export function quantityWords(quantity: Quantity): string {
  const number = NUMBER.format(quantity.value);
  const isOne = quantity.value === 1;
  const ucum = quantity.ucum === undefined ? undefined : UNITS[quantity.ucum];
  if (ucum) return `${number}${NBSP}${isOne ? ucum.one : ucum.many}`;
  const written = quantity.unitText ?? quantity.ucum;
  if (written === undefined) return number;
  const plural = COUNT_NOUNS[written];
  return `${number}${NBSP}${!isOne && plural !== undefined ? plural : written}`;
}

/** A concept's words: its text, or its first coding's display or code. */
function wordsOf(concept: Concept): string | undefined {
  const [coding] = concept.codings;
  return concept.text ?? coding?.display ?? coding?.code;
}

const TIMES_A_DAY: Readonly<Record<number, string>> = {
  1: "once a day",
  2: "twice a day",
  3: "three times a day",
  4: "four times a day",
};

/** Events of the day: FHIR's EventTiming and v3 TimingEvent codes, in appendix 9.2's words. */
const WHEN_ONCE: Readonly<Record<string, string>> = {
  MORN: "once a day in the morning",
  NOON: "once a day at midday",
  EVE: "once a day in the evening",
  NIGHT: "once a day at night",
};
const MEALS: Readonly<Record<string, string>> = {
  AC: "before food",
  PC: "after food",
  C: "with food",
};

const DAYS: Readonly<Record<string, { short: string; full: string }>> = {
  mon: { short: "Mon", full: "Monday" },
  tue: { short: "Tue", full: "Tuesday" },
  wed: { short: "Wed", full: "Wednesday" },
  thu: { short: "Thu", full: "Thursday" },
  fri: { short: "Fri", full: "Friday" },
  sat: { short: "Sat", full: "Saturday" },
  sun: { short: "Sun", full: "Sunday" },
};

/** "a, b and c", with no comma before "and", as the guidelines' examples write a list. */
const LIST = new Intl.ListFormat("en-AU", { style: "long", type: "conjunction" });

/**
 * A time of day as appendix 9.2 writes it: the 24 hour clock, with "am" after a time before
 * midday, midnight as 24:00 and midday as 12:00.
 */
function clockWords(time: string): string | undefined {
  if (!/^\d{2}:\d{2}/.test(time)) return undefined;
  const hour = Number(time.slice(0, 2));
  const minute = time.slice(3, 5);
  if (hour === 0 && minute === "00") return "24:00";
  return hour < 12 ? `${hour}:${minute} am` : `${String(hour).padStart(2, "0")}:${minute}`;
}

/** How often, in appendix 9.2's terms, or undefined when the timing cannot be put in them. */
function frequencyWords(timing: DoseTiming): string | undefined {
  const {
    frequency = 1,
    frequencyMax,
    period,
    periodMax,
    periodUnit,
    when,
    dayOfWeek,
    timeOfDay,
  } = timing;
  const meals = when.flatMap((code) => (MEALS[code] === undefined ? [] : [MEALS[code]]));
  const events = when.filter((code) => MEALS[code] === undefined);
  const withMeals = (words: string | undefined) =>
    words === undefined ? undefined : [words, ...meals].join(" ");

  if (period === undefined || periodUnit === undefined) {
    // A time of day or an event alone, such as "at night".
    if (events.length === 1 && timeOfDay.length === 0) return withMeals(WHEN_ONCE[events.join("")]);
    return undefined;
  }
  if (frequencyMax !== undefined && periodMax !== undefined) return undefined;

  // Days of the week name when: "once a week on Tuesday", "three times a week on Mon, Wed and Sat".
  const days = dayOfWeek.flatMap((code) => {
    const day = DAYS[code];
    return day === undefined ? [] : [day];
  });
  if (days.length !== dayOfWeek.length) return undefined;
  const on = (full: boolean) =>
    days.length === 0 ? "" : ` on ${LIST.format(days.map((day) => (full ? day.full : day.short)))}`;

  const range = (low: number, high: number | undefined) =>
    high === undefined ? `${low}` : `${low} to ${high}`;
  let words: string | undefined;
  switch (periodUnit) {
    case "h":
    case "min": {
      if (frequency !== 1 || frequencyMax !== undefined) return undefined;
      const unit = periodUnit === "h" ? "hour" : "minute";
      words =
        period === 1 && periodMax === undefined
          ? `every ${unit}`
          : `every ${range(period, periodMax)} ${unit}s`;
      break;
    }
    case "d":
      if (period === 1 && periodMax === undefined) {
        if (frequencyMax !== undefined) words = `${frequency} to ${frequencyMax} times a day`;
        else if (frequency === 1 && events.length === 1) words = WHEN_ONCE[events.join("")];
        else if (events.length === 0) words = TIMES_A_DAY[frequency] ?? `${frequency} times a day`;
      } else if (frequency === 1 && frequencyMax === undefined) {
        words = `every ${range(period, periodMax)} days`;
      }
      break;
    case "wk":
      if (frequencyMax !== undefined || periodMax !== undefined) return undefined;
      if (period === 1)
        words = `${frequency === 1 ? "once" : frequency === 2 ? "twice" : `${frequency} times`} a week${on(frequency === 1)}`;
      else if (frequency === 1) words = `every ${period} weeks${on(true)}`;
      break;
    case "mo":
      if (frequency === 1 && frequencyMax === undefined && periodMax === undefined) {
        words = period === 1 ? "once a month" : `every ${period} months`;
      }
      break;
    case "s":
    case "a":
      return undefined;
  }
  if (words === undefined) return undefined;
  const clock = timeOfDay.flatMap((time) => {
    const words = clockWords(time);
    return words === undefined ? [] : [words];
  });
  if (clock.length !== timeOfDay.length) return undefined;
  const at = clock.length === 0 ? "" : ` at ${LIST.format(clock)}`;
  return withMeals(`${words}${at}`);
}

/**
 * How a patient takes a medicine by a route, as section 7.3.2 and 7.3.3 write it: a verb, and the
 * route in plain words. Matched on the route's words, as appendix 9.2 writes them.
 */
const PATIENT_ROUTES: Readonly<Record<string, { verb: string; route: string }>> = {
  oral: { verb: "Take", route: "by mouth" },
  sublingual: { verb: "Dissolve", route: "under the tongue" },
  buccal: { verb: "Dissolve", route: "inside the cheek" },
  topical: { verb: "Apply", route: "to the affected area" },
};

/** A route's words, lower case, without a trailing "route", such as "oral" for "Oral route". */
function routeKey(route: string): string {
  return route
    .trim()
    .toLowerCase()
    .replace(/ route$/, "");
}

/**
 * A dosage in words for a clinician or a patient. Written from the structured fields when there
 * is a dose and either how often or "when required"; otherwise the prescriber's text, as written.
 * A "when required" dosage with no reason, or no maximum in 24 hours, reports the gap.
 */
export function describeDosage(
  dosage: Dosage,
  audience: DosageAudience = "clinician",
): DosageWords {
  const route = dosage.route === undefined ? undefined : wordsOf(dosage.route);
  const site = dosage.site === undefined ? undefined : wordsOf(dosage.site);
  const dose = dosage.doseRange
    ? `${NUMBER.format(dosage.doseRange.low.value)} to ${quantityWords(dosage.doseRange.high)}`
    : dosage.dose === undefined
      ? undefined
      : quantityWords(dosage.dose);
  const frequency = dosage.timing === undefined ? undefined : frequencyWords(dosage.timing);
  const isWhenRequired = dosage.asNeeded.kind === "yes";
  const reason =
    dosage.asNeeded.kind === "yes" && dosage.asNeeded.reason !== undefined
      ? wordsOf(dosage.asNeeded.reason)
      : undefined;
  const whenRequired = isWhenRequired
    ? `when required${reason === undefined ? "" : ` for ${reason}`}`
    : undefined;
  const maximumAmount =
    dosage.maxPer24Hours === undefined ? undefined : quantityWords(dosage.maxPer24Hours);
  const maximum =
    maximumAmount === undefined
      ? undefined
      : audience === "patient"
        ? `do not take more than ${maximumAmount} in 24 hours`
        : `do not exceed ${maximumAmount} in 24 hours`;
  const instructions = [
    ...dosage.additionalInstructions.flatMap((concept) => {
      const words = wordsOf(concept);
      return words === undefined ? [] : [words];
    }),
    ...(audience === "patient" && dosage.patientInstruction !== undefined
      ? [dosage.patientInstruction]
      : []),
  ];
  const gaps: DosageGap[] = isWhenRequired
    ? [
        ...(reason === undefined ? (["indication"] as const) : []),
        ...(maximum === undefined ? (["maximum"] as const) : []),
      ]
    : [];

  const composed = dose !== undefined && (frequency !== undefined || isWhenRequired);
  const parts = {
    ...(route === undefined ? {} : { route }),
    ...(site === undefined ? {} : { site }),
    ...(dose === undefined ? {} : { dose }),
    ...(frequency === undefined ? {} : { frequency }),
    ...(whenRequired === undefined ? {} : { whenRequired }),
    ...(maximum === undefined ? {} : { maximum }),
    instructions,
    gaps,
  };

  if (!composed && dosage.text !== undefined) {
    return { composed: false, ...parts, line: dosage.text };
  }

  if (audience === "patient") {
    const way = route === undefined ? undefined : PATIENT_ROUTES[routeKey(route)];
    const how = [
      way?.verb ?? "",
      dose ?? "",
      way?.route ?? (route === undefined ? "" : `(${route})`),
      site ?? "",
      frequency ?? "",
      whenRequired ?? "",
    ]
      .filter((part) => part !== "")
      .join(" ");
    return {
      composed,
      ...parts,
      line: [how, maximum, ...instructions]
        .filter((part) => part !== undefined && part !== "")
        .join(DASH),
    };
  }

  const line = [
    route,
    site,
    dose === undefined ? undefined : `DOSE ${dose}`,
    frequency,
    whenRequired,
    maximum,
    ...instructions,
  ]
    .filter((part) => part !== undefined)
    .join(DASH);
  return { composed, ...parts, line };
}
