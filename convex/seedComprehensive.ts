import { internalMutation, internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { Id } from './_generated/dataModel';
import { v } from 'convex/values';
import {
  MALE_NAMES, FEMALE_NAMES, LAST_NAMES, ECZ_GRADING_SCALE, GPA_GRADING_SCALE,
  FEE_TYPES_TEMPLATE, SUBJECTS_SECONDARY, SUBJECTS_COLLEGE, SUBJECTS_PRIMARY,
  BOOK_TITLES, STAFF_CONFIGS, GRADE_CONFIGS, FEE_AMOUNTS,
  pick, pickN, phone, ts, seedUid, randInt, randScore,
  getEczGrade, getGpaGrade, getSchoolDays, attendanceStatus,
  nextInvoiceNumber, nextReceiptNumber, nextCreditNoteNumber,
  resetUidCounter, resetInvCounter, resetReceiptCounter,
} from './_seed/data';

// ════════════════════════════════════════════════════════════════════════
// Phase 1: Core Infrastructure — Schools, Academic Years, Terms, Grades, Sections, Events
// ════════════════════════════════════════════════════════════════════════

export const seedPhase1_Core = internalMutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query('schools').first();
    if (existing) return { status: 'skipped', message: 'Data already exists. Run clearAllData first.' };

    const now = Date.now();

    // ── School 1: Kabulonga Boys Secondary (boarding) ──
    const school1Id = await ctx.db.insert('schools', {
      name: 'Kabulonga Boys Secondary School',
      shortName: 'KBSS',
      slug: 'kabulonga',
      type: 'secondary_boarding',
      branding: {
        primaryColor: '#A51C30',
        secondaryColor: '#1E3A5F',
        motto: 'Excellence Through Discipline',
      },
      address: 'Plot 1234, Kabulonga Road, Lusaka',
      province: 'Lusaka',
      district: 'Lusaka',
      email: 'admin@kabulonga.edu.zm',
      phone: '+260211234567',
      website: 'https://kabulonga.edu.zm',
      zraTpin: '1001234567',
      moeCode: 'MOE-LSK-001',
      eczCenterNumber: 'EC-4401',
      gradingMode: 'ecz',
      academicMode: 'term',
      periodConfig: {
        periodsPerDay: 7,
        firstPeriodStartTime: '07:30',
        lessonDurationMinutes: 40,
        shortBreakMinutes: 15,
        longBreakMinutes: 60,
      },
      gradingScales: ECZ_GRADING_SCALE,
      reportCardConfig: {
        showClassTeacherRemarks: true,
        showPrincipalRemarks: true,
        showAttendanceSummary: true,
        showSubjectPositions: true,
        showFeesDueNotice: true,
      },
      feeTypes: FEE_TYPES_TEMPLATE,
      arrearsPolicy: {
        reminderScheduleDays: [7, 14, 21, 30],
        blockExamAccessAtDays: 45,
        holdReportCardAtDays: 30,
        requireFullPaymentForPromotion: false,
        gracePeriodDays: 14,
        enableAutomaticReminders: true,
      },
      mobileMoneyConfig: {
        airtel: { merchantCode: 'KBSS001', merchantName: 'Kabulonga Boys', apiClientId: 'test_airtel_id', apiSecret: 'test_airtel_secret', isActive: true },
        mtn: { merchantCode: 'KBSS002', apiUserId: 'test_mtn_user', apiKey: 'test_mtn_key', subscriptionKey: 'test_sub_key', callbackHost: 'https://kabulonga.edu.zm', isActive: true },
        paymentReferenceFormat: 'KBSS-{studentNumber}',
        paymentInstructions: 'Dial *778# (Airtel) or *303# (MTN) and enter merchant code',
      },
      zraVsdcSerial: 'VSDC-KBSS-001',
      zraBranchCode: 'BR001',
      siblingDiscountRules: [
        { childIndex: 2, discountPercent: 10, applyToFeeTypes: ['tuition'] },
        { childIndex: 3, discountPercent: 15, applyToFeeTypes: ['tuition'] },
      ],
      smsTemplates: {
        absenceAlert: 'Dear Parent, {studentName} was marked absent on {date}. Please contact the school.',
        feeReminderPreDue: 'Dear Parent, fees of ZMW {amount} for {studentName} are due on {dueDate}.',
        paymentReceipt: 'Payment of ZMW {amount} received for {studentName}. Receipt: {receiptNumber}.',
      },
      enabledFeatures: [
        'STUDENTS', 'STAFF', 'ATTENDANCE', 'FEES', 'ZRA_INVOICING',
        'GUARDIAN_PORTAL', 'SMS_NOTIFICATIONS', 'SCHOOL_CUSTOMISATION',
        'ECZ_EXAMS', 'TIMETABLE', 'BOARDING', 'POCKET_MONEY',
        'SICK_BAY', 'VISITOR_LOG', 'LIBRARY', 'TRANSPORT',
        'PERIOD_ATTENDANCE', 'AI_INSIGHTS',
      ],
      subscriptionTier: 'premium',
      subscriptionExpiresAt: ts('2026-01-31'),
      smsBalance: 2500,
      isActive: true,
      onboardingComplete: true,
      createdAt: now,
      updatedAt: now,
    });

    // ── School 2: Chengelo School (combined) ──
    const school2Id = await ctx.db.insert('schools', {
      name: 'Chengelo School',
      shortName: 'CS',
      slug: 'chengelo',
      type: 'combined',
      branding: {
        primaryColor: '#2E7D32',
        secondaryColor: '#FFC107',
        motto: 'Empowering Futures',
      },
      address: 'Mkushi Farm Block, Mkushi',
      province: 'Central',
      district: 'Mkushi',
      email: 'admin@chengelo.edu.zm',
      phone: '+260215234567',
      website: 'https://chengelo.edu.zm',
      zraTpin: '2001234567',
      moeCode: 'MOE-CEN-012',
      eczCenterNumber: 'EC-3301',
      gradingMode: 'ecz',
      academicMode: 'term',
      periodConfig: {
        periodsPerDay: 8,
        firstPeriodStartTime: '07:00',
        lessonDurationMinutes: 35,
        shortBreakMinutes: 10,
        longBreakMinutes: 45,
      },
      gradingScales: ECZ_GRADING_SCALE,
      reportCardConfig: {
        showClassTeacherRemarks: true,
        showPrincipalRemarks: true,
        showAttendanceSummary: true,
        showSubjectPositions: true,
      },
      feeTypes: FEE_TYPES_TEMPLATE,
      arrearsPolicy: {
        reminderScheduleDays: [7, 14, 21],
        blockExamAccessAtDays: 60,
        holdReportCardAtDays: 45,
        requireFullPaymentForPromotion: true,
        gracePeriodDays: 7,
        enableAutomaticReminders: true,
      },
      mobileMoneyConfig: {
        airtel: { merchantCode: 'CS001', merchantName: 'Chengelo School', apiClientId: 'test_cs_airtel', apiSecret: 'test_cs_secret', isActive: true },
        paymentReferenceFormat: 'CS-{studentNumber}',
      },
      siblingDiscountRules: [
        { childIndex: 2, discountPercent: 5, applyToFeeTypes: ['tuition'] },
        { childIndex: 3, discountPercent: 10, applyToFeeTypes: ['tuition', 'boarding'] },
      ],
      enabledFeatures: [
        'STUDENTS', 'STAFF', 'ATTENDANCE', 'FEES', 'ZRA_INVOICING',
        'GUARDIAN_PORTAL', 'SMS_NOTIFICATIONS', 'SCHOOL_CUSTOMISATION',
        'ECZ_EXAMS', 'TIMETABLE', 'BOARDING', 'TRANSPORT',
        'LIBRARY', 'LMS', 'MEAL_PLANS', 'POCKET_MONEY',
      ],
      subscriptionTier: 'standard',
      subscriptionExpiresAt: ts('2025-12-31'),
      smsBalance: 800,
      isActive: true,
      onboardingComplete: true,
      createdAt: now,
      updatedAt: now,
    });

    // ── School 3: Evelyn Hone College ──
    const school3Id = await ctx.db.insert('schools', {
      name: 'Evelyn Hone College',
      shortName: 'EHC',
      slug: 'evelyn-hone',
      type: 'college',
      branding: {
        primaryColor: '#1565C0',
        secondaryColor: '#E8EAF6',
        motto: 'Skills for the Future',
      },
      address: 'Church Road, Lusaka',
      province: 'Lusaka',
      district: 'Lusaka',
      email: 'admin@evelynhone.edu.zm',
      phone: '+260211345678',
      website: 'https://evelynhone.edu.zm',
      zraTpin: '3001234567',
      heaCode: 'HEA-001',
      gradingMode: 'gpa',
      academicMode: 'semester',
      periodConfig: {
        periodsPerDay: 6,
        firstPeriodStartTime: '08:00',
        lessonDurationMinutes: 50,
        shortBreakMinutes: 15,
        longBreakMinutes: 60,
      },
      gradingScales: GPA_GRADING_SCALE,
      reportCardConfig: {
        showClassTeacherRemarks: false,
        showPrincipalRemarks: true,
        showAttendanceSummary: true,
        showSubjectPositions: false,
      },
      feeTypes: FEE_TYPES_TEMPLATE.filter(ft => ft.id !== 'boarding'),
      arrearsPolicy: {
        reminderScheduleDays: [7, 14, 30],
        blockExamAccessAtDays: 30,
        requireFullPaymentForPromotion: true,
        gracePeriodDays: 14,
        enableAutomaticReminders: true,
      },
      enabledFeatures: [
        'STUDENTS', 'STAFF', 'ATTENDANCE', 'FEES', 'ZRA_INVOICING',
        'GUARDIAN_PORTAL', 'SCHOOL_CUSTOMISATION',
        'SEMESTER_SYSTEM', 'GPA', 'HEA_COMPLIANCE',
        'LMS', 'LIBRARY', 'ELIBRARY', 'PORTFOLIO',
        'AI_INSIGHTS',
      ],
      subscriptionTier: 'premium',
      subscriptionExpiresAt: ts('2026-06-30'),
      smsBalance: 3000,
      isActive: true,
      onboardingComplete: true,
      createdAt: now,
      updatedAt: now,
    });

    const schoolIds = [school1Id, school2Id, school3Id];
    const slugs = ['kabulonga', 'chengelo', 'evelyn-hone'];
    const schoolCodes = ['KBSS', 'CS', 'EHC'];

    // ── Academic Years ──
    const ayIds: Id<'academicYears'>[] = [];
    for (let i = 0; i < 3; i++) {
      const ayId = await ctx.db.insert('academicYears', {
        schoolId: schoolIds[i],
        name: i === 2 ? 'Academic Year 2025' : '2025 Academic Year',
        year: 2025,
        startDate: ts('2025-01-13'),
        endDate: ts('2025-12-05'),
        isCurrent: true,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });
      ayIds.push(ayId);
    }

    // ── Terms (3 per school, or 2 semesters for college) ──
    const allTermIds: Id<'terms'>[][] = [];
    for (let i = 0; i < 3; i++) {
      const termDefs = i === 2
        ? [
            { name: 'Semester 1', start: '2025-01-13', end: '2025-06-20', isCurrent: true, status: 'active' as const },
            { name: 'Semester 2', start: '2025-07-14', end: '2025-12-05', isCurrent: false, status: 'upcoming' as const },
          ]
        : [
            { name: 'Term 1', start: '2025-01-13', end: '2025-04-11', isCurrent: false, status: 'closed' as const },
            { name: 'Term 2', start: '2025-05-05', end: '2025-08-08', isCurrent: true, status: 'active' as const },
            { name: 'Term 3', start: '2025-09-01', end: '2025-12-05', isCurrent: false, status: 'upcoming' as const },
          ];
      const termIds: Id<'terms'>[] = [];
      for (const t of termDefs) {
        const tid = await ctx.db.insert('terms', {
          schoolId: schoolIds[i],
          academicYearId: ayIds[i],
          name: t.name,
          startDate: ts(t.start),
          endDate: ts(t.end),
          isCurrent: t.isCurrent,
          status: t.status,
          createdAt: now,
          updatedAt: now,
        });
        termIds.push(tid);
      }
      allTermIds.push(termIds);

      // Set current academic year and term on school
      const currentTermId = termIds.find((_, idx) => termDefs[idx].isCurrent)!;
      await ctx.db.patch(schoolIds[i], {
        currentAcademicYearId: ayIds[i],
        currentTermId: currentTermId,
      });
    }

    // ── Grades ──
    const allGradeIds: Id<'grades'>[][] = [];
    const gradeKeys: Array<'secondary_boarding' | 'combined' | 'college'> = ['secondary_boarding', 'combined', 'college'];
    for (let i = 0; i < 3; i++) {
      const cfg = GRADE_CONFIGS[gradeKeys[i]];
      const gradeIds: Id<'grades'>[] = [];
      for (const g of cfg) {
        const gid = await ctx.db.insert('grades', {
          schoolId: schoolIds[i],
          name: g.name,
          level: g.level,
          isActive: true,
          graduationGrade: (g as any).graduationGrade ?? false,
          isEczExamYear: (g as any).isEczExamYear ?? false,
          createdAt: now,
          updatedAt: now,
        });
        gradeIds.push(gid);
      }
      allGradeIds.push(gradeIds);
    }

    // ── Sections (2-3 per grade) ──
    const allSectionIds: Id<'sections'>[][] = [];
    const sectionNames = ['A', 'B', 'C'];
    for (let i = 0; i < 3; i++) {
      const sectionIds: Id<'sections'>[] = [];
      for (const gid of allGradeIds[i]) {
        const grade = await ctx.db.get(gid);
        const numSections = i === 2 ? 2 : (allGradeIds[i].length > 7 ? 2 : 3);
        for (let s = 0; s < numSections; s++) {
          const sid = await ctx.db.insert('sections', {
            schoolId: schoolIds[i],
            gradeId: gid,
            academicYearId: ayIds[i],
            name: sectionNames[s],
            displayName: `${grade!.name} ${sectionNames[s]}`,
            roomNumber: `R${grade!.level}${s + 1}`,
            maxStudents: i === 2 ? 40 : 35,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
          sectionIds.push(sid);
        }
      }
      allSectionIds.push(sectionIds);
    }

    // ── School Events ──
    for (let i = 0; i < 3; i++) {
      const events = [
        { title: 'Term 1 Opening Day', type: 'general' as const, start: '2025-01-13', end: '2025-01-13', affectsAttendance: false, visible: true },
        { title: 'Mid-Term Break', type: 'holiday' as const, start: '2025-02-24', end: '2025-02-28', affectsAttendance: true, visible: true },
        { title: 'End of Term 1 Exams', type: 'exam_period' as const, start: '2025-03-24', end: '2025-04-04', affectsAttendance: false, visible: true },
        { title: 'Sports Day', type: 'sports_day' as const, start: '2025-03-15', end: '2025-03-15', affectsAttendance: true, visible: true },
        { title: 'Parent-Teacher Meeting', type: 'parent_teacher' as const, start: '2025-04-05', end: '2025-04-05', affectsAttendance: true, visible: true },
        { title: 'Term 2 Opening', type: 'general' as const, start: '2025-05-05', end: '2025-05-05', affectsAttendance: false, visible: true },
        { title: 'Africa Day', type: 'holiday' as const, start: '2025-05-25', end: '2025-05-25', affectsAttendance: true, visible: true },
        { title: 'Independence Day', type: 'holiday' as const, start: '2025-10-24', end: '2025-10-24', affectsAttendance: true, visible: true },
      ];
      for (const e of events) {
        await ctx.db.insert('schoolEvents', {
          schoolId: schoolIds[i],
          academicYearId: ayIds[i],
          title: e.title,
          startDate: e.start,
          endDate: e.end,
          type: e.type,
          affectsAttendance: e.affectsAttendance,
          visibleToParents: e.visible,
          createdAt: now,
        });
      }
    }

    // ── Counters ──
    for (let i = 0; i < 3; i++) {
      for (const key of ['student_number', 'invoice_number', 'receipt_number', 'credit_note_number']) {
        await ctx.db.insert('counters', {
          schoolId: schoolIds[i],
          key,
          value: 0,
          updatedAt: now,
        });
      }
    }

    return {
      status: 'success',
      message: 'Phase 1 complete: 3 schools, academic years, terms, grades, sections, events, counters',
      schools: { kabulonga: school1Id, chengelo: school2Id, evelynHone: school3Id },
    };
  },
});

