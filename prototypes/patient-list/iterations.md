# Patient list: iterations

## Round 1, 2026-10-19

Option A, after the maintainer's review of its first screens.

- **Checked against:** guardrails, brief, requirements, and the maintainer's seven points.
- **Found:**
  - The navigation and header didn't follow a known pattern. The maintainer chose shadcn's
    sidebar-08: the app at the top, the lists in collapsible groups, and the user at the bottom.
  - The header said "General Medicine: patient list" rather than where you are in the app.
  - Rows had different heights, because "Expected" and "Similar name" sat on a third line, which
    made the list harder to scan.
  - The list couldn't be sorted or filtered.
  - There was no expected date of discharge.
- **Changed:**
  - Library first:
    - Breadcrumb and Avatar were added to `ui`.
    - AppShell gained an inset layout (sidebar-08), so the skip link and the main landmark stay.
    - Tabs keep each label on one line.
    - A sortable column heading in Data table matches a plain heading's size.
  - The sidebar: "Clinical App, Prototype" at the top. Under Lists, Team expands to Admitting,
    GMU A, GMU B and GMU C, and After hours expands to the unit. Links to the flows and to all
    prototypes are at the bottom, and the signed-in registrar is in the footer. Each list has its
    own address.
  - The header shows a breadcrumb trail, such as "Lists › GMU A" or "Lists › Admitting list".
  - The list is a Data table: every column but text and actions sorts, there's a search on name
    and URN, and there are filters for acuity and flags.
  - Every row is two lines: the name, then age, gender and URN.
    - "Expect" and a similar-name icon sit on the name's line. The icon names the other patient
      on hover, focus or tap.
    - Text that could wrap is cut to one line. Names and URNs are never cut.
  - The views are a segmented control (Tabs) above the list, each with its own columns, actions
    and order:
    - **Ward round,** by bed: problem, day, EDD, acuity, flags, jobs, and Seen.
    - **Jobs,** by next due: next job, due, assignee, open count, and Done.
    - **Handover,** important first: important, reason, synopsis, overnight jobs and acuity.
    - **Review,** by EDD: day, EDD, flags, acuity, and Reviewed.
  - The admitting list has its own columns: received, from, reason, urgency, and owner, with "No
    owner" marked.
  - The expected patient reads "60M referred by HITH for APO".
  - Each patient on a team has an EDD, written as "Today", "Tomorrow", "Wed 21 Oct" or "Passed:
    Sat 17 Oct".
  - The table has the whole width until a patient is open, and the detail can be closed.
- **Still open:**
  - What the Review view is for. The prototype assumes a senior or discharge review, ordered by
    EDD.
  - With a patient open, the table's right-hand columns scroll sideways. Should the table hide
    some columns while the detail is open?
  - What the after-hours list, audit lists and the simulated teammates look like (next).
  - New gaps: an input group, a one-line cell that shows its whole text, and sorting on a phone
    (see gaps.md).

## Round 2, 2026-10-19

Option A, after the maintainer's review of round 1 and of four ways to group the list
(`#/patient-list/grouping`).

- **Decided:**
  - Grouping is option A, header rows in one table: one set of column headings, and each group a
    heading row with its name, its count and a collapse button. A group's rows take a lighter
    shade of its heading's fill, so a group reads as one unit, not a banner.
  - A passed expected discharge is its own group: Passed, Today, Tomorrow, Later, Not set.
  - Each view starts with its own grouping, which the team or the user can change: Ward round, no
    grouping; Jobs, assigned to; Handover, important overnight; Review, expected discharge.
  - Flag is not a grouping.
  - Bed and Patient stay the same width in every view, and stay in view when the table scrolls
    sideways.
  - Working problem and expected discharge can be edited in the list.
