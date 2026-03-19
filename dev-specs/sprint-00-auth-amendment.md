# Sprint 00 — Auth Amendment: Supabase Auth replaces @convex-dev/auth

> **Status:** This document supersedes all auth-related sections in `sprint-00-infrastructure-auth.md`.  
> All other Sprint 00 content (schema, multi-tenancy, feature flags, UI shell, RBAC, onboarding) remains unchanged.  
> Read this alongside the original Sprint 00 doc. Where there is a conflict, **this document wins**.

---

## What Changed and Why

The original Sprint 00 spec used `@convex-dev/auth` to handle authentication inside Convex itself. We are replacing this with **Supabase Auth** as the dedicated authentication layer, while Convex remains the sole database and backend logic layer.

**Why Supabase Auth:**
- Battle-tested auth management UI — easier to manage users, reset passwords, audit sessions
- Built-in phone OTP with Zambian operator support (Airtel/MTN via Twilio/Africa's Talking)
- Better SSR support for Next.js via `@supabase/ssr`
- Separates concerns cleanly: auth is Supabase's job, data is Convex's job
- Dashboard visibility into sessions, users, and auth events without building it

**What does NOT change:**
- Convex is still the only database — Supabase Postgres is never used
- The `users` table in Convex still exists and stores role, schoolId, profile links
- `withSchoolScope`, `requirePermission`, `requireRole` in `convex/_lib/` — all unchanged
- The `tokenIdentifier` field on `users` — still used, now stores the Supabase `sub` UUID
- All schema tables from Sprint 00 — unchanged

---

## Dependency Changes

### Remove
```json
"@convex-dev/auth": "latest"
```

### Add
```json
"@supabase/supabase-js": "latest",
"@supabase/ssr": "latest"
```

### Remove from `convex/` directory
- `convex/auth.ts` — no longer needed
- Any `convex/http.ts` routes that were specifically for auth callbacks

### Add to `convex/` directory
- `convex/auth.config.ts` — minimal config pointing Convex at Supabase JWKS (see below)

### Add to `src/` directory
- `src/lib/supabase/client.ts` — browser Supabase client singleton
- `src/lib/supabase/server.ts` — server Supabase client factory (per-request)
- `src/providers/ConvexWithSupabaseProvider.tsx` — wires Supabase JWT into Convex

---

## Updated Issues

---

### ISSUE-001 · Initialize Next.js + Convex Monorepo *(partially changed)*

**Change:** Remove `@convex-dev/auth` from the dependency list. Add Supabase packages.

#### Updated Dependencies
```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "convex": "latest",
    "convex-helpers": "latest",
    "@supabase/supabase-js": "latest",
    "@supabase/ssr": "latest"
  }
}
```

All other ISSUE-001 acceptance criteria remain identical.

---

### ISSUE-002 · Install and Configure UI Component Library *(partially changed)*

**Change:** Remove the `@convex-dev/auth/react` import note. The CSS variables and shadcn setup remain identical.

**New Note:** The `ConvexAuthProvider` wrapper referenced in the original spec is replaced by `ConvexWithSupabaseProvider`. Update the root layout to use this provider instead.

---

### ISSUE-011 · Configure Authentication — Supabase *(full rewrite)*

**Replaces:** Original ISSUE-011 "Configure Supabase Auth with Multiple Providers"

**Type:** Backend + DevOps | **Priority:** P0 | **Estimate:** 1 day

#### Description

Configure Supabase Auth as the authentication layer and wire it to Convex via JWT verification. This replaces `@convex-dev/auth` entirely.

#### User Story

> As a developer, after completing this issue, any user who authenticates via Supabase will have their identity automatically trusted by every Convex function — with zero manual token passing.

#### Acceptance Criteria

**Supabase Project Setup**
- [ ] Supabase project created at [supabase.com](https://supabase.com) — **use the free tier for development**
- [ ] In Supabase Dashboard → Authentication → Providers:
  - **Email** enabled (for staff: admin, teachers, bursar, etc.)
  - **Phone** enabled (for guardians/parents — OTP via SMS)
- [ ] In Supabase Dashboard → Authentication → SMS Provider:
  - Configure **Twilio** or **Africa's Talking** as the SMS provider for Zambian numbers
  - Development: enable "Enable phone confirmations" but allow console OTP logging for local dev
- [ ] In Supabase Dashboard → Authentication → Settings:
  - Site URL: `http://localhost:3000` (dev) / `https://acadowl.zm` (prod)
  - Redirect URLs: add `http://localhost:3000/**` for dev
  - JWT expiry: set to `3600` (1 hour) — sessions refresh via middleware
  - Disable email confirmations for staff accounts (admin creates accounts directly)

**Convex JWT Configuration**
- [ ] `convex/auth.config.ts` created:
  ```typescript
  export default {
    providers: [
      {
        // Supabase JWKS endpoint — Convex fetches public keys from here to verify JWTs
        domain: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        applicationID: 'convex',
      },
    ],
  };
  ```
- [ ] `npx convex dev` runs successfully with this config — no warnings about auth
- [ ] Verify in Convex dashboard: the auth config shows the Supabase issuer correctly

**Supabase Client Files**
- [ ] `src/lib/supabase/client.ts` — browser client:
  ```typescript
  import { createBrowserClient } from '@supabase/ssr';
  
  export function createSupabaseBrowserClient() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  ```
- [ ] `src/lib/supabase/server.ts` — server client (call once per request, do not cache):
  ```typescript
  import { createServerClient } from '@supabase/ssr';
  import { cookies } from 'next/headers';
  
  export function createSupabaseServerClient() {
    const cookieStore = cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
        },
      },
    );
  }
  ```

**ConvexWithSupabaseProvider**
- [ ] `src/providers/ConvexWithSupabaseProvider.tsx` created with the exact pattern specified in `RULES.md §6.1`
- [ ] Provider added to `src/app/layout.tsx` as the outermost wrapper, replacing any `ConvexAuthProvider`
- [ ] `useConvexAuth()` returns `isAuthenticated: true` after a successful Supabase login — verified manually

**Phone Number Normalisation**
- [ ] `src/lib/utils/normalizePhone.ts` utility created:
  ```typescript
  // Normalises any Zambian phone format to E.164 (+260XXXXXXXXX)
  export function normalizeZambianPhone(input: string): string {
    const digits = input.replace(/\D/g, '');
    if (digits.startsWith('260')) return '+' + digits;
    if (digits.startsWith('0')) return '+260' + digits.slice(1);
    if (digits.length === 9) return '+260' + digits;
    throw new Error('Invalid Zambian phone number: ' + input);
  }
  ```
- [ ] OTP phone input runs all numbers through `normalizeZambianPhone` before calling Supabase

**Development Mode**
- [ ] In development: Supabase console shows OTP codes in the dashboard → Authentication → Logs. Document this in `README.md`.
- [ ] A yellow dev banner component (`<DevOtpBanner />`) created for the OTP verify page — fetches the most recent OTP from logs during local dev only (via Supabase admin API). **Never shown in production** — gated on `process.env.NODE_ENV === 'development'`.

#### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Server-only — for admin operations (never in client)
```

---

### ISSUE-012 · Build Login Page — Email/Password *(updated)*

**Change:** Replace `useAuthActions()` from `@convex-dev/auth/react` with the Supabase browser client.

#### Updated Implementation Pattern

```typescript
'use client';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const form = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      form.setError('root', { message: 'Incorrect email or password.' });
      return;
    }
    // Role-based redirect is handled by middleware — just push to dashboard
    router.push('/dashboard');
    router.refresh(); // Forces middleware to re-evaluate the new session
  };
  // ... form JSX
}
```

All other ISSUE-012 acceptance criteria (school branding, mobile responsive, accessibility) remain unchanged.

#### Post-Login: Resolve Convex Profile
After successful Supabase login, call the Convex `resolveUserProfile` mutation to link the Supabase identity to the Convex `users` document. This should be triggered automatically by the `ConvexWithSupabaseProvider` watching for auth state changes, or explicitly called in the login success handler:

```typescript
const resolveProfile = useMutation(api.users.mutations.resolveUserProfile);

