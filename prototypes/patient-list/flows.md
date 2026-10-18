# Patient list: flows

Status: draft for the maintainer's review (2026-10-18)

Each flow traces to the brief and requirements (S#, C#, D#). **Question** marks something the
brief doesn't answer yet. Teammates' actions in the prototype are simulated (decision 0018).

## The patient's lifecycle on the list

How a patient moves through the list from referral to archival. An expected patient moves through
the same states, and is linked to a URN and an encounter whenever they're registered (F1a).

```mermaid
stateDiagram-v2
  state "Received" as Received
  state "Incoming to a team" as Incoming
  state "On a team" as OnTeam
  state "With the after-hours team" as Overnight
  state "Left hospital" as LeftHospital
  [*] --> Received: referral entered or imported
  Received --> Declined: the owner declines, with a reason
  Received --> Incoming: the owner accepts and assigns a team
  Incoming --> OnTeam: the team accepts
  OnTeam --> Incoming: transferred to another team
  OnTeam --> Overnight: handed over for the night
  Overnight --> OnTeam: handed back and acknowledged
  OnTeam --> LeftHospital: discharged, transferred out or died
  Overnight --> LeftHospital: discharged, transferred out or died
  LeftHospital --> Archived: jobs resolved, and a team member confirms
  Declined --> [*]
  Archived --> [*]
```

## Happy paths

### F1. A referral arrives

1. A referral arrives in one of two ways: the admitting registrar takes a call from ED or another
   source and enters it by hand, or it comes from a separate referral system with its basic details
   filled in. An imported referral says which system it came from.
2. The admitting registrar opens the unit's admitting list (on a phone, a drawer; on a desktop, a
   sheet) and finds the patient by name or URN. Each result shows first and last name, age, gender
   and URN, and similar patients are indicated (S10).
3. If the patient isn't registered yet, they're added as **expected**: a placeholder on the list,
   clearly marked, that "needs a UR + encounter attached" (F1a).
4. They record the source, referring clinician, urgency, reason, clinical summary and initial plan,
   and save. The referral appears on the admitting list as received, live for everyone on the list
   (C1).
5. **Every referral has an owner**, who accepts it and assigns it to a team, or declines it with a
   reason: "Someone needs to own and close/decline that referral". It can't be left without one.
   A consultant, a clinical nurse or, rarely, the admitting registrar assigns it.
6. The patient appears on the team's list as incoming. The team accepts, and the patient joins their
   list. Until then the patient stays on the admitting list, so they are never without a team (S13).

```mermaid
flowchart TD
  start(["A referral arrives"]) --> how{"How?"}
  how -->|"Phone call"| manual["Admitting registrar enters it by hand"]
  how -->|"Referral system"| imported["Imported with basic details and its source"]
  manual --> find["Find the patient by name or URN"]
  imported --> find
  find --> reg{"Registered?"}
  reg -->|"Yes"| details["Record source, referrer, urgency, reason, summary and initial plan"]
  reg -->|"No"| expected["Add as expected: a placeholder, linked later (F1a)"]
  expected --> details
  details --> received["On the admitting list as received, live for everyone"]
  received --> decide{"The owner decides"}
  decide -->|"Decline"| declined(["Declined, with a reason"])
  decide -->|"Accept and assign a team"| incoming["Incoming on the team's list"]
  incoming --> acc{"Team accepts?"}
  acc -->|"Not yet"| stays["Stays on the admitting list"]
  stays --> acc
  acc -->|"Yes"| onteam(["On the team's list"])
```

### F1a. Linking an expected patient

1. An expected patient's row says they are expected and not yet linked, in place of a URN, so no one
   mistakes the placeholder for a registered patient.
2. When the patient is registered, someone links the placeholder to their URN and encounter: they
   search, check the identifiers against the placeholder (S10), and confirm.
3. The row then shows the patient's identifiers and record data, and the history records who linked
   them and when.
   **Question:** what does a placeholder hold before it's linked (a name, an approximate age, where
   the patient is now), and who may link it?

```mermaid
flowchart TD
  ph(["Expected patient: a placeholder, marked as not yet linked"]) --> regd{"Registered yet?"}
  regd -->|"Not yet"| ph
  regd -->|"Yes"| search["Search for the patient"]
  search --> check["Check their identifiers against the placeholder"]
  check --> match{"The same patient?"}
  match -->|"No"| search
  match -->|"Yes"| link["Confirm the link to the URN and encounter"]
  link --> done(["The row shows their identifiers and record data, and the history records who linked them"])
```

### F2. A patient moves to another team or unit

1. Whoever assigns the patient chooses the new team and writes a brief handover note. The clinical
   summary from the referral carries over with it.
