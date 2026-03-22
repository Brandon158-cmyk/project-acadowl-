import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// ── Shared Validators ──

export const Role = v.union(
  v.literal('platform_admin'),
  v.literal('school_admin'),
  v.literal('deputy_head'),
  v.literal('bursar'),
  v.literal('teacher'),
  v.literal('class_teacher'),
  v.literal('matron'),
  v.literal('librarian'),
  v.literal('driver'),
  v.literal('guardian'),
  v.literal('student'),
);

export const SchoolType = v.union(
  v.literal('primary_day'),
  v.literal('primary_boarding'),
  v.literal('secondary_day'),
  v.literal('secondary_boarding'),
  v.literal('mixed_secondary'),
  v.literal('combined'),
  v.literal('college'),
);

export const Feature = v.union(
  // Core — always on
  v.literal('STUDENTS'),
  v.literal('STAFF'),
  v.literal('ATTENDANCE'),
  v.literal('FEES'),
  v.literal('ZRA_INVOICING'),
  v.literal('GUARDIAN_PORTAL'),
  v.literal('SMS_NOTIFICATIONS'),
  v.literal('SCHOOL_CUSTOMISATION'),
  // Academic variants
  v.literal('ECZ_EXAMS'),
  v.literal('SEMESTER_SYSTEM'),
  v.literal('GPA'),
  v.literal('HEA_COMPLIANCE'),
  v.literal('LMS'),
  v.literal('PORTFOLIO'),
  v.literal('TIMETABLE'),
  // Residential
  v.literal('BOARDING'),
  v.literal('POCKET_MONEY'),
  v.literal('SICK_BAY'),
  v.literal('VISITOR_LOG'),
  v.literal('MEAL_PLANS'),
  // Transport
  v.literal('TRANSPORT'),
  v.literal('GPS_TRACKING'),
  // Library
  v.literal('LIBRARY'),
  v.literal('ELIBRARY'),
  // Optional add-ons
  v.literal('SPORTS'),
  v.literal('CANTEEN'),
  v.literal('ASSET_MANAGEMENT'),
  v.literal('AI_INSIGHTS'),
  v.literal('PTM_SCHEDULER'),
  v.literal('PERIOD_ATTENDANCE'),
  v.literal('WHATSAPP_NOTIFICATIONS'),
);

export const SubscriptionTier = v.union(
  v.literal('free'),
  v.literal('basic'),
  v.literal('standard'),
  v.literal('premium'),
);

const EnrollmentStatus = v.union(
  v.literal('active'),
  v.literal('suspended'),
  v.literal('graduated'),
  v.literal('transferred'),
  v.literal('dropped_out'),
);

const StaffRole = v.union(
  v.literal('school_admin'),
  v.literal('deputy_head'),
  v.literal('bursar'),
  v.literal('teacher'),
  v.literal('class_teacher'),
  v.literal('matron'),
  v.literal('librarian'),
  v.literal('driver'),
  v.literal('support_staff'),
);

const AcademicYearStatus = v.union(
  v.literal('draft'),
  v.literal('active'),
  v.literal('closed'),
);

const SchoolEventType = v.union(
  v.literal('holiday'),
  v.literal('exam_period'),
  v.literal('sports_day'),
  v.literal('school_closure'),
  v.literal('parent_teacher'),
  v.literal('general'),
);

const SubjectCategory = v.union(
  v.literal('core'),
  v.literal('elective'),
  v.literal('technical'),
  v.literal('custom'),
);

// ── Schema ──