// After successful Supabase login:
await resolveProfile(); // Convex reads ctx.auth.getUserIdentity() internally
```

---

### ISSUE-013 · Build Login Page — Phone OTP *(updated)*

**Change:** Replace custom OTP implementation with Supabase's built-in phone OTP.

#### Updated Step 1 — Send OTP

```typescript
const supabase = createSupabaseBrowserClient();

const sendOtp = async (phoneRaw: string) => {
  const phone = normalizeZambianPhone(phoneRaw); // +260971234567
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) {
    // Show error — most likely "phone not found" or rate limit
    setError(error.message);
    return;
  }
  // Navigate to verify page, pass phone in sessionStorage (not URL — privacy)
  sessionStorage.setItem('otp_phone', phone);
  router.push('/login-otp/verify');
};
```

#### Updated Step 2 — Verify OTP

```typescript
const verifyOtp = async (token: string) => {
  const phone = sessionStorage.getItem('otp_phone');
  if (!phone) { router.push('/login-otp'); return; }

  const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) {
    setError('Invalid or expired code. Please try again.');
    return;
  }
  // Supabase sets the session cookie automatically
  // Resolve Convex profile then redirect
  await resolveProfile();
  router.push('/dashboard');
  router.refresh();
};
```

#### Resend OTP

```typescript
// Resend uses the same signInWithOtp call
const resendOtp = async () => {
  const phone = sessionStorage.getItem('otp_phone');
  await supabase.auth.signInWithOtp({ phone });
};
```

**Supabase handles rate limiting** (max OTP attempts) automatically. The UI still shows a 60-second resend countdown.

All other ISSUE-013 acceptance criteria remain unchanged.

---

### ISSUE-014 · Auth Layout and Route Protection Middleware *(updated)*

**Change:** Route protection middleware uses Supabase SSR session, not `@convex-dev/auth`.

#### Updated `src/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const ROLE_DASHBOARDS: Record<string, string> = {
  platform_admin: '/platform/schools',
  school_admin: '/dashboard',
  deputy_head: '/dashboard',
  bursar: '/fees',
  teacher: '/teacher/dashboard',
  class_teacher: '/teacher/dashboard',
  matron: '/boarding',
  librarian: '/library',
  driver: '/driver/route',
  guardian: '/parent/dashboard',
  student: '/student/dashboard',
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // 1. Create Supabase client and refresh session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => request.cookies.get(n)?.value,
        set: (n, v, o) => { response.cookies.set({ name: n, value: v, ...o }); },
        remove: (n, o) => { response.cookies.set({ name: n, value: '', ...o }); },
      },
    },
  );

  // 2. MUST call getUser() — this refreshes the access token cookie if expired
  const { data: { user } } = await supabase.auth.getUser();

  // 3. Extract school slug from subdomain
  const hostname = request.headers.get('host') ?? '';
  const slug = hostname.split('.')[0];
  if (slug && slug !== 'www' && slug !== 'platform') {
    response.headers.set('x-school-slug', slug);
  }

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register');

  // 4. Enforce auth
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (user && isAuthRoute) {
    // Redirect to role dashboard — role is stored in Supabase user_metadata
    const role = user.user_metadata?.role as string | undefined;
    const dest = role ? (ROLE_DASHBOARDS[role] ?? '/dashboard') : '/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)'],
};
```

**Note on role in Supabase metadata:** When a user account is created (ISSUE-030), set their role in Supabase `user_metadata` via the Admin API (`SUPABASE_SERVICE_ROLE_KEY`) so middleware can redirect correctly without a Convex round-trip:

```typescript
// In the Convex action that creates a user account
await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${supabaseUserId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_metadata: { role, schoolSlug },
  }),
});
```

All other ISSUE-014 criteria (auth layout, loading states, post-login deep-link restoration) remain unchanged.

---

### ISSUE-015 · Implement Role Resolution and Profile Linking *(updated)*

**Change:** `resolveUserProfile` Convex mutation now reads from `ctx.auth.getUserIdentity()` which returns the Supabase JWT claims (not `@convex-dev/auth` identity).

#### How `getUserIdentity()` Works with Supabase

Supabase JWTs contain these standard claims readable in Convex:
```typescript
const identity = await ctx.auth.getUserIdentity();
// identity.subject     = Supabase user UUID ("sub" claim)
// identity.email       = user's email (if set)
// identity.phoneNumber = user's phone (if phone auth — custom claim)
// identity.tokenIdentifier = "https://<project>.supabase.co|<sub>"
```

The `tokenIdentifier` format from Convex is `{issuer}|{sub}`. Store this on the `users` table.

#### Updated `resolveUserProfile` Mutation

```typescript
export const resolveUserProfile = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError('UNAUTHENTICATED');

    // Find or create user document
    let user = await ctx.db
      .query('users')
      .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!user) {
      // First login — create user record
      const userId = await ctx.db.insert('users', {
        tokenIdentifier: identity.tokenIdentifier,
        email: identity.email,
        phone: identity.phoneNumber,   // Supabase phone claim
        name: identity.name ?? identity.email ?? 'User',
        role: 'guardian',              // Safe default — admin will assign correct role
        schoolId: undefined,           // To be set during auto-link below
        isActive: true,
        notifPrefs: { sms: true, whatsapp: false, email: false, inApp: true },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFirstLogin: true,
        lastLoginAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    } else {
      // Existing user — update last login
      await ctx.db.patch(user._id, { lastLoginAt: Date.now(), updatedAt: Date.now() });
    }

    // Auto-link to staff/guardian/student profile by phone or email
    if (!user!.staffId && !user!.guardianId && !user!.studentId) {
      await autoLinkProfile(ctx, user!);
    }

    return user;
  },
});
```

All other ISSUE-015 acceptance criteria remain unchanged.

---

### ISSUE-016 · Forgot Password / Reset Flow *(updated)*

**Change:** Replace custom reset code logic with Supabase's built-in password reset, but keep the SMS delivery preference.

Supabase supports custom email templates and can trigger webhooks on auth events. For the Zambian SMS preference:

1. Use Supabase's **"Send password reset"** admin API triggered from a Convex action — this sends to the user's email as a fallback.
2. The primary reset flow remains SMS-based: a Convex action generates a 6-digit code, stores a hashed copy with expiry on the `users` document, and sends it via the Zambian SMS dispatch layer. On verify, the action calls Supabase Admin API to reset the password.

```typescript
// Convex action: initiatePasswordReset
export const initiatePasswordReset = action({
  args: { email: v.string(), schoolSlug: v.string() },
  handler: async (ctx, args) => {
    // 1. Find user by email in school
    // 2. Generate 6-digit code
    // 3. Store hashed code + expiry on user doc
    // 4. Send SMS to user's registered phone via sendSms action
    // 5. Do NOT call Supabase email reset — SMS is primary
  },
});

