import { describe, expect, it } from "vitest";

import { describeDosage, quantityWords } from "./dosage-words";
import type { Dosage, DoseTiming } from "./medication";
import type { Quantity } from "./observation";

// Expected lines quote the examples in the National Guidelines for On-Screen Display of Medicines
// Information (ACSQHC, December 2017), with the section named. The doses are the guidelines'
// examples of display, not advice on a dose.
const spaces = (text: string) => text.replaceAll("\u00a0", " ");
const timing = (fields: Partial<DoseTiming>): DoseTiming => ({
  dayOfWeek: [],
  timeOfDay: [],
  when: [],
  ...fields,
});
const dosage = (fields: Partial<Dosage>): Dosage => ({
  asNeeded: { kind: "no" },
  additionalInstructions: [],
  ...fields,
});
const q = (value: number, unit: { ucum?: string; unitText?: string }): Quantity => ({
  value,
  ...unit,
});

describe("describeDosage, the guidelines' examples", () => {
  it("writes an oral liquid when required (section 6.3.1)", () => {
    const words = describeDosage(
      dosage({
        dose: q(10, { ucum: "mL" }),
        route: { codings: [], text: "oral" },
        timing: timing({ frequency: 1, period: 6, periodMax: 8, periodUnit: "h" }),
        asNeeded: { kind: "yes", reason: { codings: [], text: "pain relief" } },
        maxPer24Hours: q(4, { unitText: "dose" }),
      }),
    );
    expect(spaces(words.line)).toBe(
      "oral – DOSE 10 mL – every 6 to 8 hours – when required for pain relief – do not exceed 4 doses in 24 hours",
    );
    expect(words).toMatchObject({ composed: true, gaps: [] });
  });

  it("writes eye drops at a site (section 6.3.1)", () => {
    const words = describeDosage(
      dosage({
        dose: q(1, { unitText: "drop" }),
        site: { codings: [], text: "right eye" },
        timing: timing({ frequency: 4, period: 1, periodUnit: "d" }),
      }),
    );
    expect(spaces(words.line)).toBe("right eye – DOSE 1 drop – four times a day");
  });

  it("writes tablets when required for a patient (section 7.3.3)", () => {
    const words = describeDosage(
      dosage({
        dose: q(2, { unitText: "tablet" }),
        route: { codings: [{ display: "Oral route" }] },
        timing: timing({ frequency: 1, period: 6, periodUnit: "h" }),
        asNeeded: { kind: "yes", reason: { codings: [], text: "pain" } },
        maxPer24Hours: q(8, { unitText: "tablet" }),
      }),
      "patient",
    );
    expect(spaces(words.line)).toBe(
      "Take 2 tablets by mouth every 6 hours when required for pain – do not take more than 8 tablets in 24 hours",
    );
  });
});

