/** Appointment note rules (design "Запись · заметка"). */

export const NOTE_MAX_LENGTH = 300;

/** Appends a quick chip to the note: "Аллергия" → "…, аллергия". */
export function appendChip(note: string, chip: string, locale: string): string {
  const trimmed = note.trim();
  const next = trimmed ? `${trimmed}, ${chip.toLocaleLowerCase(locale)}` : chip;
  return next.slice(0, NOTE_MAX_LENGTH);
}
