/**
 * The "when" of personal time, for creating and for moving it: the days, "Весь день" —
 * a day off, a holiday, sick leave — and otherwise how long and from what time, on the
 * same grid as a visit (taken time struck through) or "Указать своё время".
 */
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { isShownInSchedule, useAppointmentsRangeQuery } from '@/entities/appointment';
import { DayTimePicker } from '@/features/pick-time';
import { formatDurationLabel } from '@/shared/lib/i18n';
import { Chip, Switch, Text } from '@/shared/ui';
import { PERSONAL_LENGTHS } from '../model/draft.store';
import { usePersonalTime } from '../model/usePersonalTime';

export interface TimeFieldsProps {
  /** The block being moved: its own time is free. */
  excludeId?: string;
  onOpenMonth: () => void;
  onOpenOwnTime: () => void;
}

export function TimeFields({ excludeId, onOpenMonth, onOpenOwnTime }: TimeFieldsProps) {
  const { t } = useTranslation();
  const { ctx, draft, dayKey, record } = usePersonalTime();
  // The grid shows what is taken; with no grid, the whole day needs saying so.
  const allDayRange = draft.allDay ? record : null;
  const visits = useAppointmentsRangeQuery(
    ctx.userId,
    allDayRange?.start_at ?? '',
    allDayRange?.end_at ?? '',
  );
  const visitCount = allDayRange ? (visits.data ?? []).filter(isShownInSchedule).length : 0;

  const between = (
    <View style={styles.between}>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: draft.allDay }}
        accessibilityLabel={t('personalTime.when.allDay')}
        onPress={() => draft.setAllDay(!draft.allDay)}
        style={styles.allDay}>
        <View style={styles.grow}>
          <Text variant="body">{t('personalTime.when.allDay')}</Text>
          <Text variant="footnote" color="tertiary">
            {t('personalTime.when.allDayHint')}
          </Text>
        </View>
        <Switch value={draft.allDay} onValueChange={draft.setAllDay} />
      </Pressable>

      {visitCount > 0 ? (
        <Text variant="footnote" color="warning" style={styles.warning}>
          {t('personalTime.when.allDayVisits', { count: visitCount })}
        </Text>
      ) : null}

      {draft.allDay ? null : (
        <View style={styles.lengths}>
          <Text variant="footnote" color="tertiary">
            {t('personalTime.when.length')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chips}>
            {PERSONAL_LENGTHS.map((minutes) => (
              <Chip
                key={minutes}
                shape="pill"
                label={formatDurationLabel(minutes, t)}
                selected={draft.length === minutes}
                onPress={() => draft.setLength(minutes)}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <DayTimePicker
      purpose="personal"
      duration={draft.length}
      excludeId={excludeId}
      dayKey={dayKey}
      start={draft.start}
      ownTime={draft.ownTime}
      between={between}
      dayOnly={draft.allDay}
      onDay={draft.setDay}
      onStart={draft.setStart}
      onOpenMonth={onOpenMonth}
      onOpenOwnTime={onOpenOwnTime}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  between: { gap: theme.space[4] },
  allDay: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[2.5],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.surface,
  },
  grow: { flex: 1, minWidth: 0, gap: 2 },
  warning: { marginTop: -theme.space[2], paddingHorizontal: theme.space[1] },
  lengths: { gap: theme.space[1.5] },
  chipsScroll: { marginHorizontal: -theme.space[4], flexGrow: 0 },
  chips: { gap: theme.space[1.5], paddingHorizontal: theme.space[4] },
}));