describe("describeDosage, how often (appendix 9.2)", () => {
  it.each([
    [{ frequency: 1, period: 1, periodUnit: "d" }, "once a day"],
    [{ frequency: 2, period: 1, periodUnit: "d" }, "twice a day"],
    [{ frequency: 3, period: 1, periodUnit: "d" }, "three times a day"],
    [{ frequency: 6, period: 1, periodUnit: "d" }, "6 times a day"],
    [{ frequency: 2, frequencyMax: 3, period: 1, periodUnit: "d" }, "2 to 3 times a day"],
    [{ frequency: 1, period: 1, periodUnit: "d", when: ["MORN"] }, "once a day in the morning"],
    [{ frequency: 1, period: 1, periodUnit: "d", when: ["NOON"] }, "once a day at midday"],
    [{ frequency: 1, period: 1, periodUnit: "d", when: ["NIGHT"] }, "once a day at night"],
    [{ when: ["EVE"] }, "once a day in the evening"],
    [{ frequency: 1, period: 1, periodUnit: "h" }, "every hour"],
    [{ frequency: 1, period: 4, periodUnit: "h" }, "every 4 hours"],
    [{ period: 15, periodUnit: "min" }, "every 15 minutes"],
    [{ period: 1, periodUnit: "min" }, "every minute"],
    [{ frequency: 1, period: 2, periodUnit: "d" }, "every 2 days"],
    [{ frequency: 1, period: 1, periodUnit: "wk", dayOfWeek: ["tue"] }, "once a week on Tuesday"],
    [
      { frequency: 3, period: 1, periodUnit: "wk", dayOfWeek: ["mon", "wed", "sat"] },
      "3 times a week on Mon, Wed and Sat",
    ],
    [{ frequency: 2, period: 1, periodUnit: "wk" }, "twice a week"],
    [{ frequency: 1, period: 2, periodUnit: "wk" }, "every 2 weeks"],
    [{ frequency: 1, period: 1, periodUnit: "mo" }, "once a month"],
    [{ frequency: 1, period: 3, periodUnit: "mo" }, "every 3 months"],
    [{ frequency: 1, period: 1, periodUnit: "d", when: ["PC"] }, "once a day after food"],
    [
      { frequency: 2, period: 1, periodUnit: "d", when: ["AC", "C"] },
      "twice a day before food with food",
    ],
    [
      { frequency: 1, period: 1, periodUnit: "d", timeOfDay: ["08:00:00"] },
      "once a day at 8:00 am",
    ],
    [
      { frequency: 2, period: 1, periodUnit: "d", timeOfDay: ["11:30:00", "23:30:00"] },
      "twice a day at 11:30 am and 23:30",
    ],
    [{ frequency: 1, period: 1, periodUnit: "d", timeOfDay: ["00:00:00"] }, "once a day at 24:00"],
    [{ frequency: 1, period: 1, periodUnit: "d", timeOfDay: ["12:00:00"] }, "once a day at 12:00"],
  ] satisfies [Partial<DoseTiming>, string][])("writes %j as %s", (fields, words) => {
    expect(
      describeDosage(dosage({ dose: q(1, { unitText: "tablet" }), timing: timing(fields) }))
        .frequency,
    ).toBe(words);
  });

  it.each([
    ["no period", { frequency: 2 }],
    ["two events alone", { when: ["MORN", "NIGHT"] }],
    ["an event it has no words for", { when: ["HS"] }],
    [
      "a range of both times and period",
      { frequency: 1, frequencyMax: 2, period: 4, periodMax: 6, periodUnit: "h" },
    ],
    ["twice an hour", { frequency: 2, period: 1, periodUnit: "h" }],
    [
      "a day with an event and more than once",
      { frequency: 2, period: 1, periodUnit: "d", when: ["MORN"] },
    ],
    ["twice every 2 days", { frequency: 2, period: 2, periodUnit: "d" }],
    ["a range of weeks", { frequency: 1, period: 1, periodMax: 2, periodUnit: "wk" }],
    ["twice every 2 weeks", { frequency: 2, period: 2, periodUnit: "wk" }],
    ["twice a month", { frequency: 2, period: 1, periodUnit: "mo" }],
    ["seconds", { frequency: 1, period: 30, periodUnit: "s" }],
    ["years", { frequency: 1, period: 1, periodUnit: "a" }],
    [
      "a day of the week FHIR does not define",
      { frequency: 1, period: 1, periodUnit: "wk", dayOfWeek: ["someday"] },
    ],
    [
      "a time of day that is not a time",
      { frequency: 1, period: 1, periodUnit: "d", timeOfDay: ["morning"] },
    ],
  ] satisfies [string, Partial<DoseTiming>][])("does not put %s into words", (_name, fields) => {
    expect(
      describeDosage(dosage({ dose: q(1, { unitText: "tablet" }), timing: timing(fields) }))
        .frequency,
    ).toBeUndefined();
  });
});

