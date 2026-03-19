// ECZ (Examinations Council of Zambia) grading scales

// Junior Secondary (Grade 9) grading
export const ECZ_GRADE_9_SCALE = [
  { grade: '1', label: 'Distinction', minPercent: 80, maxPercent: 100 },
  { grade: '2', label: 'Merit', minPercent: 65, maxPercent: 79 },
  { grade: '3', label: 'Credit', minPercent: 50, maxPercent: 64 },
  { grade: '4', label: 'Pass', minPercent: 40, maxPercent: 49 },
  { grade: 'U', label: 'Fail', minPercent: 0, maxPercent: 39 },
] as const;

// Senior Secondary (Grade 12) grading
export const ECZ_GRADE_12_SCALE = [
  { grade: '1', label: 'Distinction', minPercent: 80, maxPercent: 100 },
  { grade: '2', label: 'Merit', minPercent: 70, maxPercent: 79 },
  { grade: '3', label: 'Credit', minPercent: 60, maxPercent: 69 },
  { grade: '4', label: 'Pass', minPercent: 50, maxPercent: 59 },
  { grade: '5', label: 'Credit Pass', minPercent: 40, maxPercent: 49 },
  { grade: '6', label: 'Bare Pass', minPercent: 35, maxPercent: 39 },
  { grade: '7', label: 'Pass (S)', minPercent: 30, maxPercent: 34 },
  { grade: '8', label: 'Pass (S)', minPercent: 25, maxPercent: 29 },
  { grade: '9', label: 'Fail', minPercent: 0, maxPercent: 24 },
] as const;

// GPA scale (for colleges)
export const GPA_SCALE = [
  { grade: 'A+', label: 'Exceptional', gpa: 4.0, minPercent: 90, maxPercent: 100 },
  { grade: 'A', label: 'Excellent', gpa: 4.0, minPercent: 80, maxPercent: 89 },
  { grade: 'B+', label: 'Very Good', gpa: 3.5, minPercent: 75, maxPercent: 79 },
  { grade: 'B', label: 'Good', gpa: 3.0, minPercent: 70, maxPercent: 74 },
  { grade: 'C+', label: 'Above Average', gpa: 2.5, minPercent: 65, maxPercent: 69 },
  { grade: 'C', label: 'Average', gpa: 2.0, minPercent: 60, maxPercent: 64 },
  { grade: 'D+', label: 'Below Average', gpa: 1.5, minPercent: 55, maxPercent: 59 },
  { grade: 'D', label: 'Poor', gpa: 1.0, minPercent: 50, maxPercent: 54 },
  { grade: 'F', label: 'Fail', gpa: 0.0, minPercent: 0, maxPercent: 49 },
] as const;

// Convert percentage to ECZ grade
export function percentToEczGrade(percent: number, level: 'grade9' | 'grade12'): string {
  const scale = level === 'grade9' ? ECZ_GRADE_9_SCALE : ECZ_GRADE_12_SCALE;
  for (const entry of scale) {
    if (percent >= entry.minPercent) return entry.grade;
  }
  return scale[scale.length - 1].grade;
}

// Convert percentage to GPA
export function percentToGpa(percent: number): number {
  for (const entry of GPA_SCALE) {
    if (percent >= entry.minPercent) return entry.gpa;
  }
  return 0.0;
}
