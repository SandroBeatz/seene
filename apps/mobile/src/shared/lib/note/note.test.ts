import { describe, expect, it } from '@jest/globals';
import { appendChip, NOTE_MAX_LENGTH } from './index';

describe('appendChip', () => {
  it('starts an empty note with the chip and appends lowercased after', () => {
    expect(appendChip('', 'Аллергия', 'ru')).toBe('Аллергия');
    expect(appendChip('Нюд  ', 'Аллергия', 'ru')).toBe('Нюд, аллергия');
  });

  it('never exceeds the limit', () => {
    expect(appendChip('x'.repeat(NOTE_MAX_LENGTH), 'Аллергия', 'ru')).toHaveLength(NOTE_MAX_LENGTH);
  });
});
