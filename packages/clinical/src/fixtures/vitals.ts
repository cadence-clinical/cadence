/**
 * Synthetic vital signs for stories and tests. Every value, time and identifier is invented, and
 * the schema's bands are arbitrary: they show how bands are drawn and are not clinical
 * thresholds. A real schema comes from a Region package, with its citation.
 */

import {
  applyObservationSchema,
  defineObservationSchema,
  groupRounds,
  scoreRounds,
  type InterpretedSeries,
  type ObservationReading,
  type ObservationSeries,
  type ObservationValue,
  type RoundTotal,
} from "@cadence-clinical/core";

const LOCAL = "https://ehr.example.org/codes/observation";

/** The moment the stories treat as now, in Melbourne. */
export const NOW = "2026-09-23T15:00:00+10:00";
/** The time zone the stories show times in. */
export const TIME_ZONE = "Australia/Melbourne";

/** A synthetic schema. Its bands are arbitrary and are not clinical thresholds. */
export const SYNTHETIC_SCHEMA = defineObservationSchema({
  levels: [
    { key: "in", label: "Within the synthetic range", short: "", severity: "severity-0", score: 0 },
    { key: "one", label: "Synthetic level 1", short: "1", severity: "severity-1", score: 1 },
    { key: "two", label: "Synthetic level 2", short: "2", severity: "severity-2", score: 2 },
    { key: "three", label: "Synthetic level 3", short: "3", severity: "severity-3", score: 3 },
    { key: "call", label: "Synthetic emergency level", short: "E", severity: "severity-6" },
  ],
  series: [
    {
      key: "respiratory-rate",
      label: "Respiratory rate",
      shortLabel: "RR",
      unitLabel: "breaths/min",
      match: [{ system: LOCAL, code: "rr" }],
      ucum: "/min",
      bands: [
        { level: "call", below: 6 },
        { level: "two", from: 6, below: 10 },
        { level: "in", from: 10, below: 22 },
        { level: "one", from: 22, below: 27 },
        { level: "three", from: 27 },
      ],
    },
    {
      key: "spo2",
      label: "SpO₂",
      unitLabel: "%",
      match: [{ system: LOCAL, code: "spo2" }],
      ucum: "%",
      bands: [
        { level: "three", below: 90 },
        { level: "one", from: 90, below: 94 },
        { level: "in", from: 94 },
      ],
    },
    {
      // Shown only in the rounds where supplementary oxygen was given.
      key: "oxygen-flow",
      label: "Oxygen flow",
      shortLabel: "O₂ flow",
      unitLabel: "L/min",
      match: [{ system: LOCAL, code: "o2-flow" }],
      ucum: "L/min",
      bands: [
        { level: "in", below: 1 },
        { level: "one", from: 1, below: 4 },
        { level: "two", from: 4 },
      ],
    },
    {
      key: "heart-rate",
      label: "Heart rate",
      shortLabel: "HR",
      unitLabel: "beats/min",
      match: [{ system: LOCAL, code: "hr" }],
      ucum: "/min",
      bands: [
        { level: "two", below: 50 },
        { level: "in", from: 50, below: 105 },
        { level: "one", from: 105, below: 125 },
        { level: "three", from: 125 },
      ],
    },
    {
      key: "systolic",
      label: "Systolic blood pressure",
      shortLabel: "SBP",
      unitLabel: "mmHg",
      match: [{ system: LOCAL, code: "sbp" }],
      ucum: "mm[Hg]",
      bands: [
        { level: "three", below: 95 },
        { level: "in", from: 95, below: 165 },
        { level: "one", from: 165 },
      ],
    },
    {
      key: "diastolic",
      label: "Diastolic blood pressure",
      shortLabel: "DBP",
      unitLabel: "mmHg",
      match: [{ system: LOCAL, code: "dbp" }],
      ucum: "mm[Hg]",
      bands: [
        { level: "one", below: 50 },
        { level: "in", from: 50, below: 100 },
        { level: "one", from: 100 },
      ],
    },
    {
      key: "temperature",
      label: "Temperature",
      shortLabel: "Temp",
      unitLabel: "°C",
      match: [{ system: LOCAL, code: "temp" }],
      ucum: "Cel",
      bands: [
        { level: "one", below: 35.6 },
        { level: "in", from: 35.6, below: 38.1 },
        { level: "two", from: 38.1 },
      ],
    },
    {
      key: "consciousness",
      label: "Consciousness",
      shortLabel: "AVPU",
      match: [{ system: LOCAL, code: "avpu" }],
      answers: [
        { level: "in", text: ["Alert"] },
        { level: "two", text: ["Voice"] },
        { level: "call", text: ["Pain", "Unresponsive"] },
      ],
    },
    {
      key: "gcs",
      label: "Glasgow Coma Scale",
      shortLabel: "GCS",
      match: [{ system: LOCAL, code: "gcs" }],
      ucum: "{score}",
      bands: [
        { level: "call", below: 9 },
        { level: "two", from: 9, below: 14 },
        { level: "one", from: 14, below: 15 },
        { level: "in", from: 15 },
      ],
    },
  ],
  total: {
    label: "Synthetic total score",
    shortLabel: "Total",
    requires: [
      "respiratory-rate",
      "spo2",
      "heart-rate",
      "systolic",
      "temperature",
      "consciousness",
    ],
    bands: [
      { level: "in", below: 1 },
      { level: "one", from: 1, below: 4 },
      { level: "two", from: 4, below: 6 },
      { level: "three", from: 6 },
    ],
    escalations: [{ fromLevels: ["call"], level: "call" }],
  },
});

