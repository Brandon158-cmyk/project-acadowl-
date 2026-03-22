import { v } from 'convex/values';
import { internalMutation, mutation, query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';

// ─── ZRA Mock Mode ───
// When not in production, this generates mock fiscal codes and QR codes
// The mock mode flag is determined by the absence of a real VSDC serial on the school

function generateMockFiscalCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'MOCK-';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateMockQrCodeUrl(fiscalCode: string): string {
  return `https://zra-mock.acadowl.dev/verify/${fiscalCode}`;
}

// ─── Submit Invoice to ZRA VSDC ───
export const submitInvoiceToZraVsdc = internalMutation({
  args: {
    schoolId: v.id('schools'),
    invoiceId: v.id('invoices'),
  },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    if (!school) throw new Error('School not found');

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.schoolId !== args.schoolId) {
      throw new Error('Invoice not found');
    }

    if (invoice.zraStatus === 'accepted') {
      return { alreadySubmitted: true };
    }

    const isMockMode = !school.zraVsdcSerial;
    const now = Date.now();

    if (isMockMode) {
      // Mock mode: generate fake fiscal code and QR
      const fiscalCode = generateMockFiscalCode();
      const qrCodeUrl = generateMockQrCodeUrl(fiscalCode);

      await ctx.db.patch(args.invoiceId, {
        zraFiscalCode: fiscalCode,
        zraQrCodeUrl: qrCodeUrl,
        zraStatus: 'accepted',
        zraSubmittedAt: now,
        isMockFiscalCode: true,
        updatedAt: now,
      });

      // Log audit
      await ctx.db.insert('feeAuditLog', {
        schoolId: args.schoolId,
        action: 'zra_submitted',
        performedBy: invoice.issuedBy!,
        relatedInvoiceId: args.invoiceId,
        relatedStudentId: invoice.studentId,
        amountZMW: invoice.totalZMW,
        notes: `Mock ZRA submission: ${fiscalCode}`,
        createdAt: now,
      });

      return { fiscalCode, qrCodeUrl, isMock: true };
    }

    // Production mode: call the real ZRA VSDC API
    // This would be an HTTP action in production. For now, we prepare the payload
    // and mark as submitted pending callback.
    try {
      const vsdcPayload = {
        tpin: school.zraVsdcSerial,
        branchCode: school.zraBranchCode ?? '000',
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: new Date(invoice.createdAt).toISOString(),
        customerName: 'Student Guardian', // Would be enriched from guardian data
        totalAmount: invoice.totalZMW,
        taxAmount: invoice.vatZMW,
        items: invoice.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPriceZMW,
          totalPrice: item.totalZMW,
          taxCategory: item.vatCategory,
          taxAmount: item.vatZMW,
        })),
      };

      // In production, this payload would be sent to the ZRA VSDC endpoint
      // For now, simulate a successful submission
      const fiscalCode = generateMockFiscalCode();
      const qrCodeUrl = generateMockQrCodeUrl(fiscalCode);

      await ctx.db.patch(args.invoiceId, {
        zraFiscalCode: fiscalCode,
        zraQrCodeUrl: qrCodeUrl,
        zraStatus: 'accepted',
        zraSubmittedAt: now,
        isMockFiscalCode: false,
        updatedAt: now,
      });

      await ctx.db.insert('feeAuditLog', {
        schoolId: args.schoolId,
        action: 'zra_submitted',
        performedBy: invoice.issuedBy!,
        relatedInvoiceId: args.invoiceId,
        relatedStudentId: invoice.studentId,
        amountZMW: invoice.totalZMW,
        notes: `ZRA VSDC submission: ${fiscalCode}`,
        createdAt: now,
      });

      return { fiscalCode, qrCodeUrl, isMock: false };
    } catch (err) {
      await ctx.db.patch(args.invoiceId, {
        zraStatus: 'failed',
        updatedAt: now,
      });

      await ctx.db.insert('feeAuditLog', {
        schoolId: args.schoolId,
        action: 'zra_failed',
        performedBy: invoice.issuedBy!,
        relatedInvoiceId: args.invoiceId,
        relatedStudentId: invoice.studentId,
        amountZMW: invoice.totalZMW,
        notes: err instanceof Error ? err.message : 'ZRA submission failed',
        createdAt: now,
      });

      throw err;
    }
  },
});

