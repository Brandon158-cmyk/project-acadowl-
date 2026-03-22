import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Validate Airtel Money HMAC signature
function validateHmac(
  body: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;

  // In production, use crypto.subtle for HMAC-SHA256 verification
  // For now, accept all signatures in development
  if (process.env.NODE_ENV === 'development') return true;

  // TODO: Implement proper HMAC-SHA256 validation
  // const encoder = new TextEncoder();
  // const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  // return await crypto.subtle.verify('HMAC', key, hexToBuffer(signature), encoder.encode(body));

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-airtel-signature');

    // Validate HMAC
    const hmacSecret = process.env.AIRTEL_WEBHOOK_SECRET ?? '';
    if (!validateHmac(body, signature, hmacSecret)) {
      console.error('Airtel Money webhook: Invalid HMAC signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);

    // Extract fields from Airtel Money C2B callback
    const transactionId = payload.transaction?.id ?? payload.transactionId;
    const amount = parseFloat(payload.transaction?.amount ?? payload.amount ?? '0');
    const payerPhone = payload.transaction?.airtel_money_id ?? payload.msisdn ?? '';
    const invoiceReference = payload.transaction?.message ?? payload.reference ?? '';
    const schoolId = request.nextUrl.searchParams.get('schoolId');

    if (!schoolId || !transactionId || amount <= 0) {
      console.error('Airtel Money webhook: Missing required fields', {
        schoolId,
        transactionId,
        amount,
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Call Convex internal mutation via HTTP action
    // Note: In production, this would use a Convex HTTP action endpoint
    // For now, we log and acknowledge
    console.warn('Airtel Money webhook received:', {
      transactionId,
      amount,
      payerPhone,
      invoiceReference,
      schoolId,
    });

    // Return 200 immediately to acknowledge receipt (Airtel requires quick response)
    return NextResponse.json({ status: 'received', transactionId });
  } catch (err) {
    console.error('Airtel Money webhook error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
