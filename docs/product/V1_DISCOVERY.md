# MSS v1 — discovery questions (open until answered)

**Purpose:** Requirements gathering for the studio scheduler that replaces the legacy Google Sheet. The agent must keep asking follow-ups until every question below is **Answered** or explicitly marked **Not relevant** by Warren. Answers may take weeks — Warren is reviewing with studio staff.

**Status legend:** 🔴 Open · 🟡 Partial · 🟢 Answered · ⚪ Not relevant

**Last review:** 2026-08-20

---

## Scoreboard

| # | Topic | Status |
|---|-------|--------|
| 1 | Where the finished assignment is recorded today | 🔴 |
| 2 | People required per class slot and per desk slot | 🔴 |
| 3 | Availability binary vs graded | 🔴 |
| 4 | Class types and whether they gate who can teach | 🔴 |
| 5 | One-off classes and events beyond the single `Special` slot | 🔴 |
| 6 | Per-instructor limits (max classes, rest gaps, earliest start) | 🔴 |
| 7 | Cycle length vs calendar months | 🟡 |
| 8 | Cycle calendar: open, deadline, assign, publish, reminders | 🔴 |
| 9 | Post-publish changes: call-outs, swaps, subs | 🔴 |
| 10 | What belongs in comments, and at what level | 🔴 |
| 11 | Roles beyond staff and manager | 🟡 |
| 12 | One person at multiple locations; do managers also work shifts | 🟡 |
| 13 | Minimum v1 scope to retire the sheet | 🟡 |

---

## Blocking the data model

**1. Where does the assignment go today?** After reading the availability roll-ups, does the manager type the schedule into another sheet, into studio software (Club Ready / ABC / similar), print it, or post it somewhere? The legacy `Master v2 old` tab looks like a retired version of this and is entirely `#REF!`. The current output format defines what the app must produce.

**2. How many people per slot?** Is a class always exactly one instructor? For desk, how many people per slot — and is desk staffed in the same 13 one-hour slots as classes, or in longer blocks (open-to-noon)? Desk coverage likely does not map onto class times.

**3. Is availability binary or graded?** Legacy is yes/no. Would "available / prefer / only if needed" make assignment materially easier, or is it over-engineering?

## Schedule template

**4.** `Class Type` and `Active` columns exist in the legacy template but are empty. Aspirational? Do you want named class types, and should a type restrict who may teach it (certification required)?

**5.** Legacy allows one variable `Special` slot per week with a title. Enough, or do you need arbitrary one-off classes and events on any date?

**6.** Any instructor limits worth enforcing — max classes per week, minimum gap between shifts, "never before 8 AM"?

## Cycle and workflow

**7.** 🟡 Known: cycles are typically **monthly**, always start on a **Monday**, and length should be **configurable**. Legacy hardcodes **6 weeks**. Still open: how to handle 4- vs 5-week months, whether cycles may overlap, and whether the app should simply take a start Monday plus a week count.

**8.** Walk through a cycle calendar: when availability opens, staff deadline, when the manager assigns, when staff are notified. Should the app enforce the deadline and remind people who have not submitted?

**9.** After publishing, what happens when someone calls out or wants to swap? Does it route through the manager, or do staff arrange it directly?

**10.** What is typically written in the legacy comment area (columns I–S)? Determines whether notes attach to a slot, a week, or the whole cycle.

## People and locations

**11.** 🟡 Known: **staff** log in to submit availability and view assignments; a **manager** assigns. Still open: any other role — assistant manager, owner with read-only visibility across locations?

**12.** 🟡 Known: multiple locations are planned, each with its own staff; **build for a single location first**. Still open: can one person work at more than one location, and do managers also teach or work desk themselves?

**13.** 🟡 Known: two primary staff use cases — submit future availability, view current assignment. Still open: confirm that availability collection + manager assignment + published schedule view is enough to retire the sheet on day one, or name what else is mandatory.

---

## Legacy tool findings (context for future sessions)

Reverse-engineered from the exported workbook and Apps Script. Raw exports live in `docs/legacy-private/` (gitignored — contains real staff names; this repo is public).

**Shape:** one Google Sheet per location. 31 tabs: `Admin`, `Instructor Availability`, `Desk Availability`, one tab per staff member, plus dead tabs from earlier versions.

**Model:** roster capped at 25 people, each flagged `Teach?` / `Desk?` / `Active?`. Template of 13 fixed time slots (5:30 AM–7:30 PM) × 7 days with a checkbox per cell, plus one variable `Special` slot per week and a 6-week special-schedule block. A cycle is one start Monday on `Admin` plus 6 week-blocks; every tab derives dates from that cell. Each staff tab holds 6 week grids, a personal defaults grid, a `Use my defaults` YES/NO switch, and a free-text comment area.

**Availability marker:** the staff member's own name typed into the cell. Strictly binary.

**Roll-ups:** each cell concatenates names via a 25-term `INDIRECT(Admin!C<n> & "!" & ADDRESS(...))` chain, gated by `Admin!H` = `AND(ValidTab, Active?, Teach?)` for instructors and `Admin!I` for desk.

**`Clear` script:** loops the 25 roster rows and either blanks the six week grids or pastes the person's defaults into all six, then wipes comments. Guarded only by an optional confirmation checkbox. No undo, no audit trail.

**Fragility that the new app must eliminate:**

- Staff **name is the primary key**; `ValidTab?` is `INDIRECT(name & "!A1")` error-checked, so a rename or trailing space silently removes a person from the roll-ups.
- Drift already exists in both directions: two roster entries have no tab (invisible, and skipped by `Clear`), and five tabs are orphaned from the roster.
- Name collisions already worked around with initials (three staff share one first name, two share another).
- `#REF!` errors present in a staff tab and in `Instructor Availability`; one legacy tab is entirely `#REF!`.
- Staff tabs are unprotected, so anyone can overwrite anyone's availability with no history.
- Hard caps enforced by "do not add or delete rows or columns": 25 people, 13 slots, 6 weeks, one special slot.

**Primary complaint from Warren:** it feels overly technical, and it is possible for one person to break everyone's data.

---

## Working agreement

- Revisit this file whenever MSS product design or scheduling features come up.
- Report the scoreboard, then ask follow-ups on 🔴 and 🟡 items — starting with 1–3.
- Update status and record answers inline as they arrive. Do not delete answered questions; they are the requirements record.
- Do not start building scheduling features until 1–3 are 🟢 or ⚪.
