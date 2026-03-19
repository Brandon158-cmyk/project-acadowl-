# Acadowl — Sprint 02: Fees & Finance

## Development Guide & Issue Tracker

> **Sprint Goal:** Build Acadowl's complete financial operating layer. By the end of this sprint, a bursar can define a fee structure, the system auto-generates ZRA-stamped invoices for every student at term start, guardians pay via Airtel Money or MTN MoMo and receive instant receipts, sibling discounts apply automatically, and the head teacher has a real-time financial dashboard. Every payment record, invoice, and credit note created here will be read — without modification — by the parent portal (Sprint 03), boarding module (Sprint 04), and transport module (Sprint 06).

---

## 📋 Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [Continuity from Sprints 00 & 01](#continuity-from-sprints-00--01)
3. [Forward-Compatibility Commitments](#forward-compatibility-commitments)
4. [Zambia Finance Context](#zambia-finance-context)
5. [Epic 1 — Fee Structure Configuration](#epic-1--fee-structure-configuration)
6. [Epic 2 — Invoice Generation Engine](#epic-2--invoice-generation-engine)
7. [Epic 3 — ZRA VSDC Integration](#epic-3--zra-vsdc-integration)
8. [Epic 4 — Sibling Discount Engine](#epic-4--sibling-discount-engine)
9. [Epic 5 — Mobile Money Payment Collection](#epic-5--mobile-money-payment-collection)
10. [Epic 6 — Cash, Bank & Manual Payments](#epic-6--cash-bank--manual-payments)
11. [Epic 7 — Credit Notes & Adjustments](#epic-7--credit-notes--adjustments)
12. [Epic 8 — Fee Arrears & Reminder Engine](#epic-8--fee-arrears--reminder-engine)
13. [Epic 9 — Bursar & Finance Dashboard](#epic-9--bursar--finance-dashboard)
14. [Epic 10 — Financial Reports & Exports](#epic-10--financial-reports--exports)
15. [Dependency Graph](#dependency-graph)
16. [Schema Additions in This Sprint](#schema-additions-in-this-sprint)
17. [Definition of Done](#definition-of-done)
18. [Sprint 02 → Sprint 03 Handoff Checklist](#sprint-02--sprint-03-handoff-checklist)

---

## Sprint Overview

| Field            | Value                                            |
| ---------------- | ------------------------------------------------ |
| **Sprint Name**  | Sprint 02 — Fees & Finance                       |
| **Duration**     | 5 weeks                                          |
| **Team Size**    | 3–4 developers                                   |
| **Total Issues** | 42                                               |
| **Prerequisite** | Sprint 01 complete and all handoff checks passed |

### Sprint Epics at a Glance

| #   | Epic                            | Issues | Est. Days |
| --- | ------------------------------- | ------ | --------- |
| 1   | Fee Structure Configuration     | 4      | 3         |
| 2   | Invoice Generation Engine       | 6      | 6         |
| 3   | ZRA VSDC Integration            | 4      | 4         |
| 4   | Sibling Discount Engine         | 3      | 3         |
| 5   | Mobile Money Payment Collection | 5      | 5         |
| 6   | Cash, Bank & Manual Payments    | 4      | 3         |
| 7   | Credit Notes & Adjustments      | 3      | 2         |
| 8   | Fee Arrears & Reminder Engine   | 5      | 4         |
| 9   | Bursar & Finance Dashboard      | 4      | 3         |
| 10  | Financial Reports & Exports     | 4      | 3         |

---

## Continuity from Sprints 00 & 01

Verify these Sprint 00/01 deliverables are in place before writing any code in this sprint.

| Deliverable                                                                                | How Sprint 02 Uses It                                                                                                    |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `invoices`, `payments`, `feeStructures` skeleton tables (Sprint 00 ISSUE-008)              | Sprint 02 fully implements these tables                                                                                  |
| `counters` table (Sprint 01 ISSUE-048)                                                     | Sprint 02 adds `invoice_number_{year}` counter for sequential invoice numbering                                          |
| `students.boardingStatus`, `students.currentGradeId`, `students.guardianLinks` (Sprint 01) | Fee structure looks up grade; boarding status determines which fee items apply; invoice is addressed to primary guardian |
| `school.zraTpin`, `school.zraVsdcSerial` (Sprint 00 schema)                                | ZRA VSDC API requires TPIN on every submission                                                                           |
| `school.siblingDiscountRules` (Sprint 00 schema)                                           | Sibling discount engine reads these rules                                                                                |
| SMS dispatch layer — `sendSms` action (Sprint 01 ISSUE-072)                                | Fee reminders and payment receipts call this action                                                                      |
| `notifications` table and `createNotification` mutation (Sprint 01 ISSUE-075)              | All finance notifications write to this table                                                                            |
| `terms` with `isActive: true` (Sprint 01 ISSUE-042)                                        | Every invoice is scoped to `school.currentTermId`                                                                        |
| `guardians` table with `phone` field (Sprint 00 ISSUE-006)                                 | Payment receipt SMS sent to guardian's phone                                                                             |
| `withSchoolScope`, `requirePermission` utilities (Sprint 00 ISSUE-009, 029)                | Applied to every finance mutation                                                                                        |
| `Feature.ZRA_INVOICING` flag in `Feature` enum (Sprint 00 ISSUE-023)                       | ZRA fiscal code is only submitted if this flag is on (some small schools may be VAT-exempt)                              |

---

## Forward-Compatibility Commitments

Decisions made in Sprint 02 that future sprints rely on without modification:

| Decision                                                                               | Future Sprint Dependency                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Invoice `lineItems` array is open-ended** — each item has `feeType: string`          | Sprint 04 (boarding) adds `feeType: 'boarding'`, `'meals'`, `'pocket_money_topup'` line items to the same invoice structure. Sprint 06 (transport) adds `feeType: 'transport'`. No schema change needed.                                                                    |
| **`generateTermInvoice` is parameterised** — it accepts an override array of fee items | Sprint 04 calls `generateTermInvoice` with extra boarding items appended; Sprint 06 calls it with transport item appended. The base function never changes.                                                                                                                 |
| **Payment `method` field includes future methods**                                     | `v.literal('pocket_money_deduction')` is defined now (Sprint 04 will use it for boarding canteen deductions). `v.literal('scholarship')` is defined for Sprint 07 bursary tracking.                                                                                         |
| **`creditNotes` table is a first-class entity**                                        | Sprint 04 overpayment refunds create credit notes. Sprint 06 transport opt-outs mid-term create prorated credit notes. Same table, same flow.                                                                                                                               |
| **`feeAuditLog` records every mutation**                                               | Sprint 07 financial audit reports read from this single table across all sprints' payment activity.                                                                                                                                                                         |
| **`invoices.feesDueOnReportCard: v.boolean()`**                                        | Sprint 01 scaffolded a blank "fees due" line on report cards. Sprint 02 sets this field so the report card engine (Sprint 01 ISSUE-084) can render the actual outstanding balance.                                                                                          |
| **Mobile money webhook endpoints are abstracted**                                      | The webhook handler normalises Airtel Money and MTN MoMo callbacks into a single `processPaymentWebhook` mutation. Sprint 06 transport fee payments and Sprint 04 pocket money deposits go through the same handler — just with a different `paymentContext` discriminator. |
| **`guardianLedger` table tracks balance per guardian per school**                      | Sprint 03 parent portal reads the real-time ledger balance. Sprint 04 pocket money trust account uses the same ledger pattern.                                                                                                                                              |

---

## Zambia Finance Context

Critical knowledge every developer must understand before building this sprint.

### ZRA Smart Invoice Requirements

The Zambia Revenue Authority requires all VAT-registered businesses to issue **Smart Invoices** that are verified by the VSDC (Virtual Sales Data Controller) system. For schools:

- Schools registered for VAT must submit every invoice to ZRA's VSDC API
- ZRA returns a **fiscal code** and a **QR code** that must appear on the printed/sent invoice
- Parents can scan the QR code at `verify.zra.org.zm` to confirm the invoice is genuine
- Education services are **VAT-exempt** (0% VAT) but must still be fiscalised
- Development levies and boarding fees may attract levy charges — the system must handle per-line-item VAT codes
- Schools NOT registered for ZRA can still use the system — `Feature.ZRA_INVOICING` flag controls whether the VSDC step runs

### Mobile Money in Zambia

- **Airtel Money**: Dominant network, especially in Lusaka and Copperbelt. API uses OAuth2. Merchant payments (C2B — Customer to Business) are the model used.
- **MTN MoMo**: Second network. Different API structure — uses Collection API with API keys per merchant.
- **Phone number routing**: 097x, 096x = Airtel; 076x = MTN (as of 2025 — stored in `zambia.ts` constants)
- **Transaction fees**: Airtel/MTN charge 1–2% per transaction. Schools absorb this (included in fee amount) — no surcharge to guardians.
- **Reconciliation challenge**: Mobile money operators send webhooks that may arrive out of order, be duplicated, or be delayed by up to 30 minutes. The payment processor must be idempotent.
- **NAPSA and NHIMA**: Payroll deductions — not in scope for Sprint 02, but `staff.napsaNumber` and `staff.nhimaNumber` are already in the schema for future payroll integration.

### Zambian Fee Structure Reality

- Most schools charge 3 fee categories: **Tuition**, **Development Levy**, and optionally **Boarding**
- Fees vary by grade (Grade 12 is often higher than Grade 8)
- Day and boarding students have completely different fee structures
- Some schools charge a one-off **Registration Fee** at enrolment
- Term fees are due at the START of term — not at end
- Many guardians pay in **instalments** — partial payment is the norm, not the exception
- School bank accounts: primarily Zanaco, FNB Zambia, Standard Chartered

---

## Epic 1 — Fee Structure Configuration

> **Goal:** A flexible fee configuration engine that lets each school define unlimited fee types per grade per term, with boarding/day variants, optional items, and early-payment discounts. Get this right and everything else flows automatically.

---

### ISSUE-091 · Fee Type Registry

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Define the reusable fee types used across all fee structures. A fee type is a named category (e.g., "Tuition", "Development Levy", "Boarding") that acts as the classification for invoice line items, reports, and ZRA levy codes.

#### User Story

> As a school bursar, I define the fee types for my school: "Tuition", "Development Levy", "PTA Contribution", "Boarding". These become the categories I use when building the term fee structure for each grade.

#### Acceptance Criteria

**Schema addition to `schools` document:**

```typescript
feeTypes: v.array(
  v.object({
    id: v.string(), // UUID — immutable once created
    name: v.string(), // 'Tuition', 'Development Levy'
    description: v.optional(v.string()),
    isRecurring: v.boolean(), // True = charged every term; False = one-off
    isOptional: v.boolean(), // True = guardian can opt out (e.g., sports kit)
    appliesToBoarding: v.union(
      // Controls which students are billed
      v.literal('day_only'),
      v.literal('boarding_only'),
      v.literal('all'),
    ),
    zraLevyCode: v.optional(v.string()), // ZRA product/levy code for VSDC submission
    zraVatCategory: v.union(
      v.literal('exempt'), // Education services — 0% VAT, still fiscalised
      v.literal('standard'), // 16% VAT
      v.literal('zero_rated'), // 0% VAT but reportable
      v.literal('levy'), // Special levy (e.g., development levy)
    ),
    isActive: v.boolean(),
    order: v.number(), // Display order on invoice
  }),
);
```

**`convex/fees/feeTypes.ts`:**

- [ ] `addFeeType` mutation: adds a new fee type to `school.feeTypes` array
- [ ] `updateFeeType` mutation: updates name, description, ZRA codes. Changing `id` is forbidden.
- [ ] `deactivateFeeType` mutation: sets `isActive: false` — hides from new structures but preserves history
- [ ] `reorderFeeTypes` mutation: updates `order` for drag-and-drop reordering (order affects invoice line item sequence)
- [ ] `seedDefaultFeeTypes` mutation: pre-populates standard Zambian school fee types:
  - Tuition (recurring, all students, exempt)
  - Development Levy (recurring, all students, levy)
  - Boarding Fee (recurring, boarding_only, exempt)
  - Meals (recurring, boarding_only, exempt)
  - Registration Fee (non-recurring, all students, exempt)
  - PTA Contribution (optional, all students, exempt)
  - Examination Fee (non-recurring, all students, exempt)

**Frontend — `/(admin)/fees/fee-types/page.tsx`:**

- [ ] List of fee types with type badges (recurring, optional, boarding-only)
- [ ] "Seed Defaults" button (one-time — disabled if fee types exist)
- [ ] Add/Edit fee type form with ZRA levy code field
- [ ] Warning when deactivating a fee type that has outstanding invoices using it

---

### ISSUE-092 · Fee Structure Builder

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 1.5 days

#### Description

The fee structure defines exactly how much each fee type costs for each grade in each term. This is the master price list the invoice generator reads. It must support grade-specific pricing, boarding/day splits, early-payment discounts, and instalment schedules.

#### User Story

> As a bursar, I open the fee structure for Term 1 2025. I set Grade 12 Tuition = ZMW 3,000 (Day) and ZMW 4,800 (Boarding). Grade 8 Tuition = ZMW 2,200 (Day). Development Levy = ZMW 500 for all grades. I set an early-payment discount: 5% off if paid before 15 Jan 2025.

#### Acceptance Criteria

**Backend — `convex/fees/structures.ts`:**

- [ ] `createFeeStructure` mutation:

  ```typescript
  // Args
  {
    termId: Id<'terms'>,
    gradeId: Id<'grades'> | null,    // null = applies to ALL grades (fallback)
    feeTypeId: string,               // References school.feeTypes[].id
    boardingStatus: 'day' | 'boarding' | 'all',
    amountZMW: number,
    earlyPaymentDiscount: {
      deadlineDate: string,          // 'YYYY-MM-DD'
      discountPercent: number,       // 5 = 5% off
    } | null,
    instalmentSchedule: Array<{      // Optional — some schools define instalment breakdowns
      dueDate: string,
      amountZMW: number,
      label: string,                 // 'First Instalment', 'Second Instalment'
    }>,
    notes: v.optional(v.string()),
  }
  ```

  - Validates `amountZMW > 0`
  - Validates no duplicate `termId + gradeId + feeTypeId + boardingStatus` entry
  - Requires `requirePermission(ctx, Permission.MANAGE_FEE_STRUCTURE)`

- [ ] `updateFeeStructure` mutation: amend amounts (blocked if any invoices using this structure have been paid)
- [ ] `deleteFeeStructure` mutation: only allowed if no invoices have been generated using this entry
- [ ] `copyFeeStructureToTerm` mutation: copies all fee entries from one term to another, adjustable before finalising — massive time-saver each term
- [ ] `getFeeStructureForStudent` query:
  - The most important query in the module
  - Takes `{ studentId, termId }`
  - Reads student's `currentGradeId` and `boardingStatus`
  - Returns ALL applicable fee structure entries for that student (grade-specific + fallback + boarding-appropriate)
  - Returns early-payment discount if deadline not passed
  - Used by invoice generator

**Frontend — `/(admin)/fees/structure/page.tsx`:**

- [ ] Term selector at top (defaults to active term)
- [ ] Fee structure table: rows = Grade, columns = Fee Type
  - Each cell shows the amount for that grade × fee type
  - Day/Boarding split shown as two amounts if applicable: "ZMW 2,200 (Day) / ZMW 4,800 (Boarding)"
  - Empty cells show "—" with a "+ Add" affordance
- [ ] Bulk edit mode: fill a column (same amount for all grades), then override individual cells
- [ ] Early payment discount section: show deadline date and discount % per term
- [ ] "Copy from Previous Term" button: pre-fills with last term's structure for editing
- [ ] Preview: "Student in Grade 9 Boarding will be invoiced: ZMW X" — live calculation as you edit

---

### ISSUE-093 · Instalment Schedule Management

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Many Zambian guardians cannot afford to pay the full term fee upfront. Schools define instalment schedules — the system tracks which instalments are due, sends reminders for each, and shows guardian which instalment to pay next.

#### Acceptance Criteria

- [ ] Instalment schedules stored as part of `feeStructures.instalmentSchedule` array (schema in ISSUE-092)
- [ ] `getInstalmentStatus` query:
  - For a given `invoiceId`: returns each instalment with: amount, dueDate, `status: 'paid' | 'overdue' | 'upcoming'`
  - Status computed dynamically from `payments` records matching the invoice
- [ ] When a partial payment is received (ISSUE-106), system auto-allocates the payment to the earliest unpaid instalment
- [ ] Instalment reminders: scheduled Convex job sends SMS 3 days before each instalment due date (extends ISSUE-113's arrears engine)
- [ ] Guardian portal (Sprint 03): shows instalment timeline with amounts due on each date

---

### ISSUE-094 · Registration Fee Handling

**Type:** Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Registration fees are one-off charges at student enrolment, unlike recurring term fees. They must be invoiced at enrolment, not at term start.

#### User Story

> When I enrol a new student mid-term, the system automatically generates a Registration Fee invoice of ZMW 150, separate from their term fees, payable immediately.

#### Acceptance Criteria

- [ ] `feeStructures` with non-recurring fee types (`isRecurring: false`) are NOT included in the bulk term invoice run
- [ ] `generateRegistrationFeeInvoice` internal action:
  - Called automatically by `enrolStudent` mutation (Sprint 01 ISSUE-048) if a `feeType: 'Registration Fee'` structure exists for the school
  - Creates a single-line-item invoice for the registration fee
  - Submits to ZRA VSDC immediately
  - Sends SMS to primary guardian
- [ ] Registration fee invoice is linked to the student's first academic term
- [ ] If a student transfers in mid-year and has already paid registration at another school, admin can waive the fee by creating a 100% credit note (ISSUE-116)

---

## Epic 2 — Invoice Generation Engine

> **Goal:** The invoice generator is the financial heartbeat of the system. It runs automatically at term start, creates legally compliant ZRA-stamped invoices, applies sibling discounts, and handles every edge case — mid-term enrolments, prorated fees, boarding status changes.

---

### ISSUE-095 · Core Invoice Generator

**Type:** Backend | **Priority:** P0 | **Estimate:** 2 days

#### Description

The central invoice generation function. Used by the bulk term run (ISSUE-096), individual regeneration (ISSUE-097), and programmatically by boarding (Sprint 04) and transport (Sprint 06) when those modules add line items.

#### Acceptance Criteria

**`convex/fees/invoiceGenerator.ts` → `generateInvoiceForStudent` internal action:**

```typescript
// This is an INTERNAL action — called by other mutations, not directly by clients
export const generateInvoiceForStudent = internalAction({
  args: {
    studentId: v.id('students'),
    termId: v.id('terms'),
    overrideLineItems: v.optional(
      v.array(
        v.object({
          // Sprint 04 (boarding) and Sprint 06 (transport) pass extra items here
          description: v.string(),
          quantity: v.number(),
          unitPriceZMW: v.number(),
          feeTypeId: v.string(),
          vatCategory: v.string(),
        }),
      ),
    ),
    prorationFactor: v.optional(v.number()), // 0.0–1.0 for mid-term enrolments
    draftOnly: v.optional(v.boolean()), // If true: creates draft, skips ZRA
  },
});
```

**Logic flow (in order):**

1. Load student: `currentGradeId`, `boardingStatus`, `guardianLinks`, `currentSectionId`
2. Find primary guardian (isPrimary: true in guardianLinks) — invoice addressed to them
3. Call `getFeeStructureForStudent(studentId, termId)` — returns applicable fee items
4. If `overrideLineItems` provided: append to the fee structure items (Sprint 04/06 add boarding/transport items this way)
5. Calculate line items: `{ description, quantity: 1, unitPriceZMW, vatCategory, feeTypeId }`
6. Apply proration: if `prorationFactor` is set (mid-term enrolment), multiply each recurring item's price by the factor
7. Check early-payment discount: if today ≤ earlyPaymentDeadline, compute discount amount
8. Detect sibling discount: call `calculateSiblingDiscount(guardianId, schoolId, termId)` — see ISSUE-099
9. Compute totals: `subtotalZMW`, `vatZMW` (0 for exempt), `discountZMW`, `siblingDiscountZMW`, `totalZMW`
10. Generate invoice number: `generateInvoiceNumber(schoolId, year)` — uses `counters` table with key `invoice_{year}`, same atomic pattern as student numbers
11. Insert `invoices` record with `status: 'draft'`
12. If `draftOnly: false` AND `Feature.ZRA_INVOICING` is enabled: submit to ZRA VSDC (ISSUE-100)
13. On ZRA success: update invoice with `zraFiscalCode`, `zraQrCodeUrl`, set `status: 'sent'`
14. Queue SMS to primary guardian: invoice ready notification
15. Return invoice ID

**Invoice number format:** `{SCHOOL_SHORT}-{YEAR}-{6-DIGIT-SEQUENCE}` e.g., `KBS-2025-000001`

- The 6-digit sequence resets each calendar year
- Stored in `counters` table with key `invoice_2025` (or `invoice_2026` etc.)

- [ ] `generateInvoiceForStudent` handles re-generation: if an unpaid invoice already exists for this student + term, it is voided and a new one generated. If a paid invoice exists, the function throws an error — cannot regenerate a paid invoice.
- [ ] All amounts stored in ZMW as `number` with 2 decimal places. No floating point arithmetic — use integer cents internally (`Math.round(amount * 100) / 100`).

---

### ISSUE-096 · Bulk Term Invoice Generation

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 1 day

#### Description

At term start, the admin runs a single operation that generates invoices for all active students in the school. This must handle a school of 1,500 students without timeout and show real-time progress.

#### User Story

> It's the start of Term 1 2025. As the bursar, I click "Generate Term 1 Invoices." The system runs, processing all 1,247 students. 15 minutes later, I see: "1,247 invoices generated. 12 students skipped (already have invoices). 3 errors (review required)." All parents receive an SMS.

#### Acceptance Criteria

**`convex/fees/bulkInvoice.ts`:**

- [ ] `startBulkInvoiceRun` mutation:
  - Validates: active term exists, fee structures defined for all grades
  - Creates a `invoiceRuns` record (schema below) with `status: 'pending'`
  - Schedules `processBulkInvoiceRun` internal action
  - Returns `invoiceRunId` immediately (non-blocking)
  - Requires `requirePermission(ctx, Permission.CREATE_INVOICE)`

- [ ] `processBulkInvoiceRun` internal action:
  - Processes students in batches of 50 (Convex action timeout: 10 minutes max)
  - For each active student: calls `generateInvoiceForStudent` with `draftOnly: false`
  - Updates `invoiceRuns.progress` after each batch (real-time polling shows progress bar)
  - Handles per-student errors gracefully: logs to `invoiceRuns.errors[]`, continues with next student
  - On completion: sets `status: 'complete'`, sends in-app notification to admin/bursar
  - If any student already has a paid invoice for this term: skips with `skippedReason: 'already_paid'`
  - If student enrolled after term start: applies proration automatically (see ISSUE-097)

- [ ] `getInvoiceRunStatus` query (real-time via Convex subscriptions):
  - Returns `{ status, totalStudents, processed, successful, skipped, errored, startedAt, completedAt }`
  - Frontend polls this via `useQuery` — updates progress bar in real-time

**Schema addition:**

```typescript
invoiceRuns: defineTable({
  schoolId: v.id('schools'),
  termId: v.id('terms'),
  triggeredBy: v.id('users'),
  status: v.union(
    v.literal('pending'),
    v.literal('running'),
    v.literal('complete'),
    v.literal('failed'),
  ),
  totalStudents: v.number(),
  processed: v.number(),
  successful: v.number(),
  skipped: v.number(),
  errored: v.number(),
  errors: v.array(
    v.object({
      studentId: v.id('students'),
      studentName: v.string(),
      reason: v.string(),
    }),
  ),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_school_term', ['schoolId', 'termId']);
```

**Frontend — `/(admin)/fees/invoices/generate/page.tsx`:**

- [ ] Pre-generation checklist shown before user confirms:
  - ✓ Active term is set (Term 1 2025)
  - ✓ Fee structures exist for all X grades
  - ✓ X students are active and eligible
  - ⚠ Y students have no guardian linked (will skip — list shown)
  - ⚠ Z students already have invoices for this term (will skip)
- [ ] "Generate Now" confirmation button with estimated SMS cost
- [ ] Progress screen after trigger: live progress bar (real-time from `getInvoiceRunStatus`), batch counter, estimated time remaining
- [ ] Completion screen: summary stats, link to error list, "View All Invoices" button

---

### ISSUE-097 · Prorated Invoice for Mid-Term Enrolments

**Type:** Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

When a student enrols after a term has started, they should only pay a portion of the term fee proportional to the remaining term days. This calculation must be transparent and auditable.

#### User Story

> A student enrols on 1 February, and Term 1 runs from 7 January to 28 March (80 school days total). 20 school days have passed. Their tuition fee is prorated: 60/80 = 75% of the full fee.

#### Acceptance Criteria

**`convex/fees/proration.ts`:**

- [ ] `calculateProrationFactor(enrollmentDate: string, termId: Id<'terms'>, schoolId: Id<'schools'>): number`
  - Counts SCHOOL days (using `schoolEvents` — excludes holidays and closures) from term start to enrollment date
  - Counts SCHOOL days from enrollment date to term end
  - Returns: `remainingDays / totalTermDays` rounded to 2 decimal places
  - If enrollment is on or before term start: returns 1.0 (no proration)
  - If enrollment is in the last week of term: returns minimum 0.25 (school's policy — configurable)

- [ ] `enrolStudent` mutation (Sprint 01 ISSUE-048) updated:
  - After creating the student: calls `generateInvoiceForStudent` with the computed `prorationFactor`
  - The generated invoice shows each prorated line item with: "Tuition (Prorated 75% — 60 of 80 days): ZMW 1,875.00"
  - The ZRA invoice includes the proration note in the line item description

- [ ] Proration factor is stored on the invoice: `invoices.prorationFactor: v.optional(v.number())`
- [ ] Non-recurring fees (Registration Fee, Examination Fee) are NOT prorated — charged in full

---

### ISSUE-098 · Individual Invoice Management

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Manage individual invoices: view, void, regenerate, send reminder, download PDF. The invoice is the primary financial document in the system.

#### Acceptance Criteria

**Backend — `convex/fees/invoices.ts`:**

- [ ] `getInvoiceById` query: returns full invoice with all line items, payment history, ZRA details
- [ ] `getInvoicesForStudent` query: all invoices for a student, all terms, sorted newest first
- [ ] `getInvoicesByTerm` query: paginated list of all invoices for a term — filterable by status
- [ ] `voidInvoice` mutation:
  - Sets `status: 'void'`
  - Creates a `feeAuditLog` entry
  - If invoice had a ZRA fiscal code: submits a credit note to ZRA VSDC (see ISSUE-100)
  - Cannot void an invoice with any payments against it — must create credit notes first
  - Requires `requirePermission(ctx, Permission.VOID_INVOICE)`
- [ ] `resendInvoiceSMS` mutation: re-sends the invoice notification SMS to the primary guardian
- [ ] `sendInvoiceWhatsApp` mutation (if `Feature.WHATSAPP_NOTIFICATIONS` enabled): sends PDF link via WhatsApp

**Frontend — `/(admin)/fees/invoices/[id]/page.tsx`:**

- [ ] Invoice detail view matching the ZRA invoice mock design from the architecture document
- [ ] Header: Invoice number, status badge (Draft/Sent/Partial/Paid/Overdue/Void), ZRA fiscal code, QR code
- [ ] Line items table with subtotal, discounts, VAT, total
- [ ] Payment history: table of all payments against this invoice (date, amount, method, reference, recorded by)
- [ ] Outstanding balance: prominently shown if not fully paid
- [ ] Actions panel: Send SMS, Download PDF, Void Invoice, Record Manual Payment
- [ ] Audit trail: who created the invoice, any modifications

**Frontend — `/(admin)/fees/invoices/page.tsx`:**

- [ ] Invoice list with columns: Student, Invoice No, Grade, Term, Amount, Paid, Balance, Status, Date
- [ ] Filters: Term, Grade, Section, Status, Date Range
- [ ] Search: by student name, invoice number, guardian name
- [ ] Bulk actions: Send SMS reminders (selected), Export CSV
- [ ] Summary bar: total invoiced, total paid, total outstanding

---

### ISSUE-099 · Invoice PDF Generation

**Type:** Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Generate a professional, ZRA-compliant PDF invoice using `@react-pdf/renderer`. The PDF is uploaded to Cloudinary and linked to the invoice record. The same PDF is used when sending to guardians via WhatsApp, email, or the parent portal.

#### Acceptance Criteria

**`convex/fees/invoicePdf.ts` → `generateInvoicePdf` action:**

- [ ] Triggered automatically after invoice creation (once ZRA fiscal code is received)
- [ ] PDF design must comply with ZRA Smart Invoice requirements:
  - Seller name and TPIN
  - Invoice number and date
  - Buyer name (guardian full name)
  - All line items with descriptions, quantity, unit price, VAT category
  - Subtotal, discount, VAT amount, total
  - ZRA fiscal code in monospace font, prominently displayed
  - QR code (generated from ZRA's QR code URL) — minimum 25mm × 25mm
  - Payment methods accepted
  - Due date
- [ ] School branding applied:
  - School logo in header
  - School name, address, phone, email
  - School motto if configured
- [ ] Sibling discount shown as a named negative line item: "Sibling Discount (2nd Child — 10%): -ZMW 220"
- [ ] Proration shown as a modifier on affected line items
- [ ] PDF uploaded to Cloudinary: `invoices/{schoolSlug}/{year}/{term}/{invoiceNumber}.pdf`
- [ ] `invoices.pdfUrl` field updated (schema addition)
- [ ] For incomplete invoices (status: 'draft'): watermark "DRAFT — NOT FISCALISED" diagonally across pages

---

## Epic 3 — ZRA VSDC Integration

> **Goal:** Full compliance with Zambia's Smart Invoice mandate. Every invoice is submitted to ZRA's VSDC API, receives a fiscal code and QR code, and is stored on the invoice document. Failures are handled gracefully — the invoice is still created but flagged for resubmission.

---

### ISSUE-100 · ZRA VSDC API Integration

**Type:** Backend | **Priority:** P0 | **Estimate:** 1.5 days

#### Description

Integrate with the ZRA VSDC (Virtual Sales Data Controller) API. This is a Zambia-specific requirement that has no test environment that is publicly available — build with a robust mock layer that can be switched to live with an environment variable.

#### User Story

> As the system, after generating an invoice, I submit it to ZRA's API. ZRA returns a fiscal code like "ZRA-FC-2025-0032948" and a QR code URL. I store both on the invoice. The parent can scan the QR code to verify the invoice with ZRA's public portal.

#### Acceptance Criteria

**`convex/fees/zra.ts`:**

- [ ] `submitInvoiceToZraVsdc` internal action:

  ```typescript
  // Input format as required by ZRA VSDC API (version 1.x)
  const payload = {
    tpin: school.zraTpin,
    bhfId: school.zraVsdcSerial || '000', // Branch ID / VSDC serial
    dvcSrNo: school.zraVsdcSerial,
    mrcNo: invoice.invoiceNumber,
    salesDt: formatDate(invoice.createdAt), // YYYYMMDD
    stockRlsDt: null, // Not applicable for services
    custTpin: null, // Guardian TPIN — null if private individual
    custNm: guardian.firstName + ' ' + guardian.lastName,
    items: invoice.lineItems.map((item) => ({
      itemSeq: index + 1,
      itemCd: item.feeTypeId,
      itemClsCd: item.zraItemClassCode, // ZRA classification code
      itemNm: item.description,
      qty: item.quantity,
      prc: item.unitPriceZMW,
      splyAmt: item.unitPriceZMW * item.quantity,
      dcRt: 0, // Discount rate
      dcAmt: 0,
      isrccCd: null,
      isrccNm: null,
      taxblAmt: item.vatApplicable ? item.totalZMW : 0,
      taxTyCd: item.vatCategory === 'exempt' ? 'E' : 'A', // ZRA tax type code
      taxAmt: item.vatZMW,
      totAmt: item.totalZMW,
    })),
    totItemCnt: invoice.lineItems.length,
    totTaxblAmt: invoice.subtotalZMW,
    totTaxAmt: invoice.vatZMW,
    totAmt: invoice.totalZMW,
    prchrAcptcYn: 'N', // Purchaser acceptance — not applicable
    remark: `Term ${term.name} ${academicYear.year} fees`,
    receipt: { custTpin: null, custNm: guardian.firstName + ' ' + guardian.lastName },
  };
  ```

  - Submits to ZRA VSDC endpoint
  - On success (HTTP 200): extracts `rcptSign` (fiscal code) and `qrCode` URL
  - Updates invoice: `zraFiscalCode`, `zraQrCodeUrl`, `zraSubmittedAt`
  - On HTTP error: logs full response, sets `invoice.zraStatus: 'failed'`, does NOT block invoice creation
  - On network error: marks for retry

- [ ] **ZRA mock mode** — enabled when `NEXT_PUBLIC_APP_ENV !== 'production'`:
  - Returns a plausible mock fiscal code: `ZRA-MOCK-{timestamp}-{random4digits}`
  - Returns a placeholder QR code image URL
  - Logs the full payload to console
  - Sets a `isMockFiscalCode: true` flag on the invoice (never shown to guardians)

- [ ] `resubmitFailedToZra` mutation:
  - For invoices with `zraStatus: 'failed'`: retry submission
  - Admin can trigger per-invoice or in bulk from the ZRA compliance dashboard

**Schema additions to `invoices` table:**

```typescript
zraStatus: v.union(
  v.literal('pending'),      // Not yet submitted
  v.literal('submitted'),    // Awaiting response
  v.literal('accepted'),     // Fiscal code received
  v.literal('failed'),       // Submission error
  v.literal('not_required')  // Feature.ZRA_INVOICING is off for this school
),
isMockFiscalCode: v.boolean(),
pdfUrl: v.optional(v.string()),
```

---

### ISSUE-101 · ZRA Credit Note Submission

**Type:** Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

When an invoice is voided or a credit note is issued, ZRA requires a corresponding credit note to be submitted to cancel the original fiscal record. This keeps the school's ZRA records balanced.

#### Acceptance Criteria

- [ ] `submitCreditNoteToZra` internal action:
  - Called by `voidInvoice` and `createCreditNote` mutations
  - Payload mirrors `submitInvoiceToZraVsdc` but with negative amounts and `receiptType: 'creditNote'`
  - Links to original invoice via `originalInvoiceNumber` field
  - Stores returned credit note fiscal code on the `creditNotes` record
- [ ] If ZRA submission for the credit note fails: logs to `feeAuditLog`, admin is notified — the credit note is still recorded in the system
- [ ] Credit notes appear in `/(admin)/fees/zra-compliance` dashboard

---

### ISSUE-102 · ZRA Compliance Dashboard

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Admin view showing the ZRA submission status for all invoices in the current term. Identifies any that failed submission and provides bulk resubmission.

#### Acceptance Criteria

**Frontend — `/(admin)/fees/zra-compliance/page.tsx`:**

- [ ] Summary cards: Total invoices | Successfully fiscalised | Failed | Not submitted | Mock (dev only)
- [ ] Failed invoices table: invoice number, student name, error message, retry button
- [ ] "Resubmit All Failed" bulk action
- [ ] ZRA TPIN and VSDC serial number settings link (goes to school settings)
- [ ] School's TPIN shown with a "Verified" or "Unverified" status (verified = at least 1 successful ZRA response)
- [ ] Monthly ZRA submission summary: invoices submitted × fiscal codes received × ZMW value

---

### ISSUE-103 · ZRA Settings and VSDC Device Registration

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Schools must register their VSDC device serial with ZRA before submitting invoices. This settings page manages the school's ZRA credentials.

#### Acceptance Criteria

- [ ] `/(admin)/settings/zra/page.tsx`:
  - TPIN input: validated format (10-digit Zambian TPIN)
  - VSDC Serial Number: assigned by ZRA on device registration
  - "Test Connection" button: submits a test ping to ZRA API and shows success/failure
  - ZRA branch code (bhfId): defaults to "000" for single-branch schools
- [ ] When `Feature.ZRA_INVOICING` is disabled: page shows explanation of ZRA requirements with a "Enable Smart Invoicing" toggle
- [ ] `updateZraSettings` mutation: updates `school.zraTpin` and `school.zraVsdcSerial`
- [ ] Audit log entry every time ZRA settings are changed (financial compliance requirement)

---

## Epic 4 — Sibling Discount Engine

> **Goal:** Automatic, accurate sibling discount detection and application. A guardian with 3 children at the same school should never have to ask for their discount — it is calculated and displayed on every invoice automatically.

---

### ISSUE-104 · Sibling Detection Algorithm

**Type:** Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Detect all sibling relationships for a guardian within the school and compute the correct discount for each child. Siblings are identified by shared `guardianId` in `student.guardianLinks`.

#### User Story

> Mrs. Musonda has three children at Kabulonga Girls: Natasha (Grade 12), Wande (Grade 10), Mutinta (Grade 8). The school's rule is: 2nd child 10% off tuition, 3rd+ child 15% off tuition. Natasha (eldest) pays full price. Wande gets 10% off. Mutinta gets 15% off.

#### Acceptance Criteria

**`convex/fees/siblingDiscount.ts`:**

- [ ] `getGuardianChildrenForTerm` query:
  - Takes `{ guardianId, termId }`
  - Returns all active students linked to this guardian for the current academic year
  - Orders by enrolment date (eldest enrolled first — they pay full price)
  - Excludes transferred/graduated students

- [ ] `calculateSiblingDiscount` internal function:

  ```typescript
  // Pure function — no DB calls, fully testable
  function calculateSiblingDiscount(params: {
    childRank: number; // 1 = first/oldest, 2 = second, etc.
    feeItems: InvoiceLineItem[];
    siblingRules: SiblingDiscountRule[];
  }): { discountZMW: number; discountPercent: number; appliedRule: string | null };
  ```

  - Finds the rule matching `childRank` in `school.siblingDiscountRules`
  - Applies discount ONLY to fee types listed in `rule.applyToFeeTypes`
  - Example: rule says discount only on "tuition" — boarding and development levy are NOT discounted
  - Returns 0 if no matching rule found (e.g., first child)

- [ ] `calculateSiblingDiscount` called inside `generateInvoiceForStudent` (ISSUE-095) as step 8
- [ ] Sibling rank is STABLE within a term — if a guardian adds a new child mid-term, existing invoices are NOT retroactively changed (new child gets the new rank on their fresh invoice)
- [ ] Edge case: guardian has children at TWO different schools on the platform — sibling discount is per-school, not platform-wide
- [ ] Edge case: student has two primary guardians (father and mother both `isPrimary: true`) — sibling detection uses ALL guardians, not just primary (uses a union of all guardian IDs linked to the student)

**Unit tests (required for this issue):**

- [ ] Single child → no discount
- [ ] Two children → second child gets 10% (per test school's rules)
- [ ] Three children → third child gets 15%
- [ ] Discount applies only to tuition, not development levy
- [ ] Child rank 1 with no applicable rule → zero discount, no error

---

### ISSUE-105 · Sibling Group Management UI

**Type:** Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Admin view of all sibling groups at the school. Useful for verifying that the sibling discount logic is working correctly and for handling edge cases.

#### Acceptance Criteria

- [ ] `/(admin)/fees/sibling-groups/page.tsx`:
  - Lists all guardians who have 2+ active children at the school
  - For each guardian: list of children ordered by rank, discount applied to each
  - "Override Rank" option: admin can manually set a child's sibling rank if the auto-detection is incorrect (e.g., step-siblings with different guardian records)
- [ ] `getGuardianSiblingGroups` query: returns all multi-child guardians for the school with their current discount calculations
- [ ] Sibling discount shown on student profile: "Sibling Discount: 10% off tuition (2nd of 2 children under Mrs. Musonda)"

---

### ISSUE-106 · Sibling Consolidated Invoice

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 1 day

#### Description

A guardian with multiple children can request (or the system can generate) a single consolidated invoice covering all their children's fees. This is one of Acadowl's major differentiators.

#### User Story

> Mr. Banda has three children at the school. Instead of receiving three separate invoices, he receives one consolidated invoice: "Total for Chanda + Mutale + Luyando Banda: ZMW 9,450. Pay in one Airtel Money transaction."

#### Acceptance Criteria

**`convex/fees/consolidatedInvoice.ts`:**

- [ ] `generateConsolidatedInvoice` action:
  - Takes `{ guardianId, termId }`
  - Fetches all open invoices for the guardian's children for the term
  - Creates a new `consolidatedInvoices` record (schema below) referencing all child invoices
  - Generates a consolidated PDF: sections per child, grand total at bottom
  - Submits to ZRA as a single invoice with `custNm: guardian.name, items: [all children's items combined]`
  - Sends SMS: "Your consolidated invoice for [N] children is ZMW [X]. Invoice: [number]. Pay via Airtel Money: [merchantCode]."

- [ ] **Schema addition:**

  ```typescript
  consolidatedInvoices: defineTable({
    schoolId: v.id('schools'),
    guardianId: v.id('guardians'),
    termId: v.id('terms'),
    childInvoiceIds: v.array(v.id('invoices')),
    invoiceNumber: v.string(), // e.g., KBS-CONS-2025-000042
    totalZMW: v.number(),
    paidZMW: v.number(), // Sum of payments across child invoices
    balanceZMW: v.number(),
    zraFiscalCode: v.optional(v.string()),
    zraQrCodeUrl: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
    status: v.union(v.literal('open'), v.literal('partial'), v.literal('paid'), v.literal('void')),
    createdAt: v.number(),
  }).index('by_guardian_term', ['guardianId', 'termId']);
  ```

- [ ] Payments against a consolidated invoice are distributed proportionally across child invoices
- [ ] If a child invoice is voided after consolidation: consolidated invoice is marked as stale; guardian must request a new consolidated invoice
- [ ] Frontend: guardian can request consolidated invoice from their portal (Sprint 03 will surface the button)
- [ ] Admin can generate on behalf of guardian from `/(admin)/fees/invoices/consolidated/page.tsx`

---

## Epic 5 — Mobile Money Payment Collection

> **Goal:** Frictionless Airtel Money and MTN MoMo payments that reflect instantly in the system. Guardians pay from their phones; the system confirms, updates the invoice balance, and sends a receipt — all within 60 seconds.

---

### ISSUE-107 · Airtel Money C2B Webhook Integration

**Type:** Backend | **Priority:** P0 | **Estimate:** 1.5 days

#### Description

Integrate Airtel Money's C2B (Customer-to-Business) payment collection. A guardian pays via USSD/app using the school's merchant code and their child's invoice number as the reference. Airtel sends a webhook; the system processes it.

#### User Story

> Mrs. Banda dials \*115# on her Airtel phone, selects "Pay Business", enters Kabulonga Boys' merchant code (45678), enters invoice number KBS-2025-000042 as the account reference, and pays ZMW 2,500. The school's system receives the payment within 30 seconds, updates the invoice, and sends her a receipt SMS.

#### Acceptance Criteria

**`src/app/api/webhooks/airtel-money/route.ts`:**

- [ ] Validates webhook signature (HMAC-SHA256 using `WEBHOOK_SECRET` env var)
- [ ] Parses Airtel Money C2B payload:
  ```typescript
  {
    transaction: {
      id: string,                    // Airtel's unique transaction ID
      message: string,               // "Payment received"
      type: "C2B",
      amount: number,
      currency: "ZMW",
      status: "TS" | "TF",          // TS = Transaction Success, TF = Transaction Failed
      airtelMoneyId: string,
      msisdn: string,                // Payer's phone number
    },
    reference: {
      id: string,                    // Invoice number entered by guardian
    }
  }
  ```
- [ ] Calls Convex HTTP action `processAirtelPaymentWebhook` (in `convex/http.ts`)
- [ ] Returns HTTP 200 immediately (before processing — Airtel has a 30s timeout)

**`convex/fees/webhooks.ts` → `processPaymentWebhook` internal mutation:**

- [ ] **Idempotency**: check if `payments` record with same `mobileMoneyReference` already exists — skip if so
- [ ] Look up invoice by `reference.id` (invoice number):
  - If not found: create an `unallocatedPayments` record for manual reconciliation
- [ ] Validate `transaction.status === 'TS'` before processing
- [ ] Create `payments` record:
  ```typescript
  {
    schoolId, invoiceId, studentId,
    amountZMW: transaction.amount,
    method: 'airtel_money',
    reference: transaction.id,
    mobileMoneyReference: transaction.airtelMoneyId,
    payerPhone: transaction.msisdn,
    receivedAt: Date.now(),
  }
  ```
- [ ] Update invoice: recalculate `paidZMW` and `balanceZMW`, update `status` (partial if balance > 0, paid if balance = 0)
- [ ] Update `guardianLedger` (ISSUE-119)
- [ ] Trigger receipt SMS to guardian (ISSUE-110)
- [ ] Create in-app notification for bursar: "Payment received: ZMW X from [phone] for invoice [number]"
- [ ] Log to `feeAuditLog`

---

### ISSUE-108 · MTN MoMo Collection API Integration

**Type:** Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Integrate MTN Zambia's Mobile Money Collection API. Different API structure from Airtel — uses API users and subscriptions keys. The webhook handler normalises to the same `processPaymentWebhook` mutation used by Airtel.

#### Acceptance Criteria

**`src/app/api/webhooks/mtn-momo/route.ts`:**

- [ ] Validates MTN's callback against `X-Callback-Token` header
- [ ] Parses MTN MoMo callback:
  ```typescript
  {
    financialTransactionId: string,
    externalId: string,              // The invoice number we set when initiating
    amount: string,                  // MTN sends as string e.g. "2500"
    currency: "ZMW",
    payer: { partyIdType: "MSISDN", partyId: string }, // Phone number
    status: "SUCCESSFUL" | "FAILED",
    reason: object,
  }
  ```
- [ ] Normalises to the same internal format and calls `processPaymentWebhook`
- [ ] Handles `FAILED` callbacks: marks any pending payment attempt as failed

**MTN MoMo Push Payment (for future — currently C2B only):**

- [ ] `initiateMtnPushPayment` action: proactively sends a payment request to a guardian's MTN phone (Sprint 03 parent portal "Pay Now" button uses this — stub now)

---

### ISSUE-109 · Mobile Money Merchant Configuration

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Each school must configure their Airtel Money and MTN MoMo merchant credentials and payment reference format. This page is also where the school's payment instructions are customised.

#### Acceptance Criteria

**Schema addition to `schools`:**

```typescript
mobileMoneyConfig: v.object({
  airtel: v.optional(
    v.object({
      merchantCode: v.string(), // School's Airtel merchant code: '45678'
      merchantName: v.string(), // 'KABULONGA BOYS SCHOOL'
      apiClientId: v.string(),
      apiSecret: v.string(),
      isActive: v.boolean(),
    }),
  ),
  mtn: v.optional(
    v.object({
      merchantCode: v.string(),
      apiUserId: v.string(),
      apiKey: v.string(),
      subscriptionKey: v.string(),
      callbackHost: v.string(),
      isActive: v.boolean(),
    }),
  ),
  paymentReferenceFormat: v.string(), // Instruction to guardians: 'Enter your invoice number as reference'
  paymentInstructions: v.optional(v.string()), // Full instructions shown on invoice
});
```

- [ ] `/(admin)/settings/payments/page.tsx`: configure Airtel and MTN credentials separately
- [ ] "Test Webhook" button: sends a mock payment webhook to verify end-to-end processing
- [ ] Payment instructions preview: shows exactly what the invoice will tell guardians to do
- [ ] QR code generator: generates a payment QR code containing the school's merchant code (for printing in admin office)

---

### ISSUE-110 · Payment Receipt Generation and SMS

**Type:** Backend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

After every successful payment (any method), immediately send a receipt SMS to the guardian and generate a PDF receipt.

#### Acceptance Criteria

**`convex/fees/receipts.ts` → `generatePaymentReceipt` internal action:**

- [ ] Called by `processPaymentWebhook` (mobile money) and `recordManualPayment` (cash/bank)
- [ ] SMS receipt format:
  ```
  Receipt for KBS-2025-000042. Paid: ZMW 2,500.00 via Airtel Money on 15/01/2025.
  Balance remaining: ZMW 0.00. Thank you! - Kabulonga Boys Secondary School.
  ```
- [ ] PDF receipt (lightweight — 1 page):
  - School header
  - Receipt number: `{invoiceNumber}-R{paymentSequence}` e.g., `KBS-2025-000042-R1`
  - Student name and invoice number
  - Payment amount, method, date, reference/transaction ID
  - Outstanding balance after this payment
  - Cumulative payments to date
  - School cashier name (for cash payments)
- [ ] PDF uploaded to Cloudinary
- [ ] `payments.receiptPdfUrl` field (schema addition) updated
- [ ] Guardian can download receipt from parent portal (Sprint 03)

---

### ISSUE-111 · Unallocated Payment Resolution

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

When a guardian pays via mobile money but enters the wrong invoice number (or no reference), the payment arrives in the system but cannot be auto-matched. The bursar must manually allocate it.

#### Acceptance Criteria

**Schema addition:**

```typescript
unallocatedPayments: defineTable({
  schoolId: v.id('schools'),
  source: v.union(v.literal('airtel_money'), v.literal('mtn_momo')),
  transactionId: v.string(),
  payerPhone: v.string(),
  amountZMW: v.number(),
  receivedAt: v.number(),
  rawPayload: v.string(), // JSON — for debugging
  status: v.union(v.literal('unresolved'), v.literal('allocated'), v.literal('refunded')),
  allocatedToInvoiceId: v.optional(v.id('invoices')),
  resolvedBy: v.optional(v.id('users')),
  resolvedAt: v.optional(v.number()),
})
  .index('by_school', ['schoolId'])
  .index('by_status', ['schoolId', 'status']);
```

- [ ] `/(admin)/fees/unallocated/page.tsx`:
  - List of unallocated payments with payer phone, amount, date
  - "Search by phone" to find the guardian
  - "Allocate to Invoice" dropdown: shows open invoices for that guardian's students
  - After allocation: creates a normal `payments` record and marks unallocated payment as resolved
- [ ] In-app notification to bursar when an unallocated payment arrives
- [ ] Badge count in nav: "Finance > Unallocated (3)" — real-time via Convex

---

## Epic 6 — Cash, Bank & Manual Payments

---

### ISSUE-112 · Cash Payment Recording

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 1 day

#### Description

The bursar records cash payments at the school office. The system prints a receipt immediately. Cash is the most common payment method at rural and semi-urban schools.

#### User Story

> A guardian walks into the bursar's office and pays ZMW 1,500 cash for their child's fees. The bursar opens the system, finds the student's invoice, enters the amount, and prints a receipt. The guardian walks out with a ZRA-compliant receipt in hand.

#### Acceptance Criteria

**`convex/fees/payments.ts` → `recordManualPayment` mutation:**

- [ ] Args: `{ invoiceId, amountZMW, method: 'cash' | 'bank', reference?, receivedBy: userId, notes?, receivedAt: string }`
- [ ] Validates `amountZMW > 0`
- [ ] Validates `amountZMW <= invoice.balanceZMW + 0.01` (allows tiny rounding tolerance) — overpayment is handled separately (ISSUE-116)
- [ ] Creates `payments` record
- [ ] Triggers `generatePaymentReceipt` (ISSUE-110)
- [ ] Updates invoice status and balance
- [ ] Logs to `feeAuditLog`
- [ ] Requires `requirePermission(ctx, Permission.RECORD_PAYMENT)`

**Frontend — `/(admin)/fees/payments/record/page.tsx`:**

- [ ] Student search bar (by name or student number) → auto-loads open invoices
- [ ] Invoice selector (if multiple open invoices)
- [ ] Payment form: Amount, Method (Cash / Bank Transfer / Cheque), Reference (bank ref/cheque no.), Date, Notes
- [ ] Running balance preview: shows balance after this payment in real-time
- [ ] "Record & Print Receipt" button: submits payment then opens receipt PDF in new tab for printing
- [ ] Quick-pay button: "Pay Full Balance" auto-fills the amount with the outstanding balance
- [ ] Keyboard shortcut: `Ctrl+P` after recording prints receipt without extra click (bursar office optimisation)

---

### ISSUE-113 · Bank Statement Reconciliation

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 1 day

#### Description

Schools receive bulk bank transfers at end-of-week from guardians who pay directly into the school's bank account. The bursar reconciles these by uploading a bank statement CSV and matching transactions to invoices.

#### Acceptance Criteria

**Schema addition:**

```typescript
bankStatementImports: defineTable({
  schoolId: v.id('schools'),
  bankName: v.string(),
  accountNumber: v.string(),
  statementPeriodFrom: v.string(),
  statementPeriodTo: v.string(),
  totalTransactions: v.number(),
  matchedTransactions: v.number(),
  unmatchedTransactions: v.number(),
  uploadedBy: v.id('users'),
  uploadedAt: v.number(),
  fileUrl: v.string(),
  status: v.union(v.literal('pending_review'), v.literal('reconciled')),
}).index('by_school', ['schoolId']);
```

**`convex/fees/bankReconciliation.ts`:**

- [ ] `importBankStatement` action:
  - Accepts CSV file content (Base64)
  - Parses common Zambian bank CSV formats: Zanaco, FNB, Standard Chartered, Atlas Mara
  - Attempts auto-match: transaction narration → invoice number regex search
  - Returns matched and unmatched transactions for review

**Frontend — `/(admin)/fees/bank-reconciliation/page.tsx`:**

- [ ] Upload CSV button: file picker for bank statement export
- [ ] Bank format selector: Zanaco / FNB / Standard Chartered / Other (manual column mapping)
- [ ] Match review table:
  - Auto-matched rows: green → confirm with single click
  - Unmatched rows: show "Find Student" search to manually link
  - Duplicate detection: flags if same transaction already recorded
- [ ] "Confirm All Matched" bulk action
- [ ] Reconciliation summary report: downloadable after completion

---

### ISSUE-114 · Payment History and Ledger

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Complete payment history per student and per guardian. The guardian ledger is the financial statement that parents see — every charge and every payment in chronological order.

#### Acceptance Criteria

**Schema addition:**

```typescript
guardianLedger: defineTable({
  schoolId: v.id('schools'),
  guardianId: v.id('guardians'),
  studentId: v.id('students'), // One ledger entry per student per guardian
  termId: v.id('terms'),
  entryType: v.union(
    v.literal('invoice'), // Debit: new charge
    v.literal('payment'), // Credit: payment received
    v.literal('credit_note'), // Credit: discount/adjustment
    v.literal('sibling_discount'), // Credit: sibling discount applied
    v.literal('early_payment_discount'), // Credit: early payment
  ),
  description: v.string(),
  debitZMW: v.number(), // Amount owed (0 for credits)
  creditZMW: v.number(), // Amount paid/credited (0 for debits)
  balanceAfterZMW: v.number(), // Running balance
  referenceId: v.string(), // invoiceId or paymentId
  transactionDate: v.string(),
  createdAt: v.number(),
})
  .index('by_guardian_student', ['guardianId', 'studentId'])
  .index('by_school_term', ['schoolId', 'termId']);
```

- [ ] Every invoice creation, payment, and credit note auto-creates a ledger entry
- [ ] `getStudentLedger` query: full financial statement for a student — all terms
- [ ] `getGuardianLedger` query: all students combined — used by parent portal (Sprint 03)
- [ ] Student profile Finance tab: ledger table with running balance, download statement button
- [ ] Ledger balance is the authoritative source — NOT recomputed from invoices/payments each time

---

## Epic 7 — Credit Notes & Adjustments

---

### ISSUE-115 · Credit Note Creation

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Credit notes reduce a guardian's balance — used for corrections, refunds, scholarships, and boarding boarding adjustment when a student leaves mid-term. Every credit note is submitted to ZRA as a negative transaction.

#### Acceptance Criteria

**`convex/fees/creditNotes.ts`:**

- [ ] `createCreditNote` mutation:
  - Args: `{ invoiceId, amountZMW, reason: string, type: 'correction' | 'refund' | 'scholarship' | 'boarding_adjustment' | 'transport_adjustment' | 'overpayment_refund', authorisedBy: userId }`
  - Validates `amountZMW <= invoice.totalZMW`
  - Creates `creditNotes` record (schema below)
  - Submits to ZRA (ISSUE-101)
  - Updates invoice balance
  - Creates ledger entry
  - Sends notification to guardian
  - Requires `requirePermission(ctx, Permission.VOID_INVOICE)` (same permission level)

**Schema addition:**

```typescript
creditNotes: defineTable({
  schoolId: v.id('schools'),
  invoiceId: v.id('invoices'),
  studentId: v.id('students'),
  guardianId: v.id('guardians'),
  creditNoteNumber: v.string(), // KBS-CN-2025-000012
  amountZMW: v.number(),
  reason: v.string(),
  type: v.string(),
  zraFiscalCode: v.optional(v.string()),
  zraCreditNoteNumber: v.optional(v.string()),
  authorisedBy: v.id('users'),
  status: v.union(v.literal('issued'), v.literal('applied'), v.literal('refunded')),
  appliedToInvoiceId: v.optional(v.id('invoices')),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_invoice', ['invoiceId']);
```

**Frontend:**

- [ ] "Issue Credit Note" button on invoice detail page
- [ ] Credit note form: amount, reason, type selector
- [ ] Credit note PDF generated (mirrors invoice design with "CREDIT NOTE" header and negative amounts)
- [ ] Credit notes list in `/(admin)/fees/credit-notes/page.tsx`

---

### ISSUE-116 · Overpayment Handling and Refunds

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

When a guardian pays more than they owe (common with mobile money — they may pay a round number), the overpayment is held as a credit and applied to the next invoice automatically.

#### Acceptance Criteria

- [ ] `recordManualPayment` updated: if `amountZMW > invoice.balanceZMW`, the excess creates a `creditNotes` record with `type: 'overpayment_refund'` and `status: 'issued'`
- [ ] `applyExistingCreditToInvoice` mutation: when a new invoice is generated for a guardian who has outstanding credit, the system offers to apply the credit automatically
- [ ] Guardian ledger shows credit balance when positive: "Credit on Account: ZMW 150"
- [ ] `getGuardianCreditBalance` query: returns total available credit for a guardian (sum of issued, unapplied credit notes)
- [ ] Actual cash refund workflow: admin marks `creditNote.status: 'refunded'` with payment reference

---

### ISSUE-117 · Scholarship and Bursary Management

**Type:** Backend + Frontend | **Priority:** P2 | **Estimate:** 0.5 days

#### Description

Some students receive full or partial scholarships (government, church, NGO, school bursary). These must be tracked as named credit notes that reduce the student's fee obligation each term.

#### Acceptance Criteria

**Schema addition:**

```typescript
scholarships: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  name: v.string(), // 'Government Bursary', 'Catholic Diocese Scholarship'
  provider: v.string(),
  discountType: v.union(
    v.literal('full'),
    v.literal('partial_percent'),
    v.literal('partial_fixed'),
  ),
  discountPercent: v.optional(v.number()),
  discountFixedZMW: v.optional(v.number()),
  applyToFeeTypes: v.array(v.string()), // Which fee types are covered
  validFrom: v.string(), // Academic year start
  validTo: v.string(), // Academic year end
  notes: v.optional(v.string()),
  documentUrl: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(),
})
  .index('by_student', ['studentId'])
  .index('by_school', ['schoolId']);
```

- [ ] When `generateInvoiceForStudent` runs, it checks for active scholarships and applies them as a discount line item
- [ ] Scholarship credit note is automatically submitted to ZRA
- [ ] `/(admin)/fees/scholarships/page.tsx`: list and manage scholarships per student
- [ ] Scholarship renewal reminder: 30 days before `validTo`, in-app notification to admin

---

## Epic 8 — Fee Arrears & Reminder Engine

> **Goal:** A configurable, automated debt management system that sends the right message to the right guardian at the right time — without the bursar having to manually manage a list. Respectful but persistent.

---

### ISSUE-118 · Arrears Classification and Aging

**Type:** Backend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Classify all outstanding invoices into aging buckets (current, 30, 60, 90+ days overdue). This drives the reminder escalation logic and the financial reports.

#### Acceptance Criteria

**`convex/fees/arrears.ts`:**

- [ ] `classifyArrearsForSchool` internal function (pure, called by queries):

  ```typescript
  type ArrearsAge = 'current' | 'overdue_30' | 'overdue_60' | 'overdue_90_plus';
  function classifyArrears(invoice: Invoice, today: string): ArrearsAge;
  ```

  - `current`: dueDate >= today (not yet due) or balance = 0
  - `overdue_30`: dueDate was 1–30 days ago and balance > 0
  - `overdue_60`: dueDate was 31–60 days ago
  - `overdue_90_plus`: dueDate was 61+ days ago

- [ ] `getArrearsReport` query:
  - Returns all invoices with `status: 'partial' | 'overdue'` for the school
  - Grouped by aging bucket
  - Includes: student name, guardian phone, amount owed, days overdue, last reminder sent date
  - Sortable by amount owed or days overdue
  - Filterable by grade, section

- [ ] `/(admin)/fees/arrears/page.tsx`:
  - Aging summary cards: "Current: ZMW X | 30 days: ZMW X | 60 days: ZMW X | 90+ days: ZMW X"
  - Filterable arrears table
  - Per-student action: "Send Reminder", "Mark as Arrangement" (payment plan agreed)
  - Bulk action: "Send Reminders to All 30-day Overdue"

---

### ISSUE-119 · Automated Fee Reminder Engine

**Type:** Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

A scheduled Convex job that automatically sends fee reminders at configurable intervals. The escalation ladder grows firmer with time — from gentle reminder to head teacher notification.

#### Acceptance Criteria

**`convex/crons.ts` — add daily job:**

```typescript
crons.daily(
  'fee-reminder-engine',
  { hourUTC: 5, minuteUTC: 0 }, // 07:00 CAT
  internal.fees.arrears.processReminderEngine,
);
```

**`convex/fees/arrears.ts` → `processReminderEngine` internal action:**

The engine evaluates every active school's overdue invoices and applies the following escalation ladder (configurable per school):

| Days Overdue    | Action                                    | Channel      |
| --------------- | ----------------------------------------- | ------------ |
| Due in 3 days   | Pre-due reminder                          | SMS          |
| Due today       | Due date reminder                         | SMS          |
| 7 days overdue  | Gentle reminder                           | SMS          |
| 14 days overdue | Firm reminder                             | SMS          |
| 21 days overdue | Final SMS + in-app alert to class teacher | SMS + In-App |
| 30 days overdue | Notify head teacher via in-app            | In-App       |
| 60 days overdue | Generate arrears letter PDF (printable)   | In-App (PDF) |

- [ ] **Deduplication**: check `reminderLog` table — never send two reminders for the same invoice on the same day
- [ ] **Do-not-disturb**: no reminders sent on Sundays or public holidays (checks `schoolEvents`)
- [ ] **Instalment-aware**: if instalment schedule is set, reminder fires for each instalment due date, not the full invoice

**Schema addition:**

```typescript
reminderLog: defineTable({
  schoolId: v.id('schools'),
  invoiceId: v.id('invoices'),
  guardianId: v.id('guardians'),
  reminderType: v.string(), // 'pre_due', 'due_today', '7_day', etc.
  channel: v.string(),
  sentAt: v.number(),
  notificationId: v.id('notifications'),
})
  .index('by_invoice', ['invoiceId'])
  .index('by_school', ['schoolId']);
```

**Reminder SMS templates (from `school.smsTemplates.feeReminder`):**

```
Pre-due: "Dear [Name], [Student]'s term fees of ZMW [balance] are due on [dueDate]. Pay via Airtel Money [merchantCode] or at school. Ref: [invoiceNumber]."

7-day: "Dear [Name], ZMW [balance] for [Student] is 7 days overdue (Invoice [number]). Please pay urgently to avoid disruption. Contact bursar: [phone]."

21-day: "URGENT: [Student]'s outstanding balance of ZMW [balance] (Invoice [number]) is 21 days overdue. Please contact the school immediately."
```

---

### ISSUE-120 · Arrears Configuration and School Policy

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Each school configures their own arrears policy: when to send reminders, what happens when a student is significantly in arrears (exam access restriction, report card hold).

#### Acceptance Criteria

**Schema addition to `schools`:**

```typescript
arrearsPolicy: v.object({
  reminderScheduleDays: v.array(v.number()), // ['-3', '0', '7', '14', '21', '30', '60']
  blockExamAccessAtDays: v.optional(v.number()), // null = never block
  holdReportCardAtDays: v.optional(v.number()), // null = never hold
  requireFullPaymentForPromotion: v.boolean(),
  gracePeriodDays: v.number(), // Days after due before counting as overdue
  arrangementNote: v.optional(v.string()), // Message shown to bursar for students on arrangements
});
```

- [ ] `/(admin)/settings/arrears-policy/page.tsx`: configure all policy settings
- [ ] `isEligibleForExamAccess` query: checks student's balance against `blockExamAccessAtDays`
  - Used by exam session mark entry: shows warning on student row if blocked
  - Note: this is a WARNING only — final decision is admin's. System never auto-blocks a student from sitting exams.
- [ ] `isReportCardHeld` query: checks before `releaseReportCards` (Sprint 01 ISSUE-086)
  - If held: report card is generated but NOT released to parent portal until admin overrides

---

### ISSUE-121 · Fee Clearance Certificate

**Type:** Backend + Frontend | **Priority:** P2 | **Estimate:** 0.5 days

#### Description

A formal clearance certificate confirming a student has no outstanding fees. Required for school transfers, university applications, and final results collection at Grade 12.

#### Acceptance Criteria

- [ ] `generateFeesClearanceCertificate` action:
  - Checks `invoice.balanceZMW === 0` for ALL terms the student has been enrolled
  - If any balance exists: returns `{ cleared: false, outstandingTerms: [...] }` instead of generating
  - Generates PDF certificate: school letterhead, student name, confirmation of clearance, date, bursar signature line
- [ ] Certificate shows: "This certifies that [Student Name] has no outstanding fee obligations at [School Name] as at [Date]"
- [ ] `/(admin)/students/[id]/documents` page: "Generate Clearance Certificate" button
- [ ] Certificate saved as a `studentDocuments` record (Sprint 01 ISSUE-052)
- [ ] Forced re-generation if new invoices are raised after certificate issuance (old certificate marked as void)

---

## Epic 9 — Bursar & Finance Dashboard

---

### ISSUE-122 · Real-Time Finance Dashboard

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

The bursar's home screen. Real-time financial overview of the school's current term — cash position, collection rate, outstanding balance, today's payments.

#### Acceptance Criteria

**`convex/fees/dashboardStats.ts`:**

- [ ] `getFinanceDashboardStats` query (real-time via Convex subscriptions):
  ```typescript
  {
    currentTerm: { name, startDate, endDate },
    totalInvoiced: number,         // Sum of all invoice totals for current term
    totalCollected: number,        // Sum of all payments for current term
    totalOutstanding: number,      // totalInvoiced - totalCollected
    collectionRate: number,        // percentage: 0–100
    todayCollections: number,      // Sum of payments received today
    todayPaymentCount: number,
    studentsWithBalance: number,   // Count of students with balance > 0
    studentsFullyPaid: number,
    recentPayments: Array<{        // Last 10 payments — live feed
      studentName, amount, method, time
    }>,
    collectionByMethod: {          // Pie chart data
      cash: number,
      airtel_money: number,
      mtn_momo: number,
      bank: number
    },
    overdueByAge: {
      overdue_30: number,
      overdue_60: number,
      overdue_90_plus: number,
    }
  }
  ```

**Frontend — `/(admin)/fees/dashboard/page.tsx`:**

- [ ] Role-aware: `school_admin` and `deputy_head` see full dashboard; `bursar` sees full dashboard; `teacher` roles cannot access this page
- [ ] Summary stat cards with trend vs previous term (up/down arrow + % change)
- [ ] Collection rate progress bar: e.g., "68% collected" with color coding (red < 50%, amber 50–80%, green > 80%)
- [ ] Live payment feed: scrolling ticker of today's payments (updates in real-time via Convex)
- [ ] Collection by method pie chart (recharts `PieChart`)
- [ ] Arrears aging bar chart (recharts `BarChart`)
- [ ] Quick actions: Record Payment, Generate Invoice, View Arrears, Run Reminders

---

### ISSUE-123 · Student Financial Profile

**Type:** Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

The financial view within the student profile. Everything the bursar needs to know about one student's financial status at a glance.

#### Acceptance Criteria

- [ ] Student Profile "Finance" tab (added to the tab structure from Sprint 01 ISSUE-049):
  - Current balance: prominently shown with color (green = 0, amber = < 1 term's fee, red = > 1 term's fee)
  - Active invoices: table of open invoices with pay button
  - Payment history: complete ledger (from `getStudentLedger`)
  - Credit notes issued
  - Scholarships active (if any)
  - "Record Payment" inline form (for bursar)
  - "Generate Invoice" button (for missing term invoice)
  - "Fee Clearance Certificate" button (enabled only if balance = 0)
- [ ] Balance shown in student list (ISSUE-050 `/(admin)/students/page.tsx` gets a "Balance" column added)

---

### ISSUE-124 · Bursar Shift Reconciliation (Daily Cashbook)

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

At end of day, the bursar prints a cashbook report of all cash payments received during their shift. This is used to reconcile the physical cash in the till with the system records.

#### Acceptance Criteria

**`convex/fees/cashbook.ts`:**

- [ ] `getDailyCashbookReport` query:
  - Takes `{ date, bursarUserId }`
  - Returns all `payments` with `method: 'cash'` and `receivedBy: bursarUserId` for the date
  - Totals by hour of day (for reconciliation)
  - Grand total cash received

**Frontend — `/(admin)/fees/cashbook/page.tsx`:**

- [ ] Date picker: defaults to today
- [ ] Cashbook table: time, student name, invoice number, amount, receipt number
- [ ] Grand total
- [ ] "Print Cashbook" button: clean print CSS for A4 printing
- [ ] Signature lines at bottom: Bursar signature and Senior Management counter-signature

---

### ISSUE-125 · Fee Structure Effectiveness Analytics

**Type:** Frontend + Backend | **Priority:** P2 | **Estimate:** 0.5 days

#### Description

Analytics showing how much of the expected revenue is being collected and where the gaps are — by grade, section, fee type, and payment method.

#### Acceptance Criteria

- [ ] `getCollectionAnalytics` query: revenue expected vs collected, broken down by grade
- [ ] `getPaymentMethodTrends` query: which payment methods guardians use, trended over past 3 terms
- [ ] `/(admin)/fees/analytics/page.tsx`:
  - Grade-level collection rate bar chart
  - Payment method trend line chart
  - Top 20 largest outstanding balances (anonymised for general view, full names for admin)
  - Year-on-year revenue comparison

---

## Epic 10 — Financial Reports & Exports

---

### ISSUE-126 · Term Financial Summary Report

**Type:** Backend + Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

The authoritative financial report for each term — total invoiced, collected, outstanding — broken down by fee type and grade. This is presented to the school board/PTA.

#### Acceptance Criteria

**`convex/fees/reports.ts`:**

- [ ] `getTermFinancialSummaryReport` query:
  ```typescript
  {
    term: Term,
    totalInvoiced: number,
    totalCollected: number,
    totalOutstanding: number,
    collectionRate: number,
    byFeeType: Array<{ feeType, invoiced, collected, outstanding }>,
    byGrade: Array<{ grade, invoiced, collected, outstanding, studentCount }>,
    byPaymentMethod: Array<{ method, total, count }>,
    creditNotesIssued: number,
    creditNotesTotal: number,
    refundsIssued: number,
  }
  ```
- [ ] `/(admin)/reports/finance/term-summary/page.tsx`: on-screen view with chart + table
- [ ] PDF export: formal report layout with school letterhead, suitable for board meeting presentation
- [ ] Excel/CSV export: raw data for school's own analysis

---

### ISSUE-127 · Student Fees Statement Export

**Type:** Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Export a complete financial statement for a student covering all terms they have been enrolled. Used for audit, school transfer, or guardian dispute resolution.

#### Acceptance Criteria

- [ ] `generateStudentFeesStatement` action:
  - Takes `{ studentId, fromTermId?, toTermId? }` (defaults to all terms)
  - PDF: A4 document, all invoices and payments in chronological order, running balance
  - Signed by bursar (placeholder signature line)
- [ ] Downloadable from student profile Finance tab
- [ ] Also available as CSV for data portability

---

### ISSUE-128 · Financial Audit Log

**Type:** Backend + Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Every financial mutation — invoice creation, voiding, payment recording, credit note — writes to a tamper-evident audit log. Essential for financial accountability in a school context.

#### Acceptance Criteria

**Schema addition (referenced throughout this sprint):**

```typescript
feeAuditLog: defineTable({
  schoolId: v.id('schools'),
  action: v.union(
    v.literal('invoice_created'),
    v.literal('invoice_voided'),
    v.literal('payment_recorded'),
    v.literal('payment_reversed'),
    v.literal('credit_note_created'),
    v.literal('scholarship_applied'),
    v.literal('zra_submitted'),
    v.literal('zra_failed'),
    v.literal('fee_structure_changed'),
    v.literal('invoice_regenerated'),
  ),
  performedBy: v.id('users'),
  relatedInvoiceId: v.optional(v.id('invoices')),
  relatedPaymentId: v.optional(v.id('payments')),
  relatedStudentId: v.optional(v.id('students')),
  amountZMW: v.optional(v.number()),
  previousValue: v.optional(v.string()), // JSON snapshot before change
  newValue: v.optional(v.string()), // JSON snapshot after change
  ipAddress: v.optional(v.string()),
  notes: v.optional(v.string()),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_invoice', ['relatedInvoiceId'])
  .index('by_student', ['relatedStudentId'])
  .index('by_performed_by', ['performedBy']);
```

- [ ] `/(admin)/fees/audit-log/page.tsx`: filterable audit log with date range, action type, user
- [ ] Action descriptions shown in human-readable format: "Invoice KBS-2025-000042 created by Bursar Chanda for student Mutale Banda — ZMW 3,500"
- [ ] Export to CSV for external audit
- [ ] Audit log records cannot be deleted — Convex mutation `deleteAuditLog` is forbidden in the codebase

---

### ISSUE-129 · Fees Integration into Report Cards

**Type:** Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Sprint 01 built report cards with a blank "Fees Due" notice section. Sprint 02 now connects this — the actual outstanding balance is shown on the report card PDF.

#### Acceptance Criteria

- [ ] `generateReportCard` action (Sprint 01 ISSUE-084) updated:
  - Calls `getStudentLedger(studentId, currentTermId)` to fetch outstanding balance
  - If `school.reportCardConfig.showFeesDueNotice === true` AND `balance > 0`:
    - Shows: "Outstanding Fees: ZMW [balance]. Please pay before [nextTermStartDate]."
  - If `balance === 0`:
    - Shows: "Fees cleared. Thank you."
  - If `school.reportCardConfig.showFeesDueNotice === false`: section is hidden
- [ ] Report card PDF re-generation is triggered if fees change after a card is already generated (admin prompted)

---

## Schema Additions in This Sprint

All are additions to `convex/schema.ts` — no existing tables modified.

| New Table              | Defined In |
| ---------------------- | ---------- |
| `invoiceRuns`          | ISSUE-096  |
| `consolidatedInvoices` | ISSUE-106  |
| `unallocatedPayments`  | ISSUE-111  |
| `bankStatementImports` | ISSUE-113  |
| `guardianLedger`       | ISSUE-114  |
| `creditNotes`          | ISSUE-115  |
| `scholarships`         | ISSUE-117  |
| `reminderLog`          | ISSUE-119  |
| `feeAuditLog`          | ISSUE-128  |

**Fields added to existing tables:**

| Table      | New Fields                                                                               | Added In                      |
| ---------- | ---------------------------------------------------------------------------------------- | ----------------------------- |
| `invoices` | `zraStatus`, `isMockFiscalCode`, `pdfUrl`, `prorationFactor`, `consolidatedInvoiceId`    | ISSUE-095, 097, 099, 100, 106 |
| `payments` | `payerPhone`, `receivedAt`, `receiptPdfUrl`                                              | ISSUE-107, 110                |
| `schools`  | `mobileMoneyConfig`, `arrearsPolicy`, `feeTypes` (moved from separate table to embedded) | ISSUE-091, 109, 120           |
| `students` | (no changes — all fee fields correctly pre-placed in Sprint 00/01)                       | —                             |

---

## Dependency Graph

```
ISSUE-091 (Fee Types)
    └─► ISSUE-092 (Fee Structure Builder)
            └─► ISSUE-093 (Instalment Schedules)
            └─► ISSUE-094 (Registration Fee)
            └─► ISSUE-095 (Core Invoice Generator) ◄─ ISSUE-104 (Sibling Discount)
                    └─► ISSUE-096 (Bulk Generation)
                    └─► ISSUE-097 (Proration)
                    └─► ISSUE-098 (Invoice Management)
                    └─► ISSUE-099 (Invoice PDF)
                            └─► ISSUE-100 (ZRA VSDC)
                                    └─► ISSUE-101 (ZRA Credit Notes)
                                    └─► ISSUE-102 (ZRA Dashboard)

ISSUE-104 (Sibling Detection)
    └─► ISSUE-105 (Sibling Group UI)
    └─► ISSUE-106 (Consolidated Invoice)

ISSUE-107 (Airtel Money Webhook)
ISSUE-108 (MTN MoMo Webhook)    ─── both call ─► ISSUE-095 logic via processPaymentWebhook
ISSUE-109 (Mobile Money Config) ─── required before 107 & 108 work in staging
    └─► ISSUE-110 (Receipt SMS)
    └─► ISSUE-111 (Unallocated Payments)

ISSUE-112 (Cash Payments) ──► ISSUE-110 (Receipt SMS)
ISSUE-113 (Bank Reconciliation)
ISSUE-114 (Guardian Ledger) ◄── written by: 095, 107, 108, 112, 115, 116

ISSUE-115 (Credit Notes)
    └─► ISSUE-116 (Overpayments)
    └─► ISSUE-117 (Scholarships)

ISSUE-118 (Arrears Classification)
    └─► ISSUE-119 (Reminder Engine) ─── requires ISSUE-072 SMS layer (Sprint 01)
    └─► ISSUE-120 (Arrears Policy)
    └─► ISSUE-121 (Clearance Certificate)

ISSUE-122 (Finance Dashboard) ─── requires all payment flows complete
ISSUE-123 (Student Finance Tab) ─── extends Sprint 01 student profile
ISSUE-124 (Daily Cashbook)

ISSUE-126 (Term Summary Report)
ISSUE-127 (Student Statement)
ISSUE-128 (Audit Log) ◄── written by every mutation in this sprint
ISSUE-129 (Report Card Integration) ─── extends Sprint 01 ISSUE-084
```

---

## Definition of Done

All Sprint 00/01 DoD criteria apply, plus:

- [ ] **ZRA tested in mock mode**: Every invoice generation in dev produces a mock fiscal code and logs the full VSDC payload to console. The payload is validated against ZRA's published schema.
- [ ] **Idempotency tested**: The Airtel Money and MTN MoMo webhook handlers tested with duplicate payloads — second call must produce no additional payment record and must return HTTP 200.
- [ ] **Sibling discount unit tested**: All discount calculation paths covered by pure function unit tests (ISSUE-104 requirement).
- [ ] **Concurrent invoice generation tested**: Bulk invoice run for 100 students produces 100 invoices with unique, sequential invoice numbers — no duplicates, no gaps.
- [ ] **Proration calculation tested**: Mid-term enrolment scenarios verified with exact day-count calculations against the school calendar.
- [ ] **Ledger balance verified**: After creating an invoice and recording a partial payment, the `guardianLedger` running balance equals `invoice.totalZMW - payment.amountZMW`. Checked programmatically in tests.
- [ ] **Zero-balance invoices handled**: If a student has a 100% scholarship, their invoice total is ZMW 0.00. The system must handle this — ZRA submission with zero total, no payment required.
- [ ] **Currency precision**: All financial calculations use integer-cent arithmetic internally. No floating-point precision errors. `1/3 * 3 = 1.00 ZMW`, not `0.9999999 ZMW`.
- [ ] **Report card integration verified**: Running `generateReportCard` for a student with an outstanding balance shows the fee notice; a student with ZMW 0 balance shows the cleared message.

---

## Sprint 02 → Sprint 03 Handoff Checklist

Before Sprint 03 (Guardian Portal & Communications) begins, verify:

- [ ] `guardianLedger` is populated with real data for all test school seed students — Sprint 03 parent portal's primary financial view reads this table
- [ ] `invoices.pdfUrl` is set for all generated invoices — Sprint 03's "Download Invoice" button links here
- [ ] `payments.receiptPdfUrl` is set for all recorded payments — Sprint 03's "Download Receipt" button links here
- [ ] `getGuardianLedger` query works correctly for cross-school guardians (guardian with children at two schools) — Sprint 03 parent portal must show all children
- [ ] `getGuardianCreditBalance` query returns correct value — Sprint 03 shows credit balance prominently on parent dashboard
- [ ] `getReportCardsForStudent` query (Sprint 01) now returns correctly with fee notices — Sprint 03 report card view must show updated fee balance
- [ ] `consolidatedInvoices` can be generated for a guardian with 3 children — Sprint 03 parent portal has a "Pay All" button that triggers this
- [ ] Airtel Money and MTN MoMo webhooks are tested with real credentials in staging environment — Sprint 03 adds a "Pay Now" button in the parent portal that triggers a payment push
- [ ] `reminderLog` is being written to — Sprint 03 parent portal shows "Last reminder sent" date on invoices
- [ ] All finance-related `notifications` records have `relatedEntityType: 'invoice'` and `relatedEntityId` set — Sprint 03 notification centre displays these with correct links
- [ ] `school.arrearsPolicy.holdReportCardAtDays` is configured on at least one test school and verified to block report card release — Sprint 03 must surface this correctly

---

_Acadowl Development Guide — Sprint 02 — Fees & Finance_
_Last updated: 2025 | Previous: Sprint 01 — Core Academic Foundation | Next: Sprint 03 — Guardian Portal & Communications_

