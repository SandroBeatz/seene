/**
 * The client profile (design "Клиент", "Клиент · меню ⋯"): who they are, their
 * numbers, "Записать" with WhatsApp and call, money, the note, when to invite them
 * again, and every visit by day. "⋯" edits, shares or deletes the client.
 */
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, RefreshControl, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { getAppointmentPhase } from '@/entities/appointment';
import { clientName } from '@/entities/client';
import { useDeleteClient } from '@/features/client-form';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { formatAmount, formatTime } from '@/shared/lib/formats';
import { isSupportedLocale, pluralCategory, type AppLocale } from '@/shared/lib/i18n';
import { formatPhone, phoneCallUrl, whatsappUrl } from '@/shared/lib/phone';
import {
  Avatar,
  ContextMenu,
  ErrorState,
  Icon,
  IconButton,
  ScreenScrollView,
  Skeleton,
  Text,
  VipBadge,
  type ContextMenuAnchor,
  type ContextMenuItem,
} from '@/shared/ui';
import { clientSince } from '../model/profile';
import { useClientProfile, type ProfileVisit } from '../model/useClientProfile';

const MENU_WIDTH = 264;

export function ClientProfile({ clientId }: { clientId: string }) {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const profile = useClientProfile(clientId);
  const deleteClient = useDeleteClient();
  const moreRef = useRef<View>(null);
  const [menu, setMenu] = useState<ContextMenuAnchor | null>(null);

  const top = { paddingTop: insets.top + theme.space[1.5] };
  const monthNames = t('monthsGenitive', { returnObjects: true }) as string[];
  const weekdays = t('weekdays.short', { returnObjects: true }) as string[];
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const money = (amount: number) => formatAmount(amount, { currency: profile.currency, locale });

  const bar = (
    <View style={[styles.bar, top]}>
      <IconButton
        icon="chevronLeft"
        variant="neutral"
        accessibilityLabel={t('clients.profile.back')}
        onPress={() => router.back()}
      />
      <View style={styles.grow} />
      {profile.client ? (
        <View ref={moreRef} collapsable={false}>
          <IconButton
            icon="more"
            variant="neutral"
            accessibilityLabel={t('clients.profile.more')}
            onPress={() =>
              moreRef.current?.measureInWindow((x, y, width, height) =>
                setMenu({ x: x + width - MENU_WIDTH, y: y + height + theme.space[2], width: MENU_WIDTH }),
              )
            }
          />
        </View>
      ) : null}
    </View>
  );

  if (profile.isPending) {
    return (
      <View style={styles.root}>
        {bar}
        <View style={styles.skeleton}>
          <Skeleton height={68} width="70%" />
          <Skeleton height={64} radius={theme.radius.block} />
          <Skeleton height={52} radius={theme.radius.full} />
          <Skeleton height={200} radius={theme.radius.block} />
        </View>
      </View>
    );
  }

  const client = profile.client;
  if (!client) {
    return (
      <View style={styles.root}>
        {bar}
        <ErrorState
          message={
            profile.error
              ? t(errorMessageKey(normalizeError(profile.error)))
              : t('clients.profile.notFound')
          }
          onRetry={() => void profile.refetch()}
        />
      </View>
    );
  }

  const name = clientName(client);
  const { stats } = profile;
  const messagePhone = client.whatsapp ?? client.phone;
  const sinceIso = clientSince(client.created_at, stats.firstVisit);
  const since = DateTime.fromISO(sinceIso, { zone: 'utc' }).setZone(profile.zone);

  const dayMonth = (iso: string) => {
    const local = DateTime.fromISO(iso, { zone: 'utc' }).setZone(profile.zone);
    const thisYear = local.year === DateTime.fromMillis(profile.now, { zone: profile.zone }).year;
    return `${local.day} ${monthNames[local.month - 1]}${thisYear ? '' : ` ${local.year}`}`;
  };

  const openWhatsApp = (text?: string) => {
    if (!messagePhone) return Alert.alert(t('actions.noPhone'));
    void Linking.openURL(whatsappUrl(messagePhone, text));
  };
  const call = () => {
    if (!client.phone) return Alert.alert(t('actions.noPhone'));
    void Linking.openURL(phoneCallUrl(client.phone));
  };
  const edit = () =>
    router.push({ pathname: '/client/[clientId]/edit', params: { clientId: client.id } });
  const share = () =>
    void Share.share({
      message: [name, client.phone ? formatPhone(client.phone) : null].filter(Boolean).join('\n'),
    });

  const cadence =
    stats.cadenceDays === null
      ? '—'
      : stats.cadenceDays >= 14
        ? t('clients.profile.cadenceWeeks', { count: Math.round(stats.cadenceDays / 7) })
        : t('clients.profile.cadenceDays', { count: stats.cadenceDays });

  const menuItems: ContextMenuItem[] = [
    { key: 'edit', label: t('clients.profile.menu.edit'), icon: 'pencil' },
    { key: 'share', label: t('clients.profile.menu.share'), icon: 'send' },
    { key: 'merge', label: t('clients.merge.menu'), icon: 'clients' },
    { key: 'delete', label: t('clients.profile.menu.delete'), icon: 'trash', danger: true },
  ];

  return (
    <View style={styles.root}>
      {bar}
      <ScreenScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 130 }]}
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl refreshing={profile.isRefetching} onRefresh={() => void profile.refetch()} />
        }>
        <View style={styles.identity}>
          <Avatar name={name} color={client.avatar_color} size="xxl" />
          <View style={styles.grow}>
            <View style={styles.nameLine}>
              <Text variant="stat" numberOfLines={1} style={styles.shrink} accessibilityRole="header">
                {name}
              </Text>
              {client.is_favorite ? <VipBadge accessibilityLabel={t('clients.list.vipA11y')} /> : null}
            </View>
            {client.phone ? (
              <Text variant="subhead" color="secondary" tabularNums>
                {formatPhone(client.phone)}
              </Text>
            ) : null}
            <Text variant="caption" color="tertiary">
              {t('clients.profile.since', {
                date: `${monthNames[since.month - 1]} ${since.year}`,
              })}
            </Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat
            value={number.format(stats.visits)}
            label={t(`clients.profile.visitsWord_${pluralCategory(stats.visits, locale)}`)}
          />
          <View style={styles.statDivider} />
          <Stat value={cadence} label={t('clients.profile.cadence')} />
          <View style={styles.statDivider} />
          <Stat
            value={number.format(stats.noShows)}
            label={t(`clients.profile.noShowsWord_${pluralCategory(stats.noShows, locale)}`)}
          />
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/quick-create', params: { clientId: client.id } })
            }
            style={({ pressed }) => [styles.book, pressed && styles.pressed]}>
            <Icon name="add" size="md" color="accent.onAccent" />
            <Text variant="bodyStrong" color="onAccent">
              {t('clients.profile.book')}
            </Text>
          </Pressable>
          <RoundAction
            icon="whatsapp"
            label={t('clients.profile.whatsappA11y')}
            onPress={() => openWhatsApp()}
          />
          <RoundAction icon="phone" label={t('clients.profile.callA11y')} onPress={call} />
        </View>

        <View style={styles.money}>
          <View style={styles.moneyCell}>
            <Text variant="caption" color="tertiary">
              {t('clients.profile.averageCheck')}
            </Text>
            <Text variant="calloutStrong" tabularNums>
              {money(stats.averageCheck)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.moneyCell}>
            <Text variant="caption" color="tertiary">
              {t('clients.profile.total')}
            </Text>
            <Text variant="calloutStrong" tabularNums>
              {money(stats.total)}
            </Text>
          </View>
        </View>

        {client.notes?.trim() ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('clients.profile.noteA11y')}
            onPress={edit}
            style={({ pressed }) => [styles.note, pressed && styles.pressed]}>
            <Icon name="note" size="md" color="content.tertiary" />
            <View style={styles.grow}>
              <Text variant="caption" color="tertiary">
                {t('clients.profile.note')}
              </Text>
              <Text variant="subhead" color="secondary">
                {client.notes.trim()}
              </Text>
            </View>
            <Icon name="chevronRight" size="sm" color="content.disabled" />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={edit}
            style={({ pressed }) => [styles.addNote, pressed && styles.pressed]}>
            <Icon name="note" size="md" color="content.secondary" />
            <Text variant="subhead" color="secondary">
              {t('clients.form.addNote')}
            </Text>
          </Pressable>
        )}

        {stats.recallAt ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('clients.profile.recallA11y', { date: dayMonth(stats.recallAt) })}
            onPress={() =>
              openWhatsApp(t('clients.list.recallMessage', { name: client.first_name }))
            }
            style={({ pressed }) => [styles.recall, pressed && styles.pressed]}>
            <View style={styles.recallIcon}>
              <Icon name="repeat" size="md" color="brand.default" />
            </View>
            <View style={styles.grow}>
              <Text variant="bodyStrong">
                {`${t('clients.profile.recallTitle')} · `}
                <Text variant="bodyStrong" style={styles.recallDate}>
                  {dayMonth(stats.recallAt)}
                </Text>
              </Text>
              <Text variant="footnote" style={styles.recallText}>
                {t('clients.profile.recallText')}
              </Text>
            </View>
            <Icon name="chevronRight" size="sm" color="brand.text" />
          </Pressable>
        ) : null}

        <View style={styles.visitsHead}>
          <Text variant="bodyStrong">{t('clients.profile.visits')}</Text>
          <Text variant="footnote" color="tertiary" tabularNums>
            {profile.count}
          </Text>
        </View>
        {profile.days.length === 0 ? (
          <Text variant="subhead" color="secondary" style={styles.noVisits}>
            {t('clients.profile.noVisits')}
          </Text>
        ) : null}
        {profile.days.map((day) => {
          const local = DateTime.fromISO(day.dayKey, { zone: profile.zone });
          const weekday = weekdays[local.weekday - 1] ?? '';
          const date = `${weekday} ${dayMonth(day.visits[0].start_at)}`;
          return (
            <View key={day.dayKey}>
              <Text variant="caption" color="tertiary" style={styles.dayLabel}>
                {day.isToday
                  ? t('clients.profile.todayDay', { date: date.toLocaleLowerCase(locale) })
                  : date}
              </Text>
              {day.items.map((visit) => (
                <VisitCard
                  key={visit.appointment.id}
                  visit={visit}
                  zone={profile.zone}
                  timeFormat={profile.timeFormat}
                  now={profile.now}
                  locale={locale}
                />
              ))}
            </View>
          );
        })}
      </ScreenScrollView>

      <ContextMenu
        anchor={menu}
        items={menuItems}
        closeLabel={t('common.close')}
        onClose={() => setMenu(null)}
        onSelect={(key) => {
          if (key === 'edit') edit();
          else if (key === 'share') share();
          else if (key === 'merge')
            router.push({ pathname: '/client/[clientId]/merge', params: { clientId: client.id } });
          else if (key === 'delete') deleteClient(client);
        }}
      />
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="headline" tabularNums>
        {value}
      </Text>
      <Text variant="caption" color="tertiary">
        {label}
      </Text>
    </View>
  );
}

