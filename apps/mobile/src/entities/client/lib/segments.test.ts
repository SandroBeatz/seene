import { describe, expect, it } from '@jest/globals';
import { inSegment, matchesClientQuery } from './segments';

const client = (is_favorite = false) => ({ id: 'c', is_favorite });

describe('client segments', () => {
  it('sorts clients by finished visits', () => {
    const at = (visits: number) => ({ client: client(), summary: { visits }, recall: false });
    expect(inSegment('new', at(0))).toBe(true);
    expect(inSegment('new', at(1))).toBe(true);
    expect(inSegment('new', at(2))).toBe(false);
    expect(inSegment('regular', at(2))).toBe(false);
    expect(inSegment('regular', at(3))).toBe(true);
    expect(inSegment('new', { client: client(), summary: undefined, recall: false })).toBe(true);
  });

  it('takes VIP and recall from the card and the rhythm', () => {
    expect(inSegment('vip', { client: client(true), summary: undefined, recall: false })).toBe(true);
    expect(inSegment('recall', { client: client(), summary: { visits: 5 }, recall: true })).toBe(true);
    expect(inSegment('all', { client: client(), summary: undefined, recall: false })).toBe(true);
  });
});

describe('client search', () => {
  const aigerim = { first_name: 'Алёна', last_name: 'Касымова', phone: '996555123456' };

  it('finds by any part of the name, ё as е', () => {
    expect(matchesClientQuery(aigerim, 'алена')).toBe(true);
    expect(matchesClientQuery(aigerim, 'КАСЫМ')).toBe(true);
    expect(matchesClientQuery(aigerim, 'мария')).toBe(false);
    expect(matchesClientQuery(aigerim, '  ')).toBe(true);
  });

  it('finds by phone digits however they are typed', () => {
    expect(matchesClientQuery(aigerim, '555 12')).toBe(true);
    expect(matchesClientQuery(aigerim, '+996 555')).toBe(true);
    expect(matchesClientQuery(aigerim, '55')).toBe(false);
    expect(matchesClientQuery({ ...aigerim, phone: null }, '555')).toBe(false);
  });
});
