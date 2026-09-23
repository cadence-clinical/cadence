import { describe, expect, it } from "vitest";

import { medicationRecords } from "./medications";

// All content is synthetic: the orders, doses and times are invented, for how the transform reads
// them. None is advice on a dose.
const UCUM = "http://unitsofmeasure.org";
const SCT = "http://snomed.info/sct";
const LOCAL = "https://ehr.example.org/codes/medicine";

const paracetamol = {
  resourceType: "Medication",
  id: "paracetamol-500",
  code: { coding: [{ system: LOCAL, code: "P500" }], text: "paracetamol 500 mg tablet" },
  form: { text: "tablet" },
  ingredient: [
    {
      itemCodeableConcept: { text: "paracetamol" },
      strength: {
        numerator: { value: 500, unit: "mg", system: UCUM, code: "mg" },
        denominator: { value: 1 },
      },
    },
  ],
};

const order = {
  resourceType: "MedicationRequest",
  id: "order-1",
  status: "active",
  intent: "order",
  medicationReference: { reference: "Medication/paracetamol-500" },
  subject: { reference: "Patient/example-1" },
  authoredOn: "2026-09-22T08:00:00+10:00",
  dosageInstruction: [
    {
      text: "1 to 2 tablets every 6 hours when required for pain",
      timing: { repeat: { frequency: 1, period: 6, periodUnit: "h" } },
      asNeededCodeableConcept: { text: "pain" },
      route: { coding: [{ system: SCT, code: "26643006", display: "Oral route" }], text: "oral" },
      doseAndRate: [
        {
          doseRange: {
            low: { value: 1, unit: "tablet" },
            high: { value: 2, unit: "tablet" },
          },
        },
      ],
      maxDosePerPeriod: {
        numerator: { value: 8, unit: "tablet" },
        denominator: { value: 24, unit: "hours", system: UCUM, code: "h" },
      },
    },
  ],
};

const dose = (id: string, fields: Record<string, unknown>) => ({
  resourceType: "MedicationAdministration",
  id,
  status: "completed",
  subject: { reference: "Patient/example-1" },
  request: { reference: "MedicationRequest/order-1" },
  effectiveDateTime: "2026-09-23T08:00:00+10:00",
  dosage: { dose: { value: 2, unit: "tablet" } },
  ...fields,
});

const statement = {
  resourceType: "MedicationStatement",
  id: "list-1",
  status: "active",
  medicationCodeableConcept: { text: "synthetic eye drops" },
  dateAsserted: "2026-09-20T10:00:00+10:00",
  dosage: [
    {
      timing: { repeat: { frequency: 4, period: 1, periodUnit: "d", when: ["MORN"] } },
      asNeededBoolean: false,
      site: { text: "right eye" },
      doseAndRate: [{ doseQuantity: { value: 1, unit: "drop" } }],
    },
  ],
};

const bundle = {
  resourceType: "Bundle",
  type: "searchset",
  entry: [
    { resource: paracetamol },
    { resource: order },
    { resource: dose("given-2", { effectiveDateTime: "2026-09-23T14:00:00+10:00" }) },
    { resource: dose("given-1", {}) },
    {
      resource: dose("withheld", {
        status: "not-done",
        effectiveDateTime: "2026-09-23T20:00:00+10:00",
        statusReason: [{ text: "Patient asleep" }],
      }),
    },
    { resource: dose("wrong", { status: "entered-in-error" }) },
    { resource: dose("elsewhere", { request: { reference: "MedicationRequest/other" } }) },
    { resource: statement },
    { resource: { resourceType: "Patient", id: "example-1" } },
  ],
};

