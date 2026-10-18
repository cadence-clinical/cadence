# Patient list: brief

Status: draft

## In the maintainer's words

> patient list (collaborative, real time) used for ward rounds, audits, searches

From the distribution plan, 2026-10-17. On 2026-10-18 the maintainer decided the example app has a
working real-time sync layer, not only the presence and change states.

## Who uses it

| Role                              | Setting                                          | What they need from it                                                                                         |
| --------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Interns, residents and registrars | Ward rounds, the working day                     | The patients they're responsible for, what's outstanding, and jobs to do and complete. "predominantly doctors" |
| Admitting registrar               | Taking a referral call from ED or another source | To place the referred patient on the unit's list with the reason, a clinical summary and an initial plan       |
| Consultants                       | Overseeing their team's patients                 | Oversight of the team's list ("consultants oversee")                                                           |
| Head of unit                      | Running the unit                                 | "a view of the patient mix, acuity, and be able to distribute workflow effectively" across teams               |
| Nurses and allied health          | Planning care and recording progress             | Use the list's outputs: "nurses/AH will often use outputs for planning, progress"                              |

## Kinds of list

- **Unit and team lists.** "patients belong to a unit". A referred patient goes on the unit's list,
  then "these patients then get assigned to a team". The list keeps the patient's relationships
  within the unit and team, "to facilitate these transfers".
- **Personal lists.** "doctor's can make their own private lists, e.g. if they want to track
  their procedures etc". Private to the doctor who made it.
- **Audit lists.** "lists of patients who meet a certain criteria. they can be saved/shared - and
  can also stay 'up to date' as new patients meet criteria. a user can 'remove' a patient if they
  do not meet criteria anymore." Criteria can draw on observations, labs, demographics, conditions
  and more, "so that it is easy to find the right cohort to treat/observe with greater sensitivity
  or for quality/safety".

## Referral, assignment and transfer

- **The referral.** The admitting registrar records the source, referring clinician, urgency,
  reason, clinical summary and initial plan. A referral is received, then accepted and assigned to
  a team, or declined with a reason. (Round 2, Q1: "yes that correct")
- **Assignment.** "either consultant, clinicial nurse and rarely admitting registrar" assign a
  patient to a team.
- **Transfer.** "receiving team should accept to add to their team list and this also closes the
  loop. it should carry over a brief handover note and the clinical summary that was written on
  the admitting registar's admission list."
- **History.** "the history of the patient from entering our patient list system should also be
  accessible".

## Shift handover to the after-hours team

"much like the admitting list -> team list, we want the ability to handover to after hours team to
function effectively as well. essentially multiples teams lists combine and there is a single
(large) list that the after hours team needs to be manage, so we need to mark what patients are
important, have jobs etc. and ideally carry over the day team's synopsis and progress"

## On a ward round

- **Each row shows** bed, name, age, the working problem, days since admission, outstanding jobs
  and whether the patient has been seen, "plus flags (that can be unit or team set), actions".
- **Rows are in bed order by default**, and can be reordered by dragging.
- **Acuity:** "clinican sets acuity".
- **Jobs:** doctors create jobs and assign them to a person or the team, with an optional due
  time. "nurses can complete if within their scope".

## What starts it

- **A referral.** "when they are referred by ED or other source, a admitting registrar takes that
  phone call and places it on a list. this includes reason, clinical summary, initial plan."
- **A ward round**, worked through by the team.
- **A question about a cohort**, answered by building or opening an audit list.

## What done looks like

- On a ward round, each patient is marked complete: "yes patients will be marked as complete".
- Work is tracked in a job list: "we will have a task management/job list, potential for
  assignment".

## Devices and density

Desktops and bedside workstations first, at compact density. Phones at the touch default: "having
phone support is useful for fast moving ward rounds and to reference on the go".

## Flags and audit lists

- A unit's leads define the unit's flags, a team defines its own, and any clinician on the team
  applies them.
- Any doctor can build an audit list. Sharing is view-only unless its owner grants editing.
  Criteria cover demographics, conditions, the latest observations and labs within a chosen time
  window, medicines, and the list's own fields such as flags, acuity and team.

## Out of scope

- **Custom columns**: "this is another feature".
- **The head of unit's view** of patient mix, acuity and workload belongs to the unit dashboard
  feature, built on the same unit, team and patient relationships (A9).

## Answers so far

- **Round 1, Q1 (who):** "predominantly doctors (residents, registrars, interns, consultants
  oversee; nurses/AH will often use outputs for planning, progress)".
- **Round 1, Q2 (what defines a list):** "we will manage the list independently of oracle". (A6)
- **Round 1, Q3 (audits and searches):** quoted under "Kinds of list".
- **Round 1, Q4 (what is shared live):** the list's jobs, comments and marks are "independent of
  Oracle as not actual medical records". (A7)
- **Round 3:** devices, flags and audit lists as the defaults offered; personal lists; and shift
  handover brought into scope.
- **Round 2:** quoted under "Referral, assignment and transfer" and "On a ward round".
- **Round 1, Q5 (done):** quoted under "What done looks like". The referral flow and the head of
  unit's view were added in the same answer.

## Open questions

See round 4: shift handover.
