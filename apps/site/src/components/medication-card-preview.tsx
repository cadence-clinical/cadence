import { MedicationCard } from "@cadence-clinical/clinical";
import type { Administration, Dosage, MedicationRecord } from "@cadence-clinical/core";

// All content is synthetic, and none of it is advice on a dose. The medicines are ordinary ones so
// the words read naturally.
const NOW = "2026-09-23T15:00:00+10:00";
const oral = { codings: [], text: "oral" };

const dose = (id: string, time: string, fields: Partial<Administration> = {}): Administration => ({
  id: `MedicationAdministration/${id}`,
  status: "completed",
  time,
  timeMs: Date.parse(time),
  dose: { value: 2, unitText: "tablet" },
  reasons: [],
  ...fields,
});

const whenRequired: Dosage = {
  doseRange: { low: { value: 1, unitText: "tablet" }, high: { value: 2, unitText: "tablet" } },
  route: oral,
  timing: { frequency: 1, period: 6, periodUnit: "h", dayOfWeek: [], timeOfDay: [], when: [] },
  asNeeded: { kind: "yes", reason: { codings: [], text: "pain" } },
  maxPer24Hours: { value: 8, unitText: "tablet" },
  additionalInstructions: [],
};
const { maxPer24Hours: _maximum, ...withoutMaximum } = whenRequired;

const RECORDS = {
  order: {
    kind: "order",
    id: "MedicationRequest/synthetic-1",
    status: "active",
    medication: { text: "paracetamol 500 mg tablet", ingredients: [] },
    dosages: [whenRequired],
    administrations: [
      dose("d1", "2026-09-22T08:10:00+10:00", { dose: { value: 1, unitText: "tablet" } }),
      dose("d2", "2026-09-22T20:05:00+10:00"),
      dose("d3", "2026-09-23T06:00:00+10:00"),
      dose("d4", "2026-09-23T12:10:00+10:00", {
        status: "not-done",
        reasons: [{ codings: [], text: "Patient declined" }],
      }),
    ],
  },
  regular: {
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
  },
  missing: {
    kind: "order",
    id: "MedicationRequest/synthetic-3",
    status: "active",
    medication: { text: "synthetic medicine 5 mg tablet", ingredients: [] },
    dosages: [{ ...withoutMaximum, asNeeded: { kind: "yes" } }],
    administrations: [],
  },
  text: {
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
  },
  list: {
    kind: "statement",
    id: "MedicationStatement/synthetic-5",
    status: "active",
    medication: { text: "synthetic eye drops 0.5%", ingredients: [] },
    dosages: [
      {
        dose: { value: 1, unitText: "drop" },
        site: { codings: [], text: "right eye" },
        timing: {
          frequency: 4,
          period: 1,
          periodUnit: "d",
          dayOfWeek: [],
          timeOfDay: [],
          when: [],
        },
        asNeeded: { kind: "no" },
        additionalInstructions: [],
      },
    ],
    dateAsserted: "2026-09-20T10:00:00+10:00",
  },
} satisfies Record<string, MedicationRecord>;

/** A Medication card of a synthetic record. */
export function MedicationCardPreview({
  record = "order",
  audience = "clinician",
  open = false,
}: {
  record?: keyof typeof RECORDS;
  audience?: "clinician" | "patient";
  open?: boolean;
}) {
  return (
    <div className="not-prose preview-surface my-6 rounded-lg border p-6">
      <div className="max-w-lg">
        <MedicationCard
          record={RECORDS[record]}
          audience={audience}
          defaultOpen={open}
          now={NOW}
          timeZone="Australia/Melbourne"
        />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Synthetic data. Not advice on a dose.</p>
    </div>
  );
}
