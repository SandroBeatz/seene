import { describe, expect, it } from '@jest/globals';
import { isNewClient } from './derive';

describe('isNewClient', () => {
  it('treats a client with no appointments as new', () => {
    expect(isNewClient(0)).toBe(true);
  });

  it('treats a client with exactly one appointment as new (the current booking)', () => {
    expect(isNewClient(1)).toBe(true);
  });

  it('treats a client with more than one appointment as returning', () => {
    expect(isNewClient(2)).toBe(false);
    expect(isNewClient(17)).toBe(false);
  });
});