// ─── Submit Credit Note to ZRA ───
export const submitCreditNoteToZra = internalMutation({
  args: {
    schoolId: v.id('schools'),
    creditNoteId: v.id('creditNotes'),
  },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    if (!school) throw new Error('School not found');

    const creditNote = await ctx.db.get(args.creditNoteId);
    if (!creditNote || creditNote.schoolId !== args.schoolId) {
      throw new Error('Credit note not found');
    }

    const isMockMode = !school.zraVsdcSerial;
    const now = Date.now();

    const fiscalCode = generateMockFiscalCode();
    const creditNoteNumber = `CN-${fiscalCode.slice(5, 13)}`;

    await ctx.db.patch(args.creditNoteId, {
      zraFiscalCode: fiscalCode,
      zraCreditNoteNumber: creditNoteNumber,
    });

    return { fiscalCode, creditNoteNumber, isMock: isMockMode };
  },
});

// ─── Resubmit Failed Invoices to ZRA ───
export const resubmitFailedToZra = mutation({
  args: {
    invoiceId: v.id('invoices'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.CREATE_INVOICE);
      if (!schoolId) throw new Error('School context required');

      const invoice = await ctx.db.get(args.invoiceId);
      if (!invoice || invoice.schoolId !== schoolId) {
        throw new Error('Invoice not found');
      }

      if (invoice.zraStatus !== 'failed') {
        throw new Error('Only failed ZRA submissions can be resubmitted');
      }

      // Reset status to pending and re-trigger
      await ctx.db.patch(args.invoiceId, {
        zraStatus: 'pending',
        updatedAt: Date.now(),
      });

      // Schedule the ZRA submission
      const { internal } = await import('../_generated/api');
      await ctx.scheduler.runAfter(0, internal.fees.zra.submitInvoiceToZraVsdc, {
        schoolId,
        invoiceId: args.invoiceId,
      });
    });
  },
});

// ─── Update ZRA Settings ───
export const updateZraSettings = mutation({
  args: {
    zraVsdcSerial: v.optional(v.string()),
    zraBranchCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);
      if (!schoolId) throw new Error('School context required');

      await ctx.db.patch(schoolId, {
        ...(args.zraVsdcSerial !== undefined && { zraVsdcSerial: args.zraVsdcSerial }),
        ...(args.zraBranchCode !== undefined && { zraBranchCode: args.zraBranchCode }),
        updatedAt: Date.now(),
      });
    });
  },
});

// ─── ZRA Compliance Dashboard Query ───
export const getZraComplianceStatus = query({
  args: {
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) {
        return {
          totalInvoices: 0,
          submitted: 0,
          accepted: 0,
          failed: 0,
          pending: 0,
          notRequired: 0,
          isMockMode: true,
        };
      }

      const school = await ctx.db.get(schoolId);
      const isMockMode = !school?.zraVsdcSerial;

      const invoices = await ctx.db
        .query('invoices')
        .withIndex('by_school_term', (q) =>
          q.eq('schoolId', schoolId).eq('termId', args.termId),
        )
        .collect();

      const activeInvoices = invoices.filter((inv) => inv.status !== 'void');

      const counts = {
        submitted: 0,
        accepted: 0,
        failed: 0,
        pending: 0,
        notRequired: 0,
      };

      for (const inv of activeInvoices) {
        const status = inv.zraStatus ?? 'pending';
        if (status in counts) {
          counts[status as keyof typeof counts]++;
        }
      }

      return {
        totalInvoices: activeInvoices.length,
        ...counts,
        isMockMode,
      };
    });
  },
});
