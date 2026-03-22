import type { Doc, Id } from '../_generated/dataModel';

// Get the primary guardian ID from a student's guardianLinks array
export function getPrimaryGuardianId(
  student: Doc<'students'>,
): Id<'guardians'> | null {
  const links = student.guardianLinks;
  if (!links || links.length === 0) return null;

  const primary = links.find((l) => l.isPrimary);
  return primary ? primary.guardianId : links[0].guardianId;
}

// Normalize boarding status for fee structure matching
// Schema uses 'day' | 'boarder', fee structures use 'day' | 'boarding' | 'all'
export function normalizeBoardingStatus(
  studentBoardingStatus: 'day' | 'boarder' | undefined,
): 'day' | 'boarding' {
  if (studentBoardingStatus === 'boarder') return 'boarding';
  return 'day';
}
