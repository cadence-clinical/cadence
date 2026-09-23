/**
 * FHIR R4 medication resources to the medication view model in core: MedicationRequest as an
 * order with the MedicationAdministrations given against it, and MedicationStatement as a
 * medication list entry. Medication resources are read for a medicine's name, form and
 * ingredients. The input is `unknown`: every field is checked before it is used, and anything
 * left out is reported (docs/decisions/0016-fhir-transforms.md).
 */

import {
  ADMINISTRATION_STATUSES,
  MEDICATION_ORDER_STATUSES,
  MEDICATION_STATEMENT_STATUSES,
  TIME_UNITS,
  type Administration,
  type AsNeeded,
  type Concept,
  type Dosage,
  type DoseTiming,
  type Ingredient,
  type MedicationName,
  type MedicationOrder,
  type MedicationRecord,
  type MedicationStatement,
  type Quantity,
  type Strength,
  type TimeUnit,
} from "@cadence-clinical/core";

import { type TransformIssue } from "./issues";
import {
  hasMeaning,
  isRecord,
  readConcept,
  readConcepts,
  readMoment,
  readQuantity,
  reportAt,
  stringField,
  type ReadContext,
  type UnknownRecord,
} from "./read";
import { collectResources, type FoundResource } from "./resources";

/** A resource left out because of its status, which is a choice rather than a problem. */
export interface ExcludedMedicationResource {
  readonly resource: string;
  readonly status: string;
}

/** What `medicationRecords` returns. */
export interface MedicationRecordsResult {
  /** Orders and list entries, in the order they appear in the input. */
  readonly records: readonly MedicationRecord[];
  /** Resources entered in error, which are never shown as data. */
  readonly excluded: readonly ExcludedMedicationResource[];
  readonly issues: readonly TransformIssue[];
}

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return list.some((item) => item === value);
}

