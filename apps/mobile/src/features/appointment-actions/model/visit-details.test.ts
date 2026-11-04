import { describe, expect, it } from '@jest/globals';
import { durationOptions } from './visit-details';

describe('durationOptions', () => {
  it('steps by 15 minutes around the current length', () => {
    const options = durationOptions(90);
    expect(options).toContain(90);
    expect(options).toContain(75);
    expect(options).toContain(105);
    expect(options[0]).toBe(30);
  });

  it('keeps a length off the grid selectable', () => {
    expect(durationOptions(47)).toContain(47);
    expect(durationOptions(47)).toContain(45);
  });

  it('never goes below 15 minutes', () => {
    expect(Math.min(...durationOptions(15))).toBe(15);
  });
});
