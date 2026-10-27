/** Usernames are lowercase with no spaces; dots become '_' (the DB rule has no dot). */
export function normalizeUsernameInput(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '').replace(/\./g, '_');
}
