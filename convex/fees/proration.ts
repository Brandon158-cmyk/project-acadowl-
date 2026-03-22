// Pure function — calculates proration factor for mid-term enrollment
// Returns a factor between 0 and 1 (e.g., 0.75 = 75% of term remaining)

export function calculateProrationFactor(
  enrollmentDate: number,
  termStartDate: number,
  termEndDate: number,
): number {
  // If enrolled on or before term start, no proration
  if (enrollmentDate <= termStartDate) return 1;

  // If enrolled after term end, factor is 0
  if (enrollmentDate >= termEndDate) return 0;

  const totalTermDays = Math.max(
    1,
    Math.ceil((termEndDate - termStartDate) / (24 * 60 * 60 * 1000)),
  );
  const remainingDays = Math.max(
    0,
    Math.ceil((termEndDate - enrollmentDate) / (24 * 60 * 60 * 1000)),
  );

  // Round to 4 decimal places to avoid floating-point drift
  return Math.round((remainingDays / totalTermDays) * 10000) / 10000;
}

// Apply proration to an amount using integer-cent arithmetic
export function applyProration(amountZMW: number, factor: number): number {
  const cents = Math.round(amountZMW * 100);
  const proratedCents = Math.round(cents * factor);
  return proratedCents / 100;
}
