// Generates ward.json: a small, hand-made synthetic ward for prototyping (decision 0019's shape).
// Every person, identifier, time and value is invented. Run: node prototypes/synthetic-ward/generate.mjs
import { writeFileSync } from "node:fs";

const NOW = "2026-10-19T08:00:00+11:00";
const at = (hoursAgo) => new Date(Date.parse(NOW) - hoursAgo * 3600e3).toISOString();
const urn = (n) => `SYN-${String(100200 + n).padStart(6, "0")}`;

// Each field says where it would come from: "fhir" is a resource Oracle Health's Millennium FHIR R4
// APIs serve; "app" is data the patient list holds itself (decision 0019).
const SOURCES = {
  fhir: [
    "urn",
    "firstName",
    "lastName",
    "age",
    "gender",
    "birthDate",
    "bed",
    "admittedAt",
    "conditions",
    "latestObservations",
    "latestResults",
    "latestNote",
    "medicines",
    "leftHospital",
  ],
  app: [
    "listState",
    "team",
    "workingProblem",
    "referral",
    "acuity",
    "flags",
    "jobs",
    "comments",
    "seenToday",
    "overnight",
    "expected",
    "expectedDischarge",
    "alliedHealth",
    "dischargeBarriers",
    "history",
  ],
  supplied: ["deterioration"],
  // Notes on fields whose source needs a sentence.
  notes: {
    latestNote:
      "A DocumentReference: its type, author and date. The summary is the note's opening line as written, read from its Binary content. Nothing generates it.",
    alliedHealth:
      "A referral to physiotherapy (PT), social work (SW) or occupational therapy (OT) could be a ServiceRequest, which Oracle serves. Whether the patient has been seen, or cleared for discharge, is held by the list.",
    dischargeBarriers: "Short labels the team writes. They match the unit's flags where one fits.",
    comments: "The team's comments on a patient. A transfer's handover is its first comment.",
    directory:
      "Patients registered at the hospital and on no list, as a Patient search returns them: by identifier, or by family and given name with birthdate and gender.",
  },
};

const teams = [
  {
    id: "team-a",
    name: "GMU A",
    consultant: "Dr Priya Raman",
    registrar: "Dr Tom Ellis",
    residents: ["Dr Mei Chen"],
    interns: ["Dr Josh Ward"],
  },
  {
    id: "team-b",
    name: "GMU B",
    consultant: "Dr Helen Brooks",
    registrar: "Dr Ravi Patel",
    residents: ["Dr Sophie Lane"],
    interns: ["Dr Liam Ortiz"],
  },
  {
    id: "team-c",
    name: "GMU C",
    consultant: "Dr Samuel Okafor",
    registrar: "Dr Grace Kim",
    residents: ["Dr Ben Hollis"],
    interns: ["Dr Ava Russo"],
  },
];
const afterHours = {
  id: "after-hours",
  name: "General Medicine after hours",
  registrar: "Dr Nadia Haddad",
  resident: "Dr Owen Price",
};
const nurses = [
  "RN Kate Morgan (nurse unit manager)",
  "RN Daniel Reyes (clinical nurse)",
  "RN Aisha Malik",
];

const flagsDefined = {
  unit: [
    "For discharge",
    "Isolation",
    "Falls precautions",
    "Awaiting placement",
    "Review overnight",
  ],
  "team-a": ["Family meeting"],
  "team-b": ["Awaiting imaging"],
  "team-c": ["Procedure today"],
};

// Acuity is set by a clinician. The scale here is a placeholder until the maintainer names one.
const acuity = (level, by, hoursAgo) => ({
  level,
  scale: "placeholder: high, medium, low",
  setBy: by,
  setAt: at(hoursAgo),
});
// A job says when it was made, so a patient's timeline can show it: `createdHoursAgo`, 12 by default.
const job = (id, text, assignee, { createdHoursAgo = 12, ...fields } = {}) => ({
  id: `job-${id}`,
  text,
  assignee,
  createdBy: fields.createdBy ?? "Dr Josh Ward",
  createdAt: at(createdHoursAgo),
  status: fields.status ?? "open",
  due: fields.due ?? null,
  completableBy: fields.completableBy ?? ["doctor"],
  ...fields,
});
const obs = (rr, hr, sbp, dbp, spo2, temp, hoursAgo) => ({
  at: at(hoursAgo),
  values: [
    // The abbreviation and the unit as the ward writes them, beside the UCUM unit.
    { code: "respiratory rate", abbreviation: "RR", value: rr, unit: "/min", unitDisplay: "/min" },
    { code: "heart rate", abbreviation: "HR", value: hr, unit: "/min", unitDisplay: "/min" },
    {
      code: "blood pressure",
      abbreviation: "BP",
      value: `${sbp}/${dbp}`,
      unit: "mm[Hg]",
      unitDisplay: "mmHg",
    },
    { code: "oxygen saturation", abbreviation: "SpO₂", value: spo2, unit: "%", unitDisplay: "%" },
    { code: "body temperature", abbreviation: "T", value: temp, unit: "Cel", unitDisplay: "°C" },
  ],
});

// A result as the laboratory system gives it, with the abbreviation and unit the ward writes.
const RESULT_NAMES = {
  potassium: { abbreviation: "K", unitDisplay: "mmol/L", unit: "mmol/L" },
  sodium: { abbreviation: "Na", unitDisplay: "mmol/L", unit: "mmol/L" },
  creatinine: { abbreviation: "Cr", unitDisplay: "µmol/L", unit: "umol/L" },
  haemoglobin: { abbreviation: "Hb", unitDisplay: "g/L", unit: "g/L" },
};
const result = (code, value, hoursAgo) => ({
  code,
  ...RESULT_NAMES[code],
  value,
  at: at(hoursAgo),
});