2. The receiving team sees the patient as incoming, with the note and the summary, and accepts.
   Acceptance closes the loop: the patient leaves the old team's list and joins the new one.
3. The patient's history records the move, the note, who sent it, who accepted it and when (A14).

```mermaid
flowchart TD
  a(["The assigner chooses the new team"]) --> note["Writes a brief handover note; the clinical summary carries over"]
  note --> inc["Incoming on the receiving team's list"]
  inc --> acc{"Receiving team accepts?"}
  acc -->|"Not yet"| old["Stays on the old team's list"]
  old --> acc
  acc -->|"Yes"| moved(["Leaves the old list and joins the new one; the history records the move"])
```

### F3. The ward round

1. The team opens its list, on a bedside workstation or a phone. Rows are in bed order, and each
   shows bed, name, age, gender, URN, working problem, days since admission, flags, acuity,
   outstanding jobs and whether the patient has been seen.
2. Presence shows who else on the team has the list open (C2).
3. They open a patient. Beside the list (on a phone, in place of it) are the referral summary,
   problems, recent observations and results as the record gives them, jobs, comments, flags and
   acuity.
4. The scribe adds jobs, assigning each to a person or the team with an optional due time, adds
   comments, and updates acuity and flags. Each change is live for the team (C1).
5. They mark the patient complete and move to the next. The round is done when every patient is
   marked; any left unmarked stay visible as such.

```mermaid
flowchart TD
  open(["The team opens its list"]) --> rows["Rows in bed order; presence shows teammates"]
  rows --> pick["Open the next patient"]
  pick --> detail["Summary, problems, results, jobs, comments, flags and acuity"]
  detail --> edit["The scribe adds jobs and comments, and updates acuity and flags"]
  edit --> complete["Mark the patient complete"]
  complete --> more{"Patients left?"}
  more -->|"Yes"| pick
  more -->|"No"| done(["Round done; anyone unmarked stays visible"])
```

### F4. Jobs through the day

1. A doctor narrows the jobs on a list to their own with a filter, a segmented control or a
   combobox, rather than a separate view, and sees the patient each job belongs to.
2. A nurse sees the jobs within their scope and completes them; the others are visible but can't
   be completed by them (S11).
3. A completed job updates live for everyone (C1), with who completed it and when.

```mermaid
flowchart TD
  list(["A list"]) --> filter["Filter the jobs: mine, the team's or all"]
  filter --> who{"Who is completing it?"}
  who -->|"A doctor"| doc["Complete the job"]
  who -->|"A nurse"| scope{"Within their scope?"}
  scope -->|"Yes"| doc
  scope -->|"No"| view["Visible, but they can't complete it"]
  doc --> live(["Completed for everyone, live, with who and when"])
```

### F5. Handing over to the after-hours team

1. Before the end of the day, each team marks the patients who need attention overnight, by a
   priority level or a flag chosen for that purpose, and adds things to do overnight, each with a
   reason. The day team's synopsis and progress go with each patient.
2. The team hands over. The after-hours team inherits ownership of every patient in the unit.
3. The after-hours registrar opens one list of the whole unit. Patients marked important come
   first, grouped by team. Stable patients with nothing marked are collapsed, with a count, and
   expand with the keyboard (D4).
4. They accept each team's handover, then work through the important patients. They can add,
   complete and adjust jobs, flags and acuity as necessary.
5. A collapsed patient who deteriorates, or is marked important, becomes active and visible (S12).
   The reason is shown with its source: a clinician, a source system's deterioration signal, or an
   AI model, which is labelled as AI (S2, S3).

```mermaid
flowchart TD
  day(["The end of the day"]) --> mark["Each team marks patients for overnight, and adds things to do with reasons"]
  mark --> send["The team hands over, with synopsis and progress"]
  send --> inherit["The after-hours team inherits the whole unit"]
  inherit --> acc["The after-hours registrar accepts each team's handover"]
  acc --> listv["One unit list: important patients first, by team; stable patients collapsed, with a count"]
  listv --> work["Work through the important patients, adding, completing and adjusting jobs, flags and acuity"]
  work --> det{"A collapsed patient deteriorates or is marked?"}
  det -->|"Yes"| active["Becomes active, with the reason and its source"]
  active --> work
  det -->|"No"| morning(["Morning: hand back (F6)"])
```

### F6. Handing back in the morning

1. The after-hours team adds an overnight summary to each patient they saw, and the jobs they did
   or created.
2. They hand back. Each patient returns to their day team's list.
3. The day team acknowledges the hand-back: these are their patients, so they can't refuse it.
   Whether a handover is accepted or acknowledged is a setting (C6).
