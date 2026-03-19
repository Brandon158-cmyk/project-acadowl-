---
trigger: always_on
---
---
trigger: always_on
---

**Version:** 1.0 | **Design Codename:** Veritas Nexus v2.0  
This file is the single source of truth for all AI agents and developers working in this codebase.  
Rules here are **non-negotiable** and override any default AI behaviour or personal preferences.  
Read the entire document before writing a single line of code

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack — Approved Libraries Only](#2-tech-stack--approved-libraries-only)
3. [Architecture Rules — Permanent Decisions](#3-architecture-rules--permanent-decisions)
4. [Folder & File Structure](#4-folder--file-structure)
5. [Convex Backend Rules](#5-convex-backend-rules)
6. [Frontend & React Rules](#6-frontend--react-rules)
7. [Design System Rules — Veritas Nexus v2.0](#7-design-system-rules--veritas-nexus-v20)
8. [Multi-Tenancy Rules](#8-multi-tenancy-rules)
9. [Feature Flag Rules](#9-feature-flag-rules)
10. [Role-Based Access Control Rules](#10-role-based-access-control-rules)
11. [TypeScript Rules](#11-typescript-rules)
12. [Testing Rules](#12-testing-rules)
13. [Code Quality Rules](#13-code-quality-rules)
14. [Sprint Scope & Module Boundaries](#14-sprint-scope--module-boundaries)
15. [AI Integration Rules](#15-ai-integration-rules)
16. [Zambia-Specific Context](#16-zambia-specific-context)
17. [Definition of Done](#17-definition-of-done)

---

## 1. Project Overview

**Acadowl** is a multi-tenant school management platform for Zambian educational institutions — from primary day schools to boarding secondary schools to HEA-accredited colleges. It is built to work in real Zambian conditions: intermittent data connections, basic Android phones, Airtel and MTN mobile money, ZRA Smart Invoice compliance, and ECZ examination grading.

The platform serves eight user types: Platform Admin, School Admin, Deputy Head, Bursar, Teacher/Class Teacher, Matron, Librarian, Driver, Guardian (Parent), and Student. Each school gets its own isolated tenant with configurable features based on school type and subscription tier.

The system is delivered across 8 sprints, each building on — and never breaking — the previous one.

---

## 2. Tech Stack — Approved Libraries Only

Never add a library outside this list without explicit approval. The stack is locked.

### Core
| Purpose | Library | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.x, strict mode |
| Database / Backend | Convex | latest |
| Auth | `@supabase/supabase-js` + `@supabase/ssr` | latest |
| Styling | Tailwind CSS | 3.x |
| UI Components | shadcn/ui (modified — see §7) | latest |
| Icons | lucide-react | latest |
| Animation | `motion/react` (Framer Motion) | latest |
| Forms | `react-hook-form` + `zod` | latest |

### Data & Utilities
| Purpose | Library |
|---|---|
| Date formatting | `date-fns` |
| Class merging | `clsx` + `tailwind-merge` via `cn()` util |
| Charts | `recharts` |
| Validation | `zod` (client-side), Convex `v.` validators (server-side) |
| Convex helpers | `convex-helpers` |

### Fonts
| Font | Usage |
|---|---|
| Playfair Display | Headings only (`font-serif`) |
| Inter | All body, UI, tables, inputs (`font-sans`) |

### ❌ Never Use
- Axios — use native `fetch`
- Moment.js — use `date-fns`
- Redux / Zustand / Jotai — Convex reactive queries are the state layer
- Express / Node servers — Convex is the only backend
- Supabase **database** (Postgres, Realtime, Storage) — Convex is the only database. Supabase is used **for authentication only**
- Firebase — for anything
- `@convex-dev/auth` — this project uses Supabase Auth, not Convex own auth package
- Any icon library other than Lucide React
- `@emotion/css`, styled-components, or CSS modules — Tailwind only
- `console.log` — use `console.warn` or `console.error` only

---

## 3. Architecture Rules — Permanent Decisions

These are immutable. They apply to every sprint. Code review will reject violations.

### Rule 1 — Supabase for Auth, Convex for Everything Else
**Supabase** handles authentication exclusively: user sessions, JWT issuance, phone OTP, email/password login, and password resets. **Convex** handles everything else: all data storage, queries, mutations, scheduled jobs, and external API calls.

Next.js API routes (`src/app/api/`) are used **only** for:
- Incoming webhook ingestion (Airtel Money, MTN MoMo, ZRA VSDC)
- Next.js-specific server actions where Convex cannot be used

The connection between them: Supabase issues a JWT on login. The client passes that JWT to Convex. Convex verifies it against Supabase JWKS and trusts the identity. The two systems never write to each other — Supabase owns the session, Convex owns the data.

### Rule 2 — Every Document is School-Scoped
Every Convex table (except `schools` and `platformAdmins`) **must** have a `schoolId: v.id('schools')` field. Every query on any such table **must** use `.withIndex('by_school', q => q.eq('schoolId', schoolId))`. A query that returns data without a `schoolId` check will be rejected in PR review.

### Rule 3 — Feature Flags Gate Everything
No module assumes it is always available. Every route, nav item, and Convex function belonging to an optional module **must** check the relevant `Feature` flag before executing. No exceptions. Implement the feature guard on Day 1 of building any module.

### Rule 4 — Roles are Composable, Not Hierarchical
Users have one `role`. Roles are evaluated as sets of permissions using the Role→Permission matrix in `src/lib/roles/matrix.ts`. **Never** compare roles directly in business logic (e.g., `if (user.role === 'teacher')`). Always use `canDo(user.role, Permission.MARK_ATTENDANCE)` or `requirePermission(ctx, permission)`.

### Rule 5 — The Schema is the Contract
The Convex schema in `convex/schema.ts` is the contract for all sprints. Additive changes (new tables, new optional fields) are always allowed. **Breaking changes (rename, removal of fields) require a documented migration plan and senior approval.** Future sprints add — they never break.

### Rule 6 — Design for Offline from Day 1
Any mutation that will be used offline (primarily attendance) must be idempotent and accept an optional `clientId: v.optional(v.string())` for deduplication. Client-side IDs are generated with `crypto.randomUUID()`. The offline queue in `src/hooks/useOfflineQueue.ts` handles replaying mutations.

### Rule 7 — Mobile-First Performance
The parent portal must load in under 2 seconds on a 3G connection (test in Chrome DevTools throttle). No component in the `/(parent)/` route group may block on more than one Convex query before rendering a meaningful UI. Use `LoadingSkeleton` for all loading states — never blank screens.

### Rule 8 — No Hardcoded School Assumptions
Never hardcode school names, school IDs, or school types in component or function logic. Read from context: `useSchool()`, `useFeature()`, `useMe()`. The system must work identically for a 150-student primary day school and a 2,000-student boarding college.

---

## 4. Folder & File Structure

The folder structure is locked. New files go **inside** existing directories. **Never create new top-level directories.**

```
Acadowl/
├── convex/
│   ├── _generated/           # Never edit — auto-generated by Convex CLI
│   ├── schema.ts             # THE only source of truth for all DB tables
│   ├── _lib/
│   │   ├── permissions.ts    # requireRole, requirePermission, canDo
│   │   ├── schoolContext.ts  # withSchoolScope, getAuthenticatedUserAndSchool
│   │   ├── featureGuard.ts   # requireFeature — server-side feature check
│   │   └── errors.ts         # Standardised error codes
│   ├── schools/              # queries.ts, mutations.ts, validators.ts
│   ├── users/
│   ├── students/
│   ├── staff/
│   ├── attendance/
│   ├── exams/
│   ├── fees/
│   ├── boarding/             # Feature.BOARDING gated
│   ├── transport/            # Feature.TRANSPORT gated
│   ├── lms/                  # Feature.LMS gated
│   └── library/              # Feature.LIBRARY gated
│
└── src/
    ├── app/
    │   ├── (auth)/           # No shell, no sidebar — login pages only
    │   ├── (admin)/          # School admin, deputy, bursar, matron, librarian
    │   ├── (teacher)/        # Teacher and class teacher portal
    │   ├── (parent)/         # Guardian portal — mobile-first
    │   ├── (student)/        # Student self-portal
    │   ├── (driver)/         # Driver GPS PWA
    │   ├── (platform)/       # Platform super admin
    │   └── api/webhooks/     # Airtel, MTN, ZRA webhook ingestion only
    ├── components/
    │   ├── ui/               # shadcn/ui components — always modified for Veritas Nexus
    │   ├── layout/           # AdminSidebar, TeacherSidebar, ParentShell, Topbar, MobileNav
    │   ├── auth/             # LoginForm, OtpForm, AuthGuard, PermissionGuard
    │   ├── school/           # SchoolLogo, FeatureGuard, FeatureGuardServer
    │   └── shared/           # PageHeader, EmptyState, LoadingSkeleton, ErrorBoundary
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts     # Browser Supabase client (singleton, used in Client Components)
    │   │   ├── server.ts     # Server Supabase client (uses @supabase/ssr cookies)
    │   │   └── middleware.ts # Supabase session refresh logic called from src/middleware.ts
    │   ├── features/         # flags.ts (Feature enum), presets.ts (school type defaults)
    │   ├── roles/            # types.ts (Role + Permission enums), matrix.ts (mapping)
    │   ├── navigation/       # adminNavConfig.ts, teacherNavConfig.ts, parentNavConfig.ts
    │   ├── utils/            # cn.ts, formatZMW.ts, schoolSlug.ts
    │   └── constants/        # zambia.ts (provinces, districts), ecz.ts (grading)
    ├── hooks/
    │   ├── useSchool.ts
    │   ├── useMe.ts
    │   ├── useSupabaseSession.ts  # Returns live Supabase session + user
    │   ├── useFeature.ts
    │   ├── usePermission.ts
    │   └── useOfflineQueue.ts
    ├── providers/
    │   ├── ConvexWithSupabaseProvider.tsx  # Wires Supabase JWT into Convex — see §6.1
    │   ├── SchoolProvider.tsx
    │   └── ThemeProvider.tsx
    └── types/
        ├── school.ts
        ├── user.ts
        └── api.ts
```

### File Naming Conventions
- React components: `PascalCase.tsx` (e.g., `StudentTable.tsx`)
- Hooks: `camelCase.ts`, prefixed `use` (e.g., `useSchool.ts`)
- Convex functions: `queries.ts`, `mutations.ts`, `actions.ts` within their module folder
- Utility functions: `camelCase.ts` (e.g., `formatZMW.ts`)
- Constants: `camelCase.ts` (e.g., `zambia.ts`)
- Types: `camelCase.ts` (e.g., `school.ts`)

---

## 5. Convex Backend Rules

### 5.1 Every Function Must Use `withSchoolScope`

```typescript
// ✅ CORRECT — every school-scoped query
export const getStudents = query({
  args: { sectionId: v.id('sections') },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      return ctx.db
        .query('students')
        .withIndex('by_section', q => q.eq('currentSectionId', args.sectionId))
        .filter(q => q.eq(q.field('schoolId'), schoolId)) // redundant but explicit
        .collect();
    });
  },
});

// ❌ WRONG — no school scope check
export const getStudents = query({
  handler: async (ctx) => {
    return ctx.db.query('students').collect(); // WILL BE REJECTED IN PR REVIEW
  },
});
```

### 5.2 Every Mutation Requires Role and Permission Checks

```typescript
export const enrolStudent = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    const { user, school } = await requirePermission(ctx, Permission.ENROL_STUDENT);
    // ... rest of handler
  },
});
```

### 5.3 Optional Module Functions Require Feature Checks

```typescript
export const assignBed = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    const { user, school } = await requirePermission(ctx, Permission.ASSIGN_BEDS);
    await requireFeature(ctx, school, Feature.BOARDING);
    // ... rest of handler
  },
});
```

### 5.4 Schema Is Additive Only
- ✅ Adding a new table: allowed
- ✅ Adding an optional field (`v.optional(...)`) to an existing table: allowed
- ❌ Renaming a field: **forbidden without migration plan**
- ❌ Removing a field: **forbidden without migration plan**
- ❌ Changing a field's type: **forbidden without migration plan**

### 5.5 Index Requirements
Every new table **must** have at minimum:
- `.index('by_school', ['schoolId'])` — on every school-scoped table
- An index for every field used in a `.filter()` or `.withIndex()` call

### 5.6 Offline-Safe Mutations
Mutations used offline (attendance, primarily) **must**:
- Accept `clientId: v.optional(v.string())` for deduplication
- Use `crypto.randomUUID()` on client for ID generation
- Be fully idempotent when replayed with the same `clientId`

### 5.7 Error Handling
All Convex functions **must** throw errors using the standardised error classes from `convex/_lib/errors.ts`. Never use raw `throw new Error('...')` strings.

### 5.8 Notifications
Every automated notification (attendance SMS, fee reminder, sick bay alert, etc.) **must** write a record to the `notifications` table via `createNotification` mutation before or at the time the SMS is dispatched. The `notifications` table is the audit log.

---

## 6. Frontend & React Rules

### 6.1 Supabase + Convex Auth Integration

This is the most critical frontend pattern. Understand it before writing any authenticated component.

#### How It Works

1. **Supabase** handles all authentication — login, OTP, session refresh, logout, password reset.
2. After successful auth, Supabase issues a signed JWT (access token).
3. `ConvexWithSupabaseProvider` automatically passes that JWT to Convex on every request.
4. Convex verifies the JWT against Supabase JWKS (`{SUPABASE_URL}/.well-known/jwks.json`).
5. `ctx.auth.getUserIdentity()` inside any Convex function returns the verified Supabase claims.
6. The `tokenIdentifier` on the `users` table equals the Supabase `sub` (UUID) from those claims.

#### The Provider (`src/providers/ConvexWithSupabaseProvider.tsx`)

```tsx
'use client';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { createBrowserClient } from '@supabase/ssr';
import { useCallback, useEffect, useMemo, useState } from 'react';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function useAuthFromSupabase() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setToken(session?.access_token ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (forceRefreshToken) {
        const { data } = await supabase.auth.refreshSession();
        return data.session?.access_token ?? null;
      }
      return token ?? null;
    },
    [supabase, token],
  );

  return useMemo(() => ({
    isLoading: token === undefined,
    isAuthenticated: token !== null && token !== undefined,
    fetchAccessToken,
  }), [token, fetchAccessToken]);
}

export function ConvexWithSupabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthFromSupabase}>
      {children}
    </ConvexProviderWithAuth>
  );
}
```

#### Convex Auth Config (`convex/auth.config.ts`)

```typescript
// The ONLY auth config needed in Convex. No @convex-dev/auth required.
export default {
  providers: [
    {
      domain: process.env.NEXT_PUBLIC_SUPABASE_URL,
      applicationID: 'convex',
    },
  ],
};
```

This tells Convex to verify JWTs against Supabase JWKS. No other auth setup is needed in Convex.

#### Auth in Client Components

```typescript
import { createBrowserClient } from '@supabase/ssr';
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Email / password login (staff)
const { error } = await supabase.auth.signInWithPassword({ email, password });

// Send phone OTP (parents)
const { error } = await supabase.auth.signInWithOtp({ phone: '+260971234567' });

// Verify OTP
const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });

// Logout
await supabase.auth.signOut();

// Password reset — sends SMS to registered phone (not email)
// Implemented as a custom Convex action that generates + SMS a reset code
```

#### Auth in Server Components

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { cookies: { get: (name) => cookies().get(name)?.value } },
);
// ALWAYS use getUser() server-side — never getSession()
const { data: { user } } = await supabase.auth.getUser();
```

#### Auth in Middleware (`src/middleware.ts`)

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => request.cookies.get(n)?.value,
        set: (n, v, o) => {
          request.cookies.set({ name: n, value: v, ...o });
          response.cookies.set({ name: n, value: v, ...o });
        },
        remove: (n, o) => {
          request.cookies.set({ name: n, value: '', ...o });
          response.cookies.set({ name: n, value: '', ...o });
        },
      },
    },
  );
  // MUST call getUser() to refresh the session cookie — skipping this causes logouts
  const { data: { user } } = await supabase.auth.getUser();
  // Then extract school slug, enforce role-based redirects...
  return response;
}
```

#### Auth Rules (Non-Negotiable)

- ✅ Use `createBrowserClient` in Client Components and custom hooks
- ✅ Use `createServerClient` with cookies in Server Components, Route Handlers, and Middleware
- ✅ Middleware **must** call `supabase.auth.getUser()` to keep session cookies fresh
- ✅ After login, always call the Convex `users.mutations.resolveUserProfile` mutation to link the Supabase identity to the Convex user document
- ❌ Never use `supabase.auth.getSession()` server-side — it reads the cookie without re-verifying with Supabase servers. Use `getUser()` instead.
- ❌ Never create a module-level Supabase singleton in server-side code — create a new client per request
- ❌ Never pass the Supabase JWT to Convex manually — `ConvexWithSupabaseProvider` handles this
- ❌ Never install or import `@convex-dev/auth` — it is not used in this project

---

### 6.2 Data Fetching
- All data fetching uses Convex hooks: `useQuery(api.module.queries.funcName, args)` and `useMutation(api.module.mutations.funcName)`
- Never use `fetch()` directly for application data — only for webhook endpoints and third-party APIs
- Never put `useQuery` results into `useState` — use the query result directly
- Convex reactive queries are the state layer. Do not add Redux, Zustand, or Jotai.

### 6.2 Forms
All forms use `react-hook-form` with `zod` schema validation. Never build a form with raw `useState`. The form submission calls a Convex mutation via `useMutation`.

```typescript
// ✅ Correct form pattern
const schema = z.object({ name: z.string().min(1) });
const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
const enrol = useMutation(api.students.mutations.enrolStudent);

const onSubmit = async (data) => {
  await enrol(data);
};
```

### 6.3 Loading States
- Every async operation must have a visible loading state
- Use `<LoadingSkeleton />` for initial page data loads
- Use spinner (via `<Loader2 className="animate-spin" />`) inside buttons during mutations
- Never show blank screens — always show a skeleton or loading indicator

### 6.4 Error States
- Convex mutation errors must be caught and displayed as inline form errors or toast notifications
- Use the Sonner toast library (from shadcn/ui) for success and error toasts
- Toast messages follow the voice guidelines: clear, specific, institution-grade language (see §7.8)

### 6.5 Server vs Client Components
- Default to **Server Components** for pages that fetch data
- Use `'use client'` only when the component needs: hooks, browser APIs, event handlers, or Framer Motion
- Never put `useQuery` in a Server Component — it requires `'use client'`
- Layout files (`layout.tsx`) may be Server Components; they receive data via `headers()` and pass as props

### 6.6 Route Groups
- Admin/staff features → `/(admin)/`
- Teacher features → `/(teacher)/`
- Parent features → `/(parent)/`
- Student features → `/(student)/`
- Driver GPS PWA → `/(driver)/`
- Platform super admin → `/(platform)/`
- Auth pages → `/(auth)/`

Never put admin-only content in the parent or teacher route group. Route group membership determines shell, navigation, and access control.

### 6.7 Navigation Config
Never hardcode nav items in a sidebar component. All nav items are declared in the nav config files in `src/lib/navigation/`. Each item specifies `requiredFeature` and `requiredPermission`. The sidebar component renders by iterating the config through `<FeatureGuard>` and `<PermissionGuard>` wrappers.

---

## 7. Design System Rules — Veritas Nexus v2.0

These rules are absolute. Every UI component — whether built from scratch or adapted from shadcn/ui — must comply.

### 7.1 Color Tokens

Use Tailwind CSS custom tokens. **Never hardcode hex values inline in className strings.**

| Token | Hex | Use |
|---|---|---|
| `bg-school-primary` | `#A51C30` | Primary CTAs, active nav, key interactive states |
| `hover:bg-crimson-dark` | `#7A1523` | Hover on primary buttons and nav items |
| `bg-parchment` | `#F9F8F6` | **All page backgrounds** — never `bg-white` on a page root |
| `bg-onyx` / `text-onyx` | `#111827` | Sidebar shells, primary text |
| `text-slate-ui` | `#6B7280` | Secondary text, placeholders, borders |
| `bg-gold-leaf` | `#D4AF37` | Accent only — never for CTAs |

**Semantic colors** for feedback states only:
- Success: `text-green-800 bg-green-100` / `#059669` on `#ecfdf5`
- Warning: `text-amber-800 bg-amber-100` / `#D97706` on `#fffbeb`
- Error: `text-red-800 bg-red-100` / `#E11D48` on `#fff1f2`
- Info: `text-blue-800 bg-blue-100` / `#2563EB` on `#eff6ff`

**Color Rules:**
- ✅ Page background: always `bg-parchment`
- ✅ Sidebar/structural shells: always `bg-onyx`
- ❌ Never use `bg-white` as a full page background
- ❌ Never use pure `#000000` or `#ffffff` on large surfaces
- ❌ Never use `bg-gold-leaf` for primary action buttons

### 7.2 Typography

**Font assignment:**
- `font-serif` (Playfair Display): headings `h1`–`h3` only
- `font-sans` (Inter): all body text, labels, inputs, table cells, captions
- `font-mono` (JetBrains Mono / system mono): student IDs, invoice numbers, staff codes, timestamps, and any reference codes

**Type scale:**
| Role | Classes |
|---|---|
| Heading 1 | `font-serif text-4xl font-semibold text-onyx` |
| Heading 2 | `font-serif text-3xl font-semibold text-onyx` |
| Heading 3 | `font-serif text-2xl font-semibold text-onyx` |
| Heading 4 | `font-sans text-xl font-semibold text-onyx` |
| Body Base | `font-sans text-base text-gray-700` |
| Body Small | `font-sans text-sm text-gray-600` |
| Caption / Label | `font-sans text-xs font-medium tracking-wide` |
| Table Header | `text-xs uppercase tracking-wider text-gray-500 font-semibold` |
| Reference / ID | `font-mono text-sm text-gray-500` |

**Typography Rules:**
- ❌ Never use Playfair Display for body text, inputs, table cells, or labels
- ❌ Never use font weight below 400
- ❌ Never center-align paragraphs longer than 3 lines
- ✅ Apply `antialiased` to the root `<body>`
- ✅ Keep body text measure between 60–80 characters (`max-w-prose`)

### 7.3 Spacing

All spacing must be multiples of 4px (Tailwind 8pt grid: `p-1, p-2, p-3, p-4, p-6, p-8, p-12, p-16`).

| Context | Token |
|---|---|
| Button padding | `px-4 py-2.5` |
| Standard card padding | `p-6` (desktop), `p-4` (mobile) |
| Large card / section | `p-8` |
| Form field gap | `gap-4` or `space-y-4` |
| Section gap in layout | `gap-6` desktop, `gap-4` mobile |
| Page margin | `p-6 md:p-8` |

### 7.4 Border Radius

| Element | Token |
|---|---|
| Buttons, inputs, dropdowns | `rounded-lg` (8px) |
| Cards, widgets, small modals | `rounded-xl` (12px) |
| Large layout blocks, full modals | `rounded-2xl` (16px) |
| Badges, status chips | `rounded-full` |
| Small badges, checkboxes | `rounded-md` (6px) |

### 7.5 Elevation (Shadows)

| Shadow | Use |
|---|---|
| `shadow-sm` + `border border-gray-200` | Default resting state for all cards, buttons, inputs |
| `shadow-md` | Hover state on interactive cards, dropdowns, tooltips |
| `shadow-lg` | Modals, dialogs, floating command palettes |

**Shadow Rule:** Shadows communicate z-index only — never use them purely for decoration.

### 7.6 Button Implementation

```tsx
// PRIMARY — only one per screen context
<button className="bg-school-primary hover:bg-crimson-dark text-white px-4 py-2.5
                   rounded-lg font-medium transition-all duration-200 shadow-sm
                   active:scale-95 flex items-center gap-2">
  Save Record
</button>

// SECONDARY
<button className="bg-white hover:bg-gray-50 text-onyx border border-gray-300
                   px-4 py-2.5 rounded-lg font-medium transition-all duration-200
                   shadow-sm active:scale-95">
  Cancel
</button>

// GHOST / TERTIARY
<button className="text-school-primary hover:bg-red-50 px-4 py-2.5 rounded-lg
                   font-medium transition-all duration-200 active:scale-95
                   flex items-center gap-2">
  <Plus size={18} /> Add Row
</button>

// DESTRUCTIVE
<button className="bg-white hover:bg-red-50 text-red-600 border border-red-200
                   px-4 py-2.5 rounded-lg font-medium transition-all duration-200
                   shadow-sm active:scale-95">
  Delete
</button>
```

**Button Rules:**
- ✅ All buttons: `transition-all duration-200` + `active:scale-95`
- ✅ Minimum touch target: `py-2.5` (40px total)
- ✅ Icon-only buttons: must have `aria-label`
- ❌ Never place two Primary buttons in the same visible view

### 7.7 Input Field Implementation

```tsx
// DEFAULT INPUT
<div>
  <label htmlFor="field-id" className="block text-sm font-medium text-gray-700 mb-1">
    Label Text
  </label>
  <input
    id="field-id"
    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
               focus:outline-none focus:ring-2 focus:ring-school-primary/20
               focus:border-school-primary transition-all shadow-sm"
  />
</div>

// ERROR STATE — pair with aria-describedby
<p id="field-id-error" className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
  <AlertCircle size={14} /> Specific explanation of what went wrong.
</p>
```

**Input Rules:**
- ✅ Focus ring: always `focus:ring-2 focus:ring-school-primary/20` — never suppress
- ✅ Labels always above field with `mb-1`
- ✅ Error messages use `aria-describedby` linking to the input
- ❌ Never remove focus outlines

### 7.8 Data Tables

```tsx
<div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
  <table className="w-full text-left border-collapse">
    <thead>
      <tr className="bg-gray-50 border-b border-gray-200">
        <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Column</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      <tr className="hover:bg-gray-50/50 transition-colors">
        <td className="p-4 font-mono text-sm text-gray-500">STU-001</td>  {/* IDs */}
        <td className="p-4 font-medium text-gray-900">Jane Doe</td>       {/* Names */}
        <td className="p-4 text-right">                                   {/* Actions — always right-aligned */}
          <button className="text-school-primary text-sm font-medium hover:underline">Edit</button>
        </td>
      </tr>
    </tbody>
  </table>
  {/* Pagination always required */}
  <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
    <span>Showing 1–50 of 1,200 records</span>
    {/* pagination controls */}
  </div>
</div>
```

**Table Rules:**
- ✅ `divide-y divide-gray-100` for row separation — no vertical column borders
- ✅ `hover:bg-gray-50/50` on all `<tr>` elements
- ✅ Numbers and actions: `text-right`
- ✅ IDs and reference codes: `font-mono`
- ✅ Always include explicit pagination — never infinite scroll
- ❌ No vertical borders between columns

### 7.9 Status Badges

```tsx
// These are the only badge patterns. Use the correct one per status.
<span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
<span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Inactive</span>
<span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">Pending</span>
<span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">Suspended</span>
<span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Draft</span>
```

### 7.10 Motion & Animation

```tsx
// Page section entrance — use on every major content section
<motion.section
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.5 }}
>

// Modal / dialog entrance
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>

// Sidebar entrance
<motion.aside
  initial={{ x: -50, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
>
```

**Motion Rules:**
- ✅ Hover/color transitions: `transition-all duration-200 ease-in-out`
- ✅ Button press: `active:scale-95`
- ✅ Page entrances: `duration-300–500`
- ❌ Never use spring bounce or elastic easing on functional UI
- ❌ Never animate properties that cause layout reflow
- ❌ Never use `duration` above `500ms` for interactive feedback

### 7.11 Icons (Lucide React Only)

| Size | Usage |
|---|---|
| `size={16}` | Inline with text, small buttons, inside inputs |
| `size={20}` | Sidebar navigation, standard standalone icons |
| `size={24}` | Empty states, section header accompaniments |

**Standard Metaphor Map (non-negotiable):**
- Students → `<Users />`
- Staff/Teachers → `<GraduationCap />`
- Attendance → `<CalendarCheck />`
- Academics → `<BookOpen />`
- Finance/Fees → `<CreditCard />`
- Settings → `<Settings />`
- View/Preview → `<Eye />`
- Add/Create → `<Plus />`
- Loading → `<Loader2 className="animate-spin" />`
- Error → `<AlertCircle />`
- Success → `<CheckCircle2 />`
- Search → `<Search />`

### 7.12 shadcn/ui Override Policy

Always install shadcn components via CLI, then **immediately modify** them to match Veritas Nexus tokens before use. Required overrides:

| Component | Required Changes |
|---|---|
| `Button` | Primary variant → `bg-school-primary hover:bg-crimson-dark`; add `active:scale-95`; `rounded-lg` |
| `Input` | Focus ring → `focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary`; `rounded-lg` |
| `Dialog` | Content wrapper → `shadow-lg rounded-2xl`; entrance `duration-300 ease-out` |
| `Badge` | Remap variants to status color system; use `rounded-full` |
| `Table` | `<TableHead>` → `text-xs uppercase tracking-wider text-gray-500 font-semibold`; `<TableRow>` → `hover:bg-gray-50/50 transition-colors` |

> **Rule:** If a shadcn component needs more than 3 override patches to match these guidelines, build the component from scratch instead.

### 7.13 Page Shell Pattern

```tsx
// Every admin page follows this structure
<div className="min-h-screen flex bg-parchment">
  <AdminSidebar />
  <main className="flex-1 overflow-y-auto p-6 md:p-8" role="main">
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-semibold text-onyx">Page Title</h1>
        <p className="text-gray-500 mt-1 text-sm">Supporting description.</p>
      </div>
      {/* Content */}
    </div>
  </main>
</div>
```

### 7.14 Voice & System Messages

| Context | ✅ Write This | ❌ Not This |
|---|---|---|
| Save success | "The student's academic record has been updated." | "Awesome! Great job! 🎉" |
| Conflict error | "Unable to save. Mr. Phiri already has a class during Period 2." | "Oops! Something went wrong." |
| Delete confirm | "This will permanently remove the record. This action cannot be undone." | "Are you sure? This might break things!" |
| Loading | "Loading student records…" | "Hang tight, crunching numbers! 🚀" |

**Voice Rules:**
- ✅ Errors must explain: what happened, why it happened (if known), how to fix it
- ❌ Never use dead-end errors ("Something went wrong. Try again.")
- ❌ No emojis in system feedback messages
- ❌ No startup slang or excessive exclamation marks

### 7.15 Accessibility Checklist (Required Before Ship)

- [ ] All text passes WCAG AA contrast (4.5:1 for normal, 3:1 for large)
- [ ] Primary text passes WCAG AAA (7:1)
- [ ] Focus rings visible on all interactive elements
- [ ] All icon-only buttons have `aria-label`
- [ ] Form inputs paired to labels via `htmlFor`/`id`
- [ ] Error messages linked via `aria-describedby`
- [ ] Modals trap focus and restore on close
- [ ] All interactive elements keyboard-reachable via `Tab`
- [ ] Sidebar has `role="navigation"`, main content has `role="main"`

---

## 8. Multi-Tenancy Rules

### 8.1 School Isolation Is Absolute
A query run in the context of School A must never return a document belonging to School B. This is enforced at three layers:
1. Convex `withSchoolScope()` — every function passes `schoolId` from the authenticated user's identity
2. Index queries — every query uses `.withIndex('by_school', ...)`, not `.filter()`
3. PR review — no function that touches school data skips the scope check

### 8.2 School Context Flow
- **Convex functions**: school is derived from `ctx.auth.getUserIdentity()` → look up user by `tokenIdentifier` → `user.schoolId` — never from a client-supplied argument
- **Supabase middleware**: `src/middleware.ts` calls `supabase.auth.getUser()` to refresh the session, then extracts the school slug from the subdomain and injects it as the `x-school-slug` header
- **Server Components**: read school via `x-school-slug` header + server-side Supabase `getUser()`
- **Client Components**: school is read from `useSchool()` (powered by `SchoolProvider`)

### 8.3 Subdomain Pattern
- Production: `{schoolSlug}.acadowl.zm`
- Development: `{schoolSlug}.localhost:3000`
- Fallback: `?school={schoolSlug}` query parameter

### 8.4 Platform Admin Bypass
Only `platform_admin` role users bypass school scoping. Use `requirePlatformAdmin(ctx)` for these functions. Platform admin routes live under `/(platform)/` and `platform.acadowl.zm`.

### 8.5 Cross-School Guardians
A guardian with children in multiple schools has one phone number / auth account but multiple `guardian` profile documents — one per school. The `getMe` query returns `guardianProfiles[]` (array). The parent portal child switcher groups children by school.

---

## 9. Feature Flag Rules

### 9.1 The Feature Enum Lives in `src/lib/features/flags.ts`
It is imported by both `src/` (client) and `convex/` (server). Never duplicate it.

### 9.2 Feature Gate Pattern

**In UI components:**
```tsx
<FeatureGuard feature={Feature.BOARDING}>
  <BoardingNavItem />
</FeatureGuard>

<FeatureGuard feature={Feature.TRANSPORT} fallback={<UpgradeBanner />}>
  <TransportDashboard />
</FeatureGuard>
```

**In Convex functions:**
```typescript
await requireFeature(ctx, school, Feature.BOARDING);
```

**In route layouts:**
Use `FeatureGuardServer` (server-side version) to prevent rendering entire routes when the feature is off.

### 9.3 All Nav Items Are Feature-Gated
The nav config object for each portal (`adminNavConfig.ts`, etc.) specifies `requiredFeature` on every optional module item. The sidebar renders by iterating the config — never by hardcoding nav items in the component.

### 9.4 Feature Defaults by School Type

| Feature | Day School | Boarding School | College |
|---|---|---|---|
| STUDENTS, STAFF, ATTENDANCE, FEES | ✅ | ✅ | ✅ |
| ZRA_INVOICING, GUARDIAN_PORTAL, SMS | ✅ | ✅ | ✅ |
| ECZ_EXAMS | ✅ | ✅ | ❌ |
| BOARDING | ❌ | ✅ | ❌ |
| TRANSPORT | ❌ | Optional | ❌ |
| LMS, LIBRARY | Optional | Optional | ✅ |
| SEMESTER_SYSTEM, GPA, HEA_COMPLIANCE | ❌ | ❌ | ✅ |
| AI_INSIGHTS | Premium | Premium | Premium |

---

## 10. Role-Based Access Control Rules

### 10.1 The Permission Matrix Lives in `src/lib/roles/matrix.ts`
Never scatter `if (user.role === 'teacher')` checks in component logic. Always use:

```typescript
// Client — checking if current user can perform an action
const canEnrol = usePermission(Permission.ENROL_STUDENT);

// Client — conditional rendering
<PermissionGuard permission={Permission.CREATE_INVOICE}>
  <NewInvoiceButton />
</PermissionGuard>

// Server (Convex) — mutation guard
const { user } = await requirePermission(ctx, Permission.ENTER_MARKS);
```

### 10.2 UI Must Reflect Permissions
A user should never see a button they cannot click because of their role. Use `<PermissionGuard>` to conditionally render UI. Do not render the button and disable it due to role — hide it entirely.

Exception: read-only views of items the user cannot edit may show disabled edit buttons with a tooltip explaining why.

### 10.3 Backend Always Enforces Independently
Frontend permission guards are UX convenience, not security. Every Convex mutation that requires a permission **must** call `requirePermission(ctx, Permission.X)` server-side regardless of frontend guards.

### 10.4 Role-to-Dashboard Routing

| Role | Default Route |
|---|---|
| `platform_admin` | `/(platform)/schools` |
| `school_admin`, `deputy_head` | `/(admin)/dashboard` |
| `bursar` | `/(admin)/fees` |
| `teacher`, `class_teacher` | `/(teacher)/dashboard` |
| `matron` | `/(admin)/boarding` |
| `librarian` | `/(admin)/library` |
| `driver` | `/(driver)/route` |
| `guardian` | `/(parent)/dashboard` |
| `student` | `/(student)/dashboard` |

---

## 11. TypeScript Rules

- Strict mode is always on (`"strict": true` in `tsconfig.json`)
- `@typescript-eslint/no-explicit-any` is set to `error` — never use `any`
- `@typescript-eslint/no-unused-vars` is set to `error`
- All exported functions, hooks, and components must have explicit return type annotations
- Use `Doc<'tableName'>` from Convex for typing database document objects
- Use `Id<'tableName'>` from Convex for typing document IDs
- Infer Zod types with `z.infer<typeof schema>` — never manually duplicate type definitions
- Never use type assertions (`as SomeType`) unless absolutely unavoidable — prefer type guards

---

## 12. Testing Rules

### 12.1 Test File Location
- Component tests: co-located with the component, e.g., `StudentTable.test.tsx`
- Hook tests: co-located, e.g., `useFeature.test.ts`
- Convex function tests: `convex/tests/moduleName.test.ts`
- Utility tests: co-located, e.g., `formatZMW.test.ts`

### 12.2 Test Runner
Vitest + `@testing-library/react` for all tests.

### 12.3 Required Tests for Every New Issue
- Utility functions: 100% coverage of all branches
- Convex guard functions (`requireRole`, `requireFeature`, `withSchoolScope`): tested with both valid and invalid inputs
- `FeatureGuard` and `PermissionGuard` components: render and non-render cases
- Any critical business logic (fee calculation, grading engine, GPA calculation): unit tested exhaustively

### 12.4 CI Requirements
The CI pipeline (`ci.yml`) runs on every PR:
- `npm run lint` — must pass with zero errors
- `npm run type-check` — must pass with zero errors
- `npm run test:ci` — must pass
- Minimum 60% coverage for `convex/` directory

### 12.5 Test Utilities
Use `src/tests/helpers/renderWithProviders()` for any component that needs `SchoolProvider`, `ConvexProvider`, or `ThemeProvider`.

---

## 13. Code Quality Rules

### 13.1 Commit Convention
All commits must follow: `type(scope): short description`
- Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`
- Example: `feat(attendance): add offline queue for mark submission`

### 13.2 Branch Naming
`feat/issue-XXX-short-description` or `fix/issue-XXX-short-description`

### 13.3 PR Requirements
- PR title matches commit convention
- All CI checks passing
- At least 1 approval before merge
- No self-merges
- PR description includes: what was built, how to test it, any schema changes

### 13.4 ESLint Rules of Note
```json
{
  "no-console": ["warn", { "allow": ["warn", "error"] }],
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unused-vars": "error",
  "import/order": ["error", { "groups": ["builtin", "external", "internal"] }]
}
```

### 13.5 JSDoc Requirements
All exported functions, hooks, and utilities in `convex/_lib/` and `src/lib/` **must** have a JSDoc comment describing: what it does, its parameters, and its return type.

### 13.6 Environment Variables
- Never commit `.env.local`
- Never hardcode API keys or secrets in source
- Every new environment variable must be added to `.env.example` with an empty value
- Variables are documented in `README.md` and the Sprint 00 env reference

---

## 14. Sprint Scope & Module Boundaries

Understand which sprint built what. Never implement Sprint 03 features inside Sprint 01 files.

| Sprint | Modules Built | Key Tables |
|---|---|---|
| **Sprint 00** | Infrastructure, Auth, Multi-tenancy, RBAC, Feature Flags, Base UI Shell | `schools`, `users`, `staff`, `guardians`, `students`, `academicYears`, `terms`, `grades`, `sections` + all skeleton tables |
| **Sprint 01** | Students, Attendance (offline-first), Timetable, Exams, Grading Engine, Report Cards, SMS | `attendance`, `subjects`, `timetableSlots`, `examSessions`, `examResults`, `notifications` |
| **Sprint 02** | Fees, ZRA Smart Invoice, Sibling Discounts, Mobile Money (Airtel/MTN), Credit Notes, Arrears | `feeStructures`, `invoices`, `payments`, `creditNotes`, `feeAuditLog`, `guardianLedger` |
| **Sprint 03** | Guardian Portal (mobile-first), Teacher-Parent Messaging, Announcements, WhatsApp | `messageThreads`, `messages`, `announcements`, `studentProgressSnapshots` |
| **Sprint 04** | Boarding, Bed Assignment, Night Prep, Visitor Log, Sick Bay, Pocket Money, Exeat | `hostelBlocks`, `rooms`, `beds`, `sickBayAdmissions`, `visitorLog`, `pocketMoneyAccounts`, `conductLog` |
| **Sprint 05** | LMS, Content Authoring, AI Quizzes, Assignments, Library, eLibrary | `lmsCourses`, `lmsModules`, `lmsLessons`, `lmsSubmissions`, `questionBank`, `libraryBooks`, `libraryIssues` |
| **Sprint 06** | Transport, GPS Tracking, Driver PWA, Live Parent Map, Route Management | `routes`, `vehicles`, `gpsPings`, `routeRunLog`, `transportBoardingEvents`, `transportIncidents` |
| **Sprint 07** | College Mode (GPA, HEA), AI At-Risk Engine, MoE Returns, Platform Analytics | `atRiskAssessments`, `interventionRecords`, `bursaryAllocations`, `academicTranscripts` |

### Module Boundary Rules
- Never build Sprint 04 (boarding) features inside Sprint 01 issues
- Never add Sprint 07 AI logic to Sprint 05 issues
- Each sprint's Convex functions live in their module folder (`convex/boarding/`, `convex/lms/`, etc.)
- Cross-module references (e.g., Sprint 04 calling Sprint 02's `generateInvoiceForStudent`) go through the other module's exported Convex functions — never by directly querying the other module's tables

---

## 15. AI Integration Rules

The following rules apply to all Anthropic Claude API usage (Sprint 05 onwards).

### 15.1 Approved Models
| Purpose | Model |
|---|---|
| At-risk student analysis (Sprint 07) | `claude-sonnet-4-20250514` |
| AI quiz generation (Sprint 05) | `claude-sonnet-4-20250514` |
| AI grading assistance (Sprint 07) | `claude-haiku-4-5-20251001` |
| AI tutoring assistant (Sprint 07) | `claude-haiku-4-5-20251001` |

### 15.2 All AI Calls Go Through Convex Actions
Never call the Claude API from the Next.js frontend directly. All Claude API calls are made from Convex actions in `convex/ai/`. This ensures:
- API keys are server-side only
- Every call is logged to `aiUsageLog` table
- Rate limiting and cost controls are enforced at the action level

### 15.3 Usage Logging
Every Claude API call **must** write a record to `aiUsageLog` including: school ID, function name, model used, input tokens, output tokens, timestamp, and cost estimate.

### 15.4 Feature Gate
All AI features are gated on `Feature.AI_INSIGHTS`. Check this flag before every AI function call.

### 15.5 At-Risk Engine Guardrails
- Risk scores are advisory, not deterministic — the UI must present them as "indicators to investigate," not conclusions
- Risk flags must be accompanied by human-readable explanations (generated by Claude)
- Schools must opt in to at-risk analysis — it is not enabled by default even with `Feature.AI_INSIGHTS`

---

## 16. Zambia-Specific Context

Every developer must understand the following before building Zambia-facing features.

### 16.1 Currency
- All monetary values stored in Zambian Kwacha (ZMW) as integers in ngwee (1 ZMW = 100 ngwee) — never as floats
- Display with `formatZMW()` utility: e.g., `ZMW 1,500.00`
- ZRA requires VAT calculation on all taxable school fees (currently 16%)

### 16.2 Phone Numbers
- All phone numbers normalised to `+260XXXXXXXXX` format before storage
- Zambian mobile prefixes: Airtel (097X, 077X), MTN (096X, 076X), Zamtel (095X)
- SMS is the primary communication channel — email is secondary/optional

### 16.3 Mobile Money
- Airtel Money API: REST, OAuth2 — primary for rural areas
- MTN MoMo API: REST — primary for urban areas
- Payment webhook handlers live at `src/app/api/webhooks/airtel-money/` and `mtn-momo/`
- Always normalise both providers' callbacks through `processPaymentWebhook` before writing to DB

### 16.4 ZRA Smart Invoice (VSDC)
- Every fee invoice must be submitted to ZRA's VSDC system before being marked as issued
- ZRA returns a fiscal code and QR code URL that goes on the printed invoice
- Gate this behind `Feature.ZRA_INVOICING` — some small/exempt schools may not require it
- ZRA integration is in Sprint 02

### 16.5 Academic Calendar
- Standard schools: 3 terms per year (`academicMode: 'term'`)
- Colleges: 2 semesters per year (`academicMode: 'semester'`)
- ECZ examinations happen at the end of Grade 9 (Junior Secondary) and Grade 12 (Senior Secondary)
- ECZ grading: 1 (best) to 9 (fail), not percentage-based

### 16.6 Ministry of Education Compliance
- Schools have an MoE Code (`moeCode` on the school record)
- MoE statistical returns are generated in Sprint 07 (Epic 11)
- Subjects must have `eczSubjectCode` set for MoE returns to work correctly

### 16.7 Offline Reliability
- Mobile data in rural Zambia is intermittent — do not assume connectivity
- Attendance module must work fully offline and sync when connectivity is restored
- GPS pings from drivers are stored locally first and synced in batches
- Parent portal reads are cached; never show a blank state because data is still loading

---

## 17. Definition of Done

An issue is **Done** only when all of the following are true:

- [ ] **Code complete** — all acceptance criteria checked off
- [ ] **Type-safe** — `npm run type-check` passes with zero TypeScript errors
- [ ] **Linted** — `npm run lint` passes with zero ESLint errors
- [ ] **Tested** — relevant tests written and passing; CI is green
- [ ] **Reviewed** — PR approved by at least one other developer; no self-merges
- [ ] **JSDoc'd** — all exported functions, hooks, and utilities have JSDoc comments
- [ ] **School-scoped** — if the issue touches Convex data, `withSchoolScope` is used
- [ ] **Feature-gated** — if the issue belongs to an optional module, the `Feature` check exists in both the Convex function and the UI component
- [ ] **Design compliant** — page background is `bg-parchment`, headings use `font-serif`, no hardcoded hex values, focus rings present, `active:scale-95` on all buttons
- [ ] **Mobile tested** — tested at 375px viewport width
- [ ] **Schema consistent** — if `convex/schema.ts` was changed, schema was pushed and validated against the live Convex dev deployment
- [ ] **Accessible** — icon-only buttons have `aria-label`, inputs are labelled, error messages use `aria-describedby`
- [ ] **Voice compliant** — system messages are clear, specific, and institution-grade (no slang, no dead-end errors)

---

*Acadowl Workspace Rules — v1.0*  
*Applies to all sprints: Sprint 00 through Sprint 07*  
*Update this document when new permanent architectural decisions are made. Consult the sprint docs for issue-level acceptance criteria.*
---