- **Changed:**
  - Library first:
    - Data table pins columns and keeps a column's `size`, with TanStack Table's column pinning
      and sizing.
    - Data table edits a cell in place with `DataTableEditableCell`: text in an Input, or a date
      in a Calendar.
    - Data table groups rows with `groups` and `getGroupId`: a heading row per group, counts,
      collapse, an info tone, and groups that cannot collapse.
  - Bed (88px) and Patient (312px) lead every view and are pinned. 312px fits the longest
    identity in the synthetic ward at the comfortable density. The admitting list's Patient column
    is the same width.
  - Working problem (Ward round) and EDD (Ward round and Review) are edited in place for a
    patient on the team. The patient's detail says who changed them and when: "Changed by Dr Tom
    Ellis", at the ward's time. Sorting by EDD uses the changed date.
  - A "Group by" select beside the filters offers No grouping, Expected discharge, Acuity, Room
    and Seen today, plus Assigned to in Jobs and Important overnight in Handover.
  - Incoming patients moved out of the alert banners and into the list: an "Incoming" group in the
    info tone, always first whatever the grouping, never collapsed, saying "waiting for this team
    to accept". Each incoming row has the transfer note on a second line ("From GMU C, sent by Dr
    Grace Kim") and Accept in its last cell. Accepting moves the row into its group, and focus
    follows the patient's name. With no grouping, the rest of the list is one group under the
    list's name while anyone is incoming, and no group at all otherwise.
  - The filters leave incoming patients in view, and the Jobs view shows them even without open
    jobs.
  - On a phone, each group is a heading over its cards, with the same count and collapse.
- **Still open:**
  - Where an incoming row's transfer note goes in views without a working problem column. The
    prototype puts it under Next job in Jobs, Synopsis in Handover and Flags in Review.
  - Whether an incoming patient's own controls (Important in Handover, for example) should work
    before the team accepts them. They do now.
  - On a phone the view tabs run past the screen's edge (since round 1).
  - From round 1: what the Review view is for, and whether the table should hide columns while a
    patient is open.

## Round 3, 2026-10-19

Option A, after the maintainer's review of round 2. The maintainer agreed the new components
(Status, Comment, and rows in the Data table that open on a click) on 2026-10-19.

- **Decided:**
  - **Comments replace the transfer note.** Each patient has a thread of comments: who wrote it,
    their role, when, and what they said. A transfer's handover is its first comment, so Carmen
    Delgado arrives with Dr Grace Kim's "Cardiac issues now lead: transferring to Team A for
    ongoing management." This answers round 2's question of where the transfer note goes outside
    Ward round: in the Last comment column of every view.
  - **An incoming patient's controls are disabled until the team accepts them**: Important, Seen,
    Reviewed, Done, and the working problem and EDD cells. They stay in view, faded, and say why.
    Accept stays enabled. This answers round 2's question.
  - **The Review view is for discharge review**: the latest results and vitals, the latest note,
    whether allied health have seen or cleared the patient, and the barriers to discharge.
  - **Allied health has four states** (the maintainer's): Not needed (grey), Referred (amber,
    waiting), Seen (blue, with follow-up) and Cleared (green, for discharge), each with its own
    icon and word, for PT, SW and OT.
  - **Add patient** finds a registered patient in a sheet beside the list, by URN or by name, date
    of birth and gender, and adds them after confirming who they are.
  - **The patient's name opens the patient's own screen**, and **a click on the row opens their
    summary** in the pane beside the list.
