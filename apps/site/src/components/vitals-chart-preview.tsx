import { VitalsChart, type VitalsTrack } from "@cadence-clinical/clinical";

import { NOW, SCHEMA, TIME_ZONE, VITALS } from "./observation-table-preview";

// All content is synthetic, and the schema's bands are arbitrary: they are not clinical
// thresholds. The tracks are laid out as the maintainer's mock-up lays them out.
const TRACKS: readonly VitalsTrack[] = [
  { kind: "line", key: "respiratory-rate", series: "respiratory-rate" },
  { kind: "line", key: "spo2", series: "spo2" },
  { kind: "line", key: "oxygen-flow", series: "oxygen-flow", heightPx: 64 },
  {
    kind: "pair",
    key: "bp-hr",
    label: "Blood pressure and heart rate",
    shortLabel: "BP + HR",
    high: "systolic",
    low: "diastolic",
    line: "heart-rate",
  },
  { kind: "line", key: "temperature", series: "temperature" },
  { kind: "line", key: "gcs", series: "gcs", heightPx: 64 },
];

/** A Vitals chart of synthetic vital signs, with arbitrary bands. */
export function VitalsChartPreview({
  span = "1d",
  labelStyle = "short",
}: {
  span?: string;
  labelStyle?: "short" | "full";
}) {
  return (
    <div className="not-prose preview-surface my-6 rounded-lg border p-6">
      <VitalsChart
        label="Synthetic observation chart"
        series={VITALS}
        schema={SCHEMA}
        tracks={TRACKS}
        defaultSpan={span}
        labelStyle={labelStyle}
        now={NOW}
        timeZone={TIME_ZONE}
      />
      <p className="mt-3 text-sm text-muted-foreground">
        Synthetic data. The bands are arbitrary and are not clinical thresholds.
      </p>
    </div>
  );
}
