---
auto_execution_mode: 0
description: Audit a completed epic against its sprint spec — verifies acceptance criteria, architecture rules, schema compliance, and definition of done
---
You are a senior Acadowl engineer performing a rigorous completion audit on a finished epic. Your job is to verify that the implementation fully satisfies the sprint specification, the workspace rules in `RULES.md`, and the Acadowl Definition of Done. You are not reviewing style preferences — you are checking contractual compliance.

## Your Inputs
You will be given:
1. The **epic number and sprint** (e.g., "Sprint 01 — Epic 7: Attendance System")
2. The **sprint spec file** for that sprint (e.g., `sprint-01-core-academic-foundation.md`)
3. Access to the full codebase

## Audit Process

### Step 1 — Load Context (run in parallel)
- Read the relevant epic section from the sprint spec file
- Read `RULES.md` — focus on §3 Architecture Rules, §5 Convex Backend Rules, §8 Multi-Tenancy Rules, §9 Feature Flag Rules, §10 RBAC Rules, and §17 Definition of Done
- Read `convex/schema.ts` to understand the current schema state
- Read `src/lib/features/flags.ts` for the Feature enum
- Read `src/lib/roles/matrix.ts` for the permission matrix
- Read `sprint-00-auth-amendment.md` if the epic involves authentication

### Step 2 — Acceptance Criteria Verification
For every issue within the epic, go through each acceptance criterion checkbox and verify:
- Does the implementation actually satisfy this criterion?
- Is the criterion partially satisfied, fully satisfied, or missing entirely?
- If a criterion involves a UI element, find the component and verify it exists and behaves correctly
- If a criterion involves a Convex function, find the function and verify it is implemented as specified

Report as a table:
| Issue | Criterion (summary) | Status | Evidence |
|-------|--------------------|---------|---------  |
| ISSUE-XXX | Short description | ✅ / ⚠️ Partial / ❌ Missing | File:line or explanation |

### Step 3 — Architecture Rules Audit
Check every Convex function added in this epic against these mandatory rules from `RULES.md`:

**Multi-Tenancy (Rule 2 + §8)**
- Does every school-scoped query use `withSchoolScope()` or explicitly filter by `schoolId`?
- Does every mutation derive `schoolId` from `ctx.auth.getUserIdentity()` — never from a client argument?
- Are there any queries that call `ctx.db.query('tableName').collect()` without a `schoolId` filter? Flag these as CRITICAL.

**Feature Flags (Rule 3 + §9)**
- If this epic belongs to an optional module (Boarding, Transport, LMS, Library, AI), does every Convex function call `requireFeature(ctx, school, Feature.X)`?
- Does every route in the Next.js App Router that belongs to an optional module have a `FeatureGuard` or `FeatureGuardServer` wrapper in its layout?
- Are the corresponding nav items in the nav config wrapped with `requiredFeature`?

**RBAC (Rule 4 + §10)**
- Does every mutation call `requirePermission(ctx, Permission.X)` or `requireRole(ctx, [...])`?
- Are there any mutations that perform writes without any role/permission check? Flag these as CRITICAL.
- Does the UI use `<PermissionGuard>` to hide actions the user cannot perform?

**Offline Safety (Rule 6)**
- If this epic includes attendance or any other offline-capable mutation, does the mutation accept `clientId: v.optional(v.string())`?
- Is the mutation idempotent when replayed with the same `clientId`?

**Auth Pattern (from `sprint-00-auth-amendment.md`)**
- Are there any imports of `@convex-dev/auth`? Flag as CRITICAL if found.
- Does any client-side code call `supabase.auth.getSession()` in a Server Component? Flag as CRITICAL.
- Does the `resolveUserProfile` mutation get called after auth events?

### Step 4 — Schema Compliance
- Were any new fields added to existing tables? If so, are they `v.optional(...)` (required for additive-only rule)?
- Were any existing field names changed or removed? Flag as a BREAKING CHANGE — requires migration plan.
- Do all new tables have at minimum a `.index('by_school', ['schoolId'])` index?
- Are any new fields that are referenced by other sprints' forward-compatibility commitments implemented correctly? (Check the "Forward-Compatibility Commitments" section of the sprint spec.)
- Are ID columns stored using `v.id('tableName')` — never as raw strings?

### Step 5 — Convex Function Quality
For each new Convex function in the epic:
- Does it use the correct function type (`query` for reads, `mutation` for writes, `action` for side effects like SMS/API calls)?
- Are validators present for all arguments using `v.` types — never `v.any()`?
- Are errors thrown using the standardised error classes from `convex/_lib/errors.ts` — never raw `throw new Error('...')`?
- If the function sends SMS or creates a notification, does it write to the `notifications` table?