/** A number field, or undefined when it is missing or not a finite number. */
function numberField(record: UnknownRecord, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** A list of strings, leaving out, and reporting, anything that is not a string. */
function stringList(context: ReadContext, raw: unknown, path: string): string[] {
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
  return raw.flatMap((item: unknown, index) => {
    if (typeof item === "string") return [item];
    reportAt(
      context,
      "warning",
      "invalid-element",
      `${path}[${index}]`,
      "An entry is not a string, so it was left out.",
    );
    return [];
  });
}

/** A concept with meaning, or undefined, reported when present but empty or unreadable. */
function meaningfulConcept(context: ReadContext, raw: unknown, path: string): Concept | undefined {
  if (raw === undefined) return undefined;
  const concept = readConcept(context, raw, path);
  if (concept && hasMeaning(concept)) return concept;
  reportAt(
    context,
    "warning",
    "invalid-element",
    path,
    "The element has no coding and no text, so it was left out.",
  );
  return undefined;
}

/** A quantity, or undefined, reported when present but unreadable. */
function optionalQuantity(context: ReadContext, raw: unknown, path: string): Quantity | undefined {
  if (raw === undefined) return undefined;
  const quantity = readQuantity(context, raw, path);
  if (!quantity) {
    reportAt(
      context,
      "warning",
      "invalid-element",
      path,
      "The quantity cannot be read, so it was left out.",
    );
  }
  return quantity;
}

/**
 * A concept's words: its text, or its first coding's display or code. Undefined when it has none,
 * because a medicine or an ingredient is never shown with no name.
 */
function wordsOf(concept: Concept): string | undefined {
  const [coding] = concept.codings;
  return concept.text ?? coding?.display ?? coding?.code;
}

function readStrength(context: ReadContext, raw: unknown, path: string): Strength | undefined {
  if (raw === undefined) return undefined;
  if (!isRecord(raw)) {
    reportAt(
      context,
      "warning",
      "invalid-element",
      path,
      "The strength is not a ratio, so it was left out.",
    );
    return undefined;
  }
  const amount = optionalQuantity(context, raw["numerator"], `${path}.numerator`);
  if (!amount) {
    reportAt(
      context,
      "warning",
      "invalid-element",
      path,
      "The strength has no amount, so it was left out.",
    );
    return undefined;
  }
  const per = optionalQuantity(context, raw["denominator"], `${path}.denominator`);
  // A strength "per 1" of something with no unit is per unit, such as per tablet.
  const isPerUnit =
    per !== undefined && per.value === 1 && per.ucum === undefined && per.unitText === undefined;
  return per && !isPerUnit ? { amount, per } : { amount };
}

/** A Medication resource's name, form and ingredients. */
function readMedicationResource(
  context: ReadContext,
  raw: UnknownRecord,
  path: string,
): MedicationName | undefined {
  const code = meaningfulConcept(context, raw["code"], `${path}.code`);
  const text = code === undefined ? undefined : wordsOf(code);
  if (text === undefined) return undefined;
  const form = meaningfulConcept(context, raw["form"], `${path}.form`);
  const ingredients: Ingredient[] = [];
  const rawIngredients = raw["ingredient"];
  if (Array.isArray(rawIngredients)) {
    rawIngredients.forEach((item: unknown, index) => {
      const at = `${path}.ingredient[${index}]`;
      const concept = isRecord(item)
        ? meaningfulConcept(context, item["itemCodeableConcept"], `${at}.itemCodeableConcept`)
        : undefined;
      const name = concept === undefined ? undefined : wordsOf(concept);
      if (!isRecord(item) || name === undefined) {
        reportAt(
          context,
          "warning",
          "invalid-element",
          at,
          "An ingredient has no name, so it was left out.",
        );
        return;
      }
      const strength = readStrength(context, item["strength"], `${at}.strength`);
      ingredients.push({ name, ...(strength ? { strength } : {}) });
    });
  } else if (rawIngredients !== undefined) {
    reportAt(
      context,
      "warning",
      "invalid-element",
      `${path}.ingredient`,
      "The ingredients are not a list, so they were left out.",
    );
  }
  return { text, ingredients, ...(form ? { form } : {}) };
}

/**
 * The medicine an order or a list entry is for: its own code, a Medication it contains, or a
 * Medication elsewhere in the input. Reported as an error when it cannot be found, because an
 * order with no medicine cannot be shown.
 */
function readMedication(
  context: ReadContext,
  raw: UnknownRecord,
  type: string,
  medications: ReadonlyMap<string, UnknownRecord>,
): MedicationName | undefined {
  const unresolved = (path: string, message: string): MedicationName | undefined => {
    reportAt(context, "error", "unresolved-medication", path, message);
    return undefined;
  };
  if (raw["medicationCodeableConcept"] !== undefined) {
    const concept = readConcept(
      context,
      raw["medicationCodeableConcept"],
      `${type}.medicationCodeableConcept`,
    );
    const text = concept === undefined ? undefined : wordsOf(concept);
    return text === undefined
      ? unresolved(
          `${type}.medicationCodeableConcept`,
          "The medicine has no name, so this was left out.",
        )
      : { text, ingredients: [] };
  }
  const reference = isRecord(raw["medicationReference"])
    ? stringField(raw["medicationReference"], "reference")
    : undefined;
  const path = `${type}.medicationReference`;
  if (reference === undefined)
    return unresolved(path, "There is no medicine, so this was left out.");

  let medication: UnknownRecord | undefined;
  if (reference.startsWith("#")) {
    const contained: unknown = raw["contained"];
    medication = (Array.isArray(contained) ? contained : []).find(
      (item: unknown): item is UnknownRecord =>
        isRecord(item) &&
        item["resourceType"] === "Medication" &&
        item["id"] === reference.slice(1),
    );
  } else {
    medication = medications.get(reference);
  }
  if (!medication) {
    return unresolved(
      path,
      `The medicine "${reference}" is not in the input, so this was left out.`,
    );
  }
  return (
    readMedicationResource(
      context,
      medication,
      reference.startsWith("#") ? `${type}.contained` : reference,
    ) ?? unresolved(path, `The medicine "${reference}" has no name, so this was left out.`)
  );
}

function readTiming(context: ReadContext, raw: unknown, path: string): DoseTiming | undefined {
  if (raw === undefined) return undefined;
  if (!isRecord(raw)) {
    reportAt(
      context,
      "warning",
      "invalid-element",
      path,
      "The timing is not an object, so it was left out.",
    );
    return undefined;
  }
  const code = meaningfulConcept(context, raw["code"], `${path}.code`);
  const repeat = raw["repeat"];
  const base: DoseTiming = { dayOfWeek: [], timeOfDay: [], when: [], ...(code ? { code } : {}) };
  if (repeat === undefined) return base;
  if (!isRecord(repeat)) {
    reportAt(
      context,
      "warning",
      "invalid-element",
      `${path}.repeat`,
      "The repeat is not an object, so it was left out.",
    );
    return base;
  }
  const periodUnit = repeat["periodUnit"];
  if (periodUnit !== undefined && !isOneOf(TIME_UNITS, periodUnit)) {
    reportAt(
      context,
      "warning",
      "invalid-element",
      `${path}.repeat.periodUnit`,
      "The unit of time is not one FHIR defines, so the timing was left out.",
    );
    return base;
  }
  const numbers: Partial<Record<"frequency" | "frequencyMax" | "period" | "periodMax", number>> =
    {};
  for (const key of ["frequency", "frequencyMax", "period", "periodMax"] as const) {
    if (repeat[key] === undefined) continue;
    const value = numberField(repeat, key);
    if (value === undefined) {
      reportAt(
        context,
        "warning",
        "invalid-element",
        `${path}.repeat.${key}`,
        "The number cannot be read, so the timing was left out.",
      );
      return base;
    }
    numbers[key] = value;
  }
  const unit: { periodUnit?: TimeUnit } = periodUnit === undefined ? {} : { periodUnit };
  return {
    ...base,
    ...numbers,
    ...unit,
    dayOfWeek: stringList(context, repeat["dayOfWeek"], `${path}.repeat.dayOfWeek`),
    timeOfDay: stringList(context, repeat["timeOfDay"], `${path}.repeat.timeOfDay`),
    when: stringList(context, repeat["when"], `${path}.repeat.when`),
  };
}

/** The most per 24 hours, when the source gives it per 24 hours or per day. */
function readMaxPer24Hours(context: ReadContext, raw: unknown, path: string): Quantity | undefined {
  if (raw === undefined) return undefined;
  const numerator = isRecord(raw)
    ? optionalQuantity(context, raw["numerator"], `${path}.numerator`)
    : undefined;
  const denominator = isRecord(raw)
    ? readQuantity({ issues: [] }, raw["denominator"], `${path}.denominator`)
    : undefined;
  const isDay =
    denominator !== undefined &&
    ((denominator.value === 24 && denominator.ucum === "h") ||
      (denominator.value === 1 && denominator.ucum === "d"));
  if (numerator && isDay) return numerator;
  reportAt(
    context,
    "warning",
    "invalid-element",
    path,
    "The maximum dose is not given per 24 hours, so it was left out.",
  );
  return undefined;
}

function readDosage(context: ReadContext, raw: unknown, path: string): Dosage | undefined {
  if (!isRecord(raw)) {
    reportAt(
      context,
      "warning",
      "invalid-element",
      path,
      "A dosage is not an object, so it was left out.",
    );
    return undefined;
  }
  const text = stringField(raw, "text");
  const patientInstruction = stringField(raw, "patientInstruction");
  const route = meaningfulConcept(context, raw["route"], `${path}.route`);
  const site = meaningfulConcept(context, raw["site"], `${path}.site`);
  const timing = readTiming(context, raw["timing"], `${path}.timing`);
  const maxPer24Hours = readMaxPer24Hours(
    context,
    raw["maxDosePerPeriod"],
    `${path}.maxDosePerPeriod`,
  );

  let asNeeded: AsNeeded = { kind: "no" };
  if (raw["asNeededBoolean"] === true) asNeeded = { kind: "yes" };
  else if (raw["asNeededCodeableConcept"] !== undefined) {
    const reason = meaningfulConcept(
      context,
      raw["asNeededCodeableConcept"],
      `${path}.asNeededCodeableConcept`,
    );
    asNeeded = reason ? { kind: "yes", reason } : { kind: "yes" };
  }

  // The first dose and rate is the dose. A second, such as a range for another rate, is reported.
  const doseAndRate = raw["doseAndRate"];
  const doses = Array.isArray(doseAndRate) ? doseAndRate.map((item: unknown) => item) : [];
  const [first, ...rest] = doses;
  if (rest.length > 0) {
    reportAt(
      context,
      "warning",
      "invalid-element",
      `${path}.doseAndRate`,
      "Only the first dose is read. The others were left out.",
    );
  }
  const dose = isRecord(first)
    ? optionalQuantity(context, first["doseQuantity"], `${path}.doseAndRate[0].doseQuantity`)
    : undefined;
  const rawRange = isRecord(first) ? first["doseRange"] : undefined;
  const low = isRecord(rawRange)
    ? optionalQuantity(context, rawRange["low"], `${path}.doseAndRate[0].doseRange.low`)
    : undefined;
  const high = isRecord(rawRange)
    ? optionalQuantity(context, rawRange["high"], `${path}.doseAndRate[0].doseRange.high`)
    : undefined;

  return {
    ...(text === undefined ? {} : { text }),
    ...(dose ? { dose } : {}),
    ...(low && high ? { doseRange: { low, high } } : {}),
    ...(route ? { route } : {}),
    ...(site ? { site } : {}),
    ...(timing ? { timing } : {}),
    asNeeded,
    ...(maxPer24Hours ? { maxPer24Hours } : {}),
    additionalInstructions: readConcepts(
      context,
      raw["additionalInstruction"],
      `${path}.additionalInstruction`,
    ),
    ...(patientInstruction === undefined ? {} : { patientInstruction }),
  };
}

function readDosages(context: ReadContext, raw: unknown, path: string): Dosage[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    reportAt(
      context,
      "warning",
      "invalid-element",
      path,
      "The dosages are not a list, so they were left out.",
    );
    return [];
  }
  return raw.flatMap((item: unknown, index) => {
    const dosage = readDosage(context, item, `${path}[${index}]`);
    return dosage ? [dosage] : [];
  });
}

