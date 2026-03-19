import { internalMutation } from './_generated/server';

// Seed action to populate test data for development
// Run via Convex dashboard: npx convex run seed:seedTestData
export const seedTestData = internalMutation({
  handler: async (ctx) => {
    // Check if seed data already exists
    const existingSchool = await ctx.db
      .query('schools')
      .withIndex('by_slug', (q) => q.eq('slug', 'kabulonga'))
      .unique();

    if (existingSchool) {
      return { message: 'Seed data already exists. Skipping.' };
    }

    const now = Date.now();

    // 1. Kabulonga Boys Secondary - secondary boarding school
    const kabulongaId = await ctx.db.insert('schools', {
      name: 'Kabulonga Boys Secondary School',
      shortName: 'KBSS',
      slug: 'kabulonga',
      type: 'secondary_boarding',
      branding: {
        primaryColor: '#A51C30',
        secondaryColor: '#1E3A5F',
        motto: 'Excellence Through Discipline',
      },
      province: 'Lusaka',
      district: 'Lusaka',
      email: 'admin@kabulonga.edu.zm',
      phone: '+260211234567',
      eczCenterNumber: 'EC-001',
      gradingMode: 'ecz',
      academicMode: 'term',
      enabledFeatures: [
        'STUDENTS', 'STAFF', 'ATTENDANCE', 'FEES', 'ZRA_INVOICING',
        'GUARDIAN_PORTAL', 'SMS_NOTIFICATIONS', 'SCHOOL_CUSTOMISATION',
        'ECZ_EXAMS', 'TIMETABLE', 'BOARDING', 'POCKET_MONEY',
        'SICK_BAY', 'VISITOR_LOG', 'LIBRARY',
      ],
      subscriptionTier: 'premium',
      smsBalance: 500,
      isActive: true,
      onboardingComplete: true,
      createdAt: now,
      updatedAt: now,
    });

    // 2. Chengelo School - combined day/boarding
    const chengeloId = await ctx.db.insert('schools', {
      name: 'Chengelo School',
      shortName: 'CS',
      slug: 'chengelo',
      type: 'combined',
      branding: {
        primaryColor: '#2E7D32',
        secondaryColor: '#FFC107',
        motto: 'Empowering Futures',
      },
      province: 'Copperbelt',
      district: 'Mkushi',
      email: 'admin@chengelo.edu.zm',
      phone: '+260215234567',
      gradingMode: 'ecz',
      academicMode: 'term',
      enabledFeatures: [
        'STUDENTS', 'STAFF', 'ATTENDANCE', 'FEES',
        'GUARDIAN_PORTAL', 'SMS_NOTIFICATIONS', 'SCHOOL_CUSTOMISATION',
        'ECZ_EXAMS', 'TIMETABLE', 'BOARDING', 'TRANSPORT',
        'LIBRARY', 'LMS',
      ],
      subscriptionTier: 'standard',
      smsBalance: 200,
      isActive: true,
      onboardingComplete: true,
      createdAt: now,
      updatedAt: now,
    });

    // 3. Evelyn Hone College - HEA college
    const evelynHoneId = await ctx.db.insert('schools', {
      name: 'Evelyn Hone College',
      shortName: 'EHC',
      slug: 'evelyn-hone',
      type: 'college',
      branding: {
        primaryColor: '#1565C0',
        secondaryColor: '#E8EAF6',
        motto: 'Skills for the Future',
      },
      province: 'Lusaka',
      district: 'Lusaka',
      email: 'admin@evelynhone.edu.zm',
      phone: '+260211345678',
      heaCode: 'HEA-001',
      gradingMode: 'gpa',
      academicMode: 'semester',
      enabledFeatures: [
        'STUDENTS', 'STAFF', 'ATTENDANCE', 'FEES', 'ZRA_INVOICING',
        'GUARDIAN_PORTAL', 'SCHOOL_CUSTOMISATION',
        'SEMESTER_SYSTEM', 'GPA', 'HEA_COMPLIANCE',
        'LMS', 'LIBRARY', 'ELIBRARY',
      ],
      subscriptionTier: 'premium',
      smsBalance: 1000,
      isActive: true,
      onboardingComplete: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      message: 'Seed data created successfully',
      schools: {
        kabulonga: kabulongaId,
        chengelo: chengeloId,
        evelynHone: evelynHoneId,
      },
    };
  },
});