// A comment on a patient, by someone in the ward, hours before NOW (app data, decision 0019).
let commentCount = 0;
const comment = (author, role, hoursAgo, text) => {
  commentCount += 1;
  return {
    id: `comment-${String(commentCount).padStart(2, "0")}`,
    author,
    role,
    at: at(hoursAgo),
    text,
  };
};

let n = 0;
// Ages are worked out from the birth date and NOW, so the two can never disagree.
const ageOn = (birthDate) => {
  const b = new Date(`${birthDate}T00:00:00+11:00`),
    now = new Date(NOW);
  let age = now.getFullYear() - b.getFullYear();
  if (
    now.getMonth() < b.getMonth() ||
    (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())
  )
    age -= 1;
  return age;
};
const P = (fields) => {
  n += 1;
  if (fields.birthDate) fields = { ...fields, age: ageOn(fields.birthDate) };
  return {
    id: `patient-${String(n).padStart(2, "0")}`,
    urn: urn(n),
    listState: "on-team",
    seenToday: false,
    flags: [],
    jobs: [],
    comments: [],
    history: [],
    ...fields,
  };
};

const beds = (room, bed) => ({
  facility: "Synthetic General Hospital",
  ward: "4 North",
  room: String(room),
  bed,
});

const patients = [
  // Team A
  P({
    firstName: "Margaret",
    lastName: "Holloway",
    age: 84,
    gender: "female",
    birthDate: "1942-03-11",
    bed: beds(401, "A"),
    admittedAt: at(96),
    team: "team-a",
    workingProblem: "Community-acquired pneumonia",
    conditions: ["Pneumonia", "Atrial fibrillation"],
    acuity: acuity("medium", "Dr Tom Ellis", 20),
    flags: ["Falls precautions"],
    jobs: [
      job(1, "Chase sputum culture", "Dr Josh Ward", { createdHoursAgo: 20 }),
      job(2, "Repeat chest X-ray tomorrow", "team-a", { createdHoursAgo: 6, due: at(-24) }),
    ],
    latestObservations: obs(20, 92, 128, 74, 94, 37.6, 2),
    medicines: ["ceftriaxone", "apixaban"],
  }),
  P({
    firstName: "Chris",
    lastName: "Taylor",
    age: 67,
    gender: "male",
    birthDate: "1959-08-02",
    bed: beds(401, "B"),
    admittedAt: at(50),
    team: "team-a",
    workingProblem: "Cellulitis, left leg",
    conditions: ["Cellulitis", "Type 2 diabetes"],
    acuity: acuity("low", "Dr Tom Ellis", 26),
    similarTo: ["patient-03"],
    jobs: [
      job(3, "Mark cellulitis margin and photograph", "RN Aisha Malik", {
        createdHoursAgo: 26,
        completableBy: ["doctor", "nurse"],
        createdBy: "Dr Mei Chen",
      }),
    ],
    latestObservations: obs(16, 78, 136, 82, 98, 37.1, 3),
    medicines: ["cefazolin", "metformin"],
  }),
  P({
    firstName: "Kris",
    lastName: "Taylor",
    age: 71,
    gender: "female",
    birthDate: "1955-01-19",
    bed: beds(402, "A"),
    admittedAt: at(30),
    team: "team-a",
    workingProblem: "Delirium, cause under investigation",
    conditions: ["Delirium", "Dementia"],
    acuity: acuity("high", "Dr Priya Raman", 6),
    similarTo: ["patient-02"],
    flags: ["Falls precautions", "Family meeting"],
    jobs: [
      job(4, "Collateral history from daughter", "Dr Mei Chen", { createdHoursAgo: 18 }),
      job(5, "Urine microscopy and culture", "Dr Josh Ward", {
        createdHoursAgo: 10,
        status: "done",
        completedBy: "Dr Josh Ward",
        completedAt: at(4),
      }),
    ],
    latestObservations: obs(18, 88, 142, 80, 96, 37.4, 1),
    medicines: ["quetiapine"],
  }),
  P({
    firstName: "Ahmed",
    lastName: "Karimi",
    age: 58,
    gender: "male",
    birthDate: "1968-05-27",
    bed: beds(402, "B"),
    admittedAt: at(140),
    team: "team-a",
    workingProblem: "Heart failure, decompensated",
    conditions: ["Heart failure", "Chronic kidney disease"],
    acuity: acuity("medium", "Dr Tom Ellis", 30),
    flags: ["For discharge"],
    jobs: [
      job(6, "Discharge medication reconciliation", "Dr Mei Chen", { createdHoursAgo: 8 }),
      job(7, "Book heart failure clinic", "team-a", { createdHoursAgo: 8 }),
    ],
    latestObservations: obs(16, 74, 118, 70, 97, 36.8, 4),
    latestResults: [result("potassium", 5.4, 10), result("creatinine", 168, 10)],
    medicines: ["furosemide", "spironolactone"],
  }),
  P({
    firstName: "Lena",
    lastName: "Fischer",
    age: 45,
    gender: "female",
    birthDate: "1981-09-14",
    bed: beds(403, "A"),
    admittedAt: at(22),
    team: "team-a",
    workingProblem: "Pyelonephritis",
    conditions: ["Pyelonephritis"],
    acuity: acuity("low", "Dr Mei Chen", 18),
    latestObservations: obs(14, 84, 122, 76, 99, 37.9, 2),
    medicines: ["gentamicin"],
  }),
  P({
    firstName: "Robert",
    lastName: "Achterberg",
    age: 79,
    gender: "male",
    birthDate: "1947-12-03",
    bed: beds(403, "B"),
    admittedAt: at(200),
    team: "team-a",
    workingProblem: "Fall with reduced mobility",
    conditions: ["Fall", "Parkinson disease"],
    acuity: acuity("low", "Dr Tom Ellis", 48),
    flags: ["Awaiting placement", "Falls precautions"],
    jobs: [job(8, "Aged care assessment follow-up", "team-a", { createdHoursAgo: 30 })],
    latestObservations: obs(16, 70, 130, 72, 96, 36.6, 5),
    medicines: ["levodopa with carbidopa"],
  }),
  P({
    firstName: "Tui",
    lastName: "Ngata",
    age: 62,
    gender: "female",
    birthDate: "1964-06-21",
    bed: beds(404, "A"),
    admittedAt: at(12),
    team: "team-a",
    workingProblem: "Chest pain, cause under investigation",
    conditions: ["Chest pain"],
    acuity: acuity("medium", "Dr Tom Ellis", 11),
    jobs: [job(9, "Repeat troponin at 0900", "Dr Josh Ward", { createdHoursAgo: 7, due: at(-1) })],
    latestObservations: obs(16, 80, 140, 86, 98, 36.9, 1),
    medicines: ["aspirin"],
  }),
  // Team B
  P({
    firstName: "Graham",
    lastName: "Whitlock",
    age: 73,
    gender: "male",
    birthDate: "1953-02-08",
    bed: beds(405, "A"),
    admittedAt: at(70),
    team: "team-b",
    workingProblem: "Exacerbation of COPD",
    conditions: ["COPD"],
    acuity: acuity("high", "Dr Ravi Patel", 3),
    flags: ["Review overnight"],
    jobs: [job(10, "Blood gas if drowsier", "after-hours", { createdHoursAgo: 3 })],
    latestObservations: obs(26, 104, 150, 88, 89, 37.8, 1),
    medicines: ["prednisolone", "salbutamol"],
    overnight: {
      important: true,
      reason: "Increasing oxygen requirement over the afternoon",
      todo: ["Blood gas if drowsier", "Review at 2200"],
      synopsis: "COPD exacerbation, day 3, on oxygen. Oxygen requirement rose this afternoon.",
      progress: "Steroids and nebulisers continued. Chest X-ray unchanged.",
      aiDrafted: {
        drafted: true,
        sources: [
          "Progress note 18 Oct 1600",
          "Observations 18 Oct 1400 to 1800",
          "Chest X-ray report 18 Oct",
        ],
        reviewedBy: null,
      },
    },
  }),
  P({
    firstName: "Mary",
    lastName: "Oduya",
    age: 88,
    gender: "female",
    birthDate: "1938-07-30",
    bed: beds(405, "B"),
    admittedAt: at(110),
    team: "team-b",
    workingProblem: "Urinary tract infection with delirium",
    conditions: ["Urinary tract infection", "Delirium"],
    acuity: acuity("medium", "Dr Ravi Patel", 28),
    flags: ["Falls precautions"],
    latestObservations: obs(18, 82, 124, 70, 95, 37.2, 3),
    medicines: ["amoxicillin with clavulanic acid"],
  }),
  P({
    firstName: "Jake",
    lastName: "Bromley",
    age: 34,
    gender: "male",
    birthDate: "1992-04-16",
    bed: beds(406, "A"),
    admittedAt: at(18),
    team: "team-b",
    workingProblem: "Diabetic ketoacidosis, resolving",
    conditions: ["Type 1 diabetes"],
    acuity: acuity("medium", "Dr Ravi Patel", 9),
    jobs: [
      job(11, "Diabetes educator review", "team-b", {
        createdHoursAgo: 12,
        completableBy: ["doctor", "nurse"],
      }),
    ],
    latestObservations: obs(16, 90, 118, 74, 99, 36.7, 2),
    latestResults: [result("potassium", 3.4, 5)],
    medicines: ["insulin glargine"],
  }),
  P({
    firstName: "Evelyn",
    lastName: "Marsh",
    age: 76,
    gender: "female",
    birthDate: "1950-10-05",
    bed: beds(406, "B"),
    admittedAt: at(160),
    team: "team-b",
    workingProblem: "Stroke rehabilitation planning",
    conditions: ["Stroke"],
    acuity: acuity("low", "Dr Sophie Lane", 50),
    flags: ["Awaiting placement"],
    latestObservations: obs(16, 72, 134, 78, 97, 36.5, 6),
    medicines: ["clopidogrel", "atorvastatin"],
  }),
  P({
    firstName: "Daniel",
    lastName: "Ferreira",
    age: 52,
    gender: "male",
    birthDate: "1974-11-23",
    bed: beds(407, "A"),
    admittedAt: at(40),
    team: "team-b",
    workingProblem: "Gastrointestinal bleed",
    conditions: ["Upper gastrointestinal bleed"],
    acuity: acuity("high", "Dr Helen Brooks", 8),
    flags: ["Awaiting imaging"],
    jobs: [
      job(12, "Check haemoglobin at 1400", "Dr Liam Ortiz", { createdHoursAgo: 9, due: at(-6) }),
    ],
    latestObservations: obs(18, 98, 112, 66, 97, 36.8, 1),
    latestResults: [result("haemoglobin", 92, 6)],
    medicines: ["pantoprazole"],
  }),
  P({
    firstName: "Ivy",
    lastName: "Chandler",
    age: 66,
    gender: "female",
    birthDate: "1960-01-12",
    bed: beds(407, "B"),
    admittedAt: at(28),
    team: "team-b",
    workingProblem: "Hyponatraemia",
    conditions: ["Hyponatraemia"],
    acuity: acuity("medium", "Dr Ravi Patel", 14),
    latestResults: [result("sodium", 124, 7)],
    latestObservations: obs(14, 76, 128, 74, 98, 36.6, 4),
    medicines: [],
  }),
  P({
    firstName: "Patrick",
    lastName: "O'Shea",
    age: 81,
    gender: "male",
    birthDate: "1945-05-04",
    bed: beds(408, "A"),
    admittedAt: at(90),
    team: "team-b",
    workingProblem: "Aspiration pneumonia",
    conditions: ["Aspiration pneumonia", "Dementia"],
    acuity: acuity("medium", "Dr Ravi Patel", 22),
    latestObservations: obs(20, 86, 120, 70, 95, 37.3, 2),
    medicines: ["piperacillin with tazobactam"],
  }),
  // Team C
  P({
    firstName: "Sofia",
    lastName: "Marino",
    age: 59,
    gender: "female",
    birthDate: "1967-03-29",
    bed: beds(408, "B"),
    admittedAt: at(60),
    team: "team-c",
    workingProblem: "Pulmonary embolism",
    conditions: ["Pulmonary embolism"],
    acuity: acuity("medium", "Dr Grace Kim", 24),
    flags: ["Procedure today"],
    latestObservations: obs(18, 94, 126, 80, 95, 36.9, 2),
    medicines: ["enoxaparin"],
  }),
  P({
    firstName: "Wei",
    lastName: "Zhang",
    age: 70,
    gender: "male",
    birthDate: "1956-08-17",
    bed: beds(409, "A"),
    admittedAt: at(36),
    team: "team-c",
    workingProblem: "Acute kidney injury",
    conditions: ["Acute kidney injury"],
    acuity: acuity("medium", "Dr Grace Kim", 12),
    jobs: [job(13, "Renal ultrasound result", "Dr Ben Hollis", { createdHoursAgo: 20 })],
    latestResults: [result("creatinine", 245, 9), result("potassium", 5.8, 9)],
    latestObservations: obs(16, 82, 146, 88, 97, 36.7, 3),
    medicines: [],
  }),
  P({
    firstName: "Hannah",
    lastName: "Lindqvist",
    age: 41,
    gender: "female",
    birthDate: "1985-12-01",
    bed: beds(409, "B"),
    admittedAt: at(16),
    team: "team-c",
    workingProblem: "Asthma exacerbation",
    conditions: ["Asthma"],
    acuity: acuity("low", "Dr Ben Hollis", 15),
    latestObservations: obs(18, 96, 120, 74, 97, 36.8, 2),
    medicines: ["prednisolone", "budesonide with formoterol"],
  }),
  P({
    firstName: "George",
    lastName: "Papadakis",
    age: 85,
    gender: "male",
    birthDate: "1941-04-09",
    bed: beds(410, "A"),
    admittedAt: at(130),
    team: "team-c",
    workingProblem: "Frailty and recurrent falls",
    conditions: ["Frailty"],
    acuity: acuity("low", "Dr Grace Kim", 40),
    flags: ["Falls precautions"],
    latestObservations: obs(16, 68, 108, 64, 96, 36.4, 1),
    medicines: [],
    overnight: {
      important: false,
      synopsis: "Frailty and recurrent falls, awaiting a physiotherapy plan.",
      progress: "Stable today.",
    },
    deterioration: {
      at: at(-14),
      source: "Early warning system at the hospital (a synthetic source)",
      text: "Observations outside this patient's set limits at 2200: the early warning system raised a review.",
      note: "Supplied by a source system. The list shows it; it does not detect deterioration.",
    },
  }),
  P({
    firstName: "Amira",
    lastName: "Saleh",
    age: 29,
    gender: "female",
    birthDate: "1997-09-08",
    bed: beds(410, "B"),
    admittedAt: at(20),
    team: "team-c",
    workingProblem: "Pyrexia, cause under investigation",
    conditions: ["Fever"],
    acuity: acuity("medium", "Dr Grace Kim", 10),
    flags: ["Isolation"],
    jobs: [
      job(14, "Blood cultures before next antibiotic dose", "Dr Ava Russo", {
        createdHoursAgo: 4,
        due: at(-2),
      }),
    ],
    latestObservations: obs(20, 108, 110, 68, 97, 38.6, 1),
    medicines: [],
  }),
  P({
    firstName: "Brian",
    lastName: "Kowalczyk",
    age: 64,
    gender: "male",
    birthDate: "1962-02-25",
    bed: beds(411, "A"),
    admittedAt: at(80),
    team: "team-c",
    workingProblem: "Cirrhosis with ascites",
    conditions: ["Cirrhosis"],
    acuity: acuity("medium", "Dr Samuel Okafor", 30),
    flags: ["Procedure today"],
    jobs: [
      job(15, "Ascitic tap this morning", "Dr Grace Kim", { createdHoursAgo: 14, due: at(-3) }),
    ],
    latestObservations: obs(16, 86, 104, 62, 97, 36.6, 2),
    medicines: ["spironolactone"],
    overnight: {
      important: true,
      reason: "Post-procedure check",
      todo: ["Check the tap site at 2100"],
      synopsis: "Cirrhosis with ascites. Therapeutic tap today.",
      progress: "Tap planned this morning.",
      aiDrafted: {
        drafted: true,
        sources: ["Progress note 18 Oct 1100", "Procedure plan 18 Oct"],
        reviewedBy: "Dr Grace Kim",
      },
    },
  }),
  // Admitting list
  P({
    firstName: "Noah",
    lastName: "Bennett",
    age: 55,
    gender: "male",
    birthDate: "1971-06-30",
    bed: { facility: "Synthetic General Hospital", ward: "Emergency", room: "Cubicle", bed: "12" },
    admittedAt: null,
    team: null,
    listState: "received",
    workingProblem: "Syncope",
    referral: {
      via: "phone",
      source: "Emergency department",
      referrer: "Dr Imogen Hart (emergency registrar)",
      urgency: "Within 2 hours",
      reason: "Syncope with a new murmur",
      summary:
        "Collapsed at home, brief loss of consciousness, no injury. New murmur on examination.",
      plan: "Echocardiogram, telemetry, repeat electrocardiogram",
      owner: "Dr Tom Ellis",
      receivedAt: at(1),
    },
    conditions: [],
    medicines: [],
  }),
  P({
    firstName: "Olivia",
    lastName: "Grant",
    age: 77,
    gender: "female",
    birthDate: "1949-11-18",
    bed: { facility: "Synthetic General Hospital", ward: "Emergency", room: "Cubicle", bed: "4" },
    admittedAt: null,
    team: null,
    listState: "received",
    workingProblem: "Weakness and reduced intake",
    referral: {
      via: "referral system",
      system: "Synthetic referral system",
      source: "General practitioner",
      referrer: "Dr Lucas Byrne (general practitioner)",
      urgency: "Today",
      reason: "Weakness and reduced oral intake over a week",
      summary: "Lives alone, family concerned. Basic details imported from the referral system.",
      plan: null,
      owner: null,
      receivedAt: at(0.5),
    },
    conditions: [],
    medicines: [],
  }),
  P({
    firstName: "Unknown",
    lastName: "Expected patient",
    age: null,
    gender: "male",
    birthDate: null,
    urn: null,
    bed: null,
    admittedAt: null,
    team: null,
    listState: "received",
    expected: {
      placeholder: true,
      description: "60M referred by HITH for APO",
      linked: false,
    },
    workingProblem: "Acute pulmonary oedema",
    referral: {
      via: "phone",
      source: "Hospital in the Home (HITH)",
      referrer: "HITH nurse (synthetic)",
      urgency: "On arrival",
      reason: "Acute pulmonary oedema, known heart failure",
      summary: "Placeholder until the patient is registered and has an encounter.",
      plan: "Review on arrival",
      owner: "Dr Tom Ellis",
      receivedAt: at(0.3),
    },
    conditions: [],
    medicines: [],
  }),
  // An incoming transfer, a patient who has left hospital with an open job, and one ready to archive
  P({
    firstName: "Carmen",
    lastName: "Delgado",
    age: 69,
    gender: "female",
    birthDate: "1957-07-07",
    bed: beds(411, "B"),
    admittedAt: at(60),
    team: "team-a",
    listState: "incoming",
    transfer: {
      from: "team-c",
      to: "team-a",
      clinicalSummary: "Admitted with dyspnoea, found to have new atrial fibrillation.",
      sentBy: "Dr Grace Kim",
      sentAt: at(2),
    },
    workingProblem: "New atrial fibrillation",
    conditions: ["Atrial fibrillation"],
    acuity: acuity("medium", "Dr Grace Kim", 12),
    latestObservations: obs(18, 112, 124, 78, 96, 36.8, 1),
    medicines: ["metoprolol"],
  }),
  P({
    firstName: "Stanley",
    lastName: "Ruiz",
    age: 74,
    gender: "male",
    birthDate: "1952-03-15",
    bed: null,
    admittedAt: at(170),
    team: "team-b",
    listState: "left-hospital",
    leftHospital: { how: "discharged", at: at(14) },
    workingProblem: "Pneumonia, recovered",
    conditions: ["Pneumonia"],
    jobs: [
      job(16, "Send discharge summary to general practitioner", "Dr Sophie Lane", {
        createdHoursAgo: 30,
      }),
    ],
    medicines: [],
  }),
  P({
    firstName: "Ruth",
    lastName: "Abernathy",
    age: 90,
    gender: "female",
    birthDate: "1936-08-22",
    bed: null,
    admittedAt: at(220),
    team: "team-c",
    listState: "left-hospital",
    leftHospital: { how: "transferred out", at: at(20) },
    workingProblem: "Transferred to a rehabilitation hospital",
    conditions: [],
    jobs: [
      job(17, "Handover to rehabilitation team", "Dr Ben Hollis", {
        createdHoursAgo: 40,
        status: "done",
        completedBy: "Dr Ben Hollis",
        completedAt: at(18),
      }),
    ],
    suggestArchive: true,
    medicines: [],
  }),
];

