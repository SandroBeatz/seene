/**
 * "Новая запись · 3 из 4: день и окно" (design "AppNewTime"): the months on screen
 * (a tap opens the month calendar), a strip of days with a dot for how full each is,
 * then the chosen day's grid by morning / afternoon / evening — struck through when
 * taken, dashed when open but the visit doesn't fit — and "Указать своё время".
 */
import { useEffect, useMemo, useRef } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { formatDurationLabel } from '@/shared/lib/i18n';
import { dayPart, type DayLoad, type DayPart, type GridSlot } from '@/shared/lib/scheduling';
import { Icon, Skeleton, Text, useNow } from '@/shared/ui';
import { useDayGrid } from '../model/useDayGrid';
import { useFlowData } from '../model/useFlowData';
import { StepChrome } from './StepChrome';
import { StepFooter } from './StepFooter';

/** How far ahead the strip goes. */
export const DAYS_AHEAD = 90;
const DAY_WIDTH = 46;
const DAY_GAP = 4;
const PARTS: DayPart[] = ['morning', 'afternoon', 'evening'];

export function TimeStep() {
  const flow = useFlowData();
  const { t, zone, draft } = flow;
  const { theme } = useUnistyles();
  const now = useNow();
  const strip = useRef<ScrollView>(null);

  const todayKey = DateTime.fromMillis(now, { zone }).toISODate()!;
  const dayKey = draft.dayKey ?? todayKey;
  // A day picked in the month calendar may lie before today.
  const fromKey = dayKey < todayKey ? dayKey : todayKey;
  const lastKey = DateTime.fromISO(todayKey, { zone })
    .plus({ days: DAYS_AHEAD - 1 })
    .toISODate()!;

  const days = useMemo(() => {
    const out: string[] = [];
    for (
      let d = DateTime.fromISO(fromKey, { zone });
      d.toISODate()! <= lastKey;
      d = d.plus({ days: 1 })
    ) {
      out.push(d.toISODate()!);
    }
    return out;
  }, [fromKey, lastKey, zone]);

  const grid = useDayGrid({
    userId: flow.userId,
    zone,
    schedule: flow.schedule,
    stepMinutes: flow.stepMinutes,
    duration: flow.duration,
    now,
    fromKey,
    toKey: lastKey,
  });

  // First visit to the step: the first day that still has room.
  useEffect(() => {
    if (draft.dayKey || grid.isPending) return;
    const open = days.find((key) => {
      const load = grid.loads.get(key);
      return load === 'open' || load === 'tight';
    });
    draft.setDay(open ?? todayKey);
  }, [draft, grid.isPending, grid.loads, days, todayKey]);

  // Keep the chosen day in view.
  useEffect(() => {
    const index = days.indexOf(dayKey);
    if (index < 0) return;
    const x = Math.max(0, index * (DAY_WIDTH + DAY_GAP) - (DAY_WIDTH + DAY_GAP));
    strip.current?.scrollTo({ x, animated: true });
  }, [dayKey, days]);

  const weekdays = t('weekdays.short', { returnObjects: true }) as string[];
  const months = t('months', { returnObjects: true }) as string[];
  const day = DateTime.fromISO(dayKey, { zone });
  const weekLater = day.plus({ days: 6 });
  const monthLabel =
    weekLater.month === day.month
      ? months[day.month - 1]
      : `${months[day.month - 1]} – ${months[weekLater.month - 1]?.toLocaleLowerCase()}`;

  const workday = grid.workdayOf(dayKey);
  const slots = grid.isPending ? null : grid.gridOf(dayKey);
  const groups = slots
    ? PARTS.map((part) => ({
        part,
        slots: slots.filter((s) => dayPart(s.start, zone) === part),
      })).filter((g) => g.slots.length > 0)
    : null;
  const durationLabel = formatDurationLabel(flow.duration, t);
  const hoursLabel = workday?.enabled
    ? t('quickCreate.time.hours', {
        from: workday.start,
        to: workday.end,
        duration: durationLabel,
      })
    : t('quickCreate.time.dayOffShort');

  const chosen = draft.start;
  const pickSlot = (slot: GridSlot) => {
    if (slot.state !== 'free') return;
    draft.setStart(slot.start === chosen && !draft.ownTime ? null : slot.start);
  };

  const dotColor = (load: DayLoad | undefined) =>
    load === 'open'
      ? theme.colors.feedback.success
      : load === 'tight' || load === 'full'
        ? theme.colors.feedback.warning
        : 'transparent';

  return (
    <View style={styles.root} collapsable={false}>
      <StepChrome step={3} subtitle={t('quickCreate.time.subtitle')} client={flow.client} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('quickCreate.time.monthA11y')}
          onPress={() => router.push('/quick-create/month')}
          style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}>
          <Text variant="headline">{monthLabel}</Text>
          <Icon name="chevronDown" size="sm" color="content.primary" />
        </Pressable>

        <ScrollView
          ref={strip}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.stripScroll}
          contentContainerStyle={styles.strip}>
          {days.map((key) => {
            const on = key === dayKey;
            const local = DateTime.fromISO(key, { zone });
            // Days gone by carry no dot.
            const load = key < todayKey ? undefined : grid.loads.get(key);
            const off = load === 'off';
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${weekdays[local.weekday - 1]} ${local.day}`}
                onPress={() => draft.setDay(key)}
                style={[styles.day, on && styles.dayOn]}>
                <Text variant="footnote" color={on ? 'onAccent' : off ? 'disabled' : 'secondary'}>
                  {weekdays[local.weekday - 1]}
                </Text>
                <Text
                  variant="tile"
                  color={on ? 'onAccent' : off ? 'disabled' : 'primary'}
                  tabularNums
                  style={off && !on ? styles.offNumber : undefined}>
                  {local.day}
                </Text>
                <View
                  style={[
                    styles.dayDot,
                    {
                      backgroundColor:
                        on && load && load !== 'off'
                          ? theme.colors.accent.onAccent
                          : dotColor(load),
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.legend}>
          <Legend color={theme.colors.feedback.success} label={t('quickCreate.time.legendOpen')} />
          <Legend color={theme.colors.feedback.warning} label={t('quickCreate.time.legendTight')} />
          <Text variant="footnote" color="tertiary">
            {t('quickCreate.time.legendOff')}
          </Text>
        </View>

        <View style={styles.dayHead}>
          <Text variant="headline">{flow.dayLabel(dayKey)}</Text>
          <Text variant="footnote" color="tertiary" numberOfLines={1} style={styles.shrink}>
            {hoursLabel}
          </Text>
        </View>

        {groups === null ? (
          <Skeleton height={180} radius={12} />
        ) : groups.length === 0 ? (
          <Text variant="footnote" color="tertiary" style={styles.noSlots}>
            {!workday?.enabled
              ? t('quickCreate.time.dayOff')
              : dayKey < todayKey
                ? t('quickCreate.time.past')
                : t('quickCreate.time.full')}
          </Text>
        ) : (
          <>
            {groups.map((group) => (
              <View key={group.part} style={styles.group}>
                <Text variant="footnote" color="tertiary">
                  {t(`reschedule.parts.${group.part}`)}
                </Text>
                <View style={styles.grid}>
                  {group.slots.map((slot) => {
                    const on = slot.start === chosen && !draft.ownTime;
                    return (
                      <Pressable
                        key={slot.start}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on, disabled: slot.state !== 'free' }}
                        accessibilityLabel={`${flow.time(slot.start)}${slot.state === 'free' ? '' : `, ${t(`quickCreate.time.${slot.state}A11y`)}`}`}
                        disabled={slot.state !== 'free'}
                        onPress={() => pickSlot(slot)}
                        style={[
                          styles.slot,
                          slot.state === 'busy' && styles.slotBusy,
                          slot.state === 'short' && styles.slotShort,
                          on && styles.slotOn,
                        ]}>
                        <Text
                          variant="bodyLarge"
                          color={on ? 'onAccent' : slot.state === 'free' ? 'primary' : 'disabled'}
                          tabularNums
                          style={slot.state === 'busy' ? styles.struck : undefined}>
                          {flow.time(slot.start)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
            <View style={styles.legend}>
              <Text variant="footnote" color="tertiary">
                {t('quickCreate.time.legendBusy')}
              </Text>
              <Text variant="footnote" color="tertiary">
                {t('quickCreate.time.legendShort', { duration: durationLabel })}
              </Text>
            </View>
          </>
        )}

        {draft.ownTime && chosen ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/quick-create/custom-time')}
            style={({ pressed }) => [styles.own, styles.ownOn, pressed && styles.pressed]}>
            <Icon name="clock" size="base" color="content.primary" />
            <Text variant="bodyStrong" style={styles.grow}>
              {t('quickCreate.time.own')}
            </Text>
            <Text variant="bodyStrong" tabularNums>
              {flow.range(chosen).replace('–', ' – ')}
            </Text>
            <Icon name="pencil" size="sm" color="content.primary" />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/quick-create/custom-time')}
            style={({ pressed }) => [styles.own, pressed && styles.pressed]}>
            <Icon name="clock" size="base" color="content.primary" />
            <Text variant="bodyStrong">{t('quickCreate.time.ownAction')}</Text>
          </Pressable>
        )}
      </ScrollView>

      <StepFooter
        title={
          chosen
            ? `${flow.dayLabel(flow.dayKeyOf(chosen))}, ${flow.range(chosen)}`
            : t('quickCreate.time.pick')
        }
        subtitle={`${durationLabel} · ${flow.picked.map((s) => s.name).join(', ')}`}
        actionLabel={t('quickCreate.next')}
        disabled={!chosen}
        onAction={() => router.push('/quick-create/review')}
      />
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text variant="footnote" color="tertiary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  scroll: { flex: 1 },
  content: {
    paddingTop: theme.space[4],
    paddingHorizontal: theme.space[4],
    paddingBottom: 150,
    gap: theme.space[4],
  },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1.5],
    alignSelf: 'flex-start',
  },
  stripScroll: { marginHorizontal: -theme.space[4], flexGrow: 0, marginTop: -theme.space[1] },
  strip: { gap: DAY_GAP, paddingHorizontal: theme.space[4] },
  day: {
    width: DAY_WIDTH,
    height: 64,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayOn: { backgroundColor: theme.colors.accent.default },
  offNumber: { opacity: 0.8 },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: theme.space[3], rowGap: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1] },
  legendDot: { width: 5, height: 5, borderRadius: 3 },
  dayHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.space[3],
    marginTop: theme.space[1],
  },
  shrink: { flexShrink: 1 },
  grow: { flex: 1 },
  noSlots: { paddingVertical: theme.space[4] },
  group: { gap: theme.space[2] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[1.5] },
  slot: {
    width: '23.5%',
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBusy: { backgroundColor: theme.colors.bg.surface, borderColor: theme.colors.border.subtle },
  slotShort: { borderStyle: 'dashed' },
  slotOn: {
    backgroundColor: theme.colors.accent.default,
    borderColor: theme.colors.accent.default,
  },
  struck: { textDecorationLine: 'line-through' },
  own: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2.5],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.field,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.default,
  },
  ownOn: { borderStyle: 'solid', borderColor: theme.colors.accent.default },
  pressed: { opacity: 0.7 },
}));