describe("medicationRecords, on a synthetic bundle", () => {
  const { records, excluded, issues } = medicationRecords(bundle);
  const [first, second] = records;

  it("reads an order with its medicine resolved from a Medication in the input", () => {
    expect(first).toMatchObject({
      kind: "order",
      id: "MedicationRequest/order-1",
      status: "active",
      authoredOn: "2026-09-22T08:00:00+10:00",
      medication: {
        text: "paracetamol 500 mg tablet",
        form: { text: "tablet" },
        // A strength per 1 of nothing is per unit, such as per tablet.
        ingredients: [{ name: "paracetamol", strength: { amount: { value: 500, ucum: "mg" } } }],
      },
    });
  });

  it("reads the dosage in its parts", () => {
    expect(first?.dosages[0]).toMatchObject({
      text: "1 to 2 tablets every 6 hours when required for pain",
      doseRange: { low: { value: 1, unitText: "tablet" }, high: { value: 2, unitText: "tablet" } },
      route: { text: "oral" },
      timing: { frequency: 1, period: 6, periodUnit: "h", when: [], dayOfWeek: [], timeOfDay: [] },
      asNeeded: { kind: "yes", reason: { text: "pain" } },
      maxPer24Hours: { value: 8, unitText: "tablet" },
    });
  });

  it("joins the doses to their order, oldest first, including one not given, with its reason", () => {
    expect(
      first?.kind === "order" ? first.administrations.map(({ id, status }) => [id, status]) : [],
    ).toEqual([
      ["MedicationAdministration/given-1", "completed"],
      ["MedicationAdministration/given-2", "completed"],
      ["MedicationAdministration/withheld", "not-done"],
    ]);
    expect(first?.kind === "order" ? first.administrations[2]?.reasons : []).toEqual([
      { codings: [], text: "Patient asleep" },
    ]);
  });

  it("reads a medication list entry", () => {
    expect(second).toMatchObject({
      kind: "statement",
      status: "active",
      medication: { text: "synthetic eye drops", ingredients: [] },
      dateAsserted: "2026-09-20T10:00:00+10:00",
      dosages: [
        {
          dose: { value: 1, unitText: "drop" },
          site: { text: "right eye" },
          asNeeded: { kind: "no" },
          timing: { frequency: 4, period: 1, periodUnit: "d", when: ["MORN"] },
        },
      ],
    });
  });

  it("leaves out a dose entered in error, and lists it", () => {
    expect(excluded).toEqual([
      { resource: "MedicationAdministration/wrong", status: "entered-in-error" },
    ]);
  });

  it("reports a dose whose order is not in the input, and a resource it does not read", () => {
    // A dose in tablets or drops has no UCUM unit, which is reported too, and is kept as written.
    const others = issues.filter(({ code }) => code !== "no-ucum-unit");
    expect(others.map(({ code, resource }) => [code, resource])).toEqual([
      ["unexpected-resource", "Patient/example-1"],
      ["unlinked-administration", "MedicationAdministration/elsewhere"],
    ]);
  });
});

describe("medicationRecords, the medicine", () => {
  it("reads a Medication contained in the order", () => {
    const { records, issues } = medicationRecords({
      ...order,
      medicationReference: { reference: "#med" },
      contained: [{ resourceType: "Medication", id: "med", code: { text: "contained medicine" } }],
    });
    expect(records[0]?.medication.text).toBe("contained medicine");
    expect(issues.filter(({ code }) => code !== "no-ucum-unit")).toEqual([]);
  });

  it("keeps a strength per an amount of the medicine", () => {
    const { records } = medicationRecords([
      {
        ...paracetamol,
        ingredient: [
          {
            itemCodeableConcept: { text: "paracetamol" },
            strength: {
              numerator: { value: 120, system: UCUM, code: "mg" },
              denominator: { value: 5, system: UCUM, code: "mL" },
            },
          },
        ],
      },
      order,
    ]);
    expect(records[0]?.medication.ingredients[0]?.strength).toEqual({
      amount: { value: 120, ucum: "mg" },
      per: { value: 5, ucum: "mL" },
    });
  });
});

