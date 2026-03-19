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
    }))),

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
    startDate: v.number(),
    endDate: v.number(),
    isCurrent: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_current', ['schoolId', 'isCurrent']),

  terms: defineTable({
    schoolId: v.id('schools'),
    academicYearId: v.id('academicYears'),
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    isCurrent: v.boolean(),
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
    eczSubjectCode: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_code', ['schoolId', 'code']),

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
    academicYearId: v.id('academicYears'),
    name: v.string(),
    gradeId: v.optional(v.id('grades')),
    boardingStatus: v.optional(v.union(v.literal('day'), v.literal('boarder'))),
    items: v.array(v.object({
      name: v.string(),
      amount: v.number(),
      isOptional: v.boolean(),
    })),
    totalAmount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_academic_year', ['academicYearId']),

  invoices: defineTable({
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    feeStructureId: v.optional(v.id('feeStructures')),
    termId: v.optional(v.id('terms')),
    invoiceNumber: v.string(),
    items: v.array(v.object({
      name: v.string(),
      amount: v.number(),
    })),
    totalAmount: v.number(),
    paidAmount: v.number(),
    balanceAmount: v.number(),
    status: v.union(
      v.literal('draft'),
      v.literal('sent'),
      v.literal('partially_paid'),
      v.literal('paid'),
      v.literal('overdue'),
      v.literal('voided'),
    ),
    dueDate: v.optional(v.number()),
    zraFiscalCode: v.optional(v.string()),
    issuedBy: v.optional(v.id('users')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_student', ['studentId'])
    .index('by_invoice_number', ['schoolId', 'invoiceNumber'])
    .index('by_status', ['schoolId', 'status']),

  payments: defineTable({
    schoolId: v.id('schools'),
    invoiceId: v.id('invoices'),
    studentId: v.id('students'),
    amount: v.number(),
    method: v.union(
      v.literal('cash'),
      v.literal('bank_transfer'),
      v.literal('airtel_money'),
      v.literal('mtn_momo'),
      v.literal('cheque'),
    ),
    reference: v.optional(v.string()),
    receiptNumber: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('failed'),
      v.literal('reversed'),
    ),
    recordedBy: v.optional(v.id('users')),
    confirmedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_invoice', ['invoiceId'])
    .index('by_student', ['studentId'])
    .index('by_reference', ['reference']),

  // ─── Notifications ───

  notifications: defineTable({
    schoolId: v.id('schools'),
    userId: v.id('users'),
    type: v.union(
      v.literal('attendance'),
      v.literal('fees'),
      v.literal('results'),
      v.literal('general'),
      v.literal('emergency'),
    ),
    title: v.string(),
    body: v.string(),
    isRead: v.boolean(),
    link: v.optional(v.string()),
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