/** Where the transform is: the log, the Medications to resolve against, and what was left out. */
interface MedicationState extends ReadContext {
  readonly medications: ReadonlyMap<string, UnknownRecord>;
  readonly excluded: ExcludedMedicationResource[];
}

function readOrder(
  state: MedicationState,
  found: FoundResource & { id: string },
): MedicationOrder | undefined {
  const resource = `MedicationRequest/${found.id}`;
  const context: ReadContext = { issues: state.issues, resource };
  const status = found.raw["status"];
  if (!isOneOf(MEDICATION_ORDER_STATUSES, status)) {
    reportAt(
      context,
      "error",
      "invalid-status",
      "MedicationRequest.status",
      "The order's status is missing or is not a FHIR status, so it was left out.",
    );
    return undefined;
  }
  if (status === "entered-in-error") {
    state.excluded.push({ resource, status });
    return undefined;
  }
  const medication = readMedication(context, found.raw, "MedicationRequest", state.medications);
  if (!medication) return undefined;
  const authoredOn = stringField(found.raw, "authoredOn");
  return {
    kind: "order",
    id: resource,
    status,
    medication,
    dosages: readDosages(
      context,
      found.raw["dosageInstruction"],
      "MedicationRequest.dosageInstruction",
    ),
    ...(authoredOn === undefined ? {} : { authoredOn }),
    administrations: [],
  };
}

