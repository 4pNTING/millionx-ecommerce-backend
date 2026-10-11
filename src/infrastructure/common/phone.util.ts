/**
 * Normalizes phone numbers to standard format (digits only, e.g. 85620XXXXXXXX for Laos).
 * - Removes spaces, dashes, parentheses, dots
 * - Strips leading '+'
 * - Converts local Laos prefix '020' or '20' to '85620'
 */
export function normalizePhoneNumber(rawPhone?: string | null): string {
  if (!rawPhone) return '';

  let cleaned = rawPhone.trim().replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // Handle local Laos mobile formats:
  // '020XXXXXXXX' (11 digits) -> '85620XXXXXXXX'
  if (/^020\d{8}$/.test(cleaned)) {
    cleaned = '856' + cleaned.slice(1);
  } else if (/^20\d{8}$/.test(cleaned)) {
    cleaned = '856' + cleaned;
  }

  return cleaned;
}
