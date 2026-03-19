# Acadowl — Sprint 00: Infrastructure & Authentication

## Development Guide & Issue Tracker

> **Sprint Goal:** Stand up a fully working, production-ready foundation that every future sprint builds on without revisiting. By the end of this sprint, any developer joining the project can spin up a local environment, authenticate as any role, and see the correct feature-gated UI for any school type — with zero hardcoded assumptions.

---

## 📋 Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [Architecture Principles](#architecture-principles)
3. [Repository & Folder Structure](#repository--folder-structure)
4. [Epic 1 — Project Scaffolding & Tooling](#epic-1--project-scaffolding--tooling)
5. [Epic 2 — Convex Schema Foundation](#epic-2--convex-schema-foundation)
6. [Epic 3 — Authentication System](#epic-3--authentication-system)
7. [Epic 4 — Multi-Tenancy Engine](#epic-4--multi-tenancy-engine)
8. [Epic 5 — Feature Flag System](#epic-5--feature-flag-system)
9. [Epic 6 — Role-Based Access Control (RBAC)](#epic-6--role-based-access-control-rbac)
10. [Epic 7 — Base UI Shell & Navigation](#epic-7--base-ui-shell--navigation)
11. [Epic 8 — School Onboarding Flow](#epic-8--school-onboarding-flow)
12. [Epic 9 — Developer Experience & Testing](#epic-9--developer-experience--testing)
13. [Dependency Graph](#dependency-graph)
14. [Definition of Done](#definition-of-done)
15. [Environment Variables Reference](#environment-variables-reference)

---

## Sprint Overview

| Field            | Value                                 |
| ---------------- | ------------------------------------- |
| **Sprint Name**  | Sprint 00 — Infrastructure & Auth     |
| **Duration**     | 4 weeks                               |
| **Team Size**    | 2–3 developers                        |
| **Total Issues** | 38                                    |
| **Priority**     | All issues are blocking for Sprint 01 |

### Sprint Epics at a Glance

| #   | Epic                           | Issues | Est. Days |
| --- | ------------------------------ | ------ | --------- |
| 1   | Project Scaffolding & Tooling  | 4      | 3         |
| 2   | Convex Schema Foundation       | 6      | 5         |
| 3   | Authentication System          | 7      | 5         |
| 4   | Multi-Tenancy Engine           | 5      | 4         |
| 5   | Feature Flag System            | 4      | 3         |
| 6   | Role-Based Access Control      | 5      | 4         |
| 7   | Base UI Shell & Navigation     | 5      | 4         |
| 8   | School Onboarding Flow         | 4      | 4         |
| 9   | Developer Experience & Testing | 4      | 2         |

---

## Architecture Principles

These decisions are **permanent** and apply to every future sprint. Every developer must read and understand these before starting any issue.

### 1. Convex is the Single Backend

There is no separate Express/Node server. All backend logic — queries, mutations, scheduled jobs, and external API calls — lives in the `convex/` directory. Next.js API routes are **only** used for webhook ingestion (Airtel Money, MTN MoMo, ZRA) and Next.js-specific server actions where required.

### 2. Every Document is School-Scoped

Every Convex table (except `schools` itself and `platformAdmins`) has a `schoolId: v.id('schools')` field. Every query has an index on `schoolId`. Middleware enforces this — a query that returns data without checking `schoolId` will be rejected in code review.

### 3. Feature Flags Gate Everything

No module assumes it is always available. Every route, every nav item, every Convex function that belongs to an optional module must check the relevant `Feature` flag before executing. This is non-negotiable. Day 1 of building the boarding module, the feature check goes in.

### 4. Roles are Composable, Not Hierarchical

A user has one `role` but roles are evaluated as a set of permissions, not a ladder. A `MATRON` has permissions that a `TEACHER` does not, and vice versa. Use permission functions, not role comparisons in business logic.

### 5. The Schema is the Contract

The Convex schema defined in Sprint 00 is the contract for all future sprints. **Additive changes are always allowed. Breaking changes require a migration plan.** Future sprints add new tables and new optional fields — they never rename or remove fields that exist from Sprint 00.

### 6. Design for Offline from Day 1

Mutations that will be used offline (primarily attendance) must be structured so the offline queue can replay them idempotently. The `_id` for offline records must be generated client-side (use `crypto.randomUUID()`) and the mutation must accept an optional `clientId` field for deduplication.

---

## Repository & Folder Structure

The complete target folder structure for the project. This is established in Sprint 00 and must not deviate. Future sprints add files inside these directories — they never create new top-level directories.

```
Acadowl/
├── .env.local                        # Local environment variables (never committed)
├── .env.example                      # Template for all required env vars
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, type-check, test on PR
│       └── deploy.yml                # Deploy to Vercel on main merge
├── convex/
│   ├── _generated/                   # Auto-generated by Convex CLI (never edit)
│   ├── schema.ts                     # THE SINGLE SOURCE OF TRUTH for all DB tables
│   ├── auth.ts                       # Supabase Auth configuration
│   ├── auth.config.ts                # Auth provider configuration
│   ├── http.ts                       # HTTP Action router (webhook entry points)
│   ├── crons.ts                      # All scheduled/recurring jobs
│   │
│   ├── _lib/                         # Shared internal utilities
│   │   ├── permissions.ts            # Permission check functions (canDo, requireRole)
│   │   ├── schoolContext.ts          # Extract + validate school from auth identity
│   │   ├── featureGuard.ts           # Enforce feature flag checks in mutations/queries
│   │   └── errors.ts                 # Standardized error codes and messages
│   │
│   ├── schools/
│   │   ├── queries.ts                # getSchoolBySlug, getSchoolById
│   │   ├── mutations.ts              # createSchool, updateSchool, updateBranding
│   │   └── validators.ts             # Zod-like v.object() validators for school ops
│   │
│   ├── users/
│   │   ├── queries.ts                # getMe, getUsersBySchool, getUserByPhone
│   │   ├── mutations.ts              # createUser, updateProfile, updateRole
│   │   └── validators.ts
│   │
│   ├── students/                     # Scaffold only in Sprint 00 — fleshed out Sprint 01
│   │   └── .gitkeep
│   ├── staff/                        # Scaffold only
│   │   └── .gitkeep
│   ├── attendance/                   # Scaffold only
│   │   └── .gitkeep
│   ├── exams/                        # Scaffold only
│   │   └── .gitkeep
│   ├── fees/                         # Scaffold only
│   │   └── .gitkeep
│   ├── boarding/                     # Scaffold only — Feature.BOARDING gated
│   │   └── .gitkeep
│   ├── transport/                    # Scaffold only — Feature.TRANSPORT gated
│   │   └── .gitkeep
│   ├── lms/                          # Scaffold only — Feature.LMS gated
│   │   └── .gitkeep
│   └── library/                      # Scaffold only — Feature.LIBRARY gated
│       └── .gitkeep
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout — ConvexProvider, ThemeProvider
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   │
│   │   ├── (auth)/                   # Route group — no shell, no sidebar
│   │   │   ├── layout.tsx            # Minimal auth layout (logo + card)
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Email/password login
│   │   │   ├── login-otp/
│   │   │   │   ├── page.tsx          # Phone number entry
│   │   │   │   └── verify/
│   │   │   │       └── page.tsx      # OTP code entry
│   │   │   ├── register/
│   │   │   │   └── page.tsx          # New school registration (Super Admin creates)
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (admin)/                  # School Admin / Head / Deputy / Bursar / Matron
│   │   │   ├── layout.tsx            # Admin shell: sidebar + topbar
│   │   │   ├── page.tsx              # Dashboard (redirect to /dashboard)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Role-aware dashboard widgets
│   │   │   ├── students/             # Sprint 01
│   │   │   ├── staff/                # Sprint 01
│   │   │   ├── attendance/           # Sprint 01
│   │   │   ├── academics/            # Sprint 01
│   │   │   ├── exams/                # Sprint 01
│   │   │   ├── fees/                 # Sprint 02
│   │   │   ├── boarding/             # Sprint 04 — Feature.BOARDING gated
│   │   │   ├── transport/            # Sprint 06 — Feature.TRANSPORT gated
│   │   │   ├── library/              # Sprint 05 — Feature.LIBRARY gated
│   │   │   ├── lms/                  # Sprint 05 — Feature.LMS gated
│   │   │   ├── reports/              # Sprint 02+
│   │   │   └── settings/
│   │   │       ├── page.tsx          # Settings overview
│   │   │       ├── branding/
│   │   │       │   └── page.tsx      # Logo, colors, motto — Sprint 00
│   │   │       ├── features/
│   │   │       │   └── page.tsx      # Feature toggle panel — Sprint 00
│   │   │       ├── grading/
│   │   │       │   └── page.tsx      # Sprint 01
│   │   │       └── custom-fields/
│   │   │           └── page.tsx      # Sprint 01
│   │   │
│   │   ├── (teacher)/                # Teacher-facing routes
│   │   │   ├── layout.tsx            # Teacher shell: slim sidebar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── register/             # Sprint 01 — offline attendance
│   │   │   ├── marks/                # Sprint 01
│   │   │   ├── lms/                  # Sprint 05
│   │   │   └── timetable/            # Sprint 01
│   │   │
│   │   ├── (parent)/                 # Guardian / Parent portal
│   │   │   ├── layout.tsx            # Parent shell: mobile-first, child switcher
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Multi-child summary
│   │   │   ├── children/             # Sprint 03
│   │   │   ├── fees/                 # Sprint 02
│   │   │   ├── transport/            # Sprint 06
│   │   │   └── messages/             # Sprint 03
│   │   │
│   │   ├── (student)/                # Student portal
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── timetable/            # Sprint 01
│   │   │   ├── results/              # Sprint 01
│   │   │   └── lms/                  # Sprint 05
│   │   │
│   │   ├── (driver)/                 # Driver GPS PWA — Sprint 06
│   │   │   ├── layout.tsx
│   │   │   └── route/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (platform)/               # Super Admin platform-level routes
│   │   │   ├── layout.tsx
│   │   │   ├── schools/
│   │   │   │   └── page.tsx          # All schools list
│   │   │   └── analytics/
│   │   │       └── page.tsx
│   │   │
│   │   └── api/
│   │       └── webhooks/
│   │           ├── airtel-money/
│   │           │   └── route.ts      # Sprint 02
│   │           ├── mtn-momo/
│   │           │   └── route.ts      # Sprint 02
│   │           └── zra-vsdc/
│   │               └── route.ts      # Sprint 02
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components (auto-generated)
│   │   ├── layout/
│   │   │   ├── AdminSidebar.tsx      # Sprint 00
│   │   │   ├── TeacherSidebar.tsx    # Sprint 00
│   │   │   ├── ParentShell.tsx       # Sprint 00
│   │   │   ├── Topbar.tsx            # Sprint 00
│   │   │   └── MobileNav.tsx         # Sprint 00
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx         # Sprint 00
│   │   │   ├── OtpForm.tsx           # Sprint 00
│   │   │   └── AuthGuard.tsx         # Sprint 00
│   │   ├── school/
│   │   │   ├── SchoolLogo.tsx        # Reads school branding — Sprint 00
│   │   │   └── FeatureGuard.tsx      # Wrapper that hides children if feature off
│   │   └── shared/
│   │       ├── PageHeader.tsx
│   │       ├── EmptyState.tsx
│   │       ├── LoadingSkeleton.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── lib/
│   │   ├── features/
│   │   │   ├── flags.ts              # Feature enum + helpers — Sprint 00 CRITICAL
│   │   │   └── presets.ts            # Default feature sets per school type
│   │   ├── roles/
│   │   │   ├── types.ts              # Role enum + Permission enum
│   │   │   └── matrix.ts             # Role → Permission[] mapping
│   │   ├── convex/
│   │   │   └── client.ts             # Convex client singleton
│   │   ├── utils/
│   │   │   ├── cn.ts                 # clsx + tailwind-merge helper
│   │   │   ├── formatZMW.ts          # Format Zambian Kwacha currency
│   │   │   └── schoolSlug.ts         # Subdomain extraction utility
│   │   └── constants/
│   │       ├── zambia.ts             # Provinces, districts, school types
│   │       └── ecz.ts                # ECZ grades, grading scale
│   │
│   ├── hooks/
│   │   ├── useSchool.ts              # Returns current school context
│   │   ├── useMe.ts                  # Returns current user + role
│   │   ├── useFeature.ts             # useFeature(Feature.BOARDING) → boolean
│   │   ├── usePermission.ts          # usePermission(Permission.MARK_ATTENDANCE) → boolean
│   │   └── useOfflineQueue.ts        # Sprint 01 — offline mutation queue
│   │
│   ├── providers/
│   │   ├── ConvexClientProvider.tsx  # ConvexProvider + ConvexAuthProvider
│   │   ├── SchoolProvider.tsx        # School context from subdomain/session
│   │   └── ThemeProvider.tsx         # School branding color injection
│   │
│   └── types/
│       ├── school.ts                 # TypeScript types mirroring Convex schema
│       ├── user.ts
│       └── api.ts                    # Generic API response types
│
├── public/
│   ├── icons/                        # PWA icons
│   └── manifest.json                 # PWA manifest — Sprint 00
│
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Epic 1 — Project Scaffolding & Tooling

> **Goal:** A cloneable repository where `npm install && npm run dev` gives a working local environment in under 5 minutes.

---

### ISSUE-001 · Initialize Next.js + Convex Monorepo

**Type:** Setup | **Priority:** P0 — Blocking all other issues | **Estimate:** 0.5 days

#### Description

Initialize the project repository with Next.js 14 (App Router), Convex, and all core dependencies. This is the first commit and establishes the exact versions every other developer will use.

#### User Story

> As a developer joining the project, I can clone the repository, run `npm install && npm run dev`, and see a working Next.js app connected to a Convex development deployment within 5 minutes.

#### Acceptance Criteria

- [ ] Next.js 14 initialized with TypeScript, Tailwind CSS, and App Router (`src/` directory)
- [ ] Convex initialized with `npx convex dev` working and generating `convex/_generated/`
- [ ] `convex-helpers` installed for useful utilities
- [ ] `next.config.ts` configured (not `.js`) with strict mode enabled
- [ ] `tsconfig.json` has strict mode, path aliases configured (`@/*` → `./src/*`, `~convex/*` → `./convex/*`)
- [ ] `.env.example` created with all required variable names (values empty)
- [ ] `.env.local` added to `.gitignore`
- [ ] `README.md` contains setup instructions: clone → install → env vars → dev
- [ ] `npm run build` completes without errors
- [ ] `npm run type-check` script added and passes

#### Dependencies Installed

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "convex": "latest",
    "@convex-dev/auth": "latest",
    "convex-helpers": "latest"
  },
  "devDependencies": {
    "typescript": "5.x",
    "@types/node": "20.x",
    "@types/react": "18.x",
    "@types/react-dom": "18.x",
    "tailwindcss": "3.x",
    "postcss": "latest",
    "autoprefixer": "latest",
    "eslint": "8.x",
    "eslint-config-next": "14.x",
    "@typescript-eslint/eslint-plugin": "latest",
    "@typescript-eslint/parser": "latest",
    "prettier": "3.x",
    "prettier-plugin-tailwindcss": "latest",
    "husky": "latest",
    "lint-staged": "latest",
    "vitest": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest"
  }
}
```

#### Technical Notes

- Use `npx create-next-app@latest` with `--typescript --tailwind --app --src-dir --import-alias "@/*"` flags
- Then run `npx convex dev --once` to initialize Convex and get the `CONVEX_DEPLOYMENT` URL
- Do NOT use `next/font` with Google Fonts in the root layout yet — that comes in ISSUE-026

---

### ISSUE-002 · Install and Configure UI Component Library

**Type:** Setup | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Install and configure shadcn/ui as the component foundation. Initialize all components that will be used across the entire system so they are available from Sprint 01 onwards. Also install and configure supporting libraries.

#### User Story

> As a developer, I have access to a consistent, accessible component library so I never write raw HTML for inputs, buttons, dialogs, or tables.

#### Acceptance Criteria

- [ ] shadcn/ui initialized with `npx shadcn-ui@latest init` using the **Neutral** base color
- [ ] The following shadcn components pre-installed:
  - Layout: `card`, `separator`, `sheet`, `dialog`, `drawer`
  - Navigation: `navigation-menu`, `breadcrumb`, `tabs`, `sidebar`
  - Forms: `button`, `input`, `label`, `form`, `select`, `checkbox`, `radio-group`, `switch`, `textarea`, `date-picker`
  - Feedback: `alert`, `badge`, `progress`, `skeleton`, `toast`, `sonner`, `tooltip`
  - Data: `table`, `avatar`, `command`, `dropdown-menu`, `popover`
- [ ] `lucide-react` installed for icons
- [ ] `clsx` and `tailwind-merge` installed; `cn()` utility created at `src/lib/utils/cn.ts`
- [ ] `@hookform/resolvers` and `react-hook-form` installed for all forms
- [ ] `zod` installed for client-side validation schemas
- [ ] `date-fns` installed for date formatting throughout the system
- [ ] `recharts` installed for analytics charts (used from Sprint 02 onwards)
- [ ] CSS variables for school branding set up in `globals.css` (--school-primary, --school-secondary)
- [ ] Tailwind config extended with custom `school` color that reads CSS variables
- [ ] Dark mode configured as `class` strategy (not media query) for future admin theme toggle

#### Technical Notes

- The `--school-primary` CSS variable defaults to Acadowl green (`#1a6b3c`) and is overridden by the ThemeProvider in ISSUE-032 using the school's branding colors
- Add a `tailwind.config.ts` extension: `colors: { school: { primary: 'hsl(var(--school-primary))', ... } }`

---

### ISSUE-003 · Configure ESLint, Prettier, and Git Hooks

**Type:** Setup | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Enforce code quality standards from day one. Every commit must pass linting and type-checking automatically. This prevents technical debt from accumulating across a multi-developer sprint.

#### Acceptance Criteria

- [ ] ESLint configured with `eslint-config-next`, TypeScript rules, and import ordering rules
- [ ] Prettier configured with `prettier-plugin-tailwindcss` for consistent class ordering
- [ ] `.prettierrc` settings: `singleQuote: true`, `trailingComma: 'all'`, `semi: true`, `tabWidth: 2`
- [ ] Husky initialized with pre-commit hook running `lint-staged`
- [ ] `lint-staged` config: runs ESLint + Prettier on staged `.ts/.tsx` files
- [ ] `npm run lint` script fails on any ESLint error (not just warning)
- [ ] `npm run format` script runs Prettier across all files
- [ ] VS Code settings file (`.vscode/settings.json`) added recommending format-on-save
- [ ] VS Code extensions file (`.vscode/extensions.json`) added with recommended extensions: ESLint, Prettier, Tailwind CSS IntelliSense, Convex
- [ ] CI workflow (`.github/workflows/ci.yml`) runs `lint`, `type-check`, and `test` on every PR

#### ESLint Rules of Note

```json
{
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "import/order": ["error", { "groups": ["builtin", "external", "internal"] }]
  }
}
```

---

### ISSUE-004 · Configure Next.js for Multi-Tenant Subdomain Routing

**Type:** Setup | **Priority:** P0 | **Estimate:** 1 day

#### Description

Configure Next.js and the deployment environment to support subdomain-based multi-tenancy. Each school accesses their instance via `{schoolSlug}.Acadowl.zm`. The middleware must extract the school slug from the hostname on every request before any route handler runs.

#### User Story

> As a school admin at Kabulonga Boys, when I visit `kabulonga.Acadowl.zm`, the system shows me Kabulonga's data. If I somehow access `chengelo.Acadowl.zm`, I see Chengelo's data — never mixed up.

#### Acceptance Criteria

- [ ] `next.config.ts` configured to allow all subdomains of `Acadowl.zm`
- [ ] `src/middleware.ts` created at the root of `src/` (Next.js middleware location)
- [ ] Middleware correctly extracts `schoolSlug` from:
  - Production: `kabulonga.Acadowl.zm` → slug = `kabulonga`
  - Development: `kabulonga.localhost:3000` → slug = `kabulonga` (local dev with `/etc/hosts` or `next-dev-subdomain`)
  - Fallback: query param `?school=kabulonga` for environments that don't support subdomains
- [ ] Extracted `schoolSlug` is injected into request headers as `x-school-slug`
- [ ] If no slug is found and path is not `/` or `/onboard`, middleware redirects to `www.Acadowl.zm`
- [ ] `src/lib/utils/schoolSlug.ts` utility function `getSchoolSlug(headers: ReadonlyHeaders): string | null` created
- [ ] Platform admin routes (`platform.Acadowl.zm`) handled separately — do not try to resolve a school
- [ ] Unit tests for the slug extraction utility covering all three extraction methods
- [ ] Local development documented in `README.md` — how to set up `kabulonga.localhost` on Mac/Linux/Windows

#### Technical Notes

- Use `next-subdomain` package or manual hostname parsing — do NOT use `@vercel/edge-config` (avoids Vercel lock-in)
- The `x-school-slug` header is read in Server Components via `headers()` from `next/headers`
- Convex queries do NOT use this header — they use the `schoolId` from the authenticated user's identity (set during login). The header is for server-rendered pages and non-authenticated routes only.
- Add `rewrites` in `next.config.ts` for local dev to map `kabulonga.localhost:3000` → `localhost:3000` with the school header injected

---

## Epic 2 — Convex Schema Foundation

> **Goal:** Define every database table the entire system will ever need — including tables for modules that won't be built until Sprint 04, 05, or 06. The schema is the contract. Get it right once.

---

### ISSUE-005 · Define Core Schema — Schools, Users, and Academic Structure

**Type:** Backend | **Priority:** P0 | **Estimate:** 1.5 days

#### Description

Define the foundational Convex schema tables for schools (tenants), users, and the academic hierarchy. These tables are referenced by every other table in the system. This is the most critical issue in the sprint.

#### User Story

> As the system architect, I need the database schema to fully represent the real-world structure of a Zambian school — including class sections, terms, and academic years — so that future developers can build any module without altering the core structure.

#### Acceptance Criteria

- [ ] `convex/schema.ts` created with all tables in this issue defined
- [ ] All tables have indexes defined inline — no missing indexes
- [ ] TypeScript types inferred from the schema exported via `Doc<'tableName'>` pattern
- [ ] Schema passes `npx convex dev` validation with no warnings

#### Tables to Define

**`schools`** — The tenant table. One row per school.

```typescript
schools: defineTable({
  slug: v.string(), // URL-safe identifier: 'kabulonga-boys'
  name: v.string(), // 'Kabulonga Boys Secondary School'
  shortName: v.optional(v.string()), // 'KBS' — used in report card headers
  type: v.union(
    v.literal('day_primary'),
    v.literal('day_secondary'),
    v.literal('boarding_primary'),
    v.literal('boarding_secondary'),
    v.literal('mixed_secondary'), // Some boarders, some day students
    v.literal('college'),
    v.literal('technical'),
  ),
  province: v.string(), // 'Lusaka' — from zambia.ts constants
  district: v.string(), // 'Lusaka'
  address: v.string(),
  phone: v.string(),
  email: v.optional(v.string()),

  // Regulatory
  moeCode: v.optional(v.string()), // Ministry of Education school code
  heaCode: v.optional(v.string()), // Higher Education Authority code (colleges)
  zraTpin: v.string(), // ZRA Tax Payer ID Number — required for invoicing
  zraVsdcSerial: v.optional(v.string()), // VSDC device serial after ZRA registration

  // Academic configuration — controls how exams, grading, and calendar work
  gradingMode: v.union(
    v.literal('ecz'), // ECZ 1-9 scale (primary/secondary)
    v.literal('percentage'), // Raw percentage (some colleges)
    v.literal('gpa'), // 4.0 GPA scale (colleges/tertiary)
  ),
  academicMode: v.union(
    v.literal('term'), // 3 terms per year (primary/secondary)
    v.literal('semester'), // 2 semesters per year (college)
  ),
  currentAcademicYearId: v.optional(v.id('academicYears')),
  currentTermId: v.optional(v.id('terms')),

  // Feature flags — the core of adaptive modules
  enabledFeatures: v.array(v.string()), // Array of Feature enum values

  // Subscription
  subscriptionTier: v.union(
    v.literal('starter'), // Core modules only
    v.literal('standard'), // + LMS, Library
    v.literal('premium'), // + AI, Advanced analytics
  ),
  subscriptionExpiresAt: v.optional(v.number()), // Unix timestamp

  // Branding — applied to portal, report cards, invoices
  branding: v.object({
    logoUrl: v.optional(v.string()), // Cloudinary URL
    primaryColor: v.string(), // Hex: '#1a6b3c'
    secondaryColor: v.string(), // Hex: '#e5a100'
    motto: v.optional(v.string()), // 'Excellence in Education'
  }),

  // SMS
  smsBalance: v.number(), // Units remaining
  smsProvider: v.union(
    v.literal('airtel'),
    v.literal('mtn'),
    v.literal('auto'), // Tries Airtel first, falls back to MTN
  ),

  // Sibling discount rules (used in fee calculation)
  siblingDiscountRules: v.array(
    v.object({
      fromChildNumber: v.number(), // 2 = second child, 3 = third, etc.
      discountPercent: v.number(), // 10 = 10% discount
      applyToFeeTypes: v.array(v.string()), // ['tuition'] or ['tuition', 'boarding']
    }),
  ),

  // Customization
  customStudentFields: v.array(
    v.object({
      key: v.string(), // Machine-readable: 'home_language'
      label: v.string(), // Display: 'Home Language'
      type: v.union(
        v.literal('text'),
        v.literal('select'),
        v.literal('boolean'),
        v.literal('date'),
      ),
      options: v.optional(v.array(v.string())), // For 'select' type
      required: v.boolean(),
    }),
  ),

  status: v.union(v.literal('active'), v.literal('suspended'), v.literal('trial')),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_slug', ['slug'])
  .index('by_status', ['status']);
```

**`academicYears`** — e.g. "2025", "2026"

```typescript
academicYears: defineTable({
  schoolId: v.id('schools'),
  year: v.number(), // 2025
  label: v.string(), // '2025 Academic Year'
  startDate: v.string(), // 'YYYY-MM-DD'
  endDate: v.string(),
  isActive: v.boolean(),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_school_year', ['schoolId', 'year']);
```

**`terms`** — A term or semester within an academic year

```typescript
terms: defineTable({
  schoolId: v.id('schools'),
  academicYearId: v.id('academicYears'),
  name: v.string(), // 'Term 1', 'Semester 2'
  termNumber: v.number(), // 1, 2, 3
  startDate: v.string(),
  endDate: v.string(),
  examStartDate: v.optional(v.string()),
  examEndDate: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_academic_year', ['schoolId', 'academicYearId'])
  .index('by_school_active', ['schoolId', 'isActive']);
```

**`grades`** — e.g. Grade 1 through Grade 12, Form 1-6, Year 1-4 (college)

```typescript
grades: defineTable({
  schoolId: v.id('schools'),
  name: v.string(), // 'Grade 8', 'Form 1', 'Year 1'
  level: v.number(), // Numeric for ordering: 8, 9, 10
  stream: v.optional(v.string()), // 'Sciences', 'Arts', 'Commerce' (secondary)
  graduationGrade: v.boolean(), // True for Grade 9 and Grade 12 (ECZ exams)
  order: v.number(), // For sorting in UI
})
  .index('by_school', ['schoolId'])
  .index('by_school_level', ['schoolId', 'level']);
```

**`sections`** — A class section: Grade 8A, Grade 8B. This is what a student belongs to.

```typescript
sections: defineTable({
  schoolId: v.id('schools'),
  gradeId: v.id('grades'),
  academicYearId: v.id('academicYears'),
  name: v.string(), // '8A', '8B', 'Form 2 Sciences'
  displayName: v.string(), // 'Grade 8A' — full label for UI
  classTeacherId: v.optional(v.id('staff')), // The class teacher responsible for this section
  capacity: v.optional(v.number()), // Max students
  room: v.optional(v.string()), // 'Room 12' — homeroom
  order: v.number(), // For sorting: A=1, B=2, C=3
  isActive: v.boolean(),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_grade', ['schoolId', 'gradeId'])
  .index('by_academic_year', ['schoolId', 'academicYearId'])
  .index('by_class_teacher', ['classTeacherId']);
```

---

### ISSUE-006 · Define User, Staff, and Guardian Schema

**Type:** Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Define the tables for system users (authentication accounts), staff members (teachers and non-teaching), and guardians/parents. These three tables are different by design — a teacher has both a `users` record (for auth) and a `staff` record (for their professional profile).

#### Acceptance Criteria

- [ ] All three tables defined in `convex/schema.ts`
- [ ] The separation between `users` (auth identity) and `staff`/`guardians` (profile) is clearly documented with inline comments
- [ ] Indexes support all planned query patterns

#### Tables to Define

**`users`** — Authentication identity. One per login. Linked to Supabase Auth.

```typescript
users: defineTable({
  // Supabase Auth fields (required by @convex-dev/auth)
  tokenIdentifier: v.string(), // Auth token from Supabase Auth

  // Identity
  schoolId: v.optional(v.id('schools')), // Null for platform Super Admins only
  email: v.optional(v.string()),
  phone: v.optional(v.string()), // Primary login method for parents
  name: v.string(),
  photoUrl: v.optional(v.string()),

  // Role — single role per user in a school context
  role: v.union(
    v.literal('platform_admin'), // Super admin — no schoolId
    v.literal('school_admin'), // Head teacher / Principal
    v.literal('deputy_head'),
    v.literal('bursar'), // Finance only
    v.literal('teacher'), // Subject teacher
    v.literal('class_teacher'), // Has a section assigned
    v.literal('matron'), // Boarding — hostel management
    v.literal('librarian'),
    v.literal('driver'), // Transport module
    v.literal('guardian'), // Parent / guardian
    v.literal('student'), // Student self-portal
  ),

  // Profile links — one user can be linked to a staff, guardian, or student profile
  staffId: v.optional(v.id('staff')),
  guardianId: v.optional(v.id('guardians')),
  studentId: v.optional(v.id('students')),

  // Preferences
  notifPrefs: v.object({
    sms: v.boolean(),
    whatsapp: v.boolean(),
    email: v.boolean(),
    inApp: v.boolean(),
  }),
  uiLanguage: v.optional(v.string()), // 'en', 'ny' (Nyanja), 'bem' (Bemba)

  isActive: v.boolean(),
  lastLoginAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_token', ['tokenIdentifier'])
  .index('by_school', ['schoolId'])
  .index('by_email', ['email'])
  .index('by_phone', ['phone'])
  .index('by_role', ['schoolId', 'role']);
```

**`staff`** — Professional profile for teachers and all other school employees.

```typescript
staff: defineTable({
  schoolId: v.id('schools'),
  userId: v.id('users'), // Linked auth account

  // Personal
  firstName: v.string(),
  lastName: v.string(),
  middleName: v.optional(v.string()),
  gender: v.union(v.literal('M'), v.literal('F')),
  dateOfBirth: v.optional(v.string()),
  nrc: v.optional(v.string()), // National Registration Card
  phone: v.string(),
  altPhone: v.optional(v.string()),
  email: v.optional(v.string()),
  photoUrl: v.optional(v.string()),
  address: v.optional(v.string()),
  emergencyContact: v.optional(
    v.object({
      name: v.string(),
      phone: v.string(),
      relation: v.string(),
    }),
  ),

  // Professional
  staffCategory: v.union(v.literal('teaching'), v.literal('non_teaching'), v.literal('admin')),
  jobTitle: v.string(), // 'Teacher', 'Accounts Clerk', 'Security Officer'
  tcazNumber: v.optional(v.string()), // TCAZ registration — teaching staff only
  employeeNumber: v.optional(v.string()),
  contractType: v.union(
    v.literal('permanent'),
    v.literal('contract'),
    v.literal('volunteer'),
    v.literal('intern'),
  ),
  dateJoined: v.string(),
  dateLeft: v.optional(v.string()),

  // Payroll-ready (used by payroll export in Sprint 03+)
  bankName: v.optional(v.string()),
  bankAccountNumber: v.optional(v.string()),
  napsaNumber: v.optional(v.string()), // National Pension Scheme Authority
  nhimaNumber: v.optional(v.string()), // National Health Insurance

  // Subjects and sections this staff member teaches — populated in Sprint 01
  subjectIds: v.array(v.id('subjects')),
  sectionIds: v.array(v.id('sections')),
  classSectionId: v.optional(v.id('sections')), // Set if they are a class teacher

  status: v.union(v.literal('active'), v.literal('on_leave'), v.literal('terminated')),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_user', ['userId'])
  .index('by_school_status', ['schoolId', 'status'])
  .index('by_tcaz', ['tcazNumber']);
```

**`guardians`** — Parent or guardian profile. One account, potentially multiple children.

```typescript
guardians: defineTable({
  schoolId: v.id('schools'),
  userId: v.id('users'), // Linked auth account

  // Personal
  firstName: v.string(),
  lastName: v.string(),
  phone: v.string(), // Primary — used for OTP login + SMS
  altPhone: v.optional(v.string()),
  email: v.optional(v.string()),
  nrc: v.optional(v.string()),
  occupation: v.optional(v.string()),
  employer: v.optional(v.string()),
  address: v.optional(v.string()),

  // Preferences
  preferredContactMethod: v.union(v.literal('sms'), v.literal('whatsapp'), v.literal('both')),
  receiveAttendanceSMS: v.boolean(),
  receiveResultsSMS: v.boolean(),
  receiveFeeReminderSMS: v.boolean(),

  // NOTE: guardian-to-student links are stored on the STUDENT document
  // as student.guardianLinks[]. This is queried from both sides.

  isVerified: v.boolean(), // Phone number verified via OTP
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_user', ['userId'])
  .index('by_phone', ['phone'])
  .index('by_school_phone', ['schoolId', 'phone']);
```

---

### ISSUE-007 · Define Student Schema

**Type:** Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Define the `students` table. This is the central table of the entire system — it references sections, guardians, beds (boarding), routes (transport), and drives fee invoicing. It must be defined completely now, even for fields that won't be populated until Sprint 04 or 06.

#### Acceptance Criteria

- [ ] `students` table defined in schema with all fields including future-module fields
- [ ] Guardian link structure supports multiple guardians per student with granular permissions
- [ ] All indexes defined for planned query patterns
- [ ] Schema comment clearly marks which fields are populated by which sprint

#### Table Definition

```typescript
students: defineTable({
  schoolId: v.id('schools'),

  // Identifiers
  studentNumber: v.string(), // Auto-generated: 'KBS-2025-0001'
  externalId: v.optional(v.string()), // ECZ exam number, GRZ school number

  // Personal
  firstName: v.string(),
  lastName: v.string(),
  middleName: v.optional(v.string()),
  preferredName: v.optional(v.string()), // Nickname used in day-to-day
  dateOfBirth: v.string(), // 'YYYY-MM-DD'
  gender: v.union(v.literal('M'), v.literal('F')),
  nrc: v.optional(v.string()), // Populated at Grade 9+ or when available
  birthCertNumber: v.optional(v.string()),
  nationality: v.string(), // Default: 'Zambian'
  homeLanguage: v.optional(v.string()),
  religion: v.optional(v.string()),
  photoUrl: v.optional(v.string()),

  // Academic placement
  currentSectionId: v.id('sections'),
  currentGradeId: v.id('grades'),
  currentAcademicYearId: v.id('academicYears'),
  admissionDate: v.string(),
  admissionGradeId: v.optional(v.id('grades')), // Grade they joined at
  previousSchool: v.optional(v.string()),

  // Guardian links — supports multiple guardians with different permissions
  guardianLinks: v.array(
    v.object({
      guardianId: v.id('guardians'),
      isPrimary: v.boolean(), // Primary contact for all communications
      relation: v.string(), // 'mother', 'father', 'uncle', 'guardian'
      canPayFees: v.boolean(),
      canSeeResults: v.boolean(),
      canSeeAttendance: v.boolean(),
      receiveSMS: v.boolean(),
      canAuthorizeLeave: v.boolean(), // Boarding: can authorize exeat
      isEmergencyContact: v.boolean(),
    }),
  ),

  // Boarding — populated when Feature.BOARDING is active (Sprint 04)
  boardingStatus: v.union(v.literal('day'), v.literal('boarding')),
  currentBedId: v.optional(v.id('beds')), // Sprint 04
  boardingHouseId: v.optional(v.id('hostelBlocks')), // Sprint 04
  mealPlanType: v.optional(
    v.union(
      v.literal('full_board'), // 3 meals/day
      v.literal('half_board'), // 2 meals/day
      v.literal('none'),
    ),
  ),

  // Transport — populated when Feature.TRANSPORT is active (Sprint 06)
  transportRouteId: v.optional(v.id('routes')), // Sprint 06
  boardingStopId: v.optional(v.string()), // Stop within the route
  transportTermStart: v.optional(v.string()), // Start date of transport subscription

  // Health — always available, more detail added in boarding sprint
  bloodGroup: v.optional(v.string()),
  medicalConditions: v.optional(v.string()), // Asthma, diabetes, etc.
  medications: v.optional(v.string()),
  allergies: v.optional(v.string()),
  specialNeeds: v.optional(v.string()),
  doctorName: v.optional(v.string()),
  doctorPhone: v.optional(v.string()),

  // Custom fields — school-defined (schema stores key-value pairs)
  customFieldValues: v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null())),

  // Status
  status: v.union(
    v.literal('active'),
    v.literal('transferred_out'),
    v.literal('graduated'),
    v.literal('withdrawn'),
    v.literal('deceased'),
  ),
  transferOutDate: v.optional(v.string()),
  transferOutSchool: v.optional(v.string()),
  graduationDate: v.optional(v.string()),

  // Linked auth account (optional — only if student has self-portal access)
  userId: v.optional(v.id('users')),

  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.id('users'),
})
  .index('by_school', ['schoolId'])
  .index('by_section', ['currentSectionId'])
  .index('by_school_status', ['schoolId', 'status'])
  .index('by_student_number', ['schoolId', 'studentNumber'])
  .index('by_school_year', ['schoolId', 'currentAcademicYearId']);
```

---

### ISSUE-008 · Define Skeleton Tables for All Future Modules

**Type:** Backend | **Priority:** P0 | **Estimate:** 1.5 days

#### Description

Define skeleton (minimal but complete) table structures for every future module. These tables will not have query/mutation functions written until their sprint, but the schema must be defined now so that foreign key references from core tables (`students.currentBedId`, `students.transportRouteId`, etc.) are valid.

#### Why This Matters

If we don't define `beds` now, `students.currentBedId: v.id('beds')` will fail schema validation. We don't want to touch the `students` table again later to add this field.

#### Acceptance Criteria

- [ ] All tables listed below defined in `convex/schema.ts` with minimal but correct field definitions
- [ ] All tables have at least a `schoolId` index and a `by_school` index
- [ ] Each table has an inline `// Sprint XX` comment showing when it will be fully implemented
- [ ] Tables compile without TypeScript errors

#### Tables to Define (Minimal Schema)

```typescript
// ── ATTENDANCE (Sprint 01) ──
attendance: defineTable({
  schoolId: v.id('schools'), sectionId: v.id('sections'), studentId: v.id('students'),
  date: v.string(), period: v.optional(v.number()), staffId: v.id('staff'),
  status: v.union(v.literal('present'), v.literal('absent'), v.literal('late'), v.literal('excused'), v.literal('medical')),
  notes: v.optional(v.string()), smsSent: v.boolean(), clientId: v.optional(v.string()),
  createdAt: v.number(),
}).index('by_school', ['schoolId']).index('by_section_date', ['sectionId', 'date']).index('by_student_date', ['studentId', 'date']),

// ── SUBJECTS (Sprint 01) ──
subjects: defineTable({
  schoolId: v.id('schools'), name: v.string(), code: v.optional(v.string()),
  gradeIds: v.array(v.id('grades')), isCompulsory: v.boolean(),
  eczSubjectCode: v.optional(v.string()),
}).index('by_school', ['schoolId']),

// ── TIMETABLE SLOTS (Sprint 01) ──
timetableSlots: defineTable({
  schoolId: v.id('schools'), sectionId: v.id('sections'), subjectId: v.id('subjects'),
  staffId: v.id('staff'), dayOfWeek: v.number(), startTime: v.string(), endTime: v.string(),
  room: v.optional(v.string()), termId: v.id('terms'),
}).index('by_school', ['schoolId']).index('by_section', ['sectionId']).index('by_staff', ['staffId']),

// ── EXAMS (Sprint 01) ──
examSessions: defineTable({
  schoolId: v.id('schools'), termId: v.id('terms'), name: v.string(),
  type: v.union(v.literal('ca1'), v.literal('ca2'), v.literal('terminal'), v.literal('mock'), v.literal('final')),
  startDate: v.optional(v.string()), endDate: v.optional(v.string()),
  maxMarks: v.number(), weightPercent: v.optional(v.number()), isLocked: v.boolean(),
}).index('by_school', ['schoolId']).index('by_term', ['schoolId', 'termId']),

examResults: defineTable({
  schoolId: v.id('schools'), studentId: v.id('students'), subjectId: v.id('subjects'),
  examSessionId: v.id('examSessions'), sectionId: v.id('sections'),
  score: v.optional(v.number()), grade: v.optional(v.string()), isAbsent: v.boolean(),
  remarks: v.optional(v.string()), enteredBy: v.id('users'), lockedAt: v.optional(v.number()),
  createdAt: v.number(), updatedAt: v.number(),
}).index('by_school', ['schoolId']).index('by_student', ['studentId']).index('by_session', ['examSessionId']),

// ── FEES & INVOICING (Sprint 02) ──
feeStructures: defineTable({
  schoolId: v.id('schools'), gradeId: v.optional(v.id('grades')), termId: v.id('terms'),
  name: v.string(), amountZMW: v.number(),
  boardingStatus: v.optional(v.union(v.literal('day'), v.literal('boarding'), v.literal('all'))),
  feeType: v.string(), isRecurring: v.boolean(), isOptional: v.boolean(),
}).index('by_school', ['schoolId']).index('by_term', ['schoolId', 'termId']),

invoices: defineTable({
  schoolId: v.id('schools'), studentId: v.id('students'), guardianId: v.id('guardians'),
  termId: v.id('terms'), invoiceNumber: v.string(),
  lineItems: v.array(v.object({ description: v.string(), quantity: v.number(), unitPriceZMW: v.number(), vatApplicable: v.boolean(), feeType: v.string() })),
  subtotalZMW: v.number(), vatZMW: v.number(), discountZMW: v.number(), totalZMW: v.number(),
  siblingDiscountZMW: v.number(), siblingDiscountApplied: v.boolean(),
  zraFiscalCode: v.optional(v.string()), zraQrCodeUrl: v.optional(v.string()), zraSubmittedAt: v.optional(v.number()),
  status: v.union(v.literal('draft'), v.literal('sent'), v.literal('partial'), v.literal('paid'), v.literal('void'), v.literal('overdue')),
  dueDate: v.string(), paidAt: v.optional(v.number()),
  createdAt: v.number(), updatedAt: v.number(),
}).index('by_school', ['schoolId']).index('by_student', ['studentId']).index('by_school_term', ['schoolId', 'termId']).index('by_status', ['schoolId', 'status']),

payments: defineTable({
  schoolId: v.id('schools'), invoiceId: v.id('invoices'), studentId: v.id('students'),
  amountZMW: v.number(), method: v.union(v.literal('cash'), v.literal('airtel_money'), v.literal('mtn_momo'), v.literal('bank'), v.literal('credit_note')),
  reference: v.optional(v.string()), mobileMoneyReference: v.optional(v.string()),
  receivedBy: v.optional(v.id('users')), notes: v.optional(v.string()),
  createdAt: v.number(),
}).index('by_school', ['schoolId']).index('by_invoice', ['invoiceId']).index('by_student', ['studentId']),

// ── NOTIFICATIONS (Sprint 01) ──
notifications: defineTable({
  schoolId: v.id('schools'), recipientUserId: v.optional(v.id('users')),
  recipientPhone: v.optional(v.string()),
  type: v.string(), channel: v.union(v.literal('sms'), v.literal('whatsapp'), v.literal('in_app'), v.literal('email')),
  subject: v.optional(v.string()), body: v.string(),
  status: v.union(v.literal('queued'), v.literal('sent'), v.literal('delivered'), v.literal('failed')),
  sentAt: v.optional(v.number()), deliveredAt: v.optional(v.number()),
  relatedEntityType: v.optional(v.string()), relatedEntityId: v.optional(v.string()),
  createdAt: v.number(),
}).index('by_school', ['schoolId']).index('by_recipient', ['recipientUserId']).index('by_status', ['schoolId', 'status']),

// ── BOARDING (Sprint 04) ──
hostelBlocks: defineTable({
  schoolId: v.id('schools'), name: v.string(), gender: v.union(v.literal('boys'), v.literal('girls'), v.literal('mixed')),
  wardenStaffId: v.optional(v.id('staff')), capacity: v.number(), notes: v.optional(v.string()),
}).index('by_school', ['schoolId']),

rooms: defineTable({
  schoolId: v.id('schools'), hostelBlockId: v.id('hostelBlocks'), name: v.string(),
  roomType: v.union(v.literal('dormitory'), v.literal('private'), v.literal('shared')),
  capacity: v.number(), floor: v.optional(v.number()), isActive: v.boolean(),
}).index('by_school', ['schoolId']).index('by_block', ['hostelBlockId']),

beds: defineTable({
  schoolId: v.id('schools'), roomId: v.id('rooms'),
  bedLabel: v.string(), position: v.optional(v.string()), isActive: v.boolean(),
  currentStudentId: v.optional(v.id('students')), currentTermId: v.optional(v.id('terms')),
}).index('by_school', ['schoolId']).index('by_room', ['roomId']),

sickBayAdmissions: defineTable({
  schoolId: v.id('schools'), studentId: v.id('students'),
  admittedAt: v.number(), dischargedAt: v.optional(v.number()),
  admittedBy: v.id('staff'), reason: v.string(), treatmentNotes: v.optional(v.string()),
  guardianNotified: v.boolean(), referredToHospital: v.boolean(),
}).index('by_school', ['schoolId']).index('by_student', ['studentId']),

visitorLog: defineTable({
  schoolId: v.id('schools'), studentId: v.id('students'),
  visitorName: v.string(), visitorNrc: v.optional(v.string()), visitorPhone: v.optional(v.string()),
  relation: v.string(), purpose: v.string(),
  checkInAt: v.number(), checkOutAt: v.optional(v.number()),
  loggedBy: v.id('staff'), isAuthorized: v.boolean(), guardianNotified: v.boolean(),
}).index('by_school', ['schoolId']).index('by_student', ['studentId']),

pocketMoneyAccounts: defineTable({
  schoolId: v.id('schools'), studentId: v.id('students'),
  balanceZMW: v.number(), weeklyLimitZMW: v.optional(v.number()),
  createdAt: v.number(), updatedAt: v.number(),
}).index('by_student', ['studentId']),

pocketMoneyTransactions: defineTable({
  schoolId: v.id('schools'), accountId: v.id('pocketMoneyAccounts'),
  type: v.union(v.literal('deposit'), v.literal('withdrawal')),
  amountZMW: v.number(), reference: v.optional(v.string()),
  processedBy: v.optional(v.id('staff')), notes: v.optional(v.string()),
  guardianNotified: v.boolean(), createdAt: v.number(),
}).index('by_account', ['accountId']),

// ── TRANSPORT (Sprint 06) ──
routes: defineTable({
  schoolId: v.id('schools'), name: v.string(), description: v.optional(v.string()),
  stops: v.array(v.object({ order: v.number(), name: v.string(), lat: v.number(), lng: v.number(), scheduledTimeMorning: v.string(), scheduledTimeAfternoon: v.string() })),
  morningVehicleId: v.optional(v.id('vehicles')), afternoonVehicleId: v.optional(v.id('vehicles')),
  termFeeZMW: v.number(), isActive: v.boolean(),
}).index('by_school', ['schoolId']),

vehicles: defineTable({
  schoolId: v.id('schools'), registration: v.string(), make: v.string(), model: v.optional(v.string()),
  capacity: v.number(), driverStaffId: v.optional(v.id('staff')),
  insuranceExpiry: v.string(), fitnessExpiry: v.string(), isActive: v.boolean(),
}).index('by_school', ['schoolId']),

gpsPings: defineTable({
  schoolId: v.id('schools'), vehicleId: v.id('vehicles'), routeId: v.optional(v.id('routes')),
  lat: v.number(), lng: v.number(), speedKmh: v.number(), heading: v.optional(v.number()),
  timestamp: v.number(), tripId: v.optional(v.string()),
}).index('by_vehicle_time', ['vehicleId', 'timestamp']),

// ── LIBRARY (Sprint 05) ──
libraryBooks: defineTable({
  schoolId: v.id('schools'), isbn: v.optional(v.string()), title: v.string(),
  authors: v.array(v.string()), publisher: v.optional(v.string()), publicationYear: v.optional(v.number()),
  subject: v.optional(v.string()), deweyCode: v.optional(v.string()),
  category: v.union(v.literal('textbook'), v.literal('fiction'), v.literal('reference'), v.literal('periodical'), v.literal('digital')),
  totalCopies: v.number(), availableCopies: v.number(), coverUrl: v.optional(v.string()),
}).index('by_school', ['schoolId']).index('by_isbn', ['isbn']),

libraryIssues: defineTable({
  schoolId: v.id('schools'), bookId: v.id('libraryBooks'), borrowerId: v.id('users'),
  borrowerType: v.union(v.literal('student'), v.literal('staff')),
  issuedAt: v.number(), dueDate: v.string(), returnedAt: v.optional(v.number()),
  renewalCount: v.number(), fineAmountZMW: v.number(), finePaidAt: v.optional(v.number()),
  issuedBy: v.id('staff'),
}).index('by_school', ['schoolId']).index('by_borrower', ['borrowerId']),

// ── LMS (Sprint 05) ──
lmsCourses: defineTable({
  schoolId: v.id('schools'), subjectId: v.id('subjects'), sectionId: v.id('sections'),
  academicYearId: v.id('academicYears'), termId: v.id('terms'),
  name: v.string(), description: v.optional(v.string()), createdBy: v.id('staff'),
  coverImageUrl: v.optional(v.string()), isPublished: v.boolean(),
  minEngagementPercent: v.optional(v.number()), createdAt: v.number(), updatedAt: v.number(),
}).index('by_school', ['schoolId']).index('by_section', ['sectionId']),

lmsModules: defineTable({
  schoolId: v.id('schools'), courseId: v.id('lmsCourses'), title: v.string(),
  order: v.number(), isPublished: v.boolean(),
}).index('by_course', ['courseId']),

lmsLessons: defineTable({
  schoolId: v.id('schools'), moduleId: v.id('lmsModules'), title: v.string(),
  contentType: v.union(v.literal('text'), v.literal('pdf'), v.literal('video'), v.literal('quiz'), v.literal('assignment')),
  content: v.optional(v.string()), resourceUrl: v.optional(v.string()),
  order: v.number(), isPublished: v.boolean(), unlocksAt: v.optional(v.string()),
}).index('by_module', ['moduleId']),

lmsSubmissions: defineTable({
  schoolId: v.id('schools'), lessonId: v.id('lmsLessons'), studentId: v.id('students'),
  submittedAt: v.number(), contentText: v.optional(v.string()), fileUrl: v.optional(v.string()),
  score: v.optional(v.number()), maxScore: v.optional(v.number()),
  gradedAt: v.optional(v.number()), gradedBy: v.optional(v.id('staff')), feedback: v.optional(v.string()),
}).index('by_lesson', ['lessonId']).index('by_student', ['studentId']),
```

---

### ISSUE-009 · Create Convex Utility Functions and Server-Side Guards

**Type:** Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Create the shared internal utility functions that every Convex query and mutation will use. These enforce school scoping, feature flags, and role checks at the function level — not just the UI level.

#### User Story

> As a developer writing a new Convex mutation, I use `requireRole(ctx, ['teacher', 'admin'])` at the top of my function and know that if someone calls it without the right role, it throws a standardized error — I don't need to write auth logic myself.

#### Acceptance Criteria

- [ ] `convex/_lib/schoolContext.ts` — extracts and validates school from auth identity
- [ ] `convex/_lib/permissions.ts` — role-based permission check functions
- [ ] `convex/_lib/featureGuard.ts` — throws if a required feature is not enabled for the school
- [ ] `convex/_lib/errors.ts` — standardized error class with error codes

#### Functions to Implement

```typescript
// convex/_lib/schoolContext.ts
export async function getAuthenticatedUserAndSchool(ctx: QueryCtx | MutationCtx) {
  // 1. Get Supabase Auth identity
  // 2. Look up user document by tokenIdentifier
  // 3. Validate user.isActive === true
  // 4. Look up school document by user.schoolId
  // 5. Return { user, school }
  // Throws EduError.UNAUTHENTICATED if no identity
  // Throws EduError.ACCOUNT_INACTIVE if user inactive
  // Throws EduError.SCHOOL_NOT_FOUND if school missing
}

// convex/_lib/permissions.ts
export async function requireRole(ctx, allowedRoles: Role[]) {
  // Calls getAuthenticatedUserAndSchool
  // Throws EduError.FORBIDDEN if user.role not in allowedRoles
  // Returns { user, school }
}

export async function requireFeature(ctx, school: Doc<'schools'>, feature: Feature) {
  // Checks school.enabledFeatures.includes(feature)
  // Throws EduError.FEATURE_DISABLED if not found
}

export function canDo(userRole: Role, permission: Permission): boolean {
  // Pure function — no async, no DB calls
  // Uses the ROLE_PERMISSIONS matrix from src/lib/roles/matrix.ts
  // This matrix is imported into Convex via a shared file
}
```

---

### ISSUE-010 · Write Seed Script for Development Data

**Type:** Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Create a seed script that populates a development Convex deployment with realistic test data. Every developer should be able to run this script and immediately have a working system with multiple school types to test against.

#### Acceptance Criteria

- [ ] `convex/seed.ts` created as a Convex Action (can be triggered from dashboard)
- [ ] Script creates the following test schools:
  - `kabulonga` — Day Secondary (standard features)
  - `chengelo` — Boarding Secondary (boarding + transport features)
  - `evelyn-hone` — College (GPA mode, semester system, LMS enabled)
- [ ] Each school has at least: 1 admin user, 3 teachers, 1 bursar, 20 students, 15 guardian accounts
- [ ] Students have guardian links (including siblings — 3 pairs of siblings)
- [ ] Academic year, term, grades, and sections created for each school
- [ ] All user passwords set to `password123` for dev — documented in README
- [ ] `npm run seed` script added to `package.json`
- [ ] Seed is idempotent — running it twice does not create duplicates (checks by slug first)

---

## Epic 3 — Authentication System

> **Goal:** A complete, production-ready auth system supporting Phone OTP (primary for parents) and Email/Password (for staff), with session persistence, role resolution, and school scoping built in from the first request.

---

### ISSUE-011 · Configure Supabase Auth with Multiple Providers

**Type:** Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Configure `@convex-dev/auth` with two authentication providers: Phone OTP (via SMS) and Email+Password. Both providers must store the authenticated user's `schoolId` and `role` in their profile, which is then accessible in every Convex function via `ctx.auth.getUserIdentity()`.

#### User Story

> As a parent, I log in with my phone number. I receive an SMS OTP. I enter it and I'm in. I never need to remember a password.
> As a teacher, I log in with my school email and password. I'm in.

#### Acceptance Criteria

- [ ] `convex/auth.ts` configured with `convexAuth()` using both providers
- [ ] Phone OTP provider configured:
  - Sends OTP via Airtel/MTN SMS (dev mode: logs OTP to console)
  - OTP is 6 digits, expires in 10 minutes
  - Max 3 attempts before rate-limiting (5 minutes lockout)
  - Phone number normalized to `+260XXXXXXXXX` format before storing
- [ ] Email/Password provider configured:
  - Passwords hashed with bcrypt (min 8 characters)
  - Email normalized to lowercase before storing
  - "Forgot password" flow sends reset link via SMS (not email — more reliable in Zambia)
- [ ] After successful authentication, user document is created/updated:
  - `lastLoginAt` set to current timestamp
  - `tokenIdentifier` matches the Supabase Auth identity token
- [ ] `convex/auth.config.ts` has correct JWT configuration
- [ ] Both providers work in development without real SMS (mock SMS logs to terminal)

#### Environment Variables Required

```
CONVEX_AUTH_PRIVATE_KEY=
JWKS=
AUTH_AIRTEL_SMS_API_KEY=       # Dev: leave empty for console logging
AUTH_MTN_SMS_API_KEY=          # Dev: leave empty for console logging
```

---

### ISSUE-012 · Build Login Page — Email/Password

**Type:** Frontend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Build the email/password login page at `/(auth)/login`. This is used by teachers, admins, bursars, and other staff. The page must resolve the school from the subdomain and show the school's branding.

#### User Story

> As a teacher at Kabulonga Boys, when I visit `kabulonga.Acadowl.zm/login`, I see Kabulonga's logo and colors, enter my email and password, and am redirected to my teacher dashboard.

#### Acceptance Criteria

- [ ] Page renders at `/(auth)/login`
- [ ] Form has: email field, password field, "Sign In" button, "Login with phone instead" link
- [ ] School name and logo displayed in header (fetched from `getSchoolBySlug` using `x-school-slug` header)
- [ ] If school slug not found, show generic Acadowl branding with "School not found" message
- [ ] Uses `react-hook-form` + `zod` for validation:
  - Email: valid email format
  - Password: required, min 1 character (let server decide if wrong)
- [ ] Submits via `useAuthActions()` from `@convex-dev/auth/react`
- [ ] Loading state: button shows spinner, form disabled
- [ ] Error state: shows server error message below form (e.g., "Incorrect password")
- [ ] On success: redirects to the correct role-based dashboard:
  - `school_admin`, `deputy_head` → `/(admin)/dashboard`
  - `bursar` → `/(admin)/fees`
  - `teacher`, `class_teacher` → `/(teacher)/dashboard`
  - `matron` → `/(admin)/boarding`
  - `librarian` → `/(admin)/library`
  - `platform_admin` → `/(platform)/schools`
- [ ] Page is fully mobile-responsive
- [ ] Accessible: all inputs have labels, error messages have `role="alert"`

---

### ISSUE-013 · Build Login Page — Phone OTP

**Type:** Frontend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Build the two-step phone OTP login flow. Step 1: enter phone number. Step 2: enter 6-digit OTP received via SMS. This is the primary login method for guardians/parents.

#### User Story

> As a parent, I enter my Zambian phone number (+260 or 0971...), receive an SMS with a 6-digit code, enter it, and I'm taken to my child's portal. It works on any phone with a browser.

#### Acceptance Criteria

- [ ] Step 1 page at `/(auth)/login-otp`: phone number input with Zambian flag prefix (+260)
- [ ] Phone number validation:
  - Accepts: `0971234567`, `971234567`, `+260971234567`
  - Normalizes all to `+260971234567` format before sending
  - Shows error for invalid format
- [ ] "Send Code" button triggers `useAuthActions().signIn('phone', { phone })`
- [ ] Step 2 page at `/(auth)/login-otp/verify`:
  - 6-digit OTP input (auto-focus, numeric keyboard on mobile)
  - "Verify Code" button
  - "Resend Code" link — disabled for 60 seconds after first send, shows countdown
  - Shows last 4 digits of phone number for confirmation: "Code sent to +260 97 ••• •123"
- [ ] On success: redirects to `/(parent)/dashboard`
- [ ] If phone not found in system: "No account found for this number. Contact your school."
- [ ] In development mode: displays the OTP code on screen in a yellow dev banner

---

### ISSUE-014 · Build Auth Layout and Route Protection Middleware

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Create the auth layout (minimal, branded wrapper for login pages) and the Next.js middleware/server-side route protection that ensures authenticated users are in the right route group for their role.

#### User Story

> As the system, when an unauthenticated user visits `/dashboard`, I redirect them to `/login`. When an authenticated guardian tries to access an admin route, I redirect them to their own dashboard.

#### Acceptance Criteria

- [ ] `/(auth)/layout.tsx` created:
  - Centered card layout
  - School logo at top (or Acadowl logo if no school)
  - No sidebar, no topbar
  - School's primary color applied to the card's top border
  - "Powered by Acadowl" footer
- [ ] `src/middleware.ts` updated to handle auth redirects:
  - Unauthenticated users accessing any protected route → redirect to `/{routeGroup}/login`
  - Authenticated users accessing wrong route group → redirect to their dashboard
  - Authenticated users accessing `/login` → redirect to their dashboard
- [ ] Server-side helpers:
  - `src/lib/auth/getServerSession.ts` — wraps Supabase Auth server utilities to get current user in Server Components
  - `src/lib/auth/getRouteForRole.ts` — pure function returning dashboard path given a role
- [ ] `src/components/auth/AuthGuard.tsx` — Client component that uses `useConvexAuth()` to protect client-rendered routes
- [ ] Loading state while auth resolves: full-page skeleton, not flash of protected content
- [ ] After login, users who were redirected from a deep link are returned to their original destination (uses `callbackUrl` query param pattern)

---

### ISSUE-015 · Implement Role Resolution and Profile Linking

**Type:** Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

When a user authenticates for the first time, or when their profile hasn't been linked yet, the system must resolve their `role`, `schoolId`, and link them to their `staff`, `guardian`, or `student` profile. This is the bridge between the auth identity and the application data.

#### User Story

> As a school admin, when I create a new teacher account, I set their phone number. When that teacher logs in for the first time, the system automatically finds their `staff` record by phone number and links their user account to it — they don't have to do anything.

#### Acceptance Criteria

- [ ] `convex/users/mutations.ts` → `resolveUserProfile` mutation:
  - Called after every successful login
  - Checks if `user.staffId`, `user.guardianId`, or `user.studentId` are null
  - If null: searches for a matching record by phone/email in the school's data
  - If match found: sets the link and updates `user.role` accordingly
  - If no match: leaves as-is (admin will manually assign)
- [ ] `convex/users/queries.ts` → `getMe` query:
  - Returns `{ user, staff | guardian | student, school }`
  - Single call to get everything the client needs to render the correct UI
  - Used in `useMe()` hook
- [ ] When a guardian is auto-linked to their profile: their `guardianLinks` on student records are traversed and the portal shows all linked children immediately
- [ ] Supabase Auth's `profile()` callback updated to include `schoolId` in the JWT claims for server-side use

---

### ISSUE-016 · Build Forgot Password / Reset Flow

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Staff members who forget their email/password can request a reset. Given that email delivery is unreliable in Zambia, the reset code is sent via SMS to the staff member's registered phone number.

#### Acceptance Criteria

- [ ] Page at `/(auth)/forgot-password` with email input
- [ ] On submit: Convex mutation looks up user by email + schoolId, generates a 6-digit reset code, stores it (hashed) with a 30-minute expiry, sends SMS to user's phone number
- [ ] Reset code entry page: user enters the 6-digit SMS code + new password (confirm password field)
- [ ] On successful reset: user is logged in automatically and redirected to their dashboard
- [ ] Brute-force protection: max 5 wrong attempts before a 1-hour lockout
- [ ] The phone number shown on the reset page is masked: "+260 97 ••• •4567"

---

### ISSUE-017 · Build Platform Admin — School Creation Interface

**Type:** Frontend + Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

The Platform Super Admin needs to be able to create new school accounts. This is the entry point for onboarding new schools to the platform. The school creation form is only accessible to `platform_admin` role users at `platform.Acadowl.zm`.

#### User Story

> As the Acadowl platform admin, I fill in a school's details (name, type, province, ZRA TPIN), assign a subscription tier, and the system creates a school with sensible default features enabled based on school type. I then create the first admin user for that school.

#### Acceptance Criteria

- [ ] Page at `/(platform)/schools/new`
- [ ] Form fields: School Name, Short Name, Type (dropdown), Province, District, Address, Phone, ZRA TPIN, MOE Code (optional), HEA Code (optional, shown only for college type), Subscription Tier
- [ ] On submit: `convex/schools/mutations.ts` → `createSchool` mutation:
  - Validates slug uniqueness (auto-generated from school name, editable)
  - Sets `enabledFeatures` from `getDefaultFeaturesForSchoolType(type)` preset
  - Creates the school document
  - Returns the new school ID
- [ ] After school creation: redirect to school detail page showing "Create First Admin" prompt
- [ ] `getDefaultFeaturesForSchoolType()` function defined in `src/lib/features/presets.ts`:
  - `day_primary` / `day_secondary`: Core features only
  - `boarding_*` / `mixed_secondary`: Core + BOARDING
  - `college`: Core + LMS + SEMESTER_SYSTEM + GPA + HEA_COMPLIANCE
  - All types get: STUDENTS, STAFF, ATTENDANCE, FEES, ZRA_INVOICING, GUARDIAN_PORTAL, SMS_NOTIFICATIONS
- [ ] List page at `/(platform)/schools` showing all schools with status, tier, school count

---

## Epic 4 — Multi-Tenancy Engine

> **Goal:** Ironclad tenant isolation. A query from school A can never return data from school B. This is enforced at multiple layers simultaneously.

---

### ISSUE-018 · Implement Convex School Scoping Layer

**Type:** Backend | **Priority:** P0 | **Estimate:** 1 day

#### Description

Every Convex query and mutation that accesses school-scoped data must go through a scoping layer that automatically validates and injects `schoolId`. This prevents accidental cross-tenant data leakage — the most critical security requirement in the system.

#### User Story

> As a security reviewer, I can see that it is architecturally impossible for a query run in the context of School A to ever return a document belonging to School B.

#### Acceptance Criteria

- [ ] `convex/_lib/schoolContext.ts` updated with `withSchoolScope` helper:
  ```typescript
  // Pattern: every school-scoped query MUST use this
  export async function withSchoolScope(ctx, fn) {
    const { user, school } = await getAuthenticatedUserAndSchool(ctx);
    return fn({ ctx, user, school, schoolId: school._id });
  }
  ```
- [ ] Developer guidelines added to `README.md`: "Every query and mutation touching school data must use `withSchoolScope`"
- [ ] ESLint custom rule (or documented convention) flagging Convex functions that use `ctx.db.query()` without a `.withIndex('by_school', q => q.eq('schoolId', ...))`
- [ ] Integration test: user from School A attempts to query a student ID from School B → returns null (not throws — avoids leaking document existence)
- [ ] Platform Admin bypass: `requirePlatformAdmin(ctx)` function that skips school scoping for super admin operations

---

### ISSUE-019 · Implement SchoolProvider and useSchool Hook

**Type:** Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Create the React context and hook that makes the current school's data available to any client component. This includes the school's branding, enabled features, and academic configuration.

#### Acceptance Criteria

- [ ] `src/providers/SchoolProvider.tsx` created:
  - Uses `useQuery(api.schools.queries.getSchoolBySlug, { slug })` to fetch school
  - Exposes `school`, `features`, `gradingMode`, `academicMode`, `branding` via context
  - Handles loading state (school not yet loaded) and error state (school not found)
- [ ] `src/hooks/useSchool.ts` — wraps context consumption with typed return
- [ ] `SchoolProvider` added to the root layout, wrapping all route groups
- [ ] In server components, school is fetched via `getSchoolBySlug` using `headers()` and passed as initial data to the provider (avoids waterfall on first load)

---

### ISSUE-020 · Implement ThemeProvider for School Branding

**Type:** Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

Each school has custom branding (logo, primary color, secondary color, motto). The ThemeProvider injects these as CSS variables into the document root, causing the entire UI to reflect the school's colors without any component needing to know what school they're rendering for.

#### User Story

> As a Chengelo Secondary admin, when I open the portal, I see Chengelo's logo and their branded colors — not the default Acadowl green. It feels like Chengelo's own system.

#### Acceptance Criteria

- [ ] `src/providers/ThemeProvider.tsx` reads `school.branding` from `useSchool()`
- [ ] On mount (and when branding changes): sets CSS variables on `document.documentElement`:
  - `--school-primary`: hex color from `branding.primaryColor`
  - `--school-secondary`: hex color from `branding.secondaryColor`
  - Parsed to HSL for Tailwind compatibility: `--school-primary-h`, `-s`, `-l`
- [ ] School logo rendered in `SchoolLogo.tsx` component:
  - Shows `branding.logoUrl` image if set
  - Falls back to text: school `shortName` in a colored box
  - Used in sidebars, topbar, login page, report card PDFs
- [ ] Report card, invoice, and other PDF generators read from `school.branding` directly (not CSS variables — PDFs don't have a DOM)
- [ ] Color contrast validation: if school primary color is too light for white text, auto-switch text to dark (WCAG AA compliance)

---

### ISSUE-021 · Build School Settings — Branding Page

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

School admins need to be able to set their school's branding. This is the first settings page built and proves the settings architecture works.

#### Acceptance Criteria

- [ ] Page at `/(admin)/settings/branding`
- [ ] Form: Upload Logo (image upload to Cloudinary), Primary Color picker, Secondary Color picker, School Motto text input
- [ ] Logo upload: drag-and-drop or click to upload, max 2MB, PNG/JPG/SVG only, preview shown immediately
- [ ] Color pickers: hex input + visual color picker (use `react-color` or native `<input type="color">`)
- [ ] Live preview panel on the right: shows how the current settings will look (school name, colors, logo)
- [ ] Save button: calls `convex/schools/mutations.updateBranding`
- [ ] Changes apply immediately to the portal without page reload (Convex real-time)
- [ ] Only `school_admin` and `platform_admin` can access this page (enforced in route layout AND in Convex mutation)

---

### ISSUE-022 · Create School Settings — Custom Student Fields

**Type:** Frontend + Backend | **Priority:** P2 | **Estimate:** 1 day

#### Description

Schools need to add custom fields to the student profile for data specific to their institution (e.g., "Church Parish", "Previous Province"). These fields appear in the student enrolment form and profile view.

#### Acceptance Criteria

- [ ] Page at `/(admin)/settings/custom-fields`
- [ ] "Add Field" form: Label, Type (text/select/boolean/date), Required toggle, Options (if select type)
- [ ] Fields listed in a drag-and-drop reorderable list
- [ ] Delete button with confirmation (warns if field has data)
- [ ] Calls `convex/schools/mutations.updateCustomStudentFields`
- [ ] Changes immediately reflected in student enrolment form (Sprint 01 will read these)
- [ ] Maximum 20 custom fields per school (enforced server-side)
- [ ] Field `key` is auto-generated from label, snake_case, and is immutable once created (changing the key would break existing data)

---

## Epic 5 — Feature Flag System

> **Goal:** A runtime feature flag engine that is the single point of truth for what each school can and cannot see or do. Zero hardcoded role-type assumptions anywhere outside the flag presets file.

---

### ISSUE-023 · Implement Feature Flag Engine — Core

**Type:** Shared (Frontend + Backend) | **Priority:** P0 | **Estimate:** 1 day

#### Description

The Feature enum, presets, and runtime helpers form the Feature Flag Engine. This is a shared module — the same Feature enum is used in both `convex/` functions and `src/` client code.

#### Acceptance Criteria

- [ ] `src/lib/features/flags.ts` — Feature enum with all 30+ values defined:
  ```typescript
  export enum Feature {
    // Core — always on
    STUDENTS = 'students',
    STAFF = 'staff',
    ATTENDANCE = 'attendance',
    FEES = 'fees',
    ZRA_INVOICING = 'zra_invoicing',
    GUARDIAN_PORTAL = 'guardian_portal',
    SMS_NOTIFICATIONS = 'sms_notifications',
    SCHOOL_CUSTOMISATION = 'school_customisation',
    // Academic variants
    ECZ_EXAMS = 'ecz_exams',
    SEMESTER_SYSTEM = 'semester_system',
    GPA = 'gpa',
    HEA_COMPLIANCE = 'hea_compliance',
    LMS = 'lms',
    PORTFOLIO = 'portfolio',
    TIMETABLE = 'timetable',
    // Residential
    BOARDING = 'boarding',
    POCKET_MONEY = 'pocket_money',
    SICK_BAY = 'sick_bay',
    VISITOR_LOG = 'visitor_log',
    MEAL_PLANS = 'meal_plans',
    // Transport
    TRANSPORT = 'transport',
    GPS_TRACKING = 'gps_tracking',
    // Library
    LIBRARY = 'library',
    ELIBRARY = 'elibrary',
    // Optional Add-ons
    SPORTS = 'sports',
    CANTEEN = 'canteen',
    ASSET_MANAGEMENT = 'asset_mgmt',
    AI_INSIGHTS = 'ai_insights',
    PTM_SCHEDULER = 'ptm_scheduler',
    PERIOD_ATTENDANCE = 'period_attendance',
    WHATSAPP_NOTIFICATIONS = 'whatsapp_notifications',
  }
  ```
- [ ] `src/lib/features/presets.ts` — `getDefaultFeaturesForSchoolType(type: SchoolType): Feature[]`
  - Defined for all 7 school types
  - Exported and imported by ISSUE-017 school creation
- [ ] `src/hooks/useFeature.ts` — `useFeature(feature: Feature): boolean`
  - Reads from `useSchool().features`
  - Always returns `false` if school not loaded yet (prevents flash of gated content)
- [ ] `convex/_lib/featureGuard.ts` — `requireFeature(ctx, school, feature)` server-side throw
- [ ] Unit tests for presets: verify each school type has the expected features

---

### ISSUE-024 · Build Feature Management UI for School Admins

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 1 day

#### Description

School admins need a UI to enable and disable optional features within their subscription tier. This page is the admin's control panel for what their school's version of Acadowl looks like.

#### User Story

> As the admin of a day school that just got a bus, I go to Settings → Features, toggle on "Transport Management", and the Transport menu item immediately appears in my sidebar.

#### Acceptance Criteria

- [ ] Page at `/(admin)/settings/features`
- [ ] Features organized into groups: Academic, Residential, Transport, Library, Add-ons
- [ ] Each feature shows: icon, name, short description, who it adds to the system (e.g., "Adds: Hostel management, Bed assignment, Night Prep attendance")
- [ ] Toggle switch for each feature (disabled for core features — they're always on)
- [ ] Features locked behind subscription tier show a "Upgrade to Premium" lock icon — not hidden, just locked
- [ ] Save button calls `convex/schools/mutations.updateEnabledFeatures`
- [ ] AFTER save: sidebar re-renders immediately with new nav items (Convex real-time)
- [ ] Warning modal when disabling a feature that has existing data: "Disabling Boarding will hide boarding data. It is not deleted. You can re-enable anytime."
- [ ] Platform admin can override subscription tier limits from the platform admin panel

---

### ISSUE-025 · Implement FeatureGuard React Component

**Type:** Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

A reusable React component that wraps any UI element and only renders it if a specified feature is enabled. Used throughout the codebase to gate modules, nav items, form fields, and any UI that belongs to an optional feature.

#### Acceptance Criteria

- [ ] `src/components/school/FeatureGuard.tsx` component:

  ```tsx
  // Usage examples:
  <FeatureGuard feature={Feature.BOARDING}>
    <BoardingNavItem />
  </FeatureGuard>

  <FeatureGuard feature={Feature.TRANSPORT} fallback={<UpgradeBanner />}>
    <TransportDashboard />
  </FeatureGuard>

  <FeatureGuard feature={Feature.GPS_TRACKING} requires={Feature.TRANSPORT}>
    <LiveMapWidget />
  </FeatureGuard>
  ```

- [ ] Props: `feature: Feature`, `fallback?: ReactNode` (default: `null`), `requires?: Feature` (parent feature that must also be enabled)
- [ ] Uses `useFeature()` hook internally
- [ ] Does not render `children` during loading (prevents flash)
- [ ] Next.js server component version created as `FeatureGuardServer` that reads school features from server-side context (for layouts and nav items)

---

### ISSUE-026 · Feature-Gated Navigation System

**Type:** Frontend | **Priority:** P0 | **Estimate:** 1 day

#### Description

The navigation sidebars for Admin, Teacher, and Parent must dynamically build their nav items based on enabled features and user role. This is not a static nav — it's assembled at runtime.

#### Acceptance Criteria

- [ ] `src/lib/navigation/adminNavConfig.ts` — array of nav item configurations:
  ```typescript
  type NavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    requiredFeature?: Feature; // Hidden if feature disabled
    requiredPermission?: Permission; // Hidden if role lacks permission
    children?: NavItem[]; // Sub-menu items
    badge?: 'new' | 'beta';
  };
  ```
- [ ] `AdminSidebar.tsx` iterates `adminNavConfig`, wraps each item in `FeatureGuard` + `PermissionGuard`
- [ ] Items for modules not yet built (Sprint 02+) are included in the nav config but point to a `ComingSoon` placeholder page — this avoids having to touch the nav config file again
- [ ] Teacher nav and Parent nav similarly configured in their own config files
- [ ] Mobile nav (`MobileNav.tsx`): bottom tab bar for parent portal (max 5 items: Home, Children, Fees, Messages, More)
- [ ] Active route highlighted, with smooth transition on route change

---

## Epic 6 — Role-Based Access Control (RBAC)

> **Goal:** A clean, maintainable permission system where adding a new role or permission in future sprints means updating one file, not scattering checks across the codebase.

---

### ISSUE-027 · Define Role and Permission Matrix

**Type:** Shared | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Define the complete list of permissions in the system and map each role to its allowed permissions. This is the single source of truth for all access control decisions.

#### Acceptance Criteria

- [ ] `src/lib/roles/types.ts` — `Role` enum (matching `users.role` in schema) and `Permission` enum
- [ ] All permissions defined upfront — including ones for modules in Sprint 04, 05, 06:
  ```typescript
  export enum Permission {
    // Students
    ENROL_STUDENT,
    VIEW_STUDENTS,
    EDIT_STUDENT,
    TRANSFER_STUDENT,
    PROMOTE_STUDENTS,
    // Staff
    CREATE_STAFF,
    VIEW_STAFF,
    EDIT_STAFF,
    // Attendance
    MARK_ATTENDANCE,
    VIEW_ATTENDANCE,
    EDIT_ATTENDANCE_RETROACTIVE,
    // Exams
    CREATE_EXAM_SESSION,
    ENTER_MARKS,
    LOCK_MARKS,
    VIEW_ALL_RESULTS,
    VIEW_CLASS_RESULTS,
    GENERATE_REPORT_CARDS,
    // Finance
    CREATE_INVOICE,
    EDIT_INVOICE,
    VOID_INVOICE,
    RECORD_PAYMENT,
    VIEW_FINANCE_REPORTS,
    MANAGE_FEE_STRUCTURE,
    // Boarding
    MANAGE_HOSTELS,
    ASSIGN_BEDS,
    MANAGE_VISITORS,
    MANAGE_SICK_BAY,
    DISBURSE_POCKET_MONEY,
    // Transport
    MANAGE_ROUTES,
    MANAGE_VEHICLES,
    VIEW_LIVE_GPS,
    // Library
    MANAGE_LIBRARY_CATALOG,
    ISSUE_BOOKS,
    RETURN_BOOKS,
    // LMS
    CREATE_COURSE,
    MANAGE_COURSE_CONTENT,
    VIEW_LMS_ANALYTICS,
    // Notifications
    SEND_BULK_SMS,
    SEND_CLASS_SMS,
    SEND_FEE_REMINDERS,
    // Settings
    MANAGE_SCHOOL_SETTINGS,
    MANAGE_FEATURE_FLAGS,
    MANAGE_USERS,
    // Platform
    MANAGE_ALL_SCHOOLS,
    VIEW_PLATFORM_ANALYTICS,
    // Reporting
    EXPORT_MOE_RETURNS,
    VIEW_SCHOOL_ANALYTICS,
  }
  ```
- [ ] `src/lib/roles/matrix.ts` — `ROLE_PERMISSIONS: Record<Role, Permission[]>` object mapping each role to its allowed permissions
- [ ] The matrix is reviewed against the full permission table in the Architecture Document before merging

---

### ISSUE-028 · Implement Permission Hooks and Guards

**Type:** Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Client-side permission utilities that components use to show/hide UI elements based on the current user's permissions.

#### Acceptance Criteria

- [ ] `src/hooks/usePermission.ts`:
  - `usePermission(permission: Permission): boolean` — single permission check
  - `usePermissions(permissions: Permission[]): Record<Permission, boolean>` — batch check
  - `useHasAnyPermission(permissions: Permission[]): boolean`
- [ ] `src/components/auth/PermissionGuard.tsx`:
  - Wraps content that requires a permission
  - Props: `permission: Permission`, `fallback?: ReactNode`
  - Used alongside `FeatureGuard` when both a feature AND a permission are required
- [ ] Both hooks read from `useMe().user.role` and evaluate against the `ROLE_PERMISSIONS` matrix

---

### ISSUE-029 · Implement Convex-Level Role Enforcement

**Type:** Backend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Every Convex mutation and query that is not public must enforce role requirements at the function level. This is the backstop that prevents API-level attacks even if the frontend is bypassed.

#### Acceptance Criteria

- [ ] `convex/_lib/permissions.ts` finalized with all guard functions:
  - `requireRole(ctx, roles: Role[])` — throws if user's role not in array
  - `requirePermission(ctx, permission: Permission)` — uses the same Role-Permission matrix
  - `requireSchoolAdmin(ctx)` — shorthand for `requireRole(ctx, ['school_admin', 'platform_admin'])`
  - `requirePlatformAdmin(ctx)` — shorthand, platform_admin only
- [ ] Integration tests: each guard function tested with valid and invalid roles
- [ ] All mutations in ISSUE-010 (school creation) and ISSUE-021 (branding update) now use these guards

---

### ISSUE-030 · Build User Management Page for School Admins

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 1 day

#### Description

School admins need to create and manage user accounts (teachers, bursars, matrons, etc.) for their school. This page is essential before any staff member can log in.

#### User Story

> As a school admin, I add a new teacher: I enter their name, phone number, and role. The system creates their account and sends them an SMS with a temporary login code. The teacher uses that code to set their password.

#### Acceptance Criteria

- [ ] Page at `/(admin)/settings/users` — lists all non-student users for the school
- [ ] "Add User" form: First Name, Last Name, Phone, Email (optional), Role dropdown (shows only school-level roles)
- [ ] On create:
  - `convex/users/mutations.createUser` called
  - Generates a 6-digit temporary PIN, stores hashed version with 7-day expiry
  - Sends SMS: "Welcome to [School Name] portal. Your login: [phone]. Temporary PIN: [pin]. Visit: [school-url]"
- [ ] Edit user: change name, role, active status
- [ ] Deactivate user: sets `isActive: false`, immediately invalidates sessions (Supabase Auth handles this)
- [ ] Role change: updates `user.role` and shows confirmation: "This will change what [Name] can see and do"
- [ ] Link to staff profile: "View Staff Profile" button for users with a `staffId` link

---

### ISSUE-031 · Implement Multi-School Guardian Account Support

**Type:** Backend | **Priority:** P1 | **Estimate:** 1 day

#### Description

A guardian can have children in different schools on the Acadowl platform (e.g., one child at Kabulonga, another at Chilenje Primary). Their single phone number login must show them all their children's data across schools.

#### User Story

> As a parent with one child at Kabulonga Boys and another at Chilenje Primary, I log in with my phone number and see both children. I can switch between them. Fees for both schools are shown on my dashboard.

#### Acceptance Criteria

- [ ] `convex/users/queries.getMe` returns `guardianProfiles: Array<{ schoolId, guardianId, children: Student[] }>` — one entry per school
- [ ] Parent portal's multi-child switcher shows children grouped by school if cross-school
- [ ] Each school context is resolved independently — no data leaks across schools
- [ ] When guardian logs in for the first time: auto-link runs across ALL schools' guardian tables, not just one
- [ ] Phone number is the unique identifier across schools — enforced at platform level

---

## Epic 7 — Base UI Shell & Navigation

> **Goal:** A polished, responsive shell that every future page will inherit — built once, never touched again.

---

### ISSUE-032 · Build Admin Portal Shell

**Type:** Frontend | **Priority:** P0 | **Estimate:** 1.5 days

#### Description

Build the complete admin portal shell: sidebar navigation, topbar, and content area. This is the frame that wraps every admin page from Sprint 01 onwards.

#### User Story

> As an admin, every page I visit has a consistent sidebar showing my school's logo, my name and role, and navigation items appropriate for my school type and my role.

#### Acceptance Criteria

- [ ] `/(admin)/layout.tsx` renders: `<AdminSidebar />` + `<Topbar />` + `{children}`
- [ ] `AdminSidebar.tsx`:
  - School logo at top (from `useSchool().branding`)
  - Navigation items from `adminNavConfig` — feature-gated and role-gated
  - Collapsible on desktop (icon-only mode)
  - "Settings" group at bottom with: Profile, School Settings, Feature Settings, Users
  - User avatar + name + role chip at very bottom
  - Active route highlighted
- [ ] `Topbar.tsx`:
  - School name (truncated)
  - Academic Year + Term badge (e.g., "2025 · Term 1") — clickable to change active term
  - SMS credits balance (visible to admin/bursar only)
  - Notification bell with unread count
  - User avatar → dropdown: Profile, Settings, Sign Out
- [ ] Mobile: sidebar becomes a drawer, triggered by hamburger in topbar
- [ ] Applies school's `--school-primary` CSS variable to sidebar header and active nav items
- [ ] Accessible: sidebar has `role="navigation"`, main content has `role="main"`

---

### ISSUE-033 · Build Teacher Portal Shell

**Type:** Frontend | **Priority:** P0 | **Estimate:** 0.5 days

#### Description

Build the teacher portal shell — slimmer than the admin shell, focused on the teacher's daily tasks.

#### Acceptance Criteria

- [ ] `/(teacher)/layout.tsx` with `TeacherSidebar` — slim, icon + label
- [ ] Nav items: Dashboard, My Register, My Marks, Timetable, LMS (if enabled), Messages
- [ ] Topbar shows: "Good morning, [FirstName]" greeting, today's date, notification bell
- [ ] Mobile: bottom tab bar with 4 primary items
- [ ] Teacher's assigned sections shown as quick-access chips in sidebar

---

### ISSUE-034 · Build Parent Portal Shell

**Type:** Frontend | **Priority:** P0 | **Estimate:** 1 day

#### Description

The parent portal is mobile-first and must work well on a basic Android phone with Airtel data. It is built for speed and simplicity — not feature density.

#### Acceptance Criteria

- [ ] `/(parent)/layout.tsx` — mobile-first, bottom tab bar navigation
- [ ] `ParentShell.tsx`:
  - Top: school logo + child name/grade (if single child) or child switcher (if multiple)
  - Bottom tab bar: Home, Attendance, Results, Fees, More
  - "More" opens a bottom sheet with: Messages, Transport (if enabled), Notifications, Profile, Sign Out
- [ ] Child switcher: horizontal pill tabs if 2-3 children, dropdown if 4+
  - Shows child's photo (or initials), name, grade
  - Each child's data loads independently
- [ ] **Performance requirement**: First page load under 2 seconds on 3G (test in Chrome DevTools throttling)
- [ ] **Offline indicator**: banner appears when device is offline: "You're offline. Some data may be outdated."

---

### ISSUE-035 · Build Role-Aware Dashboard Pages

**Type:** Frontend | **Priority:** P1 | **Estimate:** 1 day

#### Description

Build placeholder dashboard pages for each portal that will be progressively filled with widgets in future sprints. The dashboard must be role-aware and display only relevant summary widgets.

#### Acceptance Criteria

- [ ] `/(admin)/dashboard/page.tsx`:
  - `WelcomeWidget`: "Good morning, [Name]. Here's today's overview."
  - `QuickStatsRow`: Total students (from Convex query), Staff count, Today's attendance % (placeholder "–" until Sprint 01), Outstanding fees (placeholder until Sprint 02)
  - `RecentActivity` list: last 10 actions in the school (paginated Convex query)
  - `QuickActions` grid: feature-gated buttons for common tasks (e.g., "Take Attendance", "Record Payment")
- [ ] `/(teacher)/dashboard/page.tsx`:
  - Today's timetable (placeholder)
  - My classes + attendance status (placeholder)
  - Recent homework submissions (placeholder)
- [ ] `/(parent)/dashboard/page.tsx`:
  - Child summary card: name, grade, photo
  - Attendance this week (placeholder)
  - Fee balance (placeholder)
  - Recent notifications (from `notifications` table — functional in Sprint 00)
- [ ] All placeholder widgets use `LoadingSkeleton` component, not empty state
- [ ] Each dashboard widget is its own component file in `src/components/dashboard/`

---

### ISSUE-036 · Build Notifications Centre

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 1 day

#### Description

An in-app notification system that shows all notifications sent to the current user. This uses the `notifications` table defined in the schema and is functional from day one — even before SMS is integrated.

#### Acceptance Criteria

- [ ] Notification bell in topbar shows unread count (real-time via Convex `useQuery`)
- [ ] Clicking bell opens a popover/sheet with last 20 notifications
- [ ] `/(admin)/notifications/page.tsx` — full notifications page with pagination
- [ ] `convex/notifications/queries.ts` → `getMyNotifications(userId, limit, cursor)`:
  - Returns notifications for the current user, sorted newest first
  - Supports pagination via Convex cursor
- [ ] `convex/notifications/mutations.ts` → `markAsRead(notificationId)`, `markAllAsRead()`
- [ ] Notification types shown with correct icons: attendance, fees, results, general, emergency
- [ ] Read notifications grayed out; unread have a colored left border
- [ ] Notification count badge disappears when all read

---

## Epic 8 — School Onboarding Flow

> **Goal:** A first-time setup wizard that a school admin completes when logging in for the first time, ensuring the school is properly configured before any other module is used.

---

### ISSUE-037 · Build Onboarding Wizard

**Type:** Frontend + Backend | **Priority:** P1 | **Estimate:** 1.5 days

#### Description

When a school admin logs in for the first time (or when `school.status === 'trial'` and setup is incomplete), they are shown a step-by-step setup wizard. Completing this wizard configures the core school settings needed for Sprint 01 features.

#### User Story

> As a newly onboarded school admin at Munali Boys, I log in for the first time and a friendly wizard guides me through: school branding → academic year setup → grades → my first class section. By the end, the system is ready for teachers to start marking attendance.

#### Acceptance Criteria

- [ ] Wizard page at `/(admin)/onboarding` — redirected here on first login if `school.onboardingComplete !== true`
- [ ] 5 steps with progress indicator:

  **Step 1 — Welcome & Branding**
  - Upload school logo
  - Set primary color
  - Confirm school name and motto
  - Calls `updateBranding` mutation on Next

  **Step 2 — Academic Year Setup**
  - Create current academic year (e.g., "2025")
  - Add terms: Term 1, Term 2, Term 3 with date pickers
  - For college mode: adds Semester 1, Semester 2 instead
  - Calls `createAcademicYear` and `createTerms` mutations

  **Step 3 — Grades & Classes**
  - Add grade levels (checkboxes pre-populated for school type: e.g., Grades 8–12 for secondary)
  - For each selected grade: add sections (A, B, C — configurable)
  - Calls `createGrades` and `createSections` mutations

  **Step 4 — Features Selection**
  - Show feature matrix (simplified version of ISSUE-024)
  - Pre-checked based on school type defaults
  - Admin can adjust here

  **Step 5 — Invite Teachers**
  - Add at least one teacher to proceed (or skip)
  - Shows CSV import option for bulk teacher add (Sprint 01 — placeholder for now)

- [ ] Each step saves independently — wizard can be abandoned and resumed
- [ ] `school.onboardingComplete: v.boolean()` field added to schema
- [ ] After completion: redirect to admin dashboard, show confetti animation 🎉

---

### ISSUE-038 · Build First-Login Experience for Teachers and Parents

**Type:** Frontend | **Priority:** P1 | **Estimate:** 0.5 days

#### Description

When a teacher or parent logs in for the first time (using their temporary PIN or after phone verification), they are prompted to complete their profile and change their password/set preferences.

#### Acceptance Criteria

- [ ] After successful first login:
  - If `user.isFirstLogin === true` → redirect to `/profile/setup`
  - Otherwise → redirect to role dashboard
- [ ] Teacher first-login setup (2 steps):
  - Step 1: Confirm name, upload photo, set permanent password
  - Step 2: Notification preferences
- [ ] Parent first-login setup (1 step):
  - Confirm name, confirm/add children (shows auto-linked children), notification preferences
- [ ] After setup: `user.isFirstLogin` set to `false`
- [ ] `isFirstLogin: v.boolean()` field added to `users` schema

---

## Epic 9 — Developer Experience & Testing

---

### ISSUE-039 · Set Up Testing Infrastructure

**Type:** Dev | **Priority:** P1 | **Estimate:** 0.5 days

#### Acceptance Criteria

- [ ] Vitest configured with `@testing-library/react` for component tests
- [ ] `convex/tests/` directory created for Convex function unit tests using `convex-test` package
- [ ] Test scripts: `npm run test` (watch mode), `npm run test:ci` (single run, for CI)
- [ ] First working test: `schoolSlug.test.ts` covering all extraction cases from ISSUE-004
- [ ] First working component test: `FeatureGuard.test.tsx` verifying it renders/hides children correctly
- [ ] Code coverage report configured (minimum 60% for `convex/` directory enforced in CI)
- [ ] Test utilities: `src/tests/helpers/` with `renderWithProviders()` wrapper that sets up all providers

---

### ISSUE-040 · Write Developer Documentation and README

**Type:** Docs | **Priority:** P1 | **Estimate:** 0.5 days

#### Acceptance Criteria

- [ ] `README.md` complete with:
  - System overview (1 paragraph)
  - Prerequisites (Node 20+, npm 9+)
  - Installation steps (clone → install → env setup → seed → dev)
  - How to set up local subdomains for multi-tenant testing
  - How to run tests
  - Link to architecture document
- [ ] `CONTRIBUTING.md` with:
  - Branch naming convention: `feat/issue-XXX-short-description`
  - PR template (checklist: lint passing, tests passing, type-check passing, Convex function has school scope check)
  - Code review rules: no self-merges, at least 1 approval
  - Commit message convention: `feat:`, `fix:`, `chore:`, `docs:`
- [ ] `docs/architecture/` directory with the full architecture document from the previous phase
- [ ] Inline JSDoc comments on all exported functions in `convex/_lib/` and `src/lib/`
- [ ] `SECURITY.md` with:
  - Responsible disclosure policy
  - The five security layers of multi-tenancy (auth scope, Convex middleware, feature flag, role permission, UI guard)

---

## Dependency Graph

Issues must be completed in this order to unblock downstream work:

```
ISSUE-001 (Scaffolding)
    └─► ISSUE-002 (UI Library)
    └─► ISSUE-003 (ESLint/Prettier)
    └─► ISSUE-004 (Subdomain Routing)
            └─► ISSUE-019 (SchoolProvider)
            └─► ISSUE-020 (ThemeProvider)

ISSUE-005 (Core Schema)
ISSUE-006 (User/Staff/Guardian Schema)
ISSUE-007 (Student Schema)
ISSUE-008 (Skeleton Tables)    ◄── All four must be done TOGETHER in one Convex push
ISSUE-009 (Convex Utilities)
    └─► ALL backend mutations from ISSUE-011 onwards

ISSUE-011 (Auth Config)
    └─► ISSUE-012 (Login - Email)
    └─► ISSUE-013 (Login - OTP)
    └─► ISSUE-014 (Auth Layout + Route Protection)
    └─► ISSUE-015 (Role Resolution)
    └─► ISSUE-016 (Forgot Password)

ISSUE-017 (School Creation)
    └─► ISSUE-037 (Onboarding Wizard)

ISSUE-018 (Convex Scoping Layer)
    └─► ALL subsequent Convex functions

ISSUE-023 (Feature Flag Engine)
    └─► ISSUE-024 (Feature Management UI)
    └─► ISSUE-025 (FeatureGuard Component)
    └─► ISSUE-026 (Feature-Gated Nav)

ISSUE-027 (Role/Permission Matrix)
    └─► ISSUE-028 (Permission Hooks)
    └─► ISSUE-029 (Convex Role Enforcement)
    └─► ISSUE-030 (User Management Page)

ISSUE-032 (Admin Shell)
    └─► ISSUE-035 (Dashboard Pages)
    └─► ISSUE-036 (Notifications Centre)
```

---

## Definition of Done

An issue is **Done** when ALL of the following are true:

- [ ] **Code complete**: All acceptance criteria checked off
- [ ] **Type-safe**: `npm run type-check` passes with zero errors
- [ ] **Linted**: `npm run lint` passes with zero errors
- [ ] **Tested**: Relevant unit/component tests written and passing
- [ ] **Reviewed**: PR approved by at least 1 other developer
- [ ] **Documented**: Any public API, hook, or utility has a JSDoc comment
- [ ] **Schema check**: If the issue touches `convex/schema.ts`, the schema has been pushed and validated against the live Convex dev deployment
- [ ] **Mobile tested**: If the issue produces UI, it has been tested at 375px viewport width
- [ ] **Feature-gated**: If the issue belongs to an optional module, the Feature enum check is present in both the UI component and the Convex function

---

## Environment Variables Reference

Complete list of environment variables. Add to `.env.example` with empty values. Never commit `.env.local`.

```bash
# ── CONVEX ──
CONVEX_DEPLOYMENT=                    # From `npx convex dev`
NEXT_PUBLIC_CONVEX_URL=               # From `npx convex dev`
CONVEX_AUTH_PRIVATE_KEY=              # From Supabase Auth setup
NEXT_PUBLIC_CONVEX_SITE_URL=          # e.g., https://Acadowl.zm (for auth redirect)

# ── AUTHENTICATION ──
# Supabase Auth uses JWKS internally — run `npx Supabase Auth configure`
AUTH_RESEND_KEY=                      # For email auth (optional — we primarily use SMS)

# ── SMS PROVIDERS ──
AIRTEL_SMS_API_KEY=                   # Airtel Zambia Developer API key
AIRTEL_SMS_SENDER_ID=                 # 'Acadowl' (must be registered with Airtel)
MTN_SMS_API_KEY=                      # MTN Zambia SMPP credentials
MTN_SMS_HOST=
MTN_SMS_PORT=

# ── MOBILE MONEY ──
AIRTEL_MONEY_CLIENT_ID=               # Sprint 02
AIRTEL_MONEY_CLIENT_SECRET=           # Sprint 02
AIRTEL_MONEY_PIN=                     # Sprint 02
MTN_MOMO_API_USER=                    # Sprint 02
MTN_MOMO_API_KEY=                     # Sprint 02
MTN_MOMO_SUBSCRIPTION_KEY=            # Sprint 02

# ── ZRA VSDC ──
ZRA_VSDC_API_URL=                     # Sprint 02 — ZRA's API endpoint
ZRA_VSDC_API_KEY=                     # Sprint 02

# ── FILE STORAGE ──
CLOUDINARY_CLOUD_NAME=                # For logo and photo uploads
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET= # Unsigned upload preset for client-side uploads

# ── APP ──
NEXT_PUBLIC_APP_URL=                  # e.g., https://Acadowl.zm
NEXT_PUBLIC_APP_ENV=                  # 'development' | 'staging' | 'production'

# ── INTERNAL ──
WEBHOOK_SECRET=                       # For verifying incoming webhook authenticity
CRON_SECRET=                          # For triggering cron endpoints manually in dev
```

---

## Sprint 00 → Sprint 01 Handoff Checklist

Before Sprint 01 (Core Academic Foundation) begins, verify:

- [ ] All 38 issues in this sprint are marked Done
- [ ] Seed script creates 3 test schools and populates them with realistic data
- [ ] A developer can log in as each of the 10 roles and see the correct portal
- [ ] The feature flag engine correctly shows/hides nav items for each school type
- [ ] The full schema is in production Convex deployment — no pending migrations
- [ ] CI pipeline is green on `main` branch
- [ ] `.env.example` is complete with all variables needed up to Sprint 02
- [ ] Sprint 01 developers have been onboarded and can run the project locally

---

_Acadowl Development Guide — Sprint 00 — Infrastructure & Authentication_
_Last updated: 2025 | Next Sprint: Sprint 01 — Core Academic Foundation_

