/**
 * One notification (design AppNotifs, AppNotifsSwipe): a round icon of its kind, the title, when,
 * the visit in two lines and what can be done about it. Unread is grey, bold and has a pink dot.
 * Swiped left it offers "Прочитано" and the bin.
 */
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useAppointmentQuery } from '@/entities/appointment';
import { useClientQuery } from '@/entities/client';
import { useMoneyContext } from '@/entities/master';
import { shortName, type Notification, type NotificationKind } from '@/entities/notification';
import { useUserId } from '@/entities/session';
import { useVisitActions } from '@/features/appointment-actions';
import { formatTime } from '@/shared/lib/formats';
import { Icon, Text, type IconName } from '@/shared/ui';

const KIND_LOOK: Record<
  NotificationKind,
  { icon: IconName; tone: 'success' | 'danger' | 'warning' }
> = {
  booking_new: { icon: 'calendar', tone: 'success' },
  booking_cancelled: { icon: 'cancelCircle', tone: 'danger' },
  booking_moved: { icon: 'reschedule', tone: 'warning' },
};

const HOUR = 3_600_000;

export function NotificationCard({
  item,
  now,
  onOpen,
  onRead,
  onDelete,
}: {
  item: Notification;
  now: number;
  onOpen: () => void;
  onRead: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const userId = useUserId() ?? '';
  const money = useMoneyContext(userId);
  const swipe = useRef<SwipeableMethods>(null);
  const appointment = useAppointmentQuery(item.appointment_id ?? undefined).data;
  const client = useClientQuery(item.client_id ?? undefined).data;

  const todayKey = DateTime.fromMillis(now, { zone: money.zone }).toISODate() ?? '';
  const visits = useVisitActions({
    zone: money.zone,
    todayKey,
    timeFormat: money.timeFormat,
    currency: money.currency,
    locale: money.locale,
  });

  const unread = !item.read_at;
  const look = KIND_LOOK[item.kind];
  const tone = theme.colors.tone[look.tone];

  const clock = (iso: string) =>
    formatTime(iso, { zone: money.zone, timeFormat: money.timeFormat });
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];

  /** "завтра, 14:00", "5 нояб, 12:00". */
  const visitWhen = (iso: string) => {
    const local = DateTime.fromISO(iso, { zone: 'utc' }).setZone(money.zone);
    const today = DateTime.fromMillis(now, { zone: money.zone }).startOf('day');
    const days = Math.round(local.startOf('day').diff(today, 'days').days);
    const day =
      days === 0
        ? t('notifications.today')
        : days === 1
          ? t('notifications.tomorrow')
          : `${local.day} ${monthsShort[local.month - 1]}`;
    return `${day}, ${clock(iso)}`;
  };

  /** "5 мин", "1 ч", "Вчера, 20:00", "31 окт". */
  const age = () => {
    const created = DateTime.fromISO(item.created_at, { zone: 'utc' }).setZone(money.zone);
    const ms = now - created.toMillis();
    const today = DateTime.fromMillis(now, { zone: money.zone }).startOf('day');
    const days = Math.round(today.diff(created.startOf('day'), 'days').days);
    if (days <= 0) {
      return ms < HOUR
        ? t('notifications.minutesAgo', { count: Math.max(1, Math.floor(ms / 60_000)) })
        : t('notifications.hoursAgo', { count: Math.floor(ms / HOUR) });
    }
    if (days === 1) return t('notifications.yesterdayAt', { time: clock(item.created_at) });
    return `${created.day} ${monthsShort[created.month - 1]}`;
  };

  const { payload } = item;
  const name = shortName(payload.client_name);
  const services = (payload.services ?? []).join(', ');
  const start = payload.start_at ?? null;
  const body = (() => {
    if (item.kind === 'booking_moved' && start && payload.from_start_at) {
      const move = `${visitWhen(payload.from_start_at)} → ${visitWhen(start)}`;
      return [name, services, move].filter(Boolean).join(' · ');
    }
    const when = start ? visitWhen(start) : null;
    if (item.kind === 'booking_cancelled') {
      return `${[name, services, when].filter(Boolean).join(' · ')}. ${t('notifications.slotFree')}`;
    }
    const price = payload.price ? money.money(payload.price) : null;
    return [name, services, when, price].filter(Boolean).join(' · ');
  })();

  const visit = appointment
    ? {
        appointment,
        client: client ?? undefined,
        serviceNames: payload.services ?? [],
        price: payload.price ?? 0,
      }
    : null;

  const run = (action: 'confirm' | 'decline' | 'propose_time' | 'whatsapp') => {
    onRead();
    visits.run(visit, action);
  };

  // Each action only while it still applies: the master may have dealt with it elsewhere.
  const actions: { key: string; label: string; primary?: boolean; onPress: () => void }[] = [];
  if (item.kind === 'booking_new' && appointment?.status === 'pending') {
    actions.push(
      {
        key: 'confirm',
        label: t('notifications.confirm'),
        primary: true,
        onPress: () => run('confirm'),
      },
      { key: 'decline', label: t('notifications.decline'), onPress: () => run('decline') },
    );
  }
  if (item.kind === 'booking_cancelled' && visit) {
    actions.push({
      key: 'propose',
      label: t('notifications.proposeTime'),
      onPress: () => run('propose_time'),
    });
  }
  if (item.kind === 'booking_moved' && visit) {
    actions.push({
      key: 'write',
      label: t('notifications.write'),
      onPress: () => run('whatsapp'),
    });
  }

  const open = () => {
    onOpen();
    if (item.appointment_id) {
      router.push({
        pathname: '/appointment/[appointmentId]',
        params: { appointmentId: item.appointment_id },
      });
    }
  };

  return (
    <ReanimatedSwipeable
      ref={swipe}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.swipe}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onRead();
              swipe.current?.close();
            }}
            style={styles.readAction}>
            <Icon name="check" size="md" />
            <Text variant="caption2Strong">{t('notifications.markRead')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.delete')}
            onPress={onDelete}
            style={styles.deleteAction}>
            <Icon name="trash" size="md" color="constant.white" />
          </Pressable>
        </View>
      )}>
      <Pressable
        accessibilityRole="button"
        onPress={open}
        style={[styles.card, unread ? styles.unread : styles.read]}>
        <View style={[styles.icon, { backgroundColor: tone.bg }]}>
          <Icon name={look.icon} size={20} color={`tone.${look.tone}.fg`} />
        </View>
        <View style={styles.main}>
          <View style={styles.head}>
            <Text variant={unread ? 'bodyStrong' : 'body'} numberOfLines={1} style={styles.title}>
              {t(`notifications.kinds.${item.kind}`)}
            </Text>
            <Text variant="caption" color="tertiary" tabularNums>
              {age()}
            </Text>
            {unread ? <View style={styles.dot} /> : null}
          </View>
          <Text variant="footnote" color="secondary" numberOfLines={2}>
            {body}
          </Text>
          {actions.length ? (
            <View style={styles.actions}>
              {actions.map((action) => (
                <Pressable
                  key={action.key}
                  accessibilityRole="button"
                  onPress={action.onPress}
                  style={({ pressed }) => [
                    styles.action,
                    action.primary && styles.actionPrimary,
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    variant="footnoteStrong"
                    color={action.primary ? 'onAccent' : 'primary'}
                    numberOfLines={1}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    gap: theme.space[3],
    padding: theme.space[3.5],
    borderRadius: 18,
    borderWidth: 1,
  },
  unread: { backgroundColor: theme.colors.bg.surface, borderColor: theme.colors.bg.surface },
  read: { backgroundColor: theme.colors.bg.canvas, borderColor: theme.colors.border.default },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: { flex: 1, minWidth: 0, gap: 3 },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  title: { flex: 1, minWidth: 0 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.brand.default,
  },
  actions: { flexDirection: 'row', gap: 6, marginTop: 7 },
  action: {
    height: 34,
    paddingHorizontal: theme.space[3.5],
    borderRadius: 17,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.bg.canvas,
  },
  actionPrimary: {
    backgroundColor: theme.colors.accent.default,
    borderColor: theme.colors.accent.default,
  },
  swipe: { width: 148, flexDirection: 'row', gap: 6, paddingLeft: theme.space[2] },
  readAction: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[1],
    backgroundColor: theme.colors.bg.surface,
  },
  deleteAction: {
    width: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.feedback.danger,
  },
  pressed: { opacity: 0.7 },
}));
