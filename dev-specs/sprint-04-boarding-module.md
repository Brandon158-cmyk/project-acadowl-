# Acadowl — Sprint 04: Boarding Module

## Development Guide & Issue Tracker

> **Sprint Goal:** Build the complete residential management system for boarding and mixed schools. By the end of this sprint, a matron can manage the entire hostel from her phone — assigning beds, taking night prep roll call offline, admitting a sick student to the sick bay with a single SMS firing to their guardian, logging visitors at the gate, and tracking a student's pocket money trust account to the last ngwee. The boarding module integrates seamlessly with every previous sprint: bed assignments are term-scoped like invoices, sick bay admissions create `sickBayVisitsThisTerm` entries in the progress snapshot, pocket money deposits go through the same mobile money pipeline as fee payments, and boarding-specific parent messages flow through the Sprint 03 messaging threads. Nothing built in Sprints 00–03 changes. Everything connects.

---

## 📋 Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [Continuity from Sprints 00–03](#continuity-from-sprints-0003)
3. [Forward-Compatibility Commitments](#forward-compatibility-commitments)
4. [Boarding School Reality in Zambia](#boarding-school-reality-in-zambia)
5. [Epic 1 — Hostel Infrastructure Setup](#epic-1--hostel-infrastructure-setup)
6. [Epic 2 — Bed Assignment System](#epic-2--bed-assignment-system)
7. [Epic 3 — Night Prep Attendance](#epic-3--night-prep-attendance)
8. [Epic 4 — Meal Plans & Dietary Management](#epic-4--meal-plans--dietary-management)
9. [Epic 5 — Visitor Management & Gate Control](#epic-5--visitor-management--gate-control)
10. [Epic 6 — Exeat & Leave Pass System](#epic-6--exeat--leave-pass-system)
11. [Epic 7 — Sick Bay Management](#epic-7--sick-bay-management)
12. [Epic 8 — Pocket Money Trust Accounts](#epic-8--pocket-money-trust-accounts)
13. [Epic 9 — Boarding Fee Integration](#epic-9--boarding-fee-integration)
14. [Epic 10 — Conduct & Discipline Log](#epic-10--conduct--discipline-log)
15. [Epic 11 — Matron & Warden Interface](#epic-11--matron--warden-interface)
16. [Epic 12 — Boarding Analytics & Reports](#epic-12--boarding-analytics--reports)
17. [Epic 13 — Guardian Portal — Boarding Section](#epic-13--guardian-portal--boarding-section)
18. [Dependency Graph](#dependency-graph)
19. [Schema Additions in This Sprint](#schema-additions-in-this-sprint)
20. [Definition of Done](#definition-of-done)
21. [Sprint 04 → Sprint 05 Handoff Checklist](#sprint-04--sprint-05-handoff-checklist)

---

## Sprint Overview

| Field             | Value                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Sprint Name**   | Sprint 04 — Boarding Module                                                                                            |
| **Duration**      | 6 weeks                                                                                                                |
| **Team Size**     | 3–4 developers                                                                                                         |
| **Total Issues**  | 46                                                                                                                     |
| **Feature Gates** | `Feature.BOARDING` (core) · `Feature.POCKET_MONEY` · `Feature.SICK_BAY` · `Feature.VISITOR_LOG` · `Feature.MEAL_PLANS` |
| **Prerequisite**  | Sprint 03 complete and all handoff checks passed                                                                       |

### Sprint Epics at a Glance

| #   | Epic                               | Issues | Est. Days |
| --- | ---------------------------------- | ------ | --------- |
| 1   | Hostel Infrastructure Setup        | 4      | 3         |
| 2   | Bed Assignment System              | 5      | 5         |
| 3   | Night Prep Attendance              | 4      | 4         |
| 4   | Meal Plans & Dietary Management    | 3      | 3         |
| 5   | Visitor Management & Gate Control  | 4      | 4         |
| 6   | Exeat & Leave Pass System          | 3      | 3         |
| 7   | Sick Bay Management                | 5      | 5         |
| 8   | Pocket Money Trust Accounts        | 6      | 6         |
| 9   | Boarding Fee Integration           | 3      | 2         |
| 10  | Conduct & Discipline Log           | 3      | 3         |
| 11  | Matron & Warden Interface          | 4      | 4         |
| 12  | Boarding Analytics & Reports       | 4      | 3         |
| 13  | Guardian Portal — Boarding Section | 4      | 4         |

---

## Continuity from Sprints 00–03

Every item below is a direct dependency. Verify each before writing any Sprint 04 code.

| Deliverable                                                                                                                                                | How Sprint 04 Uses It                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `hostelBlocks`, `rooms`, `beds`, `sickBayAdmissions`, `visitorLog`, `pocketMoneyAccounts`, `pocketMoneyTransactions` skeleton tables (Sprint 00 ISSUE-008) | Sprint 04 fully implements these tables — fields already valid                                   |
| `students.boardingStatus`, `students.currentBedId`, `students.boardingHouseId`, `students.mealPlanType` (Sprint 00 ISSUE-007)                              | All boarding fields pre-placed — no schema changes to `students`                                 |
| `Feature.BOARDING`, `Feature.POCKET_MONEY`, `Feature.SICK_BAY`, `Feature.VISITOR_LOG`, `Feature.MEAL_PLANS` flags (Sprint 00 ISSUE-023)                    | Every route, mutation, and nav item gated on these flags                                         |
| `attendance` table with `period` field accepting strings (Sprint 01 ISSUE-066)                                                                             | Night prep attendance stored as `period: 'night_prep'` in the same table                         |
| Night prep attendance scaffold: `/(admin)/boarding/night-prep/page.tsx` stub (Sprint 01 ISSUE-068)                                                         | Sprint 04 fully implements this page — route already exists                                      |
| `sendSms` action and `notifications` table (Sprint 01 ISSUE-072, 075)                                                                                      | Sick bay admission SMS, visitor arrival SMS, pocket money receipt SMS all use this               |
| `generateInvoiceForStudent` with `overrideLineItems` param (Sprint 02 ISSUE-095)                                                                           | Sprint 04 adds boarding fee line items via `overrideLineItems` — function unchanged              |
| `creditNotes` with `type: 'boarding_adjustment'` (Sprint 02 ISSUE-115)                                                                                     | Mid-term boarding status changes generate prorated credit notes via this existing flow           |
| `pendingPayments` table with `paymentContext` field (Sprint 03 ISSUE-146)                                                                                  | Pocket money mobile top-ups use `paymentContext: 'pocket_money'`                                 |
| `initiateAirtelMoneyPayment` / `initiateMtnMomoPayment` actions (Sprint 03 ISSUE-146, 147)                                                                 | Guardian tops up pocket money using the exact same actions — no changes needed                   |
| `messageThreads` with `context: 'boarding'` (Sprint 03 ISSUE-150)                                                                                          | Matron→guardian messages create threads with this context value                                  |
| `announcements` with `category: 'hostel'` and `targetAudience: 'boarding_parents'` (Sprint 03 ISSUE-156)                                                   | Boarding-specific announcements use these values — created in this sprint                        |
| `guardians.notificationPreferences.sickBayAdmission`, `.visitorArrival`, `.pocketMoneyWithdrawal`, `.nightPrepAbsent` (Sprint 03 ISSUE-161)                | All four fields defined — Sprint 04 writes to them as notification triggers                      |
| `studentProgressSnapshots.nightPrepAttendancePercent`, `.sickBayVisitsThisTerm` (Sprint 03 ISSUE-136)                                                      | Sprint 04 Friday cron populates these null fields — Sprint 07 at-risk engine reads them          |
| `counters` table (Sprint 01 ISSUE-048)                                                                                                                     | Visitor log reference numbers use key `visitor_log_{year}` — same counter pattern                |
| Student ID card barcode (Sprint 01 ISSUE-051)                                                                                                              | Visitor check-in scans the student's barcode to look them up instantly                           |
| `transfers.initiateTransferOut` (Sprint 01 ISSUE-053)                                                                                                      | Clears `student.currentBedId` — Sprint 04 must ensure the bed is marked available when this runs |

---

## Forward-Compatibility Commitments

Decisions made in Sprint 04 that future sprints depend on without modification.

| Decision                                                                                                                                                                                                         | Future Sprint Dependency                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`pocketMoneyAccounts` persist across terms** — balance carries forward at term end, not zeroed                                                                                                                 | Sprint 07 financial analytics reads lifetime pocket money flow. No term-reset logic to undo.                                                                                                  |
| **`conductLog` entries have `severity` and `category` fields** defined as open enums                                                                                                                             | Sprint 07 at-risk engine reads conduct severity as one of its five risk indicators. The field must exist from Sprint 04.                                                                      |
| **Sick bay admissions feed `studentProgressSnapshots.sickBayVisitsThisTerm`** via the Friday cron                                                                                                                | Sprint 07 at-risk engine treats high sick-bay frequency as a proxy for health/welfare concerns.                                                                                               |
| **`bedAssignments` is a separate history table** (not just `students.currentBedId`)                                                                                                                              | Sprint 07 MoE boarding capacity reports read `bedAssignments` for historical occupancy data — not just the current snapshot.                                                                  |
| **Meal `dietaryFlags` array is open-ended**                                                                                                                                                                      | When a school adds a custom dietary requirement (e.g., "Celiac"), it is added to the array without schema migration.                                                                          |
| **Exeat pass PDF uses the same `studentDocuments` table** as report cards and transfer letters                                                                                                                   | Guardian portal (Sprint 03) already shows the documents tab. Exeat PDFs appear there automatically with no UI change.                                                                         |
| **`visitorLog` stores `studentId` on every entry**                                                                                                                                                               | Sprint 07 can detect unusual visitor patterns (e.g., student receiving many visitors during exam period) as a welfare flag.                                                                   |
| **Boarding-specific message threads are `context: 'boarding'`** and use the Sprint 03 message schema                                                                                                             | Sprint 03 parent portal inbox already renders these threads correctly. No UI changes needed in the guardian portal.                                                                           |
| **`nightPrepSessions` table is separate from the `attendance` table for night prep records** — wait, no: night prep IS stored in the `attendance` table with `period: 'night_prep'`. This decision is permanent. | Sprint 07 at-risk engine uses `attendance` table queries with `period: 'night_prep'` filter. No separate table to reconcile.                                                                  |
| **Pocket money `weeklyLimitZMW` is stored per student** on `pocketMoneyAccounts`, not per school                                                                                                                 | Different students can have different weekly limits (e.g., Grade 12 students get higher limits). Sprint 07 financial analytics can surface students exceeding their limits as a welfare flag. |

---

## Boarding School Reality in Zambia

Essential context every developer must understand before building this sprint.

### School Types in Scope

This module applies to schools with `type` in: `boarding_primary`, `boarding_secondary`, `mixed_secondary`, and optionally `college`. The `mixed_secondary` case is the most complex — some students board, some are day students, and the system must keep them cleanly separated at every level.

### The Matron Role

In Zambian boarding schools, the matron (female hostel staff) or warden (male hostel staff) is the primary day-to-day residential manager. They are NOT IT-literate in the traditional sense — they use basic Android phones. Every interface they touch must be:

- Operable with one hand while walking through a dormitory
- Functional on Airtel's variable 3G signal (offline-first for night prep roll call)
- Readable in low-light conditions (night prep happens at 18:00–20:00)
- Free of confirmation dialogs that interrupt rapid data entry

### Physical Hierarchy

```
School
└── Hostel Block (e.g., "Livingstone House" — Boys, "Chipembere House" — Girls)
    └── Room / Dormitory (e.g., "Room 14", "Dormitory A")
        └── Bed (e.g., "Bed 1A", "Bed 1B", "Upper Bunk")
```

A typical Zambian boarding school room holds 4–8 students in bunk beds. A dormitory may hold 20–40 students in a single open room. Both configurations must be supported.

### Pocket Money Reality

Most Zambian boarding schools operate a **trust account** system: parents send money to the school, and the school disburses it to students in controlled weekly amounts. This prevents:

- Students spending all money in the first week
- Students being robbed of cash
- Uncontrolled tuck shop spending
  The matron or bursar holds the "key" — a student cannot withdraw without presenting to a designated staff member.

### Visitor Security Context

Security at boarding schools in Zambia is taken seriously. Every visitor must be logged at the gate. Many schools require the visitor's NRC (National Registration Card). An unauthorised visitor who is not on the student's approved list triggers an alert to the guardian. Exeat (official leave pass) is required for a student to leave school grounds overnight.

---

## Epic 1 — Hostel Infrastructure Setup

> **Goal:** Configure the physical residential infrastructure of the school. Every bed must be mapped in the system before any student can be assigned to it.

---

### ISSUE-168 · Hostel Block Management

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 1 day

#### Description

Create and manage hostel blocks — the top-level residential unit of a boarding school. Each block has a gender designation, a warden/matron assigned to it, and a capacity.

#### User Story

> As a school admin at Chengelo Secondary, I set up our two hostel blocks: "Livingstone House" (boys, capacity 180, Warden Mr. Tembo) and "Nightingale House" (girls, capacity 165, Matron Mrs. Mwale). Each block has floors 1 and 2, with multiple rooms per floor.

#### Acceptance Criteria

**Backend — `convex/boarding/hostels.ts`:**

- [ ] `createHostelBlock` mutation:
  - Args: `{ name, gender: 'boys' | 'girls' | 'mixed', wardenStaffId?, capacity, description?, floorCount? }`
  - Validates `wardenStaffId` belongs to the school and has role `matron` or `school_admin`
  - Validates `Feature.BOARDING` is enabled
  - Sets `hostelBlocks.isActive: true`
  - Requires `requirePermission(ctx, Permission.MANAGE_HOSTELS)`
- [ ] `updateHostelBlock` mutation: rename, reassign warden, update capacity, activate/deactivate
- [ ] `assignWardenToBlock` mutation:
  - Sets `hostelBlocks.wardenStaffId`
  - Also writes `staff.managedHostelBlockId` (schema addition to `staff`) — so matron's dashboard auto-loads their block
  - If block already has a warden: sends in-app notification to old warden that they've been reassigned
- [ ] `getHostelBlocks` query: all blocks for school with room count, bed count, current occupancy
- [ ] `getHostelBlockDashboard` query:
  - Returns: block details, rooms with occupancy, warden info, current term's assigned students
  - Used by warden's home screen (Epic 11)

**Schema additions to `hostelBlocks` (expanding Sprint 00 skeleton):**

```typescript
// Additional fields beyond Sprint 00 skeleton
description: v.optional(v.string()),
floorCount: v.optional(v.number()),
isActive: v.boolean(),
wardenPhone: v.optional(v.string()),    // Warden's direct phone — shown on emergency contacts
emergencyProcedures: v.optional(v.string()), // Free text: fire exit locations, assembly point
createdAt: v.number(),
updatedAt: v.number(),
```

**Frontend — `/(admin)/boarding/hostels/page.tsx`:**

- [ ] Grid of hostel block cards: name, gender badge, capacity/occupancy bar, warden name
- [ ] "Add Hostel Block" button → modal form
- [ ] Click block card → block detail page with room list
- [ ] Warden assignment: search staff by name → assign
- [ ] Occupancy summary: "142/180 beds occupied this term" with percentage ring
- [ ] Feature guard wrapper: entire page hidden (not just empty) if `Feature.BOARDING` is off

---

### ISSUE-169 · Room and Dormitory Management

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 1 day

#### Description

Create and manage rooms within a hostel block. A room can be a standard numbered bedroom (4–8 students) or an open dormitory (20–40 students). The room type determines how beds are labelled and displayed.

#### Acceptance Criteria

**Backend — `convex/boarding/rooms.ts`:**

- [ ] `createRoom` mutation:
  - Args: `{ hostelBlockId, name, roomType: 'bedroom' | 'dormitory' | 'private', capacity, floor?, notes? }`
  - `bedroom`: standard room, 4–8 students, beds numbered 1–N
  - `dormitory`: open hall, 20–40 students, beds labelled by row/column (e.g., "A1", "A2", "B1")
  - `private`: single occupancy — for prefects, sick isolation, matron-in-residence
  - Auto-creates `capacity` number of bed records after room creation
  - Requires `requirePermission(ctx, Permission.MANAGE_HOSTELS)`
- [ ] `updateRoom` mutation: rename, change capacity (with validation — cannot reduce below current occupancy), change floor
- [ ] `deactivateRoom` mutation: blocks new assignments; cannot deactivate if occupied beds exist
- [ ] `getRoomsForBlock` query: all rooms in a block with per-room occupancy status
- [ ] `getRoomWithBeds` query: room details + all beds with current occupant name, photo, grade

**Schema additions to `rooms` (expanding Sprint 00 skeleton):**

```typescript
floor: v.optional(v.number()),
notes: v.optional(v.string()),           // e.g., "Corner room — good ventilation"
createdAt: v.number(),
updatedAt: v.number(),
```

**Frontend — `/(admin)/boarding/hostels/[blockId]/page.tsx`:**

- [ ] Room list grouped by floor (if floorCount > 1)
- [ ] Each room card: name, type badge, capacity, occupancy count, occupied/available color band
- [ ] "Add Room" button — opens form (inside block context, `hostelBlockId` pre-filled)
- [ ] Room card → navigates to room detail view with bed map (ISSUE-170)
- [ ] Bulk "Add Rooms" shortcut: "Add 10 rooms on Floor 2, capacity 6 each" — creates rooms + beds in one action

---

### ISSUE-170 · Bed Registry and Visual Room Map

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 1 day

#### Description

Create individual bed records and present them as a visual interactive floor plan — the primary interface for bed assignment. Each bed has a label, a position (for the visual map), and knows whether it is occupied, available, or inactive.

#### Acceptance Criteria

**Backend — `convex/boarding/beds.ts`:**

- [ ] `createBedsForRoom` mutation:
  - Auto-creates N bed records for a room (N = room capacity)
  - Labels for `bedroom` type: "Bed 1", "Bed 2", ... or "Upper Bunk 1" / "Lower Bunk 1" if bunk beds
  - Labels for `dormitory` type: "A1", "A2", ..., "B1", "B2" (row/column grid)
  - Labels for `private` type: "Bed 1" (single)
  - Sets `position: { row, col }` for each bed (for visual map rendering)
- [ ] `updateBedLabel` mutation: rename a bed (e.g., correct a labelling error)
- [ ] `deactivateBed` mutation: marks bed as unavailable (broken, under repair) — frees it from assignment pool
- [ ] `reactivateBed` mutation: marks bed as available again
- [ ] `getBedsForRoom` query: all beds with occupant info (name, grade, photo, bedAssignment term)
- [ ] `getAvailableBedsForBlock` query:
  - Returns all unoccupied, active beds in a block
  - Grouped by room
  - Accepts `gender` filter (for mixed-block edge cases)
  - Used by the bed assignment search (ISSUE-172)

**Schema additions to `beds` (expanding Sprint 00 skeleton):**

```typescript
position: v.optional(v.object({ row: v.number(), col: v.number() })),
bunkPosition: v.optional(v.union(v.literal('upper'), v.literal('lower'), v.literal('single'))),
notes: v.optional(v.string()),  // "Broken rail" / "Near window"
createdAt: v.number(),
```

**Frontend — `/(admin)/boarding/hostels/[blockId]/rooms/[roomId]/page.tsx`:**

- [ ] Visual bed map: CSS grid rendered from `position.row` and `position.col`
  - Each bed cell shows: bed label, occupant photo (32px) + name, grade
  - Empty bed: green outline, "Available" label
  - Occupied bed: blue fill with student photo
  - Inactive bed: gray fill with "Unavailable" label
  - Clicking a bed: opens assignment panel (assign, reassign, or unassign)
- [ ] Bunk bed view: stacked upper/lower beds rendered with visual distinction
- [ ] "Print Room List" button: generates printable PDF of the room with all occupant names
- [ ] Real-time: Convex subscriptions mean if another admin assigns a bed simultaneously, the map updates immediately

---

### ISSUE-171 · Boarding Status Configuration for Mixed Schools

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

Mixed secondary schools have both day and boarding students. The system must handle: initial boarding status at enrolment, mid-term status changes, and the resulting fee and bed assignment impacts. Day students must be completely invisible to all hostel interfaces.

#### User Story

> A student at Munali Boys enrols as a day student in Grade 11. Halfway through Term 1, his parents request he becomes a boarder. The admin changes his status, the system calculates the prorated boarding fee for the remaining term days, generates a supplementary invoice, and prompts for bed assignment.

#### Acceptance Criteria

**Backend — `convex/boarding/statusChange.ts`:**

- [ ] `changeBoardingStatus` mutation:
  - Args: `{ studentId, newStatus: 'day' | 'boarding', effectiveDate: string, reason: string }`
  - Requires `requirePermission(ctx, Permission.EDIT_STUDENT)`
  - **Day → Boarding:**
    1. Updates `student.boardingStatus: 'boarding'`
    2. Calculates proration factor: remaining term school days / total term school days
    3. Calls `generateInvoiceForStudent` with boarding fee override items and `prorationFactor`
    4. Returns `{ invoiceId, bedAssignmentRequired: true }` — admin prompted to assign a bed next
    5. Creates a `boardingStatusHistory` record
  - **Boarding → Day:**
    1. Updates `student.boardingStatus: 'day'`
    2. Clears `student.currentBedId` and marks the bed as available in `beds` table
    3. Closes `bedAssignments` record: sets `toDate` to `effectiveDate`
    4. Calculates unused boarding days, creates a `creditNote` with `type: 'boarding_adjustment'` for the prorated refund
    5. If student has a pocket money balance, prompts admin: "Chanda has ZMW 145 in their pocket money account. Refund to guardian or carry forward?"
    6. Creates a `boardingStatusHistory` record

- [ ] `getBoardingStatusHistory` query: full history of boarding status changes for a student with dates, reasons, and prorated amounts

**Schema addition:**

```typescript
boardingStatusHistory: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  fromStatus: v.union(v.literal('day'), v.literal('boarding')),
  toStatus: v.union(v.literal('day'), v.literal('boarding')),
  effectiveDate: v.string(),
  reason: v.string(),
  proratedInvoiceId: v.optional(v.id('invoices')),
  proratedCreditNoteId: v.optional(v.id('creditNotes')),
  changedBy: v.id('users'),
  createdAt: v.number(),
})
  .index('by_student', ['studentId'])
  .index('by_school', ['schoolId']);
```

**Frontend:**

- [ ] Student profile boarding status badge is now clickable: opens "Change Boarding Status" modal
- [ ] Modal shows: current status, new status radio, effective date, reason, prorated amount preview before confirming
- [ ] Mixed school student list filter: "Day" / "Boarding" filter chips now functional (data exists)

---

## Epic 2 — Bed Assignment System

> **Goal:** A fast, visual bed assignment system that makes it easy to place 200 boarding students at the start of each term — and handle the ongoing shuffles, swaps, and special requests throughout the year.

---

### ISSUE-172 · Bed Assignment — Core Logic

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 1 day

#### Description

The core bed assignment engine. A bed assignment is a term-scoped record linking a student to a specific bed for a specific term. This is separate from `students.currentBedId` (which is the shortcut pointer) — the `bedAssignments` table is the authoritative history.

#### Acceptance Criteria

**Schema addition — `bedAssignments` (full implementation of Sprint 00 skeleton `beds` logic):**

```typescript
bedAssignments: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  bedId: v.id('beds'),
  roomId: v.id('rooms'),
  hostelBlockId: v.id('hostelBlocks'),
  termId: v.id('terms'),
  academicYearId: v.id('academicYears'),
  fromDate: v.string(), // 'YYYY-MM-DD' — term start or mid-term change date
  toDate: v.optional(v.string()), // null = currently assigned; set when vacated
  reason: v.union(
    v.literal('initial_assignment'),
    v.literal('student_request'),
    v.literal('matron_reassignment'),
    v.literal('disciplinary'),
    v.literal('medical'), // e.g., moved near sick bay
    v.literal('boarding_status_change'),
    v.literal('room_deactivated'),
  ),
  assignedBy: v.id('users'),
  notes: v.optional(v.string()),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_student_term', ['studentId', 'termId'])
  .index('by_bed_term', ['bedId', 'termId'])
  .index('by_block_term', ['hostelBlockId', 'termId']);
```

**Backend — `convex/boarding/bedAssignments.ts`:**

- [ ] `assignStudentToBed` mutation:
  - Validates student has `boardingStatus: 'boarding'`
  - Validates bed is active and not currently assigned for this term
  - Validates bed's block gender matches student gender (error if mismatch, warning if block is 'mixed')
  - Closes any existing open assignment for this student in this term: sets `toDate = today`
  - Creates new `bedAssignments` record
  - Updates `students.currentBedId` and `students.boardingHouseId` as shortcut pointers
  - Updates `beds.currentStudentId` and `beds.currentTermId`
  - Requires `requirePermission(ctx, Permission.ASSIGN_BEDS)`

- [ ] `unassignStudentFromBed` mutation:
  - Closes `bedAssignments` record with `toDate = today`
  - Clears `students.currentBedId`
  - Clears `beds.currentStudentId`
  - Used by: transfer out (Sprint 01), boarding→day change (ISSUE-171), term end rollover (ISSUE-174)

- [ ] `getBedAssignmentForStudent` query: current assignment for a student in active term
- [ ] `getAssignmentHistoryForStudent` query: all bed assignments across all terms
- [ ] `getUnassignedBoardingStudents` query: boarding students with no bed assignment for current term
  - Returns: student name, grade, gender, photo — sorted by grade
  - Used by the assignment dashboard to show "needs bed" list

---

### ISSUE-173 · Bulk Bed Assignment Interface

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 1.5 days

#### Description

At the start of each term, admin or matron assigns beds to 100–200 boarding students at once. This interface must be fast, visual, and handle both mass assignment (assign everyone to the same block as last term) and individual overrides.

#### User Story

> It is the start of Term 1. The matron opens the bed assignment page. She sees 187 boarding students without beds. She clicks "Re-assign from Last Term" — the system auto-assigns each student to the same bed they had in Term 3 of the previous year, where available. 174 are assigned instantly. 13 need manual assignment (new students, students whose rooms were reorganised). She assigns the remaining 13 from the visual room map.

#### Acceptance Criteria

**Backend — `convex/boarding/bedAssignments.ts` (additions):**

- [ ] `bulkReassignFromPreviousTerm` mutation:
  - Looks up each boarding student's last `bedAssignments` record from the previous term
  - If the bed is still active and unoccupied for the current term: re-assigns
  - If bed is occupied or inactive: adds student to the "needs manual assignment" list
  - Runs in batches of 50 (Convex action timeout protection)
  - Returns `{ assigned, needsManual: Student[], errors }`
  - Requires `requirePermission(ctx, Permission.ASSIGN_BEDS)`

- [ ] `bulkAssignByBlock` mutation:
  - Assigns all unassigned students of a given gender to available beds in a specified block
  - Auto-fills from first available bed downward
  - Returns how many were assigned and how many couldn't be placed (block full)

**Frontend — `/(admin)/boarding/assignments/page.tsx`:**

- [ ] Two-panel layout:
  - **Left panel**: "Unassigned Students" list — photo, name, grade, gender, filterable
  - **Right panel**: Hostel block selector → room map (from ISSUE-170)
- [ ] Drag-and-drop: drag student from left panel onto a bed cell in right panel → assigns them
- [ ] Click-to-assign: click a student → click a bed → assigns (for touch/mobile matron use)
- [ ] "Re-assign from Last Term" button: triggers `bulkReassignFromPreviousTerm` — shows progress
- [ ] After re-assign: unassigned students list refreshes showing only those who need manual placement
- [ ] Status bar: "174/187 boarding students assigned — 13 remaining"
- [ ] Filter unassigned list: by block affinity (e.g., "Girls in Grade 10"), by grade, by first letter of surname
- [ ] Export assignment list: PDF of all assignments per block for printing and posting on hostel notice board

---

### ISSUE-174 · Term-End Bed Rollover

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

At term end, bed assignments are "closed" for the completed term. Students are NOT automatically assigned beds for the next term — the matron must actively run the next-term assignment (with "Re-assign from Last Term" as the shortcut). This ensures intentional review each term.

#### Acceptance Criteria

- [ ] `rolloverBedsForTermEnd` internal mutation — called by the `closeTerm` admin action (Sprint 01 ISSUE-042 `activateTerm` triggers this):
  - Closes all open `bedAssignments` records: sets `toDate` to term end date
  - Does NOT clear `students.currentBedId` — the shortcut remains until new term's assignments are made
  - Creates a snapshot: `bedOccupancySnapshot` record (schema below) capturing the final state of every bed for the completed term
  - Runs within the existing `activateTerm` mutation transaction — no extra UI needed

- [ ] `bedOccupancySnapshots` schema:

  ```typescript
  bedOccupancySnapshots: defineTable({
    schoolId: v.id('schools'),
    termId: v.id('terms'),
    snapshotDate: v.string(),
    totalBeds: v.number(),
    occupiedBeds: v.number(),
    occupancyRate: v.number(), // Percentage
    byBlock: v.array(
      v.object({
        blockId: v.id('hostelBlocks'),
        blockName: v.string(),
        totalBeds: v.number(),
        occupiedBeds: v.number(),
      }),
    ),
    createdAt: v.number(),
  }).index('by_school_term', ['schoolId', 'termId']);
  ```

- [ ] `getUnassignedCountForNewTerm` query: count of boarding students who need beds for the new term — shown as a badge on boarding nav item as soon as new term activates

---

### ISSUE-175 · Bed Swap Requests

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 1 day

#### Description

Students or their guardians can request a bed change — to be near a friend, away from a bully, or for a medical reason. Matrons review and approve or decline requests.

#### Acceptance Criteria

**Schema addition:**

```typescript
bedSwapRequests: defineTable({
  schoolId: v.id('schools'),
  requestingStudentId: v.id('students'),
  currentBedId: v.id('beds'),
  preferredBedId: v.optional(v.id('beds')), // Specific bed requested, or null for any in block
  preferredBlockId: v.optional(v.id('hostelBlocks')),
  reason: v.string(),
  requestedBy: v.union(v.literal('student'), v.literal('guardian'), v.literal('matron')),
  requestedByUserId: v.id('users'),
  status: v.union(
    v.literal('pending'),
    v.literal('approved'),
    v.literal('declined'),
    v.literal('withdrawn'),
  ),
  reviewedBy: v.optional(v.id('users')),
  reviewNote: v.optional(v.string()),
  reviewedAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_student', ['requestingStudentId']);
```

**Backend:**

- [ ] `submitBedSwapRequest` mutation: creates request, notifies matron in-app
- [ ] `approveBedSwapRequest` mutation:
  - Calls `assignStudentToBed` with the approved bed
  - Sends SMS to guardian: "Chanda's room change request has been approved. New bed: Room 14, Bed 3."
- [ ] `declineBedSwapRequest` mutation: sends SMS with reason

**Frontend:**

- [ ] Matron's bed swap request queue on boarding dashboard
- [ ] Guardian portal (Epic 13): "Request room change" button on child's boarding tab
- [ ] Student portal: "Request room change" button (if school allows student requests)

---

### ISSUE-176 · Bed Occupancy Map — Admin Overview

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

A school-wide bird's-eye view of all hostel blocks and their current occupancy. Useful for the head teacher and admin to see capacity at a glance.

#### Acceptance Criteria

- [ ] `/(admin)/boarding/overview/page.tsx`:
  - Card per hostel block: name, gender, current occupancy progress bar
  - "Occupancy ring" chart: filled beds vs empty beds vs inactive beds
  - Unassigned boarding students alert: "13 boarding students have no bed assignment"
  - Term selector: view historical occupancy using `bedOccupancySnapshots`
- [ ] `getHostelOccupancySummary` query: occupancy stats for all blocks in current term
- [ ] Click block card → navigates to block detail (ISSUE-169)

---

## Epic 3 — Night Prep Attendance

> **Goal:** A fast, offline-capable roll call for boarding students' evening study period. The matron marks 180 students' attendance in under 5 minutes from her phone.

---

### ISSUE-177 · Night Prep Attendance — Full Implementation

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 1.5 days

#### Description

Fully implement the night prep attendance feature scaffolded in Sprint 01 ISSUE-068. Night prep is an evening supervised study session (typically 18:00–20:00) for all boarding students. The matron marks attendance per hostel block, not per class section.

#### User Story

> At 18:05, Matron Mrs. Mwale opens the Acadowl app on her phone and taps "Night Prep." She sees all 89 girls in Nightingale House in a scrollable list. She quickly taps the absent ones — 3 girls are missing. She submits at 18:08. Within 2 minutes, three guardians receive SMS alerts and the school admin sees a notification.

#### Acceptance Criteria

**Backend — completing `convex/attendance/mutations.ts` for night prep:**

- [ ] `markNightPrepAttendance` mutation:
  - Wraps `markBulkAttendance` with `period: 'night_prep'` and `sectionId: null`
  - Instead of `sectionId`, uses `hostelBlockId` to scope students
  - Fetches all boarding students in the block: `students` where `boardingHouseId = hostelBlockId` and `boardingStatus = 'boarding'` and `status = 'active'`
  - Idempotent: same offline-capable `clientId` pattern as day attendance (Sprint 01 ISSUE-066/067)
  - After submission: schedules `sendNightPrepAbsenceSMS` for each absent student
  - Requires `requirePermission(ctx, Permission.MARK_ATTENDANCE)` — matrons have this permission

- [ ] `sendNightPrepAbsenceSMS` internal action:
  - Uses `school.smsTemplates.nightPrepAlert` (or default): `"Dear [GuardianName], [StudentName] was not present for night prep study at [SchoolName] tonight, [Date]. Please contact the school if concerned. [SchoolPhone]"`
  - Only sends to guardians with `notifPrefs.nightPrepAbsent: true` (defined in Sprint 03 ISSUE-161)
  - Creates `notifications` record with `type: 'night_prep_absence'`

- [ ] `getNightPrepRegister` query:
  - Takes `{ hostelBlockId, date }`
  - Returns all boarding students in the block with their night prep status for that date
  - If no records yet: returns all students with `status: null` (not yet marked)
  - Returns: `{ submitted: boolean, submittedAt?: number, submittedBy?: string }`

- [ ] `getNightPrepHistory` query: all night prep sessions for a block in current term — matrix view (students × dates)

**Frontend — `/(admin)/boarding/night-prep/page.tsx` (full implementation of Sprint 01 scaffold):**

- [ ] Block selector at top: defaults to matron's assigned block (`staff.managedHostelBlockId`)
- [ ] Date selector: defaults to today; cannot mark future dates; retroactive edit within 3 days
- [ ] Student list: sorted alphabetically, each row has photo (40px), name, grade, large status toggle
- [ ] Status options: **Present (P)** / **Absent (A)** / **Excused (E)** — only three states for night prep (no 'late' concept)
- [ ] "Mark All Present" button: one tap clears the entire list as present (most common case)
- [ ] "Show Absent Only" toggle: collapses list to show only students marked absent — useful for reviewing before submission
- [ ] Submit button: confirmation shows absent count: "3 students absent — send SMS alerts? [Submit & Notify] [Submit Without SMS]"
- [ ] After submission: "Submitted at 18:08 — 3 absence alerts queued." Success state cannot be resubmitted without admin override
- [ ] **Offline behaviour**: identical to day attendance register (ISSUE-067) — IndexedDB queue, sync banner, optimistic UI
- [ ] PWA: matron can "Add to Home Screen" — app opens directly to night prep page as default

---

### ISSUE-178 · Night Prep Session Dashboard for Admin

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

Admin and head teacher view of tonight's night prep status across all hostel blocks. Answers the question: "Has every block taken roll call tonight?"

#### Acceptance Criteria

- [ ] `/(admin)/boarding/night-prep/dashboard/page.tsx`:
  - Per-block status card: "Nightingale House — ✓ Submitted 18:08 by Matron Mwale — 2 absent" or "⚠ Livingstone House — Not yet submitted"
  - Missing registers alert: if a block hasn't submitted by 18:45 CAT, the head teacher receives an in-app notification
  - Tonight's absentees: consolidated list across all blocks with student name, block, guardian contact
  - "Send reminder to [WardenName]" button on unsubmitted blocks — sends SMS
- [ ] `getNightPrepDashboardForDate` query: submission status for all blocks for a given date
- [ ] Scheduled job in `crons.ts`: at 18:45 CAT daily (school days only) — fire in-app alert if any block hasn't submitted

---

### ISSUE-179 · Night Prep Attendance Reports

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

Night prep attendance reports for admin and matrons — term summaries, chronic absenteeism detection, and the MoE boarding return data.

#### Acceptance Criteria

- [ ] `getNightPrepTermReport` query:
  - Per student: total night prep sessions, present count, absent count, excused count, attendance %
  - Per block: average attendance %
  - Sorted: most absent first
- [ ] `/(admin)/boarding/night-prep/reports/page.tsx`: term report table with CSV export
- [ ] Chronic night prep absenteeism: same `detectChronicAbsenteeism` logic (Sprint 01 ISSUE-070) extended with a `period: 'night_prep'` filter — students with 3+ consecutive night prep absences are flagged
- [ ] **Progress snapshot update**: the Friday cron (`writeProgressSnapshots` in Sprint 03 ISSUE-136) updated to populate `nightPrepAttendancePercent` from this term's night prep records

---

### ISSUE-180 · Night Prep Attendance in Student and Guardian Profiles

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

Surface night prep attendance data in the student profile (admin/teacher view) and the guardian portal boarding tab. Already scaffolded — just needs real data wired in.

#### Acceptance Criteria

- [ ] Student Profile → Attendance tab:
  - "Day Attendance" section (existing from Sprint 01)
  - "Night Prep Attendance" section added below — only shown if student's `boardingStatus === 'boarding'`
  - Separate calendar heat map for night prep (same component, different data source)
  - Combined stats card: "Day: 92% | Night Prep: 88%"
- [ ] Guardian portal boarding tab (Epic 13 ISSUE-208): "Night Prep" card shows tonight's status and this-term attendance % — reads from `getNightPrepRegister` and `getNightPrepTermReport`

---

## Epic 4 — Meal Plans & Dietary Management

> **Feature Gate:** `Feature.MEAL_PLANS`

---

### ISSUE-181 · Meal Plan Configuration and Student Assignment

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.MEAL_PLANS` | **Estimate:** 1 day

#### Description

Configure the school's meal plans and assign each boarding student to a plan. Meal plans drive: (1) the fee charged (boarding fee includes meals), (2) kitchen staff preparation quantities, and (3) dietary alerts for students with special requirements.

#### User Story

> At Chengelo Secondary, all boarding students are on Full Board (3 meals/day). Three students are vegetarian and two have nut allergies. The kitchen receives a daily dietary requirements sheet showing their names and requirements.

#### Acceptance Criteria

**Schema addition to `schools`:**

```typescript
mealPlanConfig: v.object({
  plans: v.array(
    v.object({
      id: v.string(), // 'full_board', 'half_board', 'day_meals'
      name: v.string(), // 'Full Board', 'Half Board (Lunch & Dinner)'
      mealsPerDay: v.number(), // 3, 2, 1
      description: v.optional(v.string()),
      isActive: v.boolean(),
      termFeeZMW: v.optional(v.number()), // Overrides fee structure if set here
    }),
  ),
  dietaryFlags: v.array(v.string()), // School's defined dietary options: 'vegetarian', 'halal', 'nut-free', 'diabetic', 'celiac'
  mealTimes: v.object({
    breakfast: v.optional(v.string()), // '07:00'
    lunch: v.optional(v.string()), // '12:30'
    dinner: v.optional(v.string()), // '18:30'
  }),
});
```

**Schema addition to `students`:**

```typescript
// Additional fields on students (schema already has mealPlanType — expand it):
dietaryFlags: v.array(v.string()),     // ['vegetarian', 'nut-free']
dietaryNotes: v.optional(v.string()),  // Free text for complex requirements
```

**Backend — `convex/boarding/meals.ts`:**

- [ ] `configureMealPlans` mutation: sets `school.mealPlanConfig`
- [ ] `assignMealPlan` mutation: updates `student.mealPlanType`, `student.dietaryFlags`, `student.dietaryNotes`
- [ ] `bulkAssignMealPlan` mutation: assigns the same plan to all boarding students (common at schools with one plan)
- [ ] `getDietaryRequirementsForBlock` query:
  - Returns all boarding students in a block with their dietary flags
  - Grouped by dietary requirement
  - Used for kitchen preparation sheet

**Frontend — `/(admin)/boarding/meals/page.tsx`:**

- [ ] Meal plan configuration section: add/edit plans with fees
- [ ] Student dietary requirements table: name, grade, meal plan, dietary flags, notes
- [ ] Filter: by block, by dietary requirement
- [ ] "Kitchen Sheet" button: generates a printable daily dietary requirements PDF for kitchen staff
- [ ] Bulk meal plan assignment: select all → assign plan

---

### ISSUE-182 · Weekly Menu Planner

**Type:** Backend + Frontend | **Priority:** P2 | **Feature Gate:** `Feature.MEAL_PLANS` | **Estimate:** 1 day

#### Description

Matrons and kitchen managers plan the week's meals in the system. The menu is visible to boarding parents and students in the portal. This increases transparency and parent confidence in the boarding programme.

#### Acceptance Criteria

**Schema addition:**

```typescript
weeklyMenus: defineTable({
  schoolId: v.id('schools'),
  termId: v.id('terms'),
  weekNumber: v.number(),
  menu: v.array(
    v.object({
      dayOfWeek: v.number(), // 0=Monday, 4=Friday
      meals: v.array(
        v.object({
          mealTime: v.union(v.literal('breakfast'), v.literal('lunch'), v.literal('dinner')),
          mainDish: v.string(), // 'Nshima with chicken stew'
          sideDish: v.optional(v.string()), // 'Rape, beans'
          vegetarianOption: v.optional(v.string()),
          notes: v.optional(v.string()),
        }),
      ),
    }),
  ),
  publishedAt: v.optional(v.number()),
  createdBy: v.id('users'),
  createdAt: v.number(),
}).index('by_school_term_week', ['schoolId', 'termId', 'weekNumber']);
```

- [ ] `createWeeklyMenu` mutation, `publishWeeklyMenu` mutation
- [ ] `/(admin)/boarding/meals/menu/page.tsx`: weekly grid planner — click a cell to enter meal details
- [ ] "Copy from Last Week" shortcut — duplicates previous week's menu for editing
- [ ] Guardian portal boarding tab: "This Week's Menu" card showing current week's meals
- [ ] When menu published: in-app notification to boarding parents (if `Feature.WHATSAPP_NOTIFICATIONS` — send weekly menu as WhatsApp message)

---

### ISSUE-183 · Meal Attendance Tracking

**Type:** Backend | **Priority:** P2 | **Feature Gate:** `Feature.MEAL_PLANS` | **Estimate:** 0.5 days

#### Description

Some schools want to track which students actually collected their meals — primarily to identify students who are consistently missing meals (a welfare concern). This is optional and off by default.

#### Acceptance Criteria

**Schema addition:**

```typescript
mealAttendance: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  date: v.string(),
  mealTime: v.union(v.literal('breakfast'), v.literal('lunch'), v.literal('dinner')),
  collected: v.boolean(),
  collectedAt: v.optional(v.number()),
  markedBy: v.id('users'),
})
  .index('by_school', ['schoolId'])
  .index('by_student_date', ['studentId', 'date']);
```

- [ ] Kitchen staff can mark meal collection on a tablet (like attendance register — student list, tap to mark)
- [ ] Student who misses 3+ consecutive meals: matron receives in-app alert (welfare concern, potentially linked to sick bay)
- [ ] Meal attendance feeds into `studentProgressSnapshot` — optional field `consecutiveMealsMissed`
- [ ] This feature has its own sub-flag: `school.mealPlanConfig.trackMealAttendance: v.boolean()` — off by default

---

## Epic 5 — Visitor Management & Gate Control

> **Feature Gate:** `Feature.VISITOR_LOG`
> **Goal:** A digitised gate register that replaces the paper logbook. Every visitor is logged, checked against the authorised visitor list, and the guardian notified. The gate security guard uses a basic phone.

---

### ISSUE-184 · Authorised Visitor List Management

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.VISITOR_LOG` | **Estimate:** 1 day

#### Description

Each boarding student has a pre-approved list of people who are allowed to visit them. Any visitor not on this list triggers an authorisation alert to the guardian. This list is managed by the school admin and updated by guardians via the parent portal.

#### User Story

> When Chanda's uncle arrives to visit, the gate guard checks his NRC number. The system shows he is on Chanda's approved visitor list. His visit is logged and Chanda is called to the gate.

#### Acceptance Criteria

**Schema addition:**

```typescript
authorisedVisitors: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  name: v.string(),
  relation: v.string(), // 'uncle', 'grandmother', 'family friend'
  nrc: v.optional(v.string()), // Zambian NRC number — used for identity verification
  phone: v.optional(v.string()),
  photoUrl: v.optional(v.string()), // Optional — uploaded by admin or guardian
  addedBy: v.union(v.literal('admin'), v.literal('guardian')),
  addedByUserId: v.id('users'),
  isActive: v.boolean(),
  notes: v.optional(v.string()),
  createdAt: v.number(),
})
  .index('by_student', ['studentId'])
  .index('by_school', ['schoolId'])
  .index('by_nrc', ['nrc']);
```

**Backend — `convex/boarding/visitors.ts`:**

- [ ] `addAuthorisedVisitor` mutation: admin or guardian adds a visitor
  - Guardian can add via parent portal (Epic 13 ISSUE-209) — `addedBy: 'guardian'`
  - Admin can add on guardian's behalf — `addedBy: 'admin'`
- [ ] `removeAuthorisedVisitor` mutation: deactivates visitor (not deleted — audit trail)
- [ ] `searchAuthorisedVisitorByNrc` query: gate guard types NRC → returns all students this person can visit
  - Returns: student name, grade, photo, relation, whether to call student to gate
  - Used by gate log entry flow (ISSUE-185)
- [ ] `getAuthorisedVisitorsForStudent` query: admin/guardian view — all approved visitors for a student

**Frontend — `/(admin)/boarding/visitors/authorised/page.tsx`:**

- [ ] Per-student view: student selector → list of their authorised visitors
- [ ] Add visitor form: name, relation, NRC, phone, photo upload
- [ ] Accessible from student profile Boarding tab (ISSUE-171)

---

### ISSUE-185 · Gate Visitor Log Entry

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.VISITOR_LOG` | **Estimate:** 1 day

#### Description

The gate security guard's primary interface. A fast, mobile-first form for logging every person who enters the school grounds to visit a boarding student. Designed for non-technical gate staff.

#### User Story

> A man arrives at the gate. The guard asks for his NRC. The guard types the NRC number into the app. The system finds him: "John Banda — Authorised visitor for Chanda Banda (Grade 10A), Relation: Father." The guard confirms the visit and Chanda is called. The entry is logged.

#### Acceptance Criteria

**`convex/boarding/visitorLog.ts`** (full implementation of Sprint 00 skeleton):

- [ ] `logVisitorEntry` mutation:
  - Args: `{ studentId, visitorName, visitorNrc?, visitorPhone?, relation, purpose, loggedBy }`
  - Auto-generates a visitor reference number from `counters` table: `VIS-{year}-{6-digit-sequence}`
  - Checks `authorisedVisitors` table: sets `isAuthorised: true` if NRC matches or `false` if not found
  - If `isAuthorised: false`: immediately triggers `notifyGuardianOfUnauthorisedVisitor` action
  - If `isAuthorised: true` AND guardian has `notifPrefs.visitorArrival: true`: sends arrival notification SMS
  - Sets `checkInAt: now()`
  - Requires `requirePermission(ctx, Permission.MANAGE_VISITORS)`

- [ ] `logVisitorExit` mutation:
  - Sets `checkOutAt: now()`
  - Calculates visit duration
  - If visit duration > school's configured max (e.g., 3 hours): sends in-app notification to matron

- [ ] `notifyGuardianOfUnauthorisedVisitor` internal action:
  - SMS: `"ALERT: [VisitorName] (NRC: [NRC]) arrived at [SchoolName] requesting to visit [StudentName] at [Time]. This person is NOT on the authorised visitor list. Contact the school if concerned: [SchoolPhone]."`
  - Also creates in-app notification for matron and head teacher

- [ ] `getVisitorLogForDate` query: all visitor entries for a given date
- [ ] `getActiveVisitors` query: visitors currently on school grounds (checked in, not checked out) — real-time
- [ ] `getVisitorHistoryForStudent` query: all past visits for a student

**Frontend — `/(admin)/boarding/visitors/gate/page.tsx` — gate guard interface:**

- [ ] Designed for a basic Android phone — large text, high contrast
- [ ] Step 1: "Find by NRC" search field — large numeric keyboard
  - If found: shows visitor card with name, photo (if uploaded), student they can visit
  - If not found: "New Visitor" flow — manual entry
- [ ] Step 2: Student lookup (if visiting without NRC):
  - Scan student ID card barcode (uses device camera) — pulls up student instantly
  - OR: type student name/number
- [ ] Step 3: Confirm entry form: visitor name (pre-filled if found), relation, purpose of visit
- [ ] Authorised/Unauthorised banner: green banner if authorised, red banner with "Guardian notified" if not
- [ ] "Log Exit" shortcut: shows list of current visitors on premises → tap to check out

---

### ISSUE-186 · Visitor Log Dashboard and Reports

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.VISITOR_LOG` | **Estimate:** 0.5 days

#### Description

Admin and matron view of visitor activity. Who is on school grounds right now? Who visited most frequently? Any suspicious patterns?

#### Acceptance Criteria

- [ ] `/(admin)/boarding/visitors/page.tsx`:
  - **Live tab**: list of visitors currently on premises with check-in time and duration
  - "Check Out" button per visitor — quickly log their exit
  - Auto-flag if visitor has been on premises > configured max duration (amber badge)
  - **History tab**: full log with date/time filters, student filter, authorised/unauthorised filter
  - Unauthorised visitor attempts highlighted in red
- [ ] Monthly visitor report: total visits, unique visitors, unauthorised attempts, longest stays
- [ ] CSV export: full visitor log for the term (required by some schools for security audits)
- [ ] `getUnauthorisedVisitorAttempts` query: all `isAuthorised: false` entries — shown prominently to head teacher

---

### ISSUE-187 · Visitor Management in Guardian Portal

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.VISITOR_LOG` | **Estimate:** 0.5 days

#### Description

Guardians can view who has visited their child, add new authorised visitors, and receive alerts for unauthorised arrivals — all from the parent portal.

#### Acceptance Criteria

- [ ] Guardian portal boarding tab (Epic 13): "Authorised Visitors" section:
  - List of pre-approved visitors with their relation and NRC
  - "Add Visitor" button: opens form → submits `addAuthorisedVisitor` with `addedBy: 'guardian'`
  - Note: guardian-added visitors are subject to admin approval at schools that require it (configurable: `school.requireAdminApprovalForVisitors: v.boolean()`)
- [ ] "Recent Visits" section: last 5 visitor log entries for the guardian's child — name, date, duration
- [ ] Unauthorised visitor alert banner: if there's been an unauthorised attempt in the last 24 hours, a red alert banner shown at top of boarding tab: "⚠ An unknown visitor attempted to see [StudentName] at [Time] today."

---

## Epic 6 — Exeat & Leave Pass System

> **Goal:** A formal digital leave pass system replacing the paper exeat book. Every time a boarding student leaves school grounds overnight, it is recorded, approved, and the guardian is notified.

---

### ISSUE-188 · Exeat Application and Approval

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 1 day

#### Description

An exeat is a formal permission for a boarding student to leave school grounds for a weekend or holiday. The system digitises the application, approval, PDF generation, and SMS notifications.

#### Acceptance Criteria

**Schema addition:**

```typescript
exeatPasses: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  referenceNumber: v.string(), // EX-2025-000123 (from counters table)
  exeatType: v.union(
    v.literal('weekend'), // Friday evening to Sunday evening
    v.literal('holiday'), // Full school holiday
    v.literal('medical'), // Hospital or medical appointment
    v.literal('family_emergency'),
    v.literal('other'),
  ),
  departureDate: v.string(), // 'YYYY-MM-DD'
  departureTime: v.string(), // 'HH:MM'
  returnDate: v.string(),
  returnTime: v.string(),
  destination: v.string(), // Where they are going
  escortName: v.string(), // Who is collecting them
  escortRelation: v.string(),
  escortPhone: v.string(),
  escortNrc: v.optional(v.string()),
  isEscortAuthorised: v.boolean(), // Whether escort is on authorised visitor list
  reason: v.string(),
  status: v.union(
    v.literal('pending'), // Submitted, awaiting approval
    v.literal('approved'),
    v.literal('rejected'),
    v.literal('departed'), // Student has left
    v.literal('returned'), // Student has returned
    v.literal('overdue'), // Past return time, not yet returned
  ),
  approvedBy: v.optional(v.id('users')),
  approvedAt: v.optional(v.number()),
  rejectionReason: v.optional(v.string()),
  departedAt: v.optional(v.number()),
  returnedAt: v.optional(v.number()),
  pdfUrl: v.optional(v.string()), // Generated exeat pass PDF
  guardianNotified: v.boolean(),
  requestedBy: v.union(v.literal('guardian'), v.literal('admin'), v.literal('student')),
  requestedByUserId: v.id('users'),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_student', ['studentId'])
  .index('by_status', ['schoolId', 'status'])
  .index('by_departure_date', ['schoolId', 'departureDate']);
```

**Backend — `convex/boarding/exeat.ts`:**

- [ ] `applyForExeat` mutation: guardian or admin submits application; notifies matron in-app
- [ ] `approveExeat` mutation: matron or admin approves; generates exeat PDF; notifies guardian
- [ ] `rejectExeat` mutation: sends rejection SMS with reason to guardian
- [ ] `recordExeatDeparture` mutation: gate guard marks student as departed; sends SMS to guardian confirming departure time
- [ ] `recordExeatReturn` mutation: gate guard marks student as returned; closes exeat; sends SMS to guardian
- [ ] Overdue return check: scheduled cron job (hourly) — if `returnDate/Time` has passed and `status !== 'returned'`: sets `status: 'overdue'`, sends urgent SMS to guardian and in-app to matron

**Frontend — `/(admin)/boarding/exeat/page.tsx`:**

- [ ] Pending approvals list (matron's primary screen): student name, dates, destination, escort name — Approve / Reject buttons
- [ ] Active exeats: students currently off premises with expected return time and countdown
- [ ] Overdue exeats: red alert list — students past their return time
- [ ] Full exeat history: searchable, filterable by student, date, type

---

### ISSUE-189 · Exeat Pass PDF Generation

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

A formal PDF exeat pass that the student carries when leaving school grounds. It serves as their official authorisation document.

#### Acceptance Criteria

- [ ] `generateExeatPdf` action (called by `approveExeat`):
  - School letterhead
  - "EXEAT PASS" title
  - Reference number, student name, grade/house, student ID card photo
  - Departure date/time, return date/time, destination
  - Escort name, relation, phone, NRC (if provided)
  - Approved by (matron/admin name and title), approval date
  - School stamp placeholder
  - Barcode of reference number (for gate scan on return)
  - Footer: "This pass must be surrendered on return"
- [ ] PDF uploaded to Cloudinary: `exeats/{schoolSlug}/{year}/{studentNumber}/{referenceNumber}.pdf`
- [ ] Saved as `studentDocuments` record with `type: 'other'` and `title: 'Exeat Pass — [dates]'`
- [ ] Guardian can download from parent portal documents tab (already works via Sprint 01 ISSUE-052 — no changes needed)

---

### ISSUE-190 · Exeat Applications from Guardian Portal

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

Guardians apply for exeat online rather than sending a written note. This reduces the paperwork burden on both parents and matrons.

#### Acceptance Criteria

- [ ] Guardian portal → child boarding tab → "Apply for Exeat" button
- [ ] Exeat application form: type (weekend/holiday/medical/emergency), departure date+time, return date+time, destination, escort name + relation + phone
- [ ] Escort pre-populated from authorised visitor list: dropdown to select existing authorised person or add a new one
- [ ] Submitted exeats show status: "Pending approval" / "Approved — download pass" / "Rejected — [reason]"
- [ ] Download approved pass button: opens exeat PDF in browser
- [ ] Guardian cannot apply within 24 hours of departure (configurable minimum notice period per school)

---

## Epic 7 — Sick Bay Management

> **Feature Gate:** `Feature.SICK_BAY`
> **Goal:** A complete electronic sick bay register. Every student admitted, every medication dispensed, and every guardian notified — all logged instantly. The matron's phone IS the sick bay system.

---

### ISSUE-191 · Sick Bay Admission

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.SICK_BAY` | **Estimate:** 1.5 days

#### Description

Log a student's admission to the sick bay. The instant a student is admitted, their guardian receives an SMS. The admission record captures symptoms, initial treatment, and the attending matron.

#### User Story

> At 14:20, Mutale arrives at the sick bay with a fever. Matron Mwale taps "New Admission" on her phone. She selects Mutale, enters "High fever, 38.5°C, headache." She taps Save. Within 30 seconds, Mutale's mother receives: "Mutale Banda has been admitted to the sick bay at Chengelo Secondary at 14:20 today. Reason: High fever. Contact Matron Mwale: +26097XXXXXXX."

#### Acceptance Criteria

**`convex/boarding/sickBay.ts`** (full implementation of Sprint 00 skeleton):

- [ ] `admitToSickBay` mutation:
  - Creates `sickBayAdmissions` record with all fields populated
  - Sets `admittedAt: now()`
  - Triggers `sendSickBayAdmissionSMS` action immediately (no queue — this is urgent)
  - Creates in-app notification for all guardians with `notifPrefs.sickBayAdmission: true`
  - Requires `requirePermission(ctx, Permission.MANAGE_SICK_BAY)` — matrons and admins

- [ ] `sendSickBayAdmissionSMS` internal action:
  - SMS: `"[StudentName] has been admitted to the sick bay at [SchoolName] at [Time] today. Reason: [reason]. Contact Matron: [MatronPhone]. School: [SchoolPhone]."`
  - Sends to ALL guardians with `notifPrefs.sickBayAdmission: true` (not just primary)
  - Creates push notification if guardian has PWA installed (Sprint 03 ISSUE-159)
  - Logs to `notifications` table

- [ ] `getSickBayAdmissions` query: all current admissions (not yet discharged)
- [ ] `getSickBayHistoryForStudent` query: all past admissions for a student — used in student profile Medical tab and guardian portal

**Schema additions to `sickBayAdmissions` (expanding Sprint 00 skeleton):**

```typescript
// Additional fields
symptoms: v.string(),                  // Free text: "Fever 38.5°C, headache, vomiting"
initialTreatment: v.optional(v.string()),
temperature: v.optional(v.number()),   // Celsius
bloodPressure: v.optional(v.string()), // '120/80'
isolationRequired: v.boolean(),        // Contagious condition — separate room
sickBayBed: v.optional(v.string()),    // If school has multiple sick bay beds
guardianNotifiedAt: v.optional(v.number()),
guardianAcknowledgedAt: v.optional(v.number()), // When guardian replies/calls back
dischargeNotes: v.optional(v.string()),
dischargedBy: v.optional(v.id('users')),
```

**Frontend — `/(admin)/boarding/sick-bay/page.tsx`:**

- [ ] **Active Admissions** tab: list of currently admitted students
  - Per student: photo, name, grade, admission time (duration shown as "2h 15m ago"), reason, temperature, isolation flag
  - "Discharge" button per student
  - "Refer to Hospital" button per student
  - "Add Medication" button per student
- [ ] **New Admission** button: full-screen modal (large tap targets for matron's phone):
  - Student search (barcode scan OR name search)
  - Symptoms field (large text area)
  - Temperature, blood pressure (optional)
  - Initial treatment (optional)
  - Isolation toggle
  - SMS preview shown before confirming: "This will send an SMS to [N] guardian(s)"

---

### ISSUE-192 · Sick Bay Medication Log

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.SICK_BAY` | **Estimate:** 0.5 days

#### Description

Every medication dispensed in the sick bay is recorded — for student safety (allergy checking), legal accountability, and end-of-term medical reports.

#### Acceptance Criteria

**Schema addition:**

```typescript
medicationLog: defineTable({
  schoolId: v.id('schools'),
  admissionId: v.id('sickBayAdmissions'),
  studentId: v.id('students'),
  medication: v.string(), // 'Paracetamol 500mg', 'Rehydration salts'
  dosage: v.string(), // '2 tablets'
  frequency: v.optional(v.string()), // 'Every 6 hours'
  administeredAt: v.number(),
  administeredBy: v.id('users'), // Matron who dispensed
  notes: v.optional(v.string()),
  nextDoseAt: v.optional(v.number()),
})
  .index('by_admission', ['admissionId'])
  .index('by_student', ['studentId'])
  .index('by_school', ['schoolId']);
```

- [ ] `addMedicationToAdmission` mutation: logs medication dispensed, checks student's `medicalConditions` and `allergies` for potential conflicts — shows warning if keyword match (e.g., student allergic to penicillin and medication contains "amoxicillin")
- [ ] Medication log visible on admission detail view: chronological list of all medications dispensed
- [ ] "Next dose" reminder: in-app alert to matron when `nextDoseAt` approaches
- [ ] Allergy conflict detection: simple keyword matching — not a clinical system, but a safety net

---

### ISSUE-193 · Hospital Referral and External Medical Handling

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.SICK_BAY` | **Estimate:** 0.5 days

#### Description

When a student's condition requires hospital treatment, the system records the referral, generates a referral letter PDF, and notifies the guardian urgently.

#### Acceptance Criteria

**Schema additions to `sickBayAdmissions`:**

```typescript
referredToHospital: v.boolean(),
referralHospital: v.optional(v.string()),   // 'UTH', 'Levy Mwanawasa Hospital'
referralTime: v.optional(v.number()),
referralNotes: v.optional(v.string()),
transportArranged: v.optional(v.boolean()),
```

- [ ] `referStudentToHospital` mutation:
  - Sets `referredToHospital: true`, `referralHospital`, `referralTime`
  - Sends URGENT SMS to ALL guardians (regardless of notification preferences — this overrides):
    `"URGENT: [StudentName] has been referred to [Hospital] from [SchoolName] at [Time]. Please contact the school immediately: [HeadTeacherPhone]."`
  - Sends in-app notification to head teacher and school admin
  - Creates a push notification (maximum urgency)
- [ ] `generateReferralLetter` action: PDF letter on school letterhead for student to take to hospital:
  - Student details: name, DOB, grade, blood group, known medical conditions, allergies
  - Reason for referral
  - Signed by matron/school nurse
  - "For official use at [Hospital]" footer
  - Saved as `studentDocuments` record
- [ ] Guardian portal: referral banner shown prominently in child's boarding tab

---

### ISSUE-194 · Sick Bay Discharge and Follow-Up

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.SICK_BAY` | **Estimate:** 0.5 days

#### Description

When a student is discharged from the sick bay, the record is closed, the guardian is notified, and the student is returned to normal boarding status.

#### Acceptance Criteria

- [ ] `dischargeSickBayPatient` mutation:
  - Sets `dischargedAt: now()`, `dischargeNotes`, `dischargedBy`
  - If `isolationRequired: true`: releases any isolation bed
  - SMS to guardian: `"[StudentName] has been discharged from the sick bay at [SchoolName] at [Time]. Discharge notes: [notes]. If you have concerns, contact: [SchoolPhone]."`
  - If student was absent from class during admission: retroactively marks attendance as `'medical'` for the missed days (calls `updateSingleAttendance` for each day)

- [ ] `/(admin)/boarding/sick-bay/history/page.tsx`:
  - Full sick bay history (all admissions, discharged and active)
  - Filters: date range, student, condition keywords
  - Student medical summary: "Chanda has been admitted 3 times this term"
  - Term sick bay report: total admissions, conditions by frequency, hospital referrals count

- [ ] **Progress snapshot update**: Friday cron updated to populate `studentProgressSnapshots.sickBayVisitsThisTerm` from sick bay admissions in current term

---

### ISSUE-195 · Sick Bay in Student Profile and Guardian Portal

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** `Feature.SICK_BAY` | **Estimate:** 0.5 days

#### Description

Surface sick bay history in the student profile Medical tab and the guardian portal boarding tab.

#### Acceptance Criteria

- [ ] Student Profile → Medical tab (extending Sprint 01 ISSUE-049):
  - Static medical info (existing): blood group, allergies, medications, conditions
  - **Sick Bay History** section: timeline of all admissions — date, reason, duration, medications dispensed, discharged by
  - Current admission banner (if currently in sick bay): "Currently in sick bay since [time]. Reason: [symptoms]."
- [ ] Guardian portal boarding tab:
  - "Medical" card: "Currently in sick bay" banner (if active), last sick bay visit, link to full history
  - Parents see: date, reason, discharged or referred — NOT detailed clinical notes (privacy)

---

## Epic 8 — Pocket Money Trust Accounts

> **Feature Gate:** `Feature.POCKET_MONEY`
> **Goal:** A transparent, controlled cash management system that lets guardians send money digitally and ensures it reaches their child in a controlled weekly flow. The school is the trusted custodian.

---

### ISSUE-196 · Pocket Money Account Setup

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.POCKET_MONEY` | **Estimate:** 0.5 days

#### Description

Set up pocket money trust accounts for all boarding students. Each account holds a running balance and has configurable weekly withdrawal limits. Accounts are created automatically when a student is assigned boarding status.

#### Acceptance Criteria

**Schema additions to `pocketMoneyAccounts` (expanding Sprint 00 skeleton):**

```typescript
termId: v.id('terms'),                 // Current term the account is active for
yearToDateDepositsZMW: v.number(),     // Total deposited this academic year
yearToDateWithdrawalsZMW: v.number(),
lastWithdrawalDate: v.optional(v.string()),
lastWithdrawalAmountZMW: v.optional(v.number()),
withdrawnThisWeekZMW: v.number(),      // Resets every Monday via cron
weeklyLimitZMW: v.number(),            // Default from school config; overrideable per student
isActive: v.boolean(),
notes: v.optional(v.string()),         // e.g., "Grade 12 student — higher limit approved"
createdAt: v.number(),
updatedAt: v.number(),
```

**Schema addition to `schools`:**

```typescript
pocketMoneyConfig: v.object({
  defaultWeeklyLimitZMW: v.number(), // e.g., 100 ZMW per week
  weeklyLimitByGrade: v.optional(
    v.array(
      v.object({
        gradeId: v.id('grades'),
        limitZMW: v.number(),
      }),
    ),
  ), // Grade 12 may have higher limit
  allowGuardianTopup: v.boolean(), // Can guardians deposit directly?
  minimumDepositZMW: v.number(), // Minimum top-up amount
  allowUnlimitedWithdrawal: v.boolean(), // Override for special students (head prefect, etc.)
  weeklyResetDay: v.number(), // 0=Monday — when withdrawal counter resets
  endOfTermPolicy: v.union(
    v.literal('carry_forward'), // Balance rolls to next term
    v.literal('refund_to_guardian'), // Auto-refund at term end
    v.literal('manual_decision'), // Admin decides case-by-case
  ),
});
```

**Backend — `convex/boarding/pocketMoney.ts`:**

- [ ] `createPocketMoneyAccount` mutation: auto-called when student's `boardingStatus` changes to `'boarding'`
- [ ] `updateWeeklyLimit` mutation: admin can change weekly limit for a specific student
- [ ] `getPocketMoneyAccount` query: account details + current balance + this week's withdrawals
- [ ] `getPocketMoneyAccountsForBlock` query: all accounts for a hostel block — matron's overview
- [ ] Weekly reset cron: every Monday at 00:01 CAT, reset `withdrawnThisWeekZMW: 0` for all active accounts

---

### ISSUE-197 · Guardian Pocket Money Top-Up

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.POCKET_MONEY` | **Estimate:** 1 day

#### Description

Guardians top up their child's pocket money account using Airtel Money or MTN MoMo — the same mobile money pipeline as fee payments. The money is received by the school and credited to the student's account.

#### User Story

> Mrs. Musonda wants to send ZMW 200 pocket money to her daughter at Chengelo. She opens the parent portal, taps "Top Up Pocket Money", enters ZMW 200, and confirms on her Airtel Money USSD prompt. Within 60 seconds, she receives a receipt SMS and the school matron can see the deposit in the system.

#### Acceptance Criteria

**Backend:**

- [ ] `initiateGuardianPocketMoneyTopup` action:
  - Calls `initiateAirtelMoneyPayment` OR `initiateMtnMomoPayment` (Sprint 03 ISSUE-146/147) with:
    - `paymentContext: 'pocket_money'`
    - `invoiceId: null` (no invoice — this is a trust deposit, not a fee payment)
    - Custom reference format: `PM-{studentNumber}-{timestamp}` — identifiable on the school's mobile money statement
  - Creates a `pendingPayments` record
  - Returns `{ pendingPaymentId }` — same waiting screen as fee payment

- [ ] When payment webhook fires: `processPaymentWebhook` (Sprint 02 ISSUE-107/108) detects `paymentContext: 'pocket_money'` and calls `creditPocketMoneyAccount` instead of updating an invoice:

  ```typescript
  // Called by processPaymentWebhook when paymentContext === 'pocket_money'
  const creditPocketMoneyAccount = internalMutation({
    args: { accountId, amountZMW, paymentReference, guardianId },
  });
  ```

  - Adds to `pocketMoneyAccounts.balanceZMW`
  - Creates `pocketMoneyTransactions` record with `type: 'deposit'`
  - Updates `yearToDateDepositsZMW`
  - Sends SMS receipt to guardian: `"Received ZMW [amount] for [StudentName]'s pocket money at [SchoolName]. New balance: ZMW [balance]. Thank you. Ref: [reference]."`
  - Creates in-app notification for matron

- [ ] `getTopUpHistory` query: all deposits to a student's pocket money account, newest first

**Frontend — Guardian Portal:**

- [ ] `/(parent)/children/[studentId]/boarding/pocket-money/page.tsx` (within boarding tab Epic 13):
  - Current balance display: "ZMW 145 available"
  - This week's withdrawals: "ZMW 50 withdrawn this week (limit: ZMW 100)"
  - "Top Up" button → amount entry → mobile money flow (same component as fee payment)
  - Top-up history list
  - Note about weekly limit: "Your child can withdraw up to ZMW 100/week at school"

---

### ISSUE-198 · Pocket Money Disbursement — Matron Interface

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.POCKET_MONEY` | **Estimate:** 1.5 days

#### Description

Students request cash from the matron (or a designated disbursement point). The matron enters the withdrawal in the app, the system validates the weekly limit, deducts the balance, prints a receipt stub, and sends an SMS to the guardian.

#### User Story

> Chanda comes to Matron Mwale on Friday after night prep. She requests ZMW 50 for the tuck shop. Matron opens the app, finds Chanda, enters ZMW 50. The system shows: "Balance: ZMW 145. Weekly limit: ZMW 100. Withdrawn this week: ZMW 30. Remaining weekly allowance: ZMW 70. Approve ZMW 50?" Matron approves. Chanda's guardian receives: "ZMW 50 disbursed to Chanda at [School] on [Date]. Remaining balance: ZMW 95. Weekly allowance remaining: ZMW 20."

#### Acceptance Criteria

**Backend — `convex/boarding/pocketMoney.ts`:**

- [ ] `disburseFromPocketMoney` mutation:
  - Args: `{ accountId, amountZMW, disbursedBy: userId, notes? }`
  - Validates `amountZMW > 0`
  - Validates `amountZMW <= account.balanceZMW`
  - Validates `amountZMW + account.withdrawnThisWeekZMW <= account.weeklyLimitZMW` — UNLESS student's account has `allowUnlimitedWithdrawal: true` or disbursedBy has `requirePermission(Permission.DISBURSE_POCKET_MONEY)` and adds a reason
  - Creates `pocketMoneyTransactions` record with `type: 'withdrawal'`
  - Updates `account.balanceZMW` (deducted), `account.withdrawnThisWeekZMW` (added), `account.lastWithdrawalDate`
  - Triggers `sendPocketMoneyReceiptSMS` action (see below)
  - Requires `requirePermission(ctx, Permission.DISBURSE_POCKET_MONEY)`

- [ ] `sendPocketMoneyReceiptSMS` internal action:
  - Sends to guardians with `notifPrefs.pocketMoneyWithdrawal: true`
  - Message: `"ZMW [amount] disbursed to [StudentName] at [SchoolName] on [Date]. Remaining balance: ZMW [balance]. Weekly remaining: ZMW [remaining]. Contact [MatronPhone] if unexpected."`

- [ ] `overrideDisbursementLimit` mutation:
  - Allows disbursing above weekly limit with a documented reason
  - Requires `requirePermission(ctx, Permission.MANAGE_HOSTELS)` (matron-in-charge or admin only)
  - Records the override reason in `pocketMoneyTransactions.notes`

**Frontend — `/(admin)/boarding/pocket-money/disburse/page.tsx` — matron's disbursement interface:**

- [ ] Designed for phone — large elements, quick student search
- [ ] Student lookup: name search OR barcode scan of student ID card
- [ ] Account summary card: current balance, this-week withdrawals, weekly limit remaining
- [ ] Amount input: number pad, large digits
- [ ] Limit validator: real-time as amount entered:
  - Green: "Within weekly limit — ZMW 70 remaining after this"
  - Amber: "This will exceed weekly limit by ZMW 20. Override requires reason."
  - Red: "Insufficient balance"
- [ ] Override flow: if above limit — require reason, require manager PIN (school admin's PIN)
- [ ] Confirm button → success screen: "ZMW 50 disbursed. SMS sent to guardian."
- [ ] Printed receipt stub (optional): button triggers browser print of a simple receipt (no thermal printer required — any printer)

---

### ISSUE-199 · Pocket Money Account Ledger

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.POCKET_MONEY` | **Estimate:** 0.5 days

#### Description

Complete transaction history for each pocket money account. Visible to admin, matron, and (in summary form) the guardian.

#### Acceptance Criteria

**Schema additions to `pocketMoneyTransactions` (expanding Sprint 00 skeleton):**

```typescript
guardianNotified: v.boolean(),
receiptNumber: v.string(),           // PM-RCPT-{year}-{sequence}
createdAt: v.number(),
```

- [ ] `getPocketMoneyLedger` query: all transactions for an account, newest first, with running balance
- [ ] `/(admin)/boarding/pocket-money/[studentId]/page.tsx`:
  - Account summary header: current balance, total deposited this term, total withdrawn this term
  - Transaction ledger table: date, type (deposit/withdrawal), amount, running balance, disbursed by, guardian notified ✓
  - Exportable CSV for guardian disputes
- [ ] Admin can also MANUALLY deposit to account: `recordManualPocketMoneyDeposit` mutation (for guardians who hand cash directly to the bursar — records a `type: 'deposit'` transaction)

---

### ISSUE-200 · End-of-Term Pocket Money Reconciliation

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.POCKET_MONEY` | **Estimate:** 1 day

#### Description

At term end, any remaining pocket money balances must be reconciled per the school's configured policy: carry forward, refund to guardian, or manual review.

#### Acceptance Criteria

**Backend — `convex/boarding/pocketMoney.ts`:**

- [ ] `runEndOfTermPocketMoneyReconciliation` action:
  - Triggered from the `activateTerm` flow or manually by admin
  - For each active pocket money account:
    - If `school.pocketMoneyConfig.endOfTermPolicy === 'carry_forward'`: transfers balance to new term account
    - If `endOfTermPolicy === 'refund_to_guardian'`: creates a `pocketMoneyTransactions` record with `type: 'refund'`, notifies guardian to collect refund from school bursar
    - If `endOfTermPolicy === 'manual_decision'`: creates a task in admin dashboard for each account with balance > 0
  - Returns: `{ carryForward: N, refunded: N, pendingDecision: N, totalCarriedZMW, totalRefundedZMW }`

- [ ] `getEndOfTermReconciliationReport` query: summary of all accounts and their reconciliation status

**Frontend — `/(admin)/boarding/pocket-money/reconciliation/page.tsx`:**

- [ ] Run reconciliation button (only enabled when term is being closed)
- [ ] Pre-reconciliation summary: "247 accounts with balances totalling ZMW 18,450. Policy: carry forward."
- [ ] Post-reconciliation: per-student outcome table — carried forward amount, refund amount
- [ ] Manual decision accounts (if `manual_decision` policy): admin selects carry forward or refund per student

---

### ISSUE-201 · Pocket Money School-Wide Dashboard

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.POCKET_MONEY` | **Estimate:** 0.5 days

#### Description

Admin and matron overview of the pocket money system across all students and blocks.

#### Acceptance Criteria

- [ ] `/(admin)/boarding/pocket-money/page.tsx`:
  - Total pocket money held in trust (sum of all account balances): shown as "School holds ZMW X in trust"
  - This week's total disbursements: live (updates via Convex)
  - Today's disbursements feed: scrolling list of recent withdrawals
  - Accounts with ZMW 0 balance: "42 students have depleted accounts — guardians may need to top up"
  - Accounts near weekly limit: students who have withdrawn > 80% of weekly allowance
  - Block selector: filter all stats by hostel block
- [ ] `getPocketMoneyDashboardStats` query: real-time aggregate stats for admin card

---

## Epic 9 — Boarding Fee Integration

---

### ISSUE-202 · Boarding Fees on Term Invoices

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

Connect the boarding module to the fee system (Sprint 02) so that boarding and meals fees are automatically included on term invoices. This uses the `overrideLineItems` mechanism in `generateInvoiceForStudent` — no changes to the invoice generator itself.

#### Acceptance Criteria

- [ ] `generateInvoiceForStudent` (Sprint 02 ISSUE-095) is called correctly for boarding students:
  - When `student.boardingStatus === 'boarding'`: fee structure query already returns boarding-only fee items (handled by Sprint 02 `getFeeStructureForStudent` — it reads `boardingStatus`)
  - No additional code needed for standard boarding fees — the fee structure engine already handles this
  - This issue verifies the integration works end-to-end with real boarding test data

- [ ] `overrideLineItems` usage for school-specific boarding add-ons:
  - Some schools charge extra for boarding that isn't in the standard fee structure (e.g., "Bedding deposit" at enrolment)
  - `generateBoardingSupplementaryInvoice` action: creates a one-off supplementary invoice for bedding, locker, or other enrolment-time boarding charges
  - Uses the same `generateInvoiceForStudent` engine with `overrideLineItems` and `draftOnly: false`

- [ ] **Verification checklist** (integration test):
  - Boarding student at Chengelo seed school receives an invoice with tuition AND boarding AND meals line items
  - Day student at the same school receives an invoice with ONLY tuition — no boarding items
  - Boarding status change mid-term (ISSUE-171) generates a prorated supplementary invoice for boarding portion

---

### ISSUE-203 · Boarding Status Change Invoice Adjustments

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

When a student's boarding status changes mid-term, the financial impact must be handled immediately: new charges for day→boarding, prorated credit note for boarding→day.

#### Acceptance Criteria

- [ ] `changeBoardingStatus` mutation (ISSUE-171) financial flow verified:
  - **Day → Boarding**: calls `generateInvoiceForStudent` with boarding fee items and `prorationFactor` calculated from remaining term days. Invoice submitted to ZRA immediately. Guardian notified.
  - **Boarding → Day**: calls `createCreditNote` (Sprint 02 ISSUE-115) with `type: 'boarding_adjustment'`, amount = prorated unused boarding days. ZRA credit note submitted. Guardian notified.
- [ ] Integration test: student switches from day to boarding on day 20 of a 60-day term. Invoice must show exactly 40/60 (66.7%) of the boarding fee. ZRA fiscal code returned. Guardian SMS sent.

---

### ISSUE-204 · Pocket Money Deposits as a Financial Audit Trail

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.POCKET_MONEY` | **Estimate:** 0.5 days

#### Description

Pocket money flows through the school's mobile money merchant accounts — the same accounts used for fee payments. The finance module must distinguish pocket money deposits from fee payments in reconciliation reports.

#### Acceptance Criteria

- [ ] Mobile money webhook handler (Sprint 02 ISSUE-107/108): `paymentContext: 'pocket_money'` deposits are logged in `pocketMoneyTransactions` but also appear in the school's daily mobile money receipt summary (in `/(admin)/fees/cashbook`)
- [ ] `getDailyMobileMoneyReport` query (addition to Sprint 02): includes a "Pocket Money Deposits" row separate from fee payments — bursar can see exactly how much of the day's Airtel Money receipts were pocket money vs fees
- [ ] End-of-term: total pocket money deposits = total pocket money held in trust (zero-sum verification)

---

## Epic 10 — Conduct & Discipline Log

> **Goal:** A structured, private conduct record for boarding students. Matrons log incidents; the record informs promotion decisions, head teacher reviews, and Sprint 07's at-risk engine.

---

### ISSUE-205 · Conduct Incident Logging

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 1 day

#### Description

Matrons and admins log conduct incidents in a structured, private record. This is NOT a public feature — guardians do NOT see it by default. It informs pastoral care decisions.

#### Acceptance Criteria

**Schema addition:**

```typescript
conductLog: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  reportedBy: v.id('users'), // Matron, warden, or admin
  incidentDate: v.string(),
  incidentTime: v.optional(v.string()),
  category: v.union(
    v.literal('bullying'),
    v.literal('fighting'),
    v.literal('theft'),
    v.literal('academic_dishonesty'),
    v.literal('disrespect'),
    v.literal('damage_to_property'),
    v.literal('drug_alcohol'),
    v.literal('curfew_violation'), // Out after lights-out / night prep missing
    v.literal('contraband'), // Prohibited items
    v.literal('positive'), // Positive recognition — conduct log isn't only negative
    v.literal('other'),
  ),
  severity: v.union(
    v.literal('minor'), // Verbal warning
    v.literal('moderate'), // Written warning
    v.literal('serious'), // Parents notified
    v.literal('critical'), // Suspension / expulsion consideration
  ),
  description: v.string(),
  witnesses: v.optional(v.string()),
  actionTaken: v.string(), // "Verbal warning given", "Reported to Head Teacher"
  followUpRequired: v.boolean(),
  followUpDate: v.optional(v.string()),
  followUpNotes: v.optional(v.string()),
  guardianNotified: v.boolean(),
  guardianNotifiedAt: v.optional(v.number()),
  isConfidential: v.boolean(), // If true: only head teacher + admin can see
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_student', ['studentId'])
  .index('by_severity', ['schoolId', 'severity']);
```

**Backend — `convex/boarding/conduct.ts`:**

- [ ] `logConductIncident` mutation: creates record; if `severity === 'serious' || 'critical'`: auto-notifies guardian via SMS and in-app
- [ ] `updateConductFollowUp` mutation: add follow-up notes once action is completed
- [ ] `getConductLogForStudent` query: full history for a student — gated to `school_admin` and `matron` roles only. Guardians never see this via a direct query.
- [ ] `getConductSummaryForSchool` query: aggregate stats — incidents by category, by severity, trend over term

**Frontend — `/(admin)/boarding/conduct/page.tsx`:**

- [ ] Log incident form: student search, category, severity, description, action taken
- [ ] Student conduct history (admin/matron only): timeline of all incidents
- [ ] School-wide conduct dashboard: incidents this week, by category, by block
- [ ] Positive recognition: category includes `'positive'` — matrons encouraged to log good behaviour too

---

### ISSUE-206 · Conduct Report and Pastoral Review

**Type:** Backend + Frontend | **Priority:** P2 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

Term-end conduct report for the head teacher and pastoral team. Feeds the Sprint 07 at-risk engine.

#### Acceptance Criteria

- [ ] `getConductTermReport` query: per student — incident count by severity, categories involved, trend (improving/worsening across terms)
- [ ] `/(admin)/boarding/conduct/reports/page.tsx`: term conduct summary with student pastoral care priorities
- [ ] **Progress snapshot update**: Friday cron updated to include:
  ```typescript
  // Added to studentProgressSnapshots
  conductIncidentsThisTerm: v.number(),
  conductSeverityHighest: v.optional(v.string()), // 'minor' | 'moderate' | 'serious' | 'critical'
  ```
  — Sprint 07 at-risk engine reads these for comprehensive welfare assessment

---

### ISSUE-207 · Disciplinary Action Management

**Type:** Backend + Frontend | **Priority:** P2 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

Formal disciplinary outcomes — written warnings, suspensions, and decisions escalated to head teacher — are tracked as structured records linked to conduct log entries.

#### Acceptance Criteria

**Schema addition:**

```typescript
disciplinaryActions: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  conductLogIds: v.array(v.id('conductLog')),
  actionType: v.union(
    v.literal('verbal_warning'),
    v.literal('written_warning'),
    v.literal('suspension_internal'), // Boarding: confined to hostel
    v.literal('suspension_external'), // Sent home
    v.literal('community_service'),
    v.literal('referred_to_head'),
  ),
  startDate: v.string(),
  endDate: v.optional(v.string()),
  decisionBy: v.id('users'),
  details: v.string(),
  guardianNotified: v.boolean(),
  letterPdfUrl: v.optional(v.string()),
  createdAt: v.number(),
})
  .index('by_student', ['studentId'])
  .index('by_school', ['schoolId']);
```

- [ ] `createDisciplinaryAction` mutation: links to conduct log entries, notifies guardian
- [ ] `generateDisciplinaryLetter` action: formal PDF letter on school letterhead — saved as `studentDocuments`
- [ ] Disciplinary action visible in student profile under a "Disciplinary" section (visible to admin only)

---

## Epic 11 — Matron & Warden Interface

> **Goal:** A role-specific home screen that gives the matron/warden everything they need for their shift — at a glance, from their phone, in the right order of urgency.

---

### ISSUE-208 · Matron Dashboard

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 1.5 days

#### Description

The matron's primary screen after login. Every critical piece of residential information in one view — designed for a matron who checks it multiple times per day from their phone.

#### User Story

> Matron Mwale opens Acadowl at 17:45. She sees: "2 sick bay admissions" (tap to view), "Night prep in 15 minutes" (countdown), "4 unread messages from parents", "1 bed swap request pending", "3 exeat applications to approve." She works through each urgency in order.

#### Acceptance Criteria

**`convex/boarding/matronDashboard.ts`:**

- [ ] `getMatronDashboardData` query — single query, returns everything:
  ```typescript
  {
    assignedBlock: HostelBlock,
    tonightsNightPrep: { submitted: boolean, absentCount?: number, minutesUntil: number },
    activeSickBayAdmissions: SickBayAdmission[],
    studentsCurrentlyOffPremises: number,   // Active exeats
    overdueExeats: ExeatPass[],             // Past return time
    visitorsOnPremises: number,             // Checked in, not checked out
    pendingBedSwapRequests: number,
    pendingExeatApplications: number,
    unreadMessages: number,                 // context: 'boarding' threads
    recentConductIncidents: ConductLog[],   // Last 3 days
    pocketMoneyDisbursmentsToday: number,
    studentsWithZeroBalance: number,        // Empty pocket money accounts
    upcomingNightPrep: { date, blockName }, // Next session
  }
  ```

**Frontend — `/(admin)/boarding/page.tsx` (matron's home):**

- [ ] Role-aware: when logged in as `matron`, this page is the default landing (not the generic admin dashboard)
- [ ] Urgent items at top with red badges: sick bay admissions, overdue exeats, unauthorised visitor attempts
- [ ] Quick-action cards (large, one-tap): "Take Night Prep" (countdown timer), "New Sick Bay Admission", "Log Visitor", "Disburse Pocket Money"
- [ ] Section: "My Block Tonight" — current occupancy, who is off premises, who is in sick bay
- [ ] Message thread preview: last 3 parent messages in boarding context
- [ ] Responsive mobile-first: designed for portrait phone view, not desktop

---

### ISSUE-209 · Matron's Student Quick-View

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

A fast-access student view optimised for the matron — shows the boarding-specific information she cares about without navigating through the full admin student profile.

#### Acceptance Criteria

- [ ] `/(admin)/boarding/students/[studentId]/page.tsx` — boarding-specific student view:
  - Photo, name, grade, block, room, bed label
  - Boarding status badge, meal plan badge, dietary flags
  - Medical: blood group, allergies, current sick bay status
  - Pocket money: current balance, this-week withdrawals, weekly limit remaining
  - Active exeat: is the student currently off premises? Until when?
  - Recent conduct incidents (last 3)
  - Guardian contacts: all guardians with phone numbers (tap-to-call on mobile)
- [ ] Quick actions:
  - "Admit to Sick Bay" (pre-fills student)
  - "Disburse Pocket Money" (pre-fills student)
  - "Log Conduct Incident"
  - "Message Guardian" (opens boarding context thread)
- [ ] Accessible by barcode scan: scanning student's ID card from the block entrance goes directly here

---

### ISSUE-210 · Warden/Matron Room Inspection Log

**Type:** Backend + Frontend | **Priority:** P2 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

Matrons conduct regular dormitory inspections. Results are logged against each room — cleanliness scores, maintenance issues, and follow-ups.

#### Acceptance Criteria

**Schema addition:**

```typescript
roomInspections: defineTable({
  schoolId: v.id('schools'),
  roomId: v.id('rooms'),
  inspectedBy: v.id('users'),
  inspectionDate: v.string(),
  cleanlinessScore: v.number(), // 1–5
  maintenanceIssues: v.optional(v.string()),
  maintenanceUrgency: v.optional(
    v.union(v.literal('low'), v.literal('medium'), v.literal('urgent')),
  ),
  followUpRequired: v.boolean(),
  followUpDate: v.optional(v.string()),
  notes: v.optional(v.string()),
  studentsFined: v.optional(
    v.array(
      v.object({
        // Students fined for cleanliness
        studentId: v.id('students'),
        reason: v.string(),
      }),
    ),
  ),
  createdAt: v.number(),
})
  .index('by_room', ['roomId'])
  .index('by_school', ['schoolId']);
```

- [ ] `logRoomInspection` mutation: creates record; if maintenance urgency is 'urgent': notifies head teacher
- [ ] `/(admin)/boarding/hostels/[blockId]/inspections/page.tsx`: inspection history per block, maintenance issues tracker

---

### ISSUE-211 · Boarding Module Settings

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

School-level configuration for the boarding module. Centralised settings page for all boarding policies.

#### Acceptance Criteria

**Schema addition to `schools`:**

```typescript
boardingConfig: v.object({
  nightPrepTimeStart: v.string(), // '18:00'
  nightPrepTimeEnd: v.string(), // '20:00'
  nightPrepReminderMinutes: v.number(), // 30 — alert if register not submitted
  lightsOutTime: v.string(), // '22:00'
  visitorHoursStart: v.string(), // '14:00'
  visitorHoursEnd: v.string(), // '17:00'
  maxVisitDurationMinutes: v.number(), // 180 — 3 hours
  requireAdminApprovalForVisitors: v.boolean(),
  exeatMinimumNoticeHours: v.number(), // 24 — hours before departure
  maxExeatDaysPerTerm: v.optional(v.number()), // null = unlimited
  allowStudentBedSwapRequests: v.boolean(),
  guardianCanAddVisitors: v.boolean(),
});
```

- [ ] `/(admin)/settings/boarding/page.tsx`: all boarding configuration options
- [ ] Settings page sections: Night Prep, Visitors, Exeat, Pocket Money (links to `pocketMoneyConfig`), Meal Plans (links to `mealPlanConfig`)

---

## Epic 12 — Boarding Analytics & Reports

---

### ISSUE-212 · Boarding Module Dashboard (Admin/Head Teacher)

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 1 day

#### Description

Admin and head teacher view of the entire boarding operation — designed for strategic oversight rather than day-to-day operations.

#### Acceptance Criteria

**`convex/boarding/analytics.ts`:**

- [ ] `getBoardingOverviewStats` query:
  - Total boarding students, bed occupancy %, unassigned students count
  - Night prep attendance % (this week, this term average)
  - Active sick bay cases, hospital referrals this term
  - Pocket money total in trust, this week's disbursements
  - Open exeats, overdue exeats
  - Conduct incidents this week (by severity)
  - Visitors on premises right now

**Frontend — `/(admin)/boarding/analytics/page.tsx`:**

- [ ] Grid of stat cards (role-aware — matron sees ops stats; head teacher sees the full picture)
- [ ] Boarding attendance trend chart: night prep % by week (recharts `LineChart`)
- [ ] Sick bay frequency chart: admissions per week (recharts `BarChart`)
- [ ] Pocket money flow chart: deposits vs withdrawals per week
- [ ] Bed occupancy over time (using `bedOccupancySnapshots`)

---

### ISSUE-213 · MoE Boarding Return Data

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

The Ministry of Education requires schools to submit boarding statistics annually. This scaffolds the queries for the Sprint 07 MoE reporting module.

#### Acceptance Criteria

- [ ] `getMoeBoardingReturn` query (joins `convex/reports/moe.ts` from Sprint 01 ISSUE-090):
  ```typescript
  {
    totalBoardingCapacity: number,     // From hostelBlocks.capacity sum
    actualOccupancy: number,           // From bedAssignments for the year
    occupancyByGender: { boys: number, girls: number },
    boardingFeesByGrade: ...,          // From invoices
    staffToStudentRatio: number,       // Matrons:students
  }
  ```
- [ ] Returns placeholder data until Sprint 07 implements the full MoE return

---

### ISSUE-214 · Term-End Boarding Summary Report

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

A comprehensive end-of-term report covering all boarding operations — attendance, welfare, finance — suitable for presentation to the school board.

#### Acceptance Criteria

- [ ] `getTermBoardingReport` query: combines night prep stats, sick bay stats, conduct stats, pocket money stats, exeat stats, visitor stats
- [ ] `/(admin)/boarding/reports/term-summary/page.tsx`: printable report view
- [ ] PDF export: formal A4 report with school letterhead
- [ ] Sent automatically to head teacher at term end via in-app notification

---

### ISSUE-215 · Boarding Welfare Alert System

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

A composite welfare alert that synthesises signals from multiple boarding modules. A student flagged here needs pastoral attention.

#### Acceptance Criteria

- [ ] `detectBoardingWelfareAlerts` internal action — runs as part of the Friday cron:
  - Flags a student if 2+ of the following in the last 2 weeks:
    - 3+ night prep absences
    - 2+ sick bay admissions
    - Any conduct incident of severity `'serious'` or `'critical'`
    - Pocket money balance = 0 for 5+ days (no guardian top-up)
    - 1+ unauthorised visitor attempts
  - Creates in-app alert for matron and head teacher
  - Updates `studentProgressSnapshots.riskFlags` with `'boarding_welfare_concern'`
- [ ] `/(admin)/boarding/welfare-alerts/page.tsx`: list of flagged students with their alert reasons, matron assigned to follow up

---

## Epic 13 — Guardian Portal — Boarding Section

> **Goal:** Give parents of boarding students a dedicated, information-rich section in their portal. They must feel connected to their child's residential life without being overwhelmed.

---

### ISSUE-216 · Guardian Portal — Boarding Tab

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 1.5 days

#### Description

A new "Boarding" tab added to the per-child detail shell (Sprint 03 ISSUE-134). Only shown if the student's `boardingStatus === 'boarding'` AND `Feature.BOARDING` is enabled. This is the guardian's window into their child's residential life.

#### Acceptance Criteria

**`convex/guardian/boarding.ts`:**

- [ ] `getBoardingTabData` query — all boarding data for a guardian's child in one call:
  ```typescript
  {
    currentBed: { bedLabel, roomName, blockName } | null,
    mealPlan: string | null,
    dietaryFlags: string[],
    nightPrepThisWeek: { present: number, total: number },
    nightPrepThisTerm: { percent: number },
    sickBay: {
      currentlyAdmitted: boolean,
      currentAdmission?: { admittedAt, reason, matronPhone },
      visitsThisTerm: number,
    },
    pocketMoney: {                             // null if Feature.POCKET_MONEY off
      balanceZMW: number,
      withdrawnThisWeekZMW: number,
      weeklyLimitZMW: number,
    } | null,
    activeExeat: ExeatPass | null,
    recentVisitors: VisitorLogEntry[],         // Last 3
    boardingMessages: number,                  // Unread messages from matron
    thisWeeksMenu: WeeklyMenu | null,          // If Feature.MEAL_PLANS
  }
  ```

**Frontend — `/(parent)/children/[studentId]/boarding/page.tsx`:**

- [ ] **Status section** (top, most important):
  - Current bed: "Livingstone House, Room 14, Bed 3A"
  - If currently in sick bay: full-width amber/red banner with admission time and reason
  - If currently on exeat: "Off premises until Sunday 18:00" with countdown

- [ ] **Night Prep** card:
  - This week's mini attendance bar (5 squares, colored by status)
  - Term attendance %: same ring chart as day attendance
  - "Tonight: Not yet marked" / "Tonight: Present ✓" / "Tonight: Absent ✗"

- [ ] **Pocket Money** card (if `Feature.POCKET_MONEY`):
  - Balance: "ZMW 95 available"
  - Weekly usage: "ZMW 50 of ZMW 100 weekly limit used"
  - "Top Up" button → mobile money flow (ISSUE-197)
  - Recent withdrawals: last 3 transactions

- [ ] **Exeat & Visitors** section:
  - "Apply for Exeat" button (ISSUE-190)
  - Upcoming approved exeats list
  - "Manage Authorised Visitors" link (ISSUE-187)
  - Recent visit log: last 3 entries

- [ ] **This Week's Menu** card (if `Feature.MEAL_PLANS`): today's meals with dietary flag indicator

- [ ] **Message Matron** button: opens a new `context: 'boarding'` thread (Sprint 03 messaging — no changes needed)

---

### ISSUE-217 · Guardian Push Notifications — Boarding Events

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

Wire all boarding-specific events to the guardian notification system (Sprint 03 ISSUE-161). Every notification must check the guardian's per-event preference before sending.

#### Acceptance Criteria

Events that trigger guardian notifications — all using existing `sendSms` + push notification infrastructure:

| Event                          | Trigger                    | Preference Key          | Priority                    |
| ------------------------------ | -------------------------- | ----------------------- | --------------------------- |
| Sick bay admission             | `admitToSickBay`           | `sickBayAdmission`      | HIGH — always push          |
| Hospital referral              | `referStudentToHospital`   | N/A — always sent       | URGENT — override all prefs |
| Night prep absence             | `markNightPrepAttendance`  | `nightPrepAbsent`       | Normal                      |
| Visitor arrival (authorised)   | `logVisitorEntry`          | `visitorArrival`        | Low                         |
| Unauthorised visitor attempt   | `logVisitorEntry`          | N/A — always sent       | HIGH                        |
| Exeat approved                 | `approveExeat`             | (always)                | Normal                      |
| Exeat departure confirmed      | `recordExeatDeparture`     | (always)                | Normal                      |
| Exeat return confirmed         | `recordExeatReturn`        | (always)                | Normal                      |
| Exeat overdue                  | cron                       | (always)                | HIGH                        |
| Pocket money deposit confirmed | `creditPocketMoneyAccount` | `pocketMoneyWithdrawal` | Normal                      |
| Pocket money withdrawal        | `disburseFromPocketMoney`  | `pocketMoneyWithdrawal` | Normal                      |
| Pocket money balance zero      | weekly digest              | (weekly digest only)    | Low                         |

- [ ] Each notification uses the school's `smsTemplates` for the relevant event type (or defaults)
- [ ] `sendPushNotification` action (Sprint 03 ISSUE-159) called for HIGH/URGENT events even if guardian doesn't have SMS enabled
- [ ] All notifications logged to `notifications` table with `relatedEntityType` set correctly

---

### ISSUE-218 · Child Switcher — Boarding Status Badge

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

Extend the Sprint 03 multi-child dashboard (ISSUE-133) to show boarding-specific status on the child summary card. The `getGuardianDashboardData` query already returns `boardingStatus` — this issue adds the UI elements.

#### Acceptance Criteria

- [ ] `ChildSummaryCard` component updated:
  - If `boardingStatus === 'boarding'`: show "🏠 Boarder" badge on the card
  - If currently in sick bay: amber pulsing dot on the card's top-right corner with "In sick bay" tooltip
  - If currently on exeat: "Off premises" chip on the card
  - If pocket money balance = 0: subtle amber indicator "Top up needed"
- [ ] `getGuardianDashboardData` query (Sprint 03 ISSUE-133) updated to include:
  - `currentlyInSickBay: boolean`
  - `activeExeat: boolean`
  - `pocketMoneyBalanceZMW: number | null`
    (These are returned as null/false if `Feature.BOARDING` is off — no UI shown)

---

## Schema Additions in This Sprint

New tables added to `convex/schema.ts`. All are additions — no Sprint 00/01/02/03 tables modified.

| New Table               | Defined In                          |
| ----------------------- | ----------------------------------- |
| `bedAssignments`        | ISSUE-172                           |
| `bedOccupancySnapshots` | ISSUE-174                           |
| `bedSwapRequests`       | ISSUE-175                           |
| `boardingStatusHistory` | ISSUE-171                           |
| `authorisedVisitors`    | ISSUE-184                           |
| `exeatPasses`           | ISSUE-188                           |
| `medicationLog`         | ISSUE-192                           |
| `conductLog`            | ISSUE-205                           |
| `disciplinaryActions`   | ISSUE-207                           |
| `roomInspections`       | ISSUE-210                           |
| `weeklyMenus`           | ISSUE-182                           |
| `mealAttendance`        | ISSUE-183                           |
| `guardianLinkDisputes`  | (moved here — originally Sprint 03) |

**Fields added to existing tables:**

| Table                      | New Fields                                                                                                                                                | Issue               |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `hostelBlocks`             | `description`, `floorCount`, `isActive`, `wardenPhone`, `emergencyProcedures`, `createdAt`, `updatedAt`                                                   | ISSUE-168           |
| `rooms`                    | `floor`, `notes`, `createdAt`, `updatedAt`                                                                                                                | ISSUE-169           |
| `beds`                     | `position`, `bunkPosition`, `notes`, `createdAt`                                                                                                          | ISSUE-170           |
| `sickBayAdmissions`        | `symptoms`, `initialTreatment`, `temperature`, `bloodPressure`, `isolationRequired`, `sickBayBed`, `guardianNotifiedAt`, `dischargeNotes`, `dischargedBy` | ISSUE-191           |
| `pocketMoneyAccounts`      | `termId`, `yearToDateDepositsZMW`, `yearToDateWithdrawalsZMW`, `lastWithdrawalDate`, `withdrawnThisWeekZMW`, `weeklyLimitZMW`, `isActive`, `notes`        | ISSUE-196           |
| `pocketMoneyTransactions`  | `guardianNotified`, `receiptNumber`, `createdAt`                                                                                                          | ISSUE-199           |
| `students`                 | `dietaryFlags`, `dietaryNotes`                                                                                                                            | ISSUE-181           |
| `staff`                    | `managedHostelBlockId`                                                                                                                                    | ISSUE-168           |
| `schools`                  | `boardingConfig`, `mealPlanConfig`, `pocketMoneyConfig`                                                                                                   | ISSUE-181, 196, 211 |
| `studentProgressSnapshots` | `conductIncidentsThisTerm`, `conductSeverityHighest`                                                                                                      | ISSUE-206           |

---

## Dependency Graph

```
ISSUE-168 (Hostel Blocks)
    └─► ISSUE-169 (Rooms)
            └─► ISSUE-170 (Beds + Visual Map)
                    └─► ISSUE-172 (Bed Assignment Logic)
                            └─► ISSUE-173 (Bulk Assignment UI)
                            └─► ISSUE-174 (Term-End Rollover)
                            └─► ISSUE-175 (Swap Requests)
                            └─► ISSUE-176 (Occupancy Map)

ISSUE-171 (Boarding Status Change) ─── depends on ISSUE-172 (bed clearing on status change)
    └─► ISSUE-203 (Invoice Adjustments) ─── depends on Sprint 02 credit note flow

ISSUE-177 (Night Prep Attendance) ─── depends on ISSUE-168 (blocks), ISSUE-172 (boarding students list)
    └─► ISSUE-178 (Night Prep Dashboard)
    └─► ISSUE-179 (Night Prep Reports)
    └─► ISSUE-180 (Student/Guardian Profile)

ISSUE-181 (Meal Plans)
    └─► ISSUE-182 (Weekly Menu)
    └─► ISSUE-183 (Meal Attendance)

ISSUE-184 (Authorised Visitors)
    └─► ISSUE-185 (Gate Log Entry) ─── depends on ISSUE-184
    └─► ISSUE-186 (Visitor Dashboard)
    └─► ISSUE-187 (Guardian Visitor Management) ─── Epic 13 dependency

ISSUE-188 (Exeat Application)
    └─► ISSUE-189 (Exeat PDF)
    └─► ISSUE-190 (Guardian Exeat Portal) ─── Epic 13 dependency

ISSUE-191 (Sick Bay Admission) ─── depends on ISSUE-168 (school blocks), ISSUE-192 (medication)
    └─► ISSUE-192 (Medication Log)
    └─► ISSUE-193 (Hospital Referral)
    └─► ISSUE-194 (Discharge + Follow-Up)
    └─► ISSUE-195 (Student/Guardian Profile)

ISSUE-196 (Pocket Money Accounts) ─── must be done before all pocket money issues
    └─► ISSUE-197 (Guardian Top-Up) ─── depends on Sprint 03 mobile money flow
    └─► ISSUE-198 (Disbursement Interface)
    └─► ISSUE-199 (Account Ledger)
    └─► ISSUE-200 (End-of-Term Reconciliation)
    └─► ISSUE-201 (School-Wide Dashboard)

ISSUE-202 (Boarding Fee Integration) ─── verify Sprint 02 fee structure works, no code changes
ISSUE-204 (Pocket Money as Financial Audit) ─── extends Sprint 02 cashbook

ISSUE-205 (Conduct Log) ─── can run in parallel
    └─► ISSUE-206 (Conduct Reports)
    └─► ISSUE-207 (Disciplinary Actions)

ISSUE-208 (Matron Dashboard) ─── depends on ALL other boarding epics being substantially complete
    └─► ISSUE-209 (Student Quick-View)

ISSUE-212 (Analytics Dashboard) ─── depends on all data sources
ISSUE-215 (Welfare Alert Cron) ─── depends on conduct, sick bay, pocket money, night prep

ISSUE-216 (Guardian Boarding Tab) ─── depends on ISSUE-172, 177, 188, 191, 196, 197
    └─► ISSUE-217 (Guardian Notifications)
    └─► ISSUE-218 (Child Switcher Badges)
```

---

## Definition of Done

All Sprint 00–03 DoD criteria apply, plus:

- [ ] **Feature gate tested**: All boarding UI is completely absent (not just empty) when `Feature.BOARDING` is disabled on a school. Tested against the day-secondary seed school (Kabulonga) — no boarding nav items, no boarding routes, no boarding Convex functions callable.
- [ ] **Mixed school tested**: All boarding features tested with the `mixed_secondary` seed school (Chengelo). Day students must be invisible to ALL hostel queries. Adding a day student to a bed assignment must throw an error.
- [ ] **Offline night prep tested**: Night prep register tested with Chrome DevTools → Offline. Matron marks 30 students, submits offline. IndexedDB queue shows 1 pending mutation. Network restored → syncs → absence SMSes fire. Tested on real Android device.
- [ ] **Pocket money limit enforced**: Attempting to disburse above weekly limit without manager PIN returns `LIMIT_EXCEEDED` error. Attempting to disburse above account balance returns `INSUFFICIENT_BALANCE`. Both tested in unit tests.
- [ ] **Sick bay SMS fires immediately**: `admitToSickBay` mutation must trigger SMS within 30 seconds. Not queued for the next cron run — this is an immediate action. Verified in dev (console output) with timestamp check.
- [ ] **Hospital referral overrides notification preferences**: Guardian with `sickBayAdmission: false` in prefs must STILL receive hospital referral SMS. Tested explicitly.
- [ ] **Bed occupancy snapshot created at term rollover**: After running `activateTerm`, verify a `bedOccupancySnapshots` record exists for the closed term with correct occupancy numbers.
- [ ] **ZRA not called for pocket money**: `pocketMoneyTransactions` are financial records but NOT invoices. The ZRA VSDC integration must NOT be called for pocket money deposits or withdrawals. Verified in logs.
- [ ] **Progress snapshots populated**: After running the Friday cron, verify `nightPrepAttendancePercent` and `sickBayVisitsThisTerm` are non-null for boarding students.
- [ ] **`conductLog.severity` field exists with correct enum**: Sprint 07 at-risk engine reads this. Verified in schema push that the field accepts all four values.

---

## Sprint 04 → Sprint 05 Handoff Checklist

Before Sprint 05 (LMS & Library) begins, verify:

- [ ] `studentProgressSnapshots.nightPrepAttendancePercent` and `.sickBayVisitsThisTerm` are being written by the Friday cron — Sprint 05 LMS engagement score uses the snapshot table
- [ ] `conductLog` table has real records from seed data — Sprint 07 at-risk engine pre-requisite; Sprint 05 can verify the table exists and is queryable
- [ ] `conductLog.conductIncidentsThisTerm` and `.conductSeverityHighest` are populated in snapshots — pre-verified for Sprint 07
- [ ] `messageThreads` with `context: 'boarding'` are being created by `/(admin)/boarding/sick-bay` and matron dashboard — Sprint 05 LMS messages will use `context: 'lms'`, same table
- [ ] `studentDocuments` table contains exeat PDFs, sick bay referral letters, and disciplinary letters — Sprint 05 library and LMS will add more document types to the same table
- [ ] `pocketMoneyAccounts` persist across terms correctly — Sprint 05 doesn't directly use this, but Sprint 07 financial analytics need unbroken history
- [ ] Boarding student count in seed data: Chengelo school has at least 40 boarding students with beds assigned, pocket money accounts, and 2 weeks of night prep attendance — Sprint 05 LMS will create courses for these students' sections
- [ ] `students.dietaryFlags` is populated for at least 5 seed students — not used by Sprint 05 but needed for Sprint 07 welfare analytics
- [ ] `Feature.BOARDING` can be toggled off and all boarding routes return 404, not 500 — Sprint 05 must not accidentally depend on boarding data being present
- [ ] The `attendance` table correctly stores night prep records with `period: 'night_prep'` — Sprint 05 LMS engagement query filters this period out when computing academic attendance correlation

---

_Acadowl Development Guide — Sprint 04 — Boarding Module_
_Last updated: 2025 | Previous: Sprint 03 — Guardian Portal & Communications | Next: Sprint 05 — LMS & Library_

