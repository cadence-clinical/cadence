/**
 * Every feature the prototypes app holds, and every prototype of each: the index page is drawn from
 * this list. Add a feature when its brief is started, and an entry when its prototype is planned or
 * built. A planned entry has no route, so the index shows it without a link.
 */

/** Where a feature's prototyping has got to. */
export type FeatureStatus =
  | { state: "not-started" }
  | { state: "exploring" }
  | { state: "in-review"; summary: string }
  | { state: "decided"; decision: string };

/** The kinds of prototype, in the order a feature's entries are listed. */
export const ENTRY_KINDS = [
  { kind: "option", label: "Options", filter: "Options" },
  { kind: "flows", label: "Flows", filter: "Flows" },
  { kind: "print", label: "Print versions", filter: "Print" },
  { kind: "component", label: "Component prototypes", filter: "Components" },
] as const;

/**
 * What a prototype is: one of a feature's design options, its flows drawn as a page, a printable
 * version, or ways a component could work, drawn side by side.
 */
export type EntryKind = (typeof ENTRY_KINDS)[number]["kind"];

/** A route in the app, read from the address's hash. */
export type Route = `#/${string}`;

interface EntryBase {
  id: string;
  title: string;
  /** One sentence: what the prototype shows. */
  description: string;
  kind: EntryKind;
}

/** A prototype that is built and can be opened. */
export interface LiveEntry extends EntryBase {
  status: "live";
  route: Route;
  /** What the maintainer chose from it, for a prototype that compared ways of working. */
  outcome?: string;
}

/** A prototype that is agreed but not built yet. It has no route. */
export interface PlannedEntry extends EntryBase {
  status: "planned";
}

/** One prototype of a feature. */
export type PrototypeEntry = LiveEntry | PlannedEntry;

/** A clinical feature, prototyped through the stages in prototypes/<feature>/. */
export interface Feature {
  id: string;
  name: string;
  /** One sentence: what the feature is for. */
  description: string;
  status: FeatureStatus;
  /** The day its prototypes or artefacts last changed, as an ISO date. Absent before it starts. */
  updated?: string;
  /** Where its artefacts are, relative to the repository's root. */
  folder?: string;
  entries: readonly PrototypeEntry[];
}

/** The prototypes, feature by feature. */
export const FEATURES: readonly Feature[] = [
  {
    id: "patient-list",
    name: "Patient list",
    description:
      "The lists a medical unit works from: admitting, team and after-hours, from referral to discharge.",
    status: {
      state: "in-review",
      summary: "Option A, round 6: the pane beside the list is a summary and a timeline.",
    },
    updated: "2026-10-19",
    folder: "prototypes/patient-list",
    entries: [
      {
        id: "option-a",
        kind: "option",
        status: "live",
        route: "#/patient-list/a",
        title: "Option A: the list is the workspace",
        description:
          "Every list is a table, with the patient's summary beside it and the patient's own screen a click away.",
      },
      {
        id: "option-b",
        kind: "option",
        status: "planned",
        title: "Option B: round mode",
        description:
          "The ward round steps through A's lists one patient at a time, with progress through the round.",
      },
      {
        id: "option-c",
        kind: "option",
        status: "planned",
        title: "Option C: the journey board",
        description:
          "Patients as cards in lanes by where they are in the unit, for handovers and barriers to discharge.",
      },
      {
        id: "flows",
        kind: "flows",
        status: "live",
        route: "#/patient-list/flows",
        title: "Flows",
        description: "The list's lifecycle and flows, each diagram beside its steps.",
      },
      {
        id: "flows-print",
        kind: "print",
        status: "live",
        route: "#/patient-list/flows/print",
        title: "Flows, printable",
        description: "One flow on each A4 landscape sheet, for printing or saving as a PDF.",
      },
      {
        id: "pane",
        kind: "component",
        status: "live",
        route: "#/patient-list/pane",
        title: "The right pane",
        description:
          "Four ways to lay out the pane a row opens: tabs, sections, a summary and timeline, or cards.",
        outcome: "C, a summary and a timeline.",
      },
      {
        id: "grouping",
        kind: "component",
        status: "live",
        route: "#/patient-list/grouping",
        title: "Grouping a table",
        description:
          "Four ways to group the list's rows, with incoming patients as a group of their own.",
        outcome: "A, header rows in one table.",
      },
    ],
  },
  {
    id: "unit-dashboard",
    name: "Unit dashboard",
    description: "The head of unit's view of patient mix, acuity and workload.",
    status: { state: "not-started" },
    entries: [],
  },
  {
    id: "patient-journey",
    name: "Patient journey",
    description: "No brief yet.",
    status: { state: "not-started" },
    entries: [],
  },
  {
    id: "summaries",
    name: "Summaries",
    description: "No brief yet.",
    status: { state: "not-started" },
    entries: [],
  },
  {
    id: "discharge",
    name: "Discharge",
    description: "No brief yet.",
    status: { state: "not-started" },
    entries: [],
  },
];
