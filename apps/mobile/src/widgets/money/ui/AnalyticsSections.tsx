/**
 * The blocks under the tiles: income and expenses, expenses by category, payment
 * methods, top services, clients, busy days, no-shows. A block with nothing to show
 * is left out, except expenses: its button is how the first one gets added.
 */
import { useMemo } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useMoneyContext } from '@/entities/master';
import { useVisitHistoryQuery } from '@/entities/appointment';
import { useDismissedAttentionQuery } from '@/entities/attention';
import { recallCandidates } from '@/entities/client';
import { expenseCategoryLabel } from '@/entities/expense';
import { useUserId } from '@/entities/session';
import type { MoneyOverview } from '@/entities/analytics';
import { pluralCategory } from '@/shared/lib/i18n';
import { Avatar, Icon, SectionLabel, Text, useNow } from '@/shared/ui';
import { shareOf } from '../model/overview';
import { BusyBars, ClientRing, ShareBar, useRankColors } from './charts';

const HISTORY_DAYS = 730;

function Heading({
  title,
  subtitle,
  link,
  onLink,
}: {
  title: string;
  subtitle?: string;
  link?: string;
  onLink?: () => void;
}) {
  return (
    <View style={styles.heading}>
      <View style={styles.grow}>
        <SectionLabel label={title} />
        {subtitle ? (
          <Text variant="caption" color="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {link ? (
        <Pressable accessibilityRole="link" hitSlop={8} onPress={onLink}>
          <Text variant="footnoteStrong" color="brand">
            {link}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SummaryRow({
  label,
  value,
  strong,
  valueColor,
}: {
  label: string;
  value: string;
  strong?: boolean;
  valueColor?: 'success' | 'danger';
}) {
  return (
    <View style={styles.summaryRow}>
      <Text variant={strong ? 'bodyStrong' : 'body'}>{label}</Text>
      <Text
        variant={strong ? 'calloutStrong' : 'bodyStrong'}
        color={valueColor ?? 'primary'}
        tabularNums>
        {value}
      </Text>
    </View>
  );
}

export function AnalyticsSections({ overview }: { overview: MoneyOverview }) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const userId = useUserId() ?? '';
  const ctx = useMoneyContext(userId);
  const rank = useRankColors();
  const now = useNow();

  const historyFrom = DateTime.fromMillis(now, { zone: ctx.zone })
    .startOf('day')
    .minus({ days: HISTORY_DAYS })
    .toUTC()
    .toISO()!;
  const history = useVisitHistoryQuery(userId, historyFrom);
  const dismissed = useDismissedAttentionQuery(userId);
  const recallCount = useMemo(
    () =>
      recallCandidates(history.data ?? [], now).filter(
        (c) => !dismissed.data?.has(`recall:${c.clientId}`),
      ).length,
    [history.data, dismissed.data, now],
  );

  const {
    current,
    expenses,
    payments,
    top_services: services,
    services_total: servicesTotal,
    clients,
    top_clients: topClients,
    busy_days: busyDays,
    peak_hour: peakHour,
    losses,
  } = overview;

  const net = current.earned - current.spent;
  const spentTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const topRevenue = services[0]?.revenue ?? 0;
  const weekdays = t('weekdays.short', { returnObjects: true }) as string[];
  const hour = (h: number) =>
    DateTime.fromObject({ hour: h }).toFormat(ctx.timeFormat === 24 ? 'HH:mm' : 'h a');
  const plural = (key: string, count: number) =>
    t(`${key}_${pluralCategory(count, ctx.locale)}`, { count });

  const methodLabel = (kind: string | null, name: string | null) =>
    kind === 'custom' && name
      ? name
      : kind
        ? t(`checkout.methods.${kind}`, { defaultValue: name ?? '' })
        : t('money.methodNone');

  return (
    <>
      <Heading
        title={t('money.incomeExpenses')}
        link={t('money.allOperations')}
        onLink={() => router.push('/analytics/operations')}
      />
      <View style={styles.summary}>
        <SummaryRow
          label={t('money.income')}
          value={`${current.earned > 0 ? '+' : ''}${ctx.money(current.earned)}`}
          valueColor={current.earned > 0 ? 'success' : undefined}
        />
        <View style={styles.divider} />
        <SummaryRow label={t('money.expenses')} value={`${current.spent > 0 ? '−' : ''}${ctx.money(current.spent)}`} />
        <View style={styles.divider} />
        <SummaryRow
          label={t('money.net')}
          value={`${net < 0 ? '−' : ''}${ctx.money(Math.abs(net))}`}
          strong
        />
      </View>

      <Heading title={t('money.byCategory')} subtitle={t('money.byCategoryHint')} />
      {expenses.length > 0 ? (
        <>
          <ShareBar
            parts={expenses.map((e, i) => ({
              key: e.category,
              value: e.amount,
              color: rank[i % rank.length]!,
            }))}
          />
          <View style={styles.legendList}>
            {expenses.map((e, i) => (
              <View key={e.category} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: rank[i % rank.length] }]} />
                <Text variant="subhead" numberOfLines={1} style={styles.grow}>
                  {expenseCategoryLabel(e.category, t)}
                </Text>
                <Text variant="caption" color="tertiary" tabularNums>
                  {`${shareOf(e.amount, spentTotal)}%`}
                </Text>
                <Text variant="subheadStrong" tabularNums style={styles.legendValue}>
                  {ctx.money(e.amount)}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/expense/new')}
        style={({ pressed }) => [styles.addExpense, pressed && styles.pressed]}>
        <Icon name="add" size="sm" color="content.primary" />
        <Text variant="subheadStrong">{t('expenses.add')}</Text>
      </Pressable>

      {payments.length > 0 ? (
        <>
          <Heading title={t('money.payments')} subtitle={t('money.paymentsHint')} />
          <ShareBar
            parts={payments.map((p, i) => ({
              key: `${p.kind}-${p.name}`,
              value: p.amount,
              color: rank[i === 0 ? 0 : i + 1] ?? theme.colors.border.dashed,
            }))}
          />
          <View style={styles.paymentLegend}>
            {payments.map((p, i) => (
              <View key={`${p.kind}-${p.name}`} style={styles.paymentItem}>
                <View
                  style={[
                    styles.smallDot,
                    { backgroundColor: rank[i === 0 ? 0 : i + 1] ?? theme.colors.border.dashed },
                  ]}
                />
                <Text variant="footnote" color="secondary">
                  {methodLabel(p.kind, p.name)}
                </Text>
                <Text variant="footnoteStrong" tabularNums>
                  {`${shareOf(p.amount, paidTotal)}%`}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {services.length > 0 ? (
        <>
          <Heading title={t('money.topServices')} />
          <View style={styles.services}>
            {services.map((service, index) => (
              <View key={service.name} style={styles.service}>
                <Text variant="footnote" color="tertiary" tabularNums style={styles.serviceRank}>
                  {index + 1}
                </Text>
                <View style={styles.serviceBody}>
                  <View style={styles.serviceTop}>
                    <Text variant="subheadMedium" numberOfLines={1} style={styles.grow}>
                      {service.name}
                    </Text>
                    <Text variant="subheadStrong" tabularNums>
                      {ctx.money(service.revenue)}
                    </Text>
                  </View>
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.trackFill,
                        {
                          width: `${shareOf(service.revenue, topRevenue)}%`,
                          backgroundColor: service.color ?? theme.colors.brand.default,
                        },
                      ]}
                    />
                  </View>
                  <Text variant="caption" color="tertiary" tabularNums>
                    {`${shareOf(service.revenue, servicesTotal)}% · ${plural('money.bookings', service.count)}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {clients.total > 0 ? (
        <>
          <Heading
            title={t('money.clients')}
            subtitle={t('money.clientsHint', { clients: plural('money.clientsCount', clients.total) })}
            link={t('money.all')}
            onLink={() => router.push('/analytics/clients')}
          />
          <View style={styles.clientMix}>
            <ClientRing
              percent={shareOf(clients.returning, clients.total)}
              label={t('money.cameBackRing')}
            />
            <View style={styles.clientMixList}>
              <View style={styles.mixRow}>
                <View style={[styles.dot, { backgroundColor: theme.colors.content.primary }]} />
                <Text variant="subhead" style={styles.grow}>
                  {t('money.regulars')}
                </Text>
                <Text variant="subheadStrong" tabularNums>
                  {clients.returning}
                </Text>
              </View>
              <View style={styles.mixRow}>
                <View style={[styles.dot, { backgroundColor: theme.colors.brand.default }]} />
                <Text variant="subhead" style={styles.grow}>
                  {t('money.newOnes')}
                </Text>
                <Text variant="subheadStrong" tabularNums>
                  {clients.new}
                </Text>
              </View>
              {recallCount > 0 ? (
                <Pressable
                  accessibilityRole="link"
                  hitSlop={6}
                  onPress={() => router.navigate('/clients')}>
                  <Text variant="footnoteStrong" color="brand">
                    {t('money.recall', { count: recallCount })}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.topHeading}>
            <Text variant="subheadStrong">{t('money.top3')}</Text>
            <Text variant="caption" color="tertiary">
              {t('money.byPeriodSum')}
            </Text>
          </View>
          <View style={styles.topClients}>
            {topClients.map((client, index) => {
              const name = [client.first_name, client.last_name].filter(Boolean).join(' ');
              return (
                <Pressable
                  key={client.client_id}
                  accessibilityRole="link"
                  onPress={() => router.push(`/clients/${client.client_id}`)}
                  style={[styles.topClient, index > 0 && styles.rowDivider]}>
                  <Avatar name={name} color={client.avatar_color} size="sm" />
                  <View style={styles.grow}>
                    <Text variant="subheadStrong" numberOfLines={1}>
                      {name}
                    </Text>
                    <Text variant="caption" color="tertiary" tabularNums>
                      {plural('money.visits', client.visits)}
                    </Text>
                  </View>
                  <Text variant="subheadStrong" tabularNums>
                    {ctx.money(client.amount)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <Heading
        title={t('money.busyDays')}
        subtitle={
          peakHour === null
            ? undefined
            : t('money.peakHour', { from: hour(peakHour), to: hour((peakHour + 1) % 24) })
        }
      />
      <BusyBars counts={busyDays} labels={weekdays} />
      <View style={styles.pair}>
        <View style={styles.pairTile}>
          <Text variant="caption" color="secondary">
            {t('money.loadHours')}
          </Text>
          <Text variant="pageTitle" tabularNums>
            {current.load_pct === null ? '—' : `${current.load_pct}%`}
          </Text>
        </View>
        <View style={styles.pairTile}>
          <Text variant="caption" color="secondary">
            {t('money.freeWindows')}
          </Text>
          <Text variant="pageTitle" tabularNums>
            {current.free_minutes === null
              ? '—'
              : t('money.hoursShort', { count: Math.round(current.free_minutes / 60) })}
          </Text>
        </View>
      </View>

      <Heading title={t('money.lossesTitle')} />
      <View style={styles.summary}>
        <SummaryRow label={t('money.noShows')} value={ctx.number(losses.no_shows)} />
        <View style={styles.divider} />
        <SummaryRow label={t('money.clientCancels')} value={ctx.number(losses.client_cancels)} />
        <View style={styles.divider} />
        <SummaryRow
          label={t('money.lost')}
          value={ctx.money(losses.lost)}
          valueColor={losses.lost > 0 ? 'danger' : undefined}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  grow: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.6 },
  heading: {
    marginTop: theme.space[7],
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.space[2.5],
  },
  summary: {
    marginTop: theme.space[2.5],
    paddingHorizontal: theme.space[3.5],
    paddingVertical: theme.space[1],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.surface,
  },
  summaryRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space[3],
  },
  divider: { height: 1, backgroundColor: theme.colors.border.default },
  legendList: { marginTop: theme.space[3] },
  legendRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: theme.space[2.5] },
  legendValue: { minWidth: 92, textAlign: 'right' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  smallDot: { width: 8, height: 8, borderRadius: 4 },
  addExpense: {
    marginTop: theme.space[2],
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.strong,
  },
  paymentLegend: {
    marginTop: theme.space[3],
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: theme.space[4],
    rowGap: theme.space[1.5],
  },
  paymentItem: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1.5] },
  services: { marginTop: theme.space[3], gap: theme.space[3.5] },
  service: { flexDirection: 'row', gap: theme.space[2.5] },
  serviceRank: { width: 14 },
  serviceBody: { flex: 1, minWidth: 0, gap: theme.space[1.5] },
  serviceTop: { flexDirection: 'row', gap: theme.space[2.5] },
  track: { height: 6, borderRadius: 3, backgroundColor: theme.colors.bg.sunken },
  trackFill: { height: 6, borderRadius: 3 },
  clientMix: {
    marginTop: theme.space[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[4.5],
  },
  clientMixList: { flex: 1, gap: theme.space[2.5] },
  mixRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  topHeading: {
    marginTop: theme.space[5],
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  topClients: {
    marginTop: theme.space[2],
    paddingHorizontal: theme.space[3.5],
    paddingVertical: 2,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.surface,
  },
  topClient: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  rowDivider: { borderTopWidth: 1, borderTopColor: theme.colors.border.default },
  pair: { marginTop: theme.space[3.5], flexDirection: 'row', gap: theme.space[2] },
  pairTile: {
    flex: 1,
    gap: theme.space[1],
    padding: theme.space[3.5],
    borderRadius: theme.radius.block,
    backgroundColor: theme.colors.bg.surface,
  },
}));
