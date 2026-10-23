import { describe, expect, it } from '@jest/globals';
import { isSystemPaymentType } from './derive';

describe('isSystemPaymentType', () => {
  it('treats cash and card as system methods', () => {
    expect(isSystemPaymentType({ kind: 'cash' })).toBe(true);
    expect(isSystemPaymentType({ kind: 'card' })).toBe(true);
  });

  it('treats custom methods as non-system', () => {
    expect(isSystemPaymentType({ kind: 'custom' })).toBe(false);
  });
});
