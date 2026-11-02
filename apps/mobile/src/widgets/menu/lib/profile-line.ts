/**
 * "Маникюр и педикюр · Бишкек": the line under the master's name. Only the first
 * profession keeps its capital; the rest continue the sentence.
 */
export function joinProfessions(labels: string[], and: string): string {
  const [first, ...rest] = labels;
  if (first === undefined) return '';
  if (rest.length === 0) return first;
  const lower = rest.map((label) => label.toLocaleLowerCase());
  const last = lower.pop() as string;
  return `${[first, ...lower].join(', ')}${and}${last}`;
}

export function profileLine(professions: string, city: string | null | undefined): string {
  return [professions, city?.trim()].filter(Boolean).join(' · ');
}
