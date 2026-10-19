# Patient list: options

Status: decided (2026-10-18): prototype all three

Three ways of organising the work, different in kind. Each meets the requirements; they differ in
what they put first. Each is checked against the brief's hardest moments: the ward round on a
phone, the after-hours registrar's single large list, and a referral or transfer that must not be
left without an owner.

## Option A: the list is the workspace

Every list, whether admitting, team, after-hours, personal or audit, is a dense table, one row per
patient, with the columns from the brief. Selecting a patient opens their detail beside the list on
a desktop, or in place of it on a phone. Referrals and transfers show as incoming rows at the top of
a list. The ward round is walking down the rows and marking each complete.

- **How it organises the work:** around the list. Every task starts from scanning rows.
- **Assumes:** clinicians mostly scan many patients and compare them, at a workstation.
- **Good at:** overview and density; one shape for every kind of list, so audit and after-hours lists
  need nothing new; spotting patterns across patients; growing into custom columns.
- **Bad at:** the round on a phone, where a row has to become a card and comparison is lost;
  switching between row and detail at the bedside; many columns on a narrow screen, since text is
  never truncated.
- **Questions that would tell users' preferences apart:** on a round, do you look at the whole list
  or one patient at a time? Which columns do you actually read on the move?

## Option B: round mode

Lists are where work starts, but the round happens in a focused patient view that steps through
the list in order: next and previous, or a swipe on a phone. Jobs, comments, acuity and flags are at
hand, and marking a patient complete moves to the next. Progress shows as "12 of 24 seen". Handover
and the morning hand-back are guided steps through the patients marked for them.

- **How it organises the work:** around one patient at a time, in sequence.
- **Assumes:** rounds are sequential and at the bedside, and the scribe needs one patient in full.
- **Good at:** the round on a phone; less to take in at once; handover as a checklist that can't skip
  a marked patient; clear progress through the round.
- **Bad at:** overview: patterns across patients are harder to see. Audit lists and the after-hours
  list still need an overview, so this option needs Option A's list as well.
- **Questions that would tell users' preferences apart:** does the team go in bed order, or jump to
  the sickest first? Does the consultant want the whole list in view during the round?

## Option C: the journey board

Patients are cards in lanes by where they are in the unit: referred, incoming, on each team,
overnight, leaving. Moving a card is the action: accepting, assigning, transferring, handing over
and archiving. Jobs, acuity and flags show on each card.

- **How it organises the work:** around the patient's movement between owners.
- **Assumes:** the hardest part of the work is handoffs, not the round itself.
- **Good at:** making ownership visible, so an unaccepted referral or transfer stands out (S13, S16);
  showing barriers to care and to discharge, as what holds a card in its lane;
  the admitting registrar's and head of unit's view of the unit; a transfer or handover as one
  action.
- **Bad at:** density, with fewer patients per screen; the ward round's detail; a drag-first design,
  which needs a full keyboard alternative (D2); audit lists, which don't fit lanes.
- **Questions that would tell users' preferences apart:** when you open the list, are you looking
  for who needs seeing, or for where patients are in their journey? How often do handoffs go wrong
  today?

## Recommendation

Prototype Option A with Option B's round mode built on the same lists, and test them against each
other, with Option C's ownership shown inside A as an incoming section at the top of each list.

## Decision (2026-10-18)

**Prototype all three.** The maintainer: "agree A is stongest, and we'd have to prototye B. Journey
board might be useful to highlight barriers to care/discharge as well. we need to prototype C to see
how it'd work for handovers".

- **A** is the base: every list, with the patient's detail beside it.
- **B** is the round mode on A's lists, tested against A for the ward round.
- **C** is prototyped for handovers, and to show barriers to care and to discharge.