// Expected dates of discharge, in days from NOW, as the team set them (app data, decision 0019).
// null is a patient without one yet, and a negative number is a date that has passed.
const edd = {
  "patient-01": 2,
  "patient-02": 1,
  "patient-03": 4,
  "patient-04": 0,
  "patient-05": 1,
  "patient-06": -2,
  "patient-07": 0,
  "patient-08": 3,
  "patient-09": 2,
  "patient-10": 1,
  "patient-11": null,
  "patient-12": 2,
  "patient-13": 3,
  "patient-14": 4,
  "patient-15": 2,
  "patient-16": 3,
  "patient-17": 1,
  "patient-18": 5,
  "patient-19": 3,
  "patient-20": 2,
  "patient-24": 3,
};
for (const patient of patients) {
  if (!(patient.id in edd)) continue;
  const days = edd[patient.id];
  patient.expectedDischarge =
    days === null
      ? null
      : new Date(Date.parse(`${NOW.slice(0, 10)}T00:00:00Z`) + days * 86_400_000)
          .toISOString()
          .slice(0, 10);
}

// Allied health staff on the ward. Invented, like everyone else.
const alliedHealthStaff = [
  { name: "Sam Okoro", role: "Physiotherapist" },
  { name: "Leah Brandt", role: "Social worker" },
  { name: "Nina Petrov", role: "Occupational therapist" },
];

