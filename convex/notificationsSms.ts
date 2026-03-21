import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { detectZambianSmsCarrier, normalizeZambianPhoneNumber } from '../src/lib/constants/zambia';

const RETRY_DELAY_MS = 5 * 60 * 1000;

function getProviderOrder(phoneNumber: string) {
  const carrier = detectZambianSmsCarrier(phoneNumber);

  if (carrier === 'airtel') {
    return ['airtel', 'mtn'] as const;
  }

  if (carrier === 'mtn') {
    return ['mtn', 'airtel'] as const;
  }

  return ['airtel', 'mtn'] as const;
}

async function attemptProviderSend(provider: 'airtel' | 'mtn', to: string, body: string) {
  if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
    console.warn(`[SMS:${provider}] ${to} :: ${body}`);
    return {
      ok: true,
      messageId: `dev-${provider}-${Date.now()}`,
      response: 'Development mode SMS send simulated.',
    };
  }

  const endpoint = provider === 'airtel'
    ? process.env.AIRTEL_SMS_API_URL
    : process.env.MTN_SMS_API_URL;

  if (!endpoint) {
    return {
      ok: false,
      response: `${provider.toUpperCase()} SMS endpoint is not configured.`,
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        body,
        provider,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return {
        ok: false,
        response: responseText || `${provider.toUpperCase()} SMS provider request failed.`,
      };
    }

    return {
      ok: true,
      messageId: `${provider}-${Date.now()}`,
      response: responseText || `${provider.toUpperCase()} SMS provider accepted the message.`,
    };
  } catch (error) {
    return {
      ok: false,
      response: error instanceof Error ? error.message : `${provider.toUpperCase()} SMS provider request failed.`,
    };
  }
}

export const sendSms = internalAction({
  args: {
    to: v.string(),
    body: v.string(),
    schoolId: v.id('schools'),
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    const normalizedPhone = normalizeZambianPhoneNumber(args.to);
    const providerOrder = getProviderOrder(normalizedPhone);

    for (const provider of providerOrder) {
      const result = await attemptProviderSend(provider, normalizedPhone, args.body);

      if (result.ok) {
        await ctx.runMutation(internal.notifications.updateDeliveryStatus, {
          notificationId: args.notificationId,
          status: 'sent',
          provider,
          providerMessageId: result.messageId,
          providerResponse: result.response,
          nextRetryAt: undefined,
        });

        return {
          success: true,
          provider,
          messageId: result.messageId,
        };
      }

      await ctx.runMutation(internal.notifications.updateDeliveryStatus, {
        notificationId: args.notificationId,
        status: 'failed',
        provider,
        providerResponse: result.response,
        retryCountDelta: 1,
        nextRetryAt: Date.now() + RETRY_DELAY_MS,
      });
    }

    return {
      success: false,
      provider: providerOrder[providerOrder.length - 1],
      messageId: '',
    };
  },
});