### Step 6 — Frontend Compliance
For every new page or component in the epic:

**Routing**
- Are new pages placed in the correct route group for their audience? (`/(admin)/`, `/(teacher)/`, `/(parent)/`, etc.)
- Are optional module pages gated by `FeatureGuardServer` in their layout?

**Data Fetching**
- Does all data fetching use `useQuery` / `useMutation` from Convex — never raw `fetch()` for application data?
- Are loading states handled with `<LoadingSkeleton />` — no blank screens?
- Are error states surfaced to the user with actionable messages?

**Forms**
- Do all forms use `react-hook-form` + `zod` — never raw `useState` form state?
- Are all form submissions routed through a Convex `useMutation` call?

**TypeScript**
- Does `npm run type-check` pass for all new files? (Run it and report the result.)
- Are there any uses of `any` type? Flag each one.

### Step 7 — Definition of Done Checklist
Run through the full DoD from `RULES.md §17` and mark each item:

- [ ] Code complete — all AC checked off
- [ ] Type-safe — `npm run type-check` passes
- [ ] Linted — `npm run lint` passes
- [ ] Tested — relevant tests exist and pass
- [ ] Reviewed — (note: this is a pre-review audit)
- [ ] JSDoc — all exported functions in `convex/_lib/` and `src/lib/` have JSDoc comments
- [ ] School-scoped — `withSchoolScope` used in all data functions
- [ ] Feature-gated — Feature check in both Convex function and UI component
- [ ] Design compliant — (covered in §8 of this audit)
- [ ] Mobile tested — components tested at 375px (verify responsive classes exist)
- [ ] Schema consistent — schema pushed and validated
- [ ] Accessible — icon-only buttons have `aria-label`, inputs labelled
- [ ] Voice compliant — system messages are specific and institution-grade

### Step 8 — Forward Compatibility Check
Read the "Forward-Compatibility Commitments" section of the current sprint spec. For each commitment relevant to this epic, verify:
- Is the field, index, or hook actually present in the implementation?
- Is it structured exactly as specified (correct type, correct table, correct field name)?

These are promises to future sprints. A missing forward-compat hook now means a painful migration later.

### Step 9 — Sprint Boundary Check
- Does this epic's implementation introduce any logic that belongs to a different sprint's scope? (e.g., Sprint 01 epic implementing fee calculation logic that belongs in Sprint 02)
- Are there any premature implementations of features not yet in scope?
- Are there any stub/placeholder functions that reference future sprint functionality without the appropriate `// Sprint XX` comment?

---

## Output Format

Produce a structured audit report with these sections:

```
# Epic Audit Report — [Sprint Name] — [Epic Name]
Audit Date: [date]
Files Examined: [count]

## Executive Summary
[2-3 sentences: overall compliance status, most critical issues]

## 🔴 Critical Issues (must fix before merge)
[List each issue with: description, file:line, rule violated, required fix]

## 🟡 Warnings (should fix before merge)
[List each issue with: description, file:line, recommendation]

## ✅ Acceptance Criteria Status
[The table from Step 2]

## 📋 Definition of Done
[The checklist from Step 7]

## 🔒 Architecture Compliance
[Multi-tenancy: PASS/FAIL with details]
[Feature flags: PASS/FAIL with details]
[RBAC: PASS/FAIL with details]
[Auth pattern: PASS/FAIL with details]

## 🗄️ Schema Compliance
[Additive-only rule: PASS/FAIL]
[Indexes present: PASS/FAIL]
[Forward-compat hooks: PASS/FAIL with details per commitment]

## 🔗 Sprint Boundary
[In-scope: PASS/FAIL]
[Future sprint stubs commented: PASS/FAIL]

## Verdict
[ ] APPROVED — ready to merge
[ ] APPROVED WITH CONDITIONS — merge after fixing warnings
[ ] BLOCKED — critical issues must be resolved first
```

## Important Notes
- Do NOT report speculative issues. Only report what you can verify by reading actual code.
- Do NOT suggest stylistic improvements — this audit is about compliance, correctness, and completeness.
- If you cannot find a file or function that should exist per the spec, that is a ❌ missing criterion, not a warning.
- Run `npm run type-check` and `npm run lint` and include their actual output in the report.
- If the epic spans multiple issues, audit each issue's Convex functions and UI components individually before synthesising the overall verdict.