describe("medicationRecords, what it leaves out", () => {
  const without = (fields: Record<string, unknown>) => ({ ...order, ...fields });

  it.each([
    ["not a resource", 3, "not-a-resource", "error"],
    [
      "a Bundle whose entries are not a list",
      { resourceType: "Bundle", entry: {} },
      "invalid-element",
      "warning",
    ],
    [
      "a Bundle entry with no resource",
      { resourceType: "Bundle", entry: [{}] },
      "missing-resource",
      "warning",
    ],
    ["an order with no id", without({ id: undefined }), "missing-id", "error"],
    ["an order with an unknown status", without({ status: "paused" }), "invalid-status", "error"],
    [
      "an order with no medicine",
      without({ medicationReference: undefined }),
      "unresolved-medication",
      "error",
    ],
    [
      "an order whose medicine has no words",
      without({ medicationReference: undefined, medicationCodeableConcept: {} }),
      "unresolved-medication",
      "error",
    ],
    [
      "an order whose Medication is not in the input",
      without({ medicationReference: { reference: "Medication/absent" } }),
      "unresolved-medication",
      "error",
    ],
    [
      "an order whose contained Medication is missing",
      without({ medicationReference: { reference: "#absent" } }),
      "unresolved-medication",
      "error",
    ],
    [
      "an order whose Medication has no name",
      without({
        medicationReference: { reference: "#med" },
        contained: [{ resourceType: "Medication", id: "med" }],
      }),
      "unresolved-medication",
      "error",
    ],
    [
      "a list entry with an unknown status",
      { ...statement, status: "maybe" },
      "invalid-status",
      "error",
    ],
    [
      "a list entry with no medicine",
      { ...statement, medicationCodeableConcept: undefined },
      "unresolved-medication",
      "error",
    ],
    ["a dose with an unknown status", dose("d", { status: "given" }), "invalid-status", "error"],
    ["a dose with no time", dose("d", { effectiveDateTime: undefined }), "missing-time", "error"],
    [
      "a dose with a date alone",
      dose("d", { effectiveDateTime: "2026-09-23" }),
      "imprecise-time",
      "error",
    ],
    [
      "a dose with a period with no start",
      dose("d", { effectiveDateTime: undefined, effectivePeriod: {} }),
      "missing-time",
      "error",
    ],
    [
      "a dose with a period that is not an object",
      dose("d", { effectiveDateTime: undefined, effectivePeriod: "now" }),
      "missing-time",
      "error",
    ],
    [
      "a dose with a time that is not valid",
      dose("d", { effectiveDateTime: "2026-13-01T08:00:00Z" }),
      "invalid-time",
      "error",
    ],
    [
      "a dose that names no order",
      dose("d", { request: undefined }),
      "unlinked-administration",
      "warning",
    ],
  ])("reports %s", (_name, input, code, severity) => {
    expect(medicationRecords(input).issues).toContainEqual(
      expect.objectContaining({ code, severity }),
    );
  });

  it("reports a resource read twice, and keeps the first", () => {
    const { records, issues } = medicationRecords([statement, { ...statement, status: "stopped" }]);
    expect(records).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: "duplicate-id",
      resource: "MedicationStatement/list-1",
    });
  });

  it("leaves out an order or a list entry entered in error", () => {
    const { records, excluded } = medicationRecords([
      without({ status: "entered-in-error" }),
      { ...statement, status: "entered-in-error" },
    ]);
    expect(records).toEqual([]);
    expect(excluded.map(({ resource }) => resource)).toEqual([
      "MedicationRequest/order-1",
      "MedicationStatement/list-1",
    ]);
  });

  it("reads a dose given over a period from its start, with its route", () => {
    const { records } = medicationRecords([
      order,
      paracetamol,
      dose("d", {
        effectiveDateTime: undefined,
        effectivePeriod: { start: "2026-09-23T09:00:00+10:00" },
        dosage: { route: { text: "oral" } },
      }),
    ]);
    const [first] = records;
    expect(first?.kind === "order" ? first.administrations[0] : undefined).toMatchObject({
      time: "2026-09-23T09:00:00+10:00",
      route: { text: "oral" },
    });
  });

  it.each([[["b", "a"]], [["a", "b"]]])("orders doses at one moment by id, from %j", (ids) => {
    const { records } = medicationRecords([order, paracetamol, ...ids.map((id) => dose(id, {}))]);
    const [first] = records;
    expect(first?.kind === "order" ? first.administrations.map(({ id }) => id) : []).toEqual([
      "MedicationAdministration/a",
      "MedicationAdministration/b",
    ]);
  });
});

