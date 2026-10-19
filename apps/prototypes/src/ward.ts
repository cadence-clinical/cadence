import data from "../../../prototypes/synthetic-ward/ward.json";

/** Acuity as a clinician set it: Cadence never works acuity out. */
export interface Acuity {
  level: string;
  scale: string;
  setBy: string;
  setAt: string;
}

/** One job on a patient, and who may complete it. */
export interface Job {
  id: string;
  text: string;
  assignee: string;
  createdBy: string;
  /** When it was made. */
  createdAt: string;
  status: string;
  due: string | null;
  completableBy: string[];
  completedBy?: string;
  completedAt?: string;
}

/** One observation: its code, the abbreviation and unit the ward writes, and the UCUM unit. */
export interface Observation {
  code: string;
  abbreviation: string;
  value: number | string;
  unit: string;
  unitDisplay: string;
}

/** One set of observations, taken together. */
export interface Observations {
  at: string;
  values: Observation[];
}

/** One result, with its abbreviation, its unit as written and in UCUM, and when it was taken. */
export interface Result {
  code: string;
  abbreviation: string;
  value: number;
  unit: string;
  unitDisplay: string;
  at: string;
}

/** One comment on a patient, by someone on the ward: app data, not part of the record. */
export interface PatientComment {
  id: string;
  author: string;
  role: string;
  at: string;
  text: string;
  /** When its author last changed it, in the few seconds they could. */
  editedAt?: string;
  /** Who revoked it and when. A revoked comment stays in the thread. */
  revoked?: { by: string; at: string };
  /** What drafted it, who reviewed it and what it was drawn from, for a comment an AI drafted. */
  drafted?: { drafter: string; reviewedBy: string | null; sources: string[] };
}

/** The latest clinical note: its type, author and time, and its opening line as written. */
export interface LatestNote {
  type: string;
  author: string;
  at: string;
  summary: string;
}

/**
 * Where physiotherapy (PT), social work (SW) and occupational therapy (OT) are up to, each one of
 * "not-needed", "referred", "seen" or "cleared", as the team recorded it.
 */
export interface AlliedHealth {
  pt: string;
  sw: string;
  ot: string;
}

/** A patient registered at the hospital and on no list, as a Patient search returns them. */
export interface DirectoryPatient {
  id: string;
  urn: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  birthDate: string;
  similarTo?: string[];
}

/** Where a patient is: facility, ward, room and bed. */
export interface Location {
  facility: string;
  ward: string;
  room: string;
  bed: string;
}

/** A referral as the admitting registrar recorded it, or as a referral system supplied it. */
export interface Referral {
  via: string;
  system?: string;
  source: string;
  referrer: string;
  urgency: string;
  reason: string;
  summary: string;
  plan: string | null;
  owner: string | null;
  receivedAt: string;
}

/** What the day team hands over for the night. */
export interface Overnight {
  important: boolean;
  reason?: string;
  todo?: string[];
  synopsis: string;
  progress: string;
  aiDrafted?: { drafted: boolean; sources: string[]; reviewedBy: string | null };
}

/** A deterioration signal supplied by a source system. The list shows it and never detects it. */
export interface Deterioration {
  at: string;
  source: string;
  text: string;
  note: string;
}

/** A patient moving between teams. The handover is the first of the patient's comments. */
export interface Transfer {
  from: string;
  to: string;
  clinicalSummary: string;
  sentBy: string;
  sentAt: string;
}

/** One patient in the synthetic ward, as the patient list sees them. */
export interface Patient {
  id: string;
  urn: string | null;
  firstName: string;
  lastName: string;
  age: number | null;
  gender: string;
  birthDate: string | null;
  bed: Location | null;
  admittedAt: string | null;
  team: string | null;
  listState: string;
  workingProblem: string;
  conditions: string[];
  medicines: string[];
  acuity?: Acuity;
  flags: string[];
  jobs: Job[];
  comments: PatientComment[];
  seenToday: boolean;
  latestObservations?: Observations;
  latestResults?: Result[];
  latestNote?: LatestNote;
  alliedHealth?: AlliedHealth;
  dischargeBarriers?: string[];
  similarTo?: string[];
  referral?: Referral;
  expected?: { placeholder: boolean; description: string; linked: boolean };
  overnight?: Overnight;
  deterioration?: Deterioration;
  transfer?: Transfer;
  leftHospital?: { how: string; at: string };
  /** The expected date of discharge the team set, `null` while they haven't set one. */
  expectedDischarge?: string | null;
  suggestArchive?: boolean;
}

