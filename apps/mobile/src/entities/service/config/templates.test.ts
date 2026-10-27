import { describe, expect, it } from '@jest/globals';
import { SPECIALIZATION_KEYS } from '@/shared/config/specializations';
import { SERVICE_TEMPLATES } from './templates';

const all = Object.values(SERVICE_TEMPLATES).flat();

describe('SERVICE_TEMPLATES', () => {
  it('covers every profession with at least one suggested service', () => {
    for (const key of SPECIALIZATION_KEYS) {
      expect(SERVICE_TEMPLATES[key].length).toBeGreaterThan(0);
      expect(SERVICE_TEMPLATES[key].some((s) => s.suggested)).toBe(true);
    }
  });

  it('has unique ids prefixed with their profession', () => {
    expect(new Set(all.map((s) => s.id)).size).toBe(all.length);
    for (const key of SPECIALIZATION_KEYS) {
      for (const s of SERVICE_TEMPLATES[key]) expect(s.id.startsWith(`${key}.`)).toBe(true);
    }
  });

  it('keeps durations inside what complete_onboarding accepts (5–1440 min)', () => {
    for (const s of all) {
      expect(s.duration).toBeGreaterThanOrEqual(5);
      expect(s.duration).toBeLessThanOrEqual(1440);
    }
  });

  it('names every service in all three languages', () => {
    for (const s of all) {
      expect(s.name.ru && s.name.en && s.name.fr).toBeTruthy();
    }
  });
});