describe("medicationRecords, dosage parts it cannot read", () => {
  const dosed = (dosage: unknown) =>
    medicationRecords([paracetamol, { ...order, dosageInstruction: [dosage] }]);
  const withDosages = (dosageInstruction: unknown) =>
    medicationRecords([paracetamol, { ...order, dosageInstruction }]);

  it.each([
    ["dosages that are not a list", withDosages({}), "MedicationRequest.dosageInstruction"],
    ["a dosage that is not an object", dosed(7), "MedicationRequest.dosageInstruction[0]"],
    [
      "a timing that is not an object",
      dosed({ timing: 1 }),
      "MedicationRequest.dosageInstruction[0].timing",
    ],
    [
      "a repeat that is not an object",
      dosed({ timing: { repeat: 1 } }),
      "MedicationRequest.dosageInstruction[0].timing.repeat",
    ],
    [
      "a unit of time FHIR does not define",
      dosed({ timing: { repeat: { period: 1, periodUnit: "fortnight" } } }),
      "MedicationRequest.dosageInstruction[0].timing.repeat.periodUnit",
    ],
    [
      "a frequency that is not a number",
      dosed({ timing: { repeat: { frequency: "twice" } } }),
      "MedicationRequest.dosageInstruction[0].timing.repeat.frequency",
    ],
    [
      "times of day that are not a list",
      dosed({ timing: { repeat: { timeOfDay: "08:00" } } }),
      "MedicationRequest.dosageInstruction[0].timing.repeat.timeOfDay",
    ],
    [
      "a time of day that is not a string",
      dosed({ timing: { repeat: { timeOfDay: [8] } } }),
      "MedicationRequest.dosageInstruction[0].timing.repeat.timeOfDay[0]",
    ],
    [
      "a timing code with no words",
      dosed({ timing: { code: {} } }),
      "MedicationRequest.dosageInstruction[0].timing.code",
    ],
    ["a route with no words", dosed({ route: {} }), "MedicationRequest.dosageInstruction[0].route"],
    [
      "a dose that cannot be read",
      dosed({ doseAndRate: [{ doseQuantity: { value: "two" } }] }),
      "MedicationRequest.dosageInstruction[0].doseAndRate[0].doseQuantity",
    ],
    [
      "a second dose",
      dosed({ doseAndRate: [{}, {}] }),
      "MedicationRequest.dosageInstruction[0].doseAndRate",
    ],
    [
      "a maximum per week",
      dosed({
        maxDosePerPeriod: {
          numerator: { value: 20 },
          denominator: { value: 1, system: UCUM, code: "wk" },
        },
      }),
      "MedicationRequest.dosageInstruction[0].maxDosePerPeriod",
    ],
    [
      "a maximum that is not a ratio",
      dosed({ maxDosePerPeriod: 8 }),
      "MedicationRequest.dosageInstruction[0].maxDosePerPeriod",
    ],
    [
      "a reason for when required with no words",
      dosed({ asNeededCodeableConcept: {} }),
      "MedicationRequest.dosageInstruction[0].asNeededCodeableConcept",
    ],
  ])("reports %s", (_name, result, path) => {
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "invalid-element", path }),
    );
  });

  it("keeps a dosage when required with no reason, and reads a maximum per day", () => {
    const { records } = dosed({
      asNeededBoolean: true,
      maxDosePerPeriod: {
        numerator: { value: 4000, system: UCUM, code: "mg" },
        denominator: { value: 1, system: UCUM, code: "d" },
      },
      additionalInstruction: [{ text: "with food" }],
      patientInstruction: "Take with food.",
      timing: { repeat: { dayOfWeek: ["mon", "thu"], timeOfDay: ["08:00:00"] } },
    });
    expect(records[0]?.dosages[0]).toMatchObject({
      asNeeded: { kind: "yes" },
      maxPer24Hours: { value: 4000, ucum: "mg" },
      additionalInstructions: [{ text: "with food" }],
      patientInstruction: "Take with food.",
      timing: { dayOfWeek: ["mon", "thu"], timeOfDay: ["08:00:00"] },
    });
  });

  it("keeps a timing with only a code", () => {
    const { records } = dosed({ timing: { code: { text: "twice a day" } } });
    expect(records[0]?.dosages[0]?.timing).toEqual({
      code: { codings: [], text: "twice a day" },
      dayOfWeek: [],
      timeOfDay: [],
      when: [],
    });
  });

  it.each([
    [
      "a strength that is not a ratio",
      { itemCodeableConcept: { text: "p" }, strength: 5 },
      "Medication/paracetamol-500.ingredient[0].strength",
    ],
    [
      "a strength with no amount",
      { itemCodeableConcept: { text: "p" }, strength: { denominator: { value: 1 } } },
      "Medication/paracetamol-500.ingredient[0].strength",
    ],
    [
      "an ingredient with no name",
      { itemCodeableConcept: {} },
      "Medication/paracetamol-500.ingredient[0]",
    ],
  ])("reports %s", (_name, ingredient, path) => {
    const { issues } = medicationRecords([{ ...paracetamol, ingredient: [ingredient] }, order]);
    expect(issues).toContainEqual(expect.objectContaining({ code: "invalid-element", path }));
  });

  it("reports ingredients that are not a list, and an ingredient that is not an object", () => {
    expect(medicationRecords([{ ...paracetamol, ingredient: {} }, order]).issues).toContainEqual(
      expect.objectContaining({ path: "Medication/paracetamol-500.ingredient" }),
    );
    expect(medicationRecords([{ ...paracetamol, ingredient: [1] }, order]).issues).toContainEqual(
      expect.objectContaining({ path: "Medication/paracetamol-500.ingredient[0]" }),
    );
  });

  it("reads a Bundle with no entries as nothing", () => {
    expect(medicationRecords({ resourceType: "Bundle", type: "searchset" })).toEqual({
      records: [],
      excluded: [],
      issues: [],
    });
  });
});

