import { ObservationTable } from "@cadence-clinical/clinical";
import {
  applyObservationSchema,
  defineObservationSchema,
  type ObservationReading,
  type ObservationValue,
} from "@cadence-clinical/core";

// All content is synthetic. The bands are arbitrary, to show how bands are drawn: they are not
// clinical thresholds.
const SCHEMA = defineObservationSchema({
  levels: [
    { key: "in", label: "Within the synthetic range", short: "", severity: "severity-0" },
    { key: "one", label: "Synthetic level 1", short: "1", severity: "severity-1" },
    { key: "two", label: "Synthetic level 2", short: "2", severity: "severity-2" },
  ],
  series: [
    {
      key: "respiratory-rate",
      label: "Respiratory rate",
      unitLabel: "breaths/min",
      match: [],
      ucum: "/min",
      bands: [
        { level: "in", below: 22 },
        { level: "one", from: 22 },
      ],
    },
    {
      key: "heart-rate",
      label: "Heart rate",
      unitLabel: "beats/min",
      match: [],
      ucum: "/min",
      bands: [
        { level: "in", below: 105 },
        { level: "one", from: 105 },
      ],
    },
    {
      key: "temperature",
      label: "Temperature",
      unitLabel: "°C",
      match: [],
      ucum: "Cel",
      bands: [
        { level: "in", below: 38.1 },
        { level: "two", from: 38.1 },
      ],
    },
  ],
});

const NOW = "2026-09-23T15:00:00+10:00";
const ROUNDS: readonly [string, number, number, number | null][] = [
  ["2026-09-22T06:00:00+10:00", 16, 84, 37.1],
  ["2026-09-22T14:00:00+10:00", 23, 108, 38.3],
  ["2026-09-22T22:00:00+10:00", 20, 96, 37.6],
  ["2026-09-23T06:00:00+10:00", 17, 86, null],
  ["2026-09-23T10:00:00+10:00", 16, 80, 36.9],
];
const UCUM = { "respiratory-rate": "/min", "heart-rate": "/min", temperature: "Cel" } as const;

function reading(
  key: keyof typeof UCUM,
  at: string,
  seconds: number,
  raw: number | null,
): ObservationReading {
  const timeMs = Date.parse(at) + seconds * 1000;
  const value: ObservationValue =
    raw === null
      ? { kind: "absent", reason: { codings: [], text: "Patient asleep" } }
      : { kind: "quantity", quantity: { value: raw, ucum: UCUM[key] } };
  return {
    id: `${key}-${at}`,
    resource: `Observation/${key}-${at}`,
    code: { codings: [] },
    status: "final",
    time: new Date(timeMs).toISOString(),
    timeMs,
    value,
    source: { interpretation: [], referenceRanges: [] },
  };
}

const SERIES = applyObservationSchema(
  [
    {
      key: "respiratory-rate",
      readings: ROUNDS.map(([at, rate]) => reading("respiratory-rate", at, 0, rate)),
    },
    {
      key: "heart-rate",
      readings: ROUNDS.map(([at, , rate]) => reading("heart-rate", at, 40, rate)),
    },
    {
      key: "temperature",
      readings: ROUNDS.map(([at, , , temperature]) => reading("temperature", at, 80, temperature)),
    },
  ],
  SCHEMA,
);

/** A flowsheet of synthetic vital signs, with arbitrary bands. */
export function ObservationTablePreview() {
  return (
    <div className="not-prose preview-surface my-6 rounded-lg border p-6">
      <ObservationTable
        label="Synthetic vital signs"
        series={SERIES}
        now={NOW}
        timeZone="Australia/Melbourne"
      />
      <p className="mt-3 text-sm text-muted-foreground">
        Synthetic data. The bands are arbitrary and are not clinical thresholds.
      </p>
    </div>
  );
}
