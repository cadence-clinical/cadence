# Patient list, option B: round mode

Paste everything below into a new design in the Cadence Clinical project, and attach
`prototypes/synthetic-ward/ward.json`. Build it on option A's team list if that exists in the

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

project.

---

Build **option B**: a focused round mode that steps through a team's list one patient at a time.
It's tested against option A for the ward round, so design it phone-first.

### Screens

1. **Start a round** from `team-a`'s list: choose the order (bed order by default) and start.
2. **One patient at a time**, phone first, with a desktop version for a bedside workstation. The
   patient's identification at the top (rule 5); the working problem; recent observations and
   results with their times; jobs, comments, flags and acuity at hand. "Complete and next" marks the
   patient complete and moves on; next and previous, or a swipe, move without marking.
3. **Progress** through the round, such as "5 of 8 seen", with a way back to anyone skipped.
4. **The end of the round**: who's been seen, who hasn't, and the jobs created during it, by
   assignee.
5. **Handover as guided steps**: at the end of the day, step through the team's patients, marking
   those who need attention overnight with a reason and things to do. Show the AI-drafted synopsis
   on Graham Whitlock as AI-drafted, with its sources, for the registrar to review.

### Flows to demonstrate

- **F3:** a ward round on `team-a`, scribed on a phone: add a job to Margaret Holloway, update Kris
  Taylor's acuity (and notice the similar-name indication for Chris Taylor), complete and move on.
- **F5:** the guided handover, for `team-b`.
- **Interruption:** a page in the middle of the round; returning lands on the same patient, with
  any unsaved job kept.

### States to show

Offline mid-round (minute 9 of the simulation: changes kept and marked unshared), a teammate
editing the same patient (minute 1, Dr Priya Raman on Kris Taylor), and a patient left unmarked at
the end of the round.