4. Overnight changes stay highlighted on each patient until someone on the team has read them.

```mermaid
flowchart TD
  night(["The end of the night"]) --> summary["An overnight summary and jobs for each patient seen"]
  summary --> back["Hand back to each day team"]
  back --> setting{"The handover's setting"}
  setting -->|"Acknowledge"| ack["The day team acknowledges: they can't refuse their own patients"]
  setting -->|"Accept"| accept["The receiving team accepts"]
  ack --> highlight(["Overnight changes stay highlighted until read"])
  accept --> highlight
```

### F7. Building an audit list

1. A doctor, or the head of unit, starts an audit list and chooses its criteria from demographics,
   conditions, the latest observations and labs within a time window, medicines, and the list's
   own fields such as flags, acuity and team. They enter every value; nothing is pre-filled (S4).
2. A preview shows how many patients match, and who.
3. They name the list, save it, and share it view-only or with editing.
4. The list stays up to date. A patient who comes to meet the criteria appears, marked as new
   (C3). The criteria are always shown with the list (S4).
5. Anyone who can edit the list can remove a patient who no longer fits. The removal applies to
   this list only, and shows who removed them and when (S5).

```mermaid
flowchart TD
  start(["Start an audit list"]) --> crit["Choose the criteria and enter every value; nothing is pre-filled"]
  crit --> preview["Preview how many match, and who"]
  preview --> ok{"The right cohort?"}
  ok -->|"No"| crit
  ok -->|"Yes"| save["Name it, save it, and share it view-only or with editing"]
  save --> live["Stays up to date: new matches are marked new, and the criteria are always shown"]
  live --> remove{"A patient no longer fits?"}
  remove -->|"Yes"| rm["Remove them from this list only, recording who and when"]
  rm --> live
```

### F8. A personal list

1. A doctor adds patients from any list to a private list of their own, for example to track their
   procedures.
2. The patients stay on their teams' lists as before. The personal list is the doctor's view only.

```mermaid
flowchart LR
  any(["Any list"]) --> add["Add patients to my private list"]
  add --> mine(["My personal list; the teams' lists are unchanged"])
```

### F9. Leaving hospital and archival

1. When a patient leaves hospital (discharged, transferred out or died), their row says so and how,
   as the record gives it.
2. The list asks the team to complete, reassign or close each outstanding job, with a reason when
   closed.
3. Once no job is open, the list suggests archiving the patient (S14).
4. A team member confirms. The patient leaves every list, and their history is kept.

```mermaid
flowchart TD
  left(["The patient leaves hospital: discharged, transferred out or died"]) --> row["The row says so, and how, as the record gives it"]
  row --> jobs{"Open jobs?"}
  jobs -->|"Yes"| resolve["Complete, reassign, or close with a reason"]
  resolve --> jobs
  jobs -->|"No"| suggest["The list suggests archiving; never automatic by default"]
  suggest --> confirm{"A team member confirms?"}
  confirm -->|"Not yet"| row
  confirm -->|"Yes"| archived(["Leaves every list; the history is kept"])
```

## Interruptions

- **A page or call in the middle of the round.** The list keeps the patient and the draft the scribe
  was on, and returns to them.
- **A teammate edits the same job or field.** The second person sees the conflict and chooses which
  to keep (C4).
- **A new referral or a change arrives while someone is reading.** It's announced and shown when
  they choose; no row moves under their pointer or finger (C3, D3).
- **The phone loses its connection, for example in a lift.** Changes are kept and marked as not yet
  shared, and the list says how old its data is (C5).
- **A patient deteriorates during the round.** Their row shows the signal with its source, and the
  team can act on it without leaving the list (S2).

## States

| State    | What the person sees                                                                                                    | What they can do                                   |
| -------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Empty    | The list has no patients, and says what fills it: a referral for the admitting list, criteria for an audit list.        | Add a referral, change the criteria, add a patient |
| Loading  | The rows' shape, without content, so the layout doesn't jump.                                                           | Wait                                               |
| Partial  | What loaded, with what didn't named in place, such as "results not available". Never blank, and never zero for missing. | Retry the part that failed                         |
| Error    | A change that couldn't be saved, kept and marked as unsaved, with the reason.                                           | Retry, or discard the change                       |
| Offline  | That the list is offline, which changes aren't shared yet, and how old the data is.                                     | Keep working; changes send on reconnection         |
| Stale    | How long ago the data was updated, wherever it might be out of date.                                                    | Refresh                                            |
| Conflict | Both versions of an edit, and who made each.                                                                            | Keep one, or combine them                          |

## Open questions

- What does an expected patient's placeholder hold before it's linked, and who may link it? (F1a)
