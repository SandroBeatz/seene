/**
 * The "Сегодня" tab (design "Таб · Сегодня", "Сегодня · первый день"): header,
 * day summary, first steps while setup is open, and the day's schedule. "Требуют
 * внимания" and "Пора позвать" join in Phase 5.
 */
import { useState } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { currencySymbol, formatAmount } from '@/shared/lib/formats';
import { isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import { ErrorState, ScreenScrollView, Skeleton, Text } from '@/shared/ui';
import { greetingPeriod } from '../model/first-steps';
import { useToday, type ScheduleVisit } from '../model/useToday';
import { DayScheduleCard } from './DayScheduleCard';
import { DaySummaryCard } from './DaySummaryCard';
import { FirstStepsCard } from './FirstStepsCard';
import { NoteBubble } from './NoteBubble';
import { TodayHeader } from './TodayHeader';

export function TodayScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const today = useToday();
  const [note, setNote] = useState<{ clientName: string; text: string } | null>(null);

  const top = { paddingTop: insets.top + theme.space[2.5] };

  if (today.isPending) {
    return (
      <ScreenScrollView
        contentContainerStyle={[styles.content, top]}
        contentInsetAdjustmentBehavior="never">
        <Skeleton height={44} width="60%" />
        <Skeleton height={70} radius={theme.radius.lg} />
        <Skeleton height={320} radius={theme.radius.lg} />
      </ScreenScrollView>
    );
  }

  if (today.error) {
    return (
      <View style={[styles.error, top]}>
        <ErrorState
          message={t(errorMessageKey(normalizeError(today.error)))}
          onRetry={() => void today.refetch()}
        />
      </View>
    );
  }

  const local = DateTime.fromMillis(today.now, { zone: today.zone }).setLocale(locale);
  // Hermes' Intl has no weekday names (luxon prints "null"), so they come from i18n.
  const weekday = local.weekday - 1;
  const dayMonth = local.toFormat('d MMMM');
  const shortDate = `${(t('weekdays.short', { returnObjects: true }) as string[])[weekday]}, ${dayMonth}`;
  const longDate = `${(t('weekdays.long', { returnObjects: true }) as string[])[weekday]}, ${dayMonth}`;
  const numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const money = { currency: today.currency, locale };
  const visitCount = today.summary.count;
  const firstName = today.profile?.first_name ?? '';

  const openVisit = (visit: ScheduleVisit) =>
    router.push({
      pathname: '/appointment/[appointmentId]',
      params: { appointmentId: visit.appointment.id },
    });

  const openNote = (visit: ScheduleVisit) =>
    setNote({
      clientName: visit.client
        ? [visit.client.first_name, visit.client.last_name].filter(Boolean).join(' ')
        : t('today.schedule.unknownClient'),
      text: visit.appointment.notes?.trim() ?? '',
    });

  return (
    <>
      <ScreenScrollView
        contentContainerStyle={[styles.content, top]}
        // No native header: the top safe area is padded by hand, identically on Android.
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl refreshing={today.isRefetching} onRefresh={() => void today.refetch()} />
        }>
        <TodayHeader
          firstName={firstName}
          lastName={today.profile?.last_name ?? ''}
          avatarUrl={today.profile?.avatar_url ?? null}
          greeting={greetingPeriod(local.hour)}
        />

        <View style={styles.title}>
          <Text variant="stat" accessibilityRole="header">
            {t('tabs.today')}
          </Text>
          <Text variant="footnote" color="secondary">
            {shortDate}
          </Text>
        </View>

        {visitCount > 0 ? (
          <DaySummaryCard
            summary={today.summary}
            formatNumber={(n) => numberFormat.format(n)}
            currency={currencySymbol(today.currency, locale)}
          />
        ) : null}

        {today.steps.complete ? null : <FirstStepsCard state={today.steps} />}

        <DayScheduleCard
          subtitle={
            visitCount > 0
              ? `${longDate} · ${visitCount} ${t(`today.visits_${pluralCategory(visitCount, locale)}`)}`
              : longDate
          }
          timeline={today.timeline}
          visitById={today.visitById}
          hours={today.hours}
          now={today.now}
          zone={today.zone}
          timeFormat={today.timeFormat}
          formatAmount={(n) => formatAmount(n, money)}
          onOpenVisit={openVisit}
          onOpenNote={openNote}
        />
      </ScreenScrollView>

      <NoteBubble note={note} onClose={() => setNote(null)} />
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingHorizontal: theme.space[5], gap: theme.space[5] },
  title: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: -theme.space[2],
  },
  error: { flex: 1, backgroundColor: theme.colors.bg.canvas },
}));
