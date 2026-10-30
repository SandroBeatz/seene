/** Private note rules (design "Запись · заметка"; the client note follows them too). */

export const NOTE_MAX_LENGTH = 300;

/** Appends a quick chip to the note: "Аллергия" → "…, аллергия". */
export function appendChip(
  note: string,
  chip: string,
  locale: string,
  maxLength: number = NOTE_MAX_LENGTH,
): string {
  const trimmed = note.trim();
  const next = trimmed ? `${trimmed}, ${chip.toLocaleLowerCase(locale)}` : chip;
  return next.slice(0, maxLength);
}

export { useNoteSheetText } from './useNoteSheetText';