describe("quantityWords (appendix 9.1 and sections 6.3.3 to 6.3.7)", () => {
  it.each([
    [q(500, { ucum: "mg" }), "500 mg"],
    [q(0.5, { ucum: "mg" }), "0.5 mg"],
    [q(1000, { ucum: "mg" }), "1,000 mg"],
    [q(600, { ucum: "ug" }), "600 microgram"],
    [q(1, { ucum: "L" }), "1 Litre"],
    [q(1, { ucum: "U" }), "1 unit"],
    [q(10, { ucum: "[iU]" }), "10 units"],
    [q(2, { ucum: "h" }), "2 hours"],
    [q(1, { unitText: "tablet" }), "1 tablet"],
    [q(2, { unitText: "suppository" }), "2 suppositories"],
    [q(2, { unitText: "sachets of powder" }), "2 sachets of powder"],
    [q(5, { ucum: "mg/kg" }), "5 mg/kg"],
    [q(3, {}), "3"],
  ])("writes %j as %s", (quantity, words) => {
    expect(spaces(quantityWords(quantity))).toBe(words);
  });

  it("keeps the number and its unit together with a non-breaking space", () => {
    expect(quantityWords(q(5, { ucum: "mg" }))).toBe("5\u00a0mg");
  });
});

describe("describeDosage, parts and the prescriber's text", () => {
  it("uses the prescriber's text as written when it cannot write the dose out", () => {
    const words = describeDosage(
      dosage({
        text: "Sparingly to rash twice a day",
        timing: timing({ frequency: 2, period: 1, periodUnit: "d" }),
      }),
    );
    expect(words).toMatchObject({
      composed: false,
      line: "Sparingly to rash twice a day",
      frequency: "twice a day",
    });
  });

  it("writes what it has when there is no text either", () => {
    const words = describeDosage(dosage({ route: { codings: [{ code: "IV" }] } }));
    expect(words).toMatchObject({ composed: false, line: "IV" });
  });

  it("reports a when required order with no reason and no maximum", () => {
    const words = describeDosage(
      dosage({ dose: q(1, { unitText: "tablet" }), asNeeded: { kind: "yes" } }),
    );
    expect(words).toMatchObject({
      composed: true,
      whenRequired: "when required",
      gaps: ["indication", "maximum"],
    });
  });

  it("writes a dose range and instructions, and a patient's own instruction for a patient", () => {
    const base = dosage({
      doseRange: { low: q(1, { unitText: "tablet" }), high: q(2, { unitText: "tablet" }) },
      route: { codings: [], text: "sublingual" },
      timing: timing({ when: ["NIGHT"] }),
      additionalInstructions: [
        { codings: [], text: "with water" },
        { codings: [{ system: "https://example.org" }] },
      ],
      patientInstruction: "Let it dissolve.",
    });
    expect(spaces(describeDosage(base).line)).toBe(
      "sublingual – DOSE 1 to 2 tablets – once a day at night – with water",
    );
    expect(spaces(describeDosage(base, "patient").line)).toBe(
      "Dissolve 1 to 2 tablets under the tongue once a day at night – with water – Let it dissolve.",
    );
  });

  it.each([
    [{ codings: [], text: "buccal" }, "Dissolve 1 tablet inside the cheek once a day at night"],
    [{ codings: [], text: "topical" }, "Apply 1 tablet to the affected area once a day at night"],
    [{ codings: [], text: "intravenous" }, "1 tablet (intravenous) once a day at night"],
    [undefined, "1 tablet once a day at night"],
  ])("writes the route %j for a patient", (route, line) => {
    const words = describeDosage(
      dosage({
        dose: q(1, { unitText: "tablet" }),
        timing: timing({ when: ["NIGHT"] }),
        ...(route ? { route } : {}),
      }),
      "patient",
    );
    expect(spaces(words.line)).toBe(line);
  });

  it("writes when required with no timing for a patient, and what it has with no dose", () => {
    const whenRequired = describeDosage(
      dosage({
        dose: q(1, { unitText: "tablet" }),
        asNeeded: { kind: "yes", reason: { codings: [], text: "nausea" } },
      }),
      "patient",
    );
    expect(spaces(whenRequired.line)).toBe("1 tablet when required for nausea");
    expect(describeDosage(dosage({ timing: timing({ when: ["MORN"] }) }), "patient").line).toBe(
      "once a day in the morning",
    );
  });

  it("names a site for a patient", () => {
    const words = describeDosage(
      dosage({
        dose: q(1, { unitText: "drop" }),
        site: { codings: [], text: "left eye" },
        timing: timing({ frequency: 1, period: 1, periodUnit: "d" }),
      }),
      "patient",
    );
    expect(spaces(words.line)).toBe("1 drop left eye once a day");
  });
});
