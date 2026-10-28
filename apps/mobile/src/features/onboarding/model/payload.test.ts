import { describe, expect, it, jest } from '@jest/globals';

// The master entity's api constructs the Supabase client at import — stub it.
jest.mock('@/shared/api/supabase', () => ({ supabase: {} }));

// eslint-disable-next-line import/first -- must be imported after the mock is registered
import { SERVICE_COLORS } from '@/shared/config/palettes';
// eslint-disable-next-line import/first -- must be imported after the mock is registered
import { DEFAULT_HOURS } from './hours';
// eslint-disable-next-line import/first -- must be imported after the mock is registered
import { buildPayload, type DeviceContext } from './payload';
// eslint-disable-next-line import/first -- must be imported after the mock is registered
import { normalizeUsernameInput } from './username-input';

const device: DeviceContext = {
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
      currency: 'KGS',
      timezone: 'Asia/Bishkek',
      hours: DEFAULT_HOURS,
      onlineBooking: true,
      manualConfirm: true,
      categories: ['Покрытие'],
      servicesSkipped: false,
      services: [
        {
          id: 'manicure.gel',
          templateId: 'manicure.gel',
          name: '',
          description: '',
          duration: 90,
          price: null,
          color: 'rose',
          specialization: 'manicure',
          category: 'Покрытие',
          active: true,
          online: true,
          selected: true,
        },
        {
          id: 'manicure.plain',
          templateId: 'manicure.plain',
          name: 'Маникюр без покрытия',
          description: '',
          duration: 60,
          price: 800,
          color: 'sky',
          specialization: 'manicure',
          category: null,
          active: true,
          online: false,
          selected: false,
        },
      ],
    },
    device,
  );

  it('trims names and keeps the picked professions', () => {
    expect(payload.first_name).toBe('Карина');
    expect(payload.last_name).toBe('Михайлова');
    expect(payload.specializations).toEqual(['manicure', 'pedicure']);
  });

  it('stores the picked timezone with the hours as a weekday-keyed week', () => {
    expect(payload.schedule.timezone).toBe('Asia/Bishkek');
    expect(payload.schedule.days.monday).toMatchObject({ enabled: true, start: '10:00', end: '19:00' });
    expect(payload.schedule.days.saturday.enabled).toBe(true);
    expect(payload.schedule.days.sunday.enabled).toBe(false);
  });

  it('maps the step-4 switches', () => {
    expect(payload.currency).toBe('KGS');
    expect(payload.online_booking_enabled).toBe(true);
    expect(payload.booking_default_status).toBe('pending');
  });

  it('writes only the selected services, with the colour as hex', () => {
    expect(payload.services).toEqual([
      {
        name: 'Маникюр с покрытием гель-лаком',
        duration: 90,
        price: null,
        description: null,
        color: SERVICE_COLORS.rose,
        specialization: 'manicure',
        category: 'Покрытие',
        is_active: true,
        show_online: true,
      },
    ]);
  });
});

describe('normalizeUsernameInput', () => {
  it('lower-cases, drops spaces and turns dots into underscores', () => {
    expect(normalizeUsernameInput('Karina.Nails 1')).toBe('karina_nails1');
  });
});
