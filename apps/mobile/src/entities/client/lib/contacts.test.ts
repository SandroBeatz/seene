import { describe, expect, it } from '@jest/globals';
import { contactToCard, importCandidates } from './contacts';

describe('contactToCard', () => {
  it('takes the name and the first valid number in the master country', () => {
    expect(
      contactToCard(
        {
          id: '1',
          givenName: 'Айгерим',
          familyName: 'Касымова',
          phones: [{ number: '12' }, { number: '0555 12-34-56' }],
          birthday: { day: 14, month: 5 },
        },
        'KG',
      ),
    ).toEqual({
      first_name: 'Айгерим',
      last_name: 'Касымова',
      phone: '996555123456',
      birth_day: 14,
      birth_month: 5,
    });
  });

  it('reads international numbers and falls back on other name fields', () => {
    expect(contactToCard({ id: '1', familyName: 'Мастер', phones: [{ number: '+1 416 555 0182' }] }, 'KG')).toMatchObject({
      first_name: 'Мастер',
      last_name: null,
      phone: '14165550182',
    });
    expect(contactToCard({ id: '1', fullName: 'Салон', phones: [] }, 'KG')).toMatchObject({ first_name: 'Салон', phone: null });
    expect(contactToCard({ id: '1', phones: [{ number: '+996555123456' }] }, 'KG')).toBeNull();
  });
});

describe('importCandidates', () => {
  it('marks known numbers, drops repeated ones and sorts by name', () => {
    const rows = importCandidates(
      [
        { id: 'b', givenName: 'Бермет', phones: [{ number: '0700 88 21 40' }] },
        { id: 'a', givenName: 'Айгерим', phones: [{ number: '0555 12 34 56' }] },
        { id: 'a2', givenName: 'Айгерим (работа)', phones: [{ number: '+996 555 12 34 56' }] },
        { id: 'c', givenName: 'Без номера' },
      ],
      [{ phone: null, whatsapp: '996700882140' }],
      'KG',
    );
    expect(rows.map((r) => [r.contactId, r.phone, r.exists])).toEqual([
      ['a', '996555123456', false],
      ['c', null, false],
      ['b', '996700882140', true],
    ]);
  });
});
