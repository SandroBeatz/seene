import { beforeEach, describe, expect, it } from '@jest/globals';
import { useQuickCreateDraft } from './draft.store';

const draft = () => useQuickCreateDraft.getState();
const AT = '2026-11-06T09:00:00.000Z';

describe('preferredStart', () => {
  beforeEach(() => draft().reset());

  it('survives choosing services, unlike a picked time', () => {
    draft().setPreferredStart(AT);
    draft().toggleService('manicure');
    expect(draft().preferredStart).toBe(AT);
    expect(draft().start).toBeNull();
  });

  it('is used up once a start is set, so clearing it does not bring it back', () => {
    draft().setPreferredStart(AT);
    draft().setStart(AT);
    expect(draft().preferredStart).toBeNull();
    draft().setStart(null);
    expect(draft().preferredStart).toBeNull();
  });
});