function readStatement(
  state: MedicationState,
  found: FoundResource & { id: string },
): MedicationStatement | undefined {
  const resource = `MedicationStatement/${found.id}`;
  const context: ReadContext = { issues: state.issues, resource };
  const status = found.raw["status"];
  if (!isOneOf(MEDICATION_STATEMENT_STATUSES, status)) {
    reportAt(
      context,
      "error",
      "invalid-status",
      "MedicationStatement.status",
      "The entry's status is missing or is not a FHIR status, so it was left out.",
    );
    return undefined;
  }
  if (status === "entered-in-error") {
    state.excluded.push({ resource, status });
    return undefined;
  }
  const medication = readMedication(context, found.raw, "MedicationStatement", state.medications);
  if (!medication) return undefined;
  const dateAsserted = stringField(found.raw, "dateAsserted");
  return {
    kind: "statement",
    id: resource,
    status,
    medication,
    dosages: readDosages(context, found.raw["dosage"], "MedicationStatement.dosage"),
    ...(dateAsserted === undefined ? {} : { dateAsserted }),
  };
}

/** A dose given or not, and the order it was given against. */
function readAdministration(
  state: MedicationState,
  found: FoundResource & { id: string },
): { administration: Administration; order: string | undefined } | undefined {
  const resource = `MedicationAdministration/${found.id}`;
  const context: ReadContext = { issues: state.issues, resource };
  const { raw } = found;
  const status = raw["status"];
  if (!isOneOf(ADMINISTRATION_STATUSES, status)) {
    reportAt(
      context,
      "error",
      "invalid-status",
      "MedicationAdministration.status",
      "The dose's status is missing or is not a FHIR status, so it was left out.",
    );
    return undefined;
  }
  if (status === "entered-in-error") {
    state.excluded.push({ resource, status });
    return undefined;
  }
  const period = raw["effectivePeriod"];
  const [time, path] =
    period === undefined
      ? [stringField(raw, "effectiveDateTime"), "MedicationAdministration.effectiveDateTime"]
      : [
          isRecord(period) ? stringField(period, "start") : undefined,
          "MedicationAdministration.effectivePeriod.start",
        ];
  const moment = readMoment(context, time, path, "dose");
  if (!moment) return undefined;

  const dosage = raw["dosage"];
  const dose = isRecord(dosage)
    ? optionalQuantity(context, dosage["dose"], "MedicationAdministration.dosage.dose")
    : undefined;
  const route = isRecord(dosage)
    ? meaningfulConcept(context, dosage["route"], "MedicationAdministration.dosage.route")
    : undefined;
  const request = raw["request"];
  return {
    administration: {
      id: resource,
      status,
      ...moment,
      ...(dose ? { dose } : {}),
      ...(route ? { route } : {}),
      reasons: readConcepts(context, raw["statusReason"], "MedicationAdministration.statusReason"),
    },
    order: isRecord(request) ? stringField(request, "reference") : undefined,
  };
}

