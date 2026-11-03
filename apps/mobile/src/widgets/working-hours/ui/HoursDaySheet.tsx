/**
 * One day's hours (design AppHoursDay). Edits stay local until "Готово". "Так же во вт–пт"
 * starts off: it overwrites other days, so it has to be asked for. Only Monday has it, as
 * in the design.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  scheduleForWeekday,
  useUpdateMasterWeek,
  type DaySchedule,
  type StoredSchedule,
} from '@/entities/master';
import { useTimeContext } from '@/features/pick-time';
import { nextBreak } from '@/shared/lib/scheduling';
import {
  Button,
  FormScreen,
  GroupedCard,
  Icon,
  ListItem,
  SheetChrome,
  Switch,
  Text,
  TimePicker,
  TimeWheel,
} from '@/shared/ui';
import { isDayValid, setDayEnabled, withDay } from '../lib/week';

const MONDAY = 0;
const WEEK = [0, 1, 2, 3, 4, 5, 6] as const;

export function HoursDaySheet() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const { schedule, userId } = useTimeContext();
  if (!schedule) return null;
  return <DayForm index={Number(day) || 0} schedule={schedule} userId={userId} />;
}

type BreakTarget = { index: number; edge: 'start' | 'end' };

function DayForm({
  index,
  schedule,
  userId,
}: {
  index: number;
  schedule: StoredSchedule;
  userId: string;
}) {
  const { t } = useTranslation();
  const update = useUpdateMasterWeek(userId);
  const week = WEEK.map((i) => scheduleForWeekday(schedule, i));
  const [day, setDay] = useState<DaySchedule>(week[index]!);
  const [sameForWeekdays, setSameForWeekdays] = useState(false);
  const [target, setTarget] = useState<BreakTarget | null>(null);
  const long = t('weekdays.long', { returnObjects: true }) as string[];
  const labels = {
    cancelLabel: t('common.cancel'),
    doneLabel: t('common.done'),
  };

  const setBreakTime = ({ index: i, edge }: BreakTarget, time: string) => {
    setDay((d) => ({
      ...d,
      breaks: d.breaks.map((b, j) => (j === i ? { ...b, [edge]: time } : b)),
    }));
    // A break edits both ends: the start, then straight on to the end.
    setTarget(edge === 'start' ? { index: i, edge: 'end' } : null);
  };

  const save = () =>
    update.mutate(withDay(week, index, day, index === MONDAY && sameForWeekdays), {
      onSuccess: () => router.back(),
      onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
    });

  return (
    <>
      <FormScreen
        edges={['left', 'right', 'bottom']}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        footer={
          <Button
            label={t('common.done')}
            disabled={!isDayValid(day)}
            loading={update.isPending}
            onPress={save}
            fullWidth
          />
        }>
        <SheetChrome title={long[index] ?? ''} leadingLabel={t('common.close')} />
        <GroupedCard>
          <ListItem
            inset={false}
            title={t('menuHome.hours.workDay')}
            right={
              <Switch
                value={day.enabled}
                onValueChange={(enabled) => setDay((d) => setDayEnabled(d, enabled))}
                accessibilityLabel={t('menuHome.hours.workDay')}
              />
            }
          />
        </GroupedCard>

        {day.enabled ? (
          <>
            <View style={styles.edges}>
              <Edge
                label={t('menuHome.hours.start')}
                value={day.start}
                onChange={(start) => setDay((d) => ({ ...d, start }))}
                {...labels}
              />
              <Edge
                label={t('menuHome.hours.end')}
                value={day.end}
                onChange={(end) => setDay((d) => ({ ...d, end }))}
                {...labels}
              />
            </View>

            <Text variant="captionStrong" color="secondary" style={styles.breaksLabel}>
              {t('menuHome.hours.breaks')}
            </Text>
            <View style={styles.breaks}>
              {day.breaks.map((b, i) => {
                const range = `${b.start} – ${b.end}`;
                return (
                  <View key={i} style={styles.chip}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={range}
                      onPress={() => setTarget({ index: i, edge: 'start' })}
                      hitSlop={6}>
                      <Text variant="subheadStrong" tabularNums>
                        {range}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('menuHome.hours.removeBreak', { range })}
                      onPress={() =>
                        setDay((d) => ({ ...d, breaks: d.breaks.filter((_, j) => j !== i) }))
                      }
                      style={styles.chipRemove}>
                      <Icon name="close" size={14} weight="bold" color="content.tertiary" />
                    </Pressable>
                  </View>
                );
              })}
              <Pressable
                accessibilityRole="button"
                onPress={() => setDay((d) => ({ ...d, breaks: [...d.breaks, nextBreak(d.breaks)] }))}
                style={({ pressed }) => [styles.addBreak, pressed && styles.pressed]}>
                <Text variant="subheadStrong">{t('menuHome.hours.addBreak')}</Text>
              </Pressable>
            </View>

            {index === MONDAY ? (
              <View style={styles.copy}>
                <GroupedCard>
                  <ListItem
                    inset={false}
                    title={t('menuHome.hours.copyWeekdays')}
                    right={
                      <Switch
                        value={sameForWeekdays}
                        onValueChange={setSameForWeekdays}
                        accessibilityLabel={t('menuHome.hours.copyWeekdays')}
                      />
                    }
                  />
                </GroupedCard>
              </View>
            ) : null}
          </>
        ) : null}
      </FormScreen>

      <TimePicker
        visible={target !== null}
        value={target ? (day.breaks[target.index]?.[target.edge] ?? '13:00') : '13:00'}
        title={
          target?.edge === 'end'
            ? t('menuHome.hours.pickBreakEnd')
            : t('menuHome.hours.pickBreakStart')
        }
        {...labels}
        onCancel={() => setTarget(null)}
        onConfirm={(time) => target && setBreakTime(target, time)}
      />
    </>
  );
}

function Edge({
  label,
  value,
  onChange,
  cancelLabel,
  doneLabel,
}: {
  label: string;
  value: string;
  onChange: (time: string) => void;
  cancelLabel: string;
  doneLabel: string;
}) {
  return (
    <View style={styles.edge}>
      <Text variant="captionStrong" color="secondary" style={styles.edgeLabel}>
        {label}
      </Text>
      <View style={styles.wheel}>
        <TimeWheel
          value={value}
          onChange={onChange}
          title={label}
          cancelLabel={cancelLabel}
          doneLabel={doneLabel}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingTop: theme.space[2] },
  edges: { marginTop: theme.space[3.5], flexDirection: 'row', gap: theme.space[2.5] },
  edge: { flex: 1, gap: theme.space[1.5] },
  edgeLabel: { paddingLeft: theme.space[1] },
  wheel: { flexDirection: 'row' },
  breaksLabel: { marginTop: theme.space[4], marginBottom: theme.space[2], marginLeft: theme.space[1] },
  breaks: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[1.5] },
  chip: {
    height: theme.sizing.control.xs,
    paddingLeft: theme.space[3.5],
    paddingRight: theme.space[2],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1.5],
  },
  chipRemove: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  addBreak: {
    height: theme.sizing.control.xs,
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.strong,
    justifyContent: 'center',
  },
  copy: { marginTop: theme.space[3.5] },
  pressed: { opacity: 0.7 },
}));
