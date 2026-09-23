/**
 * Synthetic FHIR R4 fixtures. Their shape follows a real extract of vital signs from an
 * Australian electronic health record: a site's own codes beside LOINC, values in components,
 * two heart rates at one moment, answers written as text, and a search split across pages. Every
 * identifier, time and value is invented. None is a clinical reference value.
 */

import type { Bundle, BundleEntry, FhirResource, Observation } from "fhir/r4";

/** A code system standing in for a hospital's own codes. */
export const LOCAL = "https://ehr.example.org/codes/observation";
/** LOINC's system URI. */
export const LOINC = "http://loinc.org";
/** UCUM's system URI. */
export const UCUM = "http://unitsofmeasure.org";
const INTERPRETATION = "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation";

/**
 * A minimal final vital sign, to build a case from. It has a heart rate as its value unless the
 * fields give it another value or components.
 */
export function vital(id: string, fields: Partial<Observation> = {}): Observation {
  const hasValue = Object.keys(fields).some(
    (key) => key.startsWith("value") || key === "component",
  );
  return {
    resourceType: "Observation",
    id,
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs",
          },
        ],
      },
    ],
    code: { coding: [{ system: LOINC, code: "8867-4" }], text: "Heart rate" },
    subject: { reference: "Patient/example-1" },
    effectiveDateTime: "2026-09-20T08:00:00+10:00",
    ...(hasValue ? {} : { valueQuantity: { value: 80, unit: "bpm", system: UCUM, code: "/min" } }),
    ...fields,
  };
}

const heartRateMonitored = vital("hr-monitor-1", {
  code: {
    coding: [
      { system: LOCAL, code: "1001", display: "Heart Rate Monitored" },
      { system: LOINC, code: "8867-4" },
    ],
    text: "Heart Rate Monitored",
  },
  effectiveDateTime: "2026-09-20T09:30:00+10:00",
  valueQuantity: { value: 84, unit: "bpm", system: UCUM, code: "/min" },
});

const heartRatePalpated = vital("hr-pulse-1", {
  code: {
    coding: [
      { system: LOCAL, code: "1002", display: "Peripheral Pulse Rate" },
      { system: LOINC, code: "8867-4" },
    ],
    text: "Peripheral Pulse Rate",
  },
  effectiveDateTime: "2026-09-20T09:30:00+10:00",
  valueQuantity: { value: 82, unit: "bpm", system: UCUM, code: "/min" },
});

const bloodPressure = vital("bp-1", {
  code: {
    coding: [{ system: LOINC, code: "85354-9" }],
    text: "Blood pressure panel with all children optional",
  },
  effectiveDateTime: "2026-09-20T09:31:10+10:00",
  component: [
    {
      code: {
        coding: [
          { system: LOCAL, code: "2001", display: "Systolic Blood Pressure" },
          { system: LOINC, code: "8480-6" },
        ],
      },
      valueQuantity: { value: 124, unit: "mmHg", system: UCUM, code: "mm[Hg]" },
    },
    {
      code: {
        coding: [
          { system: LOCAL, code: "2002", display: "Diastolic Blood Pressure" },
          { system: LOINC, code: "8462-4" },
        ],
      },
      valueQuantity: { value: 78, unit: "mmHg", system: UCUM, code: "mm[Hg]" },
    },
  ],
});

const oxygenSaturation = vital("spo2-1", {
  code: {
    coding: [
      { system: LOCAL, code: "3001", display: "SpO2" },
      { system: LOINC, code: "2708-6" },
      { system: LOINC, code: "59408-5" },
    ],
    text: "SpO2",
  },
  effectiveDateTime: "2026-09-20T09:29:00+10:00",
  valueQuantity: { value: 97, unit: "%", system: UCUM, code: "%" },
  interpretation: [
    {
      coding: [
        { system: LOCAL, code: "9001", userSelected: true },
        { system: INTERPRETATION, code: "N", display: "Normal" },
      ],
    },
  ],
  referenceRange: [
    {
      low: { value: 10, unit: "%", system: UCUM, code: "%" },
      high: { value: 20, unit: "%", system: UCUM, code: "%" },
      type: { text: "Synthetic range for tests. Not a clinical range." },
    },
  ],
  component: [
    {
      code: { coding: [{ system: LOCAL, code: "3002", display: "FiO2" }] },
      valueQuantity: { value: 28, unit: "%", system: UCUM, code: "%" },
    },
  ],
});

const sedation = vital("sedation-1", {
  code: { coding: [{ system: LOCAL, code: "4001", display: "Sedation Score (UMSS)" }] },
  effectiveDateTime: "2026-09-20T09:29:30+10:00",
  valueCodeableConcept: { text: "0 - Awake and alert" },
});

const comment = vital("comment-1", {
  code: { coding: [{ system: LOCAL, code: "5001", display: "Observation comments" }] },
  effectiveDateTime: "2026-09-20T09:32:00+10:00",
  valueString: "Synthetic comment.",
});

const earlierHeartRate = vital("hr-monitor-0", {
  code: heartRateMonitored.code,
  effectiveDateTime: "2026-09-20T05:30:00+10:00",
  valueQuantity: { value: 72, unit: "bpm", system: UCUM, code: "/min" },
});

function searchPage(url: string, resources: FhirResource[], next?: string): Bundle {
  return {
    resourceType: "Bundle",
    type: "searchset",
    link: [
      { relation: "self", url },
      ...(next === undefined ? [] : [{ relation: "next", url: next }]),
    ],
    entry: resources.map((resource): BundleEntry => ({
      fullUrl: `https://ehr.example.org/fhir/${resource.resourceType}/${resource.id ?? ""}`,
      resource,
      search: { mode: "match" },
    })),
  };
}

/** Two pages of a search, as a consumer would collect them by following `next`. */
export const VITALS_PAGES: Bundle[] = [
  searchPage(
    "https://ehr.example.org/fhir/Observation?category=vital-signs",
    [heartRateMonitored, heartRatePalpated, bloodPressure, oxygenSaturation],
    "https://ehr.example.org/fhir/Observation?category=vital-signs&page=2",
  ),
  searchPage("https://ehr.example.org/fhir/Observation?category=vital-signs&page=2", [
    sedation,
    comment,
    earlierHeartRate,
    // A page boundary that moved between requests repeats a resource.
    heartRatePalpated,
    {
      resourceType: "OperationOutcome",
      id: "outcome-1",
      issue: [{ severity: "information", code: "informational" }],
    },
  ]),
];
