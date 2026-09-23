import { ObservationTable, TOTAL_ROW } from "@cadence-clinical/clinical";
import {
  applyObservationSchema,
  defineObservationSchema,
  groupRounds,
  scoreRounds,
  type InterpretedSeries,
  type ObservationReading,
  type ObservationValue,
} from "@cadence-clinical/core";

// All content is synthetic. The bands, scores and total are arbitrary, to show how bands are
// drawn and a total is added up: they are not clinical thresholds or a clinical score. A real
// schema comes from a Region package that cites its source.
const SCHEMA = defineObservationSchema({
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
      unitLabel: "breaths/min",
      match: [],
      ucum: "/min",
      bands: [
        { level: "two", below: 10 },
        { level: "in", from: 10, below: 22 },
        { level: "one", from: 22 },
      ],
    },
    {
      key: "spo2",
      label: "SpO₂",
      unitLabel: "%",
      match: [],
      ucum: "%",
      bands: [
        { level: "three", below: 90 },
        { level: "one", from: 90, below: 94 },
        { level: "in", from: 94 },
      ],
    },
    {
      // Recorded only while supplementary oxygen is given, so the row is empty otherwise.
      key: "oxygen-flow",
      label: "Oxygen flow",
      unitLabel: "L/min",
      match: [],
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
      unitLabel: "beats/min",
      match: [],
      ucum: "/min",
      bands: [
        { level: "two", below: 50 },
        { level: "in", from: 50, below: 105 },
        { level: "one", from: 105 },
      ],
    },
    {
      key: "systolic",
      label: "Systolic blood pressure",
      unitLabel: "mmHg",
      match: [],
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
      unitLabel: "mmHg",
      match: [],
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
      unitLabel: "°C",
      match: [],
      ucum: "Cel",
      bands: [
        { level: "one", below: 35.6 },
        { level: "in", from: 35.6, below: 38.1 },
        { level: "two", from: 38.1 },
      ],
    },
    {
      key: "gcs",
      label: "Glasgow Coma Scale",
      match: [],
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
    requires: ["respiratory-rate", "spo2", "heart-rate", "systolic", "temperature", "gcs"],
    bands: [
      { level: "in", below: 1 },
      { level: "one", from: 1, below: 4 },
      { level: "two", from: 4, below: 6 },
      { level: "three", from: 6 },
    ],
    escalations: [{ fromLevels: ["call"], level: "call" }],
  },
});

const NOW = "2026-09-23T15:00:00+10:00";
const TIME_ZONE = "Australia/Melbourne";
const WINDOW_MS = 5 * 60_000;

type Key = (typeof SCHEMA.series)[number]["key"];
type Round = { readonly at: string } & Partial<Record<Key, number | null>>;

/** Rounds of synthetic observations. `null` is a value not recorded. */
const ROUNDS: readonly Round[] = [
  {
    at: "2026-09-22T02:00:00+10:00",
    "respiratory-rate": 16,
    spo2: 97,
    "heart-rate": 84,
    systolic: 126,
    diastolic: 78,
    temperature: 37.1,
    gcs: 15,
  },
  {
    at: "2026-09-22T06:00:00+10:00",
    "respiratory-rate": 23,
    spo2: 92,
    "oxygen-flow": 2,
    "heart-rate": 108,
    systolic: 112,
    diastolic: 68,
    temperature: 38.3,
    gcs: 15,
  },
  {
    at: "2026-09-22T10:00:00+10:00",
    "respiratory-rate": 24,
    spo2: 93,
    "oxygen-flow": 4,
    "heart-rate": 114,
    systolic: 106,
    diastolic: 64,
    temperature: 38.6,
    gcs: 14,
  },
  {
    at: "2026-09-22T14:00:00+10:00",
    "respiratory-rate": 20,
    spo2: 95,
    "oxygen-flow": 2,
    "heart-rate": 96,
    systolic: 118,
    diastolic: 70,
    temperature: 37.6,
    gcs: 15,
  },
  {
    at: "2026-09-22T22:00:00+10:00",
    "respiratory-rate": 17,
    spo2: 96,
    "heart-rate": 86,
    systolic: 124,
    diastolic: 76,
    temperature: null,
    gcs: 15,
  },
  {
    at: "2026-09-23T06:00:00+10:00",
    "respiratory-rate": 16,
    spo2: 97,
    "heart-rate": 80,
    systolic: 129,
    diastolic: 79,
    temperature: 36.9,
    gcs: 15,
  },
  {
    at: "2026-09-23T10:00:00+10:00",
    "respiratory-rate": 16,
    spo2: 97,
    "heart-rate": 79,
    systolic: 127,
    diastolic: 78,
    temperature: 36.8,
    gcs: 15,
  },
];