describe("medicationRecords, what may be missing", () => {
  it("reads an order with no dosage, no date and no strength, and a dose with no dosage", () => {
    const { records } = medicationRecords([
      { ...paracetamol, ingredient: [{ itemCodeableConcept: { text: "paracetamol" } }] },
      { ...order, dosageInstruction: undefined, authoredOn: undefined },
      dose("d", { dosage: undefined }),
      { ...statement, dateAsserted: undefined },
    ]);
    const [first, second] = records;
    expect(first).toMatchObject({
      dosages: [],
      medication: { ingredients: [{ name: "paracetamol" }] },
    });
    expect(first).not.toHaveProperty("authoredOn");
    expect(first?.kind === "order" ? first.administrations[0] : undefined).not.toHaveProperty(
      "dose",
    );
    expect(second).not.toHaveProperty("dateAsserted");
  });

  it.each([
    [{ coding: [{ system: LOCAL, display: "by display" }] }, "by display"],
    [{ coding: [{ system: LOCAL, code: "BY-CODE" }] }, "BY-CODE"],
  ])("names a medicine from %j", (medicationCodeableConcept, name) => {
    const { records } = medicationRecords({ ...statement, medicationCodeableConcept });
    expect(records[0]?.medication.text).toBe(name);
  });

  it("leaves out a medicine given as a string rather than a concept", () => {
    const { issues } = medicationRecords({
      ...statement,
      medicationCodeableConcept: "paracetamol",
    });
    expect(issues).toContainEqual(expect.objectContaining({ code: "unresolved-medication" }));
  });

  it("leaves out a medicine with a coding but no words, rather than show it with no name", () => {
    const { records, issues } = medicationRecords({
      ...statement,
      medicationCodeableConcept: { coding: [{ system: LOCAL }] },
    });
    expect(records).toEqual([]);
    expect(issues).toContainEqual(expect.objectContaining({ code: "unresolved-medication" }));
  });

  it("leaves out an ingredient with a coding but no words", () => {
    const { issues } = medicationRecords([
      { ...paracetamol, ingredient: [{ itemCodeableConcept: { coding: [{ system: LOCAL }] } }] },
      order,
    ]);
    expect(issues).toContainEqual(
      expect.objectContaining({ path: "Medication/paracetamol-500.ingredient[0]" }),
    );
  });

  it("leaves out an order whose Medication has a code with no words", () => {
    const { issues } = medicationRecords([
      { ...paracetamol, code: { coding: [{ system: LOCAL }] } },
      order,
    ]);
    expect(issues).toContainEqual(expect.objectContaining({ code: "unresolved-medication" }));
  });
});