export default defineSchema({
  // ─── Core Tables ───

  schools: defineTable({
    name: v.string(),
    shortName: v.optional(v.string()),
    slug: v.string(),
    type: SchoolType,

    // Branding
    branding: v.optional(v.object({
      logoUrl: v.optional(v.string()),
      primaryColor: v.optional(v.string()),
      secondaryColor: v.optional(v.string()),
      motto: v.optional(v.string()),
    })),

    // Contact
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),

    // Location (Zambia)
    province: v.optional(v.string()),
    district: v.optional(v.string()),

    // Regulatory
    zraTpin: v.optional(v.string()),
    moeCode: v.optional(v.string()),
    heaCode: v.optional(v.string()),
    eczCenterNumber: v.optional(v.string()),

    // Academic config
    gradingMode: v.optional(v.union(v.literal('ecz'), v.literal('gpa'), v.literal('custom'))),
    academicMode: v.optional(v.union(v.literal('term'), v.literal('semester'))),
    currentAcademicYearId: v.optional(v.id('academicYears')),
    currentTermId: v.optional(v.id('terms')),
    periodConfig: v.optional(v.object({
      periodsPerDay: v.number(),
      firstPeriodStartTime: v.optional(v.string()),
      lessonDurationMinutes: v.number(),
      shortBreakMinutes: v.optional(v.number()),
      longBreakMinutes: v.optional(v.number()),
    })),
    smsTemplates: v.optional(v.object({
      absenceAlert: v.optional(v.string()),
      attendanceBroadcast: v.optional(v.string()),
      academicYearActivated: v.optional(v.string()),
      feeReminderPreDue: v.optional(v.string()),
      feeReminderDueToday: v.optional(v.string()),
      feeReminder7Day: v.optional(v.string()),
      feeReminder14Day: v.optional(v.string()),
      feeReminder21Day: v.optional(v.string()),
      paymentReceipt: v.optional(v.string()),
    })),
    gradingScales: v.optional(v.array(v.object({
      name: v.string(),
      code: v.string(),
      minScore: v.number(),
      maxScore: v.number(),
      gradeLabel: v.string(),
      points: v.optional(v.number()),
      remarks: v.optional(v.string()),
    }))),
    reportCardConfig: v.optional(v.object({
      showClassTeacherRemarks: v.boolean(),
      showPrincipalRemarks: v.boolean(),
      showAttendanceSummary: v.boolean(),
      showSubjectPositions: v.boolean(),
      showFeesDueNotice: v.optional(v.boolean()),
    })),

    // Features & subscription
    enabledFeatures: v.array(Feature),
    subscriptionTier: SubscriptionTier,
    subscriptionExpiresAt: v.optional(v.number()),

    // SMS
    smsBalance: v.optional(v.number()),

    // Custom fields for student enrolment
    customStudentFields: v.optional(v.array(v.object({
      key: v.string(),
      label: v.string(),
      type: v.union(v.literal('text'), v.literal('select'), v.literal('boolean'), v.literal('date')),
      required: v.boolean(),
      options: v.optional(v.array(v.string())),
    }))),

    // Sibling discount
    siblingDiscountRules: v.optional(v.array(v.object({
      childIndex: v.number(),
      discountPercent: v.number(),
      applyToFeeTypes: v.optional(v.array(v.string())),
    }))),

    // Fee types registry (Sprint 02 ISSUE-091)
    feeTypes: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      isRecurring: v.boolean(),
      isOptional: v.boolean(),
      appliesToBoarding: v.union(
        v.literal('day_only'),
        v.literal('boarding_only'),
        v.literal('all'),
      ),
      zraLevyCode: v.optional(v.string()),
      zraVatCategory: v.union(
        v.literal('exempt'),
        v.literal('standard'),
        v.literal('zero_rated'),
        v.literal('levy'),
      ),
      isActive: v.boolean(),
      order: v.number(),
    }))),

    // Mobile money configuration (Sprint 02 ISSUE-109)
    mobileMoneyConfig: v.optional(v.object({
      airtel: v.optional(v.object({
        merchantCode: v.string(),
        merchantName: v.string(),
        apiClientId: v.string(),
        apiSecret: v.string(),
        isActive: v.boolean(),
      })),
      mtn: v.optional(v.object({
        merchantCode: v.string(),
        apiUserId: v.string(),
        apiKey: v.string(),
        subscriptionKey: v.string(),
        callbackHost: v.string(),
        isActive: v.boolean(),
      })),
      paymentReferenceFormat: v.optional(v.string()),
      paymentInstructions: v.optional(v.string()),
    })),

    // Arrears policy (Sprint 02 ISSUE-120)
    arrearsPolicy: v.optional(v.object({
      reminderScheduleDays: v.array(v.number()),
      blockExamAccessAtDays: v.optional(v.number()),
      holdReportCardAtDays: v.optional(v.number()),
      requireFullPaymentForPromotion: v.boolean(),
      gracePeriodDays: v.number(),
      arrangementNote: v.optional(v.string()),
    })),

    // ZRA VSDC (Sprint 02 ISSUE-103)
    zraVsdcSerial: v.optional(v.string()),
    zraBranchCode: v.optional(v.string()),

    // Status
    isActive: v.boolean(),
    onboardingComplete: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id('users')),
  })
    .index('by_slug', ['slug'])
    .index('by_active', ['isActive']),

  users: defineTable({
    // Supabase Auth
    tokenIdentifier: v.string(),
    supabaseId: v.optional(v.string()),

    // Profile
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    name: v.string(),
    avatarUrl: v.optional(v.string()),

    // Role & school
    role: Role,
    schoolId: v.optional(v.id('schools')),

    // Profile links
    staffId: v.optional(v.id('staff')),
    guardianId: v.optional(v.id('guardians')),
    studentId: v.optional(v.id('students')),

    // Status
    isActive: v.boolean(),
    isFirstLogin: v.boolean(),
    lastLoginAt: v.optional(v.number()),

    // Notification preferences
    notifPrefs: v.object({
      sms: v.boolean(),
      whatsapp: v.boolean(),
      email: v.boolean(),
      inApp: v.boolean(),
    }),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_token', ['tokenIdentifier'])
    .index('by_supabase_id', ['supabaseId'])
    .index('by_school', ['schoolId'])
    .index('by_email', ['email'])
    .index('by_phone', ['phone'])
    .index('by_role', ['role']),

  // ─── Staff & People ───

  staff: defineTable({
    schoolId: v.id('schools'),
    userId: v.optional(v.id('users')),

    employeeNumber: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    gender: v.optional(v.union(v.literal('male'), v.literal('female'))),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    nrcNumber: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),

    // Employment
    role: StaffRole,
    staffCategory: v.optional(v.union(v.literal('teaching'), v.literal('non_teaching'))),
    department: v.optional(v.string()),
    contractType: v.optional(v.union(v.literal('permanent'), v.literal('contract'), v.literal('part_time'))),
    dateJoined: v.number(),
    dateLeft: v.optional(v.number()),

    // Qualifications
    qualifications: v.optional(v.array(v.string())),
    eczRegistrationNumber: v.optional(v.string()),

    // Payroll (Sprint 02+)
    bankName: v.optional(v.string()),
    bankAccountNumber: v.optional(v.string()),
    napsa: v.optional(v.string()),
    tpin: v.optional(v.string()),

    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_user', ['userId'])
    .index('by_employee_number', ['schoolId', 'employeeNumber'])
    .index('by_email', ['schoolId', 'email'])
    .index('by_phone', ['schoolId', 'phone']),

  guardians: defineTable({
    schoolId: v.id('schools'),
    userId: v.optional(v.id('users')),

    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    relationship: v.union(
      v.literal('parent'),
      v.literal('guardian'),
      v.literal('sibling'),
      v.literal('other'),
    ),
    address: v.optional(v.string()),
    preferredContactMethod: v.optional(v.union(v.literal('sms'), v.literal('whatsapp'), v.literal('email'))),
    isVerified: v.optional(v.boolean()),

    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_user', ['userId'])
    .index('by_phone', ['schoolId', 'phone']),

  students: defineTable({
    schoolId: v.id('schools'),
    userId: v.optional(v.id('users')),

    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.number(),
    gender: v.union(v.literal('male'), v.literal('female'), v.literal('other')),
    studentNumber: v.string(),
    avatarUrl: v.optional(v.string()),

    email: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Academic
    currentGradeId: v.optional(v.id('grades')),
    currentSectionId: v.optional(v.id('sections')),

    // ECZ
    eczCandidateNumber: v.optional(v.string()),

    enrollmentStatus: EnrollmentStatus,
    enrolledAt: v.optional(v.number()),

    // Guardian links (array of objects for relationship mapping)
    guardianLinks: v.optional(v.array(v.object({
      guardianId: v.id('guardians'),
      relationship: v.string(),
      isPrimary: v.boolean(),
    }))),

    // Boarding (Feature.BOARDING)
    boardingStatus: v.optional(v.union(v.literal('day'), v.literal('boarder'))),
    roomId: v.optional(v.id('rooms')),
    bedNumber: v.optional(v.string()),

    // Transport (Feature.TRANSPORT)
    routeId: v.optional(v.id('routes')),
    pickupPoint: v.optional(v.string()),

    // Health
    bloodType: v.optional(v.string()),
    allergies: v.optional(v.array(v.string())),
    medicalNotes: v.optional(v.string()),

    // Custom fields (from school settings)
    customFieldValues: v.optional(v.any()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_user', ['userId'])
    .index('by_student_number', ['schoolId', 'studentNumber'])
    .index('by_section', ['currentSectionId'])
    .index('by_grade', ['schoolId', 'currentGradeId'])
    .index('by_email', ['schoolId', 'email'])
    .index('by_phone', ['schoolId', 'phone']),

  platformAdmins: defineTable({
    userId: v.id('users'),
    email: v.string(),
    name: v.string(),
    isSuperAdmin: v.boolean(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  // ─── Academic Structure ───

  academicYears: defineTable({
    schoolId: v.id('schools'),
    name: v.string(),
    year: v.optional(v.number()),
    startDate: v.number(),
    endDate: v.number(),
    isCurrent: v.boolean(),
    status: v.optional(AcademicYearStatus),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_current', ['schoolId', 'isCurrent'])
    .index('by_year', ['schoolId', 'year']),

  terms: defineTable({
    schoolId: v.id('schools'),
    academicYearId: v.id('academicYears'),
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    isCurrent: v.boolean(),
    status: v.optional(v.union(v.literal('upcoming'), v.literal('active'), v.literal('closed'))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_academic_year', ['academicYearId'])
    .index('by_current', ['schoolId', 'isCurrent']),

  grades: defineTable({
    schoolId: v.id('schools'),
    name: v.string(),
    level: v.number(),
    isActive: v.boolean(),
    graduationGrade: v.optional(v.boolean()),
    isEczExamYear: v.optional(v.boolean()),
    hasPracticalAssessment: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_level', ['schoolId', 'level']),

  sections: defineTable({
    schoolId: v.id('schools'),
    gradeId: v.id('grades'),
    academicYearId: v.optional(v.id('academicYears')),
    name: v.string(),
    displayName: v.optional(v.string()),
    classTeacherId: v.optional(v.id('staff')),
    roomNumber: v.optional(v.string()),
    maxStudents: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_grade', ['schoolId', 'gradeId'])
    .index('by_class_teacher', ['classTeacherId']),

  subjects: defineTable({
    schoolId: v.id('schools'),
    name: v.string(),
    code: v.optional(v.string()),
    isCore: v.boolean(),
    category: v.optional(SubjectCategory),
    gradeIds: v.optional(v.array(v.id('grades'))),
    isCompulsory: v.optional(v.boolean()),
    isStemSubject: v.optional(v.boolean()),
    theoryWeight: v.optional(v.number()),
    practicalWeight: v.optional(v.number()),
    eczSubjectCode: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_code', ['schoolId', 'code']),

  schoolEvents: defineTable({
    schoolId: v.id('schools'),
    academicYearId: v.id('academicYears'),
    termId: v.optional(v.id('terms')),
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    type: SchoolEventType,
    affectsAttendance: v.boolean(),
    visibleToParents: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_school', ['schoolId'])
    .index('by_academic_year', ['schoolId', 'academicYearId'])
    .index('by_term', ['schoolId', 'termId']),

  counters: defineTable({
    schoolId: v.id('schools'),
    key: v.string(),
    value: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_school', ['schoolId'])
    .index('by_school_key', ['schoolId', 'key']),

  staffSubjectAssignments: defineTable({
    schoolId: v.id('schools'),
    staffId: v.id('staff'),
    subjectId: v.id('subjects'),
    gradeId: v.optional(v.id('grades')),
    sectionId: v.optional(v.id('sections')),
    academicYearId: v.optional(v.id('academicYears')),
    isPrimaryTeacher: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_staff', ['schoolId', 'staffId'])
    .index('by_subject', ['schoolId', 'subjectId'])
    .index('by_section', ['schoolId', 'sectionId']),

  sectionHistory: defineTable({
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    gradeId: v.id('grades'),
    sectionId: v.id('sections'),
    academicYearId: v.optional(v.id('academicYears')),
    termId: v.optional(v.id('terms')),
    reason: v.optional(v.string()),
    effectiveDate: v.number(),
    createdBy: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_student', ['schoolId', 'studentId'])
    .index('by_section', ['schoolId', 'sectionId']),

  timetableSlots: defineTable({
    schoolId: v.id('schools'),
    sectionId: v.id('sections'),
    subjectId: v.id('subjects'),
    teacherId: v.optional(v.id('staff')),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    room: v.optional(v.string()),
    termId: v.optional(v.id('terms')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_section', ['sectionId'])
    .index('by_teacher', ['teacherId']),

  // ─── Attendance ───

  attendance: defineTable({
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    sectionId: v.id('sections'),
    date: v.string(),
    status: v.union(
      v.literal('present'),
      v.literal('absent'),
      v.literal('late'),
      v.literal('excused'),
    ),
    markedBy: v.id('users'),
    termId: v.optional(v.id('terms')),
    timetableSlotId: v.optional(v.id('timetableSlots')),
    notes: v.optional(v.string()),
    clientId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_student_date', ['studentId', 'date'])
    .index('by_section_date', ['sectionId', 'date'])
    .index('by_client_id', ['clientId']),

  // ─── Examinations ───

  examSessions: defineTable({
    schoolId: v.id('schools'),
    name: v.string(),
    termId: v.id('terms'),
    type: v.union(
      v.literal('class_test'),
      v.literal('mid_term'),
      v.literal('end_of_term'),
      v.literal('mock'),
      v.literal('ecz_final'),
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    isLocked: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_term', ['termId']),

  examResults: defineTable({
    schoolId: v.id('schools'),
    examSessionId: v.id('examSessions'),
    studentId: v.id('students'),
    subjectId: v.id('subjects'),
    sectionId: v.id('sections'),
    marksObtained: v.number(),
    maxMarks: v.number(),
    grade: v.optional(v.string()),
    enteredBy: v.id('users'),
    isLocked: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_session_student', ['examSessionId', 'studentId'])
    .index('by_session_section', ['examSessionId', 'sectionId'])
    .index('by_student', ['studentId']),

  // ─── Finance ───

  feeStructures: defineTable({
    schoolId: v.id('schools'),
    termId: v.id('terms'),
    gradeId: v.optional(v.id('grades')),
    feeTypeId: v.string(),
    boardingStatus: v.union(v.literal('day'), v.literal('boarding'), v.literal('all')),
    amountZMW: v.number(),
    earlyPaymentDiscount: v.optional(v.object({
      deadlineDate: v.string(),
      discountPercent: v.number(),
    })),
    instalmentSchedule: v.optional(v.array(v.object({
      dueDate: v.string(),
      amountZMW: v.number(),
      label: v.string(),
    }))),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_term', ['schoolId', 'termId'])
    .index('by_term_grade', ['schoolId', 'termId', 'gradeId'])
    .index('by_term_grade_feetype', ['schoolId', 'termId', 'gradeId', 'feeTypeId']),

  invoices: defineTable({
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    guardianId: v.optional(v.id('guardians')),
    termId: v.id('terms'),
    invoiceNumber: v.string(),
    lineItems: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPriceZMW: v.number(),
      totalZMW: v.number(),
      feeTypeId: v.string(),
      vatCategory: v.union(
        v.literal('exempt'),
        v.literal('standard'),
        v.literal('zero_rated'),
        v.literal('levy'),
      ),
      vatZMW: v.number(),
      isProrated: v.optional(v.boolean()),
      prorationNote: v.optional(v.string()),
    })),
    subtotalZMW: v.number(),
    vatZMW: v.number(),
    discountZMW: v.number(),
    siblingDiscountZMW: v.number(),
    earlyPaymentDiscountZMW: v.optional(v.number()),
    totalZMW: v.number(),
    paidZMW: v.number(),
    balanceZMW: v.number(),
    status: v.union(
      v.literal('draft'),
      v.literal('sent'),
      v.literal('partial'),
      v.literal('paid'),
      v.literal('overdue'),
      v.literal('void'),
    ),
    dueDate: v.number(),
    prorationFactor: v.optional(v.number()),
    consolidatedInvoiceId: v.optional(v.id('consolidatedInvoices')),
    // ZRA VSDC
    zraFiscalCode: v.optional(v.string()),
    zraQrCodeUrl: v.optional(v.string()),
    zraSubmittedAt: v.optional(v.number()),
    zraStatus: v.union(
      v.literal('pending'),
      v.literal('submitted'),
      v.literal('accepted'),
      v.literal('failed'),
      v.literal('not_required'),
    ),
    isMockFiscalCode: v.optional(v.boolean()),
    pdfUrl: v.optional(v.string()),
    issuedBy: v.optional(v.id('users')),
    feesDueOnReportCard: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_student', ['studentId'])
    .index('by_student_term', ['studentId', 'termId'])
    .index('by_invoice_number', ['schoolId', 'invoiceNumber'])
    .index('by_status', ['schoolId', 'status'])
    .index('by_school_term', ['schoolId', 'termId'])
    .index('by_guardian', ['guardianId']),

  payments: defineTable({
    schoolId: v.id('schools'),
    invoiceId: v.id('invoices'),
    studentId: v.id('students'),
    amountZMW: v.number(),
    method: v.union(
      v.literal('cash'),
      v.literal('bank_transfer'),
      v.literal('airtel_money'),
      v.literal('mtn_momo'),
      v.literal('cheque'),
      v.literal('pocket_money_deduction'),
      v.literal('scholarship'),
    ),
    reference: v.optional(v.string()),
    mobileMoneyReference: v.optional(v.string()),
    payerPhone: v.optional(v.string()),
    receiptNumber: v.optional(v.string()),
    receiptPdfUrl: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('failed'),
      v.literal('reversed'),
    ),
    recordedBy: v.optional(v.id('users')),
    receivedBy: v.optional(v.id('users')),
    receivedAt: v.optional(v.number()),
    confirmedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_invoice', ['invoiceId'])
    .index('by_student', ['studentId'])
    .index('by_reference', ['reference'])
    .index('by_mobile_money_ref', ['mobileMoneyReference'])
    .index('by_school_date', ['schoolId', 'createdAt']),

  // ─── Invoice Runs (Sprint 02 ISSUE-096) ───

  invoiceRuns: defineTable({
    schoolId: v.id('schools'),
    termId: v.id('terms'),
    triggeredBy: v.id('users'),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('complete'),
      v.literal('failed'),
    ),
    totalStudents: v.number(),
    processed: v.number(),
    successful: v.number(),
    skipped: v.number(),
    errored: v.number(),
    errors: v.array(
      v.object({
        studentId: v.id('students'),
        studentName: v.string(),
        reason: v.string(),
      }),
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_school_term', ['schoolId', 'termId']),

  // ─── Consolidated Invoices (Sprint 02 ISSUE-106) ───

  consolidatedInvoices: defineTable({
    schoolId: v.id('schools'),
    guardianId: v.id('guardians'),
    termId: v.id('terms'),
    childInvoiceIds: v.array(v.id('invoices')),
    invoiceNumber: v.string(),
    totalZMW: v.number(),
    paidZMW: v.number(),
    balanceZMW: v.number(),
    zraFiscalCode: v.optional(v.string()),
    zraQrCodeUrl: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
    status: v.union(
      v.literal('open'),
      v.literal('partial'),
      v.literal('paid'),
      v.literal('void'),
    ),
    createdAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_guardian_term', ['guardianId', 'termId']),

  // ─── Unallocated Payments (Sprint 02 ISSUE-111) ───

  unallocatedPayments: defineTable({
    schoolId: v.id('schools'),
    source: v.union(v.literal('airtel_money'), v.literal('mtn_momo')),
    transactionId: v.string(),
    payerPhone: v.string(),
    amountZMW: v.number(),
    receivedAt: v.number(),
    rawPayload: v.string(),
    status: v.union(
      v.literal('unresolved'),
      v.literal('allocated'),
      v.literal('refunded'),
    ),
    allocatedToInvoiceId: v.optional(v.id('invoices')),
    resolvedBy: v.optional(v.id('users')),
    resolvedAt: v.optional(v.number()),
  })
    .index('by_school', ['schoolId'])
    .index('by_status', ['schoolId', 'status']),

  // ─── Bank Statement Imports (Sprint 02 ISSUE-113) ───

  bankStatementImports: defineTable({
    schoolId: v.id('schools'),
    bankName: v.string(),
    accountNumber: v.string(),
    statementPeriodFrom: v.string(),
    statementPeriodTo: v.string(),
    totalTransactions: v.number(),
    matchedTransactions: v.number(),
    unmatchedTransactions: v.number(),
    uploadedBy: v.id('users'),
    uploadedAt: v.number(),
    fileUrl: v.string(),
    status: v.union(
      v.literal('pending_review'),
      v.literal('reconciled'),
    ),
  })
    .index('by_school', ['schoolId']),

  // ─── Guardian Ledger (Sprint 02 ISSUE-114) ───

  guardianLedger: defineTable({
    schoolId: v.id('schools'),
    guardianId: v.id('guardians'),
    studentId: v.id('students'),
    termId: v.id('terms'),
    entryType: v.union(
      v.literal('invoice'),
      v.literal('payment'),
      v.literal('credit_note'),
      v.literal('sibling_discount'),
      v.literal('early_payment_discount'),
    ),
    description: v.string(),
    debitZMW: v.number(),
    creditZMW: v.number(),
    balanceAfterZMW: v.number(),
    referenceId: v.string(),
    transactionDate: v.string(),
    createdAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_guardian_student', ['guardianId', 'studentId'])
    .index('by_school_term', ['schoolId', 'termId']),

  // ─── Credit Notes (Sprint 02 ISSUE-115) ───

  creditNotes: defineTable({
    schoolId: v.id('schools'),
    invoiceId: v.id('invoices'),
    studentId: v.id('students'),
    guardianId: v.id('guardians'),
    creditNoteNumber: v.string(),
    amountZMW: v.number(),
    reason: v.string(),
    type: v.union(
      v.literal('correction'),
      v.literal('refund'),
      v.literal('scholarship'),
      v.literal('boarding_adjustment'),
      v.literal('transport_adjustment'),
      v.literal('overpayment_refund'),
    ),
    zraFiscalCode: v.optional(v.string()),
    zraCreditNoteNumber: v.optional(v.string()),
    authorisedBy: v.id('users'),
    status: v.union(
      v.literal('issued'),
      v.literal('applied'),
      v.literal('refunded'),
    ),
    appliedToInvoiceId: v.optional(v.id('invoices')),
    createdAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_invoice', ['invoiceId']),

  // ─── Scholarships (Sprint 02 ISSUE-117) ───

  scholarships: defineTable({
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    name: v.string(),
    provider: v.string(),
    discountType: v.union(
      v.literal('full'),
      v.literal('partial_percent'),
      v.literal('partial_fixed'),
    ),
    discountPercent: v.optional(v.number()),
    discountFixedZMW: v.optional(v.number()),
    applyToFeeTypes: v.array(v.string()),
    validFrom: v.string(),
    validTo: v.string(),
    notes: v.optional(v.string()),
    documentUrl: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_student', ['studentId'])
    .index('by_school', ['schoolId']),

  // ─── Reminder Log (Sprint 02 ISSUE-119) ───

  reminderLog: defineTable({
    schoolId: v.id('schools'),
    invoiceId: v.id('invoices'),
    guardianId: v.id('guardians'),
    reminderType: v.string(),
    channel: v.string(),
    sentAt: v.number(),
    notificationId: v.optional(v.id('notifications')),
  })
    .index('by_invoice', ['invoiceId'])
    .index('by_school', ['schoolId']),

  // ─── Fee Audit Log (Sprint 02 ISSUE-128) ───

  feeAuditLog: defineTable({
    schoolId: v.id('schools'),
    action: v.union(
      v.literal('invoice_created'),
      v.literal('invoice_voided'),
      v.literal('payment_recorded'),
      v.literal('payment_reversed'),
      v.literal('credit_note_created'),
      v.literal('scholarship_applied'),
      v.literal('zra_submitted'),
      v.literal('zra_failed'),
      v.literal('fee_structure_changed'),
      v.literal('invoice_regenerated'),
    ),
    performedBy: v.id('users'),
    relatedInvoiceId: v.optional(v.id('invoices')),
    relatedPaymentId: v.optional(v.id('payments')),
    relatedStudentId: v.optional(v.id('students')),
    amountZMW: v.optional(v.number()),
    previousValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_invoice', ['relatedInvoiceId'])
    .index('by_student', ['relatedStudentId'])
    .index('by_performed_by', ['performedBy']),

  // ─── Notifications ───

  notifications: defineTable({
    schoolId: v.id('schools'),
    userId: v.optional(v.id('users')),
    recipientPhone: v.optional(v.string()),
    type: v.union(
      v.literal('attendance'),
      v.literal('fees'),
      v.literal('results'),
      v.literal('general'),
      v.literal('emergency'),
    ),
    channel: v.optional(v.union(v.literal('in_app'), v.literal('sms'))),
    title: v.string(),
    body: v.string(),
    isRead: v.boolean(),
    link: v.optional(v.string()),
    status: v.optional(v.union(v.literal('queued'), v.literal('sent'), v.literal('delivered'), v.literal('failed'))),
    provider: v.optional(v.union(v.literal('airtel'), v.literal('mtn'))),
    providerMessageId: v.optional(v.string()),
    providerResponse: v.optional(v.string()),
    retryCount: v.optional(v.number()),
    nextRetryAt: v.optional(v.number()),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_user', ['userId'])
    .index('by_user_unread', ['userId', 'isRead']),

  // ─── Boarding (Feature.BOARDING) ───

  hostelBlocks: defineTable({
    schoolId: v.id('schools'),
    name: v.string(),
    gender: v.optional(v.union(v.literal('male'), v.literal('female'), v.literal('mixed'))),
    capacity: v.number(),
    matronId: v.optional(v.id('staff')),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_school', ['schoolId']),

  rooms: defineTable({
    schoolId: v.id('schools'),
    hostelBlockId: v.id('hostelBlocks'),
    name: v.string(),
    capacity: v.number(),
    currentOccupancy: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_hostel', ['hostelBlockId']),

  sickBayAdmissions: defineTable({
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    admittedAt: v.number(),
    dischargedAt: v.optional(v.number()),
    complaint: v.string(),
    treatment: v.optional(v.string()),
    notes: v.optional(v.string()),
    admittedBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_student', ['studentId']),

  visitorLog: defineTable({
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    visitorName: v.string(),
    relationship: v.string(),
    phone: v.optional(v.string()),
    purpose: v.string(),
    checkInAt: v.number(),
    checkOutAt: v.optional(v.number()),
    approvedBy: v.optional(v.id('users')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_student', ['studentId']),

  pocketMoneyAccounts: defineTable({
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    balance: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_student', ['studentId']),

  pocketMoneyTransactions: defineTable({
    schoolId: v.id('schools'),
    accountId: v.id('pocketMoneyAccounts'),
    type: v.union(v.literal('deposit'), v.literal('withdrawal')),
    amount: v.number(),
    description: v.optional(v.string()),
    processedBy: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_account', ['accountId']),

  // ─── Transport (Feature.TRANSPORT) ───

  routes: defineTable({
    schoolId: v.id('schools'),
    name: v.string(),
    driverId: v.optional(v.id('staff')),
    vehicleId: v.optional(v.id('vehicles')),
    stops: v.array(v.object({
      name: v.string(),
      location: v.optional(v.string()),
      lat: v.optional(v.number()),
      lng: v.optional(v.number()),
      pickupTime: v.optional(v.string()),
      dropoffTime: v.optional(v.string()),
    })),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_school', ['schoolId']),

  vehicles: defineTable({
    schoolId: v.id('schools'),
    registrationNumber: v.string(),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    capacity: v.number(),
    driverId: v.optional(v.id('staff')),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_registration', ['schoolId', 'registrationNumber']),

  gpsPings: defineTable({
    schoolId: v.id('schools'),
    vehicleId: v.id('vehicles'),
    lat: v.number(),
    lng: v.number(),
    speed: v.optional(v.number()),
    heading: v.optional(v.number()),
    timestamp: v.number(),
  })
    .index('by_vehicle', ['vehicleId'])
    .index('by_timestamp', ['vehicleId', 'timestamp']),

  // ─── Library (Feature.LIBRARY) ───

  libraryBooks: defineTable({
    schoolId: v.id('schools'),
    title: v.string(),
    author: v.optional(v.string()),
    isbn: v.optional(v.string()),
    category: v.optional(v.string()),
    copies: v.number(),
    availableCopies: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_isbn', ['schoolId', 'isbn']),

  libraryIssues: defineTable({
    schoolId: v.id('schools'),
    bookId: v.id('libraryBooks'),
    borrowerId: v.id('users'),
    issuedAt: v.number(),
    dueDate: v.number(),
    returnedAt: v.optional(v.number()),
    issuedBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_borrower', ['borrowerId'])
    .index('by_book', ['bookId']),

  // ─── LMS (Feature.LMS) ───

  lmsCourses: defineTable({
    schoolId: v.id('schools'),
    subjectId: v.optional(v.id('subjects')),
    name: v.string(),
    description: v.optional(v.string()),
    teacherId: v.id('staff'),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_teacher', ['teacherId']),

  lmsModules: defineTable({
    schoolId: v.id('schools'),
    courseId: v.id('lmsCourses'),
    name: v.string(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_course', ['courseId']),

  lmsLessons: defineTable({
    schoolId: v.id('schools'),
    moduleId: v.id('lmsModules'),
    title: v.string(),
    contentType: v.union(v.literal('text'), v.literal('video'), v.literal('file'), v.literal('quiz')),
    content: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_module', ['moduleId']),

  lmsSubmissions: defineTable({
    schoolId: v.id('schools'),
    lessonId: v.id('lmsLessons'),
    studentId: v.id('students'),
    content: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    grade: v.optional(v.number()),
    feedback: v.optional(v.string()),
    submittedAt: v.number(),
    gradedAt: v.optional(v.number()),
    gradedBy: v.optional(v.id('users')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_lesson', ['lessonId'])
    .index('by_student', ['studentId']),
});
