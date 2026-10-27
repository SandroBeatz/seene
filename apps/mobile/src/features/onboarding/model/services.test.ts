import { describe, expect, it, jest } from '@jest/globals';

// The master entity's api constructs the Supabase client at import — stub it.
jest.mock('@/shared/api/supabase', () => ({ supabase: {} }));

// eslint-disable-next-line import/first -- must be imported after the mock is registered
import {
  type DraftService,
  forgetCatalogNames,
  groupByProfession,
  serviceName,
  syncWithProfessions,
  withStoredName,
} from './services';

describe('syncWithProfessions', () => {
  it('adds the templates of picked professions, suggested ones pre-selected', () => {
    const list = syncWithProfessions([], ['pedicure']);
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((s) => s.specialization === 'pedicure')).toBe(true);
    expect(list.find((s) => s.id === 'pedicure.gel')).toMatchObject({ selected: true, price: null });
  });

  it('keeps edits, drops templates of unpicked professions, keeps own services', () => {
    const start = syncWithProfessions([], ['manicure', 'pedicure']);
    const edited = start.map((s) => (s.id === 'manicure.gel' ? { ...s, price: 1500 } : s));
    const own: DraftService = { ...edited[0]!, id: 'own-1', templateId: undefined, specialization: 'pedicure' };
    const next = syncWithProfessions([...edited, own], ['manicure']);
    expect(next.find((s) => s.id === 'manicure.gel')?.price).toBe(1500);
    expect(next.some((s) => s.id === 'pedicure.gel')).toBe(false);
    expect(next.some((s) => s.id === 'own-1')).toBe(true);
  });

  it('groups by profession in catalog order', () => {
    const groups = groupByProfession(syncWithProfessions([], ['pedicure', 'lashes']));
    expect(groups.map((g) => g.specialization)).toEqual(['lashes', 'pedicure']);
  });
});

describe('service names', () => {
  const [gel] = syncWithProfessions([], ['pedicure']).filter((s) => s.id === 'pedicure.gel');

  it('follow the app language until the master renames them', () => {
    expect(serviceName(gel!, 'ru')).toBe('Педикюр с покрытием');
    expect(serviceName(gel!, 'en')).toBe('Pedicure with gel polish');
    expect(serviceName({ ...gel!, name: 'Мой педикюр' }, 'en')).toBe('Мой педикюр');
  });

  it('stay translatable when saved unchanged, and old drafts forget catalog names', () => {
    expect(withStoredName({ ...gel!, name: 'Педикюр с покрытием' }, 'ru').name).toBe('');
    expect(withStoredName({ ...gel!, name: 'Мой педикюр' }, 'ru').name).toBe('Мой педикюр');
    expect(forgetCatalogNames([{ ...gel!, name: 'Pedicure with gel polish' }])[0]!.name).toBe('');
  });
});
