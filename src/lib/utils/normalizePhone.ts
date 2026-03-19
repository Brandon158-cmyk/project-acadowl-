// Normalises any Zambian phone format to E.164 (+260XXXXXXXXX)
export function normalizeZambianPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('260')) return '+' + digits;
  if (digits.startsWith('0')) return '+260' + digits.slice(1);
  if (digits.length === 9) return '+260' + digits;
  throw new Error('Invalid Zambian phone number: ' + input);
}
