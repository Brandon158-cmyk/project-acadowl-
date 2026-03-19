import { NextResponse } from 'next/server';

// Webhook ingestion endpoint placeholder
// Airtel Money, MTN MoMo, and ZRA VSDC webhooks will be handled here
export async function POST() {
  return NextResponse.json(
    { error: 'Webhook handler not yet implemented' },
    { status: 501 },
  );
}