/**
 * Reads FHIR R4 medication resources into orders, each with the doses given against it, and
 * medication list entries. The input may be a resource, a Bundle, or a list of either. A
 * Medication referred to by an order or an entry is found in the input or in the resource's
 * contained resources.
 *
 * Nothing is left out silently: a resource entered in error is in `excluded`, and anything that
 * could not be read is in `issues`, including a dose that names no order in the input. It checks
 * the fields it reads. It is not a FHIR validator.
 */
export function medicationRecords(input: unknown): MedicationRecordsResult {
  const log: ReadContext = { issues: [] };
  const found = collectResources(log, input);

  const seen = new Set<string>();
  const unique: (FoundResource & { id: string })[] = [];
  for (const item of found) {
    const { id } = item;
    if (id === undefined || id === "") {
      reportAt(
        log,
        "error",
        "missing-id",
        item.at,
        `A ${item.type} has no id, so it was left out.`,
      );
      continue;
    }
    const resource = `${item.type}/${id}`;
    if (seen.has(resource)) {
      reportAt(
        { issues: log.issues, resource },
        "warning",
        "duplicate-id",
        item.at,
        "This resource was read already, so the second copy was ignored.",
      );
      continue;
    }
    seen.add(resource);
    unique.push({ ...item, id });
  }

  const state: MedicationState = {
    issues: log.issues,
    medications: new Map(
      unique
        .filter(({ type }) => type === "Medication")
        .map((item) => [`Medication/${item.id}`, item.raw]),
    ),
    excluded: [],
  };

  const records: MedicationRecord[] = [];
  const doses: { administration: Administration; order: string | undefined }[] = [];
  for (const item of unique) {
    switch (item.type) {
      case "MedicationRequest": {
        const order = readOrder(state, item);
        if (order) records.push(order);
        break;
      }
      case "MedicationStatement": {
        const statement = readStatement(state, item);
        if (statement) records.push(statement);
        break;
      }
      case "MedicationAdministration": {
        const dose = readAdministration(state, item);
        if (dose) doses.push(dose);
        break;
      }
      case "Medication":
        break;
      default:
        reportAt(
          { issues: state.issues, resource: `${item.type}/${item.id}` },
          "warning",
          "unexpected-resource",
          item.at,
          `This resource is a ${item.type}, which is not read for medicines.`,
        );
    }
  }

  // Each dose joins the order it was given against, oldest first.
  const orders = new Map<string, { record: MedicationOrder; list: Administration[] }>();
  for (const record of records) {
    if (record.kind === "order") orders.set(record.id, { record, list: [] });
  }
  for (const { administration, order } of doses) {
    const target = order === undefined ? undefined : orders.get(order);
    if (target) target.list.push(administration);
    else {
      reportAt(
        { issues: state.issues, resource: administration.id },
        "warning",
        "unlinked-administration",
        "MedicationAdministration.request",
        order === undefined
          ? "The dose names no order, so it was not shown with one."
          : `The dose's order "${order}" is not in the input, so it was not shown with one.`,
      );
    }
  }
  return {
    records: records.map((record) => {
      const target = orders.get(record.id);
      if (record.kind !== "order" || !target) return record;
      return {
        ...record,
        administrations: [...target.list].sort(
          (a, b) => a.timeMs - b.timeMs || (a.id < b.id ? -1 : 1),
        ),
      };
    }),
    excluded: state.excluded,
    issues: state.issues,
  };
}