function RoundAction({
  icon,
  label,
  onPress,
}: {
  icon: 'whatsapp' | 'phone';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.round, pressed && styles.pressed]}>
      <Icon name={icon} size="md" color="content.primary" />
    </Pressable>
  );
}

function VisitCard({
  visit,
  zone,
  timeFormat,
  now,
  locale,
}: {
  visit: ProfileVisit;
  zone: string;
  timeFormat: 12 | 24;
  now: number;
  locale: AppLocale;
}) {
  const { t } = useTranslation();
  const { appointment } = visit;
  const phase = getAppointmentPhase(appointment, now);
  const ahead = phase === 'upcoming' || phase === 'unconfirmed' || phase === 'request';
  const end = new Date(Date.parse(appointment.start_at) + appointment.duration * 60_000).toISOString();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/appointment/[appointmentId]',
          params: { appointmentId: appointment.id },
        })
      }
      style={({ pressed }) => [styles.visit, pressed && styles.pressed]}>
      <View style={styles.visitTime}>
        <Text variant="bodyStrong" tabularNums>
          {formatTime(appointment.start_at, { zone, timeFormat })}
        </Text>
        <Text variant="caption" color="tertiary" tabularNums>
          {formatTime(end, { zone, timeFormat })}
        </Text>
      </View>
      <View style={[styles.visitBar, { backgroundColor: visit.color }]} />
      <View style={styles.grow}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {visit.serviceNames.join(', ') || '—'}
        </Text>
        <Text
          variant={ahead ? 'captionMedium' : 'caption'}
          color={ahead ? 'primary' : 'tertiary'}
          numberOfLines={1}>
          {t(`clients.profile.status.${phase}`)}
        </Text>
      </View>
      <Text variant="subheadStrong" tabularNums>
        {new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(visit.amount)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.space[4] },
  grow: { flex: 1, minWidth: 0, gap: 2 },
  shrink: { flexShrink: 1 },
  pressed: { opacity: 0.7 },
  skeleton: { padding: theme.space[4], gap: theme.space[3] },
  content: { paddingHorizontal: theme.space[4], paddingTop: theme.space[4] },
  identity: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3.5] },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1.5] },
  stats: {
    marginTop: theme.space[4],
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.block,
    backgroundColor: theme.colors.bg.surface,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: theme.space[1],
    backgroundColor: theme.colors.border.default,
  },
  actions: { marginTop: theme.space[3], flexDirection: 'row', gap: theme.space[2] },
  book: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent.default,
  },
  round: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.surface,
  },
  money: {
    marginTop: theme.space[3],
    flexDirection: 'row',
    paddingVertical: theme.space[3],
    borderRadius: theme.radius.block,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  moneyCell: { flex: 1, gap: 2, paddingHorizontal: theme.space[3.5] },
  note: {
    marginTop: theme.space[2.5],
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space[3],
    padding: theme.space[3.5],
    borderRadius: theme.radius.block,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  addNote: {
    marginTop: theme.space[2.5],
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.block,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.strong,
  },
  recall: {
    marginTop: theme.space[2.5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.block,
    backgroundColor: theme.colors.brand.subtle,
  },
  recallIcon: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.elevated,
  },
  recallDate: { color: theme.colors.brand.text },
  recallText: { color: theme.colors.brand.strong, opacity: 0.8 },
  visitsHead: {
    marginTop: theme.space[5.5],
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.space[1.5],
  },
  noVisits: { marginTop: theme.space[3] },
  dayLabel: { marginTop: theme.space[3], fontFamily: theme.typography.captionMedium.fontFamily },
  visit: {
    marginTop: theme.space[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.block,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  visitTime: { minWidth: 46, gap: 1 },
  visitBar: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
}));