const UCUM: Record<Key, string> = {
  "respiratory-rate": "/min",
  spo2: "%",
  "oxygen-flow": "L/min",
  "heart-rate": "/min",
  systolic: "mm[Hg]",
  diastolic: "mm[Hg]",
  temperature: "Cel",
  gcs: "{score}",
};

function reading(
  key: string,
  at: string,
  seconds: number,
  value: ObservationValue,
  id = `${key}-${at}`,
): ObservationReading {
  const timeMs = Date.parse(at) + seconds * 1000;
  return {
    id,
    resource: `Observation/${id}`,
    code: { codings: [] },
    status: "final",
    time: new Date(timeMs).toISOString(),
    timeMs,
    value,
    source: { interpretation: [], referenceRanges: [] },
  };
}

function valueOf(key: Key, raw: number | null): ObservationValue {
  if (raw === null) return { kind: "absent", reason: { codings: [], text: "Patient asleep" } };
  if (key === "gcs") return { kind: "integer", value: raw };
  return { kind: "quantity", quantity: { value: raw, ucum: UCUM[key] } };
}

// Each series is recorded a little after the last, as a round of vital signs is.
const VITALS = applyObservationSchema(
  SCHEMA.series.map(({ key }, index) => ({
    key,
    readings: ROUNDS.flatMap((round) => {
      const raw = round[key];
      return raw === undefined ? [] : [reading(key, round.at, index * 12, valueOf(key, raw))];
    }),
  })),
  SCHEMA,
);

const TOTALS = {
  label: SCHEMA.total.label,
  rounds: scoreRounds(groupRounds(VITALS, WINDOW_MS), SCHEMA),
};

/** Series built straight from readings, for the smaller examples. */
function only(series: { key: Key; readings: ObservationReading[] }[]): InterpretedSeries[] {
  return applyObservationSchema(series, SCHEMA);
}

const EXAMPLES = {
  vitals: { series: VITALS, totals: TOTALS },
  "no-total": { series: VITALS },
  "two-values": {
    series: only([
      {
        key: "heart-rate",
        readings: [
          reading(
            "heart-rate",
            "2026-09-23T10:00:00+10:00",
            0,
            { kind: "quantity", quantity: { value: 82, ucum: "/min" } },
            "monitor",
          ),
          reading(
            "heart-rate",
            "2026-09-23T10:00:00+10:00",
            40,
            { kind: "quantity", quantity: { value: 86, ucum: "/min" } },
            "counted",
          ),
        ],
      },
    ]),
  },
  "not-banded": {
    series: only([
      {
        key: "temperature",
        readings: [
          reading("temperature", "2026-09-23T06:00:00+10:00", 0, {
            kind: "quantity",
            quantity: { value: 98.4, ucum: "[degF]", unitText: "°F" },
          }),
          reading("temperature", "2026-09-23T10:00:00+10:00", 0, {
            kind: "absent",
            reason: { codings: [], text: "Patient asleep" },
          }),
        ],
      },
      {
        key: "spo2",
        readings: [
          reading("spo2", "2026-09-23T06:00:00+10:00", 0, {
            kind: "quantity",
            quantity: { value: 95, ucum: "%", comparator: "<" },
          }),
        ],
      },
    ]),
  },
  empty: { series: [] },
} as const;

/** The name of an Observation table example on the docs pages. */
export type ObservationTableExample = keyof typeof EXAMPLES;

/**
 * An Observation table of synthetic vital signs, with arbitrary bands. `hide` hides rows at
 * first: pass `TOTAL_ROW` to hide the total.
 */
export function ObservationTablePreview({
  example = "vitals",
  hide = [],
}: {
  example?: ObservationTableExample;
  hide?: readonly string[];
}) {
  const { series, ...rest } = EXAMPLES[example];
  return (
    <div className="not-prose preview-surface my-6 rounded-lg border p-6">
      <ObservationTable
        label="Synthetic vital signs"
        series={series}
        totals={"totals" in rest ? rest.totals : undefined}
        defaultHiddenRows={hide.map((key) => (key === "total" ? TOTAL_ROW : key))}
        now={NOW}
        timeZone={TIME_ZONE}
      />
      <p className="mt-3 text-sm text-muted-foreground">
        Synthetic data. The bands, scores and total are arbitrary and are not clinical thresholds.
      </p>
    </div>
  );
}
