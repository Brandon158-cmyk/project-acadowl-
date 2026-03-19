# Acadowl — Sprint 05: LMS & Library

## Development Guide & Issue Tracker

> **Sprint Goal:** Transform Acadowl from a school management system into a complete learning platform. By the end of this sprint, every teacher has a structured course for each subject they teach, built directly from their timetable — no setup required. Students access lessons, watch videos, attempt AI-generated quizzes, and submit assignments from their phones. Teachers grade submissions and the scores flow automatically into the existing `examResults` table. The librarian manages a full book catalog, issues books by scanning student ID barcodes, and chases overdues automatically. Every data structure — courses, submissions, library issues — connects to the progress snapshot the Sprint 07 at-risk engine reads. Nothing built in Sprints 00–04 changes. Everything connects.

---

## 📋 Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [Continuity from Sprints 00–04](#continuity-from-sprints-0004)
3. [Forward-Compatibility Commitments](#forward-compatibility-commitments)
4. [LMS Architecture Philosophy](#lms-architecture-philosophy)
5. [Epic 1 — Course Structure & Lifecycle](#epic-1--course-structure--lifecycle)
6. [Epic 2 — Content Authoring](#epic-2--content-authoring)
7. [Epic 3 — AI Quiz Generator](#epic-3--ai-quiz-generator)
8. [Epic 4 — Assignments & Submissions](#epic-4--assignments--submissions)
9. [Epic 5 — Grading, Feedback & Marks Integration](#epic-5--grading-feedback--marks-integration)
10. [Epic 6 — Student Learning Portal](#epic-6--student-learning-portal)
11. [Epic 7 — LMS Messaging & Discussion](#epic-7--lms-messaging--discussion)
12. [Epic 8 — LMS Engagement Analytics](#epic-8--lms-engagement-analytics)
13. [Epic 9 — Library Catalog Management](#epic-9--library-catalog-management)
14. [Epic 10 — Book Issuing & Returns](#epic-10--book-issuing--returns)
15. [Epic 11 — E-Library & Digital Resources](#epic-11--e-library--digital-resources)
16. [Epic 12 — Library Analytics & Overdue Management](#epic-12--library-analytics--overdue-management)
17. [Epic 13 — Portal Integrations](#epic-13--portal-integrations)
18. [Dependency Graph](#dependency-graph)
19. [Schema Additions in This Sprint](#schema-additions-in-this-sprint)
20. [Definition of Done](#definition-of-done)
21. [Sprint 05 → Sprint 06 Handoff Checklist](#sprint-05--sprint-06-handoff-checklist)

---

## Sprint Overview

| Field              | Value                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| **Sprint Name**    | Sprint 05 — LMS & Library                                                         |
| **Duration**       | 6 weeks                                                                           |
| **Team Size**      | 3–4 developers                                                                    |
| **Total Issues**   | 44                                                                                |
| **Feature Gates**  | `Feature.LMS` (core) · `Feature.AI_QUIZ` · `Feature.LIBRARY` · `Feature.ELIBRARY` |
| **Prerequisite**   | Sprint 04 complete and all handoff checks passed                                  |
| **AI Integration** | Anthropic Claude API via `claude-sonnet-4-20250514` for quiz generation           |

### Sprint Epics at a Glance

| #   | Epic                                   | Issues | Est. Days |
| --- | -------------------------------------- | ------ | --------- |
| 1   | Course Structure & Lifecycle           | 4      | 4         |
| 2   | Content Authoring                      | 5      | 6         |
| 3   | AI Quiz Generator                      | 3      | 4         |
| 4   | Assignments & Submissions              | 4      | 4         |
| 5   | Grading, Feedback & Marks Integration  | 4      | 4         |
| 6   | Student Learning Portal                | 5      | 5         |
| 7   | LMS Messaging & Discussion             | 3      | 3         |
| 8   | LMS Engagement Analytics               | 3      | 3         |
| 9   | Library Catalog Management             | 4      | 4         |
| 10  | Book Issuing & Returns                 | 4      | 4         |
| 11  | E-Library & Digital Resources          | 3      | 3         |
| 12  | Library Analytics & Overdue Management | 3      | 3         |
| 13  | Portal Integrations                    | 4      | 3         |

---

## Continuity from Sprints 00–04

Verify every item below before writing any Sprint 05 code.

| Deliverable                                                                                                  | How Sprint 05 Uses It                                                                                                        |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `lmsCourses`, `lmsModules`, `lmsLessons`, `lmsSubmissions` skeleton tables (Sprint 00 ISSUE-008)             | Sprint 05 fully implements these tables — all field names are binding                                                        |
| `libraryBooks`, `libraryIssues` skeleton tables (Sprint 00 ISSUE-008)                                        | Sprint 05 fully implements these — `isbn`, `deweyCode` fields already in schema                                              |
| `Feature.LMS`, `Feature.AI_QUIZ`, `Feature.LIBRARY`, `Feature.ELIBRARY` flags (Sprint 00 ISSUE-023)          | Every LMS and library route, mutation, and nav item gated on these flags                                                     |
| **Homework already lives in `lmsLessons`** with `contentType: 'assignment'` (Sprint 01 ISSUE-047)            | Sprint 05 does NOT create new homework records — it wraps course/module structure around existing ones. Zero data migration. |
| `lessonPlans` table with `lmsLessonId: v.optional(v.id('lmsLessons'))` hook (Sprint 01 ISSUE-046)            | Sprint 05 converts lesson plans into LMS lessons via this pre-placed foreign key                                             |
| `staffSubjectAssignments` table — teacher → subject → section → term (Sprint 01 ISSUE-059)                   | Sprint 05 reads this to auto-create courses: one course per `staffId + subjectId + sectionId + termId` tuple                 |
| `timetableSlots` linking `staffId + subjectId + sectionId` (Sprint 01 ISSUE-062)                             | "Create Course" button shown next to each published timetable slot in the teacher portal                                     |
| `examResults` table linked by `subjectId + sectionId + examSessionId` (Sprint 01 ISSUE-078)                  | LMS graded assignment scores write back to `examResults` — same table, same schema                                           |
| `subjects.subjectId` as the primary FK for LMS courses (Sprint 01 ISSUE-044)                                 | `lmsCourses.subjectId` — validated against the school's subject registry                                                     |
| `studentProgressSnapshots.homeworkSubmissionRate` and `.homeworkOverdueCount` (Sprint 03 ISSUE-136)          | Friday cron already writes these from `lmsSubmissions`. Sprint 05 makes the data richer by adding `lmsEngagementScore`.      |
| `messageThreads` with `context: 'lms'` defined (Sprint 03 ISSUE-150)                                         | Sprint 05 creates LMS discussion threads using this value — no schema change                                                 |
| Student portal with homework submission (Sprint 03 ISSUE-167)                                                | Sprint 05 upgrades this into a full course viewer — same route, same components, richer data                                 |
| Student ID card barcode (Sprint 01 ISSUE-051)                                                                | Library: librarian scans the barcode to look up a student and issue/return books                                             |
| `students.currentSectionId` always current (Sprint 01 ISSUE-048)                                             | Course enrolment is section-based — students are auto-enrolled in courses for their section                                  |
| `schoolEvents` with `affectsAttendance: true` (Sprint 01 ISSUE-043)                                          | LMS deadline engine excludes school holidays when calculating overdue assignments                                            |
| `attendance` table — Sprint 05 LMS engagement query filters `period: 'night_prep'` out (Sprint 04 ISSUE-177) | Engagement score uses only day attendance correlation, not boarding                                                          |

---

## Forward-Compatibility Commitments

| Decision                                                                                            | Future Sprint Dependency                                                                                                                       |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **`lmsEngagementScore` stored on `studentProgressSnapshots`** — 0–100 composite score               | Sprint 07 at-risk engine uses this as one of its five primary risk indicators. Field defined in schema this sprint, Sprint 07 reads it.        |
| **`lmsCourses.gradeContributionPercent` field** — how much the course contributes to the term grade | Sprint 07 GPA/college mode reads this for weighted transcript calculations. Set now, consumed later.                                           |
| **Quiz `questionBank` is a separate table** — not embedded in `lmsLessons`                          | Sprint 07 will allow re-using questions across terms and courses. A bank, not a snapshot.                                                      |
| **Library `digitalResources` table uses `accessLevel` field**                                       | Sprint 07 college mode adds premium e-book access tied to course enrolment. Same table, new `accessLevel` value.                               |
| **`libraryIssues.renewalCount` field defined**                                                      | Sprint 07 MoE returns require average renewal rates per title.                                                                                 |
| **`lmsSubmissions.aiGradingData` field reserved**                                                   | Sprint 07 will add AI-assisted grading feedback for text submissions. Field is `v.optional(v.string())` stored as JSON — null until Sprint 07. |
| **LMS discussion threads use Sprint 03 `messageThreads`** with `context: 'lms'`                     | When Sprint 07 adds AI tutoring, it joins existing LMS threads as a participant. No schema change.                                             |
| **`lmsCourses.syllabusCoverage` array** — topics marked as taught                                   | Sprint 07 MoE returns require % syllabus coverage per subject per term. Populated by teachers as they mark lessons complete.                   |

---

## LMS Architecture Philosophy

Before writing any code, every developer must understand the three key architectural decisions that make Sprint 05 work without breaking what came before.

### 1. The Zero-Migration Upgrade

Sprint 01 created "homework courses" — auto-created `lmsCourses` and `lmsModules` records with a single `Homework Feed` module per section per term. Every assignment from Sprint 01 lives inside this structure. Sprint 05 does NOT delete or replace these. Instead:

- The auto-created "Homework Feed" course is **renamed** to the proper course name (e.g., "Mathematics — Grade 10A — Term 1 2025")
- New modules are added alongside the existing `Homework` module (e.g., "Chapter 1: Algebra", "Chapter 2: Geometry")
- Existing `lmsLessons` with `contentType: 'assignment'` remain exactly where they are — they are now "assignments" inside a proper module
- Teachers see all their existing homework in the new course structure without any migration or re-entry

The upgrade is triggered by `upgradeCourseFromHomeworkFeed` (ISSUE-219), which any teacher can run on their auto-created course. Schools that never enable `Feature.LMS` continue using the Sprint 01 homework flow with no impact.

### 2. Course Enrolment is Automatic

Students are **never** manually enrolled in courses. The enrolment engine reads `students.currentSectionId` and enrols every student in every active course for their section. When a student transfers to a new section (Sprint 01 ISSUE-053), they are automatically unenrolled from old-section courses and enrolled in new-section courses. The teacher never manages a class list — it is always derived from the section register.

### 3. LMS Grades Write Into the Academic Core

When a teacher grades an LMS assignment in Sprint 05, the score is written BOTH to `lmsSubmissions.score` AND to `examResults` (the Sprint 01 academic results table). This means:

- LMS assignment scores appear in the student's term aggregate (Sprint 01 ISSUE-082)
- They feed into report cards (Sprint 01 ISSUE-084)
- The academic system and LMS are never out of sync
- The integration requires that the teacher has specified `examSessionId` on the assignment — if not set, the score is saved to LMS only (a valid state for formative assessments)

---

## Epic 1 — Course Structure & Lifecycle

> **Goal:** Every teacher wakes up on the first day of term and their courses already exist — one per subject, pre-populated from their timetable assignment. The only work required is adding content.

---

### ISSUE-219 · Auto-Course Creation from Timetable Assignments

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1.5 days

#### Description

When a term activates and `Feature.LMS` is enabled, courses are automatically created for every `staffSubjectAssignment`. If a homework-feed course already exists for that `staffId + subjectId + sectionId + termId` tuple (from Sprint 01 ISSUE-047), it is upgraded in place — not recreated. If no course exists, a fresh one is created with a single `Assignments` module ready for content.

#### Acceptance Criteria

**Backend — `convex/lms/courses.ts`:**

- [ ] `provisionCoursesForTerm` internal action:
  - Triggered by `activateTerm` (Sprint 01 ISSUE-042) when `Feature.LMS` is enabled
  - For each `staffSubjectAssignment` record in the new term:
    1. Check if an `lmsCourses` record with matching `subjectId + sectionId + termId + staffId` already exists
    2. **If yes (homework-feed upgrade)**: call `upgradeCourseFromHomeworkFeed` (below)
    3. **If no**: create new `lmsCourses` record with default structure
  - Returns: `{ created: N, upgraded: N, skipped: N }`

- [ ] `upgradeCourseFromHomeworkFeed` internal mutation:
  - Updates `lmsCourses.title` from `"Homework Feed — Grade 10A Mathematics"` to `"Mathematics — Grade 10A — Term 1 2025"` (proper name)
  - Sets `lmsCourses.status: 'active'`
  - Sets `lmsCourses.isHomeworkOnly: false`
  - The existing `Homework Feed` module is renamed to `Assignments` — its `lmsLessons` records are untouched
  - Adds a default module: `{ title: 'Course Content', order: 0 }` — placed BEFORE the Assignments module
  - Does NOT change any `lmsLessons` or `lmsSubmissions` records

- [ ] `createCourse` mutation (manual creation for teachers who want a course not tied to a timetable slot):
  - Args: `{ subjectId, sectionId, termId, title, description? }`
  - Validates teacher has `staffSubjectAssignment` for this `subjectId + sectionId`
  - Requires `requirePermission(ctx, Permission.CREATE_COURSE)`

**Schema additions to `lmsCourses` (expanding Sprint 00 skeleton):**

```typescript
// Full implementation of the Sprint 00 lmsCourses skeleton
title: v.string(),
description: v.optional(v.string()),
subjectId: v.id('subjects'),
sectionId: v.id('sections'),
termId: v.id('terms'),
academicYearId: v.id('academicYears'),
staffId: v.id('staff'),                    // Primary teacher
coTeacherIds: v.optional(v.array(v.id('staff'))),
status: v.union(
  v.literal('draft'),                      // Not visible to students
  v.literal('active'),                     // Students can access
  v.literal('completed'),                  // Term ended
  v.literal('archived')                    // Hidden from all views
),
isHomeworkOnly: v.boolean(),               // True = Sprint 01 mode; False = full LMS
gradeContributionPercent: v.optional(v.number()), // % of term grade from this course (Sprint 07)
syllabusCoverage: v.array(v.object({       // Topics covered (Sprint 07 MoE use)
  topicCode: v.string(),
  topicName: v.string(),
  coveredAt: v.optional(v.string()),       // 'YYYY-MM-DD' when marked as taught
})),
coverImageUrl: v.optional(v.string()),     // Cloudinary URL
welcomeMessage: v.optional(v.string()),
totalLessons: v.number(),                  // Denormalised count for fast display
totalAssignments: v.number(),
publishedAt: v.optional(v.number()),
createdAt: v.number(),
updatedAt: v.number(),
```

**Schema additions to `lmsModules`:**

```typescript
order: v.number(),                         // Display order within course
description: v.optional(v.string()),
isVisible: v.boolean(),                    // Draft modules hidden from students
totalLessons: v.number(),                  // Denormalised count
createdAt: v.number(),
```

---

### ISSUE-220 · Student Course Enrolment Engine

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1 day

#### Description

Auto-enrol students into courses for their section. Enrolment is derived from `students.currentSectionId` — it is never managed manually. Handle the cases of student transfer (unenrol old, enrol new) and mid-term course creation.

#### Acceptance Criteria

**`convex/lms/enrolment.ts`:**

- [ ] `enrolStudentsInCourse` internal mutation:
  - Takes `courseId`
  - Queries all active students where `currentSectionId === course.sectionId`
  - Creates `lmsCourseEnrolments` record per student (schema below) with `status: 'active'`
  - Idempotent — safe to call multiple times (upsert pattern)

- [ ] `unenrolStudentFromSectionCourses` internal mutation:
  - Called by `transferStudentToSection` (Sprint 01 ISSUE-053) when student moves sections
  - Sets `lmsCourseEnrolments.status: 'transferred_out'` for all courses in the old section
  - Then calls `enrolStudentsInCourse` for each course in the new section

- [ ] `lmsCourseEnrolments` schema:

  ```typescript
  lmsCourseEnrolments: defineTable({
    schoolId: v.id('schools'),
    courseId: v.id('lmsCourses'),
    studentId: v.id('students'),
    status: v.union(
      v.literal('active'),
      v.literal('transferred_out'),
      v.literal('completed'),
      v.literal('exempt'), // e.g., student exempt from a subject
    ),
    completedLessons: v.number(), // Denormalised progress count
    totalLessons: v.number(), // Snapshot of course total at enrolment
    progressPercent: v.number(), // completedLessons / totalLessons * 100
    lastActivityAt: v.optional(v.number()),
    enrolledAt: v.number(),
  })
    .index('by_course', ['courseId'])
    .index('by_student', ['studentId'])
    .index('by_school', ['schoolId'])
    .index('by_course_student', ['courseId', 'studentId']);
  ```

- [ ] `getCourseRoster` query: all enrolled students for a course — used by teacher to see their class
- [ ] `getEnrolledCoursesForStudent` query: all active course enrolments for a student in current term — main query powering the student's course list

---

### ISSUE-221 · Course Management Interface — Teacher

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1 day

#### Description

The teacher's course management screen. Shows all their courses for the current term, pulled from their timetable assignments. Each course card links to the course builder.

#### Acceptance Criteria

**`convex/lms/teacherCourses.ts`:**

- [ ] `getTeacherCoursesForTerm` query:
  - Returns all `lmsCourses` where `staffId = currentUser.staffId` and `termId = activeTerm`
  - Per course: title, section name, total lessons, published lessons, pending submissions to grade, last updated
  - Sorted by section name then subject name

**Frontend — `/(teacher)/lms/page.tsx`:**

- [ ] Course card grid: cover image (or subject-coloured default), course title, section badge, stats row ("8 lessons · 12 submissions pending · 34 students")
- [ ] Status badge: "Draft" (gray) / "Active" (green) — one-click toggle to publish
- [ ] "Upgrade from Homework Feed" banner on cards where `isHomeworkOnly: true` — calls `upgradeCourseFromHomeworkFeed` and refreshes
- [ ] "Create Course" button: manual course creation form (for extra-curricular courses with no timetable slot)
- [ ] Term selector: view courses from past terms (read-only)
- [ ] Timetable integration panel: "Your timetable for this term — click any subject to view/create its course"

---

### ISSUE-222 · Course Builder Shell

**Type:** Frontend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1 day

#### Description

The course builder is the teacher's workspace for a single course. It has a persistent left-panel module/lesson tree and a right-panel content editor. This is the structural container for all course authoring.

#### Acceptance Criteria

**Frontend — `/(teacher)/lms/courses/[courseId]/page.tsx`:**

- [ ] Two-panel layout (collapsible on mobile):
  - **Left panel**: Course tree — modules as collapsible sections, lessons as indented items
    - Drag handles on modules and lessons for reordering
    - "+ Add Module" button at bottom
    - Lesson type icon: 📄 (text), 📎 (PDF), 🎬 (video), ❓ (quiz), 📝 (assignment)
    - Unread submission badge on assignment lessons: "12 to grade"
    - "Publish" toggle on each lesson (eye icon — controls student visibility)
  - **Right panel**: Lesson detail editor (content of ISSUE-225, 226, 227, 228)
- [ ] Course header: title (inline editable), section + subject chips, status toggle
- [ ] "View as Student" button: renders the course exactly as a student sees it — for pre-publication review
- [ ] Keyboard shortcuts: `Cmd+S` saves current lesson, `Cmd+Enter` publishes current lesson
- [ ] Module operations: right-click or "..." menu → Rename, Duplicate, Delete (only if no published lessons), Move up/down
- [ ] `addModule` mutation, `renameModule` mutation, `reorderModules` mutation, `deleteModule` mutation
- [ ] `reorderLessons` mutation: takes an array of `[lessonId, newOrder]` pairs — used by drag-and-drop

---

## Epic 2 — Content Authoring

> **Goal:** Teachers can create rich, multimedia lessons without needing to understand file hosting, embedding, or encoding. Upload a PDF, paste a YouTube link, or write formatted text — the system handles the rest.

---

### ISSUE-223 · Text Lesson Editor

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1 day

#### Description

A rich text editor for creating lesson notes, explanations, and reading material. The primary content type for most teachers. Must work on a 3G connection and produce content that renders well on both desktop and mobile.

#### Acceptance Criteria

**Schema additions to `lmsLessons` (full implementation of Sprint 00 skeleton):**

```typescript
// Full schema — expanding Sprint 00 skeleton
title: v.string(),
order: v.number(),
contentType: v.union(
  v.literal('text'),
  v.literal('pdf'),
  v.literal('video'),
  v.literal('quiz'),
  v.literal('assignment'),
  v.literal('link')              // External resource link — new type
),
// Content fields — populated based on contentType
textContent: v.optional(v.string()),       // HTML string from rich text editor
pdfUrl: v.optional(v.string()),            // Cloudinary URL
videoUrl: v.optional(v.string()),          // YouTube/Vimeo embed URL OR Cloudinary video
videoThumbnailUrl: v.optional(v.string()),
externalLinkUrl: v.optional(v.string()),
externalLinkDescription: v.optional(v.string()),
estimatedMinutes: v.optional(v.number()),  // Estimated reading/watch time
isVisible: v.boolean(),                    // False = draft, hidden from students
isMandatory: v.boolean(),                  // Required before accessing next lesson
dueDate: v.optional(v.string()),           // For assignments only — 'YYYY-MM-DD'
maxScore: v.optional(v.number()),          // For assignments and quizzes
examSessionId: v.optional(v.id('examSessions')), // If score writes to examResults
completionRequirement: v.union(
  v.literal('view'),                       // Mark complete on open
  v.literal('submit'),                     // Must submit
  v.literal('pass')                        // Must achieve passing score
),
syllabusTopic: v.optional(v.string()),     // MoE syllabus topic code (Sprint 07)
createdAt: v.number(),
updatedAt: v.number(),
```

**Frontend — Text lesson editor:**

- [ ] Rich text editor: Tiptap (ProseMirror-based) — chosen for its lightweight bundle and offline-capable edit model
  - Toolbar: Bold, Italic, Underline, Heading (H2, H3), Bulleted list, Numbered list, Blockquote, Divider
  - Math support: KaTeX inline (`$...$`) and block (`$$...$$`) — essential for Maths and Science teachers
  - Table support: simple tables for structured notes
  - Image paste: Ctrl+V an image → auto-uploads to Cloudinary → inserts inline
- [ ] Autosave: debounced 2s after last keystroke — saves to Convex, shows "Saved" indicator
- [ ] Estimated reading time: auto-calculated from word count (`words / 200` minutes)
- [ ] `createLesson` mutation: creates the lesson record in draft state
- [ ] `updateLessonContent` mutation: updates `textContent` — called by autosave
- [ ] `publishLesson` mutation: sets `isVisible: true`, notifies enrolled students via `notifications`

---

### ISSUE-224 · PDF Upload and Viewer

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

Teachers upload PDF documents as lesson content — past papers, worksheets, government syllabus documents. Students view them inline in the browser without downloading.

#### Acceptance Criteria

- [ ] `uploadLessonPdf` action:
  - Accepts file up to 25MB (Cloudinary limit for free tier)
  - Uploads to Cloudinary: `lms/{schoolSlug}/courses/{courseId}/lessons/{lessonId}.pdf`
  - Extracts page count using Cloudinary metadata response
  - Updates `lmsLessons.pdfUrl` and `lmsLessons.estimatedMinutes` (pages × 2 minutes)

- [ ] **Inline PDF viewer** (frontend component `<LessonPdfViewer />`):
  - Uses browser-native PDF rendering via `<iframe src={pdfUrl}>` — no client-side PDF library needed
  - Cloudinary transformation applied: `fl_attachment:false` ensures inline display not download
  - Page count shown: "Page X of Y"
  - "Open full screen" button
  - "Download" button (generates a time-limited signed Cloudinary URL)
  - On mobile: PDF opens in browser's native PDF viewer (acceptable UX on phones)
- [ ] Signed URL for PDF access: raw Cloudinary URL is NOT publicly accessible — always accessed via `generateSignedLessonUrl` action (1-hour expiry) — this prevents content hotlinking

---

### ISSUE-225 · Video Lesson — YouTube/Vimeo Embedding

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

Teachers paste a YouTube or Vimeo URL. The system extracts the video ID, fetches the thumbnail, and creates an embedded player. Video hosting is always external — no video uploads to Cloudinary (bandwidth cost in Zambia is prohibitive).

#### User Story

> Mr. Phiri finds a Khan Academy video on quadratic equations on YouTube. He copies the URL, pastes it into his Mathematics course, adds a title and 3 reflection questions below the video. Students watch it in the browser without leaving Acadowl.

#### Acceptance Criteria

- [ ] `parseVideoUrl` pure function:
  - Accepts: YouTube (`youtube.com/watch?v=`, `youtu.be/`) and Vimeo (`vimeo.com/`)
  - Returns: `{ platform: 'youtube' | 'vimeo', videoId, embedUrl, thumbnailUrl }`
  - YouTube thumbnail: `https://img.youtube.com/vi/{videoId}/hqdefault.jpg`
  - Invalid URL: returns `{ error: 'Unsupported video URL' }`

- [ ] Video lesson creation form: single URL paste input → auto-parses → shows thumbnail preview → confirm
- [ ] `<LessonVideoEmbed />` component:
  - Renders `<iframe>` with the embed URL
  - Lazy loading: thumbnail shown with play button overlay; iframe only loads when guardian taps play (saves data on mobile)
  - Estimated watch time: asks teacher to enter minutes OR fetches from YouTube oEmbed API if available
  - Does NOT autoplay — guardians on metered data must explicitly tap to play

- [ ] "Reflection questions" section below video: teacher adds 1–5 open-ended questions as plain text. Students see them after the video completes. These are NOT graded — they are discussion prompts.

---

### ISSUE-226 · External Link Lessons

**Type:** Backend + Frontend | **Priority:** P2 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

A simple lesson type that links students to an external resource — a government website, a reference document, a Zambia Open University resource. The system tracks whether the student clicked the link.

#### Acceptance Criteria

- [ ] `contentType: 'link'` lesson: URL + title + description
- [ ] On student's lesson page: large "Open Resource" button that opens the link in a new tab
- [ ] Clicking the button creates an `lmsLessonProgress` record marking the lesson as viewed (same logic as text/video view tracking — ISSUE-244)
- [ ] Teacher sees "X students opened this link" on the lesson in their course builder

---

### ISSUE-227 · Lesson Plan → LMS Lesson Conversion

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

Sprint 01 built `lessonPlans` with a `lmsLessonId` hook exactly for this moment. A teacher converts any of their existing lesson plans into a published LMS lesson with one click. No re-entry required.

#### User Story

> Ms. Tembo has 15 lesson plans from Term 1 stored in Acadowl. She opens her Chemistry course, clicks "Import from Lesson Plans", selects 8 plans for Module 2, and they appear as draft lessons ready for review and publishing.

#### Acceptance Criteria

- [ ] `convertLessonPlanToLesson` mutation:
  - Takes `{ lessonPlanId, courseId, moduleId }`
  - Validates teacher owns the lesson plan
  - Creates `lmsLessons` record with `contentType: 'text'`, `textContent` populated from `lessonPlans.content`
  - Updates `lessonPlans.lmsLessonId` to point to the new lesson (the Sprint 01 hook is now filled)
  - New lesson starts in `isVisible: false` (draft) for teacher review

- [ ] **Frontend — "Import from Lesson Plans" drawer** in course builder:
  - Slide-out panel listing all teacher's lesson plans for this subject
  - Filter: by topic, by term
  - Multi-select checkboxes → "Import Selected (N)" button
  - After import: newly created lessons appear in the course tree as draft items

- [ ] Reverse link: on `/(teacher)/lesson-plans/page.tsx` — plans with `lmsLessonId` set show an "In LMS ✓" badge; plans without show "Add to LMS"

---

## Epic 3 — AI Quiz Generator

> **Feature Gate:** `Feature.AI_QUIZ`
> **Goal:** A teacher selects a topic, pastes or types some lesson notes, and within 30 seconds has a 10-question multiple-choice quiz ready to publish to students. The AI generates the questions; the teacher reviews and edits; students take the quiz; scores are recorded automatically.

---

### ISSUE-228 · Quiz Schema and Manual Quiz Builder

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1.5 days

#### Description

Before the AI can generate quizzes, the quiz data model must be solid. This issue builds both the schema and a manual quiz builder — so schools without `Feature.AI_QUIZ` can still create quizzes by hand.

#### Acceptance Criteria

**Schema additions:**

```typescript
questionBank: defineTable({
  schoolId: v.id('schools'),
  subjectId: v.id('subjects'),
  createdBy: v.id('staff'),
  question: v.string(),
  questionType: v.union(
    v.literal('multiple_choice'), // 4 options, 1 correct
    v.literal('true_false'),
    v.literal('short_answer'), // Text answer, manually graded
    v.literal('fill_blank'), // "The capital of Zambia is ___"
  ),
  options: v.optional(
    v.array(
      v.object({
        id: v.string(), // 'A', 'B', 'C', 'D'
        text: v.string(),
        isCorrect: v.boolean(),
      }),
    ),
  ),
  correctAnswer: v.optional(v.string()), // For true_false and fill_blank
  explanation: v.optional(v.string()), // Shown after student answers
  difficultyLevel: v.union(v.literal('easy'), v.literal('medium'), v.literal('hard')),
  topic: v.optional(v.string()), // MoE syllabus topic tag
  isAiGenerated: v.boolean(),
  aiGenerationPrompt: v.optional(v.string()), // The prompt used — for audit and regeneration
  usageCount: v.number(), // How many quizzes use this question
  createdAt: v.number(),
})
  .index('by_school_subject', ['schoolId', 'subjectId'])
  .index('by_created_by', ['createdBy'])
  .index('by_school', ['schoolId']);

quizConfigs: defineTable({
  schoolId: v.id('schools'),
  lessonId: v.id('lmsLessons'), // The quiz lesson this config belongs to
  questionIds: v.array(v.id('questionBank')),
  questionOrder: v.union(
    v.literal('fixed'), // Always same order
    v.literal('randomised'), // Different order per student
  ),
  timeLimitMinutes: v.optional(v.number()), // null = untimed
  attemptsAllowed: v.number(), // 1 = one attempt; 0 = unlimited
  showAnswersAfter: v.union(
    v.literal('immediate'), // Right after submitting
    v.literal('due_date'), // After the due date passes
    v.literal('never'), // Teacher never releases answers
  ),
  passMark: v.optional(v.number()), // % required to pass
  createdAt: v.number(),
}).index('by_lesson', ['lessonId']);
```

**`convex/lms/quiz.ts`:**

- [ ] `createQuizConfig` mutation: creates quiz config for a lesson
- [ ] `addQuestionToQuiz` mutation: adds question from bank to this quiz's `questionIds`
- [ ] `removeQuestionFromQuiz` mutation
- [ ] `reorderQuizQuestions` mutation
- [ ] `createQuestionManually` mutation: adds a hand-crafted question to the school's question bank

**Frontend — Quiz Builder panel (right panel of course builder when `contentType: 'quiz'` lesson selected):**

- [ ] Question list: each question shown as a card with type icon, text preview, difficulty badge
- [ ] "Add Question Manually" button: opens a form with question type selector, options entry (for MCQ), correct answer toggle, explanation
- [ ] "Generate with AI" button (shown only if `Feature.AI_QUIZ` enabled) — opens ISSUE-229 modal
- [ ] Quiz settings panel: time limit, attempts allowed, show answers after
- [ ] Question preview: teacher can take the quiz themselves before publishing
- [ ] Reorder questions: drag-and-drop handles

---

### ISSUE-229 · AI Quiz Generation — Claude API Integration

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.AI_QUIZ` | **Estimate:** 1.5 days

#### Description

The AI quiz generator sends lesson content (or a teacher-supplied topic description) to the Anthropic Claude API and returns a structured set of questions, options, and correct answers. The teacher reviews and edits before publishing to students.

#### User Story

> Ms. Tembo has just finished writing her lesson on "Photosynthesis — Light Dependent Reactions." She clicks "Generate Quiz." In the prompt box, she types "10 multiple choice questions, medium difficulty, covering light reactions, chlorophyll, ATP production." She clicks Generate. 30 seconds later, 10 review-ready questions appear. She removes 2 that feel too obscure and publishes the rest.

#### Acceptance Criteria

**`convex/lms/aiQuiz.ts` → `generateQuizWithAI` action:**

```typescript
// This is a Convex action — it can call external APIs (Claude)
export const generateQuizWithAI = action({
  args: {
    lessonId: v.id('lmsLessons'),
    sourceType: v.union(
      v.literal('lesson_content'), // Use the lesson's own textContent
      v.literal('teacher_prompt'), // Teacher provides a description
      v.literal('both'),
    ),
    teacherPrompt: v.optional(v.string()),
    questionCount: v.number(), // 5–20
    questionTypes: v.array(v.string()), // ['multiple_choice', 'true_false']
    difficulty: v.union(
      v.literal('easy'),
      v.literal('medium'),
      v.literal('hard'),
      v.literal('mixed'),
    ),
    syllabusTopic: v.optional(v.string()),
  },
});
```

**Claude API call (in the action):**

```typescript
const systemPrompt = `You are an expert Zambian secondary school teacher creating quiz questions aligned with the ECZ curriculum. Generate questions that test understanding, not just memorisation. Return ONLY valid JSON — no preamble, no markdown code fences.`;

const userPrompt = `
Subject: ${subject.name}
Grade: ${grade.name}
Topic: ${lesson.title} ${syllabusTopic ? `(${syllabusTopic})` : ''}
${teacherPrompt ? `Additional instructions: ${teacherPrompt}` : ''}
${lessonContent ? `Lesson content to base questions on:\n${stripHtml(lessonContent)}` : ''}

Generate ${questionCount} quiz question(s).
Types requested: ${questionTypes.join(', ')}.
Difficulty: ${difficulty}.

Return a JSON array of objects. Each object must have:
{
  "question": string,
  "questionType": "multiple_choice" | "true_false" | "fill_blank",
  "options": [{"id": "A", "text": string, "isCorrect": boolean}, ...],  // For MCQ only
  "correctAnswer": string,  // For true_false and fill_blank
  "explanation": string,    // Why the answer is correct — 1-2 sentences
  "difficultyLevel": "easy" | "medium" | "hard",
  "topic": string           // Short topic label
}
`;

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  }),
});
```

- [ ] Parse JSON response from Claude — strip markdown code fences if present (defensive)
- [ ] Validate each generated question: `question` is non-empty, MCQ has exactly 1 `isCorrect: true`, explanation is non-empty
- [ ] For each valid question: insert into `questionBank` with `isAiGenerated: true`, `aiGenerationPrompt: userPrompt`
- [ ] Add all generated questions to the quiz's `questionIds`
- [ ] Return: `{ questionsGenerated: N, questionsInvalid: N, questionIds: [...] }`
- [ ] If Claude returns invalid JSON or the request fails: do NOT throw — return `{ error: 'AI generation failed. Please try again or add questions manually.' }`
- [ ] Log token usage to `aiUsageLog` table (schema below) for cost monitoring

**Schema addition:**

```typescript
aiUsageLog: defineTable({
  schoolId: v.id('schools'),
  userId: v.id('users'),
  feature: v.string(), // 'quiz_generation', 'at_risk' (Sprint 07)
  model: v.string(), // 'claude-sonnet-4-20250514'
  inputTokens: v.number(),
  outputTokens: v.number(),
  createdAt: v.number(),
}).index('by_school', ['schoolId']);
```

**Frontend — AI Quiz Generation modal:**

- [ ] Triggered from "Generate with AI" button in quiz builder
- [ ] Form fields: question count slider (5–20), difficulty selector, question types checkboxes, optional teacher prompt text area
- [ ] "Context" toggle: "Use lesson content" checkbox — if lesson has text content, it's included in the prompt
- [ ] "Generate" button: loading state with progress message "Asking AI to generate questions..."
- [ ] Results panel: generated questions shown one-by-one as cards
  - Each card: question text, options (for MCQ), correct answer highlighted green, explanation, difficulty badge
  - "Keep" / "Remove" toggle per question
  - "Edit" button: opens the manual question editor for that question
- [ ] "Add Selected to Quiz" button: confirms adding all kept questions
- [ ] Regeneration: "Regenerate All" button — removes current AI-generated questions and runs again

---

### ISSUE-230 · Quiz Taking — Student Experience

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1 day

#### Description

The student-facing quiz interface. Students attempt the quiz, see their score immediately (or after due date, per teacher config), and review their answers with explanations.

#### Acceptance Criteria

**`convex/lms/quizAttempts.ts`:**

- [ ] `startQuizAttempt` mutation:
  - Validates `attemptsAllowed` — throws `MAX_ATTEMPTS_REACHED` if exceeded
  - Creates `quizAttempts` record (schema below) with `status: 'in_progress'`
  - If `questionOrder: 'randomised'`: shuffles question IDs and stores the order on the attempt record
  - Returns: questions in the student's order (options also shuffled for MCQ)

- [ ] `submitQuizAnswer` mutation: saves answer for one question — called after each question (real-time progress saved, no losing work on connection drop)

- [ ] `submitQuizAttempt` mutation:
  - Sets `status: 'submitted'`, `submittedAt: now()`
  - Auto-grades MCQ and true/false questions: compares answer to `questionBank.correctAnswer`
  - Short-answer questions: flagged as `pendingManualGrade: true`
  - Computes `score` and `percentScore`
  - Creates/updates `lmsSubmissions` record (linking to the Sprint 01 submission schema)
  - If `showAnswersAfter: 'immediate'`: returns `{ score, percentScore, questionResults }` to client
  - If `examSessionId` is set on the lesson: calls `writeQuizScoreToExamResults` (ISSUE-238)

**Schema addition:**

```typescript
quizAttempts: defineTable({
  schoolId: v.id('schools'),
  lessonId: v.id('lmsLessons'),
  studentId: v.id('students'),
  attemptNumber: v.number(),
  questionOrder: v.array(v.id('questionBank')), // Shuffled order for this attempt
  answers: v.array(
    v.object({
      questionId: v.id('questionBank'),
      selectedOptionId: v.optional(v.string()), // For MCQ
      textAnswer: v.optional(v.string()), // For short answer / fill blank
      isCorrect: v.optional(v.boolean()), // Set on submit for auto-gradeable types
      marksAwarded: v.optional(v.number()),
    }),
  ),
  status: v.union(v.literal('in_progress'), v.literal('submitted'), v.literal('timed_out')),
  score: v.optional(v.number()),
  maxScore: v.number(),
  percentScore: v.optional(v.number()),
  startedAt: v.number(),
  submittedAt: v.optional(v.number()),
  timeTakenSeconds: v.optional(v.number()),
})
  .index('by_lesson_student', ['lessonId', 'studentId'])
  .index('by_school', ['schoolId']);
```

**Frontend — `/(student)/lms/courses/[courseId]/lessons/[lessonId]/quiz/page.tsx`:**

- [ ] Full-screen quiz mode (hides course navigation)
- [ ] Progress bar: "Question 4 of 10"
- [ ] Timer countdown (if `timeLimitMinutes` set) — auto-submits when timer reaches 0
- [ ] MCQ: large tap-friendly radio buttons — works on phone
- [ ] Navigation: "Previous" / "Next" buttons; question number grid for jumping
- [ ] Question flag: "Flag for review" button per question — flagged questions show a marker in the number grid
- [ ] Submit confirmation: shows list of unanswered questions before final submit
- [ ] Results screen (if `showAnswersAfter: 'immediate'`):
  - Score card: "8/10 — 80% — Pass ✓" or "4/10 — 40% — Below pass mark"
  - Per-question review: question, selected answer, correct answer (highlighted), explanation
  - "Retry" button (if attempts remaining)

---

## Epic 4 — Assignments & Submissions

---

### ISSUE-231 · Assignment Creation — Full Upgrade

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1 day

#### Description

Upgrade the Sprint 01 homework creation flow into a full LMS assignment. Existing homework records (`contentType: 'assignment'` in `lmsLessons`) are untouched — this issue extends their schema and adds a richer creation UI.

#### Acceptance Criteria

**Schema additions to `lmsLessons` for assignments:**

```typescript
// Additional fields (added to existing schema from ISSUE-223)
assignmentType: v.optional(v.union(
  v.literal('written'),            // Typed response
  v.literal('file_upload'),        // PDF, image, document
  v.literal('practical'),          // Student describes/photos their practical work
  v.literal('presentation'),       // PowerPoint or recorded presentation
  v.literal('peer_review')         // Students review each other's work (Sprint 07)
)),
rubric: v.optional(v.array(v.object({     // Grading rubric (optional)
  criterion: v.string(),           // 'Accuracy', 'Presentation', 'Working Shown'
  marks: v.number(),               // Marks allocated to this criterion
  descriptors: v.optional(v.object({
    excellent: v.string(),
    good: v.string(),
    satisfactory: v.string(),
    needs_improvement: v.string(),
  })),
}))),
allowLateSubmissions: v.boolean(),
latePenaltyPercent: v.optional(v.number()), // Deduct X% per day late
attachmentUrls: v.optional(v.array(v.string())), // Teacher-provided supporting files
```

**Backend:**

- [ ] `createAssignment` mutation (upgrade of Sprint 01 `setHomework`):
  - Accepts all new fields above
  - If teacher sets `examSessionId`: validates the session exists and is for the same subject
  - Sends notification to students and guardians (if `notifPrefs.homeworkAssigned: true`)
  - Backwards compatible: `setHomework` from Sprint 01 continues to work unchanged

- [ ] `updateAssignment` mutation: edit existing assignment — blocked if any submissions have been graded
- [ ] `extendDueDate` mutation: push due date without changing anything else — common teacher request. Creates a notification to all students: "Due date for [assignment] extended to [new date]"

**Frontend — Assignment creation form (upgrade of Sprint 01 homework form):**

- [ ] New fields: assignment type selector, rubric builder (add/remove criteria), late submissions toggle
- [ ] Attach resources: upload supporting PDFs or link to external resources
- [ ] Exam session linker: dropdown of active exam sessions for this subject — "Link this assignment to an exam session so scores feed into term marks"
- [ ] Due date + time (not just date): allows midnight deadlines
- [ ] Preview: "This is what students will see" — renders the assignment as the student portal shows it

---

### ISSUE-232 · Student Assignment Submission

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1 day

#### Description

Full implementation of the student assignment submission interface. Upgrade of the Sprint 03 ISSUE-167 student portal homework submission — richer submission types, draft saving, and resubmission within the late penalty window.

#### Acceptance Criteria

**Schema additions to `lmsSubmissions` (expanding Sprint 00 skeleton):**

```typescript
// Full implementation of Sprint 00 lmsSubmissions skeleton
textResponse: v.optional(v.string()),      // Written response
fileUrls: v.optional(v.array(v.string())), // Cloudinary URLs — multiple files allowed
status: v.union(
  v.literal('draft'),               // Saved but not submitted
  v.literal('submitted'),
  v.literal('late'),                // Submitted after due date
  v.literal('graded'),
  v.literal('returned')             // Teacher returned with feedback
),
isLate: v.boolean(),
minutesLate: v.optional(v.number()),
score: v.optional(v.number()),
maxScore: v.optional(v.number()),
percentScore: v.optional(v.number()),
letterGrade: v.optional(v.string()),
rubricScores: v.optional(v.array(v.object({
  criterion: v.string(),
  marksAwarded: v.number(),
  maxMarks: v.number(),
  feedback: v.optional(v.string()),
}))),
teacherFeedback: v.optional(v.string()),
feedbackAudioUrl: v.optional(v.string()),  // Teacher records voice feedback
aiGradingData: v.optional(v.string()),     // Sprint 07 — null for now
submittedAt: v.optional(v.number()),
gradedAt: v.optional(v.number()),
gradedBy: v.optional(v.id('users')),
createdAt: v.number(),
updatedAt: v.number(),
```

**Backend:**

- [ ] `saveDraftSubmission` mutation: saves text/files without submitting — shows "Draft saved" to student
- [ ] `submitAssignment` mutation:
  - Validates student is enrolled in the course
  - Sets `status: 'submitted'` or `'late'` based on comparison with `lmsLessons.dueDate`
  - Calculates `minutesLate` if late
  - Notifies teacher via in-app: "New submission: [StudentName] — [AssignmentTitle]"
  - Batch notification: if 10+ submissions arrive, group into one notification: "12 new submissions for [AssignmentTitle]"

- [ ] `resubmitAssignment` mutation: allowed if `status !== 'graded'` and teacher allows it

**Frontend — `/(student)/lms/courses/[courseId]/lessons/[lessonId]/submit/page.tsx`:**

- [ ] Assignment details header: title, due date (with countdown: "Due in 2 days 4 hours"), teacher's instructions, any attached resources
- [ ] Submission type adapts to `assignmentType`:
  - `written`: Tiptap rich text editor (same as teacher editor but simplified toolbar)
  - `file_upload`: drag-and-drop or "Browse Files" — accepts PDF, JPG, PNG (photos of handwritten work). Filename shown with delete option after upload.
  - `practical`: rich text + file upload combined
- [ ] "Save Draft" button: saves without submitting — student can return and continue
- [ ] "Submit" button: confirmation dialog — "Once submitted, you cannot edit your response unless your teacher allows resubmission."
- [ ] After submission: "Submitted ✓" screen with timestamp, link to view submission
- [ ] Late submission warning: amber banner if past due date — "This submission will be marked as late."

---

### ISSUE-233 · Submission Inbox — Teacher Grading Interface

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1 day

#### Description

The teacher's submission management screen. See all submissions for an assignment, grade them efficiently, and return feedback. The grading interface is designed to be used on a laptop but must also work on a tablet.

#### User Story

> Mr. Phiri opens his Mathematics assignment "Chapter 3 Exercises." He sees 34/35 students have submitted (1 missing). He opens Chanda's submission, reads her worked solutions (a photo of her notebook), enters a score of 17/20 and types "Well done on Q3 — but show all working for Q7." He clicks "Save & Next" — moves straight to Wande's submission.

#### Acceptance Criteria

**`convex/lms/grading.ts`:**

- [ ] `getSubmissionsForAssignment` query:
  - Returns all enrolled students for the course, each with their submission status
  - Students with no submission shown as "Not submitted" (not invisible — teacher can see the full class)
  - Sortable: by student name, submission time, score

**Frontend — `/(teacher)/lms/courses/[courseId]/lessons/[lessonId]/submissions/page.tsx`:**

- [ ] Two-panel layout:
  - **Left**: Student list with status badges: "Graded ✓ (17/20)", "Submitted — not graded", "Late ⚠", "Not submitted ✗"
  - **Right**: Submission viewer + grading form
- [ ] Submission viewer adapts to type:
  - Written: rendered HTML of the student's text response
  - File upload: inline image viewer for photos, PDF viewer for PDFs
- [ ] Grading form:
  - Score input: "17 / 20" — number input with max score shown
  - Rubric mode: if rubric defined, show per-criterion score inputs that auto-sum to total
  - Feedback: text area with markdown support
  - "Record voice feedback" button: uses browser MediaRecorder API, uploads MP3 to Cloudinary, stores URL in `feedbackAudioUrl`
  - Late penalty preview: "This submission is 2 days late. Apply 10% penalty? (19.2/20 → 17.3/20)" — teacher can accept or override
- [ ] "Save & Next" button: saves grade and moves to next ungraded submission — fast grading workflow
- [ ] Bulk actions: "Mark all unsubmitted as 0" (for final deadline), "Release grades to students"
- [ ] When grade released (`status: 'returned'`): student and guardian receive notification

---

### ISSUE-234 · Submission Notifications and Late Tracking

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

Automated notifications for assignment events: due date reminders to students, late submission alerts to teachers, and grade-release notifications to guardians.

#### Acceptance Criteria

- [ ] `assignment-deadline-reminder` cron (added to `convex/crons.ts`):
  - Runs daily at 06:00 CAT
  - Finds all assignments due within 24 hours
  - For each enrolled student with no submission: sends in-app notification + SMS (if `notifPrefs.homeworkAssigned: true`)
  - Message: `"Reminder: [AssignmentTitle] for [SubjectName] is due tomorrow at [time]. Log in to submit: [url]"`

- [ ] After `submitQuizAttempt` or `submitAssignment` with `isLate: true`: notifies teacher in-app and updates assignment's `lateSubmissionsCount` counter

- [ ] After teacher runs "Release grades" (`status → 'returned'` for all graded submissions):
  - For each graded student: creates `notifications` record
  - SMS to guardian (if `notifPrefs.resultsReleased: true`): `"[StudentName]'s [AssignmentTitle] has been marked: [score]/[maxScore] ([percent]%). Log in to see feedback."`
  - Push notification if student/guardian has PWA installed

---

## Epic 5 — Grading, Feedback & Marks Integration

---

### ISSUE-235 · LMS Grades → examResults Integration

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1 day

#### Description

The critical integration between the LMS grading system and the academic core built in Sprint 01. When a teacher grades an assignment that is linked to an exam session, the score automatically writes into `examResults`. This means LMS marks appear in the student's term aggregate and report card without any extra steps from the teacher.

#### User Story

> Mr. Phiri sets an assignment and links it to the "CA1 — Term 1 2025" exam session. After grading all submissions, he clicks "Push scores to term marks." The system writes each student's LMS score to the `examResults` table for that exam session. When the bursar runs the grade computation, LMS scores are already there.

#### Acceptance Criteria

**`convex/lms/marksIntegration.ts`:**

- [ ] `pushAssignmentScoresToExamResults` mutation:
  - Takes `{ lessonId }` — the assignment lesson
  - Validates `lmsLessons.examSessionId` is set and the session is not yet locked
  - For each graded `lmsSubmissions` record for this lesson:
    - Upserts `examResults` record: `{ studentId, subjectId, sectionId, examSessionId, marksObtained: submission.score, maxMarks: submission.maxScore }`
    - If record already exists (manually entered in Sprint 01 mark entry): ASKS teacher — "This student already has a mark entered. Overwrite? [Yes] [Keep existing]"
  - Returns: `{ pushed: N, skipped: N, conflicts: conflictList }`
  - Requires `requirePermission(ctx, Permission.ENTER_MARKS)`

- [ ] `getLinkedExamSession` query: for an assignment, returns the linked exam session's name, locked status, and current mark entry progress

**Frontend integrations:**

- [ ] Assignment creation (ISSUE-231): "Link to exam session" dropdown — shows active exam sessions for this subject
- [ ] Submission grading screen (ISSUE-233): "Push X scores to [ExamSessionName]" button at top — shown only when `examSessionId` is set and all submissions are graded
- [ ] Confirmation modal shows: "This will update marks for 34 students in [ExamSessionName]. This cannot be undone if marks are locked."
- [ ] Sprint 01 mark entry UI (`/(teacher)/marks/page.tsx`): if LMS scores exist for a student, they appear pre-filled with a "From LMS" badge — teacher can still override

---

### ISSUE-236 · Course Progress Tracking

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

Track how far through a course each student has progressed — lessons viewed, assignments submitted, quizzes passed. This drives the progress percentage on both the student's course card and the teacher's analytics view.

#### Acceptance Criteria

**Schema addition:**

```typescript
lmsLessonProgress: defineTable({
  schoolId: v.id('schools'),
  lessonId: v.id('lmsLessons'),
  studentId: v.id('students'),
  status: v.union(v.literal('not_started'), v.literal('in_progress'), v.literal('completed')),
  firstViewedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  timeSpentSeconds: v.optional(v.number()), // Tracked for video lessons
  pageScrollPercent: v.optional(v.number()), // For text lessons — how far they scrolled
})
  .index('by_lesson_student', ['lessonId', 'studentId'])
  .index('by_student', ['studentId'])
  .index('by_school', ['schoolId']);
```

**`convex/lms/progress.ts`:**

- [ ] `markLessonViewed` mutation: creates/updates `lmsLessonProgress` with `status: 'in_progress'` — called when student opens a lesson
- [ ] `markLessonCompleted` mutation: called automatically when:
  - Text lesson: student scrolls past 90% of content
  - PDF lesson: student views for > 30 seconds
  - Video: video player fires 'ended' event
  - Quiz: student submits and scores ≥ `passMark` (if set), else `status: 'in_progress'`
  - Assignment: student submits
- [ ] After `markLessonCompleted`: updates `lmsCourseEnrolments.completedLessons` and recalculates `progressPercent`
- [ ] `getCourseProgressForStudent` query: returns all lesson statuses for a student in a course — used for course detail view progress bar

---

### ISSUE-237 · Teacher Grade Book

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1 day

#### Description

A unified grade book view showing all students' performance across all assignments in a course — the teacher's equivalent of the Sprint 01 mark entry grid, but for LMS assessments.

#### Acceptance Criteria

**`convex/lms/gradeBook.ts`:**

- [ ] `getCourseGradeBook` query:
  - Returns a matrix: rows = students, columns = assignments (all `lmsLessons` with `contentType: 'assignment'` or `'quiz'`)
  - Each cell: score, max score, percent, status (graded/submitted/late/missing)
  - Last column: course average per student
  - Last row: class average per assignment

**Frontend — `/(teacher)/lms/courses/[courseId]/grades/page.tsx`:**

- [ ] Spreadsheet-style grid — horizontally scrollable if many assignments
- [ ] Cell colour coding: green (≥ 70%), amber (50–69%), red (< 50%), gray (not submitted)
- [ ] Click a cell: opens the student's submission in a slide-over panel
- [ ] "Export to CSV" button: download full grade book
- [ ] "Sync all to term marks" button: pushes ALL linked assignment scores to `examResults` in bulk (calls `pushAssignmentScoresToExamResults` for each linked assignment)

---

### ISSUE-238 · Grade Release and Student/Guardian Notifications

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

The grade release workflow — teacher marks submissions as graded, then explicitly releases them so students and guardians see scores. Matches the "release" pattern used for report cards in Sprint 01.

#### Acceptance Criteria

- [ ] `releaseAssignmentGrades` mutation:
  - Sets all graded submissions for a lesson to `status: 'returned'`
  - Creates notifications for all students and their guardians
  - Only graded submissions are released — ungraded submissions remain in 'submitted' state

- [ ] Student portal: assignment shows "Graded — [score]" only after `status: 'returned'`; before release shows "Submitted — awaiting marking"
- [ ] Guardian portal: assignment in homework view shows "Marked: [score]/[maxScore]" after release

---

## Epic 6 — Student Learning Portal

> **Goal:** A clean, distraction-free learning environment for students. Works on a low-end Android phone with intermittent connectivity. A student who has never used an LMS can understand it in 5 minutes.

---

### ISSUE-239 · Student Course Dashboard

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1 day

#### Description

The student's view of all their courses for the current term — the starting point of their learning experience. One card per course, showing progress and outstanding tasks.

#### Acceptance Criteria

**`convex/lms/studentCourses.ts`:**

- [ ] `getStudentCourseDashboard` query:
  - Returns all `lmsCourseEnrolments` with `status: 'active'` for the current user
  - Per course: title, subject, teacher name, cover image, progress percent, `pendingAssignments` count, `overdueAssignments` count, `nextDueDate`, `lastActivityAt`
  - Sorted: courses with overdue assignments first, then by next due date

**Frontend — `/(student)/lms/page.tsx`:**

- [ ] Course card grid (2-column on phone):
  - Cover image strip or subject-coloured gradient header
  - Subject name, section badge, teacher name
  - Progress bar: "6 of 14 lessons completed — 43%"
  - Due-task chips: "📝 Assignment due Thu" / "⚠ 1 overdue"
  - Last activity: "Last visited 2 days ago"
- [ ] Top summary bar: "You have 3 assignments due this week" with deadline countdown
- [ ] "Continue Learning" quick-action: taps to the most recently-visited lesson across all courses

---

### ISSUE-240 · Student Course View and Lesson Navigation

**Type:** Frontend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1 day

#### Description

The student's view of a single course — the module/lesson tree and lesson content renderer. Designed for phone-first, with a clean reading experience and minimal chrome.

#### Acceptance Criteria

**Frontend — `/(student)/lms/courses/[courseId]/page.tsx`:**

- [ ] Course header: cover image, title, teacher name+photo, progress ring
- [ ] Module accordion: modules collapsed by default, tap to expand
  - Per lesson: icon (type), title, completion tick (if completed), lock icon (if `isMandatory` previous lesson not complete), due date chip (if assignment)
  - Locked lessons: gray out with "Complete [previous lesson] first" tooltip
- [ ] Tap a lesson → navigates to `/(student)/lms/courses/[courseId]/lessons/[lessonId]/page.tsx`
- [ ] Course completion celebration: confetti animation when `progressPercent === 100` — student feels rewarded for completing a course
- [ ] Offline support: last-viewed lesson text content cached by Workbox service worker (CacheFirst strategy) — student can review notes when offline

**Frontend — Lesson viewer `/(student)/lms/courses/[courseId]/lessons/[lessonId]/page.tsx`:**

- [ ] Renders the appropriate content type:
  - `text`: rendered HTML from Tiptap — KaTeX equations rendered inline
  - `pdf`: embedded PDF viewer (ISSUE-224)
  - `video`: lazy-loading video embed (ISSUE-225)
  - `quiz`: "Start Quiz" button → quiz mode (ISSUE-230)
  - `assignment`: assignment detail + submission form (ISSUE-232)
  - `link`: "Open Resource" button (ISSUE-226)
- [ ] Previous / Next lesson navigation at bottom
- [ ] Scroll progress auto-marks lesson as in-progress / completed (calls `markLessonViewed` / `markLessonCompleted`)
- [ ] Lesson title shown in mobile header with back arrow to course view

---

### ISSUE-241 · Student Assignment Dashboard

**Type:** Frontend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

A cross-course view of all a student's assignments — sorted by due date with clear status. Extends the Sprint 03 ISSUE-167 homework view with richer LMS data.

#### Acceptance Criteria

- [ ] `/(student)/lms/assignments/page.tsx`:
  - All assignments across all courses, sorted by due date (soonest first)
  - Filter tabs: All | Due Soon (7 days) | Overdue | Submitted | Graded
  - Per item: assignment title, course/subject badge, due date countdown, status pill, score (if graded)
  - Overdue items at top with red indicator
  - Tap: navigates directly to the assignment lesson view
- [ ] Summary bar at top: "3 due this week · 1 overdue · 2 awaiting feedback"
- [ ] Guardian portal (Sprint 03 ISSUE-143 `/(parent)/children/[id]/homework`): updated to read from this richer data source — same component, new query

---

### ISSUE-242 · Student Progress and Course Completion Report

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

A student's own view of their learning progress — where they are in each course, their assignment scores, and their overall engagement level for the term.

#### Acceptance Criteria

- [ ] `/(student)/lms/progress/page.tsx`:
  - Per-course completion doughnut charts (recharts `RadialBarChart`)
  - Assignment score history: subject → assignment → score timeline
  - "Streak" indicator: consecutive days with LMS activity (encourages daily engagement)
  - "Strongest subject" and "Needs attention" derived from average scores across courses
- [ ] `getStudentLmsProgressReport` query: all enrolment + progress + submission data for a student in the current term
- [ ] Parent portal integration (ISSUE-143 upgrades): `progressPercent` per course shown in homework view

---

### ISSUE-243 · Timetable-to-Course Quick Links

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

Students view their daily timetable (Sprint 01 ISSUE-062) and can tap any subject to jump directly into that course. Connects the two most-used student features into a single tap.

#### Acceptance Criteria

- [ ] Student timetable page (`/(student)/timetable/page.tsx` — Sprint 01): each timetable slot gains a "Open Course" button if an active LMS course exists for that `subjectId + sectionId`
- [ ] "Today's lessons" widget on student dashboard: shows today's timetable periods with LMS course deep-links
- [ ] `getCoursesForTodaysTimetable` query: takes today's `timetableSlots` for the student's section and matches each to an active course

---

## Epic 7 — LMS Messaging & Discussion

---

### ISSUE-244 · Course Discussion Threads

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1 day

#### Description

Each course has a discussion board where students can ask questions and teachers can respond. Uses the Sprint 03 `messageThreads` table with `context: 'lms'` — the same inbox the teacher and guardian already use.

#### User Story

> Chanda is confused about Question 5 in the Chapter 2 assignment. She opens the course and posts: "I don't understand how to factorise this — can you show the method?" Mr. Phiri replies with a worked example. Other students in the class can see the exchange and benefit.

#### Acceptance Criteria

- [ ] `createCourseDiscussionThread` mutation:
  - Creates a `messageThreads` record with `context: 'lms'`, `studentId` set, `courseId` attached via `relatedEntityId`
  - `participantIds`: initially `[studentUserId, teacherUserId]`; other students in the section can view (but not join) — read-only broadcast model
  - Sends in-app notification to teacher

- [ ] `getCourseDiscussionThreads` query: all threads for a course, visible to all enrolled students (read-only) and the teacher (full access)

**Frontend — Course discussion panel:**

- [ ] Tab "Discussion" on student course view (alongside "Lessons")
- [ ] Thread list: sorted by most recent reply; teacher replies shown with "Teacher" badge
- [ ] "Post a Question" button: opens compose panel (subject pre-filled with course title)
- [ ] Thread detail: renders chat-style using the Sprint 03 message thread component — context `'lms'`
- [ ] Teacher portal: discussion threads from all courses aggregated in `/(teacher)/messages` inbox with "LMS" filter tab

---

### ISSUE-245 · Teacher Announcements Within a Course

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

A teacher can send a course-specific announcement — different from a school-wide announcement (Sprint 03 ISSUE-156). These appear as pinned notices in the student's course view.

#### Acceptance Criteria

- [ ] `courseAnnouncements` table:
  ```typescript
  courseAnnouncements: defineTable({
    schoolId: v.id('schools'),
    courseId: v.id('lmsCourses'),
    authorId: v.id('users'),
    title: v.string(),
    body: v.string(),
    sendSMS: v.boolean(),
    isPinned: v.boolean(),
    createdAt: v.number(),
  }).index('by_course', ['courseId']);
  ```
- [ ] `createCourseAnnouncement` mutation: if `sendSMS: true` — sends SMS to all enrolled students via `sendSms` action
- [ ] Student course view: pinned announcements shown as a banner between the course header and module tree
- [ ] Teacher view in course builder: Announcements section with compose + history

---

### ISSUE-246 · Private Teacher-Student Messaging in LMS Context

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

A student can send a private message to a teacher directly from within a course or assignment — not a public discussion post. Uses the Sprint 03 messaging infrastructure.

#### Acceptance Criteria

- [ ] "Message Teacher" button on assignment submission screen and lesson page
- [ ] Opens a `context: 'lms'` thread between student and teacher with the course/lesson pre-populated as subject
- [ ] Teacher's inbox shows these threads with "LMS" badge, same as parent portal messages
- [ ] Student can see all their LMS messages at `/(student)/lms/messages/page.tsx`
- [ ] Difference from discussion thread: private (not visible to rest of class)

---

## Epic 8 — LMS Engagement Analytics

---

### ISSUE-247 · Teacher Course Analytics Dashboard

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1 day

#### Description

The teacher sees at a glance how engaged their students are — who is keeping up, who hasn't opened the course this week, and which lessons have the highest drop-off rate.

#### Acceptance Criteria

**`convex/lms/analytics.ts`:**

- [ ] `getCourseAnalytics` query:
  ```typescript
  {
    courseCompletionRate: number,          // % of students ≥ 80% complete
    averageProgressPercent: number,
    studentsAtRisk: number,                // < 30% progress with < 7 days until term end
    lessonEngagement: Array<{
      lessonId, lessonTitle, viewCount, completionCount, avgTimeSpentSeconds
    }>,
    assignmentStats: Array<{
      lessonId, title, submissionRate, averageScore, onTimeRate
    }>,
    weeklyActivityChart: Array<{ weekNumber, activeStudents, submissionsReceived }>,
    bottomFiveStudents: Array<{ studentId, name, progressPercent, lastActivity }>,
  }
  ```

**Frontend — `/(teacher)/lms/courses/[courseId]/analytics/page.tsx`:**

- [ ] Stat cards: completion rate, average progress, submissions pending, at-risk count
- [ ] Lesson engagement table: sorted by completion count ascending — "struggling" lessons at top
- [ ] Weekly activity chart (recharts `AreaChart`)
- [ ] "Students who haven't opened the course this week" list with "Send Reminder" button (SMS via `sendSms` action)
- [ ] "At risk" students: progress < 30% + 3 or more missing assignments → highlighted with a "Needs attention" badge

---

### ISSUE-248 · LMS Engagement Score — Progress Snapshot Integration

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

Compute a composite LMS engagement score (0–100) for each student and write it to `studentProgressSnapshots.lmsEngagementScore`. Sprint 07 at-risk engine reads this field — it must be populated accurately and weekly.

#### Acceptance Criteria

**`convex/analytics/progressSnapshots.ts` — update `writeProgressSnapshots` cron (Sprint 03 ISSUE-136):**

- [ ] Add LMS data to the Friday snapshot:

  ```typescript
  // Fields added to studentProgressSnapshots
  lmsEngagementScore: v.optional(v.number()),    // 0–100
  coursesEnrolled: v.optional(v.number()),
  coursesAbove80Percent: v.optional(v.number()),
  ```

- [ ] `computeLmsEngagementScore` pure function:

  ```typescript
  function computeLmsEngagementScore(params: {
    homeworkSubmissionRate: number; // % of assignments submitted (0–100)
    averageCourseProgress: number; // Average completion % across all courses
    onTimeSubmissionRate: number; // % of submissions that were on time
    quizPassRate: number; // % of quizzes passed (≥ pass mark)
    weeklyActivityDays: number; // Days with LMS activity in the last 7 days (0–5)
  }): number {
    // Weighted composite:
    // homeworkSubmissionRate × 0.35
    // averageCourseProgress × 0.25
    // onTimeSubmissionRate × 0.20
    // quizPassRate × 0.10
    // (weeklyActivityDays / 5 × 100) × 0.10
    // Result: 0–100, rounded to 1 decimal
  }
  ```

  - If `Feature.LMS` is disabled: `lmsEngagementScore` set to `null` — not 0
  - If student has no courses: set to `null`

- [ ] Unit tests required: 5 test cases covering low engagement, high engagement, no quizzes taken, offline school (LMS off), and mid-range engagement

---

### ISSUE-249 · School-Wide LMS Overview for Admin

**Type:** Frontend + Backend | **Priority:** P2 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

Admin view of LMS adoption and engagement across the whole school. Which teachers are using it actively? Which subjects have the highest student engagement?

#### Acceptance Criteria

- [ ] `getSchoolLmsOverview` query: courses created vs total subject-section pairs; average completion rate across all courses; top 5 most engaged courses; bottom 5 least engaged
- [ ] `/(admin)/lms/overview/page.tsx`:
  - "LMS Adoption" stat: "12/15 teachers have published at least 1 lesson this term"
  - Average school-wide engagement score (from snapshots)
  - Per-subject engagement leaderboard
  - "Teachers not yet using LMS" list with "Send Reminder" button

---

## Epic 9 — Library Catalog Management

> **Feature Gate:** `Feature.LIBRARY`
> **Goal:** A complete digital catalog for the school library. The librarian manages books from their desk, and students can search the catalog from any device to check if a title is available before walking to the library.

---

### ISSUE-250 · Library Book Catalog — Full Schema and Management

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.LIBRARY` | **Estimate:** 1.5 days

#### Description

Full implementation of the `libraryBooks` skeleton from Sprint 00. Each book is a title entry; multiple physical copies are tracked separately. A librarian can add books individually or in bulk via CSV.

#### Acceptance Criteria

**Schema additions to `libraryBooks` (full implementation of Sprint 00 skeleton):**

```typescript
// Full implementation
title: v.string(),
author: v.string(),
isbn: v.optional(v.string()),
publisher: v.optional(v.string()),
publicationYear: v.optional(v.number()),
edition: v.optional(v.string()),
subject: v.optional(v.string()),          // Subject tag (free text, not a foreign key)
subjectId: v.optional(v.id('subjects')),  // If linked to a school subject
deweyCode: v.optional(v.string()),        // Dewey Decimal classification code
language: v.string(),                     // 'English', 'Nyanja', 'Bemba'
bookType: v.union(
  v.literal('textbook'),                  // Curriculum textbook
  v.literal('reference'),                 // Dictionary, atlas, encyclopedia
  v.literal('fiction'),
  v.literal('non_fiction'),
  v.literal('periodical'),                // Magazines, journals
  v.literal('past_paper')                 // ECZ past examination papers
),
totalCopies: v.number(),                  // How many physical copies the library owns
availableCopies: v.number(),              // Denormalised: totalCopies - issued copies
coverImageUrl: v.optional(v.string()),    // Cloudinary URL or Open Library cover
description: v.optional(v.string()),
location: v.optional(v.string()),         // Shelf location: 'Shelf B3'
gradeRecommendations: v.optional(v.array(v.id('grades'))), // Which grades this suits
isActive: v.boolean(),
createdAt: v.number(),
updatedAt: v.number(),
```

**`libraryBookCopies` table (Sprint 00 skeleton tracked copies as part of `libraryBooks` — split out properly):**

```typescript
libraryBookCopies: defineTable({
  schoolId: v.id('schools'),
  bookId: v.id('libraryBooks'),
  copyNumber: v.number(), // Copy 1, Copy 2, etc.
  barcode: v.string(), // Printed barcode on the inside cover — unique
  condition: v.union(
    v.literal('new'),
    v.literal('good'),
    v.literal('fair'),
    v.literal('poor'),
    v.literal('withdrawn'), // Removed from circulation
  ),
  isAvailable: v.boolean(), // False when issued
  currentIssuedTo: v.optional(v.id('users')),
  currentDueDate: v.optional(v.string()),
  notes: v.optional(v.string()),
  acquiredDate: v.optional(v.string()),
  purchasePriceZMW: v.optional(v.number()),
  createdAt: v.number(),
})
  .index('by_book', ['bookId'])
  .index('by_barcode', ['barcode']) // Fast barcode lookup
  .index('by_school', ['schoolId']);
```

**Backend — `convex/library/catalog.ts`:**

- [ ] `addBook` mutation: creates `libraryBooks` + N `libraryBookCopies` records (N = totalCopies)
  - Auto-generates barcodes for each copy: `{schoolShortCode}-BK-{bookId[0:6]}-{copyNumber}` e.g., `KBS-BK-a1b2c3-001`
  - Fetches cover image from Open Library API using ISBN if available (action, not mutation)
  - Requires `requirePermission(ctx, Permission.MANAGE_LIBRARY)`

- [ ] `updateBook` mutation: edit title, author, description, etc.
- [ ] `addCopiesToBook` mutation: add more physical copies to existing title
- [ ] `withdrawCopy` mutation: mark a copy as `condition: 'withdrawn'` — removes from circulation
- [ ] `searchBooks` query:
  - Full-text search across title, author, ISBN, subject, dewey code
  - Filters: bookType, subject, availability (available copies > 0), grade recommendation
  - Returns: title, author, ISBN, availability status, shelf location
  - Accessible to STUDENTS and GUARDIANS (public catalog)

**Frontend — `/(admin)/library/catalog/page.tsx`:**

- [ ] Searchable book list with cover thumbnails, availability badges, copy counts
- [ ] "Add Book" form with ISBN lookup: enter ISBN → auto-fills title, author, publisher from Open Library API
- [ ] Copies management: expand a book card to see all physical copies with their condition and current borrower
- [ ] "Bulk Import" via CSV: column mapping for title, author, ISBN, copies, Dewey code
- [ ] Shelf location assignment: label field e.g., "Shelf B3" — printed on catalog printout

---

### ISSUE-251 · ISBN Lookup and Cover Fetching

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.LIBRARY` | **Estimate:** 0.5 days

#### Description

When a librarian enters an ISBN, the system fetches book metadata and cover image from Open Library's free API. This eliminates manual data entry for standard textbooks.

#### Acceptance Criteria

**`convex/library/isbnLookup.ts` → `lookupBookByIsbn` action:**

- [ ] Calls `https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data`
- [ ] Extracts: title, authors (array → join with " & "), publishers, publish_date, number_of_pages
- [ ] Cover image: `https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg` — downloads and re-uploads to Cloudinary at `library/{schoolSlug}/covers/{isbn}.jpg`
- [ ] Returns extracted data or `{ notFound: true }` if ISBN not in Open Library
- [ ] Fallback: if Open Library fails or ISBN not found, form remains editable with a note: "ISBN not found in Open Library. Please enter details manually."
- [ ] Zambian ECZ past papers have no ISBN — this is expected and handled (form allows blank ISBN)

---

### ISSUE-252 · Library Catalog Public Search

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** `Feature.LIBRARY` | **Estimate:** 0.5 days

#### Description

Students and teachers can search the library catalog from the student/teacher portal to check book availability before going to the library. No authentication changes — just a read-only query exposed to more roles.

#### Acceptance Criteria

- [ ] `/(student)/library/page.tsx` and `/(teacher)/library/page.tsx`:
  - Search bar: searches title, author, subject simultaneously
  - Filter chips: All Types | Textbooks | Fiction | Past Papers | Available Now
  - Result cards: cover image, title, author, Dewey code, shelf location, availability badge
  - Availability badge: "2 of 4 available" (green) / "0 of 3 available — all issued" (red)
  - Tap a book: shows full details + "Reserve" button (if school enables reservations — stub for now)
- [ ] `searchBooks` query: accessible to `student`, `guardian`, `teacher` roles (already defined in ISSUE-250 backend)
- [ ] Parent portal: "Library" link in the "More" menu of the student's detail view — shows catalog + current issues for that student

---

### ISSUE-253 · Library Settings and Policy Configuration

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.LIBRARY` | **Estimate:** 0.5 days

#### Description

School-level library policies — how many books can each role borrow, how long the loan period is, overdue fines, and reservation rules.

#### Acceptance Criteria

**Schema addition to `schools`:**

```typescript
libraryConfig: v.object({
  loanPeriodDays: v.object({
    student: v.number(),             // Default: 14 days
    teacher: v.number(),             // Default: 30 days
    staff: v.number(),               // Default: 30 days
  }),
  maxBooksPerBorrower: v.object({
    student: v.number(),             // Default: 3
    teacher: v.number(),             // Default: 5
  }),
  overdueFinePer DayZMW: v.number(), // Default: 0 (many Zambian schools don't fine)
  allowRenewals: v.boolean(),
  maxRenewals: v.number(),
  requireLibrarianApproval: v.boolean(), // If true: all issues are manually approved
  overdueReminderDays: v.array(v.number()), // [3, 1, 0, -1] = 3 days before, 1 day before, on day, 1 day after
})
```

- [ ] `/(admin)/settings/library/page.tsx`: all policy configuration fields with sensible defaults pre-filled
- [ ] Loan period shown on the book issue confirmation screen

---

## Epic 10 — Book Issuing & Returns

---

### ISSUE-254 · Book Issue — Barcode Scan Workflow

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.LIBRARY` | **Estimate:** 1.5 days

#### Description

The librarian's primary workflow: a student presents their ID card, the librarian scans it, scans the book's barcode, and the system issues the book. The whole transaction should take under 30 seconds.

#### User Story

> Chanda brings "Advanced Biology for Zambia" to the library counter. The librarian opens Acadowl on the library desk tablet, clicks "Issue Book." She scans Chanda's student ID card. Chanda's profile appears — no overdue books. She scans the book's barcode. The system confirms: "Biology for Zambia — Copy 2 — issued to Chanda Banda until 22 Jan 2025." One tap to confirm.

#### Acceptance Criteria

**Backend — `convex/library/issues.ts`** (full implementation of Sprint 00 `libraryIssues` skeleton):

- [ ] `issueBook` mutation (full implementation of Sprint 00 skeleton):
  - Args: `{ copyBarcode, borrowerStudentId, overrideDueDate? }`
  - Validates copy exists and `isAvailable: true`
  - Validates student has not reached `maxBooksPerBorrower` limit
  - Validates student has no overdue books (blocks issue if any overdue — configurable with `blockOnOverdue` flag in libraryConfig)
  - Sets `libraryBookCopies.isAvailable: false`, `currentIssuedTo`, `currentDueDate`
  - Updates `libraryBooks.availableCopies` (decrement)
  - Creates `libraryIssues` record (full schema below)
  - Requires `requirePermission(ctx, Permission.MANAGE_LIBRARY)`

**Full `libraryIssues` schema (implementing Sprint 00 skeleton):**

```typescript
libraryIssues: defineTable({
  schoolId: v.id('schools'),
  bookId: v.id('libraryBooks'),
  copyId: v.id('libraryBookCopies'),
  borrowerId: v.id('users'),
  studentId: v.optional(v.id('students')), // Set if borrower is a student
  staffId: v.optional(v.id('staff')), // Set if borrower is a staff member
  issuedAt: v.number(),
  dueDate: v.string(), // 'YYYY-MM-DD'
  returnedAt: v.optional(v.number()),
  returnCondition: v.optional(v.union(v.literal('good'), v.literal('damaged'), v.literal('lost'))),
  renewalCount: v.number(), // Sprint 07 MoE return field
  renewedAt: v.optional(v.array(v.number())), // Each renewal date
  overdueRemindersSent: v.number(),
  fineZMW: v.optional(v.number()),
  finePaidAt: v.optional(v.number()),
  issuedBy: v.id('users'), // Librarian who issued
  returnedBy: v.optional(v.id('users')), // Librarian who processed return
  notes: v.optional(v.string()),
})
  .index('by_school', ['schoolId'])
  .index('by_borrower', ['borrowerId'])
  .index('by_book', ['bookId'])
  .index('by_copy', ['copyId'])
  .index('by_due_date', ['dueDate']);
```

**Frontend — `/(admin)/library/issue/page.tsx` — librarian's desk interface:**

- [ ] Two-step barcode flow:
  - **Step 1**: "Scan student ID" — `<BarcodeScanner />` component uses device camera (same scanner component used at boarding gate ISSUE-185) or manual entry
  - After scan: student profile card (photo, name, grade, current books issued count, any overdue alert)
  - **Step 2**: "Scan book barcode" — camera scanner or manual entry
  - After scan: book details card (title, copy number, condition, due date preview)
- [ ] Confirm button: large, green — issues the book
- [ ] Error states with clear messages:
  - "Student has 3 books issued — limit reached" (with override option for librarian)
  - "This copy is already issued to [Name]"
  - "Student has 1 overdue book — please return first"
  - "Book copy not found in catalog"
- [ ] Success: shows issue summary with due date, prints optional receipt (browser print)
- [ ] Quick-issue mode: after confirm, immediately resets for next transaction — no navigation

---

### ISSUE-255 · Book Return Processing

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.LIBRARY` | **Estimate:** 0.5 days

#### Description

Process a book return. Scan the book's barcode, the system finds the open issue, marks it returned, and flags any damage or overdue fines.

#### Acceptance Criteria

- [ ] `returnBook` mutation:
  - Takes `{ copyBarcode, returnCondition: 'good' | 'damaged' | 'lost', notes? }`
  - Finds the open `libraryIssues` record for this copy
  - Sets `returnedAt: now()`, `returnCondition`
  - Sets `libraryBookCopies.isAvailable: true` (unless `returnCondition === 'lost'`)
  - Increments `libraryBooks.availableCopies` (unless lost)
  - If returned after due date AND `overdueFinePerDayZMW > 0`: calculates fine, sets `fineZMW`
  - If `returnCondition === 'damaged'` or `'lost'`: creates in-app notification for librarian to initiate replacement/fine process

**Frontend — `/(admin)/library/return/page.tsx`:**

- [ ] Barcode scan → finds issue → shows: student name, book title, issued on, due date, days overdue (if any), fine preview
- [ ] Condition selector: Good / Damaged / Lost (radio buttons)
- [ ] Confirm return button
- [ ] Fine displayed prominently if overdue: "3 days overdue — Fine: ZMW 1.50" (even if school policy is ZMW 0 — shows 0)

---

### ISSUE-256 · Book Renewal

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.LIBRARY` | **Estimate:** 0.5 days

#### Description

Students or librarians can renew a loan — extend the due date without physically returning the book. Limited by `maxRenewals` school policy.

#### Acceptance Criteria

- [ ] `renewLoan` mutation: extends `libraryIssues.dueDate` by `loanPeriodDays`, increments `renewalCount`
- [ ] Blocks if `renewalCount >= maxRenewals` or if the book has other reservation requests (future)
- [ ] Renewal via student portal: `/(student)/library/my-books/page.tsx` → "Renew" button per issued book
- [ ] Renewal via librarian desk: find issue by student scan → "Renew" button
- [ ] SMS confirmation to student: "Your loan of [title] has been renewed. New due date: [date]."

---

### ISSUE-257 · Overdue Book Management

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.LIBRARY` | **Estimate:** 1 day

#### Description

Automated overdue reminders sent to students and guardians. A librarian dashboard showing all overdue books. Fine calculation and fine payment recording.

#### Acceptance Criteria

**`convex/crons.ts` — `library-overdue-check` daily job at 07:30 CAT:**

- [ ] `processLibraryOverdueReminders` internal action:
  - Finds all `libraryIssues` where `returnedAt` is null and `dueDate < today`
  - For each overdue issue: checks `overdueRemindersSent` against `libraryConfig.overdueReminderDays`
  - Sends SMS to student and guardian if reminder is due (using `sendSms` action)
  - Message: `"[SchoolName] Library: [title] borrowed by [StudentName] was due on [date] and is now [N] days overdue. Please return immediately."`
  - Increments `overdueRemindersSent`
  - Calculates and updates `fineZMW` if applicable

**Frontend — `/(admin)/library/overdue/page.tsx`:**

- [ ] Overdue books list: student name, book title, due date, days overdue, fine accrued, reminders sent count
- [ ] Sort by: days overdue (desc), fine amount (desc), student name
- [ ] "Send Reminder Now" per student — manual trigger
- [ ] "Send Reminders to All" bulk action
- [ ] Fine payment recording: "Mark Fine Paid" button → enters amount paid → creates `libraryFinePayments` record
- [ ] "Lost Book" button: marks copy as lost, withdraws it from catalog, records replacement cost for recovery from student/guardian

---

## Epic 11 — E-Library & Digital Resources

> **Feature Gate:** `Feature.ELIBRARY`
> **Goal:** A curated digital resource shelf. Teachers upload PDFs, link to Open Educational Resources, and organise them by subject and grade. Students access these from home — no physical visit to the library required.

---

### ISSUE-258 · Digital Resource Library

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.ELIBRARY` | **Estimate:** 1 day

#### Description

A separate digital shelf — distinct from the physical book catalog — for PDFs, e-books, and curated external links. Think of it as a school's own mini-internet: vetted, curriculum-aligned, always available.

#### Acceptance Criteria

**Schema addition:**

```typescript
digitalResources: defineTable({
  schoolId: v.id('schools'),
  title: v.string(),
  description: v.optional(v.string()),
  resourceType: v.union(
    v.literal('pdf'),
    v.literal('ebook'),
    v.literal('video'), // YouTube/Vimeo curriculum video
    v.literal('website'), // Curated external website
    v.literal('past_paper'), // ECZ past exam papers
    v.literal('marking_scheme'), // ECZ marking schemes
  ),
  fileUrl: v.optional(v.string()), // Cloudinary URL for PDFs/ebooks
  externalUrl: v.optional(v.string()), // For videos and websites
  subjectId: v.optional(v.id('subjects')),
  gradeIds: v.array(v.id('grades')), // Which grades this is suitable for
  tags: v.array(v.string()), // Free-form tags: 'revision', 'past paper', 'notes'
  accessLevel: v.union(
    v.literal('all_students'),
    v.literal('enrolled_only'), // Only students enrolled in this subject's LMS course
    v.literal('staff_only'),
  ),
  uploadedBy: v.id('users'),
  downloadCount: v.number(),
  viewCount: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_subject', ['subjectId'])
  .index('by_school_grade', ['schoolId', 'gradeIds']);
```

**Backend:**

- [ ] `uploadDigitalResource` action: uploads PDF/ebook to Cloudinary, creates record
- [ ] `addExternalResource` mutation: link to YouTube video or website with metadata
- [ ] `recordResourceAccess` mutation: increments view/download count, creates `digitalResourceAccess` log (for popularity and at-risk engagement tracking)
- [ ] `getDigitalResourcesForStudent` query: filtered by student's current grade and enrolled subjects

**Frontend — `/(admin)/library/digital/page.tsx`** (admin management view) and **`/(student)/library/digital/page.tsx`** (student browsing view):

- [ ] Admin: upload form with subject/grade tagging, PDF viewer preview, activation toggle
- [ ] Student: browsable shelf organised by subject, search bar, filter by type
- [ ] "ECZ Past Papers" quick filter: shows all `past_paper` type resources — a key feature for exam revision
- [ ] Download button: generates signed Cloudinary URL (time-limited) — no public direct links

---

### ISSUE-259 · ECZ Past Papers Section

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.ELIBRARY` | **Estimate:** 0.5 days

#### Description

ECZ (Examinations Council of Zambia) past papers are the most valuable exam preparation resource for Zambian students. A dedicated, prominently surfaced section for them.

#### Acceptance Criteria

- [ ] `/(student)/library/past-papers/page.tsx`:
  - Organised by: subject → year → paper type (Theory/Practical)
  - Filter: Grade 9 / Grade 12 (the main ECZ exam years)
  - Each paper: title, year, subject, download count
  - "Download" button: increments `downloadCount`, opens PDF
- [ ] Admin bulk upload: CSV + ZIP upload — map filenames to subjects and years
- [ ] Teacher can upload marking schemes alongside papers: paired in the catalog
- [ ] Student portal bottom nav: "Past Papers" shortcut shown prominently in exam period (driven by `schoolEvents` with `type: 'exam_period'`)

---

### ISSUE-260 · Library Card for Students (Digital)

**Type:** Frontend | **Priority:** P2 | **Feature Gate:** `Feature.LIBRARY` | **Estimate:** 0.5 days

#### Description

A digital library card in the student portal — shows current loans, due dates, fines, and borrowing history. Replaces the paper card that students lose.

#### Acceptance Criteria

- [ ] `/(student)/library/my-books/page.tsx`:
  - **Current Loans**: book cover, title, issued date, due date, days remaining (or days overdue in red)
  - "Renew" button per loan (if renewals allowed and count not exceeded)
  - Due date countdown: "Due in 3 days" / "Overdue by 2 days"
  - **History**: all past loans, returned dates, condition recorded
  - **Fines**: outstanding fines list, paid fines history
- [ ] `getMyLibraryProfile` query: all open and past issues for the current student user
- [ ] Guardian portal: child's library card shown under "More" tab — parent can see due dates and fines

---

## Epic 12 — Library Analytics & Overdue Management

---

### ISSUE-261 · Library Dashboard for Librarian

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.LIBRARY` | **Estimate:** 0.5 days

#### Description

The librarian's home screen. Real-time overview of the library's operational state.

#### Acceptance Criteria

- [ ] `getLibraryDashboardStats` query:
  ```typescript
  {
    totalTitles: number,
    totalCopies: number,
    copiesAvailable: number,
    copiesIssued: number,
    overdueLoans: number,
    overdueStudentsCount: number,
    totalFinesOutstanding: number,
    todayIssues: number,
    todayReturns: number,
    mostBorrowedThisTerm: LibraryBook[],   // Top 5
    recentActivity: LibraryIssue[],        // Last 10 transactions
  }
  ```
- [ ] `/(admin)/library/page.tsx`:
  - Summary stat cards with color coding (overdue count — red if > 0)
  - Live activity feed: today's issues and returns
  - Top 5 most borrowed books (encourages popular titles to be restocked)
  - "Issue a Book" and "Return a Book" prominent quick-action buttons

---

### ISSUE-262 · Library Term Report

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.LIBRARY` | **Estimate:** 0.5 days

#### Description

End-of-term library statistics for school management — showing how many students used the library, which subjects were most popular, and the status of all overdue and lost books.

#### Acceptance Criteria

- [ ] `getLibraryTermReport` query: total issues, unique borrowers, books not returned, fines collected, most popular titles and subjects
- [ ] `/(admin)/library/reports/term-summary/page.tsx`: on-screen summary with PDF export
- [ ] **Progress snapshot integration**: the Friday cron updated to include `currentLibraryLoansCount` and `overdueLibraryFinesZMW` on `studentProgressSnapshots` — Sprint 07 welfare indicators

---

### ISSUE-263 · Library Inventory and Stock Management

**Type:** Backend + Frontend | **Priority:** P2 | **Feature Gate:** `Feature.LIBRARY` | **Estimate:** 0.5 days

#### Description

Year-end stock management — find missing books, assess damaged copies, plan procurement, and print a full catalog for auditing.

#### Acceptance Criteria

- [ ] `getLibraryInventory` query: all books with copy-level detail — issued/available/withdrawn/lost counts per title
- [ ] "Stock Take" mode: librarian marks each physical copy as verified — unverified copies after stock take are flagged as potentially missing
- [ ] `generateLibraryCatalogPdf` action: printable A4 catalog of all books with Dewey code and shelf location (for posting in the library)
- [ ] "Procurement Report": books with 0 available copies that have been requested (from the reservation stub in ISSUE-252) — printable list for ordering

---

## Epic 13 — Portal Integrations

---

### ISSUE-264 · Student Portal — Full LMS Integration

**Type:** Frontend | **Priority:** P0 | **Feature Gate:** `Feature.LMS` | **Estimate:** 1 day

#### Description

Upgrade the Sprint 03 student portal (ISSUE-167) into a fully LMS-aware learning dashboard. The student portal was described as "genuinely useful" after Sprint 03 — this is where it becomes excellent.

#### Acceptance Criteria

- [ ] `/(student)/dashboard/page.tsx` fully updated:
  - "Today's Learning" section: today's timetable with deep-links to LMS courses (ISSUE-243)
  - "Assignments Due" widget: next 3 due dates across all courses
  - "Continue Learning" card: last-visited lesson with progress bar
  - "New Content" badge: unseen published lessons since last login
- [ ] Bottom navigation updated: "Learn" tab now points to `/(student)/lms` (previously placeholder)
- [ ] "Library" tab added to student navigation (if `Feature.LIBRARY`)
- [ ] Student portal now fully role-specific: shows `Feature.LMS` content only when enabled

---

### ISSUE-265 · Guardian Portal — LMS Visibility Enhancements

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

Expand the guardian portal's homework view (Sprint 03 ISSUE-143) with richer LMS data — course progress, assignment scores as they are released, and quiz results.

#### Acceptance Criteria

- [ ] `getHomeworkForGuardian` query (Sprint 03) updated:
  - Now includes `lmsSubmissions.score` and `lmsSubmissions.percentScore` when `status: 'returned'`
  - Includes `courseProgressPercent` per course
  - Includes quiz attempts count and best score

- [ ] `/(parent)/children/[id]/homework/page.tsx` upgraded:
  - Score shown on graded items: "17/20 (85%) ✓" in green
  - Course progress mini-bar added below subject name: "48% through course"
  - "View feedback" button expands teacher's feedback text (if `status: 'returned'`)
  - Audio feedback player: if teacher recorded voice feedback, a small play button appears

---

### ISSUE-266 · Teacher Portal — Combined Workload View

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.LMS` | **Estimate:** 0.5 days

#### Description

A teacher's daily workload summary that combines academic duties (mark entry, timetable) with LMS duties (submissions to grade, courses to update). One screen that answers "what do I need to do today?"

#### Acceptance Criteria

- [ ] `getTeacherTodayWorkload` query:
  ```typescript
  {
    todaysTimetable: TimetableSlot[],
    pendingSubmissions: { courseTitle, assignmentTitle, count }[],
    upcomingDeadlines: { assignmentTitle, courseTitle, dueDate, submittedCount }[],
    unreadMessages: { general: number, lms: number },
    marksToEnter: ExamSession[],           // Open exam sessions needing marks
    overdueMarkEntry: ExamSession[],       // Sessions past deadline
  }
  ```
- [ ] `/(teacher)/dashboard/page.tsx` (extending Sprint 01 placeholder):
  - Today's classes from timetable with "Take Register" and "Open Course" buttons per slot
  - "To Do" cards: pending submissions, marks to enter, messages
  - Upcoming deadlines tracker
  - Quick stats: "4 courses active · 23 submissions pending · 0 overdue mark sessions"

---

### ISSUE-267 · Admin LMS & Library Feature Activation Wizard

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** none (activation UI) | **Estimate:** 0.5 days

#### Description

A guided setup flow for school admins enabling LMS or Library features for the first time. First-time activation requires basic configuration before teachers can create courses.

#### Acceptance Criteria

- [ ] When `Feature.LMS` is enabled for the first time:
  - Wizard appears: "Let's set up your LMS"
  - Step 1: Confirm `staffSubjectAssignments` are complete ("Your teachers are assigned to subjects — ✓")
  - Step 2: Confirm timetable is published ("Timetable published — ✓")
  - Step 3: "Create courses for this term" — preview showing all courses that will be created, one per assignment
  - Step 4: Confirm → triggers `provisionCoursesForTerm` → shows progress
  - Completion: "24 courses created across 12 teachers. Teachers can now start adding content."

- [ ] When `Feature.LIBRARY` is enabled for the first time:
  - Wizard: configure loan periods and limits (libraryConfig defaults), then "Import your catalog" (CSV upload or start adding books manually)

---

## Schema Additions in This Sprint

| New Table             | Defined In |
| --------------------- | ---------- |
| `lmsCourseEnrolments` | ISSUE-220  |
| `questionBank`        | ISSUE-228  |
| `quizConfigs`         | ISSUE-228  |
| `quizAttempts`        | ISSUE-230  |
| `lmsLessonProgress`   | ISSUE-236  |
| `aiUsageLog`          | ISSUE-229  |
| `courseAnnouncements` | ISSUE-245  |
| `libraryBookCopies`   | ISSUE-250  |
| `digitalResources`    | ISSUE-258  |

**Fields added to existing tables:**

| Table                      | New Fields                                                                                                             | Issue          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------- |
| `lmsCourses`               | Full schema (title, status, isHomeworkOnly, gradeContributionPercent, syllabusCoverage, etc.)                          | ISSUE-219      |
| `lmsModules`               | `order`, `description`, `isVisible`, `totalLessons`                                                                    | ISSUE-219      |
| `lmsLessons`               | Full schema (contentType, textContent, pdfUrl, videoUrl, dueDate, maxScore, examSessionId, rubric, etc.)               | ISSUE-223      |
| `lmsSubmissions`           | Full schema (textResponse, fileUrls, status, rubricScores, teacherFeedback, feedbackAudioUrl, aiGradingData, etc.)     | ISSUE-232      |
| `libraryBooks`             | Full schema (author, publisher, deweyCode, totalCopies, availableCopies, coverImageUrl, etc.)                          | ISSUE-250      |
| `libraryIssues`            | Full schema (copyId, issuedBy, fineZMW, renewalCount, etc.)                                                            | ISSUE-254      |
| `studentProgressSnapshots` | `lmsEngagementScore`, `coursesEnrolled`, `coursesAbove80Percent`, `currentLibraryLoansCount`, `overdueLibraryFinesZMW` | ISSUE-248, 262 |
| `schools`                  | `libraryConfig`                                                                                                        | ISSUE-253      |

---

## Dependency Graph

```
ISSUE-219 (Auto-Course Creation) ── must run first
    └─► ISSUE-220 (Student Enrolment Engine)
    └─► ISSUE-221 (Teacher Course Management UI)
    └─► ISSUE-222 (Course Builder Shell)

ISSUE-222 (Course Builder)
    └─► ISSUE-223 (Text Lesson Editor)
    └─► ISSUE-224 (PDF Upload & Viewer)
    └─► ISSUE-225 (Video Embedding)
    └─► ISSUE-226 (External Links)
    └─► ISSUE-227 (Lesson Plan Conversion)
    └─► ISSUE-228 (Quiz Schema + Manual Builder)
            └─► ISSUE-229 (AI Quiz Generator) ── Feature.AI_QUIZ gated
            └─► ISSUE-230 (Quiz Taking — Student)

ISSUE-231 (Assignment Creation)
    └─► ISSUE-232 (Student Submission)
    └─► ISSUE-233 (Teacher Grading Interface)
    └─► ISSUE-234 (Deadline Notifications)
    └─► ISSUE-238 (Grade Release)

ISSUE-235 (Grades → examResults) ── depends on ISSUE-231 + Sprint 01 examSessions
ISSUE-236 (Course Progress Tracking) ── powers ISSUE-237 and ISSUE-247
ISSUE-237 (Grade Book) ── depends on ISSUE-233 + ISSUE-236
ISSUE-247 (Teacher Analytics) ── depends on ISSUE-236 + ISSUE-233

ISSUE-239 (Student Course Dashboard) ── depends on ISSUE-220
    └─► ISSUE-240 (Course View + Lesson Navigation)
    └─► ISSUE-241 (Assignment Dashboard)
    └─► ISSUE-242 (Progress Report)
    └─► ISSUE-243 (Timetable Quick Links)

ISSUE-244 (Discussion Threads) ── depends on Sprint 03 messageThreads
ISSUE-245 (Course Announcements)
ISSUE-246 (Private LMS Messaging)

ISSUE-248 (LMS Engagement Score) ── depends on ISSUE-236, 230, 232

ISSUE-250 (Library Catalog) ── must run first
    └─► ISSUE-251 (ISBN Lookup)
    └─► ISSUE-252 (Public Search)
    └─► ISSUE-253 (Library Settings)
    └─► ISSUE-254 (Book Issue — Barcode)
            └─► ISSUE-255 (Book Return)
            └─► ISSUE-256 (Renewal)
            └─► ISSUE-257 (Overdue Management)

ISSUE-258 (Digital Resources) ── Feature.ELIBRARY gated, parallel with physical library
    └─► ISSUE-259 (ECZ Past Papers)
    └─► ISSUE-260 (Student Library Card)

ISSUE-264 (Student Portal Integration) ── depends on most LMS epics being complete
ISSUE-265 (Guardian Portal Enhancements)
ISSUE-266 (Teacher Workload View)
ISSUE-267 (Feature Activation Wizard) ── can be done last
```

---

## Definition of Done

All Sprint 00–04 DoD criteria apply, plus:

- [ ] **Zero-migration upgrade verified**: A test school with Sprint 01 homework data (existing `lmsCourses` with `isHomeworkOnly: true`) upgrades cleanly via `upgradeCourseFromHomeworkFeed`. All existing `lmsLessons` and `lmsSubmissions` records are untouched. Verified by record count before and after.

- [ ] **AI quiz generation resilience tested**: `generateQuizWithAI` called with an intentionally bad prompt that causes Claude to return malformed JSON. System returns `{ error: ... }` gracefully — no unhandled exception, no half-created question bank records.

- [ ] **Marks integration end-to-end tested**: Create an assignment, link it to a CA1 exam session, submit a mock student response, grade it, push to exam results. Verify `examResults` record created with correct `marksObtained`, `subjectId`, `sectionId`. Then run `computeGradesForSession` (Sprint 01 ISSUE-082) and verify the LMS score appears in the student's term aggregate.

- [ ] **LMS engagement score verified**: Friday cron run produces `lmsEngagementScore` between 0–100 for all students enrolled in at least one active course. Students with no LMS courses have `null`, not 0. Verified with unit tests on `computeLmsEngagementScore`.

- [ ] **Feature gate isolation tested**: School with `Feature.LMS` disabled — no `/(teacher)/lms` routes accessible (404, not 500), `provisionCoursesForTerm` does not create any courses, `lmsCourseEnrolments` table remains empty. Tested against the Kabulonga seed school (day secondary — LMS not enabled by default).

- [ ] **Library barcode lookup performance**: `searchBookCopyByBarcode` query must return in under 100ms with a 10,000-record test catalog. The `.index('by_barcode', ['barcode'])` index must be in use (verified via Convex dashboard query analysis).

- [ ] **PDF signed URL expiry tested**: A Cloudinary signed URL for a lesson PDF expires after 1 hour. Accessing it after 2 hours returns 403. Verified manually in the staging environment.

- [ ] **Offline course viewing tested**: Student opens a text lesson while online → Chrome DevTools → Offline → reopens the same lesson URL → lesson content visible from Workbox cache with "Offline" indicator. Tests on real Android device with Airtel SIM.

- [ ] **`aiGradingData` field is null on all Sprint 05 submissions**: Every `lmsSubmissions` record created in this sprint has `aiGradingData: null`. Sprint 07 will populate it. Explicitly verified in seed data assertions.

---

## Sprint 05 → Sprint 06 Handoff Checklist

Before Sprint 06 (Transport Module) begins, verify:

- [ ] `lmsEngagementScore` is being written to `studentProgressSnapshots` by the Friday cron — Sprint 06 doesn't use this, but Sprint 07 needs consistent history back to this sprint
- [ ] `questionBank` table contains AI-generated questions with `isAiGenerated: true` and `aiGenerationPrompt` populated — Sprint 07 can use these for adaptive quiz personalisation
- [ ] `lmsCourseEnrolments` correctly unenrols students on section transfer — the `unenrolStudentFromSectionCourses` path is tested with a real transfer mutation
- [ ] `digitalResources` table exists with at least 5 ECZ past papers for Chengelo seed school — Sprint 07 at-risk engine uses past paper download frequency as an engagement indicator
- [ ] `courseAnnouncements` table is distinct from `announcements` — Sprint 06 transport module will use the school-wide `announcements` table (not `courseAnnouncements`) for route updates
- [ ] `libraryIssues.renewalCount` field is populated — Sprint 07 MoE library return reads this
- [ ] Sprint 03 `messageThreads` table now contains records with `context: 'lms'` — Sprint 06 transport will add `context: 'transport'` threads; the inbox UI must render both contexts
- [ ] `/(student)/library/page.tsx` renders correctly on a Redmi 9A simulation (320px width, 1.5x DPR) — Sprint 06 will similarly target low-end device users
- [ ] `aiUsageLog` table is capturing token counts for every Claude API call — Sprint 07 will add more AI features and needs cost visibility from the beginning
- [ ] The Evelyn Hone College seed school has `Feature.LMS` enabled with at least 3 published courses — Sprint 07 college mode GPA calculations need LMS course data to validate weighted grade logic

---

_Acadowl Development Guide — Sprint 05 — LMS & Library_
_Last updated: 2025 | Previous: Sprint 04 — Boarding Module | Next: Sprint 06 — Transport Module_

