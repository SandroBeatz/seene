/**
 * The "Сегодня" tab (design "Таб · Сегодня", "Сегодня · первый день"): header,
 * day summary, "Требуют внимания", first steps while setup is open, and the day's
 * schedule. Attention cards and schedule visits open a menu on long press.
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
import {
  ContextMenu,
  ErrorState,
  ScreenScrollView,
  Skeleton,
  Text,
  type ContextMenuAnchor,
  type IconName,
} from '@/shared/ui';
import { getAppointmentPhase } from '@/entities/appointment';
import { ATTENTION_MENU } from '../model/attention';
import { greetingPeriod } from '../model/first-steps';
import { SCHEDULE_MENU } from '../model/schedule-menu';
import { useAttention, type AttentionCard } from '../model/useAttention';
import { useToday, type ScheduleVisit } from '../model/useToday';
import { useTodayActions } from '../model/useTodayActions';
import { AttentionCardView, AttentionSection, type AttentionFormat } from './AttentionSection';
import { DayScheduleCard, VisitEventPreview } from './DayScheduleCard';
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
  const attention = useAttention({
    zone: today.zone,
    dayKey: today.dayKey,
    now: today.now,
    clientById: today.clientById,
    serviceById: today.serviceById,
  });
  const act = useTodayActions({
    zone: today.zone,
    todayKey: today.dayKey,
    timeFormat: today.timeFormat,
    currency: today.currency,
    locale,
    now: today.now,
    tomorrowEnd: attention.tomorrowEnd,
  });
  const [note, setNote] = useState<{ clientName: string; text: string } | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);

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

  const openNote = (visit: Pick<ScheduleVisit, 'client' | 'appointment'>) =>
    setNote({
      clientName: visit.client
        ? [visit.client.first_name, visit.client.last_name].filter(Boolean).join(' ')
        : t('today.schedule.unknownClient'),
      text: visit.appointment.notes?.trim() ?? '',
    });

  const attentionFormat: AttentionFormat = {
    zone: today.zone,
    todayKey: today.dayKey,
    timeFormat: today.timeFormat,
    locale,
    formatNumber: (n) => numberFormat.format(n),
  };
  const refetchAll = () => Promise.all([today.refetch(), attention.refetch()]);

  return (
    <>
      <ScreenScrollView
        contentContainerStyle={[styles.content, top]}
        // No native header: the top safe area is padded by hand, identically on Android.
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl refreshing={today.isRefetching} onRefresh={() => void refetchAll()} />
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

        {attention.cards?.length ? (
          <AttentionSection
            cards={attention.cards}
            format={attentionFormat}
            onAction={act.cardAction}
            onOpen={act.openCard}
            onNote={(card) => card.visit && openNote(card.visit)}
            onMenu={(card, anchor) => setMenu({ kind: 'attention', card, anchor })}
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
          onMenu={(visit, anchor, range) => setMenu({ kind: 'schedule', visit, anchor, range })}
        />
      </ScreenScrollView>

      <NoteBubble note={note} onClose={() => setNote(null)} />
      <ContextMenu
        anchor={menu?.anchor ?? null}
        preview={
          menu?.kind === 'attention' ? (
            <AttentionCardView card={menu.card} width={menu.anchor.width} format={attentionFormat} />
          ) : menu ? (
            <VisitEventPreview
              visit={menu.visit}
              range={menu.range}
              now={today.now}
              formatAmount={(n) => formatAmount(n, money)}
            />
          ) : null
        }
        note={menuNote(menu, t('today.attention.noteLabel'))}
        items={menuItems(menu, today.now, t)}
        closeLabel={t('common.close')}
        onClose={() => setMenu(null)}
        onSelect={(key) => {
          if (menu?.kind === 'attention') {
            act.cardMenu(menu.card, key as (typeof ATTENTION_MENU)['recall']['regular'][number]);
          } else if (menu) {
            act.scheduleMenu(menu.visit, key as (typeof SCHEDULE_MENU)['upcoming']['regular'][number]);
          }
        }}
      />
    </>
  );
}

type Menu =
  | { kind: 'attention'; card: AttentionCard; anchor: ContextMenuAnchor }
  | { kind: 'schedule'; visit: ScheduleVisit; anchor: ContextMenuAnchor; range: string };

const MENU_ICON: Record<string, IconName> = {
  confirm: 'check',
  complete: 'completeVisit',
  edit: 'pencil',
  reschedule: 'reschedule',
  propose_time: 'send',
  book_again: 'repeat',
  whatsapp: 'whatsapp',
  call: 'call',
  open_client: 'userCircle',
  invite: 'whatsapp',
  dismiss: 'check',
  snooze: 'clock',
  decline: 'close',
  cancel: 'cancelCircle',
  no_show: 'noShow',
};

function menuItems(
  menu: Menu | null,
  now: number,
  t: ReturnType<typeof useTranslation>['t'],
) {
  if (!menu) return [];
  const groups =
    menu.kind === 'schedule'
      ? SCHEDULE_MENU[getAppointmentPhase(menu.visit.appointment, now)]
      : menu.card.kind === 'tomorrow_reminders'
        ? { regular: [], danger: [] }
        : ATTENTION_MENU[menu.card.kind];
  const item = (danger: boolean) => (key: string) => ({
    key,
    label: t(`today.attention.menu.${key}`),
    icon: MENU_ICON[key],
    danger,
  });
  return [...groups.regular.map(item(false)), ...groups.danger.map(item(true))];
}

function menuNote(menu: Menu | null, label: string) {
  const text =
    menu?.kind === 'schedule'
      ? menu.visit.appointment.notes?.trim()
      : menu?.card.kind === 'tomorrow_reminders'
        ? null
        : menu?.card.visit?.appointment.notes?.trim();
  return text ? { label, text } : null;
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
