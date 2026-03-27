import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function extractStatusPayload(payload: any) {
  const entry = payload?.entry?.[0];
  const changes = entry?.changes?.[0];
  const statuses = changes?.value?.statuses;
  const status = statuses?.[0];

  if (!status) {
    return null;
  }

  const rawStatus = String(status.status ?? '').toLowerCase();
  const normalizedStatus =
    rawStatus === 'sent' || rawStatus === 'delivered' || rawStatus === 'read' || rawStatus === 'failed'
      ? rawStatus
      : 'delivered';

  return {
    providerMessageId: status.id as string | undefined,
    status: normalizedStatus as 'sent' | 'delivered' | 'read' | 'failed',
  };
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token && expectedToken && token === expectedToken) {
    return new NextResponse(challenge ?? '', { status: 200 });
  }

  return NextResponse.json({ error: 'Webhook verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = extractStatusPayload(payload);
    const schoolId = request.nextUrl.searchParams.get('schoolId');

    if (!schoolId || !parsed) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const scopedSchoolId = schoolId as Id<'schools'>;

    await convex.action(api.notificationsWhatsapp.processWhatsAppWebhookCallback, {
      schoolId: scopedSchoolId,
      providerMessageId: parsed.providerMessageId,
      status: parsed.status,
      rawPayload: JSON.stringify(payload),
    });

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('WhatsApp webhook error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
