import { Feature } from './flags';

type SchoolType =
  | 'primary_day'
  | 'primary_boarding'
  | 'secondary_day'
  | 'secondary_boarding'
  | 'mixed_secondary'
  | 'combined'
  | 'college';

// Core features enabled for every school type
const CORE_FEATURES: Feature[] = [
  Feature.STUDENTS,
  Feature.STAFF,
  Feature.ATTENDANCE,
  Feature.FEES,
  Feature.GUARDIAN_PORTAL,
  Feature.SMS_NOTIFICATIONS,
  Feature.SCHOOL_CUSTOMISATION,
];

// Default feature presets by school type
const SCHOOL_TYPE_PRESETS: Record<SchoolType, Feature[]> = {
  primary_day: [
    ...CORE_FEATURES,
    Feature.TIMETABLE,
  ],
  primary_boarding: [
    ...CORE_FEATURES,
    Feature.TIMETABLE,
    Feature.BOARDING,
    Feature.POCKET_MONEY,
    Feature.SICK_BAY,
    Feature.VISITOR_LOG,
    Feature.MEAL_PLANS,
  ],
  secondary_day: [
    ...CORE_FEATURES,
    Feature.ECZ_EXAMS,
    Feature.TIMETABLE,
    Feature.ZRA_INVOICING,
    Feature.LIBRARY,
  ],
  secondary_boarding: [
    ...CORE_FEATURES,
    Feature.ECZ_EXAMS,
    Feature.TIMETABLE,
    Feature.ZRA_INVOICING,
    Feature.BOARDING,
    Feature.POCKET_MONEY,
    Feature.SICK_BAY,
    Feature.VISITOR_LOG,
    Feature.MEAL_PLANS,
    Feature.LIBRARY,
    Feature.TRANSPORT,
  ],
  mixed_secondary: [
    ...CORE_FEATURES,
    Feature.ECZ_EXAMS,
    Feature.TIMETABLE,
    Feature.ZRA_INVOICING,
    Feature.BOARDING,
    Feature.LIBRARY,
    Feature.TRANSPORT,
  ],
  combined: [
    ...CORE_FEATURES,
    Feature.ECZ_EXAMS,
    Feature.TIMETABLE,
    Feature.ZRA_INVOICING,
    Feature.BOARDING,
    Feature.POCKET_MONEY,
    Feature.SICK_BAY,
    Feature.VISITOR_LOG,
    Feature.LIBRARY,
    Feature.TRANSPORT,
  ],
  college: [
    ...CORE_FEATURES,
    Feature.SEMESTER_SYSTEM,
    Feature.GPA,
    Feature.HEA_COMPLIANCE,
    Feature.ZRA_INVOICING,
    Feature.LMS,
    Feature.LIBRARY,
    Feature.ELIBRARY,
  ],
};

// Get default features for a school type
export function getDefaultFeaturesForSchoolType(type: SchoolType): Feature[] {
  return SCHOOL_TYPE_PRESETS[type] ?? CORE_FEATURES;
}
