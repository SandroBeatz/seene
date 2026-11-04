/** Notification entity — public barrel. */
export { categoryOf, feedDay, groupByDay, shortName, type FeedDay } from './lib/feed';
export {
  notificationKeys,
  useDeleteNotificationMutation,
  useDeleteReadNotificationsMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useUnreadNotificationsCount,
} from './model/queries';
export type {
  Notification,
  NotificationCategory,
  NotificationKind,
  VisitPayload,
} from './model/types';