type Row = Readonly<Record<string, number | string | null>>;

/**
 * Rounds of synthetic observations, oldest first. Each is taken over a minute or two, so a
 * round's readings do not share one time. `null` is a value not recorded.
 */
const ROUNDS: readonly (Row & { at: string })[] = [
  {
    at: "2026-09-20T18:05:00+10:00",
    diastolic: 78,
    gcs: 15,
    "respiratory-rate": 16,
    spo2: 97,
    "heart-rate": 78,
    systolic: 128,
    temperature: 36.8,
    consciousness: "Alert",
  },
  {
    at: "2026-09-20T22:10:00+10:00",
    diastolic: 76,
    gcs: 15,
    "respiratory-rate": 18,
    spo2: 96,
    "heart-rate": 84,
    systolic: 124,
    temperature: 37.1,
    consciousness: "Alert",
  },
  {
    at: "2026-09-21T02:15:00+10:00",
    diastolic: 72,
    gcs: 15,
    "respiratory-rate": 20,
    spo2: 95,
    "heart-rate": 92,
    systolic: 118,
    temperature: 37.6,
    consciousness: "Alert",
  },
  {
    at: "2026-09-21T06:00:00+10:00",
    diastolic: 68,
    gcs: 15,
    "oxygen-flow": 2,
    "respiratory-rate": 23,
    spo2: 93,
    "heart-rate": 108,
    systolic: 112,
    temperature: 38.3,
    consciousness: "Alert",
  },
  {
    at: "2026-09-21T10:05:00+10:00",
    diastolic: 64,
    gcs: 14,
    "oxygen-flow": 4,
    "respiratory-rate": 24,
    spo2: 92,
    "heart-rate": 114,
    systolic: 106,
    temperature: 38.6,
    consciousness: "Voice",
  },
  {
    at: "2026-09-21T14:00:00+10:00",
    diastolic: 70,
    gcs: 15,
    "oxygen-flow": 2,
    "respiratory-rate": 21,
    spo2: 95,
    "heart-rate": 101,
    systolic: 116,
    temperature: 37.9,
    consciousness: "Alert",
  },
  {
    at: "2026-09-21T18:10:00+10:00",
    diastolic: 74,
    gcs: 15,
    "respiratory-rate": 19,
    spo2: 96,
    "heart-rate": 94,
    systolic: 121,
    temperature: 37.4,
    consciousness: "Alert",
  },
  {
    at: "2026-09-22T06:05:00+10:00",
    diastolic: 77,
    gcs: 15,
    "respiratory-rate": 17,
    spo2: 97,
    "heart-rate": 86,
    systolic: 126,
    temperature: null,
    consciousness: "Alert",
  },
  {
    at: "2026-09-22T14:00:00+10:00",
    diastolic: 80,
    gcs: 15,
    "respiratory-rate": 16,
    spo2: 98,
    "heart-rate": 80,
    systolic: 130,
    temperature: 36.9,
    consciousness: "Alert",
  },
  {
    at: "2026-09-22T22:00:00+10:00",
    diastolic: 82,
    gcs: 15,
    "respiratory-rate": 15,
    spo2: 98,
    "heart-rate": 76,
    systolic: 133,
    temperature: 36.7,
    consciousness: "Alert",
  },
  {
    at: "2026-09-23T06:00:00+10:00",
    diastolic: 79,
    gcs: 15,
    "respiratory-rate": 16,
    spo2: 97,
    "heart-rate": 79,
    systolic: 129,
    temperature: 36.8,
    consciousness: "Alert",
  },
  {
    at: "2026-09-23T10:00:00+10:00",
    diastolic: 78,
    gcs: 15,
    "respiratory-rate": 17,
    spo2: 97,
    "heart-rate": 82,
    systolic: 127,
    temperature: 36.8,
    consciousness: "Alert",
  },
];

