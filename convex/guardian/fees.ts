import { query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureSchoolId } from '../schools/_helpers';
import {
  canPayFees,
  getGuardianForUser,
  getGuardianLinkForStudent,
  getGuardianLinkedStudents,
} from './_helpers';

export const getGuardianFeesOverview = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const { guardian } = await getGuardianForUser(ctx, scopedSchoolId, userId);
      const students = await getGuardianLinkedStudents(ctx, scopedSchoolId, guardian._id);

      const children = await Promise.all(
        students.map(async (student) => {
          const link = getGuardianLinkForStudent(student, guardian._id);
          const invoices = await ctx.db
            .query('invoices')
            .withIndex('by_student', (q) => q.eq('studentId', student._id))
            .collect();

          const latestInvoice = invoices
            .filter((invoice) => invoice.status !== 'void')
            .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;

          const balance = invoices
            .filter((invoice) => invoice.status !== 'void')
            .reduce((sum, invoice) => sum + invoice.balanceZMW, 0);

          return {
            student: {
              _id: student._id,
              name: `${student.firstName} ${student.lastName}`,
              grade: student.currentGradeId,
              photo: student.avatarUrl ?? null,
            },
            currentInvoice: canPayFees(link) ? latestInvoice : null,
            balanceZMW: canPayFees(link) ? balance : 0,
            dueDate: canPayFees(link) && latestInvoice ? new Date(latestInvoice.dueDate).toISOString().slice(0, 10) : null,
            isOverdue: canPayFees(link) && latestInvoice ? latestInvoice.balanceZMW > 0 && latestInvoice.dueDate < Date.now() : false,
          };
        }),
      );

      const recentPayments = await ctx.db
        .query('payments')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      const studentIdSet = new Set(children.map((child) => child.student._id));
      const filteredPayments = recentPayments
        .filter((payment) => studentIdSet.has(payment.studentId))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);

      const totalOutstandingZMW = children.reduce((sum, child) => sum + child.balanceZMW, 0);

      const creditEntries = await ctx.db
        .query('guardianLedger')
        .withIndex('by_guardian_student', (q) => q.eq('guardianId', guardian._id))
        .collect();

      const creditBalanceZMW = creditEntries.length > 0
        ? Math.max(0, creditEntries[creditEntries.length - 1].balanceAfterZMW * -1)
        : 0;

      const childrenWithBalances = children.filter((child) => child.balanceZMW > 0).length;

      return {
        children,
        totalOutstandingZMW,
        creditBalanceZMW,
        recentPayments: filteredPayments,
        consolidatedInvoiceAvailable: childrenWithBalances >= 2,
      };
    });
  },
});
