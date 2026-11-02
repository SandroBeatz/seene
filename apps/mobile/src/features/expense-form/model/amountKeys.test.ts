import { describe, expect, it } from '@jest/globals';
import { addDigits, eraseDigit } from './amountKeys';

describe('amount keys', () => {
  it('appends digits', () => {
    expect(addDigits('18', '0')).toBe('180');
    expect(addDigits('18', '000')).toBe('18000');
  });
  it('has no leading zeros', () => {
    expect(addDigits('', '0')).toBe('');
    expect(addDigits('', '000')).toBe('');
  });
  it('stops at seven digits, without a partial "000"', () => {
    expect(addDigits('123456', '7')).toBe('1234567');
    expect(addDigits('1234567', '8')).toBe('1234567');
    expect(addDigits('123456', '000')).toBe('123456');
  });
  it('erases the last digit', () => {
    expect(eraseDigit('180')).toBe('18');
    expect(eraseDigit('')).toBe('');
  });
});
