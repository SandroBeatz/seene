import { describe, expect, it } from '@jest/globals';
import { wheelTimes } from './types';

describe('wheelTimes', () => {
  it('covers the day at the step', () => {
    const times = wheelTimes('10:00', 30);
    expect(times).toHaveLength(48);
    expect(times[0]).toBe('00:00');
    expect(times[47]).toBe('23:30');
  });
  it('keeps a saved time that is off the step, in order', () => {
    const times = wheelTimes('10:10', 30);
    expect(times).toHaveLength(49);
    expect(times.slice(20, 23)).toEqual(['10:00', '10:10', '10:30']);
  });
});
