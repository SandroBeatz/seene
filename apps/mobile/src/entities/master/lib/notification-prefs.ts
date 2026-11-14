/** What the master wants to be told (design AppNotifSettings): the stored keys over the defaults. */
export const NOTIFICATION_DEFAULTS = {
  booking_new: true,
  booking_cancelled: true,
  booking_moved: true,
  visit_unconfirmed: true,
  broadcast_due: true,
  birthday: true,
  day_summary: true,
  week_summary: false,
  low_stock: true,
  seene_news: false,
  quiet_hours: true,
  quiet_from: '22:00',
  quiet_to: '08:00',
  badge: true,
};

export type NotificationPrefs = typeof NOTIFICATION_DEFAULTS;

export function readNotificationPrefs(stored: unknown): NotificationPrefs {
  const prefs = { ...NOTIFICATION_DEFAULTS } as Record<string, boolean | string>;
  if (stored && typeof stored === 'object') {
    for (const [key, value] of Object.entries(stored)) {
      // A value of the wrong type is as good as none.
      if (key in prefs && typeof value === typeof prefs[key])
        prefs[key] = value as boolean | string;
    }
  }
  return prefs as NotificationPrefs;
}