const UNITS: Readonly<Record<string, { ucum: string; unitText: string }>> = {
  "respiratory-rate": { ucum: "/min", unitText: "br/min" },
  spo2: { ucum: "%", unitText: "%" },
  "heart-rate": { ucum: "/min", unitText: "bpm" },
  systolic: { ucum: "mm[Hg]", unitText: "mmHg" },
  diastolic: { ucum: "mm[Hg]", unitText: "mmHg" },
  "oxygen-flow": { ucum: "L/min", unitText: "L/min" },
  temperature: { ucum: "Cel", unitText: "degC" },
};

/** A reading of one series, the given number of seconds into its round. */
export function syntheticReading(
  key: string,
  at: string,
  seconds: number,
  value: ObservationValue,
  id = `Observation/${key}-${at}`,
): ObservationReading {
  const timeMs = Date.parse(at) + seconds * 1000;
  return {
    id,
    resource: id,
    code: { codings: [{ system: LOCAL, code: key }] },
    status: "final",
    time: new Date(timeMs).toISOString(),
    timeMs,
    value,
    source: { interpretation: [], referenceRanges: [] },
  };
}

function valueOf(key: string, raw: number | string | null): ObservationValue {
  if (raw === null) return { kind: "absent", reason: { codings: [], text: "Patient asleep" } };
  if (typeof raw === "string") return { kind: "concept", concept: { codings: [], text: raw } };
  if (key === "gcs") return { kind: "integer", value: raw };
  const unit = UNITS[key];
  return { kind: "quantity", quantity: { value: raw, ...unit } };
}

/** The synthetic rounds as series, each value a few seconds into its round. */
export function syntheticSeries(
  rounds: readonly (Row & { at: string })[] = ROUNDS,
): ObservationSeries[] {
  return SYNTHETIC_SCHEMA.series.map(({ key }, index) => ({
    key,
    readings: rounds.flatMap((round) => {
      const raw = round[key];
      return raw === undefined
        ? []
        : [syntheticReading(key, round.at, index * 15, valueOf(key, raw))];
    }),
  }));
}

/** The synthetic totals for the synthetic vitals, grouped as the table groups its columns. */
export function syntheticTotals(vitals: readonly InterpretedSeries[] = syntheticVitals()): {
  label: string;
  shortLabel: string;
  rounds: RoundTotal[];
} {
  return {
    label: SYNTHETIC_SCHEMA.total.label,
    shortLabel: SYNTHETIC_SCHEMA.total.shortLabel,
    rounds: scoreRounds(groupRounds(vitals, 5 * 60_000), SYNTHETIC_SCHEMA),
  };
}

/** Three days of synthetic vital signs, with the synthetic schema applied. */
export function syntheticVitals(
  series: readonly ObservationSeries[] = syntheticSeries(),
): InterpretedSeries[] {
  return applyObservationSchema(series, SYNTHETIC_SCHEMA);
}
