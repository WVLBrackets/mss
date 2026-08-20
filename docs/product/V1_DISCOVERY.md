# MSS v1 — discovery questions (open until answered)

**Purpose:** Requirements gathering for the studio scheduler that replaces the legacy Google Sheets. The agent must keep asking follow-ups until every question below is **Answered** or explicitly marked **Not relevant** by Warren. Answers may take weeks — Warren is reviewing with studio staff.

**Status legend:** 🔴 Open · 🟡 Partial · 🟢 Answered · ⚪ Not relevant

**Last review:** 2026-08-20 (after reviewing the current Frisco availability workbook v5 and the September 2026 schedule output)

---

## Scoreboard

| # | Topic | Status |
|---|-------|--------|
| 1 | Where the finished assignment is recorded today | 🟢 |
| 2 | People required per class slot and per desk shift | 🟡 |
| 3 | Availability binary vs graded | 🔴 |
| 4 | Class types and whether they gate who can teach | 🟡 |
| 5 | One-off classes and events | 🟡 |
| 6 | Per-instructor limits (max classes, rest gaps, earliest start) | 🔴 |
| 7 | Cycle length vs calendar months | 🟡 |
| 8 | Cycle calendar: open, deadline, assign, publish, reminders | 🔴 |
| 9 | Post-publish changes: call-outs, swaps, subs | 🔴 |
| 10 | What belongs in comments, and at what level | 🔴 |
| 11 | Roles beyond staff and manager | 🟡 |
| 12 | One person at multiple locations; do managers work shifts | 🟡 |
| 13 | Minimum v1 scope to retire the sheets | 🟡 |
| 14 | Shared availability grid across teach and desk roles | 🔴 |
| 15 | Desk shift definition (variable start times, end times, PM coverage) | 🔴 |
| 16 | Class type as real data instead of cell color | 🔴 |
| 17 | Meaning of shorthand tokens in schedule cells | 🔴 |
| 18 | Rotating workout plan number per day | 🔴 |
| 19 | Where free-text class descriptions belong | 🔴 |
| 20 | Availability window vs published month (offset and overlap) | 🔴 |
| 21 | Retaining inactive staff and historical schedules | 🔴 |
| 22 | Per-person schedule view vs full grid | 🔴 |

---

## Answered

**1. Where does the assignment go today?** 🟢 A **separate monthly workbook** (e.g. `September Schedule 2026`) with two tabs — one for teachers, one for desk. The manager reads the availability roll-ups in the availability workbook and **hand-types names** into a week × time-slot grid. There is **no link** between the two workbooks: no validation that an assigned person was actually available, no warning on double-booking, no record of why someone was chosen. Replacing this manual re-entry with a guided assignment screen is the single biggest win available to v1.

## Blocking the data model

**2. How many people per slot?** 🟡 Observed: **one instructor per class slot** (one name per cell), and **one person per desk shift**. Desk runs **two shifts per day** — an AM shift and a PM shift — not hourly slots. Still open: is it ever two people on a class or a shift, and can a desk shift be split?

**3. Is availability binary or graded?** 🔴 Legacy is yes/no, but staff are already working around it: at least one person typed **`?`** into an availability cell to mean "maybe," and the manager marks tentative assignments with **`?`** and **`*`** suffixes on names. That suggests a real need for a third state. Would "available / prefer / only if needed" make assignment materially easier, or is it over-engineering?

## Schedule template

**4. Class types.** 🟡 Now known: eight types appear in the schedule KEY (Classic, Empower, Define, Engage 30, Focus, BDTB, Align, Reform), and the type of each scheduled class is encoded **only as the cell's fill color**. Still open: does a class type restrict who may teach it (certification), and is the type fixed per time slot in the weekly template or does it vary week to week?

**5. One-off classes and events.** 🟡 Now known: these are frequent and handled by **editing the grid ad hoc** — a 2:00 PM row appears in one week only, and two weeks end at 7:00 PM instead of 7:30 PM. Still open: should the app support adding a one-off class at any date and time, and should it support changing a slot's time for a single week?

