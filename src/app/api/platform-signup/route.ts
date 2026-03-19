import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, inviteKey } = await request.json();

    // 1. Validate invite key server-side
    const validKey = process.env.PLATFORM_ADMIN_INVITE_KEY;
    if (!validKey || inviteKey !== validKey) {
      return NextResponse.json(
        { error: 'Invalid invite key' },
        { status: 403 },
      );
    }

    // 2. Validate inputs
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    // 3. Create user via Supabase Admin API (service role key)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error. Contact the administrator.' },
        { status: 500 },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'platform_admin', name },
      });

    if (createError || !userData.user) {
      return NextResponse.json(
        { error: createError?.message ?? 'Failed to create user in auth system' },
        { status: 400 },
      );
    }

    // 4. Return user data so the client can create the Convex record
    return NextResponse.json({
      user: {
        id: userData.user.id,
        email: userData.user.email,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