- **Changed:**
  - Library first:
    - **Tabs:** the cause of the phone bug was the mark's slide. Base UI measures the tabs again
      whenever their size changes, and Cadence let the mark slide to every new measurement over
      150ms. Any change of layout (a resize, a turned phone, a change of density, a web font
      arriving) left the mark beside its tab, past the end of the list, while it slid. The round 2
      screenshot caught it there: Playwright's full-page capture changes the touch emulation, so
      the tabs shrank to the compact density mid-capture. The mark now slides only to a tab
      pressed with the pointer, and moves with the tabs at once otherwise. A list that does not
      fit still wraps whole tabs, which is the documented choice: shadcn's list runs past the
      edge, Base UI leaves overflow to you, and a view scrolled out of sight is one a reader may
      not know is there. A story at phone width checks that the mark sits behind the shown tab,
      and another that it follows the tab, without sliding, when the layout changes. Its grade
      stays tested.
    - **Status** (new primitive): a state as an icon and a word with no surface, `tone` mapped to
      the fixed status colours on the icon only.
    - **Comment** (new composite): a thread form and a two-line compact form for a table cell, and
      `CommentProvenance`, which marks a comment an AI drafted (decision 0017). No comment in the
      synthetic ward is drafted, but the rule covers everything Cadence shows, and a handover
      written by an assistant is the obvious next case.
    - **Data table:** `onRowClick`, called for a click anywhere in a row but on its controls, and
      not for a selection of text or a click in a popover a cell opened. A row is not focusable,
      so each row also has a button that opens the summary: the keyboard's way in, now the name
      navigates away. A disabled editable cell is documented, with its reason as its description.
  - **Every view and the admitting list** have a Last comment column: the latest comment in two
    lines, or "No comments". The last column is pinned to the end, with the summary button and,
    for an incoming patient, Accept.
  - **The summary pane** shows the comment thread, newest first, with a box to add one (authored
    by Dr Tom Ellis at the ward's time), above the rest of the detail. An incoming patient's pane
    says where they come from, with the clinical summary and Accept. The pane also shows allied
    health in words, the latest note and the discharge barriers.
  - **Review's columns**, after Bed and Patient: Results ("K 5.4 mmol/L · Cr 168 µmol/L", then
    the time), Vitals (the latest set over two lines, with abbreviations and units as the data
    gives them), Latest note (type, author and time, then its opening line), Allied health
    ("PT · SW · OT", each with its icon, one button whose name and tooltip say the states in
    words), Discharge barriers (badges), EDD (still edited in place), Last comment and Reviewed.
    Day, Flags and Acuity were dropped: the day is in the pane, the barriers carry what the flags
    said about discharge, and acuity is in Ward round and Handover. Reviewed stayed, as the mark of
    a patient done in this round, as Seen is in Ward round. No value is highlighted: the list
    holds no thresholds. The default grouping is still Expected discharge, and rows are still two
    lines.
  - **Add patient**, in the toolbar, opens a sheet from the right: find by URN, or by last name
    with first name, date of birth and gender (Field, Input, DatePicker, Select and RadioGroup).
    It shows a state before searching and a "No patient matches" state. Each result shows the
    full identity, the date of birth, and the similar-name mark; people with a similar name to a
    match follow the matches. Choosing one asks "Add Lina Fischer, 34, female, SYN-200302 to GMU
    A?", with a warning listing similar names, and adding them puts a new row on the list (no bed
    yet) and a Toast. On the admitting list it adds a referral owned by the signed-in user, with
    an optional reason.
  - **The patient's screen** (`#/patient-list/a/<list>/patient/<id>`) keeps the shell and the
    sidebar, with the breadcrumb "Lists › GMU A › Margaret Holloway". Its banner identifies the
    patient in full, with the date of birth written out, and four marked placeholder sections
    (Summary, Results, Notes, Medicines) say the overview has not been designed yet. Focus moves
    to the banner when it opens.
  - **The synthetic ward** gained comments, the latest note, allied health, discharge barriers,
    abbreviations and display units for observations and results, results for more patients,
    allied health staff, and a directory of ten registered patients on no list, with two pairs of
    similar names.
- **Still open:**
  - A full referral form for the admitting list's Add patient would need the source, the
    referring clinician, urgency, reason, clinical summary, initial plan and owner, and a way to
    add an expected patient who is not registered yet (F1a).
  - The open row is marked only by its fill (gaps.md).
  - The Review view is wide: should it offer a column menu, or should some columns move into the
    pane? And, from round 1, should the table hide columns while a patient is open?
  - Whether a comment can be edited or deleted, and whether the team sees who has read it.
  - What counts as a similar name is still the data's `similarTo`, not a rule (from round 1).
  - Whether a disabled control should stay focusable so a keyboard can hear its reason (gaps.md).

## Round 4, 2026-10-19

Option A, after the maintainer's review of round 3.

