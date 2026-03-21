import { v } from 'convex/values';
import { query } from '../_generated/server';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureSchoolId } from './_helpers';

export const listExamSessions = query({
  args: {
    termId: v.optional(v.id('terms')),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_ACADEMICS);
      const scopedSchoolId = ensureSchoolId(schoolId);

      let sessions;
      if (args.termId) {
        sessions = await ctx.db
          .query('examSessions')
          .withIndex('by_term', (q) => q.eq('termId', args.termId!))
          .collect();
        // Filter to current school
        sessions = sessions.filter((s) => s.schoolId === scopedSchoolId);
      } else {
        sessions = await ctx.db
          .query('examSessions')
          .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
          .collect();
      }

      // Enrich with term names
      const termIds = [...new Set(sessions.map((s) => s.termId))];
      const terms = await Promise.all(termIds.map((id) => ctx.db.get(id)));
      const termMap = Object.fromEntries(
        terms.filter(Boolean).map((t) => [t!._id, t!.name]),
      );

      return sessions
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((s) => ({
          ...s,
          termName: termMap[s.termId] ?? 'Unknown',
        }));
    });
  },
});

export const getMarksEntryData = query({
  args: {
    examSessionId: v.id('examSessions'),
    sectionId: v.id('sections'),
    subjectId: v.id('subjects'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      // Teachers can enter marks
      const scopedSchoolId = ensureSchoolId(schoolId);

      const session = await ctx.db.get(args.examSessionId);
      if (!session || session.schoolId !== scopedSchoolId) {
        return null;
      }

      // Get students in this section
      const students = await ctx.db
        .query('students')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect()
        .then((all) =>
          all.filter(
            (s) =>
              s.currentSectionId === args.sectionId && s.enrollmentStatus === 'active',
          ),
        );

      // Get existing results
      const existingResults = await ctx.db
        .query('examResults')
        .withIndex('by_session_section', (q) =>
          q.eq('examSessionId', args.examSessionId).eq('sectionId', args.sectionId),
        )
        .collect()
        .then((all) =>
          all.filter((r) => r.subjectId === args.subjectId),
        );

      // Build a map of studentId -> result
      const resultMap = Object.fromEntries(
        existingResults.map((r) => [r.studentId, r]),
      );

      // Get school for grading scales
      const school = await ctx.db.get(scopedSchoolId);
      const gradingScales = school?.gradingScales ?? [];

      return {
        session,
        students: students
          .sort((a, b) => a.lastName.localeCompare(b.lastName))
          .map((s) => ({
            _id: s._id,
            firstName: s.firstName,
            lastName: s.lastName,
            studentNumber: s.studentNumber,
            existingResult: resultMap[s._id] ?? null,
          })),
        gradingScales,
        isLocked: session.isLocked,
      };
    });
  },
});

export const getStudentReportCard = query({
  args: {
    studentId: v.id('students'),
    examSessionId: v.id('examSessions'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);

      // Verify session
      const session = await ctx.db.get(args.examSessionId);
      if (!session || session.schoolId !== scopedSchoolId) return null;

      // Verify student
      const student = await ctx.db.get(args.studentId);
      if (!student || student.schoolId !== scopedSchoolId) return null;

      // Fetch structural data
      const grade = student.currentGradeId ? await ctx.db.get(student.currentGradeId) : null;
      const section = student.currentSectionId ? await ctx.db.get(student.currentSectionId) : null;
      const term = await ctx.db.get(session.termId);
      const school = await ctx.db.get(scopedSchoolId);
      const config = school?.reportCardConfig ?? {
        showClassTeacherRemarks: true,
        showPrincipalRemarks: true,
        showAttendanceSummary: true,
        showSubjectPositions: false,
      };

      // Fetch results
      const results = await ctx.db
        .query('examResults')
        .withIndex('by_session_student', (q) =>
          q.eq('examSessionId', args.examSessionId).eq('studentId', args.studentId)
        )
        .collect();

      // Enrich results with subjects
      const enrichedResults = await Promise.all(
        results.map(async (r) => {
          const subject = await ctx.db.get(r.subjectId);
          return {
            ...r,
            subjectName: subject?.name ?? 'Unknown Subject',
            subjectCode: subject?.code,
            isCore: subject?.isCore ?? false,
          };
        })
      );

      // Fetch attendance overall (assuming for current term, but we'll fetch all non-excused / present for context)
      // If term is available we could filter by term.
      const attendanceQuery = ctx.db
        .query('attendance')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId));
      
      const allAttendance = await attendanceQuery.collect();
      const studentAttendance = allAttendance.filter((a) => a.studentId === args.studentId);
      const attendanceSummary = {
        total: studentAttendance.length,
        present: studentAttendance.filter((a) => a.status === 'present').length,
        absent: studentAttendance.filter((a) => a.status === 'absent').length,
        late: studentAttendance.filter((a) => a.status === 'late').length,
      };

      // Calculate totals
      const totalMarks = enrichedResults.reduce((sum, r) => sum + r.marksObtained, 0);
      const maximumMarks = enrichedResults.reduce((sum, r) => sum + r.maxMarks, 0);
      const average = enrichedResults.length > 0 ? (totalMarks / maximumMarks) * 100 : null;

      return {
        student,
        grade,
        section,
        session,
        term,
        school: {
          name: school?.name,
          logoUrl: school?.branding?.logoUrl,
          motto: school?.branding?.motto,
        },
        config,
        results: enrichedResults.sort((a, b) => a.subjectName.localeCompare(b.subjectName)),
        attendanceSummary,
        overall: {
          totalMarks,
          maximumMarks,
          average,
        },
      };
    });
  },
});
