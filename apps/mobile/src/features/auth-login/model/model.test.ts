import { describe, expect, it } from '@jest/globals';
import { formatCountdown } from './useCountdown';
import { parseEmail } from './schema';

describe('formatCountdown', () => {
  it('formats minutes and zero-padded seconds', () => {
    expect(formatCountdown(42)).toBe('0:42');
    expect(formatCountdown(60)).toBe('1:00');
    expect(formatCountdown(5)).toBe('0:05');
    expect(formatCountdown(-3)).toBe('0:00');
  });
});

describe('parseEmail', () => {
  it('trims and lower-cases a valid address', () => {
    expect(parseEmail('  Karina.M@Gmail.com ')).toBe('karina.m@gmail.com');
  });
  it('rejects an invalid address', () => {
    expect(parseEmail('karina@')).toBeNull();
    expect(parseEmail('')).toBeNull();
  });
});