- **Decided:**
  - **Make the Patient column as narrow as the identities allow**, never cutting or wrapping a
    name or URN, measured from the real data at each density, and narrow Bed too.
  - **A choice of two-line or three-line rows**, every row the same height in each. Three lines
    give cells room to show more, so the table scrolls sideways less.
  - **A bar at the start of the open row**, in the pinned first cell, so the open row is not
    marked by its fill alone.
  - **Disabled controls stay unfocusable for now.** Making them focusable so a keyboard can hear
    their reason is deferred (round 3's question, and gaps.md).
  - **Comments can be edited or deleted only briefly.** For 10 seconds after posting, the author
    can edit or delete a comment, with Undo in a toast and the time left beside the actions.
    After that a comment can only be revoked by its author. A revoked comment stays in the
    thread, struck through, saying "Revoked by Dr Tom Ellis, 08:14".
- **Changed:**
  - Library first:
    - **Data table** gained `rowLines` (2 or 3): every row is that many lines tall, and
      `DataTableCellText` and `DataTableEditableCell` cut their text to the row's lines.
      `useDataTableRowLines()` lets a cell lay itself out by them. A column's `meta.width` takes
      a CSS width in place of `size`, so a width in `em` follows the density.
    - **Data table** marks a selected row with a 3px bar in `primary-text` at the start of its
      first cell, as the Sidebar marks its active item. In a pinned first cell it stays in view
      while the row scrolls.
    - **Comment** gained `status="revoked"` (text struck through, muted, and read as "Revoked:"),
      `CommentRevoked` (who and when, with an icon, or "Revoked" when compact), `CommentEdited`,
      `CommentActions`, and `lines={2}` for a compact comment in a three-line row.
      `CommentProvenance` works with each state.
    - Stories with play functions cover each of these, at both densities and on a phone. Both
      grades stay tested.
  - **Widths, measured.** A script set every identity on every list (GMU A, B and C, After
    hours, Admitting) in each view, and every patient in the hospital's directory in the same
    cell's fonts, at the compact (13px), touch (14px) and comfortable (15px) densities, in both
    layouts, and measured the widest line. The widths are written in `em`, so they follow the
    density, with 2px to spare. The same script then checked that no identity line is wider than
    its cell and that every row in a table is one height.

    | Column (content)                        | 2 lines: compact, touch, comfortable | 3 lines: compact, touch, comfortable | Widest identity                                    |
    | --------------------------------------- | ------------------------------------ | ------------------------------------ | -------------------------------------------------- |
    | Patient, a team's list (was 312px)      | 180, 196, 213px                      | 142, 154, 166px                      | "69, female · SYN-100224"; "Thomas Brennan" + icon |
    | Patient, the admitting list (was 312px) | 263, 285, 307px                      | 205, 223, 241px                      | "60M referred by HITH for APO" + Expect            |
    | Bed (was 88px)                          | 64, 72, 81px                         | the same                             | The heading, "Bed" and its sort icon               |
    - A team's list and the admitting list are sized apart. An expected patient is only on the
      admitting list, and is 5em wider than any named patient.
    - In two lines, the widest part of a named identity is its second line. In three lines the
      URN has its own line, and the widest is a name with the similar-name icon: "Thomas
      Brennan", a directory patient, who can be added to any list.
    - In three lines, "Expect" moves to the second line, beside "Not yet registered", so the
      expected patient's description is the widest part on its own.
    - The "Expect" badge was a pixel and a half taller than a line of text, so the expected
      patient's row was taller than the rest. The name's line is now one line high whatever its
      marks.
    - With the columns narrower, Bed, Patient and the last column now stay pinned at 1440px with
      a patient open. They covered more than two thirds of the table before, so they scrolled.

  - **Rows**, a select beside Group by, offers 2 lines and 3 lines. Each list remembers its own
    for the session. It is a select, not a toggle group, because Cadence's Toggle group can be
    left with nothing pressed and row height must always have an answer, and it matches Group by
    beside it.
  - **In three lines:** the identity takes three lines (name; age and gender; URN). The working
    problem, next job, reason, synopsis, referral source and reason take three lines in narrower
    columns. The last comment and the latest note take two lines under their header line.
    Results take two lines with the time on the third, and vitals three lines with the time after
    the last value. Flags and discharge barriers wrap onto a second line. At 1440px, three lines
    show two more columns of Ward round and one more of Review.
  - **In two lines**, text that was cut to one line (working problem, next job, reason,
    synopsis) now uses both lines of the row, in narrower columns.
  - **On a phone**, the Rows control is not shown and the cards do not change. A card already has
    the phone's width, and the setting trades width for height, which a card does not need.
  - **The open row** has the bar in its Bed cell.
  - **Comments:**
    - The prototype's clock is the ward's 08:00 plus the time the page has been open, so a comment
      posted after a minute is stamped 08:01. The real date is never read.
    - A posted comment shows Edit, Delete and "Editable for 9 s", counting down. A toast says
      "Comment posted. You can undo, edit or delete it for 10 seconds", with Undo, and closes when
      the 10 seconds end.
    - Edit puts the text in a box with Save and Cancel, and holds the time open while the author
      edits. Escape cancels, and Ctrl or Cmd and Enter saves. An edited comment says "Edited".
    - After 10 seconds, Revoke replaces Edit and Delete, and focus moves to it if it was on them.
      Revoke asks first ("Revoke your comment? … You cannot undo this"), then strikes the comment
      through with "Revoked by Dr Tom Ellis, 08:14", and focus moves to the comment.
    - Only Dr Tom Ellis's comments have actions, including his comment on Ahmed Karimi from the
      synthetic ward, which can be revoked.
  - **The Last comment column shows a revoked latest comment as revoked**, struck through with
    "Revoked", rather than falling back to the comment before it. Someone who read the original
    needs to learn it no longer stands, and showing an older comment as the latest would hide
    that something was said and withdrawn.
- **Still open:**
  - At 1100px with a patient open, the table's box is too narrow for Bed, Patient and the last
    column to stay pinned (more than two thirds), so they scroll with the rest, and so does the
    bar. The last column is wide because of an incoming patient's Accept button.
  - In three lines, "Expect" leaves the name's line. Is that acceptable, or should it stay with
    the name at the cost of a wider column (263px rather than 205px when compact)?
  - An expected patient is assumed never to be on a team's list: their description is 5em wider
    than the team column allows. If a team can accept one before they are registered, the team
    column must be sized for them too.
  - The widths are measured from today's synthetic data. A longer name would need measuring
    again: the Patient row component (proposed) should size its column from the list itself.
  - Whether an edited comment should show what it said before, and whether the team sees that a
    comment was revoked, beyond the thread and the Last comment column.
  - From round 3: whether the team sees who has read a comment, and whether the table should hide
    columns while a patient is open.

## Round 5, 2026-10-19

Option A, after the maintainer's review of round 4, with two requests for the whole prototypes app.
The maintainer agreed the Mode toggle on 2026-10-19.

- **Decided:**
  - **"Expect" stays on line 2 in three-line rows** (round 4's question). The admitting list's
    Patient column stays at its three-line width.
  - **Comments keep today's behaviour**: edited or deleted for 10 seconds after posting, then only
    revoked (round 4's questions about edits and revocations).
  - **Accept and Remove move into the row's menu.** Each row's last column is one icon button,
    "Actions for Margaret Holloway", that opens a menu, as the Data table's row-actions story draws
    it. Incoming rows keep the info-toned group heading saying they are waiting.
  - **A light and dark mode switcher**, library first, on option A's header, the index and the
    flows page.
  - **The index of all prototypes is redesigned** for many features, each with several options,
    flows, print versions and component prototypes.
- **Changed:**
  - Library first:
    - **Mode toggle** (new composite): shadcn's mode toggle, a Button with a sun or a moon that
      opens a Dropdown menu of Light, Dark and System, with the chosen mode ticked. It sets
      `data-mode` on `<html>`, removes it for System, and remembers the choice in `localStorage`,
      with every read and write guarded so it still works where storage is blocked. `useMode` gives
      any component the page's mode, and `MODE_SCRIPT` applies a remembered mode in the page's
      `<head>` before the first paint. Stories with play functions cover the pointer, the keyboard,
      blocked storage, the head script, a change made elsewhere, a controlled toggle, dark mode,
      the comfortable density and a phone. Its grade is tested.
    - The row menu is composition: Data table and Dropdown menu are unchanged.
  - **The row's menu** holds, in order: Show summary (the keyboard's and a screen reader's way to
    the pane, as a click on the row is the pointer's), Open patient (a link to the patient's
    screen), and Accept onto GMU A for an incoming patient. On a team's list, a separator and
    "Seen today", a checkbox item shared with the Seen column, then Remove from list. The admitting
    list's menu has Show summary and Open patient only. The phone's cards use the same menu.
  - **Remove from list** asks first, in an Alert dialog: "Remove Margaret Holloway, 84, female,
    SYN-100201 from GMU A?", with the URN kept on one line. Removing takes the patient off this
    list only, and a toast says "Margaret Holloway removed from GMU A" with Undo for 10 seconds.
    Focus moves to the next patient's name, or the list's heading if none is left. Cancelled, focus
    goes back to the row's actions. Undo puts the row back and moves focus to the name. An open
    summary of the removed patient closes.
  - **The last column is 44px at the compact density**, the button and the cell's padding, down
    from 112px. The pane beside the list is now `clamp(20rem, 30vw, 26rem)`, so it gives the list
    more room on a narrower screen and is 26rem from 1387px up.
  - **Pinning now holds at 1100px with the pane open.** The table's box is 479px, and Bed (64px),
    Patient (180px) and the actions (44px) cover 288px, under the two thirds (319px) at which
    pinning switches off. The open row's bar stays in view while the table scrolls. At 1440px the
    box is 733px.
  - **The Incoming group's heading** now says "Incoming · 1 patient · waiting for this team to
    accept". The words about accepting went, because Accept is in the menu, and the longer heading
    was cut off at 1100px.
  - **The Mode toggle** is at the right of option A's header, beside "Option A · synthetic data",
    on the index and on the flows page. The printable flows still print in light mode: the page
    sets light before its first paint and puts the reader's mode back when they leave it.
  - **Dark mode, checked on every screen** at 1440px, 1100px and on a phone: the index, every list
    and view of option A with the pane, the row menus, the remove dialog and toast, Add patient, the
    patient's screen, the flows page and its print version, and the grouping and pane prototypes.
    The flow diagrams drew their terminal and decision boxes in `primary`, which is dim on a dark
    card, and now use `primary-text`, which is the same colour in light mode.
  - **The index** is drawn from a typed registry, `apps/prototypes/src/registry.ts`: each feature
    has a name, a description, a status (not started, exploring, in review with what is in review,
    or decided with the decision), the day it last changed, and its entries, each with a kind
    (option, flows, print version or component prototype), a title, a description and a status
    (live with its route, or planned with none). The page has a search and a filter by kind. Each
    feature is a card with its status badge, what is in review and the date. Options sit side by
    side, and the other kinds in columns beneath them. A planned entry, such as options B and C, is
    marked Planned and is not a link. Features not started yet are listed at the end. On a phone
    everything is one column. Every route still works.
- **Still open:**
  - Whether an incoming patient's menu should offer a way to decline or send them back, and with
    what. It has no Remove now, because they are not on the list yet.
  - Whether the admitting list's menu should offer Decline, which needs a reason (F1), or Remove.
  - Whether a removal should show who removed the patient and when anywhere after the toast (S5
    asks it of audit lists).
  - The mode is remembered between visits only once the `<head>` script is in
    `apps/prototypes/index.html`.
  - The index lists four features not started yet, from the prototyping process: is that wanted?
  - From round 4: whether the team sees who has read a comment, whether an edited comment shows
    what it said before, and whether the table should hide columns while a patient is open.

## Round 6, 2026-10-19

Option A's right pane, after the maintainer chose option C from the four proposals
(`#/patient-list/pane`). The maintainer agreed the Description list and the Timeline on 2026-10-19.

- **Decided:**
  - **The pane is option C: a summary and a timeline.** A header to move through the list, open
    the patient and close; the patient's identity, then bed, team and EDD. Then a summary at a
    glance, one timeline of everything that happened to the patient, newest first, with a filter,
    and the comment box at the bottom.
- **Changed:**
  - Library first:
    - **Description list** (new primitive): `DescriptionList`, `DescriptionItem`, `DescriptionTerm`
      and `DescriptionDetails`, a `dl` laid out as two columns that line up across every pair, and
      that stacks each term over its details when the list is narrower than 18rem. shadcn has no
      description list, and neither had Cadence: the prototype's proposals drew one by hand.
    - **Timeline** (new composite): `Timeline` (an `ol`), `TimelineItem`, `TimelineIcon`,
      `TimelineHeader`, `TimelineTitle`, `TimelineTime` (a `time` element) and `TimelineContent`,
      which holds any content, such as a Comment. The header comes before the content, so a screen
      reader hears the kind, who and when before what, and the icon is hidden from it.
      `variant="connected"` joins the icons with a rule. A dot in the header wraps with the part
      after it, so no line ends on one. shadcn has no timeline or activity feed.
    - **The filter is a Toggle group, not Tabs.** Tabs switch between panels, and this filter
      narrows one list, which is what Cadence's Toggle group is for ("a set of filters"). A Toggle
      group can be left with nothing pressed, so a released filter is read as All, and one filter
      always shows as pressed. Timeline's docs show the pattern.
    - **List and detail:** on a phone, a record that opens now starts at its top, just below the
      sticky header. It was focused where the list had been scrolled to, so the pane opened part
      way down, with its way back under the header. A story that failed before the fix covers it.
      Its grade stays tested.
    - Stories with play functions cover the new components at the compact and comfortable
      densities, on a phone and in dark mode, with docs on four tabs. Both grades are tested.
  - **The header:** previous and next patient, with "2 of 8", Open patient (a link to the
    patient's screen) and Close. Previous and next move through the list's rows as they are shown,
    sorted, filtered and grouped, including an incoming patient's row and rows in a collapsed group,
    which opens. The row's bar and selection follow, the row is scrolled into view, and focus stays
    on the button. A screen reader hears who is open now ("Ahmed Karimi, 5 of 8"). At the first and
    last row the button is disabled but keeps focus. Each icon button names the patient it goes to
    in its name and its tooltip. Closing the pane moves focus to the patient's name in the list.
    - The table's sorting and collapsed groups moved up from the table into option A's list, so the
      pane and the table read the same order. Each table (a list, a view and a grouping) remembers
      its own sorting and collapsed groups for the session.
  - **The identity** uses `PatientIdentity` at banner size, which now wraps between age and gender,
    the URN and the date of birth, and never inside one, so it fits a 20rem pane.
  - **The summary** is a Description list: working problem, expected discharge and discharge
    barriers, then allied health as three Status items with their words (PT Seen, SW Not needed, OT
    Referred). Everything else the pane showed in round 5 moved into it: open jobs, acuity, the
    patient's problems, the overnight handover and the referral and its owner. A change to the
    working problem or the EDD still says "Changed by Dr Tom Ellis, 08:03" under it.
    - The overnight handover of Graham Whitlock and Brian Kowalczyk was drafted by an assistant. The
      pane now marks it with `CommentProvenance` and its sources (guardrail 2). The Handover view's
      Synopsis column still does not mark it: see Still open.
  - **The incoming transfer** is an info Alert at the top of the pane: "Waiting for GMU A to
    accept", who sent it and when, the clinical summary, and Accept.
  - **The timeline**, newest first, holds:
    - comments, with all of round 4's behaviour: Edit and Delete for 10 seconds with the time left,
      Undo in the toast, Revoke after that with a confirmation, struck through with who revoked it
      and when, "Edited" in the header, and `CommentProvenance` for a comment an AI drafted;
    - the latest note, with its type and opening line;
    - results, a set to an item, and the latest observations, with abbreviations and units as the
      data gives them, and nothing highlighted;
    - jobs created and jobs done. The synthetic ward's jobs now say when they were made (its
      generator gained `createdAt`), so every job has a "Job created" item;
    - changes from the data: acuity set, a transfer sent and a referral received;
    - **every change made in the prototype**, by Dr Tom Ellis at the prototype's clock: the working
      problem or EDD changed, set or cleared, with the value before and after; seen, important
      overnight or reviewed, marked or unmarked; a job done; accepted onto the team; a comment
      revoked; removed from the list, and put back with Undo.
    - Results and observations are in the timeline rather than the summary, because each is a set
      taken at a time, and the time is what a reader weighs them by. They read better beside the
      notes and comments of the same hours than as a block of numbers above them.
    - The filter is All, Comments, Notes, Results, Jobs and Changes. Results shows observations too.
      Jobs earns its place now every job has a creation time: each team patient with a job has at
      least one job item. The filter holds as the pane moves from patient to patient. Posting a
      comment while the filter hides comments shows All, and scrolls to the new comment.
    - Results and observations have no "who": the synthetic ward does not say who performed a
      test or took a set of observations, and the timeline leaves it out rather than guess.
  - **The comment box** is at the bottom of the pane, with Post beside it, and Ctrl or Cmd and
    Enter posts. Each patient keeps their own draft, so an unposted comment never follows the pane
    to the next patient. The thread's rules live in one place, `comment-thread.tsx`, which now gives
    the pane a provider, a comment's body and the box, rather than a whole thread.
  - **On a phone** the pane is the List and detail record, with Back named by the list ("GMU A"),
    previous and next, and Open patient on one line at 390px. The comment box stays at the bottom
    of the screen while the page scrolls.
  - The proposals page says C was chosen, and the index shows the outcome.
- **Still open:**
  - The Handover view's Synopsis column shows an AI-drafted synopsis without its mark. The pane
    marks it now. Should the column carry the compact mark ("AI draft"), as a compact Comment does?
  - Who performed a result or took a set of observations: FHIR's `Observation.performer` could say,
    if Oracle Health serves it. Should the timeline show it?
  - "2 of 8" counts every row, the incoming patient's too, while the list's heading says "7
    patients". Should previous and next skip incoming patients?
  - Should the timeline show an admission, and allied health's visits, as items of their own?
  - From round 5: whether an incoming patient's menu should offer a way to decline them, and
    whether the admitting list's menu should offer Decline or Remove.
  - From round 4: whether the team sees who has read a comment, and whether the table should hide
    columns while a patient is open.