/** A day team in the unit. */
export interface Team {
  id: string;
  name: string;
  consultant: string;
  registrar: string;
  residents: string[];
  interns: string[];
}

/** The synthetic ward the prototypes run on: prototypes/synthetic-ward/ward.json. */
export interface Ward {
  about: string;
  now: string;
  timeZone: string;
  unit: { id: string; name: string };
  teams: Team[];
  patients: Patient[];
  directory: DirectoryPatient[];
}

/** The synthetic ward. Every person, identifier, time and value in it is invented. */
export const ward: Ward = data;

/** The ward's "now": the prototypes never read the real clock. */
export const NOW = Date.parse(ward.now);

/**
 * The prototype's clock, in milliseconds: the ward's "now" when the page loaded, plus the time the
 * page has been open. It never reads the real date, so a comment posted a minute after opening the
 * prototype is stamped a minute after the ward's 08:00.
 */
export function wardClock(): number {
  return NOW + performance.now();
}

/** The prototype's clock as an ISO 8601 time, for a change made now. */
export function wardNow(): string {
  return new Date(wardClock()).toISOString();
}

const timeFormat = new Intl.DateTimeFormat("en-AU", {
  timeZone: ward.timeZone,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dateFormat = new Intl.DateTimeFormat("en-AU", {
  timeZone: ward.timeZone,
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** A time in the ward's time zone, such as "Sun 18 Oct, 14:00". */
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

/** A date of birth, such as "11 Mar 1942". */
export function formatDate(isoDate: string): string {
  return dateFormat.format(new Date(`${isoDate}T00:00:00`));
}

const dayFormat = new Intl.DateTimeFormat("en-AU", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** The ward's "today" as a date, such as "2026-10-19". */
export const TODAY = ward.now.slice(0, 10);

/** A date such as "2026-10-21" as midnight on that day, as a calendar takes it. */
export function fromIsoDate(isoDate: string): Date {
  const [year = 0, month = 1, day = 1] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** A day from a calendar as a date such as "2026-10-21". */
export function toIsoDate(day: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${String(day.getFullYear())}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/** Whole days from the ward's today to an expected discharge, negative once it has passed. */
export function dischargeDays(isoDate: string | null | undefined): number | undefined {
  if (!isoDate) return undefined;
  return Math.round((Date.parse(isoDate) - Date.parse(TODAY)) / 86_400_000);
}

/** A date such as "2026-10-21" as "Wed 21 Oct", without the comma en-AU puts after the weekday. */
export function formatDay(isoDate: string): string {
  return dayFormat
    .formatToParts(new Date(`${isoDate}T00:00:00Z`))
    .filter((part) => part.type !== "literal")
    .map((part) => part.value)
    .join(" ");
}

/**
 * An expected date of discharge in words: "Today", "Tomorrow", "Wed 21 Oct", or "Passed: Sat 17 Oct"
 * for a date the patient is still in hospital after. It says so in words, never by colour alone.
 */
export function formatDischarge(isoDate: string | null | undefined): string {
  const days = dischargeDays(isoDate);
  if (!isoDate || days === undefined) return "Not set";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  const day = formatDay(isoDate);
  return days < 0 ? `Passed: ${day}` : day;
}

/** Whole days since a time, counted from the ward's "now". */
export function daysSince(iso: string): number {
  return Math.floor((NOW - Date.parse(iso)) / 86_400_000);
}

/** A team's name from its id. */
export function teamName(id: string | null): string {
  return ward.teams.find((team) => team.id === id)?.name ?? "No team yet";
}

const clockFormat = new Intl.DateTimeFormat("en-AU", {
  timeZone: ward.timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const weekdayFormat = new Intl.DateTimeFormat("en-AU", {
  timeZone: ward.timeZone,
  weekday: "short",
});

const isoDayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: ward.timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * A time short enough for a table cell, in the ward's time zone: "06:00" on the ward's today, and
 * "Sun 22:00" before it. The detail and the thread give the full time.
 */
export function formatShortTime(iso: string): string {
  const date = new Date(iso);
  const clock = clockFormat.format(date);
  return isoDayFormat.format(date) === TODAY ? clock : `${weekdayFormat.format(date)} ${clock}`;
}

/** A value with its unit as the ward writes it: "92/min", "94%", "128/74 mmHg", "37.6 °C". */
export function withUnit(value: number | string, unit: string): string {
  return unit.startsWith("/") || unit === "%"
    ? `${String(value)}${unit}`
    : `${String(value)} ${unit}`;
}
