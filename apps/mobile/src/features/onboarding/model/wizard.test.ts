import { describe, expect, it, jest } from '@jest/globals';

// The wizard pulls in the master entity, whose api constructs the Supabase client
// at import — stub it so this pure-logic test needs no env.
jest.mock('@/shared/api/supabase', () => ({ supabase: {} }));

// eslint-disable-next-line import/first -- must be imported after the mock is registered
import { canAdvance, createDraft } from './wizard';

describe('onboarding gating (canAdvance)', () => {
  it('step 1 requires at least one specialization', () => {
    const draft = createDraft();
    expect(canAdvance(0, draft, undefined)).toBe(false);
    expect(canAdvance(0, { ...draft, specializations: ['hair'] }, undefined)).toBe(true);
  });

  it('step 2 requires names, phone, a valid username, and an available result', () => {
    const base = {
      ...createDraft(),
      first_name: 'Ada',
      last_name: 'Lovelace',
      phone: '+15551234',
      username: 'ada_l',
    };
    expect(canAdvance(1, base, undefined)).toBe(false); // availability unknown
    expect(canAdvance(1, base, false)).toBe(false); // taken
    expect(canAdvance(1, base, true)).toBe(true);
    expect(canAdvance(1, { ...base, username: 'a' }, true)).toBe(false); // too short
    expect(canAdvance(1, { ...base, first_name: '' }, true)).toBe(false);
  });

  it('step 3 requires a country', () => {
    const draft = { ...createDraft(), country: '' };
    expect(canAdvance(2, draft, undefined)).toBe(false);
    expect(canAdvance(2, { ...draft, country: 'FR' }, undefined)).toBe(true);
  });

  it('step 4 requires at least one enabled day and a timezone', () => {
    const draft = createDraft();
    expect(canAdvance(3, draft, undefined)).toBe(true);
    const allOff = draft.schedule.map((d) => ({ ...d, enabled: false })) as typeof draft.schedule;
    expect(canAdvance(3, { ...draft, schedule: allOff }, undefined)).toBe(false);
  });

  it('review step is always advanceable', () => {
    expect(canAdvance(4, createDraft(), undefined)).toBe(true);
  });
});
