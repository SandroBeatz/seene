/** "Рабочие часы" (design AppHours): the week, then days off and vacations. */
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  scheduleForWeekday,
  useUpdateMasterWeek,
  type DaySchedule,
  type TimeRange,
} from '@/entities/master';
import { type TimeBlock, useDaysOffQuery } from '@/entities/time-block';
import { useTimeContext } from '@/features/pick-time';
import { isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import {
  GroupedCard,
  Icon,
  ListItem,
  ScreenScrollView,
  SectionLabel,
  Switch,
  Text,
} from '@/shared/ui';
import { blockDays, daysInRange, rangeLabel } from '../lib/day-off';
import { setDayEnabled, withDay } from '../lib/week';

/** A vacation's length is shown from this many days; a short one reads from its dates. */
const SHOW_LENGTH_FROM_DAYS = 3;

const WEEK = [0, 1, 2, 3, 4, 5, 6] as const;
const rangeText = (r: TimeRange) => `${r.start}–${r.end}`;

export function HoursScreen() {
  const { t } = useTranslation();
  const ctx = useTimeContext();
  const update = useUpdateMasterWeek(ctx.userId);
  // Fixed on opening, so the list's key doesn't change while the screen is up.
  const [openedAt] = useState(() => new Date().toISOString());
  const daysOff = useDaysOffQuery(ctx.userId, openedAt);
  const long = t('weekdays.long', { returnObjects: true }) as string[];
  const { schedule } = ctx;
  if (!schedule) return null;

  const week = WEEK.map((i) => scheduleForWeekday(schedule, i));
  const toggle = (index: number, enabled: boolean) =>
    update.mutate(withDay(week, index, setDayEnabled(week[index]!, enabled)), {
      onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
    });

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <GroupedCard variant="menu">
        {week.map((day, index) => (
          <DayRow
            key={index}
            name={long[index] ?? ''}
            day={day}
            onToggle={(enabled) => toggle(index, enabled)}
            onPress={() =>
              router.push({ pathname: '/hours/day', params: { day: String(index) } })
            }
          />
        ))}
      </GroupedCard>
      <Text variant="caption" color="tertiary" style={styles.hint}>
        {t('menuHome.hours.hint')}
      </Text>

      <View style={styles.label}>
        <SectionLabel label={t('menuHome.hours.offSection')} />
      </View>
      {daysOff.data?.length ? (
        <GroupedCard variant="menu">
          {daysOff.data.map((block) => (
            <DayOffRow key={block.id} block={block} zone={ctx.zone} />
          ))}
        </GroupedCard>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/hours/off')}
        style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
        <Text variant="subheadStrong">{t('menuHome.hours.add')}</Text>
      </Pressable>
    </ScreenScrollView>
  );
}

function DayRow({
  name,
  day,
  onToggle,
  onPress,
}: {
  name: string;
  day: DaySchedule;
  onToggle: (enabled: boolean) => void;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const breaks = day.breaks.length
    ? t('menuHome.hours.breakOne', { range: day.breaks.map(rangeText).join(', ') })
    : t('menuHome.hours.breakNone');
  return (
    <View style={styles.day}>
      <Switch
        value={day.enabled}
        onValueChange={onToggle}
        accessibilityLabel={t('menuHome.hours.workDayA11y', { day: name })}
      />
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.dayBody, pressed && styles.pressed]}>
        <View style={styles.dayText}>
          <Text variant="body" numberOfLines={1}>
            {name}
          </Text>
          {day.enabled ? (
            <Text variant="caption" color="tertiary" numberOfLines={1}>
              {breaks}
            </Text>
          ) : null}
        </View>
        <Text variant="subheadStrong" color={day.enabled ? 'primary' : 'tertiary'} tabularNums>
          {day.enabled ? `${day.start} – ${day.end}` : t('menuHome.hours.dayOff')}
        </Text>
        <Icon name="chevronRight" size="sm" color="content.tertiary" />
      </Pressable>
    </View>
  );
}

function DayOffRow({ block, zone }: { block: TimeBlock; zone: string }) {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const months = t('monthsGenitive', { returnObjects: true }) as string[];
  const { first, last } = blockDays(block, zone);
  const count = daysInRange(first, last);
  const dates = rangeLabel(first, last, months);
  const subtitle =
    count >= SHOW_LENGTH_FROM_DAYS
      ? `${dates} · ${t(`menuHome.hours.days_${pluralCategory(count, locale)}`, { count })}`
      : dates;
  return (
    <ListItem
      size="menu"
      inset={false}
      title={
        block.notes?.trim() ||
        t(block.kind === 'vacation' ? 'menuHome.hours.kindVacation' : 'menuHome.hours.kindDayOff')
      }
      subtitle={subtitle}
      onPress={() => router.push({ pathname: '/hours/off', params: { id: block.id } })}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingHorizontal: theme.space[5], paddingTop: theme.space[2] },
  hint: { marginTop: theme.space[2], marginHorizontal: theme.space[1] },
  label: { marginTop: theme.space[5.5], marginBottom: theme.space[2], marginHorizontal: theme.space[1] },
  day: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  dayBody: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: theme.space[2.5] },
  dayText: { flex: 1, minWidth: 0, gap: theme.space[0.5] },
  add: {
    marginTop: theme.space[2.5],
    height: theme.sizing.control.lg,
    borderRadius: theme.radius.field,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
}));
