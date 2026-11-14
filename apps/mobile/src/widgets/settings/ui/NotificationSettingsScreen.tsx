/**
 * "Настройки уведомлений" (design AppNotifSettings). Turned off, a kind doesn't reach the feed.
 * The push switch itself comes with push notifications.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  readNotificationPrefs,
  useMasterSettingsQuery,
  useUpdateMasterSettings,
  type NotificationPrefs,
} from '@/entities/master';
import { useUserId } from '@/entities/session';
import { formatTime } from '@/shared/lib/formats';
import {
  Icon,
  ListItem,
  MenuGroup,
  ScreenScrollView,
  Switch,
  Text,
  TimePicker,
  showFailedToast,
  type IconName,
} from '@/shared/ui';

type SwitchKey = {
  [K in keyof NotificationPrefs]: NotificationPrefs[K] extends boolean ? K : never;
}[keyof NotificationPrefs];

const GROUPS: { label: string; rows: { key: SwitchKey; icon: IconName; hint?: boolean }[] }[] = [
  {
    label: 'visits',
    rows: [
      { key: 'booking_new', icon: 'calendar' },
      { key: 'booking_cancelled', icon: 'cancelCircle' },
      { key: 'booking_moved', icon: 'reschedule' },
      { key: 'visit_unconfirmed', icon: 'unconfirmed', hint: true },
    ],
  },
  {
    label: 'clients',
    rows: [
      { key: 'broadcast_due', icon: 'send', hint: true },
      { key: 'birthday', icon: 'userCircle', hint: true },
    ],
  },
  {
    label: 'money',
    rows: [
      { key: 'day_summary', icon: 'cash', hint: true },
      { key: 'week_summary', icon: 'cash', hint: true },
      { key: 'low_stock', icon: 'tag' },
    ],
  },
  { label: 'seene', rows: [{ key: 'seene_news', icon: 'bell', hint: true }] },
];

export function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const settings = useMasterSettingsQuery(userId);
  const update = useUpdateMasterSettings(userId);
  const [editing, setEditing] = useState<'quiet_from' | 'quiet_to' | null>(null);

  const prefs = readNotificationPrefs(settings.data?.notification_prefs);
  const timeFormat = settings.data?.time_format === 12 ? 12 : 24;

  const save = (patch: Partial<NotificationPrefs>) =>
    update.mutate(
      { notification_prefs: { ...prefs, ...patch } },
      { onError: () => showFailedToast(() => save(patch)) },
    );

  // The clock as the master reads it; the zone doesn't matter for a bare "22:00".
  const clock = (time: string) => formatTime(`2026-01-01T${time}:00Z`, { zone: 'utc', timeFormat });

  const row = (key: SwitchKey, icon: IconName | null, hint?: string) => (
    <ListItem
      key={key}
      size="menu"
      inset={false}
      left={icon ? <Icon name={icon} size="md" color="content.secondary" /> : undefined}
      title={t(`notifications.settings.${key}`)}
      subtitle={hint}
      right={
        <Switch
          value={prefs[key]}
          onValueChange={(value) => save({ [key]: value })}
          accessibilityLabel={t(`notifications.settings.${key}`)}
        />
      }
    />
  );

  const timeRow = (key: 'quiet_from' | 'quiet_to') => (
    <ListItem
      key={key}
      size="menu"
      inset={false}
      title={t(`notifications.settings.${key}`)}
      trailingText={clock(prefs[key])}
      onPress={() => setEditing(key)}
    />
  );

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      {GROUPS.map((group) => (
        <MenuGroup key={group.label} label={t(`notifications.filters.${group.label}`)}>
          {group.rows.map(({ key, icon, hint }) =>
            row(key, icon, hint ? t(`notifications.settings.${key}Hint`) : undefined),
          )}
        </MenuGroup>
      ))}

      <MenuGroup label={t('notifications.settings.mode')}>
        {row(
          'quiet_hours',
          null,
          t('notifications.settings.quietHint', {
            from: clock(prefs.quiet_from),
            to: clock(prefs.quiet_to),
          }),
        )}
        {prefs.quiet_hours ? timeRow('quiet_from') : null}
        {prefs.quiet_hours ? timeRow('quiet_to') : null}
        {row('badge', null)}
      </MenuGroup>

      <View style={styles.note}>
        <Text variant="caption" color="tertiary">
          {t('notifications.settings.note')}
        </Text>
      </View>

      <TimePicker
        visible={editing !== null}
        value={editing ? prefs[editing] : '00:00'}
        title={editing ? t(`notifications.settings.${editing}`) : ''}
        cancelLabel={t('common.cancel')}
        doneLabel={t('common.confirm')}
        onCancel={() => setEditing(null)}
        onConfirm={(time) => {
          if (editing) save({ [editing]: time });
          setEditing(null);
        }}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    paddingHorizontal: theme.space[5],
    paddingTop: 0,
    paddingBottom: theme.space[10],
  },
  note: { marginTop: theme.space[3], marginHorizontal: theme.space[1] },
}));
