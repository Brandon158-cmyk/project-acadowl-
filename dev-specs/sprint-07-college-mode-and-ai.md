# Acadowl — Sprint 07: College Mode + AI At-Risk Engine

## Development Guide & Issue Tracker

> **Sprint Goal:** This is Acadowl's most ambitious sprint — and the one that justifies everything built before it. Six sprints of carefully placed hooks, pre-defined schema fields, and weekly progress snapshots converge here into two transformative capabilities. First: a complete college mode that turns Acadowl into a fully HEA-compliant tertiary institution management platform — semester calendars, credit-weighted GPA, course registration, academic transcripts, and bursary management. Second: an AI at-risk engine powered by the Anthropic Claude API that reads 12 weeks of `studentProgressSnapshots` across attendance, LMS engagement, conduct, welfare, transport, and fee compliance to identify — with explanation — the students who need intervention before they drop out, not after. Every field, every table, every null placeholder placed in Sprints 01–06 is redeemed here. Nothing is invented from scratch. Everything was built for this moment.

---

## 📋 Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [Continuity from Sprints 00–06](#continuity-from-sprints-0006)
3. [The Five Risk Indicator Sources](#the-five-risk-indicator-sources)
4. [College Mode Architecture](#college-mode-architecture)
5. [Epic 1 — Semester & Academic Calendar](#epic-1--semester--academic-calendar)
6. [Epic 2 — College Course Registration](#epic-2--college-course-registration)
7. [Epic 3 — Credit Units & GPA Engine](#epic-3--credit-units--gpa-engine)
8. [Epic 4 — Academic Transcripts](#epic-4--academic-transcripts)
9. [Epic 5 — HEA Compliance & Bursary Management](#epic-5--hea-compliance--bursary-management)
10. [Epic 6 — AI At-Risk Engine — Data Pipeline](#epic-6--ai-at-risk-engine--data-pipeline)
11. [Epic 7 — AI At-Risk Engine — Claude Integration](#epic-7--ai-at-risk-engine--claude-integration)
12. [Epic 8 — At-Risk Intervention Workflow](#epic-8--at-risk-intervention-workflow)
13. [Epic 9 — AI-Assisted Grading](#epic-9--ai-assisted-grading)
14. [Epic 10 — AI Tutoring Assistant](#epic-10--ai-tutoring-assistant)
15. [Epic 11 — MoE Statistical Returns](#epic-11--moe-statistical-returns)
16. [Epic 12 — Platform Analytics & School Health Dashboard](#epic-12--platform-analytics--school-health-dashboard)
17. [Epic 13 — Compliance Dashboard](#epic-13--compliance-dashboard)
18. [Epic 14 — Full-Year Financial Analytics](#epic-14--full-year-financial-analytics)
19. [Dependency Graph](#dependency-graph)
20. [Schema Additions in This Sprint](#schema-additions-in-this-sprint)
21. [Definition of Done](#definition-of-done)

---

## Sprint Overview

| Field             | Value                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sprint Name**   | Sprint 07 — College Mode + AI At-Risk Engine                                                                                                    |
| **Duration**      | 7 weeks                                                                                                                                         |
| **Team Size**     | 4–5 developers                                                                                                                                  |
| **Total Issues**  | 48                                                                                                                                              |
| **Feature Gates** | `Feature.GPA` · `Feature.SEMESTER_SYSTEM` · `Feature.HEA_COMPLIANCE` · `Feature.AI_INSIGHTS` · `Feature.AI_QUIZ` (re-used for tutoring)         |
| **Prerequisite**  | Sprint 06 complete and all handoff checks passed                                                                                                |
| **AI Models**     | `claude-sonnet-4-20250514` for at-risk analysis · `claude-haiku-4-5-20251001` for grading assistance and tutoring (cost-sensitive, high volume) |

### Sprint Epics at a Glance

| #   | Epic                                   | Issues | Est. Days |
| --- | -------------------------------------- | ------ | --------- |
| 1   | Semester & Academic Calendar           | 3      | 3         |
| 2   | College Course Registration            | 4      | 5         |
| 3   | Credit Units & GPA Engine              | 4      | 5         |
| 4   | Academic Transcripts                   | 3      | 3         |
| 5   | HEA Compliance & Bursary Management    | 4      | 4         |
| 6   | AI At-Risk Engine — Data Pipeline      | 4      | 4         |
| 7   | AI At-Risk Engine — Claude Integration | 4      | 5         |
| 8   | At-Risk Intervention Workflow          | 3      | 3         |
| 9   | AI-Assisted Grading                    | 3      | 4         |
| 10  | AI Tutoring Assistant                  | 3      | 4         |
| 11  | MoE Statistical Returns                | 5      | 5         |
| 12  | Platform Analytics & School Health     | 4      | 4         |
| 13  | Compliance Dashboard                   | 4      | 3         |
| 14  | Full-Year Financial Analytics          | 4      | 4         |

---

## Continuity from Sprints 00–06

The complete accounting of every hook, null field, and schema commitment redeemed in this sprint.

| Deliverable                                                                                                       | Redeemed In                                                            |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `schools.academicMode: 'semester'` and `Feature.SEMESTER_SYSTEM` flag (Sprint 00 ISSUE-004)                       | Epic 1 — semester calendar fully implemented                           |
| `Feature.GPA` and `Feature.HEA_COMPLIANCE` flags (Sprint 00 ISSUE-023)                                            | Epics 3 and 5 — GPA engine and HEA reporting                           |
| `Feature.AI_INSIGHTS` flag (Sprint 00 ISSUE-023)                                                                  | Epics 7 and 9 — at-risk engine and AI grading                          |
| `schools.heaCode` (Sprint 00 ISSUE-004)                                                                           | Epic 5 ISSUE-358 — HEA institution code on all compliance reports      |
| Evelyn Hone College seed school with `academicMode: 'semester'` and `Feature.GPA` (Sprint 00 ISSUE-039)           | All college epics tested against this seed school                      |
| `terms` with `academicMode: 'semester'` producing 2 terms named "Semester 1" / "Semester 2" (Sprint 01 ISSUE-041) | Epic 1 ISSUE-315 — semester calendar uses these term records           |
| `examSessions` with `type: 'midterm'` and `type: 'final'` for semester schools (Sprint 01 ISSUE-078)              | Epic 3 ISSUE-326 — GPA computed from midterm + final weighted sessions |
| `examResults.gradePoints` and `termAggregates.termGpa` (Sprint 01 ISSUE-082)                                      | Epic 3 ISSUE-326 — GPA engine reads and writes these fields            |
| `termAggregates.isCredit` (Sprint 01 ISSUE-082)                                                                   | Epic 3 ISSUE-326 — credit/no-credit determination for college subjects |
| `subjects.eczSubjectCode` (Sprint 01 ISSUE-044)                                                                   | Epic 11 ISSUE-367 — MoE returns require these codes                    |
| `getMoEAttendanceReturn` query scaffold (Sprint 01 ISSUE-090)                                                     | Epic 11 ISSUE-366 — full MoE attendance return implemented here        |
| `lmsCourses.gradeContributionPercent` (Sprint 05 ISSUE-219)                                                       | Epic 3 ISSUE-326 — LMS course weight in GPA calculation                |
| `lmsCourses.syllabusCoverage` array (Sprint 05 ISSUE-219)                                                         | Epic 11 ISSUE-368 — MoE syllabus coverage return                       |
| `lmsSubmissions.aiGradingData` null field reserved (Sprint 05 ISSUE-232)                                          | Epic 9 ISSUE-361 — AI grading populates this field                     |
| `questionBank` as a separate table (Sprint 05 ISSUE-228)                                                          | Epic 9 — question bank reuse across terms                              |
| `aiUsageLog` table (Sprint 05 ISSUE-229)                                                                          | All AI epics — every Claude API call logged here                       |
| `studentProgressSnapshots.riskScore` and `.riskFlags` null fields (Sprint 03 ISSUE-136)                           | Epic 7 ISSUE-350 — AI engine writes here every Friday                  |
| `studentProgressSnapshots.lmsEngagementScore` (Sprint 05 ISSUE-248)                                               | Epic 6 ISSUE-345 — risk indicator #2                                   |
| `studentProgressSnapshots.nightPrepAttendancePercent` and `.sickBayVisitsThisTerm` (Sprint 04)                    | Epic 6 ISSUE-345 — risk indicator #4                                   |
| `studentProgressSnapshots.conductIncidentsThisTerm` and `.conductSeverityHighest` (Sprint 04 ISSUE-206)           | Epic 6 ISSUE-345 — risk indicator #3                                   |
| `studentProgressSnapshots.transportBoardingRatePercent` (Sprint 06 ISSUE-308)                                     | Epic 6 ISSUE-345 — risk indicator #5                                   |
| `scholarships` table (Sprint 02 ISSUE-117)                                                                        | Epic 5 ISSUE-358 — bursary management extends this table               |
| `payment.method: 'scholarship'` (Sprint 02 ISSUE-086)                                                             | Epic 5 ISSUE-358 — scholarship disbursement uses this method           |
| `feeAuditLog` (Sprint 02 ISSUE-120)                                                                               | Epic 14 ISSUE-377 — full-year audit report reads this table            |
| `routeRunLog`, `transportBoardingEvents`, `gpsPings` (Sprint 06)                                                  | Epic 11 ISSUE-369 — MoE transport return                               |
| `vehicles.insuranceExpiry`, `staff.driversLicenceExpiry` (Sprint 06)                                              | Epic 13 ISSUE-374 — compliance dashboard                               |
| `bedAssignments` history table (Sprint 04 ISSUE-172)                                                              | Epic 11 ISSUE-370 — MoE boarding return                                |
| `libraryIssues.renewalCount` (Sprint 05 ISSUE-254)                                                                | Epic 11 ISSUE-371 — MoE library return                                 |
| `messageThreads` with `context: 'lms'` (Sprint 03 ISSUE-150)                                                      | Epic 10 ISSUE-363 — AI tutor joins as a participant                    |
| `digitalResources.accessLevel` (Sprint 05 ISSUE-258)                                                              | Epic 2 ISSUE-320 — enrolled-only access for college courses            |

---

## The Five Risk Indicator Sources

The at-risk engine does not invent new data. It reads from five streams that were wired into `studentProgressSnapshots` in Sprints 01–06. Every developer working on Epics 6–8 must understand these streams before touching any code.

| #   | Indicator                  | Source Field                                                                       | Sprint Added | Weight in Risk Score |
| --- | -------------------------- | ---------------------------------------------------------------------------------- | ------------ | -------------------- |
| 1   | **Academic performance**   | `examAverage`, `termGpa`, `homeworkSubmissionRate`, `homeworkOverdueCount`         | Sprint 01/03 | 35%                  |
| 2   | **LMS engagement**         | `lmsEngagementScore` (0–100 composite)                                             | Sprint 05    | 25%                  |
| 3   | **Conduct & behaviour**    | `conductIncidentsThisTerm`, `conductSeverityHighest`                               | Sprint 04    | 15%                  |
| 4   | **Welfare signals**        | `sickBayVisitsThisTerm`, `nightPrepAttendancePercent`, `attendancePercentThisTerm` | Sprint 01/04 | 15%                  |
| 5   | **Transport & compliance** | `transportBoardingRatePercent`, `feeBalanceZMW`                                    | Sprint 06/02 | 10%                  |

A student with `riskScore >= 70` is in the "high risk" band and triggers immediate teacher/admin notification. A score of 50–69 is "medium risk" — monitored weekly. A score < 50 is "low risk" — shown in the background report.

---

## College Mode Architecture

Before writing any college-mode code, understand the three design decisions that make it work without breaking secondary schools.

### 1. Mode Detection is School-Level, Not Platform-Level

College mode features (`Feature.SEMESTER_SYSTEM`, `Feature.GPA`, `Feature.HEA_COMPLIANCE`) are enabled per school. Kabulonga Boys Secondary, Chengelo, and Evelyn Hone College share the same codebase and the same Convex tables. College-specific UI is rendered behind feature gates, not behind separate route groups. The grade computation engine has a single entry point — it routes to the ECZ path or the GPA path based on `school.gradingMode`. This was established in Sprint 01 and must not be changed.

### 2. Course Registration is Additive to Section Enrolment

Secondary schools enrol students by section — a student is in Grade 10A and takes all subjects assigned to that section. Colleges enrol students in individual courses. Sprint 07 adds `courseRegistrations` — a table that replaces section-based enrolment for college students. Secondary schools never see this table. The existing `students.currentSectionId` field remains valid for college students as their "home cohort" reference.

### 3. GPA Builds on `termAggregates`

Sprint 01 already computes `termAggregates.termGpa` for GPA-mode schools. Sprint 07 does not replace this — it builds the cumulative GPA, credit transcript, and academic standing rules on top of it. The `computeGradesForSession` mutation (Sprint 01 ISSUE-082) already writes `gradePoints` correctly for GPA scales. Sprint 07 reads those `gradePoints` and produces the cumulative academic record.

---

## Epic 1 — Semester & Academic Calendar

> **Feature Gate:** `Feature.SEMESTER_SYSTEM`

---

### ISSUE-315 · Semester Calendar Management

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.SEMESTER_SYSTEM` | **Estimate:** 1 day

#### Description

Complete implementation of the semester-based academic calendar for colleges. Sprint 01 created terms with `academicMode: 'semester'` that produce 2 terms named "Semester 1" and "Semester 2". Sprint 07 adds the college-specific calendar rules on top of that foundation.

#### Acceptance Criteria

**Schema addition to `academicYears` for semester schools:**

```typescript
// Fields added to academicYears for semester schools
semesterBreakStart: v.optional(v.string()),   // 'YYYY-MM-DD' — between S1 and S2
semesterBreakEnd: v.optional(v.string()),
graduationDate: v.optional(v.string()),        // Graduation ceremony date
enrollmentOpenDate: v.optional(v.string()),    // When new student enrolment opens
enrollmentCloseDate: v.optional(v.string()),
courseRegistrationOpenDate: v.optional(v.string()), // When students can register courses
courseRegistrationCloseDate: v.optional(v.string()),
```

**Backend — `convex/college/calendar.ts`:**

- [ ] `configureSemesterCalendar` mutation: sets semester-specific dates on academic year
- [ ] `getSemesterCalendarForStudent` query: returns the full academic calendar with important dates — used in student portal and academic planning view
- [ ] `getRegistrationStatus` query: returns `{ open: boolean, opensIn?: number, closesIn?: number }` — drives the "Course Registration" button's enabled state
- [ ] Academic year creation wizard (Sprint 01 ISSUE-041) updated: for `academicMode: 'semester'` schools, shows semester break date fields and course registration window fields

**Frontend — `/(admin)/academic/calendar/page.tsx` — semester additions:**

- [ ] Semester break dates: date range picker between Semester 1 end and Semester 2 start
- [ ] Course registration window: shown as a prominent card — "Course registration opens [date] and closes [date]. Students can register from [date]."
- [ ] Graduation ceremony date: displayed on the academic calendar as a milestone
- [ ] Semester calendar export: printable PDF of the academic year's key dates — standard college requirement for prospectus

---

### ISSUE-316 · Academic Standing Rules

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.GPA` | **Estimate:** 1 day

#### Description

Define the rules that determine a student's academic standing — Good Standing, Probation, Suspension, and Dismissed. These are determined by cumulative GPA thresholds and are checked automatically at semester end.

#### Acceptance Criteria

**Schema addition to `schools`:**

```typescript
academicStandingRules: v.optional(
  v.object({
    goodStandingMinGpa: v.number(), // e.g., 2.0
    probationMinGpa: v.number(), // e.g., 1.5 (below good, above this = probation)
    suspensionMinGpa: v.number(), // e.g., 1.0 (below probation threshold = suspension)
    // Below suspensionMinGpa = DISMISSED
    maxConsecutiveProbationSemesters: v.number(), // e.g., 2
    minCreditLoadForFullTime: v.number(), // e.g., 12 credits
    minCreditLoadForPartTime: v.number(), // e.g., 6 credits
    graduationMinCumulativeGpa: v.number(), // e.g., 2.0
    graduationMinCredits: v.number(), // Total credits required to graduate
  }),
);
```

**Schema addition to `students`:**

```typescript
academicStanding: v.optional(v.union(
  v.literal('good_standing'),
  v.literal('probation'),
  v.literal('academic_suspension'),
  v.literal('dismissed'),
  v.literal('graduated'),
  v.literal('withdrawn')
)),
cumulativeGpa: v.optional(v.number()),       // Updated at every semester end
totalCreditsEarned: v.optional(v.number()),  // Incremented as credits awarded
totalCreditsAttempted: v.optional(v.number()),
```

- [ ] `computeAcademicStanding` internal mutation: called at semester end — computes standing from `cumulativeGpa` against the school's configured thresholds
- [ ] Standing change notification: if standing changes to `probation` or worse — notify student and guardian via SMS and in-app with a formal letter PDF
- [ ] Academic standing history table: every standing change recorded with date and GPA at time of change
- [ ] `/(admin)/college/academic-standing/page.tsx`: list of all students by standing — probation/suspension students listed with GPA and required improvement

---

### ISSUE-317 · College-Mode Academic Year Rollover

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.SEMESTER_SYSTEM` | **Estimate:** 1 day

#### Description

Year-end processing for colleges — credit accumulation, standing determination, graduation clearance, and student year-level progression. More complex than the secondary school term rollover.

#### Acceptance Criteria

**`convex/college/rollover.ts` → `runCollegeYearEndRollover` action:**

- [ ] For each active college student:
  1. Sum all credits earned this academic year → add to `students.totalCreditsEarned`
  2. Compute cumulative GPA across all terms: weighted average of `termAggregates.termGpa` by credit load
  3. Call `computeAcademicStanding` with new cumulative GPA
  4. Determine year-level progression: if `totalCreditsEarned >= yearProgressionThreshold` → advance to Year 2/3/4
  5. Flag students eligible for graduation: `totalCreditsEarned >= graduationMinCredits` AND `cumulativeGpa >= graduationMinCumulativeGpa`

- [ ] Graduation eligibility list: published to admin with student name, credits, GPA — admin confirms before generating transcripts
- [ ] Year-level progression announcements: "Congratulations — X students have progressed to Year 2"
- [ ] Students not meeting progression: auto-set `academicStanding` appropriately; notify personal tutor

---

## Epic 2 — College Course Registration

> **Feature Gate:** `Feature.SEMESTER_SYSTEM`

---

### ISSUE-318 · Course Registration System — Core Schema

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.SEMESTER_SYSTEM` | **Estimate:** 1 day

#### Description

The data model for college-style course registration — distinct from secondary school section enrolment. Each college student selects courses for the semester from a catalogue, subject to credit load limits, prerequisite checks, and registration window enforcement.

#### Acceptance Criteria

**Schema additions:**

```typescript
collegeCourseOfferings: defineTable({
  schoolId: v.id('schools'),
  subjectId: v.id('subjects'),
  termId: v.id('terms'),
  academicYearId: v.id('academicYears'),
  staffId: v.id('staff'), // Lecturer
  creditUnits: v.number(), // Credit value of this course: 3, 4, 6 units
  maxEnrolment: v.number(), // Course cap
  currentEnrolment: v.number(), // Denormalised
  scheduleSlots: v.array(v.id('timetableSlots')),
  prerequisites: v.array(v.id('subjects')), // Must have passed these to register
  isElective: v.boolean(),
  status: v.union(
    v.literal('open'), // Registration open
    v.literal('closed'), // Full or registration window closed
    v.literal('cancelled'), // Minimum enrolment not met
  ),
  minimumEnrolment: v.optional(v.number()), // Course cancelled if fewer register
  venue: v.optional(v.string()),
  createdAt: v.number(),
})
  .index('by_school_term', ['schoolId', 'termId'])
  .index('by_subject_term', ['subjectId', 'termId']);

courseRegistrations: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  offeringId: v.id('collegeCourseOfferings'),
  termId: v.id('terms'),
  academicYearId: v.id('academicYears'),
  status: v.union(
    v.literal('registered'),
    v.literal('dropped'), // Dropped within add/drop window
    v.literal('withdrawn'), // Withdrawn after window (W on transcript)
    v.literal('completed'),
    v.literal('failed'),
    v.literal('incomplete'), // Medical/special circumstances — grade deferred
  ),
  creditUnits: v.number(), // Snapshot at registration time
  registeredAt: v.number(),
  droppedAt: v.optional(v.number()),
  droppedReason: v.optional(v.string()),
})
  .index('by_student_term', ['studentId', 'termId'])
  .index('by_offering', ['offeringId'])
  .index('by_school_term', ['schoolId', 'termId']);
```

**Backend — `convex/college/registration.ts`:**

- [ ] `registerForCourse` mutation:
  - Validates registration window is open (`school.courseRegistrationOpenDate` to `closeDate`)
  - Validates student has passed all `prerequisites` (checks past `courseRegistrations` with `status: 'completed'`)
  - Validates `currentEnrolment < maxEnrolment`
  - Validates adding this course doesn't exceed `maxCreditLoadForFullTime`
  - Creates `courseRegistrations` record, increments `currentEnrolment`
  - Requires student or admin to be the caller

- [ ] `dropCourse` mutation: allowed within add/drop window — sets `status: 'dropped'`, decrements enrolment
- [ ] `withdrawFromCourse` mutation: after drop window — sets `status: 'withdrawn'` (W appears on transcript), no GPA impact but affects credit completion rate
- [ ] `getRegisteredCoursesForStudent` query: all registrations for current semester with offering details
- [ ] `getPrerequisiteStatus` query: for a student and an offering — returns which prerequisites are met/unmet

---

### ISSUE-319 · Course Catalogue and Registration Portal

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.SEMESTER_SYSTEM` | **Estimate:** 1.5 days

#### Description

The student-facing course catalogue and registration interface. A student browses available courses for the semester, checks prerequisites and credit load, and submits their registration. The interface is clean and guides them to a valid schedule.

#### User Story

> Year 2 Nursing student Nalisha opens Acadowl on the first day of the registration window. She sees "Course Registration is open until [date] — 5 days remaining." She browses the catalogue, sees Anatomy II requires a pass in Anatomy I (she has it), adds it. She adds 3 more courses. Her credit total shows "15/18 maximum." She confirms registration and receives a confirmation PDF.

#### Acceptance Criteria

**`convex/college/catalogue.ts`:**

- [ ] `getCoursesCatalogueForStudent` query:
  - Returns all `collegeCourseOfferings` for the current semester
  - Per offering: subject name, lecturer, credit units, schedule, enrolment status, seat availability, prerequisite status for this student
  - Already-registered courses shown with "Registered ✓" state
  - Prerequisite-blocked courses shown with "Requires [subject] — not yet passed"

**Frontend — `/(student)/college/register/page.tsx`:**

- [ ] Registration window banner: "Registration closes in 3 days 12 hours" — countdown
- [ ] Course catalogue grid: subject name, lecturer, credit units badge, seats remaining, schedule summary
  - Status chips: "Available", "Full", "Requires prerequisites", "Already registered"
  - "Add" button (large, green) — inactive for blocked courses
- [ ] **My Registration** sidebar: selected courses list, total credit units, maximum credit load progress bar (e.g., "15/18 credits")
  - Warning: if below `minCreditLoadForFullTime` — "You are below full-time status. Financial aid may be affected."
  - Warning: if above maximum — "You have exceeded the maximum credit load for this semester."
- [ ] "Confirm Registration" button: submits all selections in one transaction; generates registration confirmation PDF; sends SMS confirmation to guardian
- [ ] Prerequisite tooltip: hover/tap on a blocked course shows exactly what is needed: "Requires: Anatomy I (Semester 1, Year 1) — not yet completed"

---

### ISSUE-320 · Course Registration Admin Management

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.SEMESTER_SYSTEM` | **Estimate:** 0.5 days

#### Description

Admin tools for managing course offerings — setting up the catalogue each semester, handling override registrations, and monitoring enrolment.

#### Acceptance Criteria

- [ ] `/(admin)/college/courses/page.tsx`: list of all offerings for the current semester with enrolment counts
- [ ] "Create Offering" form: subject, lecturer, credit units, max enrolment, prerequisites, schedule slots
- [ ] Admin override registration: `adminOverrideRegistration` mutation — bypass prerequisites or enrolment cap with documented reason
- [ ] Low-enrolment alert: offerings with `currentEnrolment < minimumEnrolment` — flagged with "Cancel?" option
- [ ] Post-window: lock registrations, generate final class lists per offering for lecturers

---

### ISSUE-321 · Add/Drop Period Management

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.SEMESTER_SYSTEM` | **Estimate:** 0.5 days

#### Description

After initial registration, colleges offer a short add/drop window (typically week 1–2 of semester) where students can adjust their schedule without academic penalty.

#### Acceptance Criteria

**Schema addition to `schools`:**

```typescript
// Inside academicStandingRules or as standalone field
addDropWindowEnd: v.optional(v.string()),   // 'YYYY-MM-DD' — end of add/drop period
withdrawalDeadline: v.optional(v.string()), // Last date to withdraw (W grade)
```

- [ ] `dropCourse` mutation enforces `addDropWindowEnd` — after this date, only `withdrawFromCourse` is available
- [ ] Add/drop window status shown on student registration page: "Add/Drop period ends [date]"
- [ ] Student can add new courses during add/drop window (if seats available) — same validation as initial registration
- [ ] Admin can extend add/drop window: `extendAddDropWindow` mutation with documented reason

---

## Epic 3 — Credit Units & GPA Engine

> **Feature Gate:** `Feature.GPA`

---

### ISSUE-322 · Credit Unit Configuration per Subject

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.GPA` | **Estimate:** 0.5 days

#### Description

Each college subject carries a credit unit value — typically 3 for a standard course, 4–6 for lab-heavy courses. This weight drives GPA computation. Sprint 01 subjects have no credit field — this adds it.

#### Acceptance Criteria

**Schema addition to `subjects`:**

```typescript
creditUnits: v.optional(v.number()),     // 3 standard; 4–6 for lab/practical subjects
isCoreCurriculum: v.optional(v.boolean()), // Compulsory for graduation
creditCategory: v.optional(v.union(
  v.literal('core'),
  v.literal('major'),
  v.literal('elective'),
  v.literal('general_education')
)),
```

- [ ] `updateSubjectCredits` mutation: sets credit units and category for a subject
- [ ] Subject management page (Sprint 01 ISSUE-044) updated: shows credit units field for GPA-mode schools
- [ ] Default credit value: 3 — applied to all subjects without explicit credit assignment
- [ ] `getTotalCreditsForCurriculum` query: total credit units required across all core + major subjects — validates against `graduationMinCredits`

---

### ISSUE-323 · Midterm and Final Exam Weighting

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.GPA` | **Estimate:** 0.5 days

#### Description

For GPA schools, the term grade is computed as a weighted combination of continuous assessment (CA), midterm, and final exam. The weights are configured per school and determine how `examResults` sessions are combined into `termAggregates.termGpa`.

#### Acceptance Criteria

**Schema addition to `schools`:**

```typescript
gpaGradingConfig: v.optional(
  v.object({
    continuousAssessmentWeight: v.number(), // e.g., 30
    midtermWeight: v.number(), // e.g., 30
    finalExamWeight: v.number(), // e.g., 40
    // Must sum to 100
    passMark: v.number(), // e.g., 50
    creditPassMark: v.number(), // Minimum to earn credits: e.g., 45
  }),
);
```

- [ ] `computeGradesForSession` (Sprint 01 ISSUE-082) updated: for GPA-mode schools, when computing `termAggregates`, apply the weighted formula to combine session scores
- [ ] Validation: `continuousAssessmentWeight + midtermWeight + finalExamWeight === 100` — enforced on save
- [ ] GPA configuration page: `/(admin)/settings/grading/page.tsx` — new section for GPA schools showing weight sliders
- [ ] Grade component breakdown shown on student transcript: "CA: 68% (×0.30) | Midterm: 72% (×0.30) | Final: 75% (×0.40) → Weighted: 72.3%"

---

### ISSUE-324 · Cumulative GPA Computation

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.GPA` | **Estimate:** 1 day

#### Description

Compute the student's cumulative GPA across all completed semesters, weighted by credit units. This is the number that appears on the transcript, determines academic standing, and is reported to the HEA.

#### Acceptance Criteria

**`convex/college/gpa.ts`:**

- [ ] `computeCumulativeGpa` action:
  - Fetches all `termAggregates` records for the student where `status: 'completed'`
  - For each term: gets the per-subject `examResults` with `gradePoints` and the subject's `creditUnits`
  - Formula: `CGPA = Σ(gradePoints × creditUnits) / Σ(creditUnits for attempted courses)`
  - Returns: `{ cgpa, totalCreditsEarned, totalCreditsAttempted, gradeDistribution }`
  - Updates `students.cumulativeGpa`, `students.totalCreditsEarned`, `students.totalCreditsAttempted`

- [ ] `getGpaBreakdownForStudent` query: per-semester GPA trend — returns array of `{ semesterId, semesterGpa, creditLoad, cumulativeGpaAfterSemester }`
- [ ] GPA trend chart: students and guardians can see their GPA trajectory — is it improving, declining, or flat?
- [ ] Called automatically at: end of each semester (via `activateTerm` rollover), and on demand by admin

---

### ISSUE-325 · Grade Point Scale Management

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.GPA` | **Estimate:** 0.5 days

#### Description

Configure the school's specific GPA scale — the mapping from percentage score to grade symbol and grade points. Sprint 01 built the grading scale schema; Sprint 07 adds the college-specific 4.0 scale management UI.

#### Acceptance Criteria

- [ ] Default 4.0 scale seeded for all `college` school types at onboarding (Sprint 00 ISSUE-037):
  ```
  A  = 80–100% = 4.0 | A- = 75–79% = 3.7 | B+ = 70–74% = 3.3
  B  = 65–69% = 3.0  | B- = 60–64% = 2.7 | C+ = 55–59% = 2.3
  C  = 50–54% = 2.0  | C- = 45–49% = 1.7 | D  = 40–44% = 1.0
  F  = 0–39%  = 0.0
  ```
- [ ] `/(admin)/settings/grading/page.tsx` — GPA scale section: table of grade boundaries editable by admin
- [ ] Validation: grade boundaries must be contiguous (no gaps or overlaps), grade points must be descending
- [ ] Grade scale change history: audit log entry on every change — affects transcript integrity
- [ ] "Reset to Default" button: restores the standard 4.0 scale with confirmation

---

### ISSUE-326 · Credit Transcript Generation

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.GPA` | **Estimate:** 1.5 days

#### Description

Generate the official academic credit transcript — the document a graduate takes to their employer or a postgraduate institution. It lists every course attempted, the grade earned, the credit units, and the cumulative GPA.

#### Acceptance Criteria

**`convex/college/transcript.ts`:**

- [ ] `generateTranscript` action:
  - Builds the full transcript data structure from `courseRegistrations`, `examResults`, `termAggregates`
  - Groups by academic year and semester
  - Per course: subject code, subject name, credit units, grade symbol, grade points, status (completed/withdrawn/failed)
  - Per semester: semester GPA, credits attempted, credits earned
  - Overall: cumulative GPA, total credits attempted, total credits earned, academic standing
  - Honours classification (if applicable): `First Class ≥ 3.7`, `Upper Second 3.3–3.69`, `Lower Second 3.0–3.29`, `Pass 2.0–2.99` — configurable per school

**Transcript PDF (using `@react-pdf/renderer` — same library as Sprint 01 report cards):**

- [ ] Official letterhead: college name, HEA code, address, phone
- [ ] Student details section: full name, student number, programme, date of issue
- [ ] Per-semester table: course code | course name | credits | grade | points
- [ ] Semester summary row: GPA, credits earned
- [ ] Cumulative summary at bottom: CGPA, total credits, academic standing, honours classification
- [ ] Registrar signature line with date
- [ ] "OFFICIAL TRANSCRIPT" watermark on each page
- [ ] "UNOFFICIAL — For Student Use Only" variant (no watermark, printable by student)
- [ ] QR code linking to a Convex HTTP endpoint that verifies the transcript's authenticity

- [ ] Saved as `studentDocuments` record with `type: 'transcript'`
- [ ] `/(admin)/college/transcripts/page.tsx`: generate transcript per student, batch generate for all graduating students, view previously issued transcripts

---

## Epic 4 — Academic Transcripts

---

### ISSUE-327 · Transcript Verification Endpoint

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.GPA` | **Estimate:** 0.5 days

#### Description

A public (unauthenticated) HTTP endpoint that verifies a transcript's authenticity by its unique code. Employers and institutions can scan the QR code on a printed transcript to confirm it is genuine.

#### Acceptance Criteria

**`convex/http.ts` — new public action:**

- [ ] `GET /verify-transcript/:code` — public endpoint, no auth required:
  - Looks up `transcriptVerifications` table by `verificationCode`
  - Returns: `{ valid: true, studentName, programme, graduationYear, cgpa, issuedAt, issuedBy }` or `{ valid: false }`
  - Response is human-readable HTML — formatted for a phone browser
  - Rate-limited: 30 requests per IP per minute to prevent enumeration
  - Every verification access logged: `transcriptVerifications.lastVerifiedAt`, `verificationCount`

**Schema addition:**

```typescript
transcriptVerifications: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  transcriptDocumentId: v.id('studentDocuments'),
  verificationCode: v.string(), // Short, unique: 'EVH-2025-A3F9K'
  cgpa: v.number(),
  totalCredits: v.number(),
  programme: v.string(),
  graduationYear: v.optional(v.number()),
  issuedAt: v.number(),
  issuedBy: v.id('users'),
  lastVerifiedAt: v.optional(v.number()),
  verificationCount: v.number(),
})
  .index('by_code', ['verificationCode'])
  .index('by_student', ['studentId']);
```

---

### ISSUE-328 · Student Academic Record Portal

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.GPA` | **Estimate:** 0.5 days

#### Description

The student's comprehensive academic record view — their personal transcript, GPA trend, credit progress toward graduation, and registered courses.

#### Acceptance Criteria

- [ ] `/(student)/college/academic-record/page.tsx`:
  - **GPA Summary card**: Cumulative GPA with trend indicator (↑ improving / ↓ declining / → stable), academic standing badge, "X credits of Y required for graduation"
  - **GPA trend chart**: recharts `LineChart` — semester GPA by semester
  - **Current semester**: registered courses with grade when released
  - **Credit progress**: ring chart — credits earned vs required (like a graduation progress bar)
  - **Download Unofficial Transcript** button: generates PDF immediately
- [ ] Guardian portal: "Academics" tab on child detail view (college students) — shows GPA summary and current registration
- [ ] `getStudentAcademicRecord` query: all academic data aggregated for this view

---

### ISSUE-329 · Programme Management

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.HEA_COMPLIANCE` | **Estimate:** 0.5 days

#### Description

Define the academic programmes offered by the college — the framework within which courses, graduation requirements, and transcripts are structured.

#### Acceptance Criteria

**Schema addition:**

```typescript
collegeProgrammes: defineTable({
  schoolId: v.id('schools'),
  programmeCode: v.string(), // 'NUR-DIP' — HEA programme code
  name: v.string(), // 'Diploma in Nursing'
  level: v.union(
    v.literal('certificate'),
    v.literal('diploma'),
    v.literal('degree'),
    v.literal('postgraduate'),
  ),
  durationYears: v.number(), // 2, 3, or 4
  totalCreditUnits: v.number(), // Credits required to graduate
  minCgpaToGraduate: v.number(), // Usually 2.0
  coreSubjectIds: v.array(v.id('subjects')),
  isActive: v.boolean(),
  heaAccreditationCode: v.optional(v.string()),
  accreditationExpiry: v.optional(v.string()),
  createdAt: v.number(),
}).index('by_school', ['schoolId']);
```

- [ ] `/(admin)/college/programmes/page.tsx`: programme management with HEA accreditation tracking
- [ ] Student enrolled into a programme: `students.programmeId: v.optional(v.id('collegeProgrammes'))` — set at enrolment
- [ ] Programme progress shown on transcript: programme name, programme code, expected graduation year

---

## Epic 5 — HEA Compliance & Bursary Management

> **Feature Gate:** `Feature.HEA_COMPLIANCE`

---

### ISSUE-330 · HEA Statistical Return

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.HEA_COMPLIANCE` | **Estimate:** 1 day

#### Description

The Higher Education Authority of Zambia requires colleges to submit annual statistical returns covering enrolment, programme completion rates, academic staff qualifications, and financial data. This automates most of the data collection.

#### Acceptance Criteria

**`convex/college/heaReturn.ts`:**

- [ ] `generateHeaReturn` action — compiles the following:
  - Total students enrolled by programme, year level, gender
  - New enrolments this academic year
  - Graduates this year: count by programme, average GPA, completion rate
  - Dropout rate: students who `withdrew` or were `dismissed`
  - Retention rate: students who progressed vs started
  - Credit completion rates by programme
  - Staff qualifications summary (from `staff` records — qualification level)
  - Library statistics (from `libraryIssues.renewalCount` — Sprint 05)
  - Transport statistics (from `routeRunLog` — Sprint 06)

- [ ] Returns structured data AND generates a PDF report formatted to HEA template standards
- [ ] `/(admin)/college/hea-return/page.tsx`:
  - "Generate HEA Return [Year]" button with year selector
  - Preview of all data sections before generating
  - Download PDF button
  - Data validation checklist: "All students have programme codes ✓", "All graduations recorded ✓", "HEA code on letterhead ✓"

---

### ISSUE-331 · Student Bursary and Government Sponsorship Management

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.HEA_COMPLIANCE` | **Estimate:** 1.5 days

#### Description

Zambian college students frequently receive government bursaries, church sponsorships, or institutional scholarships. This sprint upgrades the Sprint 02 `scholarships` table into a full bursary management system — with disbursement tracking, conditions, and HEA reporting.

#### User Story

> 43 students at Evelyn Hone College are on the Government Bursary. The bursary covers 80% of tuition each semester. The bursar needs to: track which students are sponsored, confirm bursary payments received from government, apply them to student invoices, and report remaining balances to the college board.

#### Acceptance Criteria

**Schema additions to `scholarships` (Sprint 02 table — extending):**

```typescript
bursaryType: v.optional(v.union(
  v.literal('government'),             // TEVETA / Ministry of Higher Education
  v.literal('church'),
  v.literal('ngo'),
  v.literal('institutional'),          // School's own bursary fund
  v.literal('private')
)),
sponsorName: v.optional(v.string()),   // 'TEVETA Bursary Programme 2025'
sponsorContactEmail: v.optional(v.string()),
coverageType: v.union(
  v.literal('full_tuition'),
  v.literal('partial_percent'),        // e.g., 80% of tuition
  v.literal('fixed_amount'),           // e.g., ZMW 5,000 per semester
  v.literal('all_fees')               // Tuition + boarding + transport
),
coveragePercent: v.optional(v.number()),
coverageAmountZMW: v.optional(v.number()),
conditions: v.optional(v.string()),    // e.g., 'Must maintain 2.5 GPA'
minimumGpa: v.optional(v.number()),    // Auto-flagged if GPA drops below this
renewalStatus: v.union(
  v.literal('active'),
  v.literal('under_review'),
  v.literal('renewed'),
  v.literal('revoked')
),
disbursements: v.array(v.object({
  semesterId: v.id('terms'),
  expectedAmountZMW: v.number(),
  receivedAmountZMW: v.optional(v.number()),
  receivedDate: v.optional(v.string()),
  appliedToInvoiceId: v.optional(v.id('invoices')),
  notes: v.optional(v.string()),
})),
```

**Backend — `convex/college/bursary.ts`:**

- [ ] `recordBursaryDisbursement` mutation: records receipt of bursary payment from sponsor, applies it to student's invoice as a `creditNote` with `type: 'scholarship'`
- [ ] `checkBursaryConditions` action: runs at semester end — checks if sponsored students still meet GPA requirement; flags those at risk of revocation
- [ ] `getBursaryReport` query: full bursary status across all sponsored students — for bursar and college board
- [ ] `revokeBursary` mutation: records revocation, notifies student and guardian, adjusts invoice accordingly

**Frontend — `/(admin)/fees/bursaries/page.tsx`:**

- [ ] List of all bursary-sponsored students with sponsor, coverage, current disbursement status
- [ ] "Record Payment Received" button per student: amount, date, reference number
- [ ] Bursary conditions check alert: students whose GPA dropped below bursary minimum are highlighted in amber: "Chanda's GPA 1.8 — below minimum 2.0 for Government Bursary"
- [ ] Term bursary summary: expected vs received, outstanding from sponsors, applied to invoices

---

### ISSUE-332 · Graduation Clearance Process

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.HEA_COMPLIANCE` | **Estimate:** 0.5 days

#### Description

Before a student can graduate, multiple departments must clear them — library (no outstanding books), finance (no fee arrears), academic (credits and GPA met), and administration (all documents submitted). This digital clearance replaces the physical clearance form students carry between offices.

#### Acceptance Criteria

**Schema addition:**

```typescript
graduationClearance: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  academicYearId: v.id('academicYears'),
  checks: v.object({
    academic: v.object({
      cleared: v.boolean(),
      clearedBy: v.optional(v.id('users')),
      notes: v.optional(v.string()),
    }),
    finance: v.object({
      cleared: v.boolean(),
      clearedBy: v.optional(v.id('users')),
      outstandingZMW: v.optional(v.number()),
    }),
    library: v.object({
      cleared: v.boolean(),
      clearedBy: v.optional(v.id('users')),
      outstandingBooks: v.optional(v.number()),
    }),
    administration: v.object({
      cleared: v.boolean(),
      clearedBy: v.optional(v.id('users')),
      notes: v.optional(v.string()),
    }),
  }),
  fullyCleared: v.boolean(),
  ceremonyDate: v.optional(v.string()),
  createdAt: v.number(),
}).index('by_student', ['studentId']);
```

- [ ] `initiateGraduationClearance` mutation: creates clearance record for eligible students
- [ ] Auto-populate checks: academic (from `computeAcademicStanding`), finance (from `guardianLedger`), library (from `libraryIssues` with no return)
- [ ] `/(admin)/college/graduation/page.tsx`: clearance dashboard — list of graduation candidates, per-department clearance status, "Clear" buttons per department
- [ ] When `fullyCleared: true`: triggers transcript generation (ISSUE-326), sends congratulations notification to student and guardian

---

### ISSUE-333 · Student Personal Tutor System

**Type:** Backend + Frontend | **Priority:** P2 | **Feature Gate:** `Feature.HEA_COMPLIANCE` | **Estimate:** 0.5 days

#### Description

Every college student is assigned a personal tutor (a lecturer responsible for their pastoral welfare and academic guidance). Tutors receive the at-risk alerts for their tutees and conduct regular 1-on-1 meetings.

#### Acceptance Criteria

**Schema addition to `students`:**

```typescript
personalTutorStaffId: v.optional(v.id('staff')),
```

- [ ] `assignPersonalTutor` mutation: admin assigns a tutor to a student
- [ ] `getMyTutees` query: for a tutor — all students assigned to them with their GPA, academic standing, at-risk status
- [ ] At-risk alerts (Epic 7) delivered to personal tutor in addition to admin
- [ ] Personal tutor meeting log: `tutorMeetings` table — date, notes, agreed actions (simple record-keeping)
- [ ] `/(teacher)/tutees/page.tsx`: tutor's view of their tutee caseload with welfare and academic signals

---

## Epic 6 — AI At-Risk Engine — Data Pipeline

> **Feature Gate:** `Feature.AI_INSIGHTS`
> **Goal:** Aggregate six sprints of student data into a clean, structured context document that can be sent to the Claude API in one call. The quality of the AI output depends entirely on the quality of this pipeline.

---

### ISSUE-334 · Progress Snapshot Completeness Audit

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 0.5 days

#### Description

Before the at-risk engine can run, verify that all six sprint data streams are populating `studentProgressSnapshots` correctly. This is the single most important pre-flight check in the sprint.

#### Acceptance Criteria

**`convex/analytics/snapshotAudit.ts`:**

- [ ] `auditProgressSnapshotCompleteness` query — called from admin dashboard:
  - For the last 4 weeks of snapshots, checks each field is populated for the expected students:
    - `attendancePercentThisTerm`: should be non-null for all active students
    - `lmsEngagementScore`: non-null if `Feature.LMS` enabled
    - `conductIncidentsThisTerm`: non-null for boarding students if `Feature.BOARDING` enabled
    - `sickBayVisitsThisTerm`: non-null for boarding students if `Feature.SICK_BAY` enabled
    - `nightPrepAttendancePercent`: non-null for boarding students
    - `transportBoardingRatePercent`: non-null for transport students if `Feature.TRANSPORT` enabled
    - `homeworkSubmissionRate`: non-null if any LMS homework exists
  - Returns: `{ completenessPercent, missingFields: Record<string, number> }`

- [ ] `/(admin)/analytics/snapshot-health/page.tsx`: visual completeness report — per-field fill rate for the last 8 weeks
- [ ] Auto-warn: if completeness < 80% on any field, show a banner on the at-risk dashboard: "⚠ [Field] data is incomplete — at-risk scores may be less accurate. Check [module] configuration."

---

### ISSUE-335 · Student Risk Profile Builder

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 1.5 days

#### Description

The deterministic part of the at-risk pipeline. Builds a structured risk profile for each student from their snapshot history — before the AI sees it. This ensures the AI gets a clean, normalised, school-context-aware summary rather than raw Convex data.

#### Acceptance Criteria

**`convex/analytics/riskProfile.ts`:**

- [ ] `buildStudentRiskProfile` internal action:

  ```typescript
  function buildStudentRiskProfile(params: {
    student: Student;
    school: School;
    snapshots: StudentProgressSnapshot[]; // Last 12 weeks, newest first
    currentTerm: Term;
    gradeInfo: Grade;
    sectionInfo: Section;
  }): StudentRiskProfile;
  ```

  Returns a structured `StudentRiskProfile`:

  ```typescript
  interface StudentRiskProfile {
    studentId: string;
    studentName: string;
    grade: string;
    section: string;
    schoolType: string;
    academicMode: 'term' | 'semester';
    weekInTerm: number; // Context for AI: how far into term we are
    indicators: {
      academic: {
        examAverage: number | null;
        trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
        homeworkSubmissionRate: number | null;
        homeworkOverdueCount: number | null;
        lmsEngagementScore: number | null;
        missedExamSessions: number;
      };
      attendance: {
        percentThisTerm: number | null;
        consecutiveAbsences: number;
        trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
        nightPrepPercent: number | null; // null if not boarding school
      };
      welfare: {
        sickBayVisitsThisTerm: number | null;
        conductIncidentsThisTerm: number | null;
        conductSeverityHighest: string | null;
        boardingWelfareFlagged: boolean;
      };
      transport: {
        boardingRatePercent: number | null; // null if not on transport
        notBoardedCount: number | null;
      };
      financial: {
        feeBalanceZMW: number;
        isInArrears: boolean;
        weeksInArrears: number;
        hasScholarship: boolean;
      };
    };
    deterministicRiskScore: number; // 0–100, computed without AI
    deterministicRiskBand: 'low' | 'medium' | 'high';
    riskFactorsSummary: string[]; // Human-readable: ["Attendance dropped 15% in 3 weeks", "3 homework assignments overdue"]
    historicalContext: {
      previousTermAverage: number | null;
      previousTermAttendance: number | null;
      termOverTermTrend: 'improving' | 'declining' | 'stable';
    };
  }
  ```

- [ ] `computeDeterministicRiskScore` pure function (unit-tested — 10+ test cases):
  - Applies the five-indicator weighted formula (see table in sprint overview)
  - Returns a 0–100 score using the weights: academic 35%, LMS 25%, conduct 15%, welfare 15%, transport/financial 10%
  - Null indicators reduce the weight pool (not counted as zero): if no transport, the 10% transport weight is redistributed proportionally to the other four indicators
  - Returns `riskFactorsSummary`: natural language list of the top 3 risk signals that elevated the score

---

### ISSUE-336 · Risk Score History and Trending

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 0.5 days

#### Description

Track the risk score over time — the trajectory is often more informative than the absolute value. A student with a score of 65 and rising is more urgent than one with a score of 65 and falling.

#### Acceptance Criteria

**Schema addition:**

```typescript
studentRiskHistory: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  weekDate: v.string(), // 'YYYY-MM-DD' — Friday of the week
  deterministicScore: v.number(),
  aiScore: v.optional(v.number()), // Set after AI analysis runs
  riskBand: v.string(),
  riskFlags: v.array(v.string()),
  aiNarrative: v.optional(v.string()), // Claude's explanation (stored for audit)
  interventionTriggered: v.boolean(), // Was an alert sent this week?
  createdAt: v.number(),
})
  .index('by_student', ['studentId'])
  .index('by_school_week', ['schoolId', 'weekDate']);
```

- [ ] `writeRiskHistory` internal mutation: called after every at-risk computation — creates a record in this table
- [ ] `getRiskTrend` query: last 10 weeks of risk scores for a student — used for the teacher/admin risk detail view
- [ ] Trend classification: `'rapid_deterioration'` (score increased > 20 points in 2 weeks), `'gradual_decline'` (increasing over 4+ weeks), `'improving'`, `'stable'`
- [ ] Trend class drives notification urgency: `'rapid_deterioration'` triggers immediate alert regardless of absolute score

---

### ISSUE-337 · At-Risk Computation Cron

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 0.5 days

#### Description

The scheduled job that runs the at-risk pipeline every Friday evening — after the weekly progress snapshots are written (Sprint 03 Friday cron) and before the Monday morning teacher dashboard refresh.

#### Acceptance Criteria

**`convex/crons.ts` — new job `at-risk-weekly-computation`:**

- [ ] Schedule: every Friday at 20:00 CAT (2 hours after the 18:00 progress snapshot cron)
- [ ] `runAtRiskComputationForSchool` action:
  1. Fetch all active students for the school
  2. For each student in batches of 50: call `buildStudentRiskProfile` → `computeDeterministicRiskScore`
  3. Write `riskScore` and `riskFlags` to the latest `studentProgressSnapshot`
  4. Write to `studentRiskHistory`
  5. For students with `deterministicRiskBand: 'high'`: queue `generateAiAtRiskAnalysis` (Epic 7) — AI analysis runs for high-risk students only (cost control)
  6. For students crossing from 'medium' → 'high' this week: trigger immediate teacher notification

- [ ] Batching required: 500-student school = 10 batches of 50 — uses Convex action scheduling
- [ ] Logs to `aiUsageLog` per-school: `feature: 'at_risk_computation'`, student count processed
- [ ] Admin can manually trigger: "Run at-risk analysis now" button on the analytics dashboard — useful for mid-week intervention

---

## Epic 7 — AI At-Risk Engine — Claude Integration

> **The AI adds two things the deterministic score cannot: context-awareness and explanation. A score of 72 means different things for a Grade 12 student in exam week vs a Year 2 college student in week 3 of semester. Claude reads the pattern, considers the school context, and returns a narrative that tells the teacher WHY the student is at risk and WHAT has changed.**

---

### ISSUE-338 · AI At-Risk Analysis — Claude API Call

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 2 days

#### Description

The Claude API integration for the at-risk engine. Sends each high-risk student's structured risk profile to Claude Sonnet and receives a narrative explanation, confidence level, and recommended interventions. The AI does not replace the deterministic score — it annotates it.

#### Acceptance Criteria

**`convex/analytics/aiAtRisk.ts` → `generateAiAtRiskAnalysis` action:**

```typescript
const systemPrompt = `You are an experienced school counsellor and data analyst working with a Zambian school management system. You will receive a structured student risk profile and must analyse it to provide actionable guidance to teachers and school administrators.

Your analysis must:
1. Identify the PRIMARY driver of the student's risk — the single most important factor
2. Note any unusual patterns (e.g., sudden decline vs gradual, welfare vs academic)
3. Suggest 2–3 specific, practical intervention actions appropriate for a Zambian school context
4. Consider the school context: term vs semester, week in term, school type
5. Flag if the pattern suggests a WELFARE concern (not just academic) that should involve pastoral care

Be direct. Teachers are busy. Do not be vague. Do not repeat data that is already visible in the dashboard.
Return ONLY valid JSON — no preamble, no markdown.`;

const userPrompt = `
Student Risk Profile:
${JSON.stringify(riskProfile, null, 2)}

School context:
- School type: ${school.type}
- Academic mode: ${school.academicMode}
- Week ${riskProfile.weekInTerm} of ${currentTerm.totalWeeks}-week term
- Current term: ${currentTerm.name}

Return a JSON object with:
{
  "primaryRiskDriver": string,           // One sentence: what is the most important signal
  "patternDescription": string,          // 2–3 sentences: describe the pattern you see
  "confidenceLevel": "high" | "medium" | "low",  // Confidence in the at-risk assessment
  "isWelfareConcern": boolean,           // True if pattern suggests welfare/safeguarding issue beyond academics
  "interventions": [                     // Exactly 2–3 interventions
    {
      "action": string,                  // What to do: "Schedule a one-on-one with [student]"
      "rationale": string,               // Why: "Attendance drop coincides with..."
      "urgency": "immediate" | "this_week" | "this_term",
      "whoShouldAct": "class_teacher" | "head_teacher" | "matron" | "counsellor" | "bursar"
    }
  ],
  "aiRiskScore": number,                 // 0–100: AI's own risk assessment (may differ from deterministic)
  "aiRiskBand": "low" | "medium" | "high",
  "noteToTeacher": string | null         // Optional: anything unusual the teacher should know
}
`;

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  }),
});
```

- [ ] Parse and validate response — all required fields present; `interventions.length` between 2–3
- [ ] On parse failure: store `aiNarrative: null`, `aiRiskScore: deterministicScore` — fall back to deterministic only; no exception surfaced to teacher
- [ ] Successful result: update `studentProgressSnapshots.riskScore` with `aiRiskScore` (overrides the deterministic score), update `riskFlags` with parsed factors
- [ ] Store full `aiNarrative` JSON string on `studentRiskHistory.aiNarrative` — for audit trail
- [ ] Log to `aiUsageLog`: `feature: 'at_risk_analysis'`, `model: 'claude-sonnet-4-20250514'`, input/output tokens
- [ ] Cost control: AI analysis runs ONLY for students with `deterministicRiskBand: 'high'`. Estimated: ~30–50 high-risk students per 500-student school per week = 30–50 Claude API calls per school. Acceptable cost.

---

### ISSUE-339 · At-Risk Dashboard — Teacher View

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 1.5 days

#### Description

The teacher's at-risk dashboard — a focused list of students who need attention, with the AI explanation front and centre. Designed to be actionable in under 5 minutes on a Monday morning.

#### Acceptance Criteria

**`convex/analytics/atRiskDashboard.ts`:**

- [ ] `getAtRiskStudentsForTeacher` query:
  - For class teachers: returns their section's students ranked by risk score
  - For personal tutors (college mode): returns their tutees
  - Filters: `riskBand: 'high'` (default), `riskBand: 'medium'`, all
  - Per student: name, photo, grade/section, riskScore, riskBand, top 3 `riskFlags`, AI narrative summary, trend arrow, last snapshot date

**Frontend — `/(teacher)/at-risk/page.tsx`:**

- [ ] Risk band tabs: "High Risk ([N])" | "Medium Risk ([N])" | "All Students"
- [ ] Student risk card:
  - Photo, name, grade/section
  - Risk score ring: colour-coded (red ≥70, amber 50–69, green <50)
  - **AI Primary Risk Driver**: one sentence in a highlighted box — this is the most important element
  - Risk factor chips: "Attendance ↓ 22%", "3 homework overdue", "Conduct incident"
  - Trend arrow: ↑ (improving) / ↓ (declining) / → (stable) with weekly delta: "Score +12 this week"
  - "View Full Analysis" → ISSUE-340 detail screen
  - "Log Intervention" → ISSUE-341

- [ ] "At-Risk Overview" stat bar at top: "3 High Risk · 8 Medium Risk · 1 Welfare Concern ⚠"
- [ ] Welfare concern flag: students where `isWelfareConcern: true` shown with a distinct amber icon — "This student may need pastoral support beyond academic intervention"
- [ ] Sort options: by risk score, by trend (deteriorating first), by specific indicator
- [ ] Weekly refresh indicator: "Analysis updated last Friday at 20:00"

---

### ISSUE-340 · At-Risk Student Detail View

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 1 day

#### Description

A full-screen deep dive on a single at-risk student. Shows every signal, the AI narrative, the risk score history, and the intervention log — everything a teacher needs for a meaningful 1-on-1 conversation.

#### Acceptance Criteria

**Frontend — `/(teacher)/at-risk/students/[studentId]/page.tsx`:**

- [ ] Student header: photo, name, grade/section, overall risk score badge, academic standing (college) or current exam average (secondary)
- [ ] **AI Analysis panel** (most prominent):
  - "Primary risk driver" statement
  - "Pattern description" paragraph
  - Confidence level badge
  - Welfare concern flag (if applicable)
  - Recommended interventions: each card shows action, rationale, urgency badge, who should act
  - "Copy for pastoral meeting notes" button: copies formatted text for teachers' meeting minutes
- [ ] **Risk Score History chart**: 10-week line chart of `studentRiskHistory.aiScore` (or deterministic fallback)
- [ ] **Indicator breakdown**: radar chart showing all five indicator scores — visual "shape" of the risk
- [ ] **Contributing data** tabs:
  - Attendance: calendar heatmap, recent absences
  - Academic: exam results trend, last 5 homework submissions
  - LMS: course progress bars, quiz pass rates
  - Welfare (if boarding): sick bay timeline, conduct log summary
  - Transport: boarding rate chart (if applicable)
- [ ] **Intervention History**: all logged interventions (ISSUE-341) in reverse chronological order

---

### ISSUE-341 · Admin At-Risk School-Wide View

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 0.5 days

#### Description

The head teacher's school-wide at-risk overview — a heatmap of risk by grade/section, allowing rapid identification of systemic issues (a whole class struggling vs isolated individual cases).

#### Acceptance Criteria

- [ ] `getSchoolWideAtRiskSummary` query: per section — high/medium/low risk student counts, section average risk score
- [ ] `/(admin)/analytics/at-risk/page.tsx`:
  - **Heatmap**: grades as rows, sections as columns — cells coloured by average risk score
  - Click a cell: lists students in that section ordered by risk
  - School summary: "Total High Risk: 12 (2.4%) | Welfare Concerns: 3 | Improving: 8 | Deteriorating: 5"
  - "Export Risk Report" button: PDF of all high-risk students with their AI narratives for pastoral meeting
- [ ] Head teacher receives every Monday morning in-app summary: "Weekly Risk Summary: 12 high-risk students (↑ 3 from last week)"

---

## Epic 8 — At-Risk Intervention Workflow

---

### ISSUE-342 · Intervention Logging

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 1 day

#### Description

When a teacher acts on an at-risk alert, they log the intervention. This creates an accountability trail, prevents duplicate effort, and feeds back into the risk engine (a student who has received a recent intervention should have that context included in the next AI analysis).

#### Acceptance Criteria

**Schema addition:**

```typescript
atRiskInterventions: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  riskHistoryId: v.id('studentRiskHistory'),
  interventionType: v.union(
    v.literal('teacher_meeting'), // 1-on-1 with class teacher
    v.literal('parent_contacted'), // Phone call or meeting with guardian
    v.literal('counsellor_referred'),
    v.literal('head_teacher_meeting'),
    v.literal('academic_support'), // Extra lessons arranged
    v.literal('fee_arrangement'), // Payment plan established
    v.literal('medical_referral'), // Referred to health services
    v.literal('no_action_needed'), // Risk resolved, monitoring only
    v.literal('other'),
  ),
  notes: v.string(),
  outcome: v.optional(v.string()), // What actually happened / student's response
  followUpDate: v.optional(v.string()),
  followUpCompleted: v.boolean(),
  loggedBy: v.id('users'),
  createdAt: v.number(),
})
  .index('by_student', ['studentId'])
  .index('by_school', ['schoolId']);
```

**Backend:**

- [ ] `logIntervention` mutation: creates record; if intervention logged for a high-risk student, recalculates their risk profile with `recentInterventionWeeks: N` context (reduces urgency score slightly — the school knows about the student)
- [ ] `markFollowUpComplete` mutation: updates `followUpCompleted: true`, logs outcome

**Frontend — "Log Intervention" modal** (accessible from both ISSUE-339 card and ISSUE-340 detail):

- [ ] Intervention type selector (large icons — one tap)
- [ ] Notes field: rich text, pre-populated with AI-recommended action text (editable)
- [ ] Follow-up date picker (optional)
- [ ] After logging: student's card gets a "Intervention logged [date]" chip — visual confirmation the student is being managed

---

### ISSUE-343 · At-Risk Notifications to Teachers and Guardians

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 0.5 days

#### Description

Automated notifications triggered by the at-risk engine. Teachers notified of new high-risk students on Monday morning. Guardians notified for welfare concerns (privacy-respecting — no risk score shared, just a gentle "we'd like to speak with you").

#### Acceptance Criteria

- [ ] Monday 06:30 CAT cron: for each teacher — send in-app notification if any of their students entered 'high' risk band this week: "You have [N] students flagged for attention this week. View in At-Risk Dashboard."
- [ ] SMS to guardian (welfare concern cases only, `isWelfareConcern: true`): `"Dear [GuardianName], the pastoral team at [SchoolName] would like to arrange a brief meeting about [StudentName]'s wellbeing. Please contact [HeadTeacherPhone] to arrange a convenient time."`
  - This SMS is deliberately vague — it does not disclose the risk score or specific concerns (safeguarding practice)
  - Requires `requirePermission(ctx, Permission.MANAGE_PASTORAL_CARE)` to send
- [ ] Personal tutors (college mode): receive the same notifications as class teachers for their tutees
- [ ] Head teacher: weekly summary in-app notification every Monday with total counts and trend vs previous week

---

### ISSUE-344 · Intervention Effectiveness Tracking

**Type:** Backend | **Priority:** P2 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 0.5 days

#### Description

Track whether interventions are working. If a student's risk score drops significantly in the 4 weeks following a logged intervention, that's a successful outcome. If it doesn't, the school needs to escalate.

#### Acceptance Criteria

- [ ] `computeInterventionEffectiveness` query:
  - For each `atRiskInterventions` record older than 4 weeks: compare `studentRiskHistory` score at intervention time vs 4 weeks later
  - Returns: `{ improved: N, unchanged: N, deteriorated: N, interventionTypes: { teacher_meeting: { avgScoreDelta: -12, count: N }, ... } }`
- [ ] `/(admin)/analytics/intervention-outcomes/page.tsx`: school's intervention effectiveness report — which types of intervention work best for which risk patterns
- [ ] This data is valuable for professional development: "Scheduling parent contact meetings reduces risk scores by 18 points on average at our school"

---

## Epic 9 — AI-Assisted Grading

> **Feature Gate:** `Feature.AI_INSIGHTS`
> **Model:** `claude-haiku-4-5-20251001` (cost-sensitive — this runs per submission)

---

### ISSUE-345 · AI Grading Feedback for Written Submissions

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 1.5 days

#### Description

When a teacher grades an LMS written assignment, they can request AI-assisted feedback. Claude reads the student's submission against the assignment rubric and returns a structured grade suggestion and specific feedback comments. The teacher always reviews and approves — Claude assists, not decides.

#### User Story

> Mr. Phiri has 35 Chemistry assignments to grade. He opens Chanda's submission, reads it, then clicks "Get AI Feedback." Within 8 seconds: "Suggested grade: 16/20. Strengths: correctly identified all three reagents. Improvements needed: the explanation of the reaction mechanism is incomplete — compare to mark scheme point 3." He agrees, adjusts to 17/20, adds his own note, and saves.

#### Acceptance Criteria

**`convex/lms/aiGrading.ts` → `generateAiGradingFeedback` action:**

```typescript
const systemPrompt = `You are an experienced Zambian secondary school teacher assisting with marking student work. You will receive a student's written assignment response, the assignment question, and the marking rubric. Provide fair, constructive marking assistance.

Be specific. Quote from the student's work. Reference the rubric criteria by name. Your role is to ASSIST the teacher, not replace their judgment.
Return ONLY valid JSON.`;

const userPrompt = `
Assignment: ${assignment.title}
Question/Instructions: ${assignment.textContent (stripped of HTML)}
Marking Rubric: ${JSON.stringify(assignment.rubric)}
Maximum Score: ${assignment.maxScore}

Student's Submission:
${submission.textResponse (stripped of HTML)}

Return JSON:
{
  "suggestedScore": number,
  "suggestedRubricScores": [{ "criterion": string, "suggestedMarks": number, "maxMarks": number, "comment": string }],
  "strengths": string[],          // 1–3 specific strengths quoted from submission
  "improvementAreas": string[],   // 1–3 specific gaps with reference to rubric
  "overallFeedbackDraft": string, // Draft teacher feedback — 2–3 sentences
  "confidence": "high" | "medium" | "low"
}
`;
```

- [ ] Uses `claude-haiku-4-5-20251001` (cheaper, faster — acceptable quality for marking assistance)
- [ ] Result stored in `lmsSubmissions.aiGradingData` as JSON string — the Sprint 05 null field is now populated
- [ ] Teacher's grading form (Sprint 05 ISSUE-233) updated: "Get AI Feedback" button appears when:
  - Assignment has a rubric defined
  - Submission is a written text response
  - `Feature.AI_INSIGHTS` is enabled
- [ ] After AI response: pre-fills the rubric score inputs and feedback text area — all editable
- [ ] AI suggestion badge: "AI-suggested: 16/20" shown next to the teacher's score input — persists until teacher explicitly saves their own score
- [ ] If `confidence: 'low'`: shows a warning: "Low confidence — AI could not fully assess this response. Please grade manually."
- [ ] Log to `aiUsageLog`: `feature: 'ai_grading'`, `model: 'claude-haiku-4-5-20251001'`
- [ ] Teacher sees which submissions have AI feedback: "AI" chip on the submission list

---

### ISSUE-346 · AI Short-Answer Grading for Quizzes

**Type:** Backend | **Priority:** P2 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 1 day

#### Description

Sprint 05 quiz system auto-grades MCQ and true/false questions but leaves short-answer questions as `pendingManualGrade: true`. This issue adds AI-assisted grading for short-answer responses.

#### Acceptance Criteria

- [ ] `gradeShortAnswerWithAI` action:
  - For each `quizAttempts.answers` where `questionType: 'short_answer'` and `isCorrect: null`
  - Sends: question, student's text answer, correct answer, explanation to `claude-haiku-4-5-20251001`
  - Returns: `{ isCorrect: boolean, confidence: 'high' | 'medium' | 'low', marksAwarded: number, justification: string }`
  - High confidence: applies grade automatically
  - Medium/low confidence: flags for teacher manual review — shows AI suggestion but requires explicit teacher approval
- [ ] "Grade short answers with AI" button in teacher quiz analytics view (Sprint 05 ISSUE-230)
- [ ] Teacher review queue: all medium/low confidence AI grades shown as a list for human review

---

### ISSUE-347 · AI Grading Analytics

**Type:** Frontend | **Priority:** P2 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 0.5 days

#### Description

Track how teachers are using AI grading assistance — adoption rates, time saved, and agreement rates between AI suggestions and teacher final grades.

#### Acceptance Criteria

- [ ] `getAiGradingAnalytics` query: per teacher — assignments graded with AI assistance, % of AI suggestions accepted without change, average score delta (AI suggested vs teacher final)
- [ ] School-level report: total AI grading calls, estimated time saved, most common adjustments teachers make to AI suggestions
- [ ] `/(admin)/analytics/ai-usage/page.tsx`: AI usage report across all features — quiz generation, at-risk analysis, grading assistance — with token counts and estimated cost from `aiUsageLog`

---

## Epic 10 — AI Tutoring Assistant

> **Feature Gate:** `Feature.AI_INSIGHTS`
> **Model:** `claude-haiku-4-5-20251001` (cost-sensitive — student-facing, potentially high volume)

---

### ISSUE-348 · AI Tutor in LMS Course Threads

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 1.5 days

#### Description

The AI tutor joins an existing LMS discussion thread (Sprint 05 ISSUE-244) when a student asks a question that goes unanswered for 4 hours, or when the student explicitly invites the AI. The AI answers in the context of the lesson content — it does NOT just give the answer but guides the student towards understanding.

#### User Story

> Chanda posts a question in her Chemistry discussion thread at 19:00: "I don't understand how to balance this equation." By 23:00, Mr. Phiri hasn't replied. The AI tutor joins: "Let's work through this together. First, count the atoms on each side. What do you get for Carbon on the left?" Chanda replies. The AI guides her through the process in 3 exchanges. When Mr. Phiri logs in next morning, he sees the conversation and Chanda's understanding.

#### Acceptance Criteria

**`convex/lms/aiTutor.ts` → `generateAiTutorResponse` action:**

```typescript
// Joins an existing messageThreads record with context: 'lms'
// The AI posts as a special system user: 'ai_tutor' userId (created at school setup)

const systemPrompt = `You are an AI tutoring assistant embedded in Acadowl, a Zambian school management platform. You are helping a student with their coursework.

Your tutoring philosophy:
- Guide students to answers — do NOT give answers directly
- Ask questions that prompt thinking
- Use the Socratic method for problem-solving
- Reference the lesson content they were studying
- Keep responses SHORT (2–4 sentences max) — students are on phones
- Use encouraging language appropriate for a Zambian school context
- If the question involves an exam past paper, acknowledge this is good practice
- Never complete assignments FOR the student

Current lesson context: ${lesson.title} — ${stripHtml(lesson.textContent).substring(0, 500)}
Subject: ${subject.name} — Grade: ${grade.name}
School curriculum: Zambian ECZ / [College programme]`;
```

- [ ] AI tutor activation: triggered after `tutorResponseDelayHours` (configurable, default 4) of no teacher reply — OR by student typing `@ai` anywhere in the thread
- [ ] AI posts as `ai_tutor` participant in the thread: `{ role: 'ai_tutor', avatarIcon: '🤖', displayName: 'Acadowl Tutor' }`
- [ ] Conversation history: each AI response includes the previous 5 messages as context (sliding window)
- [ ] Teacher override: teacher can add `@stop_ai` to the thread to prevent further AI responses — taking over the tutoring themselves
- [ ] Rate limit: maximum 5 AI responses per student per thread per day (prevents dependency)
- [ ] Log to `aiUsageLog`: `feature: 'ai_tutoring'`

**Frontend:**

- [ ] AI tutor messages visually distinct: subtle blue background, "Acadowl Tutor 🤖" attribution
- [ ] "AI is available if your teacher hasn't replied in 4 hours" note on the discussion thread compose area
- [ ] Teacher can see in their course analytics: "AI Tutor sent 12 responses this week — 8 were follow-ups from unresolved questions"

---

### ISSUE-349 · Student-Initiated AI Study Session

**Type:** Frontend + Backend | **Priority:** P2 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 1 day

#### Description

Students can start a private AI study session for any of their enrolled courses — asking questions about past lessons, requesting practice problems, or getting help with homework. Private (not visible to teacher).

#### Acceptance Criteria

- [ ] "Study with AI" button on each LMS course page (shown only if `Feature.AI_INSIGHTS` enabled)
- [ ] Opens a private chat interface (`/(student)/lms/courses/[courseId]/ai-study/page.tsx`)
- [ ] Context: the AI is given the course's published lesson content as background — it answers within the curriculum
- [ ] Session length: maximum 20 exchanges per session (cost control)
- [ ] "Generate practice questions for me" shortcut: AI generates 5 practice MCQs on demand (similar to quiz generator but informal)
- [ ] Sessions NOT visible to teachers (privacy) — but admin can see aggregate usage stats: "[School] students had 142 AI study sessions this week"
- [ ] `aiStudySessions` table: logs session metadata (schoolId, studentId, courseId, exchangeCount, topics mentioned) — no conversation content stored for privacy

---

### ISSUE-350 · AI Usage Governance and Cost Controls

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.AI_INSIGHTS` | **Estimate:** 0.5 days

#### Description

The `aiUsageLog` table (Sprint 05) is now populated by four distinct AI features. This issue builds the governance layer — per-school usage limits, cost visibility for Anthropic billing, and emergency kill switches.

#### Acceptance Criteria

**`convex/admin/aiGovernance.ts`:**

- [ ] `getAiUsageSummary` query: per school per week — token totals, cost estimate (Anthropic API pricing), feature breakdown
- [ ] Monthly budget cap per school: `school.aiMonthlyTokenBudget` — when 80% consumed, admin receives alert; when 100% reached, all `Feature.AI_INSIGHTS` actions return a graceful "AI quota exhausted — resets on [date]" error
- [ ] Platform admin view (at `platform.Acadowl.zm`): aggregate AI usage across all schools — most expensive features, most active schools
- [ ] Emergency kill switch: `platform.disableAllAiFeatures: boolean` — set in Convex dashboard env var, checked before every Claude API call. One-line change to halt all AI spending platform-wide.
- [ ] `/(admin)/settings/ai/page.tsx`:
  - Monthly usage summary: tokens used / budget remaining
  - Feature-level breakdown: at-risk analysis vs grading vs tutoring costs
  - "AI Features" master toggle (disables all AI features for this school without platform admin involvement)

---

## Epic 11 — MoE Statistical Returns

> **Goal:** Generate every Ministry of Education statistical return required from Zambian schools, pre-populated from Acadowl data. What used to take a week of manual counting takes one click.

---

### ISSUE-351 · MoE Annual School Return — Enrolment and Staffing

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** none (core feature) | **Estimate:** 1.5 days

#### Description

The primary MoE annual return — enrolment by grade, gender, and school type; staffing qualifications; and infrastructure details. All data already exists in Acadowl — this aggregates it into the official format.

#### Acceptance Criteria

**`convex/reports/moe.ts` — implementing the Sprint 01 ISSUE-090 scaffold:**

- [ ] `getMoeEnrolmentReturn` query:
  - Total enrolment by grade and gender (from `students` table)
  - New enrolments this year vs transfers in vs transfers out
  - Students with disabilities (from `students.specialNeeds` field — added as schema addition)
  - Orphaned/vulnerable children count (from `students.orphanStatus` — schema addition)
  - Repeaters: students in same grade as previous year
- [ ] `getMoeStaffingReturn` query:
  - Teacher count by gender, qualification level, subject specialisation
  - Pupil-to-teacher ratio per grade
  - Support staff count (from `staff` records by role)
  - Staff attendance rate this year (from `staffAttendance` — Sprint 01 ISSUE-073)

**Frontend — `/(admin)/reports/moe/page.tsx`:**

- [ ] MoE return form: pre-populated with data from queries; editable override fields for any items that need manual input
- [ ] Data validation: fields that would fail MoE validation highlighted in red (e.g., pupil:teacher ratio > 40:1 flagged)
- [ ] "Generate PDF Return" button: formatted exactly to MoE template
- [ ] "Export as CSV": machine-readable format for MoE's data portal
- [ ] Submission history: record of each year's return with date submitted and submitted-by user

---

### ISSUE-352 · MoE Attendance Return

**Type:** Backend | **Priority:** P0 | **Feature Gate:** none | **Estimate:** 0.5 days

#### Description

Implementing the `getMoEAttendanceReturn` query scaffolded in Sprint 01 ISSUE-090. Annual attendance statistics aggregated from the full year's `attendance` table.

#### Acceptance Criteria

- [ ] `getMoeAttendanceReturn` query (full implementation of Sprint 01 scaffold):
  - Average daily attendance by grade and gender
  - Students below 80% annual attendance
  - Total school days in the academic year
  - Absenteeism rate by term, by month
  - Chronic absenteeism rate (< 80% attendance) per grade
- [ ] Integrated into MoE return form (ISSUE-351) as an "Attendance" section

---

### ISSUE-353 · MoE Examination Results Return

**Type:** Backend | **Priority:** P0 | **Feature Gate:** none | **Estimate:** 0.5 days

#### Description

Annual examination performance statistics for MoE — number of students sitting ECZ exams, pass rates, subject performance. Uses `examResults` and `termAggregates` data.

#### Acceptance Criteria

- [ ] `getMoeExamResultsReturn` query:
  - Grade 9 and Grade 12 ECZ mock exam statistics (from `eczMockTargets` — Sprint 01 ISSUE-080)
  - Pass rates by subject using `subjects.eczSubjectCode`
  - Distinction rates (grade 1–3 in ECZ scale)
  - Average points score by grade
  - Year-over-year performance trend (requires previous year data)
- [ ] For college schools (`Feature.GPA`): graduation rates, average CGPA by programme (from `courseRegistrations` and `termAggregates`)

---

### ISSUE-354 · MoE Infrastructure and Facilities Return

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** none | **Estimate:** 1 day

#### Description

Physical infrastructure reporting — classrooms, toilets, water, electricity, library, boarding facilities. Much of this is manually entered (Acadowl doesn't track physical infrastructure) but boarding and transport data is auto-populated.

#### Acceptance Criteria

**Schema addition to `schools`:**

```typescript
infrastructureDetails: v.optional(
  v.object({
    classrooms: v.number(),
    laboratories: v.number(),
    hasLibrary: v.boolean(),
    hasElectricity: v.boolean(),
    hasPipedWater: v.boolean(),
    hasInternet: v.boolean(),
    toiletsForBoys: v.number(),
    toiletsForGirls: v.number(),
    hasSpecialNeedsAccess: v.boolean(),
    lastUpdated: v.string(),
  }),
);
```

- [ ] `getMoeInfrastructureReturn` query:
  - Manual fields from `schools.infrastructureDetails`
  - Auto-populated: library book count (from `libraryBooks`), boarding capacity (from `hostelBlocks.capacity`), transport routes (from `routes.totalStudents`)
- [ ] `/(admin)/settings/infrastructure/page.tsx`: infrastructure details form — filled once per year

---

### ISSUE-355 · MoE Transport and Boarding Return

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` or `Feature.BOARDING` | **Estimate:** 0.5 days

#### Description

Transport and boarding statistics for MoE — boarding capacity, occupancy, transport routes and student counts. Auto-populated from Sprint 04 and 06 data.

#### Acceptance Criteria

- [ ] `getMoeTransportReturn` query (implementing Sprint 06 ISSUE-309 scaffold):
  - Total transport students, routes, vehicles
  - Route stop GPS coordinates export
  - Average on-time performance per route (from `routeRunLog`)
  - Total transport incidents by type (from `transportIncidents`)
- [ ] `getMoeBoardingReturn` query (implementing Sprint 04 ISSUE-213 scaffold):
  - Boarding capacity vs actual occupancy (from `bedOccupancySnapshots`)
  - Boarding students by gender
  - Night prep attendance average (from `attendance` where `period: 'night_prep'`)
  - All from `bedAssignments` history table — not just current snapshots

---

## Epic 12 — Platform Analytics & School Health Dashboard

> **Audience:** Platform Super Admin at `platform.Acadowl.zm`

---

### ISSUE-356 · Platform-Level School Health Dashboard

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** platform admin only | **Estimate:** 1.5 days

#### Description

The platform admin's operational overview — all schools on the platform with health scores, usage metrics, and billing status. The tool that tells Anthropic/Acadowl which schools are thriving and which need support.

#### Acceptance Criteria

**`convex/platform/health.ts`:**

- [ ] `getSchoolHealthScores` query (platform admin only):
  - Per school: a composite health score (0–100) combining:
    - **Data completeness** (30%): are snapshots being written? Is student data complete?
    - **Feature adoption** (25%): how many features are enabled and actively used?
    - **User activity** (25%): daily/weekly active users by role
    - **Data quality** (20%): error rates, orphaned records, schema inconsistencies

**`/(platform)/schools/page.tsx`:**

- [ ] School health leaderboard: sorted by health score
- [ ] Health score breakdown per school: click to see component scores
- [ ] Feature adoption matrix: which school has which features enabled — grid view
- [ ] At-risk schools (health score < 60): highlighted — assigned to support team
- [ ] MRR / subscription tier summary (for billing team)

---

### ISSUE-357 · Platform Usage Analytics

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** platform admin only | **Estimate:** 1 day

#### Description

Usage telemetry across the platform — which features are actually being used, where users drop off, and which school types extract the most value.

#### Acceptance Criteria

**Schema addition:**

```typescript
platformUsageEvents: defineTable({
  schoolId: v.id('schools'),
  userId: v.id('users'),
  role: v.string(),
  eventType: v.string(), // 'page_view', 'mutation_called', 'feature_used'
  feature: v.optional(v.string()), // 'lms', 'boarding', 'transport', 'at_risk'
  metadata: v.optional(v.string()), // JSON — route, mutation name
  timestamp: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_timestamp', ['timestamp']);
```

- [ ] Lightweight event tracking: key user actions logged — login, report card generated, payment processed, at-risk analysis run
- [ ] Privacy: no personal data in events — role + feature + school is sufficient
- [ ] `/(platform)/analytics/page.tsx`:
  - DAU/WAU/MAU per school and platform-wide
  - Feature usage funnel: how many schools enable LMS → how many create courses → how many publish lessons
  - SMS volume and cost tracking (direct API cost visibility)

---

### ISSUE-358 · Multi-School Benchmarking

**Type:** Backend + Frontend | **Priority:** P2 | **Feature Gate:** platform admin only | **Estimate:** 1 day

#### Description

Anonymised benchmarking — a school can see how their metrics compare to similar schools on the platform. Aggregate, anonymised, opt-in.

#### Acceptance Criteria

- [ ] `getBenchmarkData` query: for a school, returns anonymised percentile rankings:
  - Attendance rate: "Your school is in the 73rd percentile for attendance among secondary schools"
  - Fee collection rate, LMS engagement score average, at-risk student percentage
- [ ] `/(admin)/analytics/benchmarks/page.tsx`: benchmark report (visible to admin, not platform admin only)
- [ ] Opt-out: `school.allowBenchmarkParticipation: boolean` — default true; schools that opt out excluded from others' benchmarks

---

### ISSUE-359 · Platform Announcement and Release Notes System

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** platform admin only | **Estimate:** 0.5 days

#### Description

Platform-level announcements from Acadowl to all school admins — new feature releases, maintenance windows, policy updates.

#### Acceptance Criteria

**Schema addition:**

```typescript
platformAnnouncements: defineTable({
  title: v.string(),
  body: v.string(),
  category: v.union(
    v.literal('release'),
    v.literal('maintenance'),
    v.literal('policy'),
    v.literal('urgent'),
  ),
  targetSchoolTypes: v.optional(v.array(v.string())), // null = all schools
  publishedAt: v.number(),
  expiresAt: v.optional(v.number()),
  authorId: v.id('users'),
  createdAt: v.number(),
}).index('by_published', ['publishedAt']);
```

- [ ] Platform admin creates announcements at `platform.Acadowl.zm/announcements`
- [ ] Shown as a dismissible banner on every school admin's dashboard
- [ ] "What's New" section on admin home: last 3 platform announcements with category badges
- [ ] Urgent announcements: non-dismissible until admin explicitly acknowledges

---

## Epic 13 — Compliance Dashboard

---

### ISSUE-360 · Compliance Dashboard — Vehicle and Driver

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 1 day

#### Description

A consolidated compliance view of all vehicle and driver documentation — insurance, road tax, driver licences, service records. Surfaces expiring documents before they lapse.

#### Acceptance Criteria

**`convex/compliance/transport.ts`:**

- [ ] `getTransportComplianceStatus` query:
  - All vehicles: `{ registration, insuranceExpiry, roadTaxExpiry, nextServiceDate, daysUntilExpiry: min(all three) }`
  - All drivers: `{ name, licenceNumber, licenceExpiry, licenceClass }`
  - Compliance status: `'compliant'` (all > 30 days), `'expiring_soon'` (any within 30 days), `'expired'` (any past)

**`/(admin)/compliance/transport/page.tsx`:**

- [ ] Traffic-light status per vehicle and driver
- [ ] "Expiring Soon" section at top: documents due within 30 days with exact dates
- [ ] "Expired" section: red alert list — vehicles should not be running with expired documents
- [ ] "Renew" shortcut: opens `vehicleMaintenanceLogs` entry form pre-filled with the renewal type
- [ ] Email/SMS reminder scheduling: admin can schedule a reminder to themselves N days before an expiry

---

### ISSUE-361 · Compliance Dashboard — Academic and Administrative

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** none | **Estimate:** 1 day

#### Description

Academic compliance — are all required reports submitted? Are mark entry deadlines met? Are MoE returns up to date? — consolidated in one view for the head teacher.

#### Acceptance Criteria

- [ ] `getAcademicComplianceStatus` query:
  - Open exam sessions past their lock deadline
  - Report cards not yet released for a closed term
  - Sections with attendance not taken today (from Sprint 01 `getUnsubmittedRegisters`)
  - MoE returns overdue (based on academic year close date)
  - HEA compliance items (if `Feature.HEA_COMPLIANCE`): accreditation expiry, bursary conditions unreviewed
- [ ] `/(admin)/compliance/academic/page.tsx`: compliance checklist — green ticks and red flags
- [ ] Head teacher daily email digest (optional): "Today's compliance status — 2 open items require attention"

---

### ISSUE-362 · Staff Qualification and CPD Tracking

**Type:** Backend + Frontend | **Priority:** P2 | **Feature Gate:** none | **Estimate:** 0.5 days

#### Description

Track staff qualifications and continuing professional development — required for MoE staffing returns and HEA accreditation.

#### Acceptance Criteria

**Schema addition to `staff`:**

```typescript
qualifications: v.optional(v.array(v.object({
  degree: v.string(),              // 'Bachelor of Education'
  institution: v.string(),         // 'UNZA'
  yearAwarded: v.number(),
  isTeachingQualification: v.boolean(),
}))),
teachingRegistrationNumber: v.optional(v.string()),  // Teaching Council of Zambia
teachingRegistrationExpiry: v.optional(v.string()),
cpdHoursThisYear: v.optional(v.number()),
```

- [ ] Staff profile page: qualifications section with add/edit
- [ ] Teaching registration expiry warnings: same traffic-light approach as vehicle compliance
- [ ] CPD log: `staffCpdLog` table — training events, workshops, conferences attended
- [ ] MoE staffing return (ISSUE-351): qualification data auto-populated from these records

---

### ISSUE-363 · School Registration and Legal Documents

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** none | **Estimate:** 0.5 days

#### Description

Track school registration documents — MoE registration certificate, ZRA TPIN, insurance certificates. Centralises the school's legal document library with expiry tracking.

#### Acceptance Criteria

**Schema addition to `schools`:**

```typescript
legalDocuments: v.optional(
  v.array(
    v.object({
      documentType: v.union(
        v.literal('moe_registration'),
        v.literal('zra_tpin'),
        v.literal('school_insurance'),
        v.literal('fire_safety_certificate'),
        v.literal('health_safety_certificate'),
        v.literal('hea_accreditation'),
        v.literal('other'),
      ),
      documentNumber: v.optional(v.string()),
      issueDate: v.optional(v.string()),
      expiryDate: v.optional(v.string()),
      fileUrl: v.optional(v.string()), // Cloudinary — scanned certificate
      notes: v.optional(v.string()),
    }),
  ),
);
```

- [ ] `/(admin)/compliance/documents/page.tsx`: document library with upload, expiry tracking
- [ ] Platform admin can view document compliance status across all schools (ensures schools are legally operating)

---

## Epic 14 — Full-Year Financial Analytics

---

### ISSUE-364 · Full-Year Revenue and Collection Report

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** none | **Estimate:** 1.5 days

#### Description

The head teacher and board-level financial summary — total revenue, collection rate, fee arrears, revenue by stream (tuition vs boarding vs transport vs other). Covers the full academic year.

#### Acceptance Criteria

**`convex/reports/financial.ts`:**

- [ ] `getFullYearFinancialReport` query:
  - Total invoiced: sum of all `invoices.totalAmountZMW` for the academic year
  - Total collected: sum of all `payments.amountZMW` for the year
  - Collection rate: collected / invoiced × 100
  - Outstanding arrears: total unpaid balance
  - Revenue by stream: tuition, boarding, transport, other (from `invoices.lineItems[].feeType`)
  - Revenue by term: per-term collection rate and arrears
  - Payment method breakdown: mobile money vs cash vs bank
  - Scholarship/bursary total: total credits applied
  - Credit notes issued: total and by type

**`/(admin)/reports/financial/year-end/page.tsx`:**

- [ ] Executive summary: key metrics with YoY comparison (if previous year data exists)
- [ ] Revenue stream chart: recharts `PieChart` — tuition vs boarding vs transport vs other
- [ ] Monthly collection timeline: recharts `BarChart` — collected vs invoiced by month
- [ ] Top 10 outstanding accounts: students with highest arrears (for bursar follow-up)
- [ ] "Generate Board Report" PDF: formal A4 financial report with school letterhead

---

### ISSUE-365 · Fee Audit Report

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** none | **Estimate:** 0.5 days

#### Description

A complete audit trail of every financial mutation in the system — using the `feeAuditLog` table that has been recording every change since Sprint 02.

#### Acceptance Criteria

- [ ] `getFeeAuditReport` query: all `feeAuditLog` records for a date range, filterable by type (invoice created, payment recorded, credit note issued, scholarship applied)
- [ ] `/(admin)/fees/audit/page.tsx`: audit log with full-text search, date filter, user filter
- [ ] "Anomaly detection": flags unusual patterns — multiple payments on same invoice within 1 hour, credit notes > 50% of invoice value, manual payment entries by non-bursar roles
- [ ] Export: full audit log CSV for external auditors

---

### ISSUE-366 · Mobile Money Reconciliation Report

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** none | **Estimate:** 0.5 days

#### Description

Match mobile money bank statement entries against Acadowl payment records. A key monthly task for the bursar — resolving discrepancies between what Airtel/MTN deposited and what is recorded in the system.

#### Acceptance Criteria

- [ ] `getMobileMoneyReconciliationReport` query:
  - All mobile money payments recorded in Acadowl for the period
  - By provider: Airtel Money vs MTN MoMo
  - By context: fees vs pocket money vs transport
  - Unmatched payments: entries in `bankStatementImports` (Sprint 02 ISSUE-112) with no matching Acadowl record
  - Unmatched Acadowl records: payments in system with no corresponding bank statement entry
- [ ] `/(admin)/fees/reconciliation/page.tsx`: reconciliation report with matched/unmatched indicators
- [ ] "Import Bank Statement" button: CSV upload of raw bank statement — auto-matches against `payments` table

---

### ISSUE-367 · Multi-Year Trend Analytics

**Type:** Frontend + Backend | **Priority:** P2 | **Feature Gate:** none | **Estimate:** 1 day

#### Description

For schools that have been on Acadowl for multiple years — long-term trend analysis of enrolment, academic performance, fee collection, and at-risk rates.

#### Acceptance Criteria

- [ ] `getMultiYearTrendData` query: for schools with > 1 academic year of data — year-over-year comparisons for key metrics
- [ ] `/(admin)/analytics/trends/page.tsx`:
  - Enrolment trend: total students by year
  - Academic performance trend: average exam scores by grade by year
  - Fee collection trend: collection rate by year
  - At-risk trend (if `Feature.AI_INSIGHTS`): average risk score by year — is the school improving student welfare?
- [ ] "School improvement story": auto-generated summary using available trend data — "Over 3 years, Kabulonga Boys has improved fee collection from 78% to 94% and attendance from 81% to 89%."

---

## Schema Additions in This Sprint

**New tables:**

| New Table                 | Defined In                                               |
| ------------------------- | -------------------------------------------------------- |
| `collegeProgrammes`       | ISSUE-329                                                |
| `collegeCourseOfferings`  | ISSUE-318                                                |
| `courseRegistrations`     | ISSUE-318                                                |
| `studentRiskHistory`      | ISSUE-336                                                |
| `atRiskInterventions`     | ISSUE-342                                                |
| `transcriptVerifications` | ISSUE-327                                                |
| `tutorMeetings`           | ISSUE-333                                                |
| `vehicleMaintenanceLogs`  | (Sprint 06 ISSUE-296 — included here for MoE compliance) |
| `graduationClearance`     | ISSUE-332                                                |
| `platformAnnouncements`   | ISSUE-359                                                |
| `platformUsageEvents`     | ISSUE-357                                                |
| `aiStudySessions`         | ISSUE-349                                                |

**Fields added to existing tables:**

| Table                      | New Fields                                                                                                                                                                               | Issue               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `students`                 | `academicStanding`, `cumulativeGpa`, `totalCreditsEarned`, `totalCreditsAttempted`, `personalTutorStaffId`, `programmeId`, `transportSubscriptionStatus`, `specialNeeds`, `orphanStatus` | ISSUE-316, 329, 333 |
| `subjects`                 | `creditUnits`, `isCoreCurriculum`, `creditCategory`                                                                                                                                      | ISSUE-322           |
| `schools`                  | `academicStandingRules`, `gpaGradingConfig`, `infrastructureDetails`, `legalDocuments`, `addDropWindowEnd`, `withdrawalDeadline`, `aiMonthlyTokenBudget`, `allowBenchmarkParticipation`  | Multiple            |
| `academicYears`            | `semesterBreakStart`, `semesterBreakEnd`, `graduationDate`, `enrollmentOpenDate`, `courseRegistrationOpenDate`, `courseRegistrationCloseDate`                                            | ISSUE-315           |
| `scholarships`             | `bursaryType`, `sponsorName`, `coverageType`, `coveragePercent`, `minimumGpa`, `renewalStatus`, `disbursements`                                                                          | ISSUE-331           |
| `staff`                    | `qualifications`, `teachingRegistrationNumber`, `teachingRegistrationExpiry`, `cpdHoursThisYear`                                                                                         | ISSUE-362           |
| `studentProgressSnapshots` | `riskScore` (written by AI — was null), `riskFlags` (written by AI — was null)                                                                                                           | ISSUE-338           |
| `lmsSubmissions`           | `aiGradingData` (written by AI — was null)                                                                                                                                               | ISSUE-345           |

---

## Dependency Graph

```
Epic 1 (Semester Calendar) ── must complete before Epic 2
    └─► ISSUE-316 (Academic Standing Rules)
    └─► ISSUE-317 (Year-End Rollover)

Epic 2 (Course Registration) ── depends on Epic 1
    └─► ISSUE-318 (Registration Schema)
    └─► ISSUE-319 (Student Registration Portal)
    └─► ISSUE-320 (Admin Course Management)
    └─► ISSUE-321 (Add/Drop Period)

Epic 3 (GPA Engine) ── depends on Sprint 01 examResults + Epic 2
    └─► ISSUE-322 (Credit Units)
    └─► ISSUE-323 (Exam Weighting)
    └─► ISSUE-324 (Cumulative GPA)
    └─► ISSUE-325 (Grade Scale)
    └─► ISSUE-326 (Transcript)
            └─► ISSUE-327 (Verification Endpoint)
            └─► ISSUE-328 (Student Academic Record)

Epic 5 (HEA Compliance) ── depends on Epics 3 and 4
    └─► ISSUE-330 (HEA Return)
    └─► ISSUE-331 (Bursary Management)
    └─► ISSUE-332 (Graduation Clearance)
    └─► ISSUE-333 (Personal Tutor)

ISSUE-334 (Snapshot Audit) ── must run FIRST before any AI work
    └─► ISSUE-335 (Risk Profile Builder)
            └─► ISSUE-336 (Risk History)
            └─► ISSUE-337 (At-Risk Cron)
                    └─► ISSUE-338 (Claude At-Risk API)
                            └─► ISSUE-339 (Teacher Dashboard)
                            └─► ISSUE-340 (Student Detail)
                            └─► ISSUE-341 (School-Wide View)

ISSUE-342 (Intervention Logging) ── depends on ISSUE-339
ISSUE-343 (At-Risk Notifications) ── depends on ISSUE-338
ISSUE-344 (Effectiveness Tracking) ── depends on ISSUE-342

ISSUE-345 (AI Grading) ── parallel with at-risk, depends on Sprint 05 lmsSubmissions
ISSUE-346 (Short Answer Grading) ── depends on ISSUE-345
ISSUE-347 (Grading Analytics)

ISSUE-348 (AI Tutor in Threads) ── parallel, depends on Sprint 05 messageThreads
ISSUE-349 (Student AI Study Session) ── depends on ISSUE-348
ISSUE-350 (AI Governance) ── must be done BEFORE any AI goes to production

Epic 11 (MoE Returns) ── depends on all previous sprints' data being present
Epic 12 (Platform Analytics) ── can run in parallel
Epic 13 (Compliance) ── can run in parallel
Epic 14 (Financial Analytics) ── can run in parallel
```

---

## Definition of Done

All Sprint 00–06 DoD criteria apply, plus:

- [ ] **GPA computation verified end-to-end**: For the Evelyn Hone College seed school — create a Year 2 student, register them in 5 courses (15 credits), enter grades for midterm and final, run `computeCumulativeGpa`. Verify the CGPA matches manual calculation: `Σ(gradePoints × credits) / Σ(credits)`. Tolerance: ±0.01.

- [ ] **Course registration prerequisites enforced**: Student attempts to register for a course that requires "Introduction to Accounting" which they have not completed. `registerForCourse` returns `PREREQUISITE_NOT_MET` error. Student who HAS passed "Introduction to Accounting" registers successfully. Tested in integration test.

- [ ] **At-risk deterministic score verified**: Run `computeDeterministicRiskScore` on a student with: attendance 65%, lmsEngagementScore 30, conductIncidents 2 (moderate), sickBayVisits 4, transportBoardingRate null (no transport). Verify score matches expected: `(0.35 × 35) + (0.25/0.9 × 30 × 1.0) + (0.15/0.9 × 45) + (0.15/0.9 × 25) + 0 = ~` expected value (unit test with known inputs). Null transport weight redistributed correctly.

- [ ] **AI at-risk analysis runs for high-risk students only**: Friday cron completes. Verify `aiUsageLog` contains entries ONLY for students with `deterministicRiskBand: 'high'`. Medium-risk students have no `aiUsageLog` entry. Verified by counting records.

- [ ] **AI resilience tested**: Claude API call for at-risk analysis fails with 500 error. System falls back to deterministic score: `riskScore = deterministicScore`, `aiNarrative = null`. No exception surfaced to teacher dashboard. Teacher sees score but no AI narrative section.

- [ ] **Token budget enforcement tested**: Set `school.aiMonthlyTokenBudget` to 100 tokens. Call `generateAiAtRiskAnalysis` until budget is exhausted. Verify next call returns `AI_QUOTA_EXHAUSTED` error with `{ resetsOn: date }`. No Claude API call made after quota hit.

- [ ] **Transcript verification endpoint tested**: Generate a transcript, get its `verificationCode`. Call `GET /verify-transcript/{code}` unauthenticated. Returns student name and CGPA — no internal IDs or private data. Call with an invalid code: returns `{ valid: false }` with 200 status (not 404 — prevents enumeration).

- [ ] **Progress snapshot completeness > 90%**: `auditProgressSnapshotCompleteness` query returns > 90% for all enabled fields on the Evelyn Hone seed school after 4 weeks of simulated data. Fields gated behind disabled features correctly return null (not 0).

- [ ] **MoE return generates without error**: `getMoeEnrolmentReturn` query runs against all three seed schools without exception. Each returns a non-empty dataset. The college school's return includes programme-level data. The day school's return excludes boarding data.

- [ ] **AI tutor rate limit enforced**: Student sends 6 messages to AI tutor in one thread in one day. Sixth message returns "Daily limit reached — your teacher will respond soon." No Claude API call made. Verified via `aiUsageLog` entry count.

- [ ] **`riskScore` and `riskFlags` now non-null**: After the Friday cron runs on the seed school, every `studentProgressSnapshot` for active students has `riskScore` populated. The `null` placeholder values from Sprint 03 are now gone for active schools. Explicitly asserted in seed data verification.

---

_Acadowl Development Guide — Sprint 07 — College Mode + AI At-Risk Engine_
_Last updated: 2025 | Previous: Sprint 06 — Transport Module_
_This is the final sprint guide in the Acadowl development series._

---

## Project Complete — All 7 Sprints Documented

| Sprint    | Title                            | Issues         | Epics        |
| --------- | -------------------------------- | -------------- | ------------ |
| 00        | Infrastructure & Auth            | 38             | 9            |
| 01        | Core Academic Foundation         | 44             | 12           |
| 02        | Fees & Finance                   | 42             | 10           |
| 03        | Guardian Portal & Communications | 40             | 10           |
| 04        | Boarding Module                  | 46             | 13           |
| 05        | LMS & Library                    | 44             | 13           |
| 06        | Transport Module                 | 43             | 13           |
| 07        | College Mode + AI At-Risk Engine | 48             | 14           |
| **Total** |                                  | **345 issues** | **94 epics** |

