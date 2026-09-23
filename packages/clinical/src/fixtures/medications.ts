/**
 * Synthetic medication records for stories and tests. The medicines are ordinary ones so the
 * words read naturally, but every order, dose, time and identifier is invented, and none is advice
 * on a dose.
 */

import type {
  Administration,
  Dosage,
  MedicationOrder,
  MedicationStatement,
} from "@cadence-clinical/core";

/** The moment the stories treat as now, in Melbourne. */
export const MEDICATION_NOW = "2026-09-23T15:00:00+10:00";

const oral = { codings: [], text: "oral" };

function dose(id: string, time: string, fields: Partial<Administration> = {}): Administration {
  return {
    id: `MedicationAdministration/${id}`,
    status: "completed",
    time,
    timeMs: Date.parse(time),
    dose: { value: 2, unitText: "tablet" },
    reasons: [],
    ...fields,
  };
}

const whenRequired: Dosage = {
  doseRange: { low: { value: 1, unitText: "tablet" }, high: { value: 2, unitText: "tablet" } },
  route: oral,
  timing: { frequency: 1, period: 6, periodUnit: "h", dayOfWeek: [], timeOfDay: [], when: [] },
  asNeeded: { kind: "yes", reason: { codings: [], text: "pain" } },
  maxPer24Hours: { value: 8, unitText: "tablet" },
  additionalInstructions: [],
};

/** A when required order with doses over two days, one not given. */
export const PARACETAMOL_ORDER: MedicationOrder = {
  kind: "order",
  id: "MedicationRequest/synthetic-1",
  status: "active",
  medication: {
    text: "paracetamol 500 mg tablet",
    ingredients: [{ name: "paracetamol", strength: { amount: { value: 500, ucum: "mg" } } }],
    form: { codings: [], text: "tablet" },
  },
  dosages: [whenRequired],
  authoredOn: "2026-09-21T09:00:00+10:00",
  administrations: [
    dose("d1", "2026-09-21T10:00:00+10:00"),
    dose("d2", "2026-09-22T08:10:00+10:00", { dose: { value: 1, unitText: "tablet" } }),
    dose("d3", "2026-09-22T20:05:00+10:00"),
    dose("d4", "2026-09-23T06:00:00+10:00"),
    dose("d5", "2026-09-23T12:10:00+10:00", {
      status: "not-done",
      reasons: [{ codings: [], text: "Patient declined" }],
    }),
  ],
};

/** A regular order with no doses given yet. */
export const REGULAR_ORDER: MedicationOrder = {
  kind: "order",
  id: "MedicationRequest/synthetic-2",
  status: "on-hold",
  medication: { text: "synthetic medicine 10 mg tablet", ingredients: [] },
  dosages: [
    {
      dose: { value: 10, ucum: "mg" },
      route: oral,
      timing: {
        frequency: 1,
        period: 1,
        periodUnit: "d",
        dayOfWeek: [],
        timeOfDay: [],
        when: ["MORN"],
      },
      asNeeded: { kind: "no" },
      additionalInstructions: [{ codings: [], text: "with food" }],
    },
  ],
  administrations: [],
};

const { maxPer24Hours: _maximum, ...withoutMaximum } = whenRequired;

/** A when required order missing what the guidelines require. */
export const INCOMPLETE_ORDER: MedicationOrder = {
  kind: "order",
  id: "MedicationRequest/synthetic-3",
  status: "active",
  medication: { text: "synthetic medicine 5 mg tablet", ingredients: [] },
  dosages: [{ ...withoutMaximum, asNeeded: { kind: "yes" } }],
  administrations: [],
};

/** An order whose dosage cannot be written from its parts, so the prescriber's text is used. */
export const TEXT_ORDER: MedicationOrder = {
  kind: "order",
  id: "MedicationRequest/synthetic-4",
  status: "active",
  medication: { text: "synthetic cream 1%", ingredients: [] },
  dosages: [
    {
      text: "Apply thinly to the rash twice a day",
      asNeeded: { kind: "no" },
      additionalInstructions: [],
    },
  ],
  administrations: [],
};

/** A medication list entry. */
export const LIST_ENTRY: MedicationStatement = {
  kind: "statement",
  id: "MedicationStatement/synthetic-5",
  status: "active",
  medication: { text: "synthetic eye drops 0.5%", ingredients: [] },
  dosages: [
    {
      dose: { value: 1, unitText: "drop" },
      site: { codings: [], text: "right eye" },
      timing: { frequency: 4, period: 1, periodUnit: "d", dayOfWeek: [], timeOfDay: [], when: [] },
      asNeeded: { kind: "no" },
      additionalInstructions: [],
    },
  ],
  dateAsserted: "2026-09-20T10:00:00+10:00",
};
