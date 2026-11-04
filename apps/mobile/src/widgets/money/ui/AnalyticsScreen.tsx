/**
 * "Аналитика" (design "Аналитика · по тапу на сводку дня, все блоки"). The period
 * button in the bar is a native menu; the arrows step the period, its name opens the
 * date sheet. All numbers come from one RPC.
 *
 * The design's hint about reminders ("Включить можно в «Сообщения клиентам»") is left
 * out until that page exists.
 */
import { router, Stack } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { periodDays, useMoneyOverviewQuery, type PeriodUnit } from '@/entities/analytics';
import { useMoneyContext } from '@/entities/master';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { pluralCategory } from '@/shared/lib/i18n';
import { ErrorState, Icon, ScreenScrollView, Skeleton, Text, useRefreshControl } from '@/shared/ui';
import { barsOf, metricDeltas, percentChange, type Delta, type DeltaTone } from '../model/overview';
import { usePeriod, usePeriodName } from '../model/usePeriod';
import { AnalyticsSections } from './AnalyticsSections';
import { RevenueBars } from './charts';

const UNITS: Exclude<PeriodUnit, 'custom'>[] = ['week', 'month', 'year'];

export function AnalyticsScreen() {
  const { t } = useTranslation();
  const state = usePeriod();
  const { period, range, userId, zone, todayKey } = state;
  const ctx = useMoneyContext(userId);
  const periodName = usePeriodName();
  const overview = useMoneyOverviewQuery(userId, { ...range, zone });
  const refreshControl = useRefreshControl(() => overview.refetch());
  const data = overview.data;

  const monthInitials = (t('months', { returnObjects: true }) as string[]).map((m) => m[0] ?? '');
  const weekdays = t('weekdays.short', { returnObjects: true }) as string[];

  // "в сентябре" and "с сентябрём" read on the compared month, "2025" on its year.
  const start = DateTime.fromISO(period.startKey, { zone: 'utc' });
  const prevMonth = start.minus({ months: 1 }).month - 1;
  const compareArgs = {
    monthIn: (t('money.monthsIn', { returnObjects: true }) as string[])[prevMonth],
    monthWith: (t('money.monthsWith', { returnObjects: true }) as string[])[prevMonth],
    year: start.year - 1,
  };

  const headline = () => {
    if (!data) return null;
    const change = percentChange(data.current.earned, data.previous.earned);
    if (period.unit === 'custom') {
      const days = periodDays(period);
      return {
        text: t('money.customDelta', {
          days: t(`money.days_${pluralCategory(days, ctx.locale)}`, { count: days }),
        }),
        tone: 'neutral' as DeltaTone,
      };
    }
    if (change === null) return null;
    const than = t(`money.than.${period.unit}`, compareArgs);
    if (change === 0) return { text: t('money.same'), tone: 'neutral' as DeltaTone };
    return {
      text: t(change > 0 ? 'money.more' : 'money.less', { pct: Math.abs(change), than }),
      tone: (change > 0 ? 'good' : 'bad') as DeltaTone,
    };
  };
  const delta = headline();

  const deltaText = (d: Delta | null, unit: 'count' | 'percent' | 'money') => {
    if (!d) return null;
    if (d.direction === 'same') return t('money.noChange');
    const arrow = d.direction === 'up' ? '↑' : '↓';
    if (unit === 'percent') return `${arrow} ${d.value}%`;
    if (unit === 'money') return `${arrow} ${ctx.money(d.value)}`;
    return `${arrow} ${ctx.number(d.value)}`;
  };

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu
          accessibilityLabel={t('money.periodA11y', { period: t(`money.units.${period.unit}`) })}>
          <Stack.Toolbar.Label>{t(`money.units.${period.unit}`)}</Stack.Toolbar.Label>
          {UNITS.map((unit) => (
            <Stack.Toolbar.MenuAction
              key={unit}
              isOn={period.unit === unit}
              onPress={() => state.pickUnit(unit)}>
              {t(`money.units.${unit}`)}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <ScreenScrollView
        refreshControl={refreshControl}
        padded={false}
        contentContainerStyle={styles.content}>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('money.prevPeriod')}
            onPress={() => state.step(-1)}
            style={styles.arrow}>
            <Icon name="chevronLeft" size="base" color="content.primary" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('money.pickDates')}
            onPress={() => router.push('/analytics-range')}
            style={styles.periodName}>
            <Text variant="bodyStrong" tabularNums>
              {periodName(period)}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('money.nextPeriod')}
            accessibilityState={{ disabled: !state.canGoNext }}
            disabled={!state.canGoNext}
            onPress={() => state.step(1)}
            style={styles.arrow}>
            <Icon
              name="chevronRight"
              size="base"
              color={state.canGoNext ? 'content.primary' : 'content.disabled'}
            />
          </Pressable>
        </View>

        {overview.isError && !data ? (
          <ErrorState
            message={t(errorMessageKey(normalizeError(overview.error)))}
            onRetry={() => void overview.refetch()}
          />
        ) : !data ? (
          <View style={styles.skeletons}>
            <Skeleton height={72} />
            <Skeleton height={128} />
            <Skeleton height={240} />
          </View>
        ) : (
          (() => {
            const deltas = metricDeltas(data.current, data.previous);
            const c = data.current;
            const tiles: {
              key: string;
              value: string;
              currency?: boolean;
              delta: string | null;
              tone: DeltaTone;
            }[] = [
              {
                key: 'visits',
                value: ctx.number(c.visits),
                delta: deltaText(deltas.visits, 'count'),
                tone: deltas.visits.tone,
              },
              {
                key: 'avgCheck',
                value: c.avg_check === null ? '—' : ctx.number(c.avg_check),
                currency: c.avg_check !== null,
                delta: deltaText(deltas.avgCheck, 'percent'),
                tone: deltas.avgCheck?.tone ?? 'neutral',
              },
              {
                key: 'noShows',
                value: ctx.number(c.no_shows),
                delta: deltaText(deltas.noShows, 'count'),
                tone: deltas.noShows.tone,
              },
              {
                key: 'newClients',
                value: ctx.number(c.new_clients),
                delta: deltaText(deltas.newClients, 'count'),
                tone: deltas.newClients.tone,
              },
              {
                key: 'load',
                value: c.load_pct === null ? '—' : `${c.load_pct}%`,
                delta: deltaText(deltas.load, 'percent'),
                tone: deltas.load?.tone ?? 'neutral',
              },
            ];

            return (
              <>
                <View style={styles.hero}>
                  <Text variant="footnote" color="secondary">
                    {t('money.earned')}
                  </Text>
                  <View style={styles.heroAmount}>
                    <Text variant="heroAmount" tabularNums>
                      {ctx.number(c.earned)}
                    </Text>
                    <Text variant="title2">{ctx.currencyLabel}</Text>
                  </View>
                  {delta ? (
                    <Text variant="footnoteStrong" color={toneColor(delta.tone)}>
                      {delta.text}
                    </Text>
                  ) : null}
                </View>

                <RevenueBars
                  bars={barsOf(data, period, range.granularity, todayKey, {
                    weekdays,
                    monthInitials,
                  })}
                />

                <View style={styles.tiles}>
                  {tiles.map((tile) => (
                    <View key={tile.key} style={styles.tile}>
                      <Text variant="caption" color="secondary">
                        {t(`money.tiles.${tile.key}`)}
                      </Text>
                      <View style={styles.tileValue}>
                        <Text variant="pageTitle" tabularNums numberOfLines={1}>
                          {tile.value}
                        </Text>
                        {tile.currency ? (
                          <Text variant="subheadStrong">{ctx.currencyLabel}</Text>
                        ) : null}
                      </View>
                      {tile.delta ? (
                        <Text
                          variant="captionStrong"
                          color={toneColor(tile.tone)}
                          tabularNums
                          numberOfLines={1}>
                          {tile.delta}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
                <Text variant="caption" color="tertiary" style={styles.vsNote}>
                  {t(`money.vs.${period.unit}`, compareArgs)}
                </Text>

                <AnalyticsSections overview={data} />
              </>
            );
          })()
        )}
      </ScreenScrollView>
    </>
  );
}

function toneColor(tone: DeltaTone) {
  return tone === 'good' ? 'success' : tone === 'bad' ? 'danger' : 'tertiary';
}

const styles = StyleSheet.create((theme) => ({
  content: {
    paddingTop: theme.space[2],
    paddingHorizontal: theme.space[5],
    paddingBottom: theme.space[10],
  },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  periodName: { height: 36, paddingHorizontal: theme.space[3], justifyContent: 'center' },
  skeletons: { marginTop: theme.space[3], gap: theme.space[3] },
  hero: { marginTop: theme.space[2.5], gap: theme.space[1] },
  heroAmount: { flexDirection: 'row', alignItems: 'baseline', gap: theme.space[1.5] },
  tiles: {
    marginTop: theme.space[4.5],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: theme.space[1],
    padding: theme.space[3.5],
    borderRadius: theme.radius.block,
    backgroundColor: theme.colors.bg.surface,
  },
  tileValue: { flexDirection: 'row', alignItems: 'baseline', gap: theme.space[1] },
  vsNote: { marginTop: theme.space[2] },
}));
