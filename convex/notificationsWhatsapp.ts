import { v } from 'convex/values';
import { action, internalAction } from './_generated/server';
import type { Id } from './_generated/dataModel';

type WhatsAppSendResult = {
  ok: boolean;
  providerMessageId?: string;
  response: string;
};

async function sendViaWhatsAppApi(args: {
  to: string;
  body: string;
  phoneNumberId?: string;
  accessToken?: string;
}): Promise<WhatsAppSendResult> {
  if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
    console.warn(`[WHATSAPP] ${args.to} :: ${args.body}`);
    return {
      ok: true,
      providerMessageId: `dev-whatsapp-${Date.now()}`,
      response: 'Development mock send success.',
    };
  }

  if (!args.phoneNumberId || !args.accessToken) {
    return {
      ok: false,
      response: 'WhatsApp credentials are missing.',
    };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${args.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: args.to,
        type: 'text',
        text: { body: args.body },
      }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        response: responseText || 'WhatsApp API request failed.',
      };
    }

    return {
      ok: true,
      providerMessageId: `wa-${Date.now()}`,
      response: responseText || 'WhatsApp API accepted message.',
    };
  } catch (error) {
    return {
      ok: false,
      response: error instanceof Error ? error.message : 'WhatsApp API request failed.',
    };
  }
}

export const sendWhatsAppMessage = internalAction({
  args: {
    schoolId: v.id('schools'),
    to: v.string(),
    templateName: v.string(),
    body: v.string(),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    triggeredByUserId: v.optional(v.id('users')),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    reason?: string;
    provider?: 'whatsapp';
    fallback?: 'sms';
    notificationId?: string;
  }> => {
    const { internal } = await import('./_generated/api');

    const school = await ctx.runQuery(internal.analytics.getSchoolByIdInternal, {
      schoolId: args.schoolId,
    });

    if (!school) {
      return { success: false, reason: 'school_not_found' };
    }

    const notificationId = await ctx.runMutation(internal.notifications.createNotification, {
      schoolId: args.schoolId,
      recipientUserId: args.triggeredByUserId,
      recipientPhone: args.to,
      type: 'general',
      channel: 'whatsapp',
      subject: args.templateName,
      body: args.body,
      relatedEntityType: args.relatedEntityType,
      relatedEntityId: args.relatedEntityId,
      status: 'queued',
      provider: 'whatsapp',
    });

    const result = await sendViaWhatsAppApi({
      to: args.to,
      body: args.body,
      phoneNumberId: school.whatsappConfig?.phoneNumberId,
      accessToken: school.whatsappConfig?.accessToken,
    });

    if (result.ok) {
      await ctx.runMutation(internal.notifications.updateDeliveryStatus, {
        notificationId,
        status: 'sent',
        provider: 'whatsapp',
        providerMessageId: result.providerMessageId,
        providerResponse: result.response,
      });

      return {
        success: true,
        provider: 'whatsapp',
        notificationId,
      };
    }

    await ctx.runMutation(internal.notifications.updateDeliveryStatus, {
      notificationId,
      status: 'failed',
      provider: 'whatsapp',
      providerResponse: result.response,
      retryCountDelta: 1,
    });

    const fallbackNotificationId = await ctx.runMutation(internal.notifications.createNotification, {
      schoolId: args.schoolId,
      recipientPhone: args.to,
      type: 'general',
      channel: 'sms',
      subject: args.templateName,
      body: args.body,
      relatedEntityType: args.relatedEntityType,
      relatedEntityId: args.relatedEntityId,
      status: 'queued',
    });

    await ctx.scheduler.runAfter(0, internal.notificationsSms.sendSms, {
      to: args.to,
      body: args.body,
      schoolId: args.schoolId,
      notificationId: fallbackNotificationId,
    });

    return {
      success: false,
      provider: 'whatsapp',
      fallback: 'sms',
      notificationId,
    };
  },
});

export const processWhatsAppWebhookCallback = action({
  args: {
    schoolId: v.id('schools'),
    providerMessageId: v.optional(v.string()),
    status: v.union(v.literal('sent'), v.literal('delivered'), v.literal('read'), v.literal('failed')),
    rawPayload: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: true; updated: number }> => {
    const { internal } = await import('./_generated/api');

    if (!args.providerMessageId) {
      return { success: true, updated: 0 };
    }

    const notifications: Array<{
      _id: Id<'notifications'>;
      provider?: 'airtel' | 'mtn' | 'whatsapp';
    }> = await ctx.runQuery(internal.notifications.getByProviderMessageId, {
      schoolId: args.schoolId,
      providerMessageId: args.providerMessageId,
    });

    const matches = notifications.filter((item) => item.provider === 'whatsapp');

    const normalizedStatus: 'sent' | 'delivered' | 'failed' = args.status === 'read'
      ? 'delivered'
      : args.status;

    for (const item of matches) {
      await ctx.runMutation(internal.notifications.updateDeliveryStatus, {
        notificationId: item._id,
        status: normalizedStatus,
        provider: 'whatsapp',
        providerMessageId: args.providerMessageId,
        providerResponse: args.rawPayload,
      });
    }

    return { success: true, updated: matches.length };
  },
});

export const processWhatsAppWebhook = internalAction({
  args: {
    schoolId: v.id('schools'),
    providerMessageId: v.optional(v.string()),
    status: v.union(v.literal('sent'), v.literal('delivered'), v.literal('read'), v.literal('failed')),
    rawPayload: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: true; updated: number }> => {
    const { internal } = await import('./_generated/api');

    if (!args.providerMessageId) {
      return { success: true, updated: 0 };
    }

    const notifications: Array<{
      _id: Id<'notifications'>;
      provider?: 'airtel' | 'mtn' | 'whatsapp';
    }> = await ctx.runQuery(internal.notifications.getByProviderMessageId, {
      schoolId: args.schoolId,
      providerMessageId: args.providerMessageId,
    });

    const matches = notifications.filter((item) => item.provider === 'whatsapp');

    const normalizedStatus: 'sent' | 'delivered' | 'failed' = args.status === 'read'
      ? 'delivered'
      : args.status;

    for (const item of matches) {
      await ctx.runMutation(internal.notifications.updateDeliveryStatus, {
        notificationId: item._id,
        status: normalizedStatus,
        provider: 'whatsapp',
        providerMessageId: args.providerMessageId,
        providerResponse: args.rawPayload,
      });
    }

    return { success: true, updated: matches.length };
  },
});