// Convex action: confirmPasswordReset
export const confirmPasswordReset = action({
  args: { email: v.string(), code: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    // 1. Verify code against stored hash + check expiry
    // 2. Call Supabase Admin API to update password:
    //    PUT /auth/v1/admin/users/{userId} { "password": newPassword }
    // 3. Clear the reset code from user doc
    // 4. Return success — client signs in normally
  },
});
```

All other ISSUE-016 acceptance criteria remain unchanged.

---

### ISSUE-017 · Platform Admin — School Creation *(partially updated)*

**Change:** When creating the first admin user for a new school, the Convex action calls the **Supabase Admin API** (using `SUPABASE_SERVICE_ROLE_KEY`) to create the Supabase auth account — then creates the Convex `users` document with the returned Supabase UUID as `tokenIdentifier`.

```typescript
// Pattern for creating a user account (used in ISSUE-030 User Management too)
export const createUserAccount = action({
  args: { email: v.string(), phone: v.string(), role: v.string(), schoolSlug: v.string() },
  handler: async (ctx, args) => {
    // 1. Call Supabase Admin API to create auth user
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: args.email,
        phone: args.phone,
        password: generateTemporaryPin(),   // 6-digit temp PIN
        user_metadata: { role: args.role, schoolSlug: args.schoolSlug },
        email_confirm: true,                // Skip email confirmation
      }),
    });
    const supabaseUser = await res.json();

    // 2. Create Convex user document linked to this Supabase user
    await ctx.runMutation(api.users.mutations.createUserFromAdmin, {
      tokenIdentifier: `${process.env.NEXT_PUBLIC_SUPABASE_URL}|${supabaseUser.id}`,
      supabaseId: supabaseUser.id,
      email: args.email,
      phone: args.phone,
      role: args.role,
      // ... other fields
    });

    // 3. SMS the temporary PIN to the user's phone
    await ctx.runAction(api.sms.actions.sendSms, {
      to: args.phone,
      body: `Welcome to Acadowl. Your temporary PIN is: ${pin}. Login at your school's portal.`,
    });
  },
});
```

---

### ISSUE-030 · User Management Page *(partially updated)*

**Change:** Creating/deactivating users goes through Supabase Admin API in addition to Convex.

- **Create user**: Call `createUserAccount` action (above) — creates in Supabase + Convex atomically.
- **Deactivate user**: Call Supabase Admin API `PUT /auth/v1/admin/users/{id}` with `{ "ban_duration": "876000h" }` to ban the session, then set `user.isActive = false` in Convex.
- **Reactivate user**: Call Supabase Admin API with `{ "ban_duration": "none" }`, then set `user.isActive = true` in Convex.
- **Role change**: Update `user_metadata.role` via Supabase Admin API AND update `user.role` in Convex. Both must stay in sync.

---

## Updated Convex Schema Notes

The `users` table in `convex/schema.ts` changes slightly:

```typescript
users: defineTable({
  // Supabase Auth fields
  tokenIdentifier: v.string(),  // Format: "{SUPABASE_URL}|{supabase_user_uuid}"
  supabaseId: v.optional(v.string()),  // Raw Supabase UUID — for Admin API calls

  // ... all other fields remain identical to Sprint 00 ISSUE-006 spec
  isFirstLogin: v.boolean(),    // ADD THIS — used for first-login UX flow
})
  .index('by_token', ['tokenIdentifier'])
  .index('by_supabase_id', ['supabaseId'])  // ADD THIS INDEX
  // ... all other indexes remain identical
