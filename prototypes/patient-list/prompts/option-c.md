# Patient list, option C: the journey board

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

Build **option C**: patients as cards in lanes by where they are in the unit, so handovers, and the
barriers holding a patient up, are visible at a glance. Moving a card is the action.

### Screens

1. **The unit board**, desktop. Lanes: received (the admitting list, including the expected
   patient), incoming to a team, on each team, with the after-hours team, and left hospital. Each
   card: identification (rule 5), working problem, acuity, flags, open jobs and the card's owner.
2. **Barriers**: what holds a card in its lane, such as awaiting placement, awaiting imaging or an
   open job on a patient who has left hospital, shown on the card and filterable across the board.
3. **Moving a card** to accept a referral, assign a team, transfer, hand over or archive. Each move
   that hands a patient to someone else asks for the handover note, and isn't complete until the
   receiver accepts (or acknowledges, for the morning hand-back). Every move can also be done
   without dragging, from the card's menu and by keyboard.
4. **The end-of-day handover** as moving a team's marked patients to the after-hours lane, and the
   morning hand-back as moving them back.
5. **Archival**: Ruth Abernathy, who has left hospital with no open jobs, shows the list's
   suggestion to archive her, which a team member confirms. Stanley Ruiz shows an open job blocking
   his.

### Flows to demonstrate

- **F1:** Olivia Grant's referral has no owner: the board makes that stand out, someone takes it
  and assigns Team A, and Team A accepts.
- **F2:** Carmen Delgado's transfer from Team C to Team A, with its handover note, accepted by
  Team A.
- **F5 and F6:** the evening handover to the after-hours team and the morning hand-back.
- **F9:** archiving Ruth Abernathy.

### States to show

A card waiting on its receiver (never left without an owner), a conflict when two people move the
same card, and offline (minute 9 of the simulation).
