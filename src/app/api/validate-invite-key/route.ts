import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { inviteKey } = await request.json();

    const validKey = process.env.PLATFORM_ADMIN_INVITE_KEY;

    if (!validKey) {
      return NextResponse.json(
        { error: 'Server configuration error. Contact the administrator.' },
        { status: 500 },
      );
    }

    if (inviteKey !== validKey) {
      return NextResponse.json(
        { valid: false, error: 'Invalid invite key' },
        { status: 403 },
      );
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