```

---

## Updated Environment Variables

Remove from Sprint 00 env reference and `.env.example`:
```bash
# REMOVE THESE
CONVEX_AUTH_PRIVATE_KEY=
JWKS=
AUTH_RESEND_KEY=
```

Add to Sprint 00 env reference and `.env.example`:
```bash
# ── SUPABASE AUTH ──
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...            # Safe to expose — anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ...                 # SERVER ONLY — never in client, never in git
```

The `SUPABASE_SERVICE_ROLE_KEY` is used only in Convex Actions (server-side) for admin operations: creating users, banning sessions, updating user metadata. It is never referenced in any `src/` client code.

---

## Updated Sprint 00 → Sprint 01 Handoff Checklist Addition

Add these items to the existing Sprint 00 handoff checklist:

- [ ] Supabase project created and SMS provider (Twilio/Africa's Talking) configured with Zambian number support
- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` documented in `.env.example`
- [ ] `ConvexWithSupabaseProvider` wired in root layout — `useConvexAuth()` returns `isAuthenticated: true` after Supabase login
- [ ] Phone OTP login works end-to-end for a guardian account
- [ ] Email/password login works end-to-end for a staff account
- [ ] `resolveUserProfile` mutation correctly creates and links a Convex `users` document on first login
- [ ] Middleware correctly redirects unauthenticated users and refreshes Supabase session cookies
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never referenced in any file inside `src/` — only in `convex/` actions

---

*Sprint 00 Auth Amendment — v1.0*  
*Supersedes auth sections in `sprint-00-infrastructure-auth.md`*