// ════════════════════════════════════════════════════════════════════════
// Phase 2: People — Staff, Guardians, Students, Users
// ════════════════════════════════════════════════════════════════════════

export const seedPhase2_People = internalMutation({
  handler: async (ctx) => {
    const schools = await ctx.db.query('schools').collect();
    if (schools.length === 0) return { status: 'error', message: 'Run Phase 1 first' };

    const now = Date.now();
    const gradeKeys: Array<'secondary_boarding' | 'combined' | 'college'> = ['secondary_boarding', 'combined', 'college'];
    const schoolCodes = ['KBSS', 'CS', 'EHC'];
    const staffRoleToUserRole: Record<string, string> = {
      school_admin: 'school_admin',
      deputy_head: 'deputy_head',
      bursar: 'bursar',
      teacher: 'teacher',
      matron: 'matron',
      librarian: 'librarian',
      driver: 'driver',
    };

    let totalStaff = 0;
    let totalStudents = 0;
    let totalGuardians = 0;

    for (let si = 0; si < schools.length; si++) {
      const school = schools[si];
      const schoolId = school._id;
      const sections = await ctx.db.query('sections')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const grades = await ctx.db.query('grades')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();

      // ── Staff ──
      const staffConfig = STAFF_CONFIGS[gradeKeys[si]];
      const createdStaffIds: Id<'staff'>[] = [];
      const teacherStaffIds: Id<'staff'>[] = [];
      let empNum = 1;

      for (const cfg of staffConfig) {
        for (let c = 0; c < cfg.count; c++) {
          const isMale = Math.random() > 0.4;
          const firstName = isMale ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
          const lastName = pick(LAST_NAMES);
          const staffEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${school.slug}.edu.zm`;
          const staffPhone = phone();

          const staffId = await ctx.db.insert('staff', {
            schoolId,
            employeeNumber: `${schoolCodes[si]}-EMP-${String(empNum++).padStart(3, '0')}`,
            firstName,
            lastName,
            gender: isMale ? 'male' : 'female',
            email: staffEmail,
            phone: staffPhone,
            nrcNumber: `${randInt(100000, 999999)}/${randInt(10, 99)}/${randInt(1, 9)}`,
            role: cfg.role,
            staffCategory: cfg.cat,
            department: cfg.role === 'teacher' ? pick(['Sciences', 'Languages', 'Humanities', 'Mathematics', 'ICT']) : 'Administration',
            contractType: 'permanent',
            dateJoined: ts(`${randInt(2015, 2023)}-0${randInt(1, 9)}-${String(randInt(1, 28)).padStart(2, '0')}`),
            qualifications: cfg.cat === 'teaching'
              ? pickN(['Bachelor of Education', 'Diploma in Education', 'Master of Science', 'Certificate in Teaching', 'PGDE'], randInt(1, 3))
              : pickN(['Diploma', 'Certificate', 'Bachelor of Arts'], randInt(1, 2)),
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });

          createdStaffIds.push(staffId);
          if (cfg.role === 'teacher') teacherStaffIds.push(staffId);

          // Create user account for staff
          const userId = await ctx.db.insert('users', {
            tokenIdentifier: seedUid(),
            supabaseId: `seed-supabase-staff-${schoolCodes[si]}-${empNum}`,
            email: staffEmail,
            phone: staffPhone,
            name: `${firstName} ${lastName}`,
            role: staffRoleToUserRole[cfg.role] as any,
            schoolId,
            staffId,
            isActive: true,
            isFirstLogin: false,
            lastLoginAt: now - randInt(0, 7 * 86400000),
            notifPrefs: { sms: true, whatsapp: false, email: true, inApp: true },
            createdAt: now,
            updatedAt: now,
          });
          await ctx.db.patch(staffId, { userId });
          totalStaff++;
        }
      }

      // Assign class teachers to sections
      const teachers = teacherStaffIds.slice();
      for (let secIdx = 0; secIdx < sections.length && teachers.length > 0; secIdx++) {
        const teacherId = teachers[secIdx % teachers.length];
        await ctx.db.patch(sections[secIdx]._id, { classTeacherId: teacherId });
      }

      // ── Students & Guardians ──
      const studentsPerSection = si === 2 ? 15 : 12;
      let studentNum = 1;

      for (const section of sections) {
        const grade = grades.find(g => g._id === section.gradeId);
        if (!grade) continue;

        for (let s = 0; s < studentsPerSection; s++) {
          const isMale = si === 0 ? true : Math.random() > 0.45; // Kabulonga is boys school
          const studentFirstName = isMale ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
          const studentLastName = pick(LAST_NAMES);
          const studentNumber = `${schoolCodes[si]}-${String(studentNum++).padStart(4, '0')}`;
          const isBoarder = school.type === 'secondary_boarding' || (school.type === 'combined' && Math.random() > 0.5);
          const dobYear = si === 2 ? randInt(1998, 2004) : randInt(2006, 2014);

          // Create guardian first
          const guardianFirstName = pick(Math.random() > 0.5 ? MALE_NAMES : FEMALE_NAMES);
          const guardianLastName = studentLastName; // same family
          const guardianPhone = phone();

          const guardianId = await ctx.db.insert('guardians', {
            schoolId,
            firstName: guardianFirstName,
            lastName: guardianLastName,
            email: `${guardianFirstName.toLowerCase()}.${guardianLastName.toLowerCase()}${randInt(1, 999)}@gmail.com`,
            phone: guardianPhone,
            relationship: pick(['parent', 'parent', 'parent', 'guardian']),
            address: `Plot ${randInt(1, 999)}, ${pick(['Kabulonga', 'Woodlands', 'Chelstone', 'Kabwata', 'Chilenje', 'Roma', 'Northmead', 'Olympia'])} Area`,
            preferredContactMethod: pick(['sms', 'whatsapp', 'email']),
            isVerified: Math.random() > 0.2,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });

          // Guardian user account
          const guardianUserId = await ctx.db.insert('users', {
            tokenIdentifier: seedUid(),
            supabaseId: `seed-supabase-guardian-${schoolCodes[si]}-${studentNum}`,
            email: `${guardianFirstName.toLowerCase()}.${guardianLastName.toLowerCase()}${randInt(1, 999)}@gmail.com`,
            phone: guardianPhone,
            name: `${guardianFirstName} ${guardianLastName}`,
            role: 'guardian',
            schoolId,
            guardianId,
            isActive: true,
            isFirstLogin: Math.random() > 0.7,
            lastLoginAt: Math.random() > 0.3 ? now - randInt(0, 14 * 86400000) : undefined,
            notifPrefs: { sms: true, whatsapp: Math.random() > 0.5, email: Math.random() > 0.3, inApp: true },
            createdAt: now,
            updatedAt: now,
          });
          await ctx.db.patch(guardianId, { userId: guardianUserId });

          // Create student
          const studentId = await ctx.db.insert('students', {
            schoolId,
            firstName: studentFirstName,
            lastName: studentLastName,
            dateOfBirth: ts(`${dobYear}-${String(randInt(1, 12)).padStart(2, '0')}-${String(randInt(1, 28)).padStart(2, '0')}`),
            gender: isMale ? 'male' : 'female',
            studentNumber,
            currentGradeId: section.gradeId,
            currentSectionId: section._id,
            eczCandidateNumber: grade.isEczExamYear ? `ECZ-${schoolCodes[si]}-${String(studentNum).padStart(4, '0')}` : undefined,
            enrollmentStatus: 'active',
            enrolledAt: ts(`${randInt(2020, 2024)}-01-${String(randInt(5, 20)).padStart(2, '0')}`),
            guardianLinks: [{ guardianId, relationship: 'parent', isPrimary: true }],
            boardingStatus: isBoarder ? 'boarder' : 'day',
            bloodType: pick(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
            allergies: Math.random() > 0.8 ? pickN(['Peanuts', 'Dust', 'Penicillin', 'Lactose'], randInt(1, 2)) : undefined,
            createdAt: now,
            updatedAt: now,
          });

          // Student user account (only for college and older secondary students)
          if (si === 2 || grade.level >= 10) {
            const studentUserId = await ctx.db.insert('users', {
              tokenIdentifier: seedUid(),
              supabaseId: `seed-supabase-student-${schoolCodes[si]}-${studentNum}`,
              name: `${studentFirstName} ${studentLastName}`,
              role: 'student',
              schoolId,
              studentId,
              isActive: true,
              isFirstLogin: Math.random() > 0.5,
              notifPrefs: { sms: false, whatsapp: false, email: false, inApp: true },
              createdAt: now,
              updatedAt: now,
            });
            await ctx.db.patch(studentId, { userId: studentUserId });
          }

          totalStudents++;
          totalGuardians++;
        }
      }
    }

    // ── Platform Admin ──
    const platformUserId = await ctx.db.insert('users', {
      tokenIdentifier: seedUid(),
      supabaseId: 'seed-supabase-platform-admin',
      email: 'admin@acadowl.com',
      name: 'Platform Admin',
      role: 'platform_admin',
      isActive: true,
      isFirstLogin: false,
      lastLoginAt: now,
      notifPrefs: { sms: true, whatsapp: true, email: true, inApp: true },
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert('platformAdmins', {
      userId: platformUserId,
      email: 'admin@acadowl.com',
      name: 'Platform Admin',
      isSuperAdmin: true,
      createdAt: now,
    });

    return {
      status: 'success',
      message: `Phase 2 complete: ${totalStaff} staff, ${totalStudents} students, ${totalGuardians} guardians, 1 platform admin`,
    };
  },
});

// ════════════════════════════════════════════════════════════════════════
// Phase 3: Academics — Subjects, Staff Assignments, Timetable, Attendance
// ════════════════════════════════════════════════════════════════════════

export const seedPhase3_Academics = internalMutation({
  handler: async (ctx) => {
    const schools = await ctx.db.query('schools').collect();
    if (schools.length === 0) return { status: 'error', message: 'Run Phase 1 first' };

    const now = Date.now();
    const subjectSets = [SUBJECTS_SECONDARY, SUBJECTS_SECONDARY, SUBJECTS_COLLEGE];
    // For combined school (index 1), primary grades get SUBJECTS_PRIMARY
    let totalSubjects = 0;
    let totalAssignments = 0;
    let totalSlots = 0;
    let totalAttendance = 0;

    for (let si = 0; si < schools.length; si++) {
      const school = schools[si];
      const schoolId = school._id;
      const grades = await ctx.db.query('grades')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const sections = await ctx.db.query('sections')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const staffList = await ctx.db.query('staff')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const teachers = staffList.filter(s => s.role === 'teacher' || s.role === 'class_teacher');
      const students = await ctx.db.query('students')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const terms = await ctx.db.query('terms')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const currentTerm = terms.find(t => t.isCurrent);
      const academicYears = await ctx.db.query('academicYears')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const ay = academicYears[0];

      // Find a user for marking attendance
      const users = await ctx.db.query('users')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const teacherUser = users.find(u => u.role === 'teacher' || u.role === 'class_teacher') || users[0];

      // ── Subjects ──
      const subjectDefs = si === 1
        ? [...SUBJECTS_PRIMARY, ...SUBJECTS_SECONDARY.slice(5, 9)] // combined school gets primary + some secondary electives
        : subjectSets[si];
      const subjectIds: Id<'subjects'>[] = [];
      for (const sub of subjectDefs) {
        const applicableGradeIds = si === 1
          ? (sub.isCore
            ? grades.map(g => g._id)
            : grades.filter(g => g.level >= 5).map(g => g._id))
          : grades.map(g => g._id);
        const sid = await ctx.db.insert('subjects', {
          schoolId,
          name: sub.name,
          code: sub.code,
          isCore: sub.isCore,
          category: sub.cat as any,
          gradeIds: applicableGradeIds,
          isCompulsory: sub.isCore,
          isStemSubject: ['MATH', 'SCI', 'BIO', 'PHY', 'CHEM', 'IT', 'CS', 'STAT'].includes(sub.code),
          theoryWeight: sub.code === 'PE' ? 30 : 70,
          practicalWeight: sub.code === 'PE' ? 70 : 30,
          eczSubjectCode: si !== 2 ? `ECZ-${sub.code}` : undefined,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        subjectIds.push(sid);
        totalSubjects++;
      }

      // ── Staff Subject Assignments ──
      for (let idx = 0; idx < subjectIds.length; idx++) {
        const teacherIdx = idx % teachers.length;
        const teacher = teachers[teacherIdx];
        // Assign to 1-2 sections per subject
        const applicableSections = sections.slice(0, Math.min(3, sections.length));
        for (const section of applicableSections) {
          await ctx.db.insert('staffSubjectAssignments', {
            schoolId,
            staffId: teacher._id,
            subjectId: subjectIds[idx],
            gradeId: section.gradeId,
            sectionId: section._id,
            academicYearId: ay._id,
            isPrimaryTeacher: true,
            createdAt: now,
            updatedAt: now,
          });
          totalAssignments++;
        }
      }

      // ── Timetable Slots (Mon-Fri, periods per day) ──
      const periodsPerDay = school.periodConfig?.periodsPerDay ?? 7;
      const startHour = 7;
      const lessonMin = school.periodConfig?.lessonDurationMinutes ?? 40;
      for (const section of sections.slice(0, 6)) { // limit to first 6 sections to stay within doc limits
        for (let day = 1; day <= 5; day++) {
          const daySubjects = pickN(subjectIds, Math.min(periodsPerDay, subjectIds.length));
          for (let p = 0; p < daySubjects.length; p++) {
            const startMinutes = startHour * 60 + p * (lessonMin + 5);
            const startH = Math.floor(startMinutes / 60);
            const startM = startMinutes % 60;
            const endMinutes = startMinutes + lessonMin;
            const endH = Math.floor(endMinutes / 60);
            const endM = endMinutes % 60;
            const teacherForSlot = teachers[p % teachers.length];

            await ctx.db.insert('timetableSlots', {
              schoolId,
              sectionId: section._id,
              subjectId: daySubjects[p],
              teacherId: teacherForSlot._id,
              dayOfWeek: day,
              startTime: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
              endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
              room: section.roomNumber ?? `R${day}${p}`,
              termId: currentTerm?._id,
              createdAt: now,
              updatedAt: now,
            });
            totalSlots++;
          }
        }
      }

      // ── Attendance (15 school days in current term) ──
      const attendanceDays = currentTerm
        ? getSchoolDays(
            new Date(currentTerm.startDate).toISOString().split('T')[0],
            new Date(currentTerm.startDate + 21 * 86400000).toISOString().split('T')[0],
          ).slice(0, 15)
        : [];

      for (const student of students) {
        for (const day of attendanceDays) {
          await ctx.db.insert('attendance', {
            schoolId,
            studentId: student._id,
            sectionId: student.currentSectionId!,
            date: day,
            status: attendanceStatus(),
            markedBy: teacherUser._id,
            termId: currentTerm?._id,
            createdAt: now,
            updatedAt: now,
          });
          totalAttendance++;
        }
      }
    }

    return {
      status: 'success',
      message: `Phase 3 complete: ${totalSubjects} subjects, ${totalAssignments} assignments, ${totalSlots} timetable slots, ${totalAttendance} attendance records`,
    };
  },
});

// ════════════════════════════════════════════════════════════════════════
// Phase 4: Exams — Exam Sessions & Results
// ════════════════════════════════════════════════════════════════════════

export const seedPhase4_Exams = internalMutation({
  handler: async (ctx) => {
    const schools = await ctx.db.query('schools').collect();
    if (schools.length === 0) return { status: 'error', message: 'Run Phase 1 first' };

    const now = Date.now();
    let totalSessions = 0;
    let totalResults = 0;

    for (let si = 0; si < schools.length; si++) {
      const school = schools[si];
      const schoolId = school._id;
      const terms = await ctx.db.query('terms')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const closedOrActiveTerm = terms.find(t => t.status === 'closed') || terms.find(t => t.isCurrent);
      if (!closedOrActiveTerm) continue;

      const sections = await ctx.db.query('sections')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const subjects = await ctx.db.query('subjects')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const students = await ctx.db.query('students')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const users = await ctx.db.query('users')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const teacherUser = users.find(u => u.role === 'teacher') || users[0];

      // Create exam sessions for the closed/active term
      const sessionDefs = [
        { name: 'Class Test 1', type: 'class_test' as const, locked: true },
        { name: 'Mid-Term Examination', type: 'mid_term' as const, locked: true },
        { name: 'End of Term Examination', type: 'end_of_term' as const, locked: si === 0 }, // only locked for first school
      ];

      for (const sDef of sessionDefs) {
        const sessionId = await ctx.db.insert('examSessions', {
          schoolId,
          name: `${sDef.name} - ${closedOrActiveTerm.name}`,
          termId: closedOrActiveTerm._id,
          type: sDef.type,
          startDate: closedOrActiveTerm.startDate + (sDef.type === 'class_test' ? 14 : sDef.type === 'mid_term' ? 35 : 70) * 86400000,
          endDate: closedOrActiveTerm.startDate + (sDef.type === 'class_test' ? 15 : sDef.type === 'mid_term' ? 38 : 77) * 86400000,
          isLocked: sDef.locked,
          createdAt: now,
          updatedAt: now,
        });
        totalSessions++;

        // Exam results — each student gets results for 5-6 subjects
        const coreSubjects = subjects.filter(s => s.isCore).slice(0, 4);
        const electiveSubjects = subjects.filter(s => !s.isCore).slice(0, 2);
        const examSubjects = [...coreSubjects, ...electiveSubjects];

        for (const student of students) {
          const section = sections.find(s => s._id === student.currentSectionId);
          if (!section) continue;

          for (const subject of examSubjects) {
            // Check if subject applies to this student's grade
            if (subject.gradeIds && !subject.gradeIds.includes(section.gradeId)) continue;

            const maxMarks = sDef.type === 'class_test' ? 40 : 100;
            const marks = randInt(
              Math.floor(maxMarks * 0.15),
              maxMarks,
            );
            const pct = (marks / maxMarks) * 100;
            const grade = school.gradingMode === 'gpa' ? getGpaGrade(pct) : getEczGrade(pct);

            await ctx.db.insert('examResults', {
              schoolId,
              examSessionId: sessionId,
              studentId: student._id,
              subjectId: subject._id,
              sectionId: student.currentSectionId!,
              marksObtained: marks,
              maxMarks,
              grade,
              enteredBy: teacherUser._id,
              isLocked: sDef.locked,
              createdAt: now,
              updatedAt: now,
            });
            totalResults++;
          }
        }
      }
    }

    return {
      status: 'success',
      message: `Phase 4 complete: ${totalSessions} exam sessions, ${totalResults} exam results`,
    };
  },
});

// ════════════════════════════════════════════════════════════════════════
// Phase 5: Finance — Fee Structures, Invoices, Payments, Scholarships, Credit Notes, Ledger
// ════════════════════════════════════════════════════════════════════════

export const seedPhase5_Finance = internalMutation({
  handler: async (ctx) => {
    const schools = await ctx.db.query('schools').collect();
    if (schools.length === 0) return { status: 'error', message: 'Run Phase 1 first' };

    const now = Date.now();
    const schoolCodes = ['KBSS', 'CS', 'EHC'];
    resetInvCounter();
    resetReceiptCounter();
    let totalStructures = 0;
    let totalInvoices = 0;
    let totalPayments = 0;
    let totalScholarships = 0;
    let totalCreditNotes = 0;
    let totalLedgerEntries = 0;
    let totalAuditEntries = 0;

    for (let si = 0; si < schools.length; si++) {
      const school = schools[si];
      const schoolId = school._id;
      const grades = await ctx.db.query('grades')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const terms = await ctx.db.query('terms')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const currentTerm = terms.find(t => t.isCurrent) || terms[0];
      const students = await ctx.db.query('students')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const guardians = await ctx.db.query('guardians')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const users = await ctx.db.query('users')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const bursarUser = users.find(u => u.role === 'bursar') || users.find(u => u.role === 'school_admin') || users[0];

      const feeTypes = school.feeTypes || [];
      const tierKey = si === 0 ? 'high' : si === 1 ? 'mid' : 'high';

      // ── Fee Structures (per grade, per term) ──
      for (const grade of grades) {
        for (const ft of feeTypes) {
          const amountMap = FEE_AMOUNTS[ft.id];
          if (!amountMap) continue;
          const amount = amountMap[tierKey] ?? amountMap['mid'] ?? 1000;

          await ctx.db.insert('feeStructures', {
            schoolId,
            termId: currentTerm._id,
            gradeId: grade._id,
            feeTypeId: ft.id,
            boardingStatus: ft.appliesToBoarding === 'boarding_only' ? 'boarding'
              : ft.appliesToBoarding === 'day_only' ? 'day' : 'all',
            amountZMW: amount,
            earlyPaymentDiscount: ft.id === 'tuition' ? {
              deadlineDate: new Date(currentTerm.startDate + 14 * 86400000).toISOString().split('T')[0],
              discountPercent: 5,
            } : undefined,
            instalmentSchedule: ft.id === 'tuition' ? [
              { dueDate: new Date(currentTerm.startDate).toISOString().split('T')[0], amountZMW: Math.round(amount * 0.5), label: '1st Instalment' },
              { dueDate: new Date(currentTerm.startDate + 30 * 86400000).toISOString().split('T')[0], amountZMW: Math.round(amount * 0.3), label: '2nd Instalment' },
              { dueDate: new Date(currentTerm.startDate + 60 * 86400000).toISOString().split('T')[0], amountZMW: Math.round(amount * 0.2), label: '3rd Instalment' },
            ] : undefined,
            createdAt: now,
            updatedAt: now,
          });
          totalStructures++;
        }
      }

      // ── Invoices & Payments for each student ──
      for (const student of students) {
        const guardian = guardians.find(g =>
          student.guardianLinks?.some(gl => gl.guardianId === g._id)
        );
        const grade = grades.find(g => g._id === student.currentGradeId);
        if (!grade) continue;

        const isBoarder = student.boardingStatus === 'boarder';
        const applicableFeeTypes = feeTypes.filter(ft => {
          if (ft.appliesToBoarding === 'boarding_only' && !isBoarder) return false;
          if (ft.appliesToBoarding === 'day_only' && isBoarder) return false;
          return ft.isActive;
        });

        const lineItems = applicableFeeTypes.map(ft => {
          const amountMap = FEE_AMOUNTS[ft.id];
          const amount = amountMap ? (amountMap[tierKey] ?? 1000) : 500;
          return {
            description: ft.name,
            quantity: 1,
            unitPriceZMW: amount,
            totalZMW: amount,
            feeTypeId: ft.id,
            vatCategory: ft.zraVatCategory,
            vatZMW: ft.zraVatCategory === 'standard' ? Math.round(amount * 0.16) : 0,
          };
        });

        const subtotal = lineItems.reduce((sum, li) => sum + li.totalZMW, 0);
        const vat = lineItems.reduce((sum, li) => sum + li.vatZMW, 0);
        const total = subtotal + vat;

        // Randomize payment status
        const paymentRand = Math.random();
        let paidAmount = 0;
        let status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'void' = 'sent';
        if (paymentRand < 0.35) {
          paidAmount = total;
          status = 'paid';
        } else if (paymentRand < 0.65) {
          paidAmount = Math.round(total * (0.3 + Math.random() * 0.5));
          status = 'partial';
        } else if (paymentRand < 0.85) {
          paidAmount = 0;
          status = 'overdue';
        } else {
          paidAmount = 0;
          status = 'sent';
        }

        const invoiceNumber = nextInvoiceNumber(schoolCodes[si]);
        const dueDate = currentTerm.startDate + 30 * 86400000;

        const invoiceId = await ctx.db.insert('invoices', {
          schoolId,
          studentId: student._id,
          guardianId: guardian?._id,
          termId: currentTerm._id,
          invoiceNumber,
          lineItems,
          subtotalZMW: subtotal,
          vatZMW: vat,
          discountZMW: 0,
          siblingDiscountZMW: 0,
          earlyPaymentDiscountZMW: 0,
          totalZMW: total,
          paidZMW: paidAmount,
          balanceZMW: total - paidAmount,
          status,
          dueDate,
          zraStatus: Math.random() > 0.3 ? 'accepted' : 'pending',
          zraFiscalCode: Math.random() > 0.3 ? `ZRA-${invoiceNumber}` : undefined,
          isMockFiscalCode: true,
          issuedBy: bursarUser._id,
          createdAt: now,
          updatedAt: now,
        });
        totalInvoices++;

        // Audit log for invoice creation
        await ctx.db.insert('feeAuditLog', {
          schoolId,
          action: 'invoice_created',
          performedBy: bursarUser._id,
          relatedInvoiceId: invoiceId,
          relatedStudentId: student._id,
          amountZMW: total,
          notes: `Invoice ${invoiceNumber} created for ${student.firstName} ${student.lastName}`,
          createdAt: now,
        });
        totalAuditEntries++;

        // Guardian ledger entry for invoice
        if (guardian) {
          await ctx.db.insert('guardianLedger', {
            schoolId,
            guardianId: guardian._id,
            studentId: student._id,
            termId: currentTerm._id,
            entryType: 'invoice',
            description: `Invoice ${invoiceNumber}`,
            debitZMW: total,
            creditZMW: 0,
            balanceAfterZMW: total,
            referenceId: invoiceId,
            transactionDate: new Date(now).toISOString().split('T')[0],
            createdAt: now,
          });
          totalLedgerEntries++;
        }

        // ── Payments ──
        if (paidAmount > 0) {
          const numPayments = paidAmount === total ? (Math.random() > 0.5 ? 1 : 2) : 1;
          let remaining = paidAmount;

          for (let p = 0; p < numPayments; p++) {
            const payAmount = p === numPayments - 1 ? remaining : Math.round(remaining * 0.6);
            remaining -= payAmount;
            const method = pick(['cash', 'bank_transfer', 'airtel_money', 'mtn_momo', 'cash', 'cash'] as const);
            const receiptNum = nextReceiptNumber(schoolCodes[si]);

            const paymentId = await ctx.db.insert('payments', {
              schoolId,
              invoiceId,
              studentId: student._id,
              amountZMW: payAmount,
              method,
              reference: `REF-${randInt(100000, 999999)}`,
              mobileMoneyReference: method === 'airtel_money' || method === 'mtn_momo'
                ? `MM-${randInt(1000000, 9999999)}` : undefined,
              payerPhone: guardian?.phone,
              receiptNumber: receiptNum,
              status: 'confirmed',
              recordedBy: bursarUser._id,
              receivedBy: bursarUser._id,
              receivedAt: now - randInt(0, 30 * 86400000),
              confirmedAt: now - randInt(0, 28 * 86400000),
              createdAt: now,
              updatedAt: now,
            });
            totalPayments++;

            // Audit log for payment
            await ctx.db.insert('feeAuditLog', {
              schoolId,
              action: 'payment_recorded',
              performedBy: bursarUser._id,
              relatedInvoiceId: invoiceId,
              relatedPaymentId: paymentId,
              relatedStudentId: student._id,
              amountZMW: payAmount,
              notes: `Payment of ZMW ${payAmount} via ${method}. Receipt: ${receiptNum}`,
              createdAt: now,
            });
            totalAuditEntries++;

            // Guardian ledger entry for payment
            if (guardian) {
              await ctx.db.insert('guardianLedger', {
                schoolId,
                guardianId: guardian._id,
                studentId: student._id,
                termId: currentTerm._id,
                entryType: 'payment',
                description: `Payment ${receiptNum} via ${method}`,
                debitZMW: 0,
                creditZMW: payAmount,
                balanceAfterZMW: total - paidAmount,
                referenceId: paymentId,
                transactionDate: new Date(now - randInt(0, 30 * 86400000)).toISOString().split('T')[0],
                createdAt: now,
              });
              totalLedgerEntries++;
            }
          }
        }
      }

      // ── Scholarships (5-8 per school) ──
      const scholarshipStudents = pickN(students, randInt(5, 8));
      for (const student of scholarshipStudents) {
        await ctx.db.insert('scholarships', {
          schoolId,
          studentId: student._id,
          name: pick(['Academic Excellence Scholarship', 'Sports Scholarship', 'Needs-Based Bursary', 'GRZ Scholarship', 'Church Sponsorship', 'Corporate Scholarship']),
          provider: pick(['Ministry of Education', 'Zambia National Trust', 'Barclays Zambia', 'Catholic Diocese', 'School Board', 'UNICEF Zambia']),
          discountType: pick(['partial_percent', 'partial_fixed', 'full']),
          discountPercent: pick([10, 15, 20, 25, 50, 100]),
          applyToFeeTypes: ['tuition'],
          validFrom: new Date(currentTerm.startDate).toISOString().split('T')[0],
          validTo: new Date(currentTerm.endDate).toISOString().split('T')[0],
          notes: 'Auto-generated seed scholarship',
          isActive: true,
          createdAt: now,
        });
        totalScholarships++;
      }

      // ── Credit Notes (3-5 per school) ──
      const invoices = await ctx.db.query('invoices')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const paidInvoices = invoices.filter(inv => inv.status === 'paid' || inv.status === 'partial').slice(0, 5);
      for (const inv of paidInvoices.slice(0, randInt(2, 4))) {
        const guardian = guardians.find(g => g._id === inv.guardianId);
        if (!guardian) continue;
        const cnAmount = Math.round(inv.totalZMW * 0.1);
        const cnNumber = nextCreditNoteNumber(schoolCodes[si]);

        await ctx.db.insert('creditNotes', {
          schoolId,
          invoiceId: inv._id,
          studentId: inv.studentId,
          guardianId: guardian._id,
          creditNoteNumber: cnNumber,
          amountZMW: cnAmount,
          reason: pick(['Overpayment adjustment', 'Fee correction', 'Boarding status change', 'Transport route cancellation']),
          type: pick(['correction', 'overpayment_refund', 'boarding_adjustment', 'transport_adjustment']),
          authorisedBy: bursarUser._id,
          status: 'issued',
          createdAt: now,
        });
        totalCreditNotes++;
      }

      // ── Unallocated Payments (2-3 per school) ──
      for (let u = 0; u < randInt(2, 3); u++) {
        await ctx.db.insert('unallocatedPayments', {
          schoolId,
          source: pick(['airtel_money', 'mtn_momo']),
          transactionId: `TXN-${randInt(10000000, 99999999)}`,
          payerPhone: phone(),
          amountZMW: randInt(500, 5000),
          receivedAt: now - randInt(0, 7 * 86400000),
          rawPayload: JSON.stringify({ type: 'mobile_money', status: 'complete' }),
          status: 'unresolved',
        });
      }
    }

    return {
      status: 'success',
      message: `Phase 5 complete: ${totalStructures} fee structures, ${totalInvoices} invoices, ${totalPayments} payments, ${totalScholarships} scholarships, ${totalCreditNotes} credit notes, ${totalLedgerEntries} ledger entries, ${totalAuditEntries} audit log entries`,
    };
  },
});

// ════════════════════════════════════════════════════════════════════════
// Phase 6: Extras — Boarding, Transport, Library, LMS, Notifications
// ════════════════════════════════════════════════════════════════════════

export const seedPhase6_Extras = internalMutation({
  handler: async (ctx) => {
    const schools = await ctx.db.query('schools').collect();
    if (schools.length === 0) return { status: 'error', message: 'Run Phase 1 first' };

    const now = Date.now();
    let counts = {
      hostelBlocks: 0, rooms: 0, sickBay: 0, visitors: 0,
      pocketAccounts: 0, pocketTxns: 0,
      routes: 0, vehicles: 0, gpsPings: 0,
      books: 0, issues: 0,
      courses: 0, modules: 0, lessons: 0, submissions: 0,
      notifications: 0,
    };

    for (let si = 0; si < schools.length; si++) {
      const school = schools[si];
      const schoolId = school._id;
      const students = await ctx.db.query('students')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const staffList = await ctx.db.query('staff')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const users = await ctx.db.query('users')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const subjects = await ctx.db.query('subjects')
        .withIndex('by_school', q => q.eq('schoolId', schoolId))
        .collect();
      const matrons = staffList.filter(s => s.role === 'matron');
      const drivers = staffList.filter(s => s.role === 'driver');
      const teachers = staffList.filter(s => s.role === 'teacher');
      const adminUser = users.find(u => u.role === 'school_admin') || users[0];
      const boarderStudents = students.filter(s => s.boardingStatus === 'boarder');

      // ══ BOARDING (for schools with boarding feature) ══
      if (school.enabledFeatures.includes('BOARDING') && boarderStudents.length > 0) {
        const blockDefs = school.type === 'secondary_boarding'
          ? [
              { name: 'Eagle Block', gender: 'male' as const, capacity: 80 },
              { name: 'Falcon Block', gender: 'male' as const, capacity: 60 },
            ]
          : [
              { name: 'Sunrise Block', gender: 'female' as const, capacity: 60 },
              { name: 'Moonlight Block', gender: 'male' as const, capacity: 60 },
              { name: 'Starlight Block', gender: 'mixed' as const, capacity: 40 },
            ];

        const blockIds: Id<'hostelBlocks'>[] = [];
        for (const bd of blockDefs) {
          const blockId = await ctx.db.insert('hostelBlocks', {
            schoolId,
            name: bd.name,
            gender: bd.gender,
            capacity: bd.capacity,
            matronId: matrons.length > 0 ? matrons[counts.hostelBlocks % matrons.length]._id : undefined,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
          blockIds.push(blockId);
          counts.hostelBlocks++;

          // Rooms per block
          const numRooms = Math.ceil(bd.capacity / 8);
          for (let r = 0; r < numRooms; r++) {
            const roomId = await ctx.db.insert('rooms', {
              schoolId,
              hostelBlockId: blockId,
              name: `${bd.name.charAt(0)}${String(r + 1).padStart(2, '0')}`,
              capacity: 8,
              currentOccupancy: randInt(4, 8),
              isActive: true,
              createdAt: now,
              updatedAt: now,
            });
            counts.rooms++;

            // Assign some boarders to rooms
            const unassigned = boarderStudents.filter(s => !s.roomId).slice(0, randInt(3, 6));
            for (const student of unassigned) {
              await ctx.db.patch(student._id, {
                roomId,
                bedNumber: `Bed ${randInt(1, 8)}`,
              });
            }
          }
        }

        // Sick Bay Admissions (5-10 per boarding school)
        for (let sb = 0; sb < randInt(5, 10); sb++) {
          const student = pick(boarderStudents);
          await ctx.db.insert('sickBayAdmissions', {
            schoolId,
            studentId: student._id,
            admittedAt: now - randInt(1, 30) * 86400000,
            dischargedAt: Math.random() > 0.3 ? now - randInt(0, 5) * 86400000 : undefined,
            complaint: pick(['Headache', 'Malaria symptoms', 'Stomach ache', 'Fever', 'Injury during sports', 'Flu symptoms', 'Allergic reaction', 'Toothache']),
            treatment: pick(['Paracetamol administered', 'Referred to clinic', 'Rest and fluids', 'First aid applied', 'Anti-malarial given', 'Observation only']),
            notes: Math.random() > 0.5 ? 'Guardian notified via SMS' : undefined,
            admittedBy: adminUser._id,
            createdAt: now,
            updatedAt: now,
          });
          counts.sickBay++;
        }

        // Visitor Log (8-15 entries per school)
        for (let vl = 0; vl < randInt(8, 15); vl++) {
          const student = pick(boarderStudents);
          const checkIn = now - randInt(0, 14) * 86400000;
          await ctx.db.insert('visitorLog', {
            schoolId,
            studentId: student._id,
            visitorName: `${pick(MALE_NAMES)} ${pick(LAST_NAMES)}`,
            relationship: pick(['Parent', 'Uncle', 'Aunt', 'Sibling', 'Family friend', 'Guardian']),
            phone: phone(),
            purpose: pick(['Bring supplies', 'Check on student', 'Medical visit', 'Birthday visit', 'Collect for weekend', 'Deliver pocket money']),
            checkInAt: checkIn,
            checkOutAt: Math.random() > 0.15 ? checkIn + randInt(30, 180) * 60000 : undefined,
            approvedBy: adminUser._id,
            createdAt: now,
            updatedAt: now,
          });
          counts.visitors++;
        }

        // Pocket Money Accounts & Transactions
        for (const student of boarderStudents.slice(0, Math.min(30, boarderStudents.length))) {
          const balance = randInt(50, 500);
          const accountId = await ctx.db.insert('pocketMoneyAccounts', {
            schoolId,
            studentId: student._id,
            balance,
            createdAt: now,
            updatedAt: now,
          });
          counts.pocketAccounts++;

          // 2-5 transactions per account
          for (let t = 0; t < randInt(2, 5); t++) {
            const isDeposit = Math.random() > 0.4;
            await ctx.db.insert('pocketMoneyTransactions', {
              schoolId,
              accountId,
              type: isDeposit ? 'deposit' : 'withdrawal',
              amount: isDeposit ? randInt(50, 300) : randInt(10, 100),
              description: isDeposit
                ? pick(['Guardian deposit', 'Birthday money', 'Allowance top-up'])
                : pick(['Tuck shop purchase', 'Stationery', 'Snacks', 'Toiletries']),
              processedBy: adminUser._id,
              createdAt: now - randInt(0, 30) * 86400000,
            });
            counts.pocketTxns++;
          }
        }
      }

      // ══ TRANSPORT ══
      if (school.enabledFeatures.includes('TRANSPORT')) {
        const vehicleDefs = [
          { reg: `ALU ${randInt(1000, 9999)} ZM`, make: 'Toyota', model: 'Coaster', capacity: 30 },
          { reg: `ALU ${randInt(1000, 9999)} ZM`, make: 'Isuzu', model: 'NQR', capacity: 45 },
          { reg: `ALU ${randInt(1000, 9999)} ZM`, make: 'Toyota', model: 'HiAce', capacity: 15 },
        ];

        const vehicleIds: Id<'vehicles'>[] = [];
        for (let v = 0; v < vehicleDefs.length; v++) {
          const vd = vehicleDefs[v];
          const vid = await ctx.db.insert('vehicles', {
            schoolId,
            registrationNumber: vd.reg,
            make: vd.make,
            model: vd.model,
            capacity: vd.capacity,
            driverId: drivers.length > 0 ? drivers[v % drivers.length]._id : undefined,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
          vehicleIds.push(vid);
          counts.vehicles++;
        }

        // Routes
        const routeDefs = [
          {
            name: 'Kabulonga - Woodlands Route',
            stops: [
              { name: 'School Gate', pickupTime: '06:30', dropoffTime: '16:30' },
              { name: 'Kabulonga Roundabout', pickupTime: '06:45', dropoffTime: '16:15' },
              { name: 'Woodlands Mall', pickupTime: '07:00', dropoffTime: '16:00' },
              { name: 'PHI Area', pickupTime: '07:10', dropoffTime: '15:50' },
            ],
          },
          {
            name: 'Chelstone - Roma Route',
            stops: [
              { name: 'School Gate', pickupTime: '06:20', dropoffTime: '16:40' },
              { name: 'Chelstone Market', pickupTime: '06:40', dropoffTime: '16:20' },
              { name: 'Roma Park', pickupTime: '06:55', dropoffTime: '16:05' },
              { name: 'Northmead', pickupTime: '07:05', dropoffTime: '15:55' },
            ],
          },
          {
            name: 'Kabwata - Chilenje Route',
            stops: [
              { name: 'School Gate', pickupTime: '06:15', dropoffTime: '16:45' },
              { name: 'Kabwata Market', pickupTime: '06:35', dropoffTime: '16:25' },
              { name: 'Chilenje South', pickupTime: '06:50', dropoffTime: '16:10' },
            ],
          },
        ];

        for (let ri = 0; ri < routeDefs.length; ri++) {
          const rd = routeDefs[ri];
          const routeId = await ctx.db.insert('routes', {
            schoolId,
            name: rd.name,
            driverId: drivers.length > 0 ? drivers[ri % drivers.length]._id : undefined,
            vehicleId: vehicleIds[ri % vehicleIds.length],
            stops: rd.stops.map(s => ({
              name: s.name,
              pickupTime: s.pickupTime,
              dropoffTime: s.dropoffTime,
              lat: -15.4 + Math.random() * 0.1,
              lng: 28.28 + Math.random() * 0.1,
            })),
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
          counts.routes++;

          // Assign some day students to this route
          const dayStudents = students.filter(s => s.boardingStatus === 'day' && !s.routeId);
          for (const student of dayStudents.slice(0, randInt(5, 10))) {
            await ctx.db.patch(student._id, {
              routeId,
              pickupPoint: pick(rd.stops.map(s => s.name)),
            });
          }
        }

        // GPS Pings (simulated recent pings for each vehicle)
        for (const vid of vehicleIds) {
          for (let p = 0; p < 20; p++) {
            await ctx.db.insert('gpsPings', {
              schoolId,
              vehicleId: vid,
              lat: -15.38 + Math.random() * 0.08,
              lng: 28.28 + Math.random() * 0.08,
              speed: randInt(0, 60),
              heading: randInt(0, 360),
              timestamp: now - (20 - p) * 60000,
            });
            counts.gpsPings++;
          }
        }
      }

      // ══ LIBRARY ══
      if (school.enabledFeatures.includes('LIBRARY')) {
        const bookIds: Id<'libraryBooks'>[] = [];
        for (const book of BOOK_TITLES) {
          const bid = await ctx.db.insert('libraryBooks', {
            schoolId,
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            category: book.category,
            copies: randInt(3, 15),
            availableCopies: randInt(1, 10),
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
          bookIds.push(bid);
          counts.books++;
        }

        // Library Issues (10-20 per school)
        const studentUsers = users.filter(u => u.role === 'student');
        const librarianUser = users.find(u => u.role === 'librarian') || adminUser;
        const borrowers = studentUsers.length > 0 ? studentUsers : users.slice(0, 10);
        for (let li = 0; li < randInt(10, 20); li++) {
          const borrower = pick(borrowers);
          const issuedAt = now - randInt(1, 30) * 86400000;
          await ctx.db.insert('libraryIssues', {
            schoolId,
            bookId: pick(bookIds),
            borrowerId: borrower._id,
            issuedAt,
            dueDate: issuedAt + 14 * 86400000,
            returnedAt: Math.random() > 0.4 ? issuedAt + randInt(3, 14) * 86400000 : undefined,
            issuedBy: librarianUser._id,
            createdAt: now,
            updatedAt: now,
          });
          counts.issues++;
        }
      }

      // ══ LMS ══
      if (school.enabledFeatures.includes('LMS') && teachers.length > 0) {
        const lmsSubjects = subjects.slice(0, Math.min(4, subjects.length));
        for (const subject of lmsSubjects) {
          const teacher = teachers[counts.courses % teachers.length];
          const courseId = await ctx.db.insert('lmsCourses', {
            schoolId,
            subjectId: subject._id,
            name: `${subject.name} - Online Course`,
            description: `Comprehensive ${subject.name} course covering the full syllabus for the current academic year.`,
            teacherId: teacher._id,
            isPublished: Math.random() > 0.2,
            createdAt: now,
            updatedAt: now,
          });
          counts.courses++;

          // 3-4 modules per course
          for (let m = 0; m < randInt(3, 4); m++) {
            const moduleId = await ctx.db.insert('lmsModules', {
              schoolId,
              courseId,
              name: `Module ${m + 1}: ${pick(['Introduction', 'Fundamentals', 'Advanced Topics', 'Practice & Review', 'Applications', 'Theory'])}`,
              sortOrder: m,
              createdAt: now,
              updatedAt: now,
            });
            counts.modules++;

            // 2-3 lessons per module
            for (let l = 0; l < randInt(2, 3); l++) {
              const contentType = pick(['text', 'video', 'file', 'quiz'] as const);
              const lessonId = await ctx.db.insert('lmsLessons', {
                schoolId,
                moduleId,
                title: `Lesson ${l + 1}: ${pick(['Concepts Overview', 'Key Definitions', 'Worked Examples', 'Practice Questions', 'Video Tutorial', 'Case Study'])}`,
                contentType,
                content: contentType === 'text' ? `This is sample lesson content for ${subject.name}. In a real environment, this would contain rich text content with explanations, examples, and diagrams.` : undefined,
                sortOrder: l,
                createdAt: now,
                updatedAt: now,
              });
              counts.lessons++;

              // 3-5 submissions per lesson (from random students)
              const submittingStudents = pickN(students, randInt(3, 5));
              for (const student of submittingStudents) {
                await ctx.db.insert('lmsSubmissions', {
                  schoolId,
                  lessonId,
                  studentId: student._id,
                  content: 'Sample student submission for the lesson activity.',
                  grade: Math.random() > 0.3 ? randInt(40, 100) : undefined,
                  feedback: Math.random() > 0.5 ? pick(['Good work!', 'Needs improvement', 'Excellent effort', 'Please review section 2', 'Well done, keep it up']) : undefined,
                  submittedAt: now - randInt(0, 14) * 86400000,
                  gradedAt: Math.random() > 0.4 ? now - randInt(0, 7) * 86400000 : undefined,
                  gradedBy: Math.random() > 0.4 ? (users.find(u => u.staffId === teacher._id)?._id || adminUser._id) : undefined,
                  createdAt: now,
                  updatedAt: now,
                });
                counts.submissions++;
              }
            }
          }
        }
      }

      // ══ NOTIFICATIONS (mixed types) ══
      const notifDefs = [
        { type: 'attendance' as const, title: 'Absence Alert', body: 'Your child was marked absent today.' },
        { type: 'fees' as const, title: 'Fee Reminder', body: 'Fees are due within 7 days. Please make payment.' },
        { type: 'fees' as const, title: 'Payment Received', body: 'Your payment has been received. Thank you.' },
        { type: 'results' as const, title: 'Exam Results Published', body: 'End of term exam results are now available.' },
        { type: 'general' as const, title: 'School Notice', body: 'Mid-term break starts next Monday.' },
        { type: 'general' as const, title: 'Sports Day Reminder', body: 'Annual sports day is this Saturday.' },
        { type: 'emergency' as const, title: 'Early Dismissal', body: 'School will close early today due to weather.' },
        { type: 'attendance' as const, title: 'Late Arrival', body: 'Your child arrived late today at 08:15.' },
        { type: 'fees' as const, title: 'Overdue Notice', body: 'Fees are overdue. Please settle to avoid service disruption.' },
        { type: 'general' as const, title: 'Welcome Back', body: 'Welcome back to Term 2! Classes resume on Monday.' },
      ];

      const guardianUsers = users.filter(u => u.role === 'guardian');
      for (let n = 0; n < Math.min(40, guardianUsers.length * 3); n++) {
        const notif = pick(notifDefs);
        const recipient = pick(guardianUsers);
        await ctx.db.insert('notifications', {
          schoolId,
          userId: recipient._id,
          recipientPhone: recipient.phone,
          type: notif.type,
          channel: pick(['in_app', 'sms']),
          title: notif.title,
          body: notif.body,
          isRead: Math.random() > 0.4,
          status: pick(['sent', 'delivered', 'delivered', 'delivered']),
          provider: Math.random() > 0.5 ? 'airtel' : 'mtn',
          createdAt: now - randInt(0, 30) * 86400000,
        });
        counts.notifications++;
      }
    }

    return {
      status: 'success',
      message: `Phase 6 complete: ${counts.hostelBlocks} hostel blocks, ${counts.rooms} rooms, ${counts.sickBay} sick bay, ${counts.visitors} visitors, ${counts.pocketAccounts} pocket money accounts, ${counts.pocketTxns} pocket money txns, ${counts.routes} routes, ${counts.vehicles} vehicles, ${counts.gpsPings} GPS pings, ${counts.books} books, ${counts.issues} library issues, ${counts.courses} LMS courses, ${counts.modules} modules, ${counts.lessons} lessons, ${counts.submissions} submissions, ${counts.notifications} notifications`,
    };
  },
});

// ════════════════════════════════════════════════════════════════════════
// Clear All Seed Data — Wipes every table in batches to avoid limits
// ════════════════════════════════════════════════════════════════════════

export const clearTableBatch = internalMutation({
  args: { table: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { table, limit = 500 }) => {
    // @ts-ignore - dynamic table access
    const docs = await ctx.db.query(table).take(limit);
    for (const doc of docs) {
      // @ts-ignore
      await ctx.db.delete(doc._id);
    }
    return { deleted: docs.length, table, hasMore: docs.length === limit };
  },
});

export const clearAllData = internalAction({
  handler: async (ctx): Promise<Record<string, unknown>> => {
    const tables = [
      'lmsSubmissions', 'lmsLessons', 'lmsModules', 'lmsCourses',
      'libraryIssues', 'libraryBooks',
      'gpsPings', 'routes', 'vehicles',
      'pocketMoneyTransactions', 'pocketMoneyAccounts',
      'visitorLog', 'sickBayAdmissions', 'rooms', 'hostelBlocks',
      'notifications', 'reminderLog',
      'feeAuditLog', 'guardianLedger', 'creditNotes',
      'unallocatedPayments', 'bankStatementImports',
      'consolidatedInvoices', 'scholarships',
      'payments', 'invoiceRuns', 'invoices', 'feeStructures',
      'examResults', 'examSessions',
      'attendance',
      'timetableSlots', 'staffSubjectAssignments', 'sectionHistory',
      'schoolEvents', 'counters',
      'subjects', 'sections', 'grades',
      'terms', 'academicYears',
      'platformAdmins', 'students', 'guardians', 'staff', 'users',
      'schools',
    ];

    let totalDeleted = 0;
    for (const table of tables) {
      let hasMore = true;
      let batchCount = 0;
      while (hasMore && batchCount < 20) { // safety limit
        const result = await ctx.runMutation(internal.seedComprehensive.clearTableBatch, { table, limit: 500 }) as { deleted: number; hasMore: boolean };
        totalDeleted += result.deleted;
        hasMore = result.hasMore;
        batchCount++;
        if (result.deleted > 0) {
          console.warn(`Deleted ${result.deleted} from ${table}`);
        }
      }
    }

    return { status: 'success', message: `Cleared ${totalDeleted} documents` };
  },
});

// ════════════════════════════════════════════════════════════════════════
// Orchestrator — Run all phases in sequence
// ════════════════════════════════════════════════════════════════════════

export const seedAll = internalAction({
  handler: async (ctx): Promise<Record<string, unknown>> => {
    console.warn('🌱 Starting comprehensive seed...');

    const r1: Record<string, unknown> = await ctx.runMutation(internal.seedComprehensive.seedPhase1_Core) as Record<string, unknown>;
    console.warn('Phase 1:', JSON.stringify(r1));
    if (r1?.status === 'skipped') return r1;

    const r2: Record<string, unknown> = await ctx.runMutation(internal.seedComprehensive.seedPhase2_People) as Record<string, unknown>;
    console.warn('Phase 2:', JSON.stringify(r2));

    const r3: Record<string, unknown> = await ctx.runMutation(internal.seedComprehensive.seedPhase3_Academics) as Record<string, unknown>;
    console.warn('Phase 3:', JSON.stringify(r3));

    const r4: Record<string, unknown> = await ctx.runMutation(internal.seedComprehensive.seedPhase4_Exams) as Record<string, unknown>;
    console.warn('Phase 4:', JSON.stringify(r4));

    const r5: Record<string, unknown> = await ctx.runMutation(internal.seedComprehensive.seedPhase5_Finance) as Record<string, unknown>;
    console.warn('Phase 5:', JSON.stringify(r5));

    const r6: Record<string, unknown> = await ctx.runMutation(internal.seedComprehensive.seedPhase6_Extras) as Record<string, unknown>;
    console.warn('Phase 6:', JSON.stringify(r6));

    console.warn('🌱 Comprehensive seed complete!');
    return {
      status: 'success',
      phases: { p1: r1, p2: r2, p3: r3, p4: r4, p5: r5, p6: r6 },
    };
  },
});

// ════════════════════════════════════════════════════════════════════════
// Reset & Reseed — Clear everything and reseed from scratch
// ════════════════════════════════════════════════════════════════════════

export const resetAndReseed = internalAction({
  handler: async (ctx): Promise<Record<string, unknown>> => {
    console.warn('🗑️ Clearing all data...');
    const clearResult: Record<string, unknown> = await ctx.runAction(internal.seedComprehensive.clearAllData) as Record<string, unknown>;
    console.warn('Clear:', JSON.stringify(clearResult));

    console.warn('🌱 Re-seeding...');
    const seedResult: Record<string, unknown> = await ctx.runAction(internal.seedComprehensive.seedAll) as Record<string, unknown>;
    return seedResult;
  },
});
