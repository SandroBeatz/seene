/**
 * "Личное время · 1 из 2: когда" (design "AppNewBreak"): the days, "Весь день" — a day
 * off, a holiday, sick leave — and otherwise how long and from what time, on the same
 * grid as a visit (taken time struck through) or "Указать своё время". The bar says
 * what gets closed for online booking.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { DayTimePicker } from '@/features/pick-time';
import { formatDurationLabel } from '@/shared/lib/i18n';
import { Chip, FlowStepFooter, Switch, Text } from '@/shared/ui';
import { PERSONAL_LENGTHS } from '../model/draft.store';
import { usePersonalTime } from '../model/usePersonalTime';
import { PersonalTimeChrome } from './PersonalTimeChrome';

export function WhenStep() {
  const { t } = useTranslation();
  const { draft, dayKey, dayLabel, span, ready } = usePersonalTime();

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
    <View style={styles.root} collapsable={false}>
      <PersonalTimeChrome step={1} subtitle={t('personalTime.when.subtitle')} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <DayTimePicker
          purpose="personal"
          duration={draft.length}
          dayKey={dayKey}
          start={draft.start}
          ownTime={draft.ownTime}
          between={between}
          dayOnly={draft.allDay}
          onDay={draft.setDay}
          onStart={draft.setStart}
          onOpenMonth={() => router.push('/personal-time/month')}
          onOpenOwnTime={() => router.push('/personal-time/custom-time')}
        />
      </ScrollView>

      <FlowStepFooter
        title={
          draft.allDay
            ? `${dayLabel} · ${t('personalTime.when.allDayShort')}`
            : span
              ? `${dayLabel} · ${span}`
              : t('quickCreate.time.pick')
        }
        subtitle={t(draft.allDay ? 'personalTime.when.closedDay' : 'personalTime.when.closedSpan')}
        actionLabel={t('quickCreate.next')}
        disabled={!ready}
        onAction={() => router.push('/personal-time/what')}
      />
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
  },
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
  lengths: { gap: theme.space[1.5] },
  chipsScroll: { marginHorizontal: -theme.space[4], flexGrow: 0 },
  chips: { gap: theme.space[1.5], paddingHorizontal: theme.space[4] },
}));
