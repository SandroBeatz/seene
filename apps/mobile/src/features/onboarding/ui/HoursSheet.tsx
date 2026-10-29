/**
 * Working-hours sheet (design: "Рабочие часы"), two modes:
 *  - "Одинаково": weekday chips, start/end, shared breaks;
 *  - "По дням": each day on/off with its own hours and break chips, plus
 *    "Скопировать понедельник на все будни".
 * Times come from the system time picker. Edits stay local until "Готово".
 */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import type { DaySchedule, TimeRange } from '@/entities/master';
import { isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import {
  Button,
  Chip,
  FormScreen,
  Icon,
  IconButton,
  SectionLabel,
  SegmentedControl,
  SheetHeader,
  Switch,
  Text,
  TimePicker,
} from '@/shared/ui';
import { useOnboardingDraft } from '../model/draft.store';
import {
  copyMondayToWeekdays,
  expandSame,
  hasInvalidRange,
  type HoursMode,
  nextBreak,
  sameSummary,
  type WorkingHours,
  workingDayCount,
} from '../model/hours';

type Edge = 'start' | 'end';
type Target =
  | { kind: 'same'; edge: Edge }
  | { kind: 'sameBreak'; index: number; edge: Edge }
  | { kind: 'day'; day: number; edge: Edge }
  | { kind: 'dayBreak'; day: number; index: number; edge: Edge };

const range = (b: TimeRange) => `${b.start}–${b.end}`;

export interface HoursSheetProps {
  onClose: () => void;
}

export function HoursSheet({ onClose }: HoursSheetProps) {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const saved = useOnboardingDraft((state) => state.hours);
  const setSettings = useOnboardingDraft((state) => state.setSettings);
  const [hours, setHours] = useState<WorkingHours>(saved);
  const [target, setTarget] = useState<Target | null>(null);
  const short = t('weekdays.short', { returnObjects: true }) as string[];
  const long = t('weekdays.long', { returnObjects: true }) as string[];

  const days = workingDayCount(hours);
  const doneLabel =
    days === 0
      ? t('onboarding.hoursSheet.pickDay')
      : hours.mode === 'same'
        ? t('onboarding.hoursSheet.doneSame', { summary: sameSummary(hours, short) })
        : t(`onboarding.hoursSheet.doneDays_${pluralCategory(days, locale)}`, { count: days });

  // --- edits -------------------------------------------------------------
  const setMode = (mode: HoursMode) =>
    setHours((h) => ({
      ...h,
      mode,
      perDay: mode === 'days' && !h.perDayEdited ? expandSame(h.same) : h.perDay,
    }));
  const patchSame = (patch: Partial<WorkingHours['same']>) =>
    setHours((h) => ({ ...h, same: { ...h.same, ...patch } }));
  const patchDay = (day: number, patch: Partial<DaySchedule>) =>
    setHours((h) => ({
      ...h,
      perDayEdited: true,
      perDay: h.perDay.map((d, i) => (i === day ? { ...d, ...patch } : d)),
    }));

  function valueOf(tg: Target): string {
    switch (tg.kind) {
      case 'same':
        return hours.same[tg.edge];
      case 'sameBreak':
        return hours.same.breaks[tg.index]![tg.edge];
      case 'day':
        return hours.perDay[tg.day]![tg.edge];
      case 'dayBreak':
        return hours.perDay[tg.day]!.breaks[tg.index]![tg.edge];
    }
  }

  function apply(tg: Target, time: string) {
    const setBreak = (list: TimeRange[], index: number) =>
      list.map((b, i) => (i === index ? { ...b, [tg.edge]: time } : b));
    switch (tg.kind) {
      case 'same':
        patchSame({ [tg.edge]: time });
        break;
      case 'sameBreak':
        patchSame({ breaks: setBreak(hours.same.breaks, tg.index) });
        break;
      case 'day':
        patchDay(tg.day, { [tg.edge]: time });
        break;
      case 'dayBreak':
        patchDay(tg.day, { breaks: setBreak(hours.perDay[tg.day]!.breaks, tg.index) });
        break;
    }
    // A day's break chip edits both ends: start, then straight on to the end.
    setTarget(tg.kind === 'dayBreak' && tg.edge === 'start' ? { ...tg, edge: 'end' } : null);
  }

  function pickerTitle(tg: Target): string {
    if (tg.kind === 'same') {
      return tg.edge === 'start' ? t('onboarding.hoursSheet.pickStart') : t('onboarding.hoursSheet.pickEnd');
    }
    if (tg.kind === 'day') {
      const key = tg.edge === 'start' ? 'pickDayStart' : 'pickDayEnd';
      return t(`onboarding.hoursSheet.${key}`, { day: long[tg.day] });
    }
    return tg.edge === 'start'
      ? t('onboarding.hoursSheet.pickBreakStart')
      : t('onboarding.hoursSheet.pickBreakEnd');
  }

  function done() {
    setSettings({ hours });
    onClose();
  }

  // --- view --------------------------------------------------------------
  return (
    <>
      <FormScreen
        edges={['bottom']}
        padded={false}
        contentContainerStyle={styles.body}
        header={
          <View>
            <SheetHeader
              title={t('onboarding.hoursSheet.title')}
              leadingLabel={t('common.close')}
              onLeadingPress={onClose}
            />
            <View style={styles.mode}>
              <SegmentedControl
                accessibilityLabel={t('onboarding.hoursSheet.modeA11y')}
                options={[
                  { value: 'same', label: t('onboarding.hoursSheet.same') },
                  { value: 'days', label: t('onboarding.hoursSheet.perDay') },
                ]}
                value={hours.mode}
                onChange={setMode}
              />
            </View>
          </View>
        }
        footerDivider
        footer={
          <Button label={doneLabel} disabled={days === 0 || hasInvalidRange(hours)} onPress={done} />
        }>
        {hours.mode === 'same' ? (
          <View style={styles.sameBody}>
            <View style={styles.section}>
              <SectionLabel label={t('onboarding.hoursSheet.days')} />
              <View style={styles.dayChips}>
                {short.map((label, i) => (
                  <View key={label} style={styles.dayChip}>
                    <Chip
                      label={label}
                      shape="field"
                      mutedWhenIdle
                      selected={hours.same.days[i]}
                      accessibilityLabel={long[i]}
                      onPress={() =>
                        patchSame({ days: hours.same.days.map((on, j) => (j === i ? !on : on)) })
                      }
                    />
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <SectionLabel label={t('onboarding.hoursSheet.time')} />
              <View style={styles.timeRow}>
                <TimeField
                  label={t('onboarding.hoursSheet.start')}
                  value={hours.same.start}
                  onPress={() => setTarget({ kind: 'same', edge: 'start' })}
                />
                <TimeField
                  label={t('onboarding.hoursSheet.end')}
                  value={hours.same.end}
                  onPress={() => setTarget({ kind: 'same', edge: 'end' })}
                />
              </View>
            </View>

            <View style={styles.section}>
              <SectionLabel label={t('onboarding.hoursSheet.breaks')} />
              {hours.same.breaks.map((b, index) => (
                <View key={index} style={styles.breakRow}>
                  <Icon name="coffee" size="sm" color="content.secondary" />
                  <Pressable onPress={() => setTarget({ kind: 'sameBreak', index, edge: 'start' })} hitSlop={8}>
                    <Text variant="calloutStrong" tabularNums>
                      {b.start}
                    </Text>
                  </Pressable>
                  <Text variant="callout" color="tertiary">
                    –
                  </Text>
                  <Pressable onPress={() => setTarget({ kind: 'sameBreak', index, edge: 'end' })} hitSlop={8}>
                    <Text variant="calloutStrong" tabularNums>
                      {b.end}
                    </Text>
                  </Pressable>
                  <View style={styles.flex} />
                  <IconButton
                    icon="close"
                    iconSize={14}
                    accessibilityLabel={t('onboarding.hoursSheet.removeBreak', { range: range(b) })}
                    onPress={() => patchSame({ breaks: hours.same.breaks.filter((_, i) => i !== index) })}
                  />
                </View>
              ))}
              <Pressable
                accessibilityRole="button"
                onPress={() => patchSame({ breaks: [...hours.same.breaks, nextBreak(hours.same.breaks)] })}
                style={({ pressed }) => [styles.addBreak, pressed && styles.pressed]}>
                <Icon name="add" size="sm" weight="bold" />
                <Text variant="bodyStrong">{t('onboarding.hoursSheet.addBreak')}</Text>
              </Pressable>
              <Text variant="caption" color="secondary">
                {t('onboarding.hoursSheet.breaksHint')}
              </Text>
            </View>
          </View>
        ) : (
          <View>
            {hours.perDay.map((day, i) => (
              <View key={long[i]} style={styles.dayRow}>
                <View style={styles.dayHead}>
                  <Text
                    variant="bodyStrong"
                    color={day.enabled ? 'primary' : 'tertiary'}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    style={styles.dayName}>
                    {long[i]}
                  </Text>
                  {day.enabled ? (
                    <View style={styles.dayTimes}>
                      <TimePill value={day.start} onPress={() => setTarget({ kind: 'day', day: i, edge: 'start' })} />
                      <Text variant="body" color="tertiary">
                        –
                      </Text>
                      <TimePill value={day.end} onPress={() => setTarget({ kind: 'day', day: i, edge: 'end' })} />
                    </View>
                  ) : (
                    <Text variant="body" color="tertiary" style={styles.flex}>
                      {t('onboarding.hoursSheet.dayOff')}
                    </Text>
                  )}
                  <Switch
                    size="sm"
                    value={day.enabled}
                    onValueChange={(enabled) => patchDay(i, { enabled })}
                    accessibilityLabel={t('onboarding.hoursSheet.workDayA11y', { day: long[i] })}
                  />
                </View>
                {day.enabled ? (
                  <View style={styles.dayBreaks}>
                    {day.breaks.map((b, index) => (
                      <View key={index} style={styles.breakChip}>
                        <Pressable
                          onPress={() => setTarget({ kind: 'dayBreak', day: i, index, edge: 'start' })}
                          hitSlop={6}>
                          <Text variant="footnote" tabularNums>
                            {t('onboarding.hoursSheet.breakChip', { range: range(b) })}
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t('onboarding.hoursSheet.removeBreak', { range: range(b) })}
                          onPress={() => patchDay(i, { breaks: day.breaks.filter((_, j) => j !== index) })}
                          style={styles.breakChipRemove}>
                          <Icon name="close" size={11} weight="heavy" color="content.tertiary" />
                        </Pressable>
                      </View>
                    ))}
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => patchDay(i, { breaks: [...day.breaks, nextBreak(day.breaks)] })}
                      style={({ pressed }) => [styles.addBreakChip, pressed && styles.pressed]}>
                      <Text variant="footnoteStrong">{t('onboarding.hoursSheet.addBreakChip')}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                setHours((h) => ({ ...h, perDayEdited: true, perDay: copyMondayToWeekdays(h.perDay) }))
              }
              style={({ pressed }) => [styles.copy, pressed && styles.pressed]}>
              <Text variant="subheadStrong" color="brand">
                {t('onboarding.hoursSheet.copyMonday')}
              </Text>
            </Pressable>
          </View>
        )}
      </FormScreen>

      <TimePicker
        visible={target !== null}
        value={target ? valueOf(target) : '00:00'}
        title={target ? pickerTitle(target) : ''}
        cancelLabel={t('onboarding.serviceSheet.pickerCancel')}
        doneLabel={t('onboarding.serviceSheet.pickerDone')}
        onCancel={() => setTarget(null)}
        onConfirm={(time) => target && apply(target, time)}
      />
    </>
  );
}

function TimeField({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      onPress={onPress}
      style={({ pressed }) => [styles.timeField, pressed && styles.pressed]}>
      <Text variant="caption" color="secondary">
        {label}
      </Text>
      <Text variant="figure" tabularNums>
        {value}
      </Text>
    </Pressable>
  );
}

function TimePill({ value, onPress }: { value: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.timePill, pressed && styles.pressed]}>
      <Text variant="bodyStrong" tabularNums>
        {value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  mode: { paddingTop: theme.space[3.5], paddingHorizontal: theme.layout.gutter },
  body: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.space[4.5],
    paddingBottom: theme.space[4],
  },
  sameBody: { gap: theme.space[5.5] },
  section: { gap: theme.space[2.5] },
  dayChips: { flexDirection: 'row', gap: theme.space[1.5] },
  dayChip: { flex: 1 },
  timeRow: { flexDirection: 'row', gap: theme.space[2] },
  timeField: {
    flex: 1,
    height: theme.sizing.timeField,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.bg.canvas,
    paddingHorizontal: theme.space[4],
    justifyContent: 'center',
    gap: theme.space[0.5],
  },
  breakRow: {
    height: theme.sizing.row.sm,
    borderRadius: theme.radius.field,
    backgroundColor: theme.colors.bg.surface,
    paddingLeft: theme.space[4],
    paddingRight: theme.space[1.5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2.5],
  },
  addBreak: {
    height: theme.sizing.control.lg,
    borderRadius: theme.radius.field,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.strong,
    backgroundColor: theme.colors.bg.canvas,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
  },
  dayRow: {
    gap: theme.space[2],
    paddingVertical: theme.space[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  dayHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    minHeight: theme.sizing.control.sm,
  },
  dayName: { width: theme.sizing.dayLabel },
  dayTimes: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.space[1] },
  timePill: {
    height: theme.sizing.control.sm,
    paddingHorizontal: theme.space[2.5],
    borderRadius: theme.radius.segment,
    backgroundColor: theme.colors.bg.surface,
    justifyContent: 'center',
  },
  dayBreaks: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[1.5], paddingLeft: theme.sizing.dayLabel + theme.space[3] },
  breakChip: {
    height: theme.sizing.control.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg.surface,
    paddingLeft: theme.space[2.5],
    paddingRight: theme.space[0.5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[0.5],
  },
  breakChipRemove: {
    width: theme.sizing.chipAction,
    height: theme.sizing.chipAction,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBreakChip: {
    height: theme.sizing.control.xs,
    paddingHorizontal: theme.space[2.5],
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.strong,
    backgroundColor: theme.colors.bg.canvas,
    justifyContent: 'center',
  },
  copy: { marginTop: theme.space[3.5], height: theme.sizing.iconButton, justifyContent: 'center', alignSelf: 'flex-start' },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
}));