const note = (type, author, hoursAgo, summary) => ({ type, author, at: at(hoursAgo), summary });
// PT, SW and OT: "not-needed", "referred" (waiting), "seen" (with follow-up), "cleared" (for discharge).
const ah = (pt, sw, ot) => ({ pt, sw, ot });
const NONE = ah("not-needed", "not-needed", "not-needed");

// What the review needs for each patient on a team: the latest note, allied health, discharge
// barriers, the team's comments (newest last), and results where the ward has them.
const round3 = {
  "patient-01": {
    latestNote: note(
      "Ward round note",
      "Dr Mei Chen",
      23,
      "Improving on IV antibiotics. Plan to switch to oral tomorrow.",
    ),
    alliedHealth: ah("seen", "not-needed", "referred"),
    dischargeBarriers: ["Home assessment"],
    latestResults: [result("haemoglobin", 118, 11), result("creatinine", 74, 11)],
    comments: [
      comment(
        "Sam Okoro",
        "Physiotherapist",
        20,
        "Walked 20 m with a frame. Will review tomorrow.",
      ),
      comment(
        "RN Kate Morgan",
        "Nurse unit manager",
        3,
        "Daughter visiting at 1100, keen to talk about going home.",
      ),
    ],
  },
  "patient-02": {
    latestNote: note(
      "Progress note",
      "Dr Josh Ward",
      21,
      "Cellulitis margin receding. Continue IV cefazolin.",
    ),
    alliedHealth: NONE,
    dischargeBarriers: [],
    comments: [
      comment(
        "Dr Mei Chen",
        "Resident, GMU A",
        19,
        "Check the URN before giving anything: Kris Taylor is in 402 A.",
      ),
    ],
  },
  "patient-03": {
    latestNote: note(
      "Ward round note",
      "Dr Priya Raman",
      22,
      "Remains delirious overnight. Collateral history still needed.",
    ),
    alliedHealth: ah("referred", "referred", "referred"),
    dischargeBarriers: ["Family meeting", "Cognitive assessment"],
    latestResults: [result("sodium", 136, 9)],
    comments: [
      comment(
        "Dr Priya Raman",
        "Consultant, GMU A",
        22,
        "Please organise a family meeting for Thursday.",
      ),
      comment(
        "Leah Brandt",
        "Social worker",
        6,
        "Daughter called back. She can come in on Thursday afternoon.",
      ),
    ],
  },
  "patient-04": {
    latestNote: note(
      "Discharge planning note",
      "Dr Mei Chen",
      5,
      "Euvolaemic. Discharge today once medicines are reconciled.",
    ),
    alliedHealth: ah("cleared", "not-needed", "cleared"),
    dischargeBarriers: ["Clinic booking"],
    comments: [
      comment(
        "Nina Petrov",
        "Occupational therapist",
        26,
        "Cleared for discharge. Shower chair delivered.",
      ),
      comment(
        "Dr Tom Ellis",
        "Registrar, GMU A",
        4,
        "Pharmacy have the discharge medicines. Aim for a 1400 discharge.",
      ),
      comment("RN Daniel Reyes", "Clinical nurse", 1, "Wife picking him up after lunch."),
    ],
  },
  "patient-05": {
    latestNote: note(
      "Admission note",
      "Dr Tom Ellis",
      22,
      "Pyelonephritis. IV gentamicin, levels with tomorrow's bloods.",
    ),
    alliedHealth: NONE,
    dischargeBarriers: [],
    latestResults: [result("creatinine", 82, 8), result("potassium", 4.1, 8)],
    comments: [],
  },
  "patient-06": {
    latestNote: note(
      "Discharge planning note",
      "Dr Josh Ward",
      30,
      "Medically ready. Waiting for a residential aged care bed.",
    ),
    alliedHealth: ah("seen", "seen", "cleared"),
    dischargeBarriers: ["Awaiting placement", "Aged care assessment"],
    comments: [
      comment(
        "Leah Brandt",
        "Social worker",
        28,
        "Two facilities have offered a bed. Family visiting both this week.",
      ),
      comment(
        "Sam Okoro",
        "Physiotherapist",
        7,
        "Transfers with one person. No change to the plan.",
      ),
    ],
  },
  "patient-07": {
    latestNote: note(
      "Admission note",
      "Dr Tom Ellis",
      11,
      "Chest pain settled. Serial troponins and an ECG this morning.",
    ),
    alliedHealth: NONE,
    dischargeBarriers: ["Awaiting results"],
    comments: [comment("Dr Josh Ward", "Intern, GMU A", 2, "Second troponin sent at 0700.")],
  },
  "patient-08": {
    latestNote: note(
      "Progress note",
      "Dr Ravi Patel",
      16,
      "Oxygen requirement rose this afternoon. Chest X-ray unchanged.",
    ),
    alliedHealth: ah("referred", "not-needed", "not-needed"),
    dischargeBarriers: ["Needs home oxygen"],
    comments: [
      comment(
        "Dr Ravi Patel",
        "Registrar, GMU B",
        15,
        "Important overnight: review at 2200, blood gas if drowsier.",
      ),
      comment(
        "Dr Owen Price",
        "Resident, after hours",
        9,
        "Reviewed at 2200. Comfortable, no gas needed.",
      ),
    ],
  },
  "patient-09": {
    latestNote: note(
      "Ward round note",
      "Dr Sophie Lane",
      24,
      "Less confused today. Eating and drinking well.",
    ),
    alliedHealth: ah("seen", "referred", "seen"),
    dischargeBarriers: ["Community services"],
    comments: [
      comment(
        "Leah Brandt",
        "Social worker",
        23,
        "Referral to community services sent. Waiting on a start date.",
      ),
    ],
  },
  "patient-10": {
    latestNote: note(
      "Progress note",
      "Dr Liam Ortiz",
      6,
      "Ketoacidosis resolved. Back on subcutaneous insulin.",
    ),
    alliedHealth: NONE,
    dischargeBarriers: ["Diabetes education"],
    comments: [],
  },
  "patient-11": {
    latestNote: note(
      "Discharge planning note",
      "Dr Sophie Lane",
      40,
      "Rehabilitation goals met on the ward. Waiting for a bed.",
    ),
    alliedHealth: ah("seen", "seen", "seen"),
    dischargeBarriers: ["Awaiting placement"],
    comments: [
      comment(
        "RN Kate Morgan",
        "Nurse unit manager",
        30,
        "Rehabilitation hospital may have a bed on Wednesday.",
      ),
    ],
  },
  "patient-12": {
    latestNote: note(
      "Progress note",
      "Dr Helen Brooks",
      8,
      "No further bleeding. Endoscopy booked for today.",
    ),
    alliedHealth: NONE,
    dischargeBarriers: ["Awaiting imaging"],
    comments: [
      comment("Dr Liam Ortiz", "Intern, GMU B", 7, "Fasting from midnight for endoscopy."),
      comment("RN Aisha Malik", "Nurse", 2, "Endoscopy want him at 1000."),
    ],
  },
  "patient-13": {
    latestNote: note(
      "Progress note",
      "Dr Ravi Patel",
      7,
      "Fluid restriction continued. Repeat sodium this afternoon.",
    ),
    alliedHealth: NONE,
    dischargeBarriers: [],
    comments: [],
  },
  "patient-14": {
    latestNote: note(
      "Ward round note",
      "Dr Ravi Patel",
      22,
      "Improving. Speech pathology have modified his diet.",
    ),
    alliedHealth: ah("seen", "referred", "not-needed"),
    dischargeBarriers: ["Family meeting"],
    comments: [
      comment(
        "Dr Helen Brooks",
        "Consultant, GMU B",
        21,
        "Goals of care conversation with his son tomorrow.",
      ),
    ],
  },
  "patient-15": {
    latestNote: note(
      "Progress note",
      "Dr Ben Hollis",
      20,
      "Stable on enoxaparin. Planned for discharge in two days.",
    ),
    alliedHealth: ah("cleared", "not-needed", "not-needed"),
    dischargeBarriers: [],
    comments: [
      comment(
        "Sam Okoro",
        "Physiotherapist",
        19,
        "Cleared for discharge from a mobility point of view.",
      ),
    ],
  },
  "patient-16": {
    latestNote: note(
      "Progress note",
      "Dr Grace Kim",
      9,
      "Creatinine still rising. Renal ultrasound requested.",
    ),
    alliedHealth: NONE,
    dischargeBarriers: ["Awaiting results"],
    comments: [comment("Dr Ben Hollis", "Resident, GMU C", 8, "Ultrasound booked for 1100.")],
  },
  "patient-17": {
    latestNote: note(
      "Admission note",
      "Dr Ben Hollis",
      15,
      "Asthma exacerbation, improving on prednisolone.",
    ),
    alliedHealth: NONE,
    dischargeBarriers: [],
    comments: [],
  },
  "patient-18": {
    latestNote: note(
      "Physiotherapy note",
      "Sam Okoro",
      26,
      "Assessed. Plan to follow once the falls review is done.",
    ),
    alliedHealth: ah("referred", "seen", "referred"),
    dischargeBarriers: ["Physiotherapy plan", "Home assessment"],
    comments: [
      comment(
        "Dr Grace Kim",
        "Registrar, GMU C",
        25,
        "Waiting on the physiotherapy plan before talking about discharge.",
      ),
      comment("Nina Petrov", "Occupational therapist", 4, "Home visit pencilled in for Wednesday."),
    ],
  },
  "patient-19": {
    latestNote: note(
      "Progress note",
      "Dr Ava Russo",
      10,
      "Febrile overnight. Blood cultures before the next dose.",
    ),
    alliedHealth: NONE,
    dischargeBarriers: ["Awaiting results"],
    comments: [comment("RN Aisha Malik", "Nurse", 5, "In isolation room 410 B. Gown and gloves.")],
  },
  "patient-20": {
    latestNote: note("Procedure plan", "Dr Grace Kim", 24, "Therapeutic ascitic tap this morning."),
    alliedHealth: ah("not-needed", "seen", "not-needed"),
    dischargeBarriers: [],
    comments: [
      comment("Dr Grace Kim", "Registrar, GMU C", 3, "Tap at 0900 in the procedure room."),
    ],
  },
  // The incoming transfer: its handover is the first comment, from the team sending the patient.
  "patient-24": {
    latestNote: note(
      "Progress note",
      "Dr Ben Hollis",
      14,
      "New atrial fibrillation, rate controlled overnight.",
    ),
    alliedHealth: NONE,
    dischargeBarriers: [],
    comments: [
      comment(
        "Dr Grace Kim",
        "Registrar, GMU C",
        2,
        "Cardiac issues now lead: transferring to Team A for ongoing management.",
      ),
    ],
  },
};
for (const patient of patients) {
  const extra = round3[patient.id];
  if (!extra) continue;
  Object.assign(patient, extra);
  // Where the round adds results to a patient who had none, they are the latest results.
  if (extra.latestResults) patient.latestResults = extra.latestResults;
}

