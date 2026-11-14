import { describe, expect, it } from '@jest/globals';
import { NOTIFICATION_DEFAULTS, readNotificationPrefs } from './notification-prefs';

describe('readNotificationPrefs', () => {
  it('gives the defaults for nothing stored', () => {
    expect(readNotificationPrefs({})).toEqual(NOTIFICATION_DEFAULTS);
    expect(readNotificationPrefs(null)).toEqual(NOTIFICATION_DEFAULTS);
  });

  it('keeps the weekly summary and news off by default', () => {
    expect(NOTIFICATION_DEFAULTS.week_summary).toBe(false);
    expect(NOTIFICATION_DEFAULTS.seene_news).toBe(false);
  });

  it('lays what was stored over the defaults', () => {
    const prefs = readNotificationPrefs({ booking_new: false, quiet_from: '23:30' });
    expect(prefs.booking_new).toBe(false);
    expect(prefs.quiet_from).toBe('23:30');
    expect(prefs.badge).toBe(true);
  });

  it('ignores unknown keys and wrong types', () => {
    const prefs = readNotificationPrefs({ nope: true, badge: 'yes' });
    expect(prefs).toEqual(NOTIFICATION_DEFAULTS);
  });
});
