/** What the sheet's number pad does to the typed sum, kept as digits. */
const MAX_DIGITS = 7;

export function addDigits(current: string, digits: string): string {
  const next = `${current}${digits}`.replace(/^0+/, '');
  return next.length <= MAX_DIGITS ? next : current;
}

export const eraseDigit = (current: string) => current.slice(0, -1);