// Registered at the hospital and on no list: who "Add patient" finds (a Patient search, decision
// 0019). Two pairs of similar names, marked `similarTo`, show the similar-patient marking.
let d = 0;
const R = (fields) => {
  d += 1;
  return {
    id: `directory-${String(d).padStart(2, "0")}`,
    urn: `SYN-${String(200300 + d).padStart(6, "0")}`,
    age: ageOn(fields.birthDate),
    ...fields,
  };
};
const directory = [
  R({
    firstName: "Lena",
    lastName: "Fisher",
    gender: "female",
    birthDate: "1979-02-11",
    similarTo: ["directory-02", "patient-05"],
  }),
  R({
    firstName: "Lina",
    lastName: "Fischer",
    gender: "female",
    birthDate: "1992-06-03",
    similarTo: ["directory-01", "patient-05"],
  }),
  R({ firstName: "Peter", lastName: "Osei", gender: "male", birthDate: "1950-09-12" }),
  R({ firstName: "Joan", lastName: "McAllister", gender: "female", birthDate: "1944-12-30" }),
  R({ firstName: "Arjun", lastName: "Mehta", gender: "male", birthDate: "1988-03-17" }),
  R({
    firstName: "Rosa",
    lastName: "Delgado",
    gender: "female",
    birthDate: "1960-07-07",
    similarTo: ["patient-24"],
  }),
  R({
    firstName: "Thomas",
    lastName: "Brennan",
    gender: "male",
    birthDate: "1971-11-02",
    similarTo: ["directory-10"],
  }),
  R({ firstName: "Mei Lin", lastName: "Wong", gender: "female", birthDate: "1983-05-25" }),
  R({ firstName: "Harold", lastName: "Finch", gender: "male", birthDate: "1939-01-08" }),
  R({
    firstName: "Tomas",
    lastName: "Brennan",
    gender: "male",
    birthDate: "1974-04-21",
    similarTo: ["directory-07"],
  }),
];

