import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Maps Supabase user_metadata.role → default redirect path
const ROLE_DASHBOARDS: Record<string, string> = {
  platform_admin: '/schools',
  school_admin: '/dashboard',
  deputy_head: '/dashboard',
  bursar: '/dashboard',
  teacher: '/my-classes',
  class_teacher: '/my-classes',
  matron: '/dashboard',
  librarian: '/dashboard',
  driver: '/route',
  guardian: '/home',
  student: '/portal',
};

const RESERVED_SUBDOMAINS = new Set(['www', 'platform', 'localhost', 'api']);

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  // 1. Create Supabase client and refresh session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => request.cookies.get(n)?.value,
        set: (n, v, o) => {
          response.cookies.set({ name: n, value: v, ...o });
        },
        remove: (n, o) => {
          response.cookies.set({ name: n, value: '', ...o });
        },
      },
    },
  );

  // 2. MUST call getUser() — this refreshes the access token cookie if expired
  const { data: { user } } = await supabase.auth.getUser();

  // 3. Extract school slug from subdomain (strip port for localhost:3000)
  const hostname = request.headers.get('host') ?? '';
  const hostWithoutPort = hostname.split(':')[0];
  const subdomain = hostWithoutPort.split('.')[0];
  if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
    response.headers.set('x-school-slug', subdomain);
  }

  const path = request.nextUrl.pathname;
  const isAuthRoute =
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/forgot-password') ||
    path === '/signup';

  // /reset-password is NOT an auth route — it must be accessible to
  // authenticated users (forced password reset + forgot-password recovery).
  // Unauthenticated users hitting it will be redirected to /login by rule 4.

  // 4. Enforce auth — redirect unauthenticated users to login
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 5. Redirect authenticated users away from auth routes
  if (user && isAuthRoute) {
    const role = user.user_metadata?.role as string | undefined;
    const dest = role ? (ROLE_DASHBOARDS[role] ?? '/dashboard') : '/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
