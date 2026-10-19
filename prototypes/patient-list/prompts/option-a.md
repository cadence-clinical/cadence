# Patient list, option A: the list is the workspace

Paste everything below into a new design in the Cadence Clinical project, and attach
`prototypes/synthetic-ward/ward.json`.

## Context for Claude Design

You're prototyping a **patient list** for hospital doctors, built with the **Cadence Clinical**
design system in this project. Use Cadence's components and its conventions header for every
part of the interface, and lay out your own markup only with the utilities the conventions name.

This prototype demonstrates how the list could work, to test with clinicians. It connects to
nothing. All data is synthetic (attached as `ward.json`), and other people's activity is
simulated from that file's `simulation` timeline.

### Rules that hold on every screen

1. **Show an interpretation; never make one.** Acuity is set by a clinician and shown with who set
   it and when. Never colour a value as abnormal or work out a score. A deterioration signal is
   shown as supplied by its source (`deterioration.source`), never as the list's own judgement.
2. **AI-drafted text is always marked** as AI-drafted and links to its sources
   (`overnight.aiDrafted.sources`), and shows who reviewed it once someone has.
3. **Status is never shown by colour alone**: pair it with text or an icon. Use Cadence's status
   colours, which are fixed.
4. **Never truncate or clip text**: names, problems and notes wrap, on a phone too.
5. **Identify every patient the same way**: first and last name, age, gender and URN, with the date
   of birth on hover, keyboard focus and tap. Indicate patients with similar details on the same
   list (`similarTo`). An expected patient (`expected`) is clearly marked as not yet registered.
6. **Densities:** desktops and bedside workstations at compact density; phones at the touch
   default.

### When you're done

List every place you used generic markup because Cadence had no component for it, and what the
component would need to do. Those become the component gaps for this prototype.

---

Build **option A**: every list is a dense table, one row per patient, and selecting a patient
opens their detail beside the list on a desktop, or in place of it on a phone.

### Screens

1. **A team's list** (`team-a`), desktop. Columns: bed, patient (name, age, gender, URN), working
   problem, days since admission, acuity, flags, outstanding jobs, seen today. Rows in bed order,
   reorderable by dragging and by keyboard. Incoming referrals and transfers (`listState:
incoming`) in a section at the top, each with its owner and an Accept action. Presence: who else
   has the list open, and which patient they're on.
2. **The patient detail** beside the list: referral summary, problems (`conditions`), latest
   observations and results with their times, jobs (assignee, due, who can complete), comments,
   flags and acuity, and the patient's history.
3. **The admitting list**: the two referrals and the expected patient, each with how it arrived
   (phone or the named referral system), urgency and owner. A referral with no owner is plainly
   marked as needing one.
4. **The after-hours list**, desktop: the whole unit. Patients marked important first, grouped by
   team, each with the reason and the things to do overnight. Stable patients collapsed, with a
   count.
5. **An audit list** (`audit-1`): its criteria always visible above the rows, a "new" mark on
   patients who recently came to match, and the manual removal with who removed them and when.
6. **The same team list on a phone**: rows become cards, nothing truncated.

### Flows to demonstrate

- **F1:** a referral arrives (Olivia Grant, from the referral system, with no owner yet). Someone
  takes ownership, accepts it and assigns Team A, and Team A accepts.
- **F3:** a ward round on `team-a`: open each patient, add a job, mark the patient complete.
- **F4:** filter the jobs to "mine" with a segmented control.
- **F5:** after hours, George Papadakis is collapsed until the simulated early warning system
  raises a review at 2200; he becomes active, with the source shown.

### States to show

Empty (a team with no patients), loading, offline (the simulated drop at minute 9: changes kept
and marked unshared, the data's age shown), a conflict (at minute 6, Dr Priya Raman edits the job
the participant is editing on Kris Taylor), and a change arriving while reading (minute 7, a new
referral) that never moves a row under the pointer.
