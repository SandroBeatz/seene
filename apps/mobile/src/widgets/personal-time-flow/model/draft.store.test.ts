import { beforeEach, describe, expect, it } from '@jest/globals';
import { usePersonalTimeDraft } from './draft.store';

const state = () => usePersonalTimeDraft.getState();
const START = '2026-11-02T07:00:00.000Z';

describe('setLength', () => {
  beforeEach(() => state().reset());

  it('keeps the start when the same length is tapped again', () => {
    state().setStart(START);
    state().setLength(state().length);
    expect(state().start).toBe(START);
  });

  it('asks for the start again on another length, even a typed one', () => {
    state().setStart(START, true);
    state().setLength(120);
    expect(state()).toMatchObject({ length: 120, start: null, ownTime: false });
  });
});
