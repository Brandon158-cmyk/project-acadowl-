# Acadowl — Sprint 01: Core Academic Foundation

## Development Guide & Issue Tracker

> **Sprint Goal:** Build the complete academic operating core of Acadowl. By the end of this sprint, a school can enrol students into class sections, teachers can take attendance offline and have SMS alerts fire automatically, marks can be entered and locked, and report cards can be generated as branded PDFs. Every data structure built here is the backbone that Fees (Sprint 02), Guardian Portal (Sprint 03), Boarding (Sprint 04), LMS (Sprint 05), and Transport (Sprint 06) will connect into without modification.

---

## 📋 Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [Continuity from Sprint 00](#continuity-from-sprint-00)
3. [Forward-Compatibility Commitments](#forward-compatibility-commitments)
4. [Epic 1 — Academic Year & Term Management](#epic-1--academic-year--term-management)
5. [Epic 2 — Subject & Curriculum Management](#epic-2--subject--curriculum-management)
6. [Epic 3 — Student Enrolment & Profile Management](#epic-3--student-enrolment--profile-management)
7. [Epic 4 — Class Sections & Student Placement](#epic-4--class-sections--student-placement)
8. [Epic 5 — Staff & Subject Assignment](#epic-5--staff--subject-assignment)
9. [Epic 6 — Timetable Builder](#epic-6--timetable-builder)
10. [Epic 7 — Attendance System (Offline-First)](#epic-7--attendance-system-offline-first)
11. [Epic 8 — SMS & Notification Integration](#epic-8--sms--notification-integration)
12. [Epic 9 — Exams & Mark Entry](#epic-9--exams--mark-entry)
13. [Epic 10 — Grading Engine](#epic-10--grading-engine)
14. [Epic 11 — Report Card Generation](#epic-11--report-card-generation)
15. [Epic 12 — Student & Academic Analytics](#epic-12--student--academic-analytics)
16. [Dependency Graph](#dependency-graph)
17. [Schema Additions in This Sprint](#schema-additions-in-this-sprint)
18. [Definition of Done](#definition-of-done)
19. [Sprint 01 → Sprint 02 Handoff Checklist](#sprint-01--sprint-02-handoff-checklist)

---

## Sprint Overview

| Field            | Value                                            |
| ---------------- | ------------------------------------------------ |
| **Sprint Name**  | Sprint 01 — Core Academic Foundation             |
| **Duration**     | 5 weeks                                          |
| **Team Size**    | 3–4 developers                                   |
| **Total Issues** | 44                                               |
| **Prerequisite** | Sprint 00 complete and all handoff checks passed |

### Sprint Epics at a Glance

| #   | Epic                                   | Issues | Est. Days |
| --- | -------------------------------------- | ------ | --------- |
| 1   | Academic Year & Term Management        | 3      | 2         |
| 2   | Subject & Curriculum Management        | 4      | 3         |
| 3   | Student Enrolment & Profile Management | 6      | 6         |
| 4   | Class Sections & Student Placement     | 4      | 3         |
| 5   | Staff & Subject Assignment             | 3      | 2         |
| 6   | Timetable Builder                      | 4      | 4         |
| 7   | Attendance System (Offline-First)      | 6      | 6         |
| 8   | SMS & Notification Integration         | 4      | 4         |
| 9   | Exams & Mark Entry                     | 5      | 5         |
| 10  | Grading Engine                         | 3      | 3         |
| 11  | Report Card Generation                 | 4      | 4         |
| 12  | Student & Academic Analytics           | 3      | 2         |

---

## Continuity from Sprint 00

The following items from Sprint 00 are **directly depended on** in this sprint. Verify they are working before beginning any issue here.

| Sprint 00 Deliverable                                                                                                                                                                       | Used By                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `convex/schema.ts` — `students`, `staff`, `sections`, `grades`, `terms`, `academicYears`, `attendance`, `examSessions`, `examResults`, `subjects`, `timetableSlots`, `notifications` tables | Every epic in this sprint                                  |
| `withSchoolScope()` utility                                                                                                                                                                 | Every Convex function written this sprint                  |
| `requireRole()` and `requirePermission()` utilities                                                                                                                                         | Every mutation                                             |
| `Feature` enum and `useFeature()` hook                                                                                                                                                      | Timetable, Period Attendance, LMS connections              |
| `getDefaultFeaturesForSchoolType()` presets                                                                                                                                                 | Academic mode (term vs semester) detection                 |
| `AdminSidebar` with feature-gated nav config                                                                                                                                                | All new admin pages are added to nav config this sprint    |
| School `gradingMode` field (`ecz` / `gpa` / `percentage`)                                                                                                                                   | Entire Grading Engine                                      |
| School `academicMode` field (`term` / `semester`)                                                                                                                                           | Academic Year & Term Management                            |
| Seed script (3 test schools)                                                                                                                                                                | All testing — especially the college (GPA/semester) school |

---

## Forward-Compatibility Commitments

These are architectural decisions made in Sprint 01 that ensure future sprints connect without rework:

| Decision                                                                                                            | Why It Matters for Future Sprints                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Student `currentSectionId` + `currentGradeId` are always current** — updated immediately on transfer or promotion | Sprint 02 (fees) reads these to determine which fee structure to apply. Sprint 04 (boarding) reads grade to assign hostel block.        |
| **`attendance` table stores both `sectionId` AND `studentId`**                                                      | Sprint 04 night prep attendance uses the same table with `period: 'night_prep'`. Sprint 05 LMS engagement reads attendance correlation. |
| **`examResults` table links to `subjectId` + `sectionId` + `examSessionId`**                                        | Sprint 05 LMS grades auto-write into this table. Sprint 07 analytics aggregate across all three dimensions.                             |
| **Timetable slots link `staffId` + `subjectId` + `sectionId`**                                                      | Sprint 05 LMS courses are created FROM timetable assignments — teacher sees "Create Course" next to each timetable slot.                |
| **Homework uses the `lmsLessons` table** (type: `'assignment'`) even before full LMS is built                       | Sprint 05 LMS simply upgrades the same records with course structure around them — no data migration needed.                            |
| **Student number format is configurable per school** (`{PREFIX}-{YEAR}-{SEQUENCE}`)                                 | Sprint 02 invoices use the student number as the invoice prefix.                                                                        |
| **`notifications` table records every SMS sent**                                                                    | Sprint 02 fee reminders, Sprint 03 parent portal, Sprint 04 sick bay alerts — all use the same notification dispatch system.            |
| **Grading schema supports both ECZ and GPA** from day one                                                           | Sprint 05 LMS submissions feed into `examResults` using whichever mode is active. Sprint 07 analytics report correctly across both.     |
| **Academic year is closed explicitly** (not inferred from dates)                                                    | Sprint 02 invoices are term-scoped. Sprint 04 bed assignments are term-scoped. Both need a reliable "current term" signal.              |
| **`subjects` have `eczSubjectCode`**                                                                                | Sprint 07 MoE statistical returns require these codes. Setting them up now avoids a migration to add them later.                        |

---

## Epic 1 — Academic Year & Term Management

> **Goal:** A working academic calendar that drives every date-sensitive operation in the system. The "current term" is the pivot point for attendance, exams, invoices, and hostel assignments.

---

### ISSUE-041 · Academic Year CRUD and Activation

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Build the backend and UI for managing academic years. A school must have an active academic year before any students can be enrolled, any attendance can be marked, or any exams can be created.

#### User Story

> As a school admin, I create the "2025 Academic Year", set its date range, and activate it. The system flags it as the current year across all modules. At year-end, I will "close" this year and create the 2026 year.

#### Acceptance Criteria

**Backend — `convex/schools/academicYears.ts`:**

- [ ] `createAcademicYear` mutation:
  - Args: `{ year: number, label: string, startDate: string, endDate: string }`
  - Validates no duplicate year exists for the school
  - Auto-generates label if not provided: `'${year} Academic Year'`
  - Requires `requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS)`
- [ ] `activateAcademicYear` mutation:
  - Sets `isActive: true` on target year
  - Sets `isActive: false` on all other years for the school (only one active at a time)
  - Updates `school.currentAcademicYearId` atomically
  - Triggers notification to all school admins: "Academic year {year} is now active"
- [ ] `closeAcademicYear` mutation:
  - Sets `isActive: false` on year
  - Requires confirmation: all pending exam result locks must be resolved
  - Does NOT delete data — all historical records remain queryable
- [ ] `getAcademicYears` query: returns all years for school, sorted descending
- [ ] `getCurrentAcademicYear` query: returns the single active year (or null)

**Frontend — `/(admin)/settings/academic-year/page.tsx`:**

- [ ] List of all academic years with status badges (Active, Closed, Draft)
- [ ] "Create Academic Year" button → inline form or modal
- [ ] Activate / Close buttons with confirmation dialogs
- [ ] Academic year is shown in the topbar (from Sprint 00 ISSUE-032) — now populated with real data
- [ ] Warning if no academic year is active: persistent yellow banner in admin dashboard

#### Data Note for Future Sprints

> The `currentAcademicYearId` on the `schools` document is the source of truth used by Sprint 02 (term-scoped invoice generation), Sprint 04 (term-scoped bed assignment), and Sprint 05 (LMS course academic year).

---

### ISSUE-042 · Term Management and Active Term System

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Terms are the operational unit of the school year. Every invoice, attendance report, and exam result is scoped to a term. The active term must be explicitly set — it never auto-advances.

#### User Story

> As a school admin, I create three terms within the 2025 academic year, each with start/end dates and exam period dates. I activate Term 1. When Term 1 ends, I manually activate Term 2.

#### Acceptance Criteria

**Backend — `convex/schools/terms.ts`:**

- [ ] `createTerms` mutation: bulk creates terms for an academic year
  - Validates no overlapping date ranges within the same academic year
  - For `academicMode: 'semester'` schools: validates exactly 2 terms created
  - For `academicMode: 'term'` schools: validates 2–4 terms (some schools have 4)
- [ ] `activateTerm` mutation:
  - Deactivates previous active term
  - Updates `school.currentTermId`
  - Records term activation in an audit log
- [ ] `updateTermDates` mutation: allows adjusting dates after creation (e.g., for school calendar changes)
- [ ] `getTermsByYear` query: returns all terms for a given academic year
- [ ] `getCurrentTerm` query: returns active term with days remaining calculated

**Frontend:**

- [ ] Terms shown as a timeline inside the Academic Year settings page
- [ ] Activate Term button with modal: "Activating Term 2 will close Term 1. Outstanding exam marks will be locked. Confirm?"
- [ ] Term status chips: Active (green), Upcoming (gray), Closed (faded), Exam Period (amber)
- [ ] Days remaining counter on active term: shown in admin topbar badge

---

### ISSUE-043 · Academic Calendar and School Events

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

A school calendar that tracks holidays, events, and closures. This feeds into the attendance system (public holidays are auto-marked as no-school days) and the parent portal (parents see upcoming events).

#### User Story

> As a school admin, I add "Independence Day — 24 Oct 2025" as a public holiday. The attendance system will not flag students as absent on this day. Parents see this on their calendar.

#### Acceptance Criteria

**Schema addition to `convex/schema.ts`:**

```typescript
schoolEvents: defineTable({
  schoolId: v.id('schools'),
  academicYearId: v.id('academicYears'),
  termId: v.optional(v.id('terms')),
  title: v.string(),
  description: v.optional(v.string()),
  startDate: v.string(),
  endDate: v.string(),
  type: v.union(
    v.literal('holiday'), // No attendance expected
    v.literal('exam_period'), // Exam days — special attendance rules
    v.literal('sports_day'), // School event — attendance expected
    v.literal('school_closure'), // Unexpected closure
    v.literal('parent_teacher'), // PTM day
    v.literal('general'),
  ),
  affectsAttendance: v.boolean(), // If true, attendance NOT required on these dates
  visibleToParents: v.boolean(),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_academic_year', ['schoolId', 'academicYearId']);
```

- [ ] `createSchoolEvent`, `updateSchoolEvent`, `deleteSchoolEvent` mutations
- [ ] `getEventsForDateRange` query: used by attendance system to check if a date is a school day
- [ ] `getUpcomingEvents` query: used by parent portal calendar widget
- [ ] Admin calendar page: monthly grid view with events overlaid
- [ ] Zambia public holidays pre-loaded for 2025/2026 as a one-click import option
- [ ] `isSchoolDay(date: string, schoolId): boolean` utility function — used by attendance system in ISSUE-062

---

## Epic 2 — Subject & Curriculum Management

> **Goal:** A complete subject registry that maps to the Zambian MoE curriculum, feeds the timetable, drives exam sessions, and becomes the backbone of the LMS in Sprint 05.

---

### ISSUE-044 · Subject Registry and MoE Curriculum Mapping

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Build the subject management system. Subjects are school-level (each school defines their own list) but are seeded with Zambia's MoE curriculum. This is the foundation for timetable building, exam sessions, and Sprint 05's LMS courses.

#### User Story

> As a school admin, I open the Subjects page and see all MoE subjects pre-populated for my school type. I can add custom subjects (e.g., "Additional Mathematics"), mark which are compulsory vs elective, and assign them to grade levels.

#### Acceptance Criteria

**Backend — `convex/academics/subjects.ts`:**

- [ ] `createSubject` mutation:
  - Args: `{ name, code, gradeIds, isCompulsory, eczSubjectCode?, isStemSubject?, theoryWeight?, practicalWeight? }`
  - Code must be unique within the school (e.g., "MATH", "ENG", "BIO")
  - Requires `requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS)`
- [ ] `updateSubject` mutation: update name, grades assigned, compulsory status
- [ ] `deactivateSubject` mutation: soft-delete — hides from new timetable/exams but preserves historical data
- [ ] `seedDefaultSubjects` mutation: populates school with MoE curriculum based on school type
  - Primary school subjects (Grade 1–7): English, Mathematics, Science, Social Studies, Creative Arts, Physical Education, Religious Education, Zambian Languages
  - Secondary school subjects (Grade 8–12): English Language, Mathematics, Integrated Science, Biology, Chemistry, Physics, History, Geography, Civic Education, Religious Education, Home Economics, Commerce, Principles of Accounts, Computer Studies, Physical Education, French, Fine Art, Music, Design & Technology
  - Technical school subjects: Applied Mathematics, Technical Drawing, Carpentry, Electrical Installation, Plumbing, etc.
  - College subjects: institution-specific — admin adds manually
- [ ] `getSubjectsByGrade` query: returns subjects assignable to a given grade
- [ ] `getSubjectsBySchool` query: all subjects with their grade assignments

**Frontend — `/(admin)/academics/subjects/page.tsx`:**

- [ ] Subject list grouped by grade level
- [ ] "Import MoE Defaults" button (triggers `seedDefaultSubjects`)
- [ ] Add/Edit subject form: Name, Short Code, Grade assignment (multi-select), Compulsory toggle, ECZ Subject Code, Theory/Practical split (for technical schools)
- [ ] Subject detail page shows: which sections teach it, which teachers are assigned, recent exam performance average

#### Forward-Compatibility Note

> The `subjectId` is the primary foreign key used in: `timetableSlots`, `examResults`, `lmsLessons`, `libraryBooks` (subject tag), and `staffSubjectAssignments`. It must never be changed or soft-deleted without cascading impact checks.

---

### ISSUE-045 · Grade Configuration and Level Management

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Configure the grade levels for the school — Grade 1 through 7 for primary, 8–12 for secondary, Form 1–6 for some secondary, Year 1–4 for colleges. Grades determine which fee structure applies, which subjects are offered, and which exam format is used.

#### Acceptance Criteria

**Backend — `convex/academics/grades.ts`:**

- [ ] `seedDefaultGrades` mutation: creates grades based on school type
  - `day_primary` / `boarding_primary`: Grades 1–7, flags Grade 7 as `graduationGrade: true`
  - `day_secondary` / `boarding_secondary` / `mixed_secondary`: Grades 8–12, flags Grade 9 and Grade 12 as `graduationGrade: true` (ECZ exam years)
  - `college`: Year 1–4 (configurable), no graduation grade flag
  - `technical`: Year 1–3, with `hasPracticalAssessment: true` flag
- [ ] `createGrade` mutation: manual grade creation
- [ ] `updateGrade` mutation: rename, reorder, toggle graduation flag
- [ ] `getGradesBySchool` query: returns grades ordered by `level`
- [ ] ECZ flag on grades: `isEczExamYear: boolean` — when `true`, exam results are formatted for ECZ submission and mock tracking is enabled

**Frontend:**

- [ ] Grades page at `/(admin)/academics/grades` — ordered list with drag-to-reorder
- [ ] "Seed Grades" button for new schools (runs once, disabled after first grade created)
- [ ] Graduation Grade badge shown on ECZ exam years
- [ ] Clicking a grade shows: all sections in this grade, all subjects assigned, student count, average performance

---

### ISSUE-046 · Lesson Plans and MoE Syllabus Tracker

**Type:** Backend + Frontend | **Priority:** P2 | **Estimate:** 1.5 days

#### Description

Teachers can create lesson plans linked to MoE syllabus topics and share them within the school. This is a standalone feature in Sprint 01 that becomes the content foundation for the Sprint 05 LMS.

#### User Story

> As a Grade 10 Biology teacher, I create a lesson plan for "Cell Division — Mitosis". I link it to the MoE syllabus topic, add learning objectives, resources, and duration. Other Biology teachers can see and use my plan. When LMS is enabled, this plan becomes a lesson in the Biology course.

#### Acceptance Criteria

**Schema addition:**

```typescript
lessonPlans: defineTable({
  schoolId: v.id('schools'),
  staffId: v.id('staff'),
  subjectId: v.id('subjects'),
  gradeId: v.id('grades'),
  title: v.string(),
  syllabusTopicRef: v.optional(v.string()), // MoE topic reference code
  learningObjectives: v.array(v.string()),
  duration: v.number(), // Minutes
  resources: v.array(
    v.object({
      type: v.union(v.literal('pdf'), v.literal('link'), v.literal('text')),
      title: v.string(),
      url: v.optional(v.string()),
      content: v.optional(v.string()),
    }),
  ),
  visibility: v.union(v.literal('private'), v.literal('school')),
  // Sprint 05: lmsLessonId added when converted to LMS lesson
  lmsLessonId: v.optional(v.id('lmsLessons')),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_staff', ['staffId'])
  .index('by_subject_grade', ['subjectId', 'gradeId']);
```

- [ ] Teacher can create, edit, view, delete their own lesson plans
- [ ] Admin can view all lesson plans across all teachers
- [ ] `searchLessonPlans` query: full-text search by title, subject, grade
- [ ] Lesson plan "Use this plan" — creates a copy attributed to the requesting teacher
- [ ] Sprint 05 hook: `lmsLessonId` field exists on the schema now so LMS can link to plans without migration

---

### ISSUE-047 · Homework Assignment System

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 1 day

#### Description

Teachers set homework for their sections. Students and parents can see it. Students can submit text or file responses. This uses the `lmsLessons` table (with `contentType: 'assignment'`) directly — so when Sprint 05 LMS is built, homework is already inside the LMS data model and just needs course structure around it.

#### User Story

> As a teacher, I set a homework assignment for Grade 8A Maths: "Exercises 1.3 Q1–10, due Friday." Parents see it in the parent portal. Students can upload a photo of their work. I mark it.

#### Acceptance Criteria

**Uses `lmsLessons` table** (already in schema from Sprint 00) with:

- `contentType: 'assignment'`
- `moduleId` set to a auto-created "Homework" module per section per term (created on first homework assignment)
- `courseId` pointing to a auto-created "Homework Feed" course per section per term

**`convex/academics/homework.ts`:**

- [ ] `createHomework` mutation:
  - Requires `requirePermission(ctx, Permission.CREATE_COURSE)` (shared with LMS)
  - Auto-creates the backing `lmsCourses` and `lmsModules` records if they don't exist
  - Creates `lmsLessons` record with type `'assignment'`
  - Sets `unlocksAt` from due date
- [ ] `submitHomework` mutation: creates `lmsSubmissions` record — student uploads text or file URL
- [ ] `gradeHomework` mutation: teacher sets `score`, `maxScore`, `feedback` on the submission
- [ ] `getHomeworkForSection` query: returns all homework for a section in current term, ordered by due date
- [ ] `getHomeworkForStudent` query: used by student portal and parent portal
- [ ] `getPendingSubmissions` query: teacher sees which students haven't submitted

**Frontend — `/(teacher)/homework/page.tsx`:**

- [ ] Homework list per section with status: Set / Submission Open / Marking / Closed
- [ ] Create Homework form: Title, Description, Due Date, Max Marks (optional), Sections (multi-select)
- [ ] Submission tracker: table of students × submitted? × score
- [ ] Grade submissions: view each submission, enter score and feedback

**Parent Portal Hook (Sprint 03 will build the UI):**

> `getHomeworkForStudent` query already exists. Sprint 03 parent portal simply calls it.

---

## Epic 3 — Student Enrolment & Profile Management

> **Goal:** A complete student database. Every field is set up now so that fee invoicing (Sprint 02), guardian portal (Sprint 03), boarding assignment (Sprint 04), and transport routing (Sprint 06) work without any changes to the student document.

---

### ISSUE-048 · Student Enrolment Form

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 1.5 days

#### Description

The primary way students enter the system. A multi-step form that captures all required fields, validates uniqueness, and sets up the student's initial placement in a section.

#### User Story

> As a school admin or class teacher, I enrol a new student. I fill in their personal details, upload a photo, select their class section, enter their guardian's details, and the system creates both the student record and guardian account, sending an SMS welcome to the guardian.

#### Acceptance Criteria

**Backend — `convex/students/mutations.ts`:**

- [ ] `enrolStudent` mutation:
  - Validates `studentNumber` uniqueness within school
  - If `studentNumber` not provided: auto-generates using `generateStudentNumber(schoolId, year)` helper
  - Validates `currentSectionId` belongs to the school and the current academic year
  - Validates `dateOfBirth` — student must be at least 3 years old
  - Sets `status: 'active'`
  - Sets `boardingStatus` based on the section's grade (auto-set to `'day'` for day schools, prompted for mixed/boarding schools)
  - If guardian phone provided: calls `findOrCreateGuardian(phone, schoolId)` and adds `guardianLinks` entry
  - Creates a `notifications` record: welcome SMS to guardian
  - Returns new student ID
  - Requires `requirePermission(ctx, Permission.ENROL_STUDENT)`
- [ ] `generateStudentNumber` internal helper:
  - Format: `{schoolPrefix}-{2-digit-year}-{4-digit-sequence}` e.g., `KBS-25-0001`
  - School prefix comes from `school.shortName` (first 3 chars, uppercase)
  - Sequence is auto-incremented per school per year with a counter in Convex
  - Counter stored in a `counters` table: `{ schoolId, year, lastValue }` — atomic increment

**Schema addition — `counters` table:**

```typescript
counters: defineTable({
  schoolId: v.id('schools'),
  key: v.string(), // e.g., 'student_number_2025', 'invoice_number_2025'
  value: v.number(), // Current counter value
}).index('by_school_key', ['schoolId', 'key']);
```

> **Note:** This `counters` table will also be used by Sprint 02 for invoice number generation (`invoice_number_2025`) and by Sprint 04 for visitor log reference numbers. Define it now.

**Frontend — `/(admin)/students/enrol/page.tsx`:**

- [ ] Multi-step form (4 steps) with progress indicator:

  **Step 1 — Personal Information**
  - First Name*, Last Name*, Middle Name
  - Date of Birth\* (date picker, calculates age in real-time)
  - Gender\* (radio: Male / Female)
  - NRC (text, optional — required for Grade 9+)
  - Birth Certificate Number (optional)
  - Nationality\* (default: Zambian)
  - Blood Group, Home Language, Religion (optional)
  - Profile Photo (upload via Cloudinary — drag-and-drop or camera on mobile)

  **Step 2 — Academic Placement**
  - Academic Year\* (auto-filled: current active year)
  - Grade\* (dropdown — from active grades)
  - Section\* (dropdown — filtered by selected grade, shows capacity)
  - Boarding Status* (shown ONLY for `boarding\_*`and`mixed_secondary` school types)
  - Meal Plan (shown ONLY if `Feature.MEAL_PLANS` enabled AND boarding status = boarding)
  - Admission Date\* (default: today)
  - Previous School (text, optional)

  **Step 3 — Guardian Information**
  - "Search existing guardian by phone" — if found, pre-fills and shows "Link to existing account"
  - Or: Add new guardian: First Name*, Last Name*, Phone*, Relation*, Alt Phone, NRC, Email
  - Guardian permissions: [x] Can pay fees [x] Can see results [x] Can see attendance [x] Receives SMS [x] Emergency Contact
  - "Add second guardian" option (e.g., father and mother both registered)

  **Step 4 — Additional Information**
  - Custom fields defined by school (from `school.customStudentFields`)
  - Medical notes, allergies, medications
  - Special needs / disability notes
  - Previous school academic history (text)
  - Review summary before submit

- [ ] Each step validates independently — user cannot advance with invalid data
- [ ] "Save Draft" at any step — saves partial enrolment resumable later
- [ ] After submission: success page with student number, profile summary, and "Enrol Another Student" option
- [ ] Mobile responsive: each step is scroll-friendly on small screens

---

### ISSUE-049 · Student Profile View and Edit

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

The comprehensive student profile page. This is the hub for all student-related actions — viewed by admins, class teachers, and guardians (in read-only form via Sprint 03).

#### User Story

> As a class teacher, I open a student's profile and see everything: their photo, current section, attendance this term, recent results, guardian contacts, and any medical notes. I can edit their details and add notes.

#### Acceptance Criteria

**Backend — `convex/students/queries.ts`:**

- [ ] `getStudentById` query:
  - Returns student with resolved section name, grade name, guardian names
  - Returns attendance summary for current term: total days, present days, absent days, attendance %
  - Returns most recent exam results
  - Returns current fee balance (null until Sprint 02 — returns placeholder)
  - Scoped: class teachers see only their section's students; admin sees all
- [ ] `searchStudents` query:
  - Full text search across: firstName, lastName, studentNumber
  - Filters: grade, section, status, boardingStatus, gender
  - Pagination with Convex cursor
  - Returns lightweight list (name, number, grade, photo) — not full profile

**Frontend — `/(admin)/students/[id]/page.tsx`:**

- [ ] Profile header: large photo, name, student number, grade/section badge, boarding status badge, status badge
- [ ] Tabs:
  - **Overview**: Quick stats (attendance %, current term results overview, fee status placeholder), guardian list with contact info
  - **Academic**: Results per subject per term (table), exam history, subject breakdown
  - **Attendance**: Calendar heat map of attendance this term (present=green, absent=red, holiday=gray), detailed log below
  - **Guardians**: List of linked guardians with their permissions. Add/remove guardian links. "Send SMS to guardian" button
  - **Medical**: Health notes, allergies, sick bay history (Sprint 04 populates this)
  - **Documents**: Uploaded documents (birth cert scan, medical records), report cards (downloadable PDFs)
  - **History**: Audit log of all changes to this student's record (who changed what, when)
- [ ] Edit button → inline editable fields (not a full separate form)
- [ ] "Transfer Student" action (ISSUE-053)
- [ ] "Promote Student" is done in bulk (ISSUE-054), not per student

---

### ISSUE-050 · Student List — Search, Filter, and Bulk Operations

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

The main student list page. Must handle schools with 1,500+ students efficiently via Convex cursor-based pagination. Bulk operations save admin time at start and end of year.

#### Acceptance Criteria

**Frontend — `/(admin)/students/page.tsx`:**

- [ ] Paginated table (50 students per page) with columns: Photo, Name, Student Number, Grade/Section, Status, Boarding, Guardian Phone
- [ ] Search bar: instant search as you type (debounced 300ms)
- [ ] Filters panel (collapsible):
  - Grade (multi-select checkboxes)
  - Section (multi-select, filtered by selected grade)
  - Status: Active / Transferred / Graduated / Withdrawn
  - Boarding Status: Day / Boarding (only shown if Feature.BOARDING)
  - Gender
  - Has outstanding fees (Sprint 02 — placeholder now, connects automatically when Sprint 02 builds the query)
- [ ] Bulk selection: checkbox per row, "Select All on page", "Select All matching filters"
- [ ] Bulk actions bar (appears when students selected):
  - Send SMS to guardians
  - Export to CSV
  - Change Section (bulk section transfer within same grade)
  - Print ID Cards (PDF batch)
- [ ] Column visibility toggles (user preference, stored in localStorage — this is one case where localStorage is acceptable as it's non-critical preference data)
- [ ] Export CSV: downloads all students matching current filters (server-side generation via Convex action)

---

### ISSUE-051 · Student ID Card Generation

**Type:** Backend | **Priority:** P2 | **Estimate:** 0.5 days

#### Description

Generate printable student ID cards as a PDF. Printed by the school and given to students. Used as gate-pass at boarding schools and for library book issuing (Sprint 05).

#### Acceptance Criteria

- [ ] `convex/students/actions.ts` → `generateIdCardPdf` action:
  - Uses `@react-pdf/renderer` server-side
  - Card content: school logo, school name, student name, student number, grade/section, photo, academic year, barcode (Code 128 of student number)
  - Card dimensions: standard ID card (85.6mm × 54mm)
  - Front side: student info; Back side: school address, guardian phone, blood group
- [ ] Single card generation: from student profile page
- [ ] Bulk card generation: from student list (selected students) — returns a multi-page PDF
- [ ] Card design respects school branding colors
- [ ] Barcode is scannable for library system (Sprint 05) and visitor check-in (Sprint 04)

---

### ISSUE-052 · Student Document Management

**Type:** Backend + Frontend | **Priority:** P2 | **Estimate:** 0.5 days

#### Description

Upload and manage documents associated with a student (birth certificate scans, medical certificates, transfer letters, etc.). These are stored in Cloudinary with metadata in Convex.

#### Acceptance Criteria

**Schema addition:**

```typescript
studentDocuments: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  type: v.union(
    v.literal('birth_certificate'),
    v.literal('nrc'),
    v.literal('medical_certificate'),
    v.literal('transfer_letter'),
    v.literal('report_card'), // Auto-created when report cards are generated
    v.literal('other'),
  ),
  title: v.string(),
  fileUrl: v.string(), // Cloudinary URL
  fileType: v.string(), // 'pdf', 'jpg', 'png'
  uploadedBy: v.id('users'),
  uploadedAt: v.number(),
  notes: v.optional(v.string()),
})
  .index('by_student', ['studentId'])
  .index('by_school', ['schoolId']);
```

- [ ] Upload component: drag-and-drop to Cloudinary (unsigned upload preset), then saves metadata to Convex
- [ ] Document list in student profile Documents tab (ISSUE-049)
- [ ] Delete document: removes from Cloudinary + Convex
- [ ] When a report card is generated (ISSUE-089), it is automatically saved as a `report_card` document for that student
- [ ] Guardians can view (not upload) their child's documents via the parent portal (Sprint 03 will read from this query)

---

### ISSUE-053 · Student Transfer System

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 1 day

#### Description

Manages both incoming transfers (student arriving from another school) and outgoing transfers (student leaving for another school). Generates the official transfer letter PDF required by Zambia's MoE.

#### User Story

> As a school admin, I process an outgoing transfer for a student. I fill in the destination school, the reason, and the last school date. The system updates the student's status, clears their section assignment, generates an MoE-format transfer letter PDF, and notifies their guardian.

#### Acceptance Criteria

**Schema addition:**

```typescript
transfers: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  direction: v.union(v.literal('in'), v.literal('out')),
  fromSchool: v.optional(v.string()), // For transfers in
  toSchool: v.optional(v.string()), // For transfers out
  reason: v.string(),
  transferDate: v.string(),
  processedBy: v.id('users'),
  transferLetterUrl: v.optional(v.string()), // Generated PDF
  approvedBy: v.optional(v.id('users')),
  notes: v.optional(v.string()),
  createdAt: v.number(),
})
  .index('by_student', ['studentId'])
  .index('by_school', ['schoolId']);
```

**Backend — `convex/students/transfers.ts`:**

- [ ] `initiateTransferOut` mutation:
  - Updates `student.status` to `'transferred_out'`
  - Sets `student.transferOutDate` and `student.transferOutSchool`
  - Clears `student.currentSectionId` (student is no longer in a section)
  - Clears `student.currentBedId` if boarding (Sprint 04 auto-frees the bed)
  - Creates `transfers` record
  - Generates transfer letter PDF (via `generateTransferLetter` action)
  - Saves PDF as student document
  - Sends SMS to guardian: "Transfer processed for [Name]. Transfer letter available on portal."
- [ ] `recordTransferIn` mutation: registers an incoming student — essentially calls `enrolStudent` with `previousSchool` set and creates a `transfers` record with `direction: 'in'`

**Frontend:**

- [ ] "Transfer Out" button on student profile (admin only)
- [ ] Transfer Out modal: destination school, reason, last date, notes
- [ ] Transfer history shown in student History tab
- [ ] Download Transfer Letter PDF button

**Transfer Letter PDF Template:**

- MoE letterhead format
- School name and address
- Student name, DOB, student number, grade last attended
- Reason for transfer, last date
- Signed by Head Teacher (digital signature placeholder)
- Official school stamp placeholder

---

### ISSUE-054 · Year-End Student Promotion Engine

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 1 day

#### Description

At the end of an academic year, all students must be promoted to the next grade/section. This is a bulk operation that must handle edge cases: students who fail and repeat, students who graduate, and students who transfer out. This runs ONCE per year per school.

#### User Story

> As a school admin, at the end of the 2025 year, I run the promotion process. The system shows me all Grade 8 students. I review who should move to Grade 9A vs Grade 9B, who should repeat Grade 8, and who graduated. I confirm, and the system updates all students to their 2026 sections in a single atomic operation.

#### Acceptance Criteria

**Backend — `convex/students/promotions.ts`:**

- [ ] `preparePromotion` query:
  - Takes `fromAcademicYearId`, `toAcademicYearId`
  - Returns all students grouped by current section
  - For each student: includes their terminal exam result to inform promotion decision
  - Returns suggested promotion: pass (promote) or fail (repeat) based on configurable pass mark
- [ ] `bulkPromoteStudents` mutation:
  - Args: `Array<{ studentId, action: 'promote' | 'repeat' | 'graduate' | 'withdraw', toSectionId?: Id<'sections'> }>`
  - For `'promote'`: updates `currentSectionId`, `currentGradeId`, `currentAcademicYearId`
  - For `'repeat'`: creates new section assignment in same grade, new academic year
  - For `'graduate'`: sets `student.status = 'graduated'`, sets `graduationDate`, clears section
  - For `'withdraw'`: sets `student.status = 'withdrawn'`
  - All changes in a single Convex transaction — all or nothing
  - Creates a `promotionRun` audit record with full summary
  - Requires `requirePermission(ctx, Permission.PROMOTE_STUDENTS)`
- [ ] Promotion is blocked if the target academic year has no sections created yet

**Frontend — `/(admin)/students/promotion/page.tsx`:**

- [ ] Step 1: Select source year → target year
- [ ] Step 2: Grade-by-grade review table
  - Each row: student photo, name, terminal exam score, suggested action (color-coded)
  - Class teacher can override suggestion: promote / repeat / graduate / withdraw
  - Target section selector (which section in the new grade)
- [ ] Step 3: Summary statistics before committing (X promoting, Y repeating, Z graduating)
- [ ] Step 4: Confirmation with school admin password re-entry (destructive operation)
- [ ] After promotion: all affected students' profiles update immediately in Convex real-time
- [ ] Promotion cannot be undone — warning clearly displayed

---

## Epic 4 — Class Sections & Student Placement

---

### ISSUE-055 · Section Management — Create, Edit, Assign Class Teacher

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Manage class sections (8A, 8B, Form 2 Sciences, etc.). Each section has a class teacher, a capacity, and is linked to a grade and academic year.

#### Acceptance Criteria

**Backend — `convex/academics/sections.ts`:**

- [ ] `createSection` mutation:
  - Args: `{ gradeId, academicYearId, name, displayName, capacity?, room?, classTeacherId? }`
  - Validates name uniqueness within grade × academic year
  - `displayName` auto-generated if not provided: `{gradeName} {name}` → "Grade 8A"
  - Requires `requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS)`
- [ ] `updateSection` mutation: rename, reassign class teacher, change capacity
- [ ] `assignClassTeacher` mutation:
  - Sets `section.classTeacherId`
  - Also sets `staff.classSectionId` on the teacher
  - If teacher already has a class section, clears the old assignment first and notifies
- [ ] `getSectionsByGrade` query: all sections for a grade in given academic year
- [ ] `getSectionWithStudents` query: section details + all active students in it, with their attendance summary
- [ ] `getSectionCapacityStatus` query: returns `{ capacity, enrolled, available }` for a section

**Frontend — `/(admin)/academics/sections/page.tsx`:**

- [ ] Sections grouped by grade in a grid view
- [ ] Each section card: name, class teacher, enrolled/capacity bar, quick actions
- [ ] "Add Section" button per grade row
- [ ] Drag student between sections (inline transfer within same grade)
- [ ] Unassigned teacher warning: yellow badge if section has no class teacher

---

### ISSUE-056 · Student-Section History and Audit Trail

**Type:** Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Track every section change a student has been through for full historical accuracy. This feeds the student profile History tab and provides the audit data for MoE reporting.

#### Acceptance Criteria

**Schema addition:**

```typescript
sectionHistory: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  sectionId: v.id('sections'),
  gradeId: v.id('grades'),
  academicYearId: v.id('academicYears'),
  fromDate: v.string(),
  toDate: v.optional(v.string()), // Null if current placement
  reason: v.union(
    v.literal('initial_enrolment'),
    v.literal('section_transfer'),
    v.literal('grade_promotion'),
    v.literal('grade_repeat'),
    v.literal('year_end'),
  ),
  changedBy: v.id('users'),
  createdAt: v.number(),
})
  .index('by_student', ['studentId'])
  .index('by_school', ['schoolId']);
```

- [ ] `getSectionHistory` query: returns full section history for a student
- [ ] Every mutation that changes `student.currentSectionId` must also create a `sectionHistory` record
- [ ] Applied retroactively in `bulkPromoteStudents`, `enrolStudent`, `internalSectionTransfer`
- [ ] History shown in student profile History tab (ISSUE-049)

---

### ISSUE-057 · Inter-Section Student Transfer

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Move a student from one section to another within the same grade and academic year (e.g., 8A to 8B). Different from school-to-school transfer (ISSUE-053).

#### Acceptance Criteria

- [ ] `transferBetweenSections` mutation:
  - Updates `student.currentSectionId`
  - Creates `sectionHistory` record with `reason: 'section_transfer'`
  - If student had a class teacher assigned as their contact, notifies the new class teacher
  - Requires `requirePermission(ctx, Permission.EDIT_STUDENT)`
- [ ] UI: "Change Section" in student profile → modal with section selector (filtered by same grade)
- [ ] Bulk section change from student list (ISSUE-050) — calls same mutation in a loop, wrapped in a Convex action

---

### ISSUE-058 · Sections Overview Dashboard for Class Teachers

**Type:** Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Class teachers need a dedicated view of their section — their "home base" in the system. This is the first thing a class teacher sees when they log in.

#### Acceptance Criteria

**Frontend — `/(teacher)/my-class/page.tsx`:**

- [ ] Reads `staff.classSectionId` from `useMe()` — if null, shows "You have not been assigned a class"
- [ ] Section header: section name, grade, academic year, enrolled count
- [ ] Student roster: photo, name, attendance this week (mini bar), last result average
- [ ] Quick actions per student: View Profile, Mark Absent, Send Note to Guardian
- [ ] Today's timetable for this section
- [ ] Pending homework submissions count
- [ ] Recent section announcements

---

## Epic 5 — Staff & Subject Assignment

---

### ISSUE-059 · Staff Subject and Section Assignment

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Assign teachers to subjects and sections. This drives the timetable (which teacher can teach which subject to which section), the mark entry screen (teacher only sees their own subjects), and the Sprint 05 LMS course creation.

#### User Story

> As a school admin, I assign Mr. Phiri to teach Mathematics in Grade 9A, 9B, and 10A. The system validates he is available for those sections and shows a warning if there's a potential timetable conflict.

#### Acceptance Criteria

**Schema addition:**

```typescript
staffSubjectAssignments: defineTable({
  schoolId: v.id('schools'),
  staffId: v.id('staff'),
  subjectId: v.id('subjects'),
  sectionId: v.id('sections'),
  academicYearId: v.id('academicYears'),
  termId: v.optional(v.id('terms')), // Null = all terms; set if one-term assignment
  isPrimaryTeacher: v.boolean(), // Can there be a second/substitute teacher?
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_staff', ['staffId'])
  .index('by_section', ['sectionId'])
  .index('by_subject_section', ['subjectId', 'sectionId']);
```

**Backend — `convex/staff/assignments.ts`:**

- [ ] `assignStaffToSubjectSection` mutation: creates `staffSubjectAssignments` record, validates no duplicate
- [ ] `removeStaffAssignment` mutation: removes assignment — checks if this teacher has open exam results not yet locked before allowing removal
- [ ] `getAssignmentsForStaff` query: all subject-section assignments for a teacher
- [ ] `getAssignmentsForSection` query: all teacher-subject assignments for a section (used to build timetable)
- [ ] `getUnassignedSubjects` query: returns subjects in a section that have no teacher assigned yet — useful for admin to identify gaps

**Frontend — `/(admin)/staff/[id]/assignments/page.tsx`:**

- [ ] Teacher profile tab: "Assignments" listing all their section-subject pairs for current year
- [ ] "Add Assignment" → select Grade → Section → Subject
- [ ] Workload indicator: number of sections per teacher (flag if > school's max, configurable)
- [ ] Also accessible from section view: "Assign Teachers" button on each section

---

### ISSUE-060 · Staff Attendance Register

**Type:** Backend + Frontend | **Priority:** P2 | **Estimate:** 0.5 days

#### Description

Track teacher/staff attendance separately from student attendance. This is required for MoE reporting and for the substitute teacher workflow.

#### Acceptance Criteria

**Schema addition:**

```typescript
staffAttendance: defineTable({
  schoolId: v.id('schools'),
  staffId: v.id('staff'),
  date: v.string(),
  status: v.union(
    v.literal('present'),
    v.literal('absent'),
    v.literal('on_leave'),
    v.literal('late'),
  ),
  leaveType: v.optional(
    v.union(
      v.literal('annual'),
      v.literal('sick'),
      v.literal('maternity_paternity'),
      v.literal('compassionate'),
      v.literal('unpaid'),
    ),
  ),
  notes: v.optional(v.string()),
  markedBy: v.id('users'),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_staff_date', ['staffId', 'date']);
```

- [ ] Admin can mark daily staff attendance in bulk: `/admin/staff/attendance`
- [ ] When a teacher is marked absent, show "Assign Substitute" button: lets admin assign another teacher to cover their sections for that day
- [ ] Monthly staff attendance report: shows each staff's attendance record
- [ ] Leave application workflow: staff submits leave request → admin approves/rejects → status flows to attendance

---

### ISSUE-061 · Leave Management

**Type:** Backend + Frontend | **Priority:** P2 | **Estimate:** 0.5 days

#### Description

Staff leave requests, approvals, and balances. Integrates with staff attendance (approved leave auto-marks attendance).

#### Acceptance Criteria

**Schema addition:**

```typescript
leaveRequests: defineTable({
  schoolId: v.id('schools'),
  staffId: v.id('staff'),
  leaveType: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  daysRequested: v.number(),
  reason: v.string(),
  status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
  approvedBy: v.optional(v.id('users')),
  responseNote: v.optional(v.string()),
  submittedAt: v.number(),
  respondedAt: v.optional(v.number()),
})
  .index('by_school', ['schoolId'])
  .index('by_staff', ['staffId']);
```

- [ ] Staff can submit leave requests from their profile
- [ ] Admin approves/rejects with a note
- [ ] On approval: `staffAttendance` records auto-created for the leave period with `status: 'on_leave'`
- [ ] Leave balance tracking: annual leave entitlement configured per school (e.g., 30 days/year)

---

## Epic 6 — Timetable Builder

> **Goal:** A conflict-aware timetable generator that creates the weekly schedule for every section. The timetable directly drives which teacher marks attendance for which period and seeds the LMS course structure in Sprint 05.

---

### ISSUE-062 · Timetable Slot Management

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 1 day

#### Description

The core timetable data model and CRUD operations. The timetable is per-section and per-term, defining which teacher teaches which subject in which room at which time on which day.

#### User Story

> As a school admin, I build the timetable for Grade 9A for Term 1. I assign each period (Monday Period 1, Monday Period 2...) to a subject and teacher. The system warns me if a teacher is double-booked.

#### Acceptance Criteria

**Backend — `convex/academics/timetable.ts`:**

- [ ] `createTimetableSlot` mutation:
  - Args: `{ sectionId, subjectId, staffId, dayOfWeek (0–6), startTime, endTime, room?, termId }`
  - Validates teacher conflict: no overlapping slots for the same `staffId` on the same day/time (across all their sections)
  - Validates room conflict: no overlapping slots for the same `room` on the same day/time
  - Returns conflict details if validation fails (which section/room is conflicting)
- [ ] `deleteTimetableSlot` mutation
- [ ] `getTimetableForSection` query: returns full week timetable for a section (used by class teacher, students, parent portal)
- [ ] `getTimetableForStaff` query: returns full week timetable for a teacher (used by teacher portal)
- [ ] `getConflicts` query: scans all slots for a given staff member or room and returns any overlaps (used before publishing)
- [ ] `publishTimetable` mutation: marks timetable as `published: true` — published timetables are visible to parents and students; unpublished are admin-only
- [ ] `copyTimetableToNextTerm` mutation: copies all slots from one term to another (time-saver at term start)

**Schema addition to `timetableSlots`:**

```typescript
// Add to existing timetableSlots table from Sprint 00 skeleton
isPublished: v.boolean(),
week: v.optional(v.string()),   // For college: week-specific overrides
notes: v.optional(v.string()),  // e.g., "Lab session — Room 14"
```

---

### ISSUE-063 · Timetable Builder UI — Drag-and-Drop Grid

**Type:** Frontend | **Priority:** P0 | **Estimate:** 1.5 days

#### Description

A visual drag-and-drop timetable editor for school admins. The grid shows days × periods. Subjects/teachers are dragged from a palette onto slots.

#### Acceptance Criteria

- [ ] `/(admin)/academics/timetable/page.tsx` — section selector at top
- [ ] Timetable grid: rows = time periods (configurable: e.g., 07:00–07:45, 07:45–08:30...), columns = Mon–Fri
- [ ] Period configuration: admin sets school's period structure (start time, duration, break periods) in settings — stored on school document
- [ ] Left palette: list of subjects × teachers for the selected section (from `getAssignmentsForSection`)
- [ ] Drag subject-teacher pair onto a slot → creates `timetableSlot`
- [ ] Click to remove a slot
- [ ] Conflict indicator: red outline on slot if conflict detected; hover shows conflict details
- [ ] "Check Conflicts" button: full scan before publishing
- [ ] "Publish Timetable" button: confirmation modal listing who can now see it
- [ ] View mode toggle: by section / by teacher (shows a teacher's full week across all sections)
- [ ] Print view: clean grid layout for printing and pinning on classroom door

---

### ISSUE-064 · Period Timetable Configuration

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Schools have different period structures (number of periods, duration, break times). This must be configured per school before the timetable builder works.

#### Acceptance Criteria

**Schema addition to `schools`:**

```typescript
periodConfig: v.object({
  periodsPerDay: v.number(), // e.g., 8
  periods: v.array(
    v.object({
      number: v.number(), // 1, 2, 3...
      label: v.string(), // 'Period 1', 'Assembly', 'Break', 'Lunch'
      startTime: v.string(), // '07:00'
      endTime: v.string(), // '07:45'
      isBreak: v.boolean(), // If true: no subject assigned
      isOptional: v.boolean(), // Some schools have optional 8th period
    }),
  ),
});
```

- [ ] Settings page at `/(admin)/settings/periods` — add, edit, reorder periods
- [ ] Default period config seeded based on school type at onboarding
- [ ] Period config is read by the timetable grid builder (ISSUE-063) for row headers
- [ ] Also read by the period-by-period attendance system (ISSUE-069) if `Feature.PERIOD_ATTENDANCE` is enabled

---

### ISSUE-065 · Student and Parent Timetable View

**Type:** Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Read-only timetable views for students and parents. Simple, clean, and mobile-friendly.

#### Acceptance Criteria

- [ ] `/(student)/timetable/page.tsx` — reads `getTimetableForSection` for the student's section
- [ ] Weekly grid: today highlighted, current period highlighted (if currently in session)
- [ ] List view toggle: chronological list per day (better for mobile)
- [ ] "Today's timetable" quick view shown on student and parent dashboards
- [ ] Parent portal timetable (Sprint 03 will integrate, but the `getTimetableForSection` query is available now)

---

## Epic 7 — Attendance System (Offline-First)

> **Goal:** Reliable daily attendance that works with or without internet. Teachers mark the register offline on their phone; it syncs automatically. Parents are notified by SMS when their child is absent.

---

### ISSUE-066 · Attendance Register — Backend Logic

**Type:** Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

The complete backend for marking, updating, and querying attendance. Designed for offline replay — mutations are idempotent using `clientId` deduplication.

#### Acceptance Criteria

**Backend — `convex/attendance/mutations.ts`:**

- [ ] `markBulkAttendance` mutation — the primary offline-capable mutation:

  ```typescript
  // Args
  {
    sectionId: Id<'sections'>,
    date: string,                    // 'YYYY-MM-DD'
    period: number | null,           // null for daily register; 1-8 for period attendance
    records: Array<{
      studentId: Id<'students'>,
      status: AttendanceStatus,
      notes?: string,
      clientId: string,              // UUID generated client-side for idempotency
    }>
  }
  ```

  - **Idempotency**: check if `attendance` record with same `studentId + date + period + schoolId` already exists; if so, update rather than insert
  - **School day check**: validates the date is a school day (`isSchoolDay()` from `schoolEvents` table — if public holiday, rejects with clear message)
  - **Future date check**: rejects dates in the future
  - **Retroactive edit window**: allows editing attendance within 7 days (configurable per school). Beyond 7 days requires `Permission.EDIT_ATTENDANCE_RETROACTIVE`
  - After successful insert/update: schedules `sendAbsenceSMS` action for any student with `status: 'absent'`
  - Returns `{ created: number, updated: number, skipped: number }`

- [ ] `updateSingleAttendance` mutation: change one student's status after the register is closed (with reason)
- [ ] `getRegisterForSection` query:
  - Returns all students in section with their attendance status for a given date/period
  - If no attendance records exist yet: returns all students with `status: null` (not yet marked)
  - Also returns: has the register been submitted? By whom? At what time?
- [ ] `getAttendanceSummaryForStudent` query:
  - Returns: totalDays, presentDays, absentDays, lateDays, excusedDays, attendancePercent for a date range
  - Date range defaults to current term
  - Used by student profile, parent portal, at-risk engine
- [ ] `getAttendanceSummaryForSection` query: aggregate stats per student in a section for the current term
- [ ] `getDailyAbsentees` query: all absent students across the whole school for a given date (admin view)

---

### ISSUE-067 · Offline-First Attendance Register — PWA Implementation

**Type:** Frontend | **Priority:** P0 | **Estimate:** 2 days

#### Description

The attendance register is the most used feature in the system and the most critical to work offline. A teacher in a classroom with no Airtel signal must be able to complete the register and have it sync automatically when connectivity returns.

#### User Story

> As Mr. Phiri, a Grade 9A class teacher, I open the register app at 07:30. I have no signal. I mark all 35 students (25 present, 3 late, 7 absent). I submit. The app says "Saved — will sync when online." At 08:15 when the school WiFi kicks in, the register syncs silently and the guardian SMSes fire.

#### Acceptance Criteria

**Offline Architecture:**

- [ ] `src/hooks/useOfflineQueue.ts` — completed (scaffolded in Sprint 00, now fully implemented):
  - Uses IndexedDB (via `idb` package) to store pending mutations
  - Queue structure: `{ id: string, mutation: string, args: object, attemptCount: number, createdAt: number }`
  - `queueMutation(mutationName, args)` — adds to queue and immediately shows optimistic update
  - `processMutationQueue()` — runs all pending mutations in order when online
  - Auto-retries on failure (max 5 attempts, exponential backoff)
  - Clears successfully synced items from queue
- [ ] Online/offline detection: listens to `navigator.onLine` + network request failure detection
- [ ] Optimistic updates: attendance register shows marks as saved immediately, with a subtle "pending sync" indicator on each row
- [ ] Sync status banner: "3 records pending sync" (amber) → "All synced" (green, fades after 3s) → "Sync failed — tap to retry" (red)

**Frontend — `/(teacher)/register/page.tsx`:**

- [ ] Section selector: shows class teacher's assigned section by default; can switch sections if teacher teaches multiple (based on `staffSubjectAssignments`)
- [ ] Date selector: defaults to today; calendar picker allows retroactive edit within window
- [ ] Period selector: shown only if `Feature.PERIOD_ATTENDANCE` is enabled; defaults to "Daily Register"
- [ ] Student list: sorted alphabetically; shows: photo, name, student number, status selector
- [ ] Status selector per student: large tap targets — `P` (present), `A` (absent), `L` (late), `E` (excused), `M` (medical)
  - Color coding: green/red/amber/blue/purple
  - Tapping cycles through statuses; long-press opens notes input
- [ ] "Mark All Present" quick action at top (common case)
- [ ] Search/filter within the register (for large classes)
- [ ] Submit register button: confirms count before submitting ("25 present, 7 absent, 3 late — Confirm?")
- [ ] After submission: shows "Register submitted at 07:45 by [teacher name]" — cannot resubmit without admin override
- [ ] Historical register view: admin can see which teacher marked the register and at what time

**PWA Configuration:**

- [ ] Service Worker configured (Workbox) to cache the register page and offline fallback
- [ ] Manifest updated to allow "Add to Home Screen" — register opens as standalone app on teacher's phone
- [ ] Pre-cache: section's student list, photos, and today's date when teacher opens app while online

---

### ISSUE-068 · Boarding Night Prep Attendance

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days | **Feature Gate:** `Feature.BOARDING`

#### Description

A separate attendance session for boarding students' evening study period. Uses the same `attendance` table as day attendance but with `period: 'night_prep'` and is restricted to students with `boardingStatus: 'boarding'`.

#### Acceptance Criteria

- [ ] `/(admin)/boarding/night-prep/page.tsx` (accessible to `matron` and `school_admin` roles)
- [ ] Reuses the attendance register UI (ISSUE-067) but pre-filtered to boarding students only
- [ ] Period value stored as a special string: `'night_prep'` (not a number)
- [ ] Night prep sessions happen once per school day, typically 18:00–20:00
- [ ] SMS sent to guardian if boarding student misses night prep (uses same `sendAbsenceSMS` action but with different template)
- [ ] Night prep attendance feeds into student conduct/discipline reports (Sprint 04 will build the full conduct module)
- [ ] Shown separately in student profile Attendance tab: day attendance vs night prep attendance

---

### ISSUE-069 · Period-by-Period Attendance

**Type:** Backend + Frontend | **Priority:** P2 | **Estimate:** 0.5 days | **Feature Gate:** `Feature.PERIOD_ATTENDANCE`

#### Description

For schools that want period-level attendance (primarily secondary and colleges), each teacher marks attendance for their subject period. This uses the same `attendance` table with `period` set to the timetable period number.

#### Acceptance Criteria

- [ ] When `Feature.PERIOD_ATTENDANCE` is enabled, subject teachers see their timetable slots in `/(teacher)/register`
- [ ] Each timetable slot for the current day becomes a markable register
- [ ] Teacher can only mark attendance for their assigned slots
- [ ] Daily attendance is computed from period attendance: present = attended > 50% of periods; late = first period absent; absent = attended 0 periods
- [ ] Admin can see period-level detail in student attendance tab

---

### ISSUE-070 · Chronic Absenteeism Detection and Alerts

**Type:** Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

A scheduled Convex function that runs daily and identifies students at risk due to attendance patterns. Alerts are sent to class teachers and admins.

#### Acceptance Criteria

**`convex/crons.ts` — add daily job:**

```typescript
crons.daily(
  'chronic-absenteeism-check',
  { hourUTC: 16, minuteUTC: 0 }, // 18:00 CAT
  internal.attendance.detectChronicAbsenteeism,
);
```

**`convex/attendance/jobs.ts` → `detectChronicAbsenteeism`:**

- [ ] For each active school, for each student:
  - Calculate attendance % for current term
  - Flag if: 3+ consecutive absences OR attendance % drops below configurable threshold (default: 80%)
  - Check if already flagged this week — avoid duplicate alerts
  - Creates `notifications` records (in-app) for the student's class teacher
  - If attendance < 70%: also sends SMS to guardian
- [ ] `getAtRiskStudents` query: admin view of all students below threshold, sortable by attendance %
- [ ] Admin dashboard widget: "X students below 80% attendance this term" — links to at-risk list

---

### ISSUE-071 · Attendance Reports

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Attendance reports for admin — daily, weekly, monthly, and term summary — available as on-screen views and downloadable PDFs.

#### Acceptance Criteria

**`convex/attendance/reports.ts`:**

- [ ] `getDailyAttendanceReport` query: all sections' attendance for a given date — shows which sections have marked and which haven't
- [ ] `getTermAttendanceReport` query: per-student attendance summary for the whole term — used for report cards and MoE returns
- [ ] `getSectionAttendanceTrend` query: weekly attendance % for a section over a term (charted in UI)
- [ ] `getMoEAttendanceReturn` query: formats data for Ministry of Education statistical return format

**Frontend — `/(admin)/attendance/reports/page.tsx`:**

- [ ] Daily summary: school-wide view — sections marked vs not, total absent count, chronically absent list
- [ ] Term summary: filterable table with export to CSV
- [ ] Trend chart: school-wide attendance % by week this term (using recharts, already installed)
- [ ] "Missing Registers" alert: shows which sections have not submitted today's register by 09:00

---

## Epic 8 — SMS & Notification Integration

> **Goal:** A reliable, queued SMS system using Airtel and MTN Zambia's APIs. Every SMS is logged, tracked, and retried on failure. This notification layer serves attendance, fees (Sprint 02), sick bay (Sprint 04), and transport (Sprint 06) without modification.

---

### ISSUE-072 · SMS Provider Integration — Airtel Zambia and MTN

**Type:** Backend | **Priority:** P0 | **Estimate:** 1.5 days

#### Description

Implement the SMS dispatch layer using both Airtel Zambia and MTN Zambia APIs. The system auto-selects the provider based on the recipient's number prefix (0971/0961 = Airtel, 0976/0966 = MTN) for best delivery rates. Falls back to the other provider if the primary fails.

#### User Story

> As the system, when I need to send an SMS to +260 97 123 4567, I detect this is an Airtel number and send via the Airtel SMS API. If that fails, I retry via MTN. I log the outcome either way.

#### Acceptance Criteria

**`convex/notifications/sms.ts` (Convex Action — can call external APIs):**

- [ ] `sendSms` internal action:
  - Args: `{ to: string, body: string, schoolId: Id<'schools'>, notificationId: Id<'notifications'> }`
  - Detects carrier from number prefix: Zambia network prefix map in `src/lib/constants/zambia.ts`
  - Tries preferred provider first; falls back automatically
  - Updates `notifications` record status: `queued` → `sent` → `delivered` (on callback) or `failed`
  - Logs full API response to `notifications.providerResponse` field
  - Returns `{ success: boolean, provider: string, messageId: string }`

- [ ] **Airtel Zambia SMS API integration:**
  - Endpoint: Airtel Business API (OAuth2 client credentials)
  - Auth token cached in Convex storage (refresh before expiry)
  - Sender ID: configurable per school (`school.smsProvider === 'airtel'`)
  - Error codes mapped to human-readable messages

- [ ] **MTN Zambia SMPP integration:**
  - SMPP connection via HTTP gateway (MTN's web API)
  - Fallback for Airtel failures and for MTN subscribers

- [ ] **Schema additions to `notifications` table:**

  ```typescript
  // Add to notifications table
  providerMessageId: v.optional(v.string()),
  providerResponse: v.optional(v.string()),
  retryCount: v.number(),
  nextRetryAt: v.optional(v.number()),
  ```

- [ ] **Retry queue:** `crons.ts` — job runs every 5 minutes checking for `status: 'failed'` notifications with `retryCount < 3` and `nextRetryAt <= now()`

- [ ] **SMS balance deduction:** after successful send, decrement `school.smsBalance` by 1
- [ ] **Low balance alert:** when balance drops below 50 units, create in-app notification for admin
- [ ] **Development mode:** if `NEXT_PUBLIC_APP_ENV === 'development'`, log SMS body to console instead of sending; set status to `'sent'` immediately

---

### ISSUE-073 · Absence SMS Alert System

**Type:** Backend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Automatically notify guardians when their child is marked absent. This is the most high-value notification in the system — it is the main reason schools adopt the platform.

#### User Story

> At 07:50, Mr. Phiri submits Grade 9A's register. Chanda Banda is marked absent. At 07:55, Chanda's mother receives an SMS: "Dear Mrs. Banda, your child Chanda was absent from school today, Thursday 15 May 2025. Contact: Kabulonga Boys 0211 123456."

#### Acceptance Criteria

**`convex/notifications/absenceAlerts.ts`:**

- [ ] `sendAbsenceSMS` internal action (scheduled by `markBulkAttendance` mutation):
  - Loads student + guardianLinks
  - Finds guardians with `receiveSMS: true` AND `receiveAttendanceSMS: true`
  - Constructs message from school's custom template (or default):
    > "Dear [GuardianName], your child [StudentName] was marked ABSENT on [Date]. If this is an error, contact [School] on [SchoolPhone]."
  - Calls `sendSms` action for each qualifying guardian phone
  - Logs notification record

- [ ] **Deduplication**: if student is marked absent, then the register is corrected to present, send a follow-up "Correction SMS": "Update: [StudentName] is now showing as PRESENT on [Date]."
- [ ] **Custom SMS templates** per school: stored in `school.smsTemplates` object (schema addition):
  ```typescript
  smsTemplates: v.optional(
    v.object({
      absenceAlert: v.optional(v.string()), // Supports {{guardianName}}, {{studentName}}, {{date}}
      feeReminder: v.optional(v.string()), // Sprint 02
      resultRelease: v.optional(v.string()), // Sprint 01 exam results
      schoolClosure: v.optional(v.string()), // General broadcast
    }),
  );
  ```
- [ ] Template preview in school settings: shows rendered SMS with sample data

---

### ISSUE-074 · Broadcast SMS to Parents and Staff

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

School admin can send mass SMS messages to any combination of guardians, staff, or students. Essential for school closure alerts, exam timetable releases, results announcements.

#### Acceptance Criteria

**`convex/notifications/broadcast.ts`:**

- [ ] `sendBroadcastSMS` mutation:
  - Args: `{ target: 'all_guardians' | 'grade_guardians' | 'section_guardians' | 'all_staff' | 'custom_numbers', gradeId?, sectionId?, customNumbers?: string[], message: string }`
  - Calculates recipient count before sending (shown to admin as preview)
  - Deduplicates phone numbers (a guardian with 3 children only gets 1 SMS)
  - Creates one `notifications` record per recipient phone number
  - Schedules `sendSms` action for each
  - Returns `{ recipientCount, estimatedCost, notificationBatchId }`
  - Requires `requirePermission(ctx, Permission.SEND_BULK_SMS)`

**Frontend — `/(admin)/notifications/compose/page.tsx`:**

- [ ] Recipient selector: All Guardians / By Grade / By Section / All Staff / Custom Numbers
- [ ] Character counter (160 chars = 1 SMS unit; warns at 155, 315 chars)
- [ ] Recipient count preview: "This will send to 347 numbers (estimated 347 SMS units)"
- [ ] SMS balance check: warns if balance insufficient
- [ ] Send confirmation: "Are you sure? This cannot be undone."
- [ ] Sent history: list of past broadcasts with recipient count, delivery stats, message preview

---

### ISSUE-075 · In-App Notification Centre — Backend (Functional)

**Type:** Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Complete the in-app notification backend — making the notification bell (from Sprint 00 ISSUE-036) functional with real data. Every system action that triggers an SMS also creates an in-app notification.

#### Acceptance Criteria

- [ ] `createNotification` internal mutation — used by all other notification-triggering code:
  ```typescript
  // Internal — called by absence alerts, fee reminders, broadcasts, etc.
  export const createNotification = internalMutation({
    args: {
      schoolId: v.id('schools'),
      recipientUserId: v.optional(v.id('users')),
      recipientPhone: v.optional(v.string()),
      type: v.string(), // 'absence_alert', 'fee_reminder', etc.
      channel: v.string(),
      subject: v.optional(v.string()),
      body: v.string(),
      relatedEntityType: v.optional(v.string()),
      relatedEntityId: v.optional(v.string()),
    },
  });
  ```
- [ ] `getUnreadCount` query: returns count for the topbar bell badge
- [ ] `getMyNotifications` query: paginated list for the notification centre
- [ ] `markAsRead`, `markAllAsRead` mutations
- [ ] Notification categories with icons and colors: attendance, results, fees, system, emergency

---

## Epic 9 — Exams & Mark Entry

> **Goal:** A complete exam management system supporting ECZ-style term exams for primary/secondary AND GPA/credit-based exams for colleges. Mark entry is locked per-teacher, grade computation is automatic.

---

### ISSUE-076 · Exam Session Management

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Create and manage exam sessions (CA1, CA2, Terminal, Mock, Final). An exam session defines the assessment event; exam results are individual student scores within that session.

#### User Story

> As a school admin, I create "Term 1 CA1" as an exam session for the current term. I assign it to all sections, set a max mark of 30, and open it for mark entry. Teachers can now enter marks.

#### Acceptance Criteria

**Backend — `convex/exams/sessions.ts`:**

- [ ] `createExamSession` mutation:
  - Requires `requirePermission(ctx, Permission.CREATE_EXAM_SESSION)`
  - Validates no duplicate `type` + `termId` for the same school (e.g., can't have two CA1s in the same term)
  - Creates the session with `isLocked: false`
  - For `academicMode: 'semester'` schools: session types are `'midterm'` and `'final'` instead of ECZ types
- [ ] `openExamSession` mutation: sets session to accepting marks
- [ ] `lockExamSession` mutation:
  - Sets `isLocked: true`
  - Validates that all sections have marks entered (warns if any section has 0 entries)
  - Triggers grade computation (ISSUE-082)
  - Requires `requirePermission(ctx, Permission.LOCK_MARKS)`
- [ ] `getExamSessionsByTerm` query
- [ ] `getMarkEntryStatus` query: for each section + subject, returns: `{ staffId, staffName, totalStudents, marksEntered, percentComplete }`
  - Real-time — teachers see their colleagues' progress
  - Used by admin to chase up missing marks before locking

**Frontend — `/(admin)/exams/sessions/page.tsx`:**

- [ ] Timeline of exam sessions per term (ordered by date)
- [ ] Session status: Draft → Open → Locked → Results Published
- [ ] Mark entry progress matrix: rows = sections, columns = subjects, cells = % complete
- [ ] "Lock Session" button with pre-lock validation modal
- [ ] "Chase Missing Marks" action: sends in-app notification to teachers with incomplete marks

---

### ISSUE-077 · Mark Entry Interface for Teachers

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 1.5 days

#### Description

The mark entry screen used by teachers. Fast, keyboard-navigable, and accessible from the teacher portal. Teachers only see their own assigned subjects.

#### User Story

> As Mr. Phiri (Grade 9A, 9B, 10A Mathematics teacher), I open mark entry for "Term 1 CA1". I see three subject-section combinations. I click into Grade 9A Mathematics and see 35 students. I type marks with Tab key to advance to the next student. I submit.

#### Acceptance Criteria

**Backend — `convex/exams/results.ts`:**

- [ ] `saveMarksBulk` mutation:
  - Args: `{ examSessionId, sectionId, subjectId, marks: Array<{ studentId, score: number | null, isAbsent: boolean, remarks?: string }> }`
  - Validates score is between 0 and `examSession.maxMarks`
  - If `isAbsent: true`, `score` must be null
  - Upserts records (insert or update based on existing `studentId + sessionId + subjectId`)
  - Validates session is not locked before allowing saves
  - Requires teacher's `staffSubjectAssignments` record covers this `sectionId` + `subjectId`
  - Auto-saves — no explicit "save" needed; UI calls this every 10 seconds or on each row change

- [ ] `getMarksForEntry` query:
  - Returns all students in section with their current score for this session/subject
  - Returns `examSession.maxMarks` and `isLocked`
  - Real-time — if another device saves marks, this query updates

**Frontend — `/(teacher)/marks/[sessionId]/[sectionId]/[subjectId]/page.tsx`:**

- [ ] Mark entry table: student photo, name, student number, score input, absent checkbox, remarks
- [ ] Score input: number input with max validation; turns green when valid, red when over max
- [ ] Absent checkbox: checking it clears and disables the score field
- [ ] Keyboard navigation: `Tab` moves to next student score input (skips absent students)
- [ ] Auto-save indicator: "Last saved 3 seconds ago" — reassures teacher their work is safe
- [ ] Progress: "28 of 35 marks entered" counter
- [ ] Class statistics panel (live): average, highest, lowest, distribution bar — updates as marks entered
- [ ] Locked state: when session is locked, all inputs disabled with "Session Locked" banner
- [ ] "Import from CSV" option: for teachers who prefer spreadsheet entry

---

### ISSUE-078 · Admin Mark Entry Override

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

School admins can enter or edit marks on behalf of any teacher, and can edit marks even after a session is locked (with audit trail).

#### Acceptance Criteria

- [ ] Admin mark entry page: same UI as teacher's but without the subject restriction filter
- [ ] Post-lock edit: `editLockedMark` mutation — requires `requirePermission(ctx, Permission.LOCK_MARKS)`, records the change in `markAuditLog` table
- [ ] Mark audit log:
  ```typescript
  markAuditLog: defineTable({
    schoolId: v.id('schools'),
    examResultId: v.id('examResults'),
    previousScore: v.optional(v.number()),
    newScore: v.optional(v.number()),
    editedBy: v.id('users'),
    reason: v.string(),
    editedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_result', ['examResultId']);
  ```
- [ ] Admin can view audit log per exam session: who changed what, when, why

---

### ISSUE-079 · ECZ Mock Exam Tracking

**Type:** Backend + Frontend | **Priority:** P2 | **Estimate:** 0.5 days | **Feature Gate:** `Feature.ECZ_EXAMS`

#### Description

For Grade 9 and Grade 12 classes (ECZ examination years), track mock exam performance and compare against ECZ target grades. This helps identify students needing intervention before the real ECZ exam.

#### Acceptance Criteria

**Schema addition:**

```typescript
eczMockTargets: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  subjectId: v.id('subjects'),
  targetGrade: v.string(), // '5', '6', '7', '8', '9' (ECZ scale)
  academicYearId: v.id('academicYears'),
  setBy: v.id('staff'),
  notes: v.optional(v.string()),
}).index('by_student', ['studentId']);
```

- [ ] For ECZ exam year grades, class teacher can set target ECZ grades per student per subject
- [ ] Mock exam session results show "vs Target" column: green if at/above target, red if below
- [ ] Admin dashboard widget for Grade 12 teacher: "12 students below target in Mathematics"

---

### ISSUE-080 · Exam Seating Plan Generator

**Type:** Backend + Frontend | **Priority:** P2 | **Estimate:** 0.5 days

#### Description

Generate a seating plan for exams. Useful for terminal exams where students from different sections sit together to prevent cheating.

#### Acceptance Criteria

**Schema addition:**

```typescript
examSeatingPlans: defineTable({
  schoolId: v.id('schools'),
  examSessionId: v.id('examSessions'),
  venue: v.string(), // 'Main Hall', 'Room 12'
  capacity: v.number(),
  seats: v.array(
    v.object({
      seatNumber: v.number(),
      studentId: v.id('students'),
      row: v.number(),
      column: v.number(),
    }),
  ),
  generatedAt: v.number(),
  generatedBy: v.id('users'),
}).index('by_session', ['examSessionId']);
```

- [ ] Admin selects: exam session, sections participating, venue, capacity
- [ ] Auto-generate: seats assigned randomly, interleaving students from different sections
- [ ] Manual overrides: drag student to different seat
- [ ] Print seating chart: printable PDF grid showing seat number → student name
- [ ] Export student-facing version: "Your Seat is [Number] in [Venue]" — bulk SMS option

---

## Epic 10 — Grading Engine

> **Goal:** An automatic, configurable grading system that supports ECZ's 1–9 scale, percentage-based grading, and GPA-based grading. Grades are computed from marks using the school's configured thresholds — never hardcoded.

---

### ISSUE-081 · Grading Scale Configuration

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Each school configures their grading scale. ECZ schools use the official ECZ scale; colleges may use a percentage or GPA scale. The grading scale translates a raw score (percentage) into a grade symbol.

#### Acceptance Criteria

**Schema addition to `schools`:**

```typescript
gradingScales: v.array(
  v.object({
    id: v.string(), // UUID
    name: v.string(), // 'ECZ Primary Scale', 'ECZ Secondary Scale', 'College GPA'
    isDefault: v.boolean(),
    entries: v.array(
      v.object({
        minPercent: v.number(), // 0–100
        maxPercent: v.number(),
        symbol: v.string(), // 'A', 'B', '7', '3.5 GPA'
        label: v.string(), // 'Distinction', 'Merit', 'Credit', 'Fail'
        gradePoints: v.optional(v.number()), // For GPA: 4.0, 3.5, 3.0...
        isPassing: v.boolean(),
      }),
    ),
  }),
);
```

**Pre-configured scales seeded at school creation:**

- ECZ Primary scale (Grades 1–7): 80–100 = 1 (Outstanding), 70–79 = 2, 60–69 = 3, 50–59 = 4, 40–49 = 5, 30–39 = 6, 20–29 = 7, 0–19 = 9 (Fail)
- ECZ Secondary scale (Grades 8–12): same 1–9 but with subject-specific interpretations
- College percentage scale: A(70+), B(60–69), C(50–59), D(40–49), F(<40)
- College GPA scale: A=4.0, A-=3.7, B+=3.3, B=3.0... F=0.0

**Frontend — `/(admin)/settings/grading/page.tsx`:**

- [ ] View and edit grading scale entries (threshold, symbol, label, isPassing)
- [ ] Add custom scale for technical subjects with practical components
- [ ] Visual indicator showing grade distribution at current thresholds

---

### ISSUE-082 · Automatic Grade Computation

**Type:** Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

When marks are entered and a session is locked, the system automatically computes grades for every student. For multi-session terms, it computes weighted aggregates. For GPA schools, it computes credit-weighted GPA.

#### Acceptance Criteria

**`convex/exams/grading.ts`:**

- [ ] `computeGradesForSession` internal mutation — called by `lockExamSession`:
  - For each `examResults` record in the session:
    - Calculates `percent = (score / maxMarks) * 100`
    - Looks up `school.gradingScales` to find matching entry
    - Sets `examResults.grade` and `examResults.gradePoints`
  - Returns summary stats per subject: class average, grade distribution

- [ ] `computeTermAggregate` internal action — called after ALL sessions in a term are locked:
  - Computes weighted term aggregate per student per subject:
    ```
    For ECZ: aggregate = (CA1 * 0.1) + (CA2 * 0.1) + (CA3 * 0.1) + (Terminal * 0.7)
    Weights configurable per exam session (examSession.weightPercent)
    ```
  - For GPA schools: computes credit-weighted GPA for the term
  - Creates/updates `termAggregates` records (schema below)
  - Computes class position/rank per subject and overall

- [ ] **Schema addition:**

  ```typescript
  termAggregates: defineTable({
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    sectionId: v.id('sections'),
    termId: v.id('terms'),
    subjectResults: v.array(
      v.object({
        subjectId: v.id('subjects'),
        totalScore: v.number(), // Weighted aggregate
        totalPercent: v.number(),
        grade: v.string(),
        gradePoints: v.optional(v.number()),
        isCredit: v.boolean(), // For GPA: did student earn credits?
        creditHours: v.optional(v.number()),
        subjectRank: v.number(), // Rank in section for this subject
      }),
    ),
    overallPercent: v.number(),
    overallGrade: v.string(),
    termGpa: v.optional(v.number()), // GPA schools only
    sectionRank: v.number(), // Overall rank in section
    gradeRank: v.number(), // Overall rank in grade (all sections)
    totalStudentsInSection: v.number(),
    totalStudentsInGrade: v.number(),
    teacherRemarks: v.optional(v.string()), // Class teacher adds term remarks
    attendancePercent: v.optional(v.number()), // Pulled from attendance at report card gen
    computedAt: v.number(),
  })
    .index('by_student_term', ['studentId', 'termId'])
    .index('by_section_term', ['sectionId', 'termId'])
    .index('by_school_term', ['schoolId', 'termId']);
  ```

- [ ] Rank computation is per-section: all students in 9A ranked against each other
- [ ] Grade-level rank: all students in Grade 9 (all sections combined) ranked
- [ ] Re-computation: if a locked mark is edited by admin, `computeTermAggregate` re-runs automatically for that student

---

### ISSUE-083 · Teacher Remarks and Class Teacher Sign-Off

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Class teachers must add overall term remarks for each student before the report card is generated. This is a required step in the Zambian school system.

#### Acceptance Criteria

- [ ] `saveTeacherRemarks` mutation: class teacher adds remark to `termAggregates.teacherRemarks`
  - Free-text or selectable from a pre-defined remark bank
  - Can only be done by the section's class teacher or admin
- [ ] Remark bank: school can configure common remarks e.g.:
  - "Excellent performance. Keep it up."
  - "A promising student. Needs to improve consistency."
  - "Must work harder. Seek extra help from teachers."
- [ ] `/(teacher)/my-class/remarks/page.tsx` — class teacher's bulk remarks entry screen
  - Shows all students in their section with their performance tier
  - Quick-assign from remark bank; or free text
  - Progress: "28 of 35 remarks added"
- [ ] Generating a report card blocks if `teacherRemarks` is empty (configurable — some schools don't require it)

---

## Epic 11 — Report Card Generation

> **Goal:** Professional, school-branded PDF report cards that look like official Zambian school report cards — not generic printouts. Generated server-side so they are consistent regardless of browser or device.

---

### ISSUE-084 · Report Card PDF Engine

**Type:** Backend | **Priority:** P0 | **Estimate:** 1.5 days

#### Description

The server-side PDF generation engine for report cards. Uses `@react-pdf/renderer` in a Convex Action. The generated PDF is uploaded to Cloudinary and a `studentDocuments` record is created so it's permanently accessible.

#### Acceptance Criteria

**`convex/exams/reportCards.ts` → `generateReportCard` action:**

- [ ] Accepts: `{ studentId, termId }` (or bulk: `{ sectionId, termId }` for batch generation)
- [ ] Fetches: student details, school branding, `termAggregates` record, attendance summary, `teacherRemarks`, `school.gradingScales`
- [ ] Generates PDF using `@react-pdf/renderer` with school-specific layout
- [ ] Uploads PDF to Cloudinary with path: `report-cards/{schoolSlug}/{year}/{term}/{studentNumber}.pdf`
- [ ] Creates/updates `studentDocuments` record: `type: 'report_card'`
- [ ] Batch generation: Convex action processes up to 50 students per call; admin triggers per section
- [ ] `getReportCardStatus` query: for each student in a section, returns whether their report card has been generated and when

**PDF Layout — Two Modes:**

_Primary Mode (Grades 1–7):_

- School header with logo and motto
- Student details: name, grade, section, academic year, term
- Results table: Subject | CA | Terminal | Total | Grade | Remarks
- Class teacher remarks (narrative)
- Attendance summary: Days Present / Days Absent / Total School Days / Attendance %
- Next term start date
- Principal and Class Teacher signature lines

_Secondary/College Mode (Grades 8–12, College):_

- Same header
- Results table: Subject | CA1 | CA2 | Terminal | Aggregate | Grade | Position
- Subject teacher remarks column
- Overall position in class: "Position: 5 out of 35"
- Grade-level position: "Position: 14 out of 105"
- Class teacher remarks
- Grade-point average (college mode only)
- Next term date + fees due notice (Sprint 02 adds the fee amount here — field reserved as blank for now)

---

### ISSUE-085 · Report Card Template Customisation

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 1 day

#### Description

School admins can customize the report card template: add/remove sections, choose layout (primary vs secondary style), configure which data appears.

#### Acceptance Criteria

**Schema addition to `schools`:**

```typescript
reportCardConfig: v.object({
  layout: v.union(v.literal('primary'), v.literal('secondary'), v.literal('college')),
  showAttendance: v.boolean(),
  showClassPosition: v.boolean(),
  showGradePosition: v.boolean(),
  showTeacherRemarks: v.boolean(),
  showSubjectTeacherRemarks: v.boolean(),
  showNextTermDate: v.boolean(),
  showFeesDueNotice: v.boolean(), // Sprint 02 populates the actual amount
  showMotto: v.boolean(),
  headerNote: v.optional(v.string()), // Custom note at top of report card
  footerNote: v.optional(v.string()), // Custom note at bottom
  principalSignatureName: v.optional(v.string()),
  principalTitle: v.optional(v.string()), // 'Head Teacher', 'Principal'
});
```

- [ ] Settings page at `/(admin)/settings/report-card`
- [ ] Live preview of the report card template (rendered in a sandboxed iframe)
- [ ] Toggle checkboxes for each configurable section
- [ ] Header note and footer note text inputs (markdown supported for bold/italic)

---

### ISSUE-086 · Bulk Report Card Generation and Release

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Admin generates report cards for an entire section in one operation, then releases them (makes them visible to parents and students). Releasing sends an SMS notification to all guardians.

#### Acceptance Criteria

**`convex/exams/reportCards.ts`:**

- [ ] `generateReportCardsForSection` action:
  - Checks all pre-conditions: term locked, all teacher remarks added
  - Processes students in batches of 10 (Convex action timeout protection)
  - Returns progress as the action runs (Convex streaming-friendly)
- [ ] `releaseReportCards` mutation:
  - Sets `termAggregates.isReleased: true` for all students in section
  - Triggers SMS to all guardians: "Dear [Name], [StudentName]'s Term [X] report card is ready. View at: [parentPortalUrl]"
- [ ] `releaseStatus` query: per-section — total / generated / released counts

**Frontend — `/(admin)/exams/report-cards/page.tsx`:**

- [ ] Section selector → shows generation status per section
- [ ] Generate button per section: shows progress bar as PDFs generate
- [ ] Preview individual report card before releasing
- [ ] "Release to Parents" button — only enabled when all cards generated
- [ ] Released status: "Released 15 Nov 2025 — 35 guardians notified"

---

### ISSUE-087 · Report Card Download for Students and Parents

**Type:** Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Students and parents can download their report cards from the portal. This is the most-used feature by guardians after fee payment.

#### Acceptance Criteria

- [ ] Student portal: `/(student)/results/page.tsx` — list of report cards per term, download button
- [ ] Parent portal (ready for Sprint 03): `getReportCardsForStudent` query available, returns signed Cloudinary download URL
- [ ] Download link is a signed Cloudinary URL that expires in 24 hours (security — cannot share raw permanent links)
- [ ] PDF loads inline in the browser (no forced download) — better mobile experience
- [ ] Share button: generates a temporary shareable link that can be sent via WhatsApp (valid 7 days)

---

## Epic 12 — Student & Academic Analytics

> **Goal:** Foundation analytics that inform teacher intervention and admin decision-making. The data structures here directly feed the AI at-risk engine in Sprint 07.

---

### ISSUE-088 · Student Performance Dashboard

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

A per-student analytics view showing their academic trajectory across terms and years. Visible to admin, class teacher, and (in read-only form) the student themselves.

#### Acceptance Criteria

**`convex/exams/analytics.ts`:**

- [ ] `getStudentAcademicHistory` query:
  - Returns `termAggregates` for all terms the student has been in the school
  - Ordered chronologically
  - Includes subject-level breakdown per term
- [ ] `getSubjectPerformanceTrend` query:
  - For a given student + subject: returns score per term as a trend line
  - Used to show if a student is improving or declining in a specific subject

**Frontend — Student Profile "Academic" Tab:**

- [ ] Line chart: overall term average per term (recharts `LineChart`)
- [ ] Subject radar chart: all subjects' current term scores plotted on a radar
- [ ] Position tracker: section rank and grade rank per term (trend table)
- [ ] Subject deep-dive accordion: expand any subject to see CA1, CA2, Terminal scores per term

---

### ISSUE-089 · Section and Grade Performance Analytics

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 1 day

#### Description

Admin-level analytics comparing performance across sections and grades. The foundation for the MoE statistical reporting required in Sprint 07.

#### Acceptance Criteria

**`convex/exams/analytics.ts` (additions):**

- [ ] `getSectionPerformanceSummary` query:
  - For a given section + term: average per subject, grade distribution, pass rate
  - Returns structured data compatible with recharts `BarChart`
- [ ] `getGradeComparisonReport` query:
  - For a given grade + term: side-by-side comparison of all sections
  - Identifies best/worst performing sections and subjects
- [ ] `getSubjectAnalytics` query:
  - For a given subject + term: average across all sections, grade distribution
  - Identifies teachers/sections with significantly different performance (outliers)

**Frontend — `/(admin)/exams/analytics/page.tsx`:**

- [ ] Grade selector → Section comparison bar chart
- [ ] Subject performance heat map: sections × subjects, colored by average score
- [ ] Failing students alert: "14 students in Grade 10 scored below 40% in Mathematics"
- [ ] Year-on-year comparison: current year vs previous year average (requires 2+ years of data)

---

### ISSUE-090 · Academic Foundation — MoE Reporting Scaffolding

**Type:** Backend | **Priority:** P2 | **Estimate:** 0.5 days

#### Description

Scaffold the MoE (Ministry of Education) reporting data layer. The actual report generation UI is in Sprint 07, but the queries must be defined now so that they are informed by the correct data structures from Sprint 01.

#### Acceptance Criteria

- [ ] `convex/reports/moe.ts` — file created with function signatures (not yet implemented):
  ```typescript
  // Defined now, implemented in Sprint 07
  export const getMoeEnrolmentReturn = query({ ... })     // Student numbers by grade/gender
  export const getMoeAttendanceReturn = query({ ... })    // Attendance rates by grade
  export const getMoeResultsReturn = query({ ... })       // Pass rates by subject/grade
  export const getMoeStaffReturn = query({ ... })         // Teacher qualification/deployment
  ```
- [ ] Each function returns `{ status: 'not_implemented' }` for now
- [ ] `/(admin)/reports/moe/page.tsx` — placeholder page with "Coming in Phase 7" message
- [ ] Document in the file: which schema fields from Sprint 01 are sourced for each return

---

## Schema Additions in This Sprint

The following additions are made to `convex/schema.ts` in this sprint. These are **additions only** — no existing Sprint 00 tables are modified.

| New Table                 | Defined In |
| ------------------------- | ---------- |
| `schoolEvents`            | ISSUE-043  |
| `lessonPlans`             | ISSUE-046  |
| `counters`                | ISSUE-048  |
| `studentDocuments`        | ISSUE-052  |
| `transfers`               | ISSUE-053  |
| `sectionHistory`          | ISSUE-056  |
| `staffSubjectAssignments` | ISSUE-059  |
| `staffAttendance`         | ISSUE-060  |
| `leaveRequests`           | ISSUE-061  |
| `markAuditLog`            | ISSUE-078  |
| `eczMockTargets`          | ISSUE-079  |
| `examSeatingPlans`        | ISSUE-080  |
| `termAggregates`          | ISSUE-082  |

**Fields added to existing tables:**

| Table            | New Fields                                                           | Added In        |
| ---------------- | -------------------------------------------------------------------- | --------------- |
| `schools`        | `periodConfig`, `smsTemplates`, `gradingScales`, `reportCardConfig`  | Multiple issues |
| `timetableSlots` | `isPublished`, `week`, `notes`                                       | ISSUE-062       |
| `notifications`  | `providerMessageId`, `providerResponse`, `retryCount`, `nextRetryAt` | ISSUE-072       |
| `examResults`    | `gradePoints`, `computedGrade`                                       | ISSUE-082       |
| `termAggregates` | `isReleased`                                                         | ISSUE-086       |
| `lmsCourses`     | (already has needed fields from Sprint 00 skeleton)                  | —               |

---

## Dependency Graph

```
ISSUE-041 (Academic Year)
    └─► ISSUE-042 (Terms)
    └─► ISSUE-043 (Calendar Events) ──► ISSUE-066 (isSchoolDay check)

ISSUE-044 (Subjects) ──► ISSUE-059 (Staff Assignments) ──► ISSUE-062 (Timetable)
ISSUE-045 (Grades)   ──► ISSUE-055 (Sections)          ──► ISSUE-062 (Timetable)
    └─► ISSUE-048 (Enrolment)
            └─► ISSUE-049 (Profile View)
            └─► ISSUE-050 (Student List)
            └─► ISSUE-053 (Transfer)
            └─► ISSUE-054 (Promotion) ─── requires ISSUE-082 (Grades for promotion suggestion)

ISSUE-055 (Sections)
    └─► ISSUE-056 (Section History)
    └─► ISSUE-057 (Section Transfer)
    └─► ISSUE-058 (Class Teacher View)

ISSUE-066 (Attendance Backend) ──► ISSUE-067 (Offline PWA Register)
    └─► ISSUE-068 (Night Prep) [BOARDING feature]
    └─► ISSUE-069 (Period Attendance) [PERIOD_ATTENDANCE feature]
    └─► ISSUE-070 (Chronic Absence)
    └─► ISSUE-071 (Attendance Reports)

ISSUE-072 (SMS Layer)
    └─► ISSUE-073 (Absence SMS)
    └─► ISSUE-074 (Broadcast SMS)
    └─► ISSUE-075 (In-App Notifications)

ISSUE-076 (Exam Sessions)
    └─► ISSUE-077 (Mark Entry)
    └─► ISSUE-078 (Admin Override)
    └─► ISSUE-081 (Grading Scales)
            └─► ISSUE-082 (Grade Computation)
                    └─► ISSUE-083 (Teacher Remarks)
                            └─► ISSUE-084 (Report Card PDF)
                                    └─► ISSUE-086 (Bulk Generation + Release)
                                    └─► ISSUE-087 (Parent Download)

ISSUE-088 (Student Analytics) ──── requires ISSUE-082 complete
ISSUE-089 (Section Analytics) ──── requires ISSUE-082 complete
ISSUE-090 (MoE Scaffolding)   ──── can be done any time
```

---

## Definition of Done

All Sprint 00 DoD criteria apply, plus:

- [ ] **Offline tested**: Attendance register tested with Chrome DevTools Network throttling set to "Offline". Marks sync correctly when connection restored.
- [ ] **Multi-school-type tested**: Each new feature tested against all three seed schools (day secondary, boarding secondary, college). Grading mode differences verified.
- [ ] **Feature flag tested**: Any feature-gated UI verified to be completely absent when the flag is off. Not just hidden — not rendered at all.
- [ ] **SMS tested**: In development mode, all SMS-triggering actions produce console output with the correct message body, recipient, and template. No real SMS sent in dev.
- [ ] **PDF verified**: All generated PDFs opened and visually inspected on both desktop and mobile before the issue is closed. School branding colors applied correctly.
- [ ] **Rank computation verified**: After entering marks for a complete section, confirm section rank and grade rank are computed correctly (1 = highest, n = lowest).
- [ ] **Retroactive edit window respected**: Attendance cannot be edited more than 7 days back without admin permission.

---

## Sprint 01 → Sprint 02 Handoff Checklist

Before Sprint 02 (Fees & Finance) begins, verify:

- [ ] `students.currentSectionId` and `students.currentGradeId` are always current and reflect the correct academic year
- [ ] `students.boardingStatus` is correctly set for all seed students (day vs boarding)
- [ ] `counters` table is working — student numbers generated correctly (Sprint 02 will add `invoice_number_{year}` counter to the same table)
- [ ] `terms` are created and the active term is set — Sprint 02's invoice generation scopes invoices to `currentTermId`
- [ ] `guardians` table has real linked data — Sprint 02 invoices are addressed to `guardianId` from `student.guardianLinks`
- [ ] `school.zraTpin` is set on all test schools — Sprint 02 will submit to ZRA VSDC immediately
- [ ] `school.siblingDiscountRules` are configured on at least one test school — Sprint 02 applies these during invoice generation
- [ ] `notifications` table is receiving real records (from absence SMSes) — Sprint 02 fee reminders write to the same table
- [ ] `sectionHistory` records exist for all seed students — Sprint 02 fee structure uses grade history for historical invoices
- [ ] `generateStudentNumber` helper is tested for atomicity (concurrent enrolments produce unique numbers) — Sprint 02 uses the same counter pattern for invoice numbers
- [ ] `schoolEvents` with `affectsAttendance: true` are tested — Sprint 02 will add fee due dates as events
- [ ] All seed school report cards are generated successfully as PDFs — Sprint 02 will add a "Fees Due" line item to future report cards
- [ ] Teacher mark entry is tested on mobile at 375px — critical since teachers use phones in Zambia

---

_Acadowl Development Guide — Sprint 01 — Core Academic Foundation_
_Last updated: 2025 | Previous Sprint: Sprint 00 — Infrastructure & Auth | Next Sprint: Sprint 02 — Fees & Finance_

