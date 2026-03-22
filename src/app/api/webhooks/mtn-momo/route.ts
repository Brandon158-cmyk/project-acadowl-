import { NextRequest, NextResponse } from 'next/server';

// Validate MTN MoMo callback token
function validateCallbackToken(
  token: string | null,
  expectedToken: string,
): boolean {
  if (!token) return false;
  if (process.env.NODE_ENV === 'development') return true;
  return token === expectedToken;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const callbackToken = request.headers.get('x-callback-token');

    const expectedToken = process.env.MTN_CALLBACK_TOKEN ?? '';
    if (!validateCallbackToken(callbackToken, expectedToken)) {
      console.error('MTN MoMo webhook: Invalid callback token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const payload = JSON.parse(body);

    // Extract fields from MTN MoMo callback
    const transactionId =
      payload.financialTransactionId ?? payload.externalId ?? '';
    const amount = parseFloat(payload.amount ?? '0');
    const payerPhone = payload.payer?.partyId ?? '';
    const invoiceReference = payload.payerMessage ?? payload.payeeNote ?? '';
    const status = payload.status ?? '';
    const schoolId = request.nextUrl.searchParams.get('schoolId');

    if (!schoolId || !transactionId || amount <= 0) {
      console.error('MTN MoMo webhook: Missing required fields', {
        schoolId,
        transactionId,
        amount,
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Only process successful transactions
    if (status !== 'SUCCESSFUL') {
      console.warn('MTN MoMo webhook: Non-successful transaction', {
        transactionId,
        status,
      });
      return NextResponse.json({ status: 'acknowledged', transactionId });
    }

    // Log and acknowledge — Convex HTTP action integration in production
    console.warn('MTN MoMo webhook received:', {
      transactionId,
      amount,
      payerPhone,
      invoiceReference,
      schoolId,
    });

    return NextResponse.json({ status: 'received', transactionId });
  } catch (err) {
    console.error('MTN MoMo webhook error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
