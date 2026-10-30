import { describe, expect, it } from '@jest/globals';
import type { Client } from '../model/types';
import { duplicateCandidates, duplicateReason } from './duplicates';

const card = (id: string, first_name: string, last_name: string | null, phone: string | null = null, whatsapp: string | null = null) =>
  ({ id, first_name, last_name, phone, whatsapp }) as Client;

describe('duplicates', () => {
  it('matches the same number, phone or WhatsApp', () => {
    expect(duplicateReason(card('a', 'Алиса', null, '996555123456'), card('b', 'Alice', null, null, '996555123456'))).toBe('phone');
  });

  it('matches names, ё as е, but not different last names', () => {
    expect(duplicateReason(card('a', 'Алёна', 'Ким'), card('b', 'алена', 'ким'))).toBe('name');
    expect(duplicateReason(card('a', 'Алиса', null), card('b', 'Алиса', 'Быкова'))).toBe('firstName');
    expect(duplicateReason(card('a', 'Алиса', 'Б.'), card('b', 'Алиса', 'Быкова'))).toBe('firstName');
    expect(duplicateReason(card('a', 'Алиса', 'Ким'), card('b', 'Алиса', 'Быкова'))).toBeNull();
    expect(duplicateReason(card('a', 'Алиса', null), card('b', 'Мария', null))).toBeNull();
  });

  it('lists the strongest matches first and skips the client itself', () => {
    const me = card('me', 'Алиса', null, '996555000001');
    const result = duplicateCandidates(me, [
      me,
      card('name', 'Алиса', 'Быкова'),
      card('phone', 'Alice', null, '996555000001'),
      card('other', 'Мария', null),
    ]);
    expect(result.map((c) => [c.client.id, c.reason])).toEqual([
      ['phone', 'phone'],
      ['name', 'firstName'],
    ]);
  });
});