const auditLists = [
  {
    id: "audit-1",
    name: "Potassium above my chosen limit, last 24 hours",
    owner: "Dr Helen Brooks",
    sharing: "view-only",
    criteria: [
      {
        field: "latest result: potassium",
        operator: "above",
        value: "chosen by the list owner",
        window: "24 hours",
      },
    ],
    note: "Every criterion value is the owner's choice: the list builder offers no defaults.",
    removed: [
      {
        patient: "patient-04",
        by: "Dr Helen Brooks",
        at: at(3),
        reason: "Sample haemolysed; repeat sample sent",
      },
    ],
  },
  {
    id: "audit-2",
    name: "Falls precautions, aged 75 and over",
    owner: "Dr Samuel Okafor",
    sharing: "editing",
    criteria: [
      { field: "flag", operator: "is", value: "Falls precautions" },
      { field: "age", operator: "at least", value: 75 },
    ],
    removed: [],
  },
];

const personalLists = [
  {
    owner: "Dr Grace Kim",
    name: "My procedures",
    patients: ["patient-15", "patient-20"],
    private: true,
  },
];

// What the simulated teammates do, in minutes after the prototype starts (decision 0018).
const simulation = [
  { t: 0, actor: "Dr Mei Chen", action: "opens the list", note: "presence" },
  {
    t: 1,
    actor: "Dr Priya Raman",
    action: "opens patient",
    patient: "patient-03",
    note: "presence on a patient",
  },
  {
    t: 3,
    actor: "Dr Mei Chen",
    action: "adds job",
    patient: "patient-01",
    detail: "Repeat full blood count tomorrow",
  },
  {
    t: 4,
    actor: "RN Aisha Malik",
    action: "completes job",
    patient: "patient-02",
    detail: "job-3",
  },
  {
    t: 6,
    actor: "Dr Priya Raman",
    action: "edits job",
    patient: "patient-03",
    detail: "job-4",
    note: "conflicts if the participant edits job-4 at the same time",
  },
  {
    t: 7,
    actor: "Admitting list",
    action: "new referral",
    patient: "patient-22",
    note: "arrives while the participant is reading",
  },
  {
    t: 9,
    actor: "Connection",
    action: "drops for 40 seconds",
    note: "offline state; the participant keeps working",
  },
  {
    t: 12,
    actor: "Early warning system (synthetic source)",
    action: "raises a review",
    patient: "patient-18",
    note: "a collapsed overnight patient becomes active",
  },
];

const ward = {
  about:
    "A small, hand-made synthetic ward for prototyping the patient list and later features. Every person, identifier, time and value is invented and is not clinical advice. Shape follows decision 0019; a Synthea-based generator replaces it later. Comments, allied health, discharge barriers and the list's other app data are kept apart in `sources.app`; `directory` holds registered patients on no list.",
  now: NOW,
  timeZone: "Australia/Melbourne",
  sources: SOURCES,
  unit: { id: "gen-med", name: "General Medicine" },
  teams,
  afterHours,
  nurses,
  alliedHealthStaff,
  flagsDefined,
  patients,
  directory,
  auditLists,
  personalLists,
  simulation,
};

writeFileSync(new URL("./ward.json", import.meta.url), JSON.stringify(ward, null, 2) + "\n");
console.log(`ward.json: ${patients.length} patients, ${directory.length} in the directory`);