**6. Instructor limits.** 🔴 Any limits worth enforcing — max classes per week, minimum gap between shifts, earliest start time per person?

## Cycle and workflow

**7. Cycle length.** 🟡 Known: cycles are **monthly**, always start on a **Monday**, and length should be configurable. Observed: the September schedule spans **5 weeks** (8/31 through 10/4), so it starts in August and ends in October. The availability workbook for the same month is set to **6 weeks** starting **9/7**. Still open: should the app simply take a start Monday plus a week count, and how are 4- vs 5-week months handled? See also #20.

**8. Cycle calendar.** 🔴 When does availability open, what is the staff deadline, when does the manager assign, when are staff notified? Should the app enforce the deadline and remind people who have not submitted?

**9. Post-publish changes.** 🔴 What happens when someone calls out or wants to swap? Does it route through the manager, or do staff arrange it directly? The `?` and `*` annotations suggest assignments stay tentative for a while.

**10. Comments.** 🔴 What is typically written in the legacy comment area? Determines whether notes attach to a slot, a shift, a week, or the whole cycle.

## People and locations

**11. Roles.** 🟡 Known: **staff** submit availability and view assignments; a **manager** assigns. Still open: any other role — assistant manager, or an owner with read-only visibility across locations?

**12. Locations.** 🟡 Known: multiple locations are planned, each with its own staff and its own sheet today; **build for a single location first**. The two workbooks reviewed are different studios with different rosters and different active time slots. Still open: can one person work at more than one location, and do managers also teach or work desk themselves?

**13. v1 scope.** 🟡 Known: staff submit future availability and view current assignments; the manager assigns. Now clearer that v1 must also **produce the manager's schedule output**, not just collect availability. Still open: confirm that availability + assignment + published schedule view is enough to retire both workbooks on day one, or name what else is mandatory.

## Raised by the current Frisco workbooks

**14. One availability grid, two roles.** 🔴 Both roll-ups read the **same cells** from a staff member's tab, filtered only by their `Teach?` / `Desk?` capability flags. So a dual-role person appears in **both** the instructor and desk availability for the same time slot, and the manager must remember not to double-book them. Should staff state availability **per role**, or does one grid genuinely mean "available for anything I'm qualified for"?

**15. Desk shift definition.** 🔴 The desk schedule uses an **AM shift whose start time varies by day and by week** (6:45 or 7:45) and a **PM shift at 5:00** that does not run every day. Meanwhile desk **availability** is collected in the same hourly class slots as teaching, so the manager is mentally translating "available 7:30–11:30" into "can work the AM shift." What actually determines the AM start time, what are the shift end times, and which days have a PM shift?

**16. Class type as real data.** 🔴 Class type currently lives in cell color, and the palette has **drifted** — three slightly different blues and two different oranges appear where the KEY defines one of each, so even a human cannot always tell types apart. Should class type become a real field on each scheduled class, with a fixed color per type?

**17. Shorthand tokens.** 🔴 Schedule cells contain more than plain names: two-letter initials for staff who share a first name, one two-letter code that matches nobody on the roster, a trailing `?`, a trailing `*`, and one name followed by a number in parentheses. Which of these are people, and which are statuses or annotations the app should model explicitly?

**18. Rotating plan number.** 🔴 Each day of the teacher schedule carries a rotating workout plan label that advances by one per day and wraps after six. Should the app compute and display this rotation automatically from a start point?

**19. Free-text class descriptions.** 🔴 Some cells hold a class description rather than a person, and the margin holds notes about specific offerings and quarterly plans. Where should these live — a note on a scheduled class, a note on a slot, or a per-week announcement?

**20. Availability window vs published month.** 🔴 The September schedule's first week (8/31) is **not** in the September availability workbook, which starts 9/7 — so that week's availability came from the previous month's workbook. Meanwhile the September availability workbook collects two weeks (10/5, 10/12) that the October workbook will presumably collect again. How should the app define a cycle so that no week is collected twice and none is missed?

