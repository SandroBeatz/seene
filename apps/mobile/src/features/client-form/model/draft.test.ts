import { describe, expect, it, jest } from '@jest/globals';

// The client entity's api constructs the Supabase client at import — stub it.
jest.mock('@/shared/api/supabase', () => ({ supabase: {} }));

/* eslint-disable import/first -- must be imported after the mock is registered */
import type { Client } from '@/entities/client';
import { cardFromDraft, draftFromClient, draftInitials, emptyDraft, whatsappSeed } from './draft';
/* eslint-enable import/first */

const draft = (patch: Partial<ReturnType<typeof emptyDraft>> = {}) => ({
  ...emptyDraft('KG', 'lavender'),
  firstName: 'Айгерим',
  ...patch,
});

describe('cardFromDraft', () => {
  it('needs only a name', () => {
    const result = cardFromDraft(draft({ lastName: '  ' }));
    expect(result).toEqual({
      ok: true,
      card: {
        first_name: 'Айгерим',
        last_name: null,
        phone: null,
        avatar_color: 'lavender',
        whatsapp: null,
        telegram: null,
        instagram: null,
        birth_day: null,
        birth_month: null,
        notes: null,
        is_favorite: false,
      },
    });
    expect(cardFromDraft(draft({ firstName: ' ' }))).toEqual({ ok: false, error: 'name' });
  });

  it('saves the phone as canonical digits of the chosen country', () => {
    const result = cardFromDraft(draft({ phone: '0555 12 34 56' }));
    expect(result.ok && result.card.phone).toBe('996555123456');
    expect(cardFromDraft(draft({ phone: '555 12' }))).toEqual({ ok: false, error: 'phone' });
  });

  it('checks every messenger the master added', () => {
    const messengers = { whatsapp: '+996 700 11 22 33', telegram: 't.me/aigerim_k', instagram: '@Aigerim.K' };
    const result = cardFromDraft(draft({ messengers }));
    expect(result.ok && result.card).toMatchObject({
      whatsapp: '996700112233',
      telegram: 'aigerim_k',
      instagram: 'aigerim.k',
    });
    expect(cardFromDraft(draft({ messengers: { ...messengers, telegram: '@ab' } }))).toEqual({
      ok: false,
      error: 'telegram',
    });
    // An added but empty field is simply not saved.
    const empty = cardFromDraft(draft({ messengers: { whatsapp: ' ', telegram: null, instagram: null } }));
    expect(empty.ok && empty.card.whatsapp).toBeNull();
  });

  it('keeps the birthday as day and month', () => {
    const result = cardFromDraft(draft({ birthday: { day: 14, month: 5 }, vip: true }));
    expect(result.ok && result.card).toMatchObject({ birth_day: 14, birth_month: 5, is_favorite: true });
    expect(cardFromDraft(draft({ birthday: { day: 31, month: 4 } }))).toEqual({
      ok: false,
      error: 'birthday',
    });
  });
});

describe('draftFromClient', () => {
  const client = {
    first_name: 'Елена',
    last_name: 'Ворон',
    phone: '14165550182',
    avatar_color: 'sea',
    whatsapp: '14165550182',
    telegram: 'elena_v',
    instagram: null,
    birth_day: 3,
    birth_month: 9,
    notes: 'Кофе без сахара',
    is_favorite: true,
  } as Client;

  it('opens a stored card in its own country', () => {
    const result = draftFromClient(client, 'KG', 'rose');
    expect(result).toMatchObject({
      phone: '416 555 0182',
      phoneCountry: 'CA',
      avatarColor: 'sea',
      messengers: { whatsapp: '+1 416 555 0182', telegram: '@elena_v', instagram: null },
      birthday: { day: 3, month: 9 },
      vip: true,
    });
    // Unchanged it saves back to the same card.
    const saved = cardFromDraft(result);
    expect(saved.ok && saved.card).toMatchObject({
      phone: '14165550182',
      whatsapp: '14165550182',
      telegram: 'elena_v',
    });
  });

  it('seeds WhatsApp from the phone and initials from the name', () => {
    expect(whatsappSeed(draft({ phone: '555 123 456' }))).toBe('+996 555 123 456');
    expect(whatsappSeed(draft({ phone: '555' }))).toBe('');
    expect(draftInitials({ firstName: 'айгерим', lastName: 'касымова' })).toBe('АК');
    expect(draftInitials({ firstName: '', lastName: '' })).toBe('');
  });
});
