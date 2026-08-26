import { describe, expect, it } from '@jest/globals';
import { sanitizeReturnTo } from './auth-return';

describe('sanitizeReturnTo', () => {
  it('keeps internal protected paths and query parameters', () => {
    expect(sanitizeReturnTo('/appointments/demo-42?source=calendar')).toBe(
      '/appointments/demo-42?source=calendar',
    );
  });

  it.each([
    'https://example.com/appointments/42',
    '//example.com/appointments/42',
    '/sign-in',
    '/sign-in/email',
    '/onboarding',
    '/session-error',
    '/uikit/navigation',
    '/email',
    '/welcome',
  ])('rejects public or external target %s', (target) => {
    expect(sanitizeReturnTo(target)).toBeNull();
  });

  it('normalizes local path traversal', () => {
    expect(sanitizeReturnTo('/clients/../calendar')).toBe('/calendar');
  });
});