**21. Inactive staff and history.** 🔴 The roster keeps people with `Active? = FALSE` rather than deleting them, and the workbook has expanded from 25 to 40 roster slots over time. Confirm the app should deactivate rather than delete, and how far back published schedules need to stay visible.

**22. Per-person schedule view.** 🔴 The published output is a full grid for everyone. Would staff prefer a "my shifts" view, and does the manager still need the full grid for printing or posting?

---

## Legacy tool findings (context for future sessions)

Reverse-engineered from the exported workbooks and Apps Script. Raw exports live in `docs/legacy-private/` (gitignored — contains real staff names; this repo is public).

**Two workbooks per location, no link between them:**

1. **Availability workbook** (currently v5). Tabs: `Admin`, `Instructor Availability`, `Desk Availability`, one tab per staff member, plus dead tabs from earlier versions.
2. **Schedule workbook**, one per month. Tabs: a teacher grid and a desk grid. Produced by hand from the roll-ups.

**Availability model:** roster of up to 40 slots (25 named in the current file, 3 of them inactive), each flagged `Teach?` / `Desk?` / `Active?`. A template of 13 fixed time slots (5:30 AM–7:30 PM) × 7 days with a checkbox per cell controls which slots are offered, plus one variable `Special` slot per week and a 6-week special-schedule block. A cycle is one start Monday on `Admin` plus 6 week-blocks; every tab derives its dates from that cell. Each staff tab holds the week grids, a personal defaults grid, a `Use my defaults` YES/NO switch, and a free-text comment area.

**Availability marker:** the staff member's own name typed into the cell. Strictly binary, and role-agnostic.

**Roll-ups:** each cell concatenates names via a 25-term `INDIRECT(Admin!C<n> & "!" & ADDRESS(...))` chain, gated by `AND(ValidTab, Active?, Teach?)` for instructors and the desk equivalent. Because it concatenates raw cell text, typos, stray `?` marks, and double spaces all surface in the manager's view.

**Schedule model:** week × time-slot grid, one name per cell, class type by fill color, a rotating plan label per day, and ad-hoc rows for one-off times. Desk grid is AM/PM shifts with variable start times instead of hourly slots.

**`Clear` script:** loops the roster rows and either blanks the week grids or pastes the person's defaults into all of them, then wipes comments. Guarded only by an optional confirmation checkbox. No undo, no audit trail.

**Fragility the new app must eliminate:**

- Staff **name is the primary key**; `ValidTab?` is `INDIRECT(name & "!A1")` error-checked, so a rename or a trailing space silently removes a person from the roll-ups.
- Drift already exists in both directions: roster entries with no tab (invisible, and skipped by `Clear`), and orphaned tabs absent from the roster.
- Name collisions already worked around with initials, which then leak into the schedule as ambiguous two-letter codes.
- Typos survive silently because the marker is free text — the same person appears under two spellings in the roll-up.
- `#REF!` errors present in staff tabs and roll-ups; one legacy tab is entirely `#REF!`.
- Staff tabs are unprotected, so anyone can overwrite anyone's availability with no history.
- Assignment is manual re-entry into a different file, with no validation against availability or against double-booking.
- Class type is encoded as color, and the palette has drifted so types are visually ambiguous.
- Hard caps enforced by "do not add or delete rows or columns."

**Primary complaint from Warren:** it feels overly technical, and it is possible for one person to break everyone's data.

---

## Working agreement

- Revisit this file whenever MSS product design or scheduling features come up.
- Report the scoreboard, then ask follow-ups on 🔴 and 🟡 items — prioritizing 2, 3, 14, 15, and 20.
- Update status and record answers inline as they arrive. Do not delete answered questions; they are the requirements record.
- Do not start building scheduling features while 2, 3, 14, and 15 are unresolved — they determine the data model.
