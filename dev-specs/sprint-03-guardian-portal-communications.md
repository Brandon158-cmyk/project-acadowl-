# Acadowl — Sprint 03: Guardian Portal & Communications

## Development Guide & Issue Tracker

> **Sprint Goal:** Build the guardian-facing side of Acadowl — the mobile-first parent portal that makes the platform visible to the 80% of users who are not school staff. By the end of this sprint, a parent can log in with their phone, see their child's attendance, download their report card, pay fees via Airtel Money, message their child's teacher, and receive meaningful notifications — all from a basic Android browser on a 3G connection. Every UI pattern, data query, and communication channel built here is the foundation that boarding (Sprint 04), transport (Sprint 06), and the AI at-risk engine (Sprint 07) will extend without modification.

---

## 📋 Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [Continuity from Sprints 00–02](#continuity-from-sprints-0002)
3. [Forward-Compatibility Commitments](#forward-compatibility-commitments)
4. [Mobile-First Design Principles](#mobile-first-design-principles)
5. [Epic 1 — Guardian Onboarding & Identity](#epic-1--guardian-onboarding--identity)
6. [Epic 2 — Multi-Child Dashboard](#epic-2--multi-child-dashboard)
7. [Epic 3 — Attendance Visibility](#epic-3--attendance-visibility)
8. [Epic 4 — Academic Results & Report Cards](#epic-4--academic-results--report-cards)
9. [Epic 5 — Fee Payment from Portal](#epic-5--fee-payment-from-portal)
10. [Epic 6 — Teacher–Parent Messaging](#epic-6--teacherparent-messaging)
11. [Epic 7 — School Announcements & Noticeboard](#epic-7--school-announcements--noticeboard)
12. [Epic 8 — WhatsApp Integration](#epic-8--whatsapp-integration)
13. [Epic 9 — Notification Preferences & History](#epic-9--notification-preferences--history)
14. [Epic 10 — Guardian Profile & Child Management](#epic-10--guardian-profile--child-management)
15. [Dependency Graph](#dependency-graph)
16. [Schema Additions in This Sprint](#schema-additions-in-this-sprint)
17. [Definition of Done](#definition-of-done)
18. [Sprint 03 → Sprint 04 Handoff Checklist](#sprint-03--sprint-04-handoff-checklist)

---

## Sprint Overview

| Field            | Value                                            |
| ---------------- | ------------------------------------------------ |
| **Sprint Name**  | Sprint 03 — Guardian Portal & Communications     |
| **Duration**     | 5 weeks                                          |
| **Team Size**    | 3–4 developers                                   |
| **Total Issues** | 40                                               |
| **Prerequisite** | Sprint 02 complete and all handoff checks passed |

### Sprint Epics at a Glance

| #   | Epic                                | Issues | Est. Days |
| --- | ----------------------------------- | ------ | --------- |
| 1   | Guardian Onboarding & Identity      | 4      | 3         |
| 2   | Multi-Child Dashboard               | 4      | 4         |
| 3   | Attendance Visibility               | 3      | 3         |
| 4   | Academic Results & Report Cards     | 4      | 3         |
| 5   | Fee Payment from Portal             | 5      | 5         |
| 6   | Teacher–Parent Messaging            | 6      | 6         |
| 7   | School Announcements & Noticeboard  | 4      | 3         |
| 8   | WhatsApp Integration                | 3      | 4         |
| 9   | Notification Preferences & History  | 3      | 2         |
| 10  | Guardian Profile & Child Management | 4      | 3         |

---

## Continuity from Sprints 00–02

Verify these deliverables are in place before writing any Sprint 03 code.

| Deliverable                                                                            | How Sprint 03 Uses It                                                                      |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `guardians` table with `phone`, `userId`, `notifPrefs` (Sprint 00 ISSUE-006)           | Guardian profile, notification preferences, OTP login                                      |
| `students.guardianLinks[]` with per-guardian permissions (Sprint 00 ISSUE-007)         | Every query checks `canSeeResults`, `canSeeAttendance`, `canPayFees` before returning data |
| Phone OTP login flow (Sprint 00 ISSUE-013)                                             | Primary login method for all guardians                                                     |
| Parent portal shell — `/(parent)/layout.tsx` with child switcher (Sprint 00 ISSUE-034) | Sprint 03 fully populates this shell with real data                                        |
| `notifications` table and `createNotification` (Sprint 01 ISSUE-075)                   | Notification centre reads from this table                                                  |
| SMS dispatch layer `sendSms` (Sprint 01 ISSUE-072)                                     | Messaging system and announcement broadcasts                                               |
| `attendance` records with `studentId + date + status` (Sprint 01 ISSUE-066)            | Attendance calendar and weekly summary                                                     |
| `termAggregates` with `isReleased: true` guard (Sprint 01 ISSUE-082, 086)              | Results only shown after admin releases them                                               |
| `invoices.pdfUrl`, `payments.receiptPdfUrl` (Sprint 02 ISSUE-099, 110)                 | "Download Invoice" and "Download Receipt" buttons                                          |
| `guardianLedger` table (Sprint 02 ISSUE-114)                                           | Parent portal financial statement                                                          |
| `consolidatedInvoices` and "Pay All" flow (Sprint 02 ISSUE-106)                        | Multi-child payment — Sprint 03 surfaces the button                                        |
| `initiateMtnPushPayment` stub (Sprint 02 ISSUE-108)                                    | "Pay Now" button in portal triggers this                                                   |
| `lmsSubmissions` and `getHomeworkForStudent` (Sprint 01 ISSUE-047)                     | Homework visibility in parent portal                                                       |
| `schoolEvents` with `visibleToParents: true` (Sprint 01 ISSUE-043)                     | School calendar in parent portal                                                           |
| Multi-school guardian support (Sprint 00 ISSUE-031)                                    | Cross-school child switcher                                                                |

---

## Forward-Compatibility Commitments

| Decision                                                                                                     | Future Sprint Dependency                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`messages` table is generic** — `context` field supports `'general' \| 'boarding' \| 'transport' \| 'lms'` | Sprint 04 boarding module adds matron→parent messages about hostel incidents. Sprint 06 transport adds driver→parent missed-stop alerts. Same table, same UI thread.                                                           |
| **`parentNotifications` preference schema is extensible** — stored as `Record<string, boolean>`              | Sprint 04 adds `sickBayAdmission`, `visitorArrival`, `pocketMoneyWithdrawal`. Sprint 06 adds `busArriving`, `studentNotBoarded`. All read from the same preference map.                                                        |
| **Child switcher uses `guardianProfiles` array** from `getMe`                                                | Sprint 04 boarding status badge on each child is added to the switcher card. Sprint 06 adds a transport stop indicator. Components just receive the child object — no structural changes needed.                               |
| **Announcement `category` field is open-ended**                                                              | Sprint 04 adds `'hostel'` category announcements visible only to boarding parents. Sprint 06 adds `'transport'` route updates. Same announcement table, same query — just new category values.                                 |
| **Payment initiation from portal calls a generic `initiatePayment` action**                                  | The action dispatches to Airtel or MTN based on guardian's phone prefix. Sprint 04 pocket money top-up uses the same action with `paymentContext: 'pocket_money'`. Sprint 06 transport fee uses `paymentContext: 'transport'`. |
| **Message threads are indexed by `[schoolId, participantIds, context]`**                                     | Sprint 05 LMS adds a thread per course between student and teacher. The same thread UI component is reused — just with `context: 'lms'` and different participant types.                                                       |
| **`studentProgressSnapshot` is written weekly by a cron**                                                    | Sprint 07 AI at-risk engine reads these snapshots to compute risk scores without re-scanning all historical records. Every snapshot written in Sprint 03 becomes training/inference data for Sprint 07.                        |

---

## Mobile-First Design Principles

These are non-negotiable constraints for every UI issue in this sprint. The parent portal is the most performance-sensitive surface in Acadowl — many guardians use basic Android phones on Airtel's 3G network.

### Performance Budget

- **First Contentful Paint (FCP)**: < 2 seconds on simulated 3G (Chrome DevTools "Slow 3G" throttling)
- **Time to Interactive (TTI)**: < 4 seconds on simulated 3G
- **Total page weight**: < 150KB per route (excluding cached assets)
- **Images**: All student/staff photos served via Cloudinary with `w_80,q_auto,f_auto` transforms
- **Fonts**: System font stack only — no Google Fonts download for parent portal routes

### Touch and Interaction Design

- **Minimum tap target**: 48px × 48px for all interactive elements
- **Bottom navigation**: Primary actions in bottom tab bar, not top nav (thumb-reachable on phones)
- **No hover states**: All interactions must work with touch (no tooltip-only information)
- **Pull to refresh**: Implement on dashboard and key data screens using touch events
- **Offline message**: Graceful degradation — cached data shown with "Last updated X minutes ago" when offline

### Data Usage Consciousness

- **Pagination over infinite scroll**: Load 20 records, "Load more" button — not endless scroll that burns data
- **Image lazy loading**: Only load photos when they scroll into viewport
- **Skeleton screens**: Show content structure immediately; never block full page render on data load
- **SMS fallback note**: Every critical piece of information (results, fees) is also delivered via SMS — portal is an enhancement, not the only channel

---

## Epic 1 — Guardian Onboarding & Identity

> **Goal:** A frictionless first experience for parents. From receiving an SMS invitation to seeing their child's data in under 2 minutes on a first-time phone.

---

### ISSUE-130 · Guardian Account Activation Flow

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 1 day

#### Description

When a guardian's phone number is added to the system (either at student enrolment in Sprint 01 ISSUE-048 or via admin in ISSUE-161), they receive an SMS invitation. This issue builds the full activation flow from that SMS to a configured account.

#### User Story

> Mrs. Banda receives an SMS: "Kabulonga Boys School has registered you as guardian for Chanda Banda. Access your parent portal at kabulonga.Acadowl.zm. Your phone: +260971234567. Reply STOP to opt out." She opens the link, verifies her phone via OTP, and sees Chanda's dashboard.

#### Acceptance Criteria

**Backend — `convex/guardians/activation.ts`:**

- [ ] `sendGuardianInvitation` mutation:
  - Called by `enrolStudent` (Sprint 01) and `addGuardianToStudent` (ISSUE-161)
  - Creates a `guardianInvitations` record (schema below) with `status: 'sent'`
  - SMS body: `"[School Name] has registered you as guardian for [Student Name]. Access your parent portal: [school-url]/activate?token=[token]. Your login is your phone number."`
  - Token is a cryptographically random 32-character hex string, expires 72 hours
  - Requires `requirePermission(ctx, Permission.ENROL_STUDENT)`

- [ ] `activateGuardianAccount` mutation:
  - Called when guardian clicks the activation link
  - Validates token: exists, not expired, not already used
  - Marks `guardianInvitations.status: 'accepted'`
  - Marks `guardians.isVerified: true`
  - Sets `users.isFirstLogin: true` to trigger first-login setup (Sprint 00 ISSUE-038)
  - Returns `{ schoolSlug, guardianId }` — client navigates to portal

**Schema addition:**

```typescript
guardianInvitations: defineTable({
  schoolId: v.id('schools'),
  guardianId: v.id('guardians'),
  studentId: v.id('students'),
  token: v.string(),
  sentTo: v.string(), // Phone number SMS was sent to
  status: v.union(
    v.literal('sent'),
    v.literal('accepted'),
    v.literal('expired'),
    v.literal('resent'),
  ),
  sentAt: v.number(),
  acceptedAt: v.optional(v.number()),
  expiresAt: v.number(),
})
  .index('by_token', ['token'])
  .index('by_guardian', ['guardianId'])
  .index('by_school', ['schoolId']);
```

**Frontend — `/(auth)/activate/page.tsx`:**

- [ ] Reads `token` query param → calls `validateActivationToken` query to confirm it's valid
- [ ] If valid: shows "Welcome to [School Name]! You're being set up as guardian for [Student Name]."
- [ ] "Verify My Phone" button → triggers OTP send to guardian's phone → OTP entry → on success calls `activateGuardianAccount`
- [ ] If token expired: "This link has expired. Please contact [school name] to get a new link."
- [ ] After activation: redirect to parent portal first-login setup (Sprint 00 ISSUE-038)
- [ ] `resendInvitation` mutation: admin can resend from `/(admin)/students/[id]` Guardians tab

---

### ISSUE-131 · Guardian First-Login Setup — Parent-Specific

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Extends Sprint 00 ISSUE-038 (first login setup) with parent-specific steps: confirm their children are correctly listed, set notification preferences, and optionally add a WhatsApp number.

#### Acceptance Criteria

- [ ] `/(parent)/profile/setup/page.tsx` — 3-step wizard triggered on `user.isFirstLogin`:

  **Step 1 — Confirm Your Children**
  - Shows list of auto-linked children: photo, name, grade, school
  - "This doesn't look right" button → contacts the school via message
  - If cross-school children shown: explains they are from different schools

  **Step 2 — Notification Preferences**
  - SMS Alerts toggle (overall master switch)
  - Sub-toggles: Attendance absence alerts | Fee reminders | Results released | School announcements | Homework set
  - WhatsApp number field: "+260 9X..." (optional — if different from phone number used to log in)
  - "Receive WhatsApp messages" toggle (shown only if `Feature.WHATSAPP_NOTIFICATIONS`)

  **Step 3 — Done**
  - Summary of preferences set
  - "Go to My Dashboard" button
  - Tips card: "You'll receive an SMS when [Student Name] is absent from school."

- [ ] Saves to `guardians.receiveAttendanceSMS`, `guardians.receiveResultsSMS`, `guardians.receiveFeeReminderSMS`, `guardians.whatsappPhone` (schema addition)
- [ ] Can be re-visited at any time from `/(parent)/profile`

---

### ISSUE-132 · Guardian Link Verification and Dispute Flow

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

A guardian may be incorrectly linked to a student (wrong phone number at enrolment, step-parent situation). They need a way to flag this and the school needs to investigate.

#### Acceptance Criteria

- [ ] On first login setup Step 1: "This child doesn't belong to me" → submits a `guardianLinkDispute` record
- [ ] `guardianLinkDispute` schema:
  ```typescript
  guardianLinkDisputes: defineTable({
    schoolId: v.id('schools'),
    guardianId: v.id('guardians'),
    studentId: v.id('students'),
    reason: v.string(),
    status: v.union(v.literal('open'), v.literal('resolved'), v.literal('dismissed')),
    resolvedBy: v.optional(v.id('users')),
    resolvedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_school', ['schoolId']);
  ```
- [ ] Admin sees disputes in `/(admin)/students/guardian-disputes/page.tsx`
- [ ] Admin can: remove the guardian link, confirm it is correct, or add a note
- [ ] Disputed links are flagged in student profile Guardians tab with a warning badge
- [ ] Guardian who raised dispute receives SMS when resolved: "Your query regarding [Student Name] has been resolved. Contact [school] if you have questions."

---

### ISSUE-133 · Guardian Sibling Overview Landing Page

**Type:** Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

For guardians with multiple children, the first screen they see after login is a multi-child overview — not a single child's detail. This is the parent portal's "home base" that Sprint 04 and 06 will extend.

#### User Story

> Mrs. Musonda has three children at Kabulonga Girls. When she logs in, she sees three side-by-side summary cards — one per child. Each card shows: photo, name, grade, today's attendance status, term fee balance, and one highlight (e.g., "Report card available"). She taps a card to go to that child's detail.

#### Acceptance Criteria

- [ ] `/(parent)/dashboard/page.tsx` (extending Sprint 00 ISSUE-035 placeholder):
  - For single-child guardian: renders child detail view directly (skip overview)
  - For multi-child guardian: renders child card grid
- [ ] `getGuardianDashboardData` query:
  - Returns data for ALL linked children in ONE query (no N+1 waterfall)
  - Per child: `{ student, todayAttendance, termBalance, hasUnreleasedResults, hasNewHomework, hasUnreadMessages, boardingStatus }`
  - `boardingStatus` included now — Sprint 04 adds hostel info here without query change
- [ ] Child summary card component `ChildSummaryCard.tsx`:
  - Circular photo (80px) or initials avatar
  - Full name, grade/section
  - Today's attendance: green "Present" / red "Absent" / amber "Late" / gray "Not yet marked"
  - Fee balance: "ZMW 0 — Cleared" (green) or "ZMW 1,500 owing" (amber/red)
  - Highlight badge: "📄 Report card ready" / "📚 2 homeworks due" / "💬 1 unread message" (one at a time, prioritised)
  - Tap: navigates to `/(parent)/children/[studentId]`
- [ ] Pull-to-refresh: reloads `getGuardianDashboardData`
- [ ] School name and logo shown per card if children are at different schools

---

## Epic 2 — Multi-Child Dashboard

---

### ISSUE-134 · Per-Child Detail Shell and Routing

**Type:** Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

The per-child detail view — the navigation hub for a single child's data. This is the screen a parent lands on after tapping a child's card. All sub-pages (attendance, results, fees, messages) are children of this route.

#### Acceptance Criteria

- [ ] Route: `/(parent)/children/[studentId]/` — dynamic route, `studentId` is a Convex ID
- [ ] On load: validates that the authenticated guardian is linked to this student (server-side check in the page's Convex query — returns 404 if not linked or `canSeeResults: false`)
- [ ] `/(parent)/children/[studentId]/layout.tsx`:
  - Child header: large circular photo, full name, grade/section, school name, boarding badge (shown if boarding)
  - Horizontal tab bar: Overview | Attendance | Results | Fees | Messages | More
  - "More" expands to: Timetable | Homework | Transport (Sprint 06) | Documents
  - Tab bar is sticky — always visible while scrolling content
- [ ] Deep linking: `/(parent)/children/[studentId]/attendance` navigates directly to attendance tab
- [ ] Child switcher: pressing the child's photo/name in the header shows the other children for quick switching without going back to dashboard
- [ ] Breadcrumb in mobile header: "← My Children" back arrow

---

### ISSUE-135 · Per-Child Overview Tab

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

The overview tab for a single child — a curated summary of what matters most to the parent. Designed to answer: "Is my child okay today?" in under 5 seconds.

#### Acceptance Criteria

**`convex/guardian/childOverview.ts`:**

- [ ] `getChildOverviewForGuardian` query:
  - Validates guardian's `canSeeAttendance` and `canSeeResults` permissions before including those sections
  - Returns a single payload:
    ```typescript
    {
      student: { name, grade, section, photo, boardingStatus },
      todayAttendance: { status, period?, markedAt?, markedBy? } | null,
      thisWeekAttendance: { present: number, absent: number, late: number, total: number },
      currentTermAttendancePercent: number,
      latestResults: { subject, grade, percent }[],         // Last released term's top 5 subjects
      feeBalance: { outstanding: number, dueDate: string } | null,
      upcomingEvents: SchoolEvent[],                        // Next 3 school events
      recentNotifications: Notification[],                  // Last 3 notifications
      homework: { pending: number, overdue: number },
      // Sprint 04 will add: sickBayStatus, currentBed
      // Sprint 06 will add: transportRoute, nextBusDeparture
    }
    ```

**Frontend — `/(parent)/children/[studentId]/page.tsx`:**

- [ ] "Today's Status" card at top:
  - Large attendance status pill: "✓ Present today" (green) / "✗ Absent today" (red) / "Attendance not yet marked" (gray)
  - If absent: "If this is incorrect, contact the school" with a tap-to-message shortcut
  - This week mini-bar: 5 day slots, colored by status
- [ ] "This Term" summary section:
  - Attendance % with a circular progress ring
  - Average grade (if results released)
  - Fee balance (if `canPayFees: true` for this guardian)
- [ ] "Upcoming" section: next 2 school events (from `schoolEvents` with `visibleToParents: true`)
- [ ] "Homework" section (if homework exists): "2 assignments pending" → taps to Homework tab
- [ ] "Recent Activity" feed: last 3 notifications (SMS received, report card released, message from teacher)

---

### ISSUE-136 · Student Progress Snapshot — Weekly Cron

**Type:** Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

A weekly snapshot of each student's academic and behavioural standing, written to a dedicated table. This serves two purposes: (1) the parent portal's "Weekly Summary" digest SMS, and (2) the Sprint 07 AI at-risk engine's training data source.

#### Acceptance Criteria

**`convex/crons.ts` — add weekly job:**

```typescript
crons.weekly(
  'student-progress-snapshot',
  { dayOfWeek: 'friday', hourUTC: 14, minuteUTC: 0 }, // 16:00 CAT Friday
  internal.analytics.writeProgressSnapshots,
);
```

**Schema addition:**

```typescript
studentProgressSnapshots: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  sectionId: v.id('sections'),
  termId: v.id('terms'),
  weekNumber: v.number(), // Week 1, 2, 3... within the term
  snapshotDate: v.string(), // 'YYYY-MM-DD' (always a Friday)

  // Attendance
  attendancePercentThisWeek: v.number(),
  attendancePercentThisTerm: v.number(),
  consecutiveAbsences: v.number(), // How many in a row ending this week

  // Academic
  latestExamAverage: v.optional(v.number()),
  lastExamSessionId: v.optional(v.id('examSessions')),
  subjectsBelowPassMark: v.number(), // Count of subjects below school's pass threshold

  // Homework (LMS)
  homeworkSubmissionRate: v.number(), // % of assigned homework submitted this term
  homeworkOverdueCount: v.number(),

  // Finance
  feeBalanceZMW: v.number(),
  daysOverdue: v.number(), // Days since invoice due date, 0 if cleared

  // Boarding (Sprint 04 will populate these)
  nightPrepAttendancePercent: v.optional(v.number()),
  sickBayVisitsThisTerm: v.optional(v.number()),

  // Composite risk score (Sprint 07 writes this; Sprint 03 creates the field)
  riskScore: v.optional(v.number()), // 0–100: computed by Sprint 07 AI engine
  riskFlags: v.optional(v.array(v.string())), // ['low_attendance', 'declining_grades', 'fee_arrears']

  createdAt: v.number(),
})
  .index('by_student_term', ['studentId', 'termId'])
  .index('by_school_week', ['schoolId', 'weekNumber'])
  .index('by_section', ['sectionId']);
```

- [ ] Snapshot writes data for ALL active students in ALL active schools in one cron run
- [ ] Uses existing queries: `getAttendanceSummaryForStudent`, `termAggregates`, `getStudentLedger`
- [ ] After snapshots written: triggers `sendWeeklyDigestSMS` action (ISSUE-153) for guardians who opt in
- [ ] `getProgressSnapshots` query: returns last 12 weeks of snapshots for a student — used by parent portal trend chart and Sprint 07 at-risk engine

---

### ISSUE-137 · Weekly Progress Digest SMS

**Type:** Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

An optional weekly SMS to guardians summarising their child's week — attendance, any homework due, and fee reminders if applicable. Triggered by the Friday snapshot cron.

#### User Story

> Every Friday at 16:00, Mrs. Mutale receives: "Weekly update for Chanda Banda at KBS. Attendance this week: 5/5 days ✓. Fees: ZMW 0 (cleared). No pending homework. Have a good weekend! - Kabulonga Boys."

#### Acceptance Criteria

**`convex/guardian/weeklyDigest.ts`:**

- [ ] `sendWeeklyDigestSMS` internal action:
  - Only sends to guardians with `notifPrefs.sms: true` AND `receiveWeeklyDigest: true` (new preference)
  - Per child per guardian (one SMS per child — not combined)
  - Message template:
    ```
    Week [N] update for [StudentName] at [SchoolShortName].
    Attendance: [X]/[Y] days.
    [If absent days > 0: "Absent [N] day(s) this week."]
    [If fee balance > 0: "Fees owing: ZMW [balance]."]
    [If homework overdue > 0: "[N] homework(s) overdue."]
    - [SchoolShortName]
    ```
  - Under 160 characters for single SMS unit (validated at generation time — truncates gracefully)
  - Uses `sendSms` action (Sprint 01 ISSUE-072)
- [ ] Configurable at school level: `school.sendWeeklyDigest: v.boolean()` — some schools may not want this
- [ ] Guardian-level opt-out: `guardians.receiveWeeklyDigest: v.boolean()`

---

## Epic 3 — Attendance Visibility

---

### ISSUE-138 · Attendance Calendar View

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

The parent portal attendance view — a calendar heat map showing a child's attendance for the current term. This is the most-checked screen after the dashboard.

#### User Story

> I open my child's Attendance tab. I see the current month as a calendar. Green days = present, red days = absent, amber = late, gray = weekend or holiday. I tap a red day and see the time the register was submitted and who marked it.

#### Acceptance Criteria

**`convex/guardian/attendance.ts`:**

- [ ] `getAttendanceForGuardian` query:
  - Validates `guardianLink.canSeeAttendance === true` — throws `FORBIDDEN` if not
  - Takes `{ studentId, termId }` (defaults to active term)
  - Returns: all attendance records for the term, school calendar events (for holiday coloring), term date range
  - Respects permission: if `canSeeAttendance` is false on this guardian's link, returns `{ forbidden: true }`

**Frontend — `/(parent)/children/[studentId]/attendance/page.tsx`:**

- [ ] Term selector at top (defaults to active term)
- [ ] Monthly calendar view:
  - Each day shown as a colored square: green (present), red (absent), amber (late), blue (excused/medical), gray (weekend), light gray (holiday), white (future)
  - Public holidays labeled on hover/tap
  - Month navigation: prev/next arrows
- [ ] Tapping a day shows a bottom sheet with: status label, period (if period attendance), marked at time, marked by teacher name, any notes
- [ ] Below calendar: term summary stats
  - Total school days: X | Present: Y | Absent: Z | Late: W
  - Attendance percentage with progress bar
  - Color coding: green ≥ 90%, amber 80–89%, red < 80%
- [ ] "Attendance this week" mini row shown at top of calendar month (5 day squares — fast visual)
- [ ] If `Feature.PERIOD_ATTENDANCE` enabled and school uses period attendance: shows "View Period Detail" toggle that expands each day to show period-by-period breakdown

---

### ISSUE-139 · Absence Explanation Submission

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Guardians can submit an explanation for an absent or late record, which is reviewed by the class teacher. The teacher can then update the attendance status to "excused" from their end.

#### User Story

> Chanda was absent on Monday. The teacher marked her absent. Mrs. Banda opens the portal, taps the red Monday square, and submits: "Chanda had a doctor's appointment. Medical certificate to follow." The class teacher sees this note and changes the status to 'excused'.

#### Acceptance Criteria

**Schema addition:**

```typescript
absenceExplanations: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  guardianId: v.id('guardians'),
  date: v.string(),
  explanation: v.string(),
  supportingDocUrl: v.optional(v.string()), // Photo of sick note, doctor's letter
  status: v.union(
    v.literal('submitted'),
    v.literal('accepted'), // Teacher changed status to excused
    v.literal('rejected'), // Teacher kept as absent
    v.literal('pending'),
  ),
  reviewedBy: v.optional(v.id('staff')),
  reviewNote: v.optional(v.string()),
  submittedAt: v.number(),
  reviewedAt: v.optional(v.number()),
})
  .index('by_student_date', ['studentId', 'date'])
  .index('by_school', ['schoolId']);
```

- [ ] `submitAbsenceExplanation` mutation:
  - Can only be submitted for dates in the last 7 days
  - One explanation per date per student
  - Creates in-app notification for class teacher
- [ ] Teacher portal: `/(teacher)/register/explanations/page.tsx` — list of pending explanations
  - Accept: updates `attendance.status` to `'excused'`, sends SMS to guardian confirming
  - Reject: sends SMS to guardian with reason
- [ ] Guardian can upload a photo (doctor's letter) via Cloudinary — optional
- [ ] Explanation submitted badge shown on the attendance calendar day: blue dot on red square

---

### ISSUE-140 · Chronic Absence Alerts — Guardian View

**Type:** Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

When the chronic absenteeism detector (Sprint 01 ISSUE-070) flags a student, parents see a clear warning in their portal — not just an SMS. This makes the concern visible and actionable.

#### Acceptance Criteria

- [ ] If `studentProgressSnapshot.consecutiveAbsences >= 3` OR `attendancePercentThisTerm < 80`:
  - Persistent amber banner shown at the top of the child's Attendance tab
  - Message: "⚠️ Chanda has been absent [N] days this term ([X]% attendance). Please contact the school if assistance is needed."
  - Banner is dismissible but reappears if attendance stays below threshold
- [ ] Banner NOT shown if the absences are all marked as `'excused'` or `'medical'`
- [ ] Link at bottom of banner: "Message Class Teacher" — shortcut to open a new thread with the class teacher
- [ ] School admin can see which guardians have seen/dismissed the banner (optional analytics)

---

## Epic 4 — Academic Results & Report Cards

---

### ISSUE-141 · Results View for Guardians

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Guardians view their child's exam results and term aggregates. Results are ONLY visible after the admin explicitly releases them (Sprint 01 ISSUE-086). Before release, guardians see a "Results not yet available" message.

#### Acceptance Criteria

**`convex/guardian/results.ts`:**

- [ ] `getResultsForGuardian` query:
  - Validates `guardianLink.canSeeResults === true`
  - Takes `{ studentId, termId? }` — defaults to active term
  - If `termAggregates.isReleased === false`: returns `{ released: false }`
  - If released: returns full `termAggregates` data
  - Includes: per-subject breakdown, position in class, grade comparisons
  - Does NOT return raw mark scores — only grades and percentages (configurable: `school.showRawScoresToParents: v.boolean()`)

**Frontend — `/(parent)/children/[studentId]/results/page.tsx`:**

- [ ] "Results not available yet" state: friendly message with expected release date if known
- [ ] Term selector: dropdown of all past terms with released results
- [ ] Results table (current term):
  - Subject | Grade | % | Position in Class | Remarks
  - Color coding: green (merit/credit), amber (pass), red (fail)
  - Compulsory vs elective subject grouping
- [ ] Summary section: overall grade, class position, grade position
- [ ] GPA display for college-mode schools
- [ ] Subject trend: small sparkline next to each subject showing last 3 terms' performance
- [ ] "View Report Card" button — opens report card PDF (see ISSUE-142)
- [ ] Teacher remarks shown in a card below the table

---

### ISSUE-142 · Report Card Download and Sharing

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Guardians can view and download their child's report card PDF. The download link is time-limited for security. Sharing generates a temporary link that can be sent via WhatsApp.

#### Acceptance Criteria

**`convex/guardian/reportCards.ts`:**

- [ ] `getReportCardsForStudent` query:
  - Returns all `studentDocuments` records with `type: 'report_card'` for the student
  - Validates guardian permission
  - Returns: termId, termName, year, Cloudinary URL, generated date

- [ ] `generateReportCardShareLink` mutation:
  - Creates a signed Cloudinary URL with 7-day expiry
  - Logs the share event to `feeAuditLog`-style table (report card share audit)
  - Returns the signed URL
  - Rate limited: max 5 share links per day per guardian

**Frontend — `/(parent)/children/[studentId]/results/report-cards/page.tsx`:**

- [ ] List of available report cards: "Term 1 2025 — Generated 15 Nov 2025" → tap to view
- [ ] Inline PDF viewer (PDF rendered in browser, not forced download) using browser's native PDF viewer
- [ ] "Download PDF" button below viewer
- [ ] "Share via WhatsApp" button: opens WhatsApp with pre-filled message and the share link
  - Message: "Chanda's Term 1 2025 report card from Kabulonga Boys: [link]"
- [ ] "Print" button: browser print dialog
- [ ] Offline: if previously viewed, PDF is cached in browser storage (Workbox cache strategy: CacheFirst for report card PDFs)
- [ ] "Report card not available" placeholder for terms where card hasn't been generated yet — with "Last updated" indicator

---

### ISSUE-143 · Homework and Assignment View

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Guardians see their child's homework assignments — what's been set, what's due, and whether their child has submitted. Parents in Zambia take an active interest in homework.

#### Acceptance Criteria

**`convex/guardian/homework.ts`:**

- [ ] `getHomeworkForGuardian` query:
  - Reads from `lmsLessons` with `contentType: 'assignment'` for the student's section
  - Reads from `lmsSubmissions` to check if student has submitted
  - Returns: title, dueDate, subjectName, submittedAt (or null), score (if graded), feedback (if graded)
  - Sorted by dueDate ascending (upcoming first)
  - Filtered to current term

**Frontend — `/(parent)/children/[studentId]/homework/page.tsx`:**

- [ ] Homework list with status pills: "Submitted ✓", "Pending (due Fri)", "Overdue ✗"
- [ ] Subject filter chips at top
- [ ] Tapping a homework item shows: full description, due date, submission status, score and feedback if graded
- [ ] "Overdue" count shown as a badge on the Homework tab
- [ ] No submission capabilities from parent portal — students submit via student portal. Parent is read-only.
- [ ] "How to help" tip shown for overdue items: "Ask [Student] to log in at [school-url]/student to submit their work."

---

### ISSUE-144 · Academic Progress Chart

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

A visual trend chart showing the student's academic performance over time — across multiple terms. Helps parents see whether their child is improving or declining.

#### Acceptance Criteria

**`convex/guardian/progress.ts`:**

- [ ] `getStudentProgressTrend` query:
  - Returns `studentProgressSnapshots` for the last 12 weeks (current term)
  - Returns `termAggregates` for all released past terms
  - Returns attendance trend (weekly % for the last 12 weeks from snapshots)

**Frontend — `/(parent)/children/[studentId]/results/page.tsx` (additions):**

- [ ] "Progress over time" section at bottom of results page
- [ ] Line chart (recharts `LineChart`): x-axis = terms/weeks, y-axis = average score %
- [ ] Overlay: attendance % trend in a secondary line (lighter color)
- [ ] If only one term of data: show text instead of chart ("More terms needed for trend chart")
- [ ] Mobile: chart horizontal scroll if many data points — not zoomed-out unreadable

---

## Epic 5 — Fee Payment from Portal

---

### ISSUE-145 · Fee Overview and Invoice List

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

The fees section of the parent portal. Guardians see their full financial picture — all invoices, all payments, current balance — before deciding to pay.

#### Acceptance Criteria

**`convex/guardian/fees.ts`:**

- [ ] `getGuardianFeesOverview` query:
  - Validates `guardianLink.canPayFees === true` (at least one child's link)
  - Returns:
    ```typescript
    {
      children: Array<{
        student: { name, grade, photo },
        currentInvoice: Invoice | null,
        balanceZMW: number,
        dueDate: string | null,
        isOverdue: boolean,
      }>,
      totalOutstandingZMW: number,
      creditBalanceZMW: number,            // From Sprint 02 overpayments
      recentPayments: Payment[],           // Last 5 across all children
      consolidatedInvoiceAvailable: boolean, // True if 2+ children with balances
    }
    ```

**Frontend — `/(parent)/fees/page.tsx`:**

- [ ] Per-child balance cards — same style as dashboard but with more detail
- [ ] "Pay for [Child Name]" button per card
- [ ] "Pay All Children (ZMW [total])" button — shown if `consolidatedInvoiceAvailable: true`
- [ ] Outstanding balance chip: red if overdue, amber if due within 7 days, green if cleared
- [ ] Credit balance notice: "You have ZMW 150 credit on account. This will be applied to your next invoice automatically."
- [ ] Recent payment history: last 5 payments across all children (date, amount, method, receipt download)
- [ ] Fee statements: "Download full statement" → calls `generateStudentFeesStatement` (Sprint 02 ISSUE-127)

---

### ISSUE-146 · Airtel Money Pay-Now from Portal

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 1.5 days

#### Description

The "Pay Now" button triggers a mobile money payment request directly from the portal. For Airtel users, a USSD push is sent to their phone asking them to confirm the payment. This is a push collection — the guardian doesn't need to open a separate app.

#### User Story

> Mrs. Banda taps "Pay ZMW 2,500 via Airtel Money." She immediately gets a USSD prompt on her phone: "Kabulonga Boys School is requesting ZMW 2,500. Enter your Airtel Money PIN to confirm." She enters her PIN. The portal updates in real-time: "Payment successful!"

#### Acceptance Criteria

**`convex/fees/mobileMoneyPayment.ts`:**

- [ ] `initiateAirtelMoneyPayment` action:
  - Args: `{ invoiceId, amountZMW, guardianPhoneNumber, paymentContext: 'invoice' | 'consolidated' | 'pocket_money' | 'transport' }`
  - Validates `amountZMW > 0` and `amountZMW <= invoice.balanceZMW`
  - Creates a `pendingPayments` record (schema below) with `status: 'awaiting_confirmation'`
  - Calls Airtel Money Collections API: `POST /merchant/v1/payments/request`
  - Sets `externalReference: invoiceNumber` so the webhook can match back
  - Returns `{ pendingPaymentId }` — client polls status

- [ ] `getPendingPaymentStatus` query (real-time): returns `pendingPayments.status`
  - Client uses `useQuery` on this — Convex subscription auto-updates when webhook fires

- [ ] When webhook arrives (ISSUE-107): updates `pendingPayments.status` to `'completed'` or `'failed'`

**Schema addition:**

```typescript
pendingPayments: defineTable({
  schoolId: v.id('schools'),
  invoiceId: v.id('invoices'),
  guardianId: v.id('guardians'),
  amountZMW: v.number(),
  method: v.union(v.literal('airtel_money'), v.literal('mtn_momo')),
  externalReference: v.string(), // Invoice number sent as reference
  status: v.union(
    v.literal('awaiting_confirmation'), // Waiting for guardian to approve USSD
    v.literal('processing'), // Approved, waiting for settlement
    v.literal('completed'), // Webhook confirmed success
    v.literal('failed'), // Guardian declined or timeout
    v.literal('expired'), // No response in 5 minutes
  ),
  initiatedAt: v.number(),
  completedAt: v.optional(v.number()),
  failureReason: v.optional(v.string()),
  paymentContext: v.string(), // 'invoice', 'pocket_money', 'transport'
  createdAt: v.number(),
})
  .index('by_invoice', ['invoiceId'])
  .index('by_guardian', ['guardianId'])
  .index('by_school', ['schoolId']);
```

**Frontend — Pay Now flow:**

- [ ] "Pay ZMW [amount] via Airtel Money" button on invoice detail and fees overview
- [ ] Pre-payment confirmation modal:
  - "Payment of ZMW [amount] will be requested from [guardianPhone]"
  - USSD/PIN instruction note: "You will receive a USSD prompt. Enter your Airtel Money PIN to confirm."
  - "Confirm & Send Request" button
- [ ] Waiting screen (after initiating):
  - Spinner with "Waiting for your confirmation on [phone]..."
  - Real-time status via `useQuery(getPendingPaymentStatus)`
  - Auto-updates when payment completes — no page refresh needed
  - "Cancel" button: cancels the pending request (if Airtel allows cancellation)
  - Timeout: if no response in 5 minutes, shows "Request expired. Please try again."
- [ ] Success state: "✓ Payment Successful! ZMW [amount] received." with receipt download button
- [ ] Failure state: "Payment was declined or cancelled. Try again." with retry button

---

### ISSUE-147 · MTN MoMo Pay-Now from Portal

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Same "Pay Now" experience for MTN MoMo subscribers. MTN's API has a different flow — uses the Collections API to request payment from the subscriber.

#### Acceptance Criteria

- [ ] `initiateMtnMomoPayment` action (completing the stub from Sprint 02 ISSUE-108):
  - Creates a request to pay via MTN MoMo Collections API
  - Sets external ID to invoice number for webhook matching
  - Creates `pendingPayments` record with `method: 'mtn_momo'`
- [ ] Frontend: same UX as Airtel (ISSUE-146), phone detection determines which button to show:
  - 097x/096x phone → "Pay via Airtel Money" button
  - 076x phone → "Pay via MTN MoMo" button
  - Unknown prefix → both buttons shown
- [ ] Both buttons shown side-by-side if guardian's `altPhone` is a different network: "Pay from Airtel ([last4]) / Pay from MTN ([last4])"
- [ ] MTN MoMo confirmation message is slightly different: "An approval request has been sent to your MTN MoMo app. Open the MTN MoMo app and approve."

---

### ISSUE-148 · Consolidated "Pay All Children" Flow

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

A guardian with 2+ children can pay all outstanding balances in a single mobile money transaction. This is one of Acadowl's headline features for parents.

#### Acceptance Criteria

- [ ] `initiateConsolidatedPayment` action:
  - Calls `generateConsolidatedInvoice` (Sprint 02 ISSUE-106) if one doesn't exist for this term
  - Then calls `initiateAirtelMoneyPayment` or `initiateMtnMomoPayment` with the consolidated invoice
  - The mobile money reference shows the consolidated invoice number
- [ ] Frontend: "Pay All — ZMW [total]" button on `/fees` overview page
  - Before payment: shows breakdown — "Chanda: ZMW 1,500 | Mutale: ZMW 2,000 | Luyando: ZMW 1,800 = Total: ZMW 5,300"
  - Sibling discounts already applied (shown in breakdown)
  - Same waiting/success/failure flow as single payment
- [ ] Payment distributed automatically to each child's invoice (Sprint 02 logic)

---

### ISSUE-149 · Payment History and Receipt Access

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Guardians need to see every payment they've made — for their own records and for disputes. Every receipt must be downloadable.

#### Acceptance Criteria

- [ ] `/(parent)/fees/history/page.tsx`:
  - All payments across all children, all terms — newest first
  - Columns: Date, Child, Invoice Number, Amount, Method, Reference, Receipt
  - Filter by: child, term, method
  - Search: by reference number
- [ ] Each payment row has a "Download Receipt" button:
  - Calls `generateSignedReceiptUrl(paymentId)` — returns time-limited Cloudinary URL
  - Opens PDF in new tab
- [ ] "Payment dispute" button on each payment:
  - Opens a bottom sheet: "There is a problem with this payment?"
  - Options: "Amount is wrong" / "This payment isn't mine" / "I didn't receive confirmation"
  - Creates a `paymentDispute` record — admin sees in `/(admin)/fees/disputes`
- [ ] Ledger view toggle: switch between "Payments only" and "Full ledger" (shows charges and payments together)

---

## Epic 6 — Teacher–Parent Messaging

> **Goal:** A direct, professional messaging channel between parents and teachers. Not a chat app — a structured, trackable communication tool that keeps school communication in the system rather than on WhatsApp.

---

### ISSUE-150 · Messaging System Architecture and Schema

**Type:** Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Design and implement the messaging data model. This must support one-to-one (parent↔teacher) and one-to-many (school→parents) threads, with the context field making it extensible to boarding and LMS messages.

#### Acceptance Criteria

**Schema additions:**

```typescript
messageThreads: defineTable({
  schoolId: v.id('schools'),
  context: v.union(
    v.literal('general'), // Standard parent-teacher communication
    v.literal('boarding'), // Sprint 04: matron↔parent hostel matters
    v.literal('transport'), // Sprint 06: route or pickup issues
    v.literal('lms'), // Sprint 05: course-specific teacher↔student
    v.literal('admin'), // School admin broadcast threads
  ),
  studentId: v.optional(v.id('students')), // Thread about a specific student
  participantIds: v.array(v.id('users')), // All participants (2 for 1:1, N for group)
  subject: v.string(),
  lastMessageAt: v.number(),
  lastMessagePreview: v.string(), // First 80 chars of last message
  isArchived: v.boolean(),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_participant', ['participantIds']) // Note: array index — Convex supports this
  .index('by_school_context', ['schoolId', 'context'])
  .index('by_student', ['studentId']);

messages: defineTable({
  schoolId: v.id('schools'),
  threadId: v.id('messageThreads'),
  senderId: v.id('users'),
  body: v.string(), // Plain text — no HTML/markdown in v1
  attachmentUrl: v.optional(v.string()), // Cloudinary URL for one attachment
  attachmentType: v.optional(v.union(v.literal('image'), v.literal('pdf'), v.literal('document'))),
  readBy: v.array(
    v.object({
      // Array of who read this message and when
      userId: v.id('users'),
      readAt: v.number(),
    }),
  ),
  isSystemMessage: v.boolean(), // True for automated messages (e.g., "Report card released")
  createdAt: v.number(),
})
  .index('by_thread', ['threadId'])
  .index('by_school', ['schoolId'])
  .index('by_sender', ['senderId']);

messageNotifications: defineTable({
  schoolId: v.id('schools'),
  userId: v.id('users'),
  threadId: v.id('messageThreads'),
  messageId: v.id('messages'),
  isRead: v.boolean(),
  createdAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_user_unread', ['userId', 'isRead']);
```

---

### ISSUE-151 · Guardian Initiates Message to Teacher

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

A guardian can start a conversation with their child's class teacher or subject teacher. Teachers receive an in-app notification and SMS alert for new messages.

#### User Story

> Mrs. Banda is worried Chanda is struggling in Mathematics. She taps "Message Mathematics Teacher" on the Results tab. A new thread opens. She types her concern. Mr. Phiri receives a notification and responds that afternoon.

#### Acceptance Criteria

**`convex/messaging/threads.ts`:**

- [ ] `startThreadWithTeacher` mutation:
  - Args: `{ studentId, staffId, subject, initialMessage, context: 'general' }`
  - Checks if a thread already exists between this guardian and teacher for this student (doesn't create duplicates)
  - If existing: adds message to existing thread and returns it
  - If new: creates `messageThreads` record, creates first `messages` record
  - Sends SMS to teacher: "New message from [GuardianName] about [StudentName]: '[first 60 chars]...' Reply at [teacher-portal-url]"
  - Creates `messageNotifications` for teacher
  - Requires `guardianLink.isPrimary === true` OR explicit `canSendMessages` permission (use `guardianLink.canSendMessages` — schema addition)

- [ ] `getTeachersForStudent` query: returns class teacher + all subject teachers for the student's section
  - Returns each teacher with: name, photo, subjects taught (if subject teacher), role label

**Frontend — "New Message" flow:**

- [ ] "Message Teachers" button on child overview and results pages
- [ ] Teacher picker: list of the child's teachers with photos
  - Class teacher shown first with "(Class Teacher)" label
  - Subject teachers listed by subject
- [ ] Subject pre-populated: "Re: [subject name]" if triggered from results tab
- [ ] Message compose: text area (max 500 chars), optional attachment (photo or PDF)
- [ ] Send button: submits via `startThreadWithTeacher`

---

### ISSUE-152 · Message Thread Inbox — Guardian Side

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

The guardian's message inbox — all their conversation threads. Sorted by most recent, with unread count badges.

#### Acceptance Criteria

**`convex/messaging/queries.ts`:**

- [ ] `getThreadsForUser` query:
  - Returns all threads the current user participates in, sorted by `lastMessageAt`
  - Includes `unreadCount` (count of `messageNotifications` where `isRead: false`)
  - Filtered by `schoolId` (cross-school guardians see separate inboxes)
  - Includes participant info (other party's name + photo)

- [ ] `getMessagesForThread` query:
  - Returns all messages in a thread, oldest first (chronological chat order)
  - Includes sender info (name, photo, role)
  - Marks `messageNotifications.isRead = true` as a side effect of loading

**Frontend — `/(parent)/messages/page.tsx`:**

- [ ] Thread list:
  - Each row: teacher photo + name, subject line, last message preview, timestamp, unread badge
  - Unread threads: bold font, blue left border
  - Tap: navigates to thread detail
- [ ] Unread count shown in bottom tab bar badge

**Frontend — `/(parent)/messages/[threadId]/page.tsx`:**

- [ ] Chat-style layout: my messages right-aligned (blue), teacher's messages left-aligned (gray)
- [ ] Message timestamps shown between message groups
- [ ] Read receipts: "Seen" shown under sent messages when teacher has read
- [ ] "Type a message..." input at bottom with send button
- [ ] Attachment picker: camera photo or file upload (PDF only — no videos to keep bandwidth low)
- [ ] Teacher name and subject shown in header
- [ ] "About this conversation" tap: shows the student this thread relates to

---

### ISSUE-153 · Teacher Inbox and Message Management

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

The teacher's message interface. Teachers must be able to manage high message volumes efficiently — they may have 35+ parents messaging them.

#### Acceptance Criteria

**Frontend — `/(teacher)/messages/page.tsx`:**

- [ ] Thread list: same structure as guardian inbox but with guardian names
- [ ] Filter tabs: All | Unread | About [Section name] | Archived
- [ ] Search: by guardian name or student name
- [ ] Bulk actions: Mark all as read, Archive selected

**Frontend — `/(teacher)/messages/[threadId]/page.tsx`:**

- [ ] Student context banner at top: student photo, name, grade — quick link to student profile
- [ ] Same chat layout as guardian side
- [ ] "Archive" button: moves thread to archive (not deleted — admin can see all)
- [ ] Quick reply templates: teacher can set 5 saved replies (e.g., "Thank you for reaching out. I will follow up with [student] this week.")
  - `teacherQuickReplies` stored as `staff.quickReplies: v.array(v.string())` (schema addition)
- [ ] SMS notification to guardian when teacher replies: "Reply from [TeacherName] about [StudentName] on Acadowl. View: [link]"
- [ ] Admin view: `/(admin)/messages/page.tsx` — all threads across the school, can see any thread (for safeguarding oversight)

---

### ISSUE-154 · Admin Broadcast Message to All Parents

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Admin can send a message to all parents (or a subset) that appears as a thread in every parent's inbox AND as an SMS. Different from the SMS broadcast (Sprint 01 ISSUE-074) — this one creates an in-app thread they can read later.

#### Acceptance Criteria

- [ ] `sendBroadcastMessage` mutation:
  - Creates one `messageThreads` record of `context: 'admin'` per recipient
  - `participantIds: [adminUserId, guardianUserId]`
  - Creates `messages` record in each thread
  - Batches SMS sending (uses Sprint 01 `sendBroadcastSMS` for the SMS part)
  - Recipient targeting: All Parents | Grade | Section | Custom list
- [ ] Frontend: compose UI at `/(admin)/messages/broadcast/page.tsx`
  - Subject, body, recipient selector, preview count
  - "Send as SMS only" toggle (skips thread creation, cheaper)
  - "Send as In-App + SMS" default
- [ ] Recipients see the broadcast in their inbox with the school's logo as sender avatar (not a specific teacher)
- [ ] Guardians CAN reply to broadcast threads — reply goes only to the admin who sent it

---

### ISSUE-155 · Message Notifications and SMS Alerts

**Type:** Backend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Ensure every new message triggers the correct notification channel (in-app + SMS) within 60 seconds. Manages notification frequency so high-volume threads don't spam guardians.

#### Acceptance Criteria

- [ ] On new message in a thread: create `messageNotifications` record for all recipients
- [ ] SMS alert policy (configurable):
  - For guardian: SMS on first unread message in a thread per day (not every reply)
  - If guardian has `notifPrefs.sms: false`: no SMS, in-app only
- [ ] SMS content: "[TeacherName] sent you a message about [StudentName] on Acadowl. View: [link]"
- [ ] Notification badge: unread message count shown in parent portal bottom nav (real-time Convex)
- [ ] Admin sees all unread message counts across the school in `/(admin)/messages`
- [ ] "Do not disturb" hours: no SMS between 21:00 and 07:00 CAT (configurable per school)

---

## Epic 7 — School Announcements & Noticeboard

---

### ISSUE-156 · Announcement Creation and Publishing

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 1 day

#### Description

School admin and teachers can publish announcements to the school community — events, notices, result releases, etc. Announcements appear in the parent portal noticeboard and optionally trigger SMS.

#### Acceptance Criteria

**Schema addition:**

```typescript
announcements: defineTable({
  schoolId: v.id('schools'),
  title: v.string(),
  body: v.string(), // Rich text — store as plain text, render with \n→<br>
  category: v.union(
    v.literal('general'),
    v.literal('academic'), // Results, exams, curriculum
    v.literal('events'), // Sports day, concerts, open day
    v.literal('fees'), // Fee deadlines, new structure
    v.literal('holidays'), // School closure, term dates
    v.literal('hostel'), // Sprint 04: boarding-specific
    v.literal('transport'), // Sprint 06: route changes
    v.literal('emergency'), // Urgent — always shown at top, always SMS
  ),
  targetAudience: v.union(
    v.literal('all'),
    v.literal('parents_only'),
    v.literal('students_only'),
    v.literal('staff_only'),
    v.literal('boarding_parents'), // Sprint 04: only parents of boarding students
  ),
  targetGradeIds: v.optional(v.array(v.id('grades'))), // null = all grades
  attachmentUrl: v.optional(v.string()),
  attachmentName: v.optional(v.string()),
  sendSMS: v.boolean(), // Admin choice: also send as SMS
  sendWhatsApp: v.boolean(), // Admin choice: also send via WhatsApp
  isPublished: v.boolean(),
  publishedAt: v.optional(v.number()),
  expiresAt: v.optional(v.number()), // Auto-hide after this date
  isPinned: v.boolean(), // Pinned announcements shown at top
  createdBy: v.id('users'),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_school_published', ['schoolId', 'isPublished'])
  .index('by_school_category', ['schoolId', 'category']);
```

**Backend — `convex/announcements/mutations.ts`:**

- [ ] `createAnnouncement` mutation: create in draft state
- [ ] `publishAnnouncement` mutation:
  - Sets `isPublished: true`, `publishedAt: now()`
  - If `sendSMS: true`: calls `sendBroadcastSMS` (Sprint 01 ISSUE-074) to matching audience
  - If `sendWhatsApp: true`: queues WhatsApp broadcast (ISSUE-159)
  - If `category: 'emergency'`: sends SMS regardless of `sendSMS` flag
  - Creates `notifications` records for all in-app targets
- [ ] `unpublishAnnouncement` mutation: hides without deleting

**Frontend — `/(admin)/announcements/page.tsx`:**

- [ ] Announcement list: draft vs published tabs
- [ ] Create/Edit form: title, body (textarea), category, audience, grade filter, send SMS toggle, attach file
- [ ] "Preview" button: shows how it will appear in parent portal
- [ ] Publish button with recipient count estimate: "Will notify ~347 parents via SMS"
- [ ] Pinned announcements management

---

### ISSUE-157 · Parent Portal Noticeboard

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

The announcement feed in the parent portal. Parents see all relevant school news in one place.

#### Acceptance Criteria

**`convex/guardian/announcements.ts`:**

- [ ] `getAnnouncementsForGuardian` query:
  - Filters by: school, `isPublished: true`, `expiresAt > now()` or null, audience matches guardian's profile
  - For `targetGradeIds`: only shows if guardian has a child in those grades
  - Sorted: pinned first, then by `publishedAt` descending
  - Pagination: 20 per page

**Frontend — `/(parent)/announcements/page.tsx`:**

- [ ] Feed of announcement cards:
  - Category badge (color-coded)
  - Title, first 150 chars of body, "Read more" expand
  - Attachment download if present
  - Published date
  - Pinned announcements at top with pin icon
- [ ] "Emergency" category announcements: full red banner, shown on dashboard too
- [ ] Unread count badge: announcements published since last visit

**Dashboard integration (ISSUE-135):**

- [ ] Latest 2 announcements shown as a "Noticeboard" section on `/(parent)/children/[id]/page.tsx`
- [ ] Emergency announcements override and show as a full-width alert at top of dashboard

---

### ISSUE-158 · School Calendar in Parent Portal

**Type:** Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

A calendar view of upcoming school events, term dates, exam periods, and closures. Surfaced from `schoolEvents` (Sprint 01 ISSUE-043).

#### Acceptance Criteria

- [ ] `/(parent)/calendar/page.tsx`:
  - Monthly calendar grid
  - School events overlaid: holidays (red), exams (amber), sports days (blue), term start/end (green)
  - Tap event: bottom sheet with full event details
  - Upcoming events section: list of next 5 events with countdown ("In 3 days")
- [ ] `getPublicCalendarForGuardian` query:
  - Returns `schoolEvents` where `visibleToParents: true`
  - Returns term start/end dates from `terms` table
- [ ] "Add to phone calendar" button: generates `.ics` file for each event (iCal format — works with all mobile calendar apps)
- [ ] Tab shown in parent portal bottom nav "More" drawer

---

### ISSUE-159 · Push Notifications for Parent Portal (PWA)

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 1 day

#### Description

Web push notifications for the parent portal PWA. When a guardian adds the portal to their home screen, they can opt in to browser push notifications — receiving real-time alerts even when the app is closed.

#### Acceptance Criteria

- [ ] Service worker updated to support push notifications (Web Push API / VAPID keys)
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` environment variable added
- [ ] `/(parent)/profile/notifications/page.tsx`:
  - "Enable Push Notifications" button: triggers browser permission request
  - Shows permission status: Allowed / Denied / Not requested
  - Graceful degradation: if denied, explains how to enable in browser settings
- [ ] `pushSubscriptions` table:
  ```typescript
  pushSubscriptions: defineTable({
    schoolId: v.id('schools'),
    userId: v.id('users'),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index('by_user', ['userId']);
  ```
- [ ] `sendPushNotification` internal action: called alongside SMS for high-priority events (absence alerts, new messages, result releases)
- [ ] Push payload: `{ title, body, icon, badge, data: { url } }` — tapping notification opens the relevant portal page
- [ ] Push notifications fire for: new message, absence alert, report card released, emergency announcement
- [ ] SMS remains the primary channel — push is an enhancement, never a replacement

---

## Epic 8 — WhatsApp Integration

> **Feature Gate:** `Feature.WHATSAPP_NOTIFICATIONS`
> **Goal:** Many Zambian families are more responsive to WhatsApp than SMS. Where this feature is enabled, critical communications are delivered over WhatsApp in addition to or instead of plain SMS.

---

### ISSUE-160 · WhatsApp Business API Integration

**Type:** Backend | **Priority:** P1 | **Estimate:** 1.5 days | **Feature Gate:** `Feature.WHATSAPP_NOTIFICATIONS`

#### Description

Integrate with WhatsApp Business API (Meta Cloud API) to send structured WhatsApp messages. WhatsApp messages can include formatted text, PDF attachments, and interactive buttons — significantly richer than SMS.

#### User Story

> Mrs. Banda has WhatsApp enabled. When Chanda's report card is released, she receives a WhatsApp message: "[School Logo] Kabulonga Boys School. Chanda's Term 1 2025 report card is ready. [📄 Download PDF button]." She taps the button and views the PDF directly in WhatsApp.

#### Acceptance Criteria

**Schema addition to `schools`:**

```typescript
whatsappConfig: v.optional(
  v.object({
    accessToken: v.string(), // Meta WhatsApp Business API token
    phoneNumberId: v.string(), // WhatsApp Business phone number ID
    businessAccountId: v.string(),
    verifyToken: v.string(), // For webhook verification
    isActive: v.boolean(),
    defaultTemplates: v.object({
      absenceAlert: v.string(), // WhatsApp template name (must be pre-approved by Meta)
      feeReminder: v.string(),
      reportCardReady: v.string(),
      generalAnnouncement: v.string(),
    }),
  }),
);
```

**`convex/notifications/whatsapp.ts`:**

- [ ] `sendWhatsAppMessage` internal action:
  - Args: `{ to: string, templateName: string, components: object[], mediaUrl?: string }`
  - Calls Meta Cloud API: `POST /{phoneNumberId}/messages`
  - Uses pre-approved message templates (required by WhatsApp for business messaging)
  - Updates `notifications` record status on callback
  - Falls back to SMS if WhatsApp fails (guardian's primary phone used)

- [ ] Template types implemented:
  - `absence_alert`: "{{school_name}} — {{student_name}} was absent today, {{date}}. Contact: {{phone}}"
  - `fee_reminder`: "{{school_name}} — Invoice {{invoice_number}} for {{student_name}} is {{days}} days overdue. Balance: ZMW {{amount}}."
  - `report_card_ready`: Message + PDF button linking to signed Cloudinary URL
  - `new_message`: "{{teacher_name}} sent you a message about {{student_name}}. View: {{url}}"

- [ ] `processWhatsAppWebhook` action:
  - Handles WhatsApp delivery status callbacks
  - Updates `notifications.status`: sent → delivered → read
  - Handles "read" receipts — updates message receipts in messaging system (ISSUE-150)

**`src/app/api/webhooks/whatsapp/route.ts`:**

- [ ] Webhook verification: GET handler for `hub.verify_token` challenge
- [ ] Message delivery status: POST handler → calls `processWhatsAppWebhook`

**Settings page `/(admin)/settings/whatsapp/page.tsx`:**

- [ ] API credentials form
- [ ] Template verification status (shows which templates are approved by Meta)
- [ ] "Send Test Message" button: sends a test to admin's own WhatsApp

---

## Epic 9 — Notification Preferences & History

---

### ISSUE-161 · Notification Preference Centre

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

A complete notification preference centre for guardians. Every notification type the system sends must have a corresponding opt-in/opt-out toggle.

#### Acceptance Criteria

**Schema addition to `guardians`:**

```typescript
notificationPreferences: v.object({
  // Channels
  smsEnabled: v.boolean(),
  whatsappEnabled: v.boolean(),
  pushEnabled: v.boolean(),
  emailEnabled: v.boolean(),

  // Event types
  attendanceAbsent: v.boolean(), // SMS when child absent
  attendanceLate: v.boolean(), // SMS when child late
  resultsReleased: v.boolean(), // SMS when report card released
  feeInvoiceGenerated: v.boolean(), // SMS when new invoice created
  feeReminder: v.boolean(), // SMS fee reminders
  feePaymentConfirmed: v.boolean(), // SMS receipt after payment
  homeworkAssigned: v.boolean(), // SMS when homework set
  newMessage: v.boolean(), // SMS when teacher sends message
  schoolAnnouncement: v.boolean(), // SMS for general announcements
  weeklyDigest: v.boolean(), // Friday weekly summary
  // Sprint 04 additions (fields defined now):
  sickBayAdmission: v.boolean(),
  visitorArrival: v.boolean(),
  pocketMoneyWithdrawal: v.boolean(),
  nightPrepAbsent: v.boolean(),
  // Sprint 06 additions (fields defined now):
  busArriving: v.boolean(),
  studentNotBoarded: v.boolean(),
  routeDelay: v.boolean(),
});
```

**Frontend — `/(parent)/profile/notifications/page.tsx`:**

- [ ] Grouped preference toggles:
  - **Attendance**: Absent alerts, Late alerts
  - **Academic**: Results released, Homework assigned
  - **Finance**: Invoice generated, Fee reminders, Payment confirmed
  - **Communication**: New messages, School announcements, Weekly digest
  - **Boarding** (shown only if child is boarder): Sick bay, Visitors, Pocket money, Night prep
  - **Transport** (shown only if child has route): Bus arriving, Student not boarded, Delays
- [ ] Channel selector per group: SMS | WhatsApp | Push (shown only for available channels)
- [ ] "Pause all notifications" master toggle (with "Resume on [date]" option)
- [ ] Emergency announcements are always sent — cannot be disabled (explained to user)
- [ ] Saved immediately on toggle (no save button — optimistic update via Convex)

---

### ISSUE-162 · Full Notification History in Parent Portal

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Guardians can see every notification ever sent to them — a complete history. This is important because SMS may not be stored on the phone, and parents need to look back.

#### Acceptance Criteria

**`convex/guardian/notifications.ts`:**

- [ ] `getNotificationsForGuardian` query:
  - Returns all `notifications` records for this guardian's `userId`
  - Filters: by type, by child, by date range
  - Pagination: 30 per page with cursor

**Frontend — `/(parent)/notifications/page.tsx`:**

- [ ] Notification list:
  - Icon per category (bell, calendar, money, grade, message)
  - Title, body preview, timestamp, channel badge (SMS/WhatsApp/Push)
  - Tap to expand full body
  - Unread = blue tint; read = white
- [ ] Filter chips at top: All | Attendance | Fees | Results | Messages | Announcements
- [ ] "Mark all as read" button
- [ ] SMS delivery status shown: Sent / Delivered / Failed (from `notifications.status`)

---

### ISSUE-163 · Admin Notification Audit

**Type:** Frontend + Backend | **Priority:** P2 | **Estimate:** 0.5 days

#### Description

Admin view of all outgoing communications from the school — for accountability, debugging, and understanding engagement.

#### Acceptance Criteria

**`convex/admin/notificationAudit.ts`:**

- [ ] `getSchoolNotificationStats` query:
  - SMS sent today / this week / this month
  - Delivery rate (delivered / sent × 100)
  - Failed notifications list with error reasons
  - SMS balance remaining (from `school.smsBalance`)
  - Top notification types by volume

**Frontend — `/(admin)/notifications/audit/page.tsx`:**

- [ ] Stats cards with SMS usage
- [ ] Failed notifications table with "Retry" button per row
- [ ] "Re-send All Failed" bulk action (for when an SMS provider was down)
- [ ] Monthly SMS usage chart (recharts BarChart — SMS sent per day)
- [ ] WhatsApp delivery statistics (if Feature enabled)

---

## Epic 10 — Guardian Profile & Child Management

---

### ISSUE-164 · Guardian Profile Management

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Guardians can update their own profile — contact details, occupation, address. They cannot change their linked phone number (that requires admin verification to prevent account takeover).

#### Acceptance Criteria

- [ ] `/(parent)/profile/page.tsx`:
  - Editable fields: First name, Last name, Email, WhatsApp number, Occupation, Employer, Address
  - Read-only with lock icon: Primary phone number (change requires contacting school)
  - Profile photo upload (Cloudinary)
  - "Request phone number change" → creates a support request ticket visible to admin

- [ ] `updateGuardianProfile` mutation:
  - Updates: name, email, whatsappPhone, occupation, employer, address, photoUrl
  - Cannot update: phone (primary login identifier — requires admin)
  - Logs change to notification audit

- [ ] Phone change request schema:
  ```typescript
  profileChangeRequests: defineTable({
    schoolId: v.id('schools'),
    guardianId: v.id('guardians'),
    changeType: v.literal('phone_number'),
    currentValue: v.string(),
    requestedValue: v.string(),
    reason: v.string(),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
    processedBy: v.optional(v.id('users')),
    processedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_school', ['schoolId']);
  ```

---

### ISSUE-165 · Adding Additional Guardians from Portal

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

A guardian can request that another guardian (e.g., the other parent) is also linked to their child. The school admin approves the request to prevent unauthorised additions.

#### Acceptance Criteria

- [ ] `/(parent)/children/[studentId]/guardians/page.tsx`:
  - List of guardians linked to this student (with their relation and permissions)
  - "Request to add another guardian" button → form: name, phone, relation
  - Creates a `guardianAdditionRequests` record → admin approves → `addGuardianToStudent` mutation runs
- [ ] Admin sees pending requests in `/(admin)/students/guardian-requests/page.tsx`
- [ ] On approval: sends invitation SMS to the new guardian (ISSUE-130)
- [ ] On rejection: notifies requesting guardian with reason

---

### ISSUE-166 · Guardian Communication Preferences per Child

**Type:** Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

A guardian with multiple children may want different notification settings per child — e.g., more granular alerts for the younger child, summary-only for the older one.

#### Acceptance Criteria

- [ ] `/(parent)/children/[studentId]/settings/page.tsx` — per-child notification overrides:
  - "Use my default notification preferences" toggle (on by default)
  - If toggled off: shows child-specific toggles (same as global prefs in ISSUE-161)
- [ ] Per-child preferences stored in `guardianLinks` array:
  ```typescript
  // Addition to guardianLinks object in students table:
  notificationOverrides: v.optional(
    v.object({
      useGlobalPrefs: v.boolean(),
      // If useGlobalPrefs false, same keys as guardians.notificationPreferences
      smsEnabled: v.optional(v.boolean()),
      attendanceAbsent: v.optional(v.boolean()),
      // ... etc
    }),
  );
  ```
- [ ] Notification system checks per-child overrides before global preferences

---

### ISSUE-167 · Student Self-Portal Improvements

**Type:** Frontend | **Priority:** P2 | **Estimate:** 0.5 days

#### Description

Minor improvements to the student self-portal (started in Sprint 00) — now that attendance, results, and homework data exist, the student portal becomes genuinely useful.

#### Acceptance Criteria

- [ ] `/(student)/dashboard/page.tsx` updated with real data:
  - Today's timetable (from `getTimetableForSection`)
  - This week's attendance (same component as parent portal — reused)
  - Latest results from `termAggregates` (if released)
  - Pending homework count
- [ ] `/(student)/results/page.tsx`: same as guardian results view but without permission checks
- [ ] `/(student)/homework/page.tsx`: homework list + ability to submit (text response or file upload)
  - Uses `submitHomework` mutation (Sprint 01 ISSUE-047)
- [ ] `/(student)/timetable/page.tsx`: timetable view (Sprint 01 already built — verify data loads)
- [ ] Student cannot see fee information — `canPayFees` gate on any fee component
- [ ] Student portal restricted to schools where `school.allowStudentPortal: v.boolean()` is enabled (schema addition)

---

## Schema Additions in This Sprint

| New Table                  | Defined In |
| -------------------------- | ---------- |
| `guardianInvitations`      | ISSUE-130  |
| `guardianLinkDisputes`     | ISSUE-132  |
| `studentProgressSnapshots` | ISSUE-136  |
| `absenceExplanations`      | ISSUE-139  |
| `messageThreads`           | ISSUE-150  |
| `messages`                 | ISSUE-150  |
| `messageNotifications`     | ISSUE-150  |
| `announcements`            | ISSUE-156  |
| `pushSubscriptions`        | ISSUE-159  |
| `guardianLinkDisputes`     | ISSUE-132  |
| `pendingPayments`          | ISSUE-146  |
| `profileChangeRequests`    | ISSUE-164  |
| `guardianAdditionRequests` | ISSUE-165  |

**Fields added to existing tables:**

| Table                           | New Fields                                                        | Added In            |
| ------------------------------- | ----------------------------------------------------------------- | ------------------- |
| `guardians`                     | `notificationPreferences`, `whatsappPhone`, `receiveWeeklyDigest` | ISSUE-131, 137, 161 |
| `schools`                       | `whatsappConfig`, `sendWeeklyDigest`, `allowStudentPortal`        | ISSUE-160, 137, 167 |
| `guardianLinks` (in `students`) | `canSendMessages`, `notificationOverrides`                        | ISSUE-151, 166      |
| `staff`                         | `quickReplies`                                                    | ISSUE-153           |
| `studentProgressSnapshots`      | `riskScore`, `riskFlags` (null until Sprint 07)                   | ISSUE-136           |

---

## Dependency Graph

```
ISSUE-130 (Guardian Activation) ──► ISSUE-131 (First-Login Setup)
    └─► ISSUE-132 (Link Disputes)
    └─► ISSUE-133 (Sibling Overview Landing)

ISSUE-133 (Dashboard)
    └─► ISSUE-134 (Per-Child Shell)
            └─► ISSUE-135 (Child Overview Tab) ◄── ISSUE-136 (Progress Snapshot cron)
            └─► ISSUE-138 (Attendance Calendar)
                    └─► ISSUE-139 (Absence Explanation)
                    └─► ISSUE-140 (Chronic Absence Alert)
            └─► ISSUE-141 (Results View)
                    └─► ISSUE-142 (Report Card Download)
                    └─► ISSUE-143 (Homework View)
                    └─► ISSUE-144 (Progress Chart) ◄── ISSUE-136 (snapshots)

ISSUE-145 (Fees Overview)
    └─► ISSUE-146 (Airtel Pay Now)
    └─► ISSUE-147 (MTN Pay Now)
    └─► ISSUE-148 (Pay All Children) ◄── ISSUE-146 + ISSUE-147
    └─► ISSUE-149 (Payment History)

ISSUE-150 (Messaging Schema) ──► must be done before all other messaging issues
    └─► ISSUE-151 (Guardian starts thread)
    └─► ISSUE-152 (Guardian inbox)
    └─► ISSUE-153 (Teacher inbox)
    └─► ISSUE-154 (Admin broadcast message)
    └─► ISSUE-155 (Message notifications)

ISSUE-156 (Announcements backend)
    └─► ISSUE-157 (Parent noticeboard)
    └─► ISSUE-158 (Calendar view)

ISSUE-159 (Push notifications) ──── can be done in parallel with messaging

ISSUE-160 (WhatsApp Integration) ──── Feature-gated, can be done last

ISSUE-161 (Notification Preferences)
    └─► ISSUE-162 (Notification History)
    └─► ISSUE-163 (Admin Audit)

ISSUE-164 (Guardian Profile)
    └─► ISSUE-165 (Add Guardian from Portal)
    └─► ISSUE-166 (Per-Child Preferences)

ISSUE-136 (Progress Snapshot Cron) ──── can run alongside all other issues
    └─► ISSUE-137 (Weekly Digest SMS)
```

---

## Definition of Done

All Sprint 00/01/02 DoD criteria apply, plus:

- [ ] **Performance budget met**: Every parent portal page tested with Chrome DevTools "Slow 3G" throttling. FCP < 2s, TTI < 4s. Use Lighthouse CI in the GitHub Actions workflow.
- [ ] **Permission checks verified**: Every guardian query tested with a guardian who has `canSeeResults: false` and `canSeeAttendance: false` — must return `{ forbidden: true }` not an empty array.
- [ ] **Cross-school guardian tested**: Seed guardian linked to children at two different schools — portal correctly shows both children with their respective school branding.
- [ ] **Multi-child pay-all tested**: Consolidated payment flow tested end-to-end in mock mode — webhook fires, all child invoices updated, guardian receives single receipt.
- [ ] **Progress snapshots verified**: Cron job runs once, creates one snapshot per active student, values match the underlying data. Second run updates (not duplicates) the snapshot.
- [ ] **WhatsApp mock mode**: When `Feature.WHATSAPP_NOTIFICATIONS` is enabled in development, WhatsApp messages log to console with full payload — no actual messages sent.
- [ ] **Message thread integrity**: Starting a thread, sending 3 messages, and reading receipts all verified. Duplicate thread creation for same participants prevented.
- [ ] **Push notification tested**: PWA add-to-homescreen on real Android phone. Absence SMS triggers push notification within 60 seconds when app is closed.
- [ ] **Offline portal tested**: Guardian visits portal while offline (Chrome DevTools → Offline). Last-loaded data shown with "Last updated X minutes ago" banner. No white screen or unhandled error.
- [ ] **`riskScore` field defined but null**: Every `studentProgressSnapshot` created this sprint has `riskScore: null` — explicitly verified. Sprint 07 will populate it.

---

## Sprint 03 → Sprint 04 Handoff Checklist

Before Sprint 04 (Boarding Module) begins, verify:

- [ ] `messageThreads` table is live with real data — Sprint 04 matron messages will use `context: 'boarding'` threads, writing to the same table
- [ ] `announcements.category` field includes `'hostel'` value — Sprint 04 boarding announcements use this immediately
- [ ] `announcements.targetAudience` includes `'boarding_parents'` — Sprint 04 uses this for hostel-specific notifications
- [ ] `guardians.notificationPreferences.sickBayAdmission`, `.visitorArrival`, `.pocketMoneyWithdrawal`, `.nightPrepAbsent` fields defined in schema — Sprint 04 will write to these
- [ ] `pendingPayments` table is live with `paymentContext` field — Sprint 04 pocket money top-up uses `paymentContext: 'pocket_money'`
- [ ] `initiateAirtelMoneyPayment` and `initiateMtnMomoPayment` actions accept generic `paymentContext` — Sprint 04 reuses them for pocket money deposits
- [ ] `studentProgressSnapshots` with `nightPrepAttendancePercent` and `sickBayVisitsThisTerm` fields defined (null for now) — Sprint 04 boarding cron will populate these
- [ ] `/(parent)/children/[studentId]/layout.tsx` tab bar has a "More" section that Sprint 04 can add "Hostel" tab to without restructuring the navigation
- [ ] `getChildOverviewForGuardian` query has commented placeholder `// Sprint 04: sickBayStatus, currentBed` — Sprint 04 adds these fields to the payload without breaking existing clients
- [ ] Guardian push notification infrastructure works — Sprint 04 sick bay admission fires a push notification immediately
- [ ] `students.boardingStatus` is `'boarding'` for all boarding test students in seed data — Sprint 04 needs this to correctly scope all boarding queries
- [ ] The weekly digest SMS (ISSUE-137) is tested with a boarding student — night prep absence field is null (not error) when attendance hasn't been taken yet

---

_Acadowl Development Guide — Sprint 03 — Guardian Portal & Communications_
_Last updated: 2025 | Previous: Sprint 02 — Fees & Finance | Next: Sprint 04 — Boarding Module_

