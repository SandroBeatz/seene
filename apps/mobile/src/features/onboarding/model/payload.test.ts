import { describe, expect, it, jest } from '@jest/globals';

// The master entity's api constructs the Supabase client at import — stub it.
jest.mock('@/shared/api/supabase', () => ({ supabase: {} }));

// eslint-disable-next-line import/first -- must be imported after the mock is registered
import { buildPayload, type DeviceContext } from './payload';
// eslint-disable-next-line import/first -- must be imported after the mock is registered
import { normalizeUsernameInput } from './username-input';

const device: DeviceContext = {
  timezone: 'Asia/Bishkek',
  currency: 'KGS',
  region: 'KG',
  language: 'ru',
  theme: 'auto',
};

describe('buildPayload', () => {
  const payload = buildPayload(
    {
      userId: 'u1',
      firstName: ' Карина ',
      lastName: 'Михайлова ',
      username: 'karina_nails',
      specializations: ['manicure', 'pedicure'],
    },
    device,
  );

  it('trims names and keeps the picked professions', () => {
    expect(payload.first_name).toBe('Карина');
    expect(payload.last_name).toBe('Михайлова');
    expect(payload.specializations).toEqual(['manicure', 'pedicure']);
  });

  it('stores the device timezone with a Mon–Sat 10–19 week', () => {
    expect(payload.schedule.timezone).toBe('Asia/Bishkek');
    expect(payload.schedule.days.monday).toMatchObject({ enabled: true, start: '10:00', end: '19:00' });
    expect(payload.schedule.days.saturday.enabled).toBe(true);
    expect(payload.schedule.days.sunday.enabled).toBe(false);
  });

  it('uses the design defaults for booking', () => {
    expect(payload.currency).toBe('KGS');
    expect(payload.online_booking_enabled).toBe(true);
    expect(payload.booking_default_status).toBe('confirmed');
    expect(payload.services).toEqual([]);
  });
});

describe('normalizeUsernameInput', () => {
  it('lower-cases, drops spaces and turns dots into underscores', () => {
    expect(normalizeUsernameInput('Karina.Nails 1')).toBe('karina_nails1');
  });
});
