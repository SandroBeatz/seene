import { describe, expect, it } from '@jest/globals';
import { visitTemplates } from './visit-templates';

describe('visitTemplates', () => {
  it('offers reminders before the visit', () => {
    expect(visitTemplates('upcoming', null)).toEqual(['reminder', 'confirmation', 'reschedule']);
  });

  it('offers nothing while it is going on', () => {
    expect(visitTemplates('ongoing', null)).toEqual([]);
  });

  it('offers thanks once it is over', () => {
    expect(visitTemplates('completed', null)).toEqual(['thanks', 'recall']);
    expect(visitTemplates('awaiting', null)).toEqual(['thanks', 'recall']);
  });

  it('asks a client who did not come to book again', () => {
    expect(visitTemplates('no_show', null)).toEqual(['missed', 'recall']);
  });

  it('tells a client about the master cancelling', () => {
    expect(visitTemplates('cancelled', 'master')).toEqual(['cancellation', 'recall']);
  });

  it('does not tell a client about their own cancelling', () => {
    expect(visitTemplates('cancelled', 'client')).toEqual(['recall']);
  });
});
