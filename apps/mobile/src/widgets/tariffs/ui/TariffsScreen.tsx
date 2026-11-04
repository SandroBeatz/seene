/**
 * "Тариф" (design AppTariffs). There are no purchases yet, so every master is on the free plan,
 * nothing is limited, and the paid plans say "Скоро" instead of promising a trial: a button that
 * buys nothing wouldn't pass App Store review.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon, ScreenScrollView, SegmentedControl, Text } from '@/shared/ui';

type Period = 'month' | 'year';

/** Plans are sold in US dollars, whatever currency the master works in. Pro's price is a working one. */
const FREE_PRICE = '$0';
const PRO_PRICE = { month: '$5.99', year: '$57.49' } as const;

export function TariffsScreen() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('month');

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <SegmentedControl
        accessibilityLabel={t('menuHome.tariffs.periodA11y')}
        options={[
          { value: 'month', label: t('menuHome.tariffs.month') },
          { value: 'year', label: t('menuHome.tariffs.year') },
        ]}
        value={period}
        onChange={setPeriod}
      />

      <PlanCard
        title={t('menuHome.tariffs.free.title')}
        price={FREE_PRICE}
        note={t('menuHome.tariffs.free.note')}
        features={[
          t('menuHome.tariffs.free.f1'),
          t('menuHome.tariffs.free.f2'),
          t('menuHome.tariffs.free.f3'),
          t('menuHome.tariffs.free.f4'),
        ]}
        missing={[t('menuHome.tariffs.free.m1'), t('menuHome.tariffs.free.m2')]}
        status={t('menuHome.tariffs.current')}
      />

      <PlanCard
        featured
        title={t('menuHome.tariffs.pro.title')}
        badge={t('menuHome.tariffs.pro.badge')}
        price={PRO_PRICE[period]}
        per={t(`menuHome.tariffs.per.${period}`)}
        note={t('menuHome.tariffs.pro.note')}
        features={[
          t('menuHome.tariffs.pro.f1'),
          t('menuHome.tariffs.pro.f2'),
          t('menuHome.tariffs.pro.f3'),
          t('menuHome.tariffs.pro.f4'),
          t('menuHome.tariffs.pro.f5'),
          t('menuHome.tariffs.pro.f6'),
        ]}
        status={t('menuHome.tariffs.soon')}
      />

      <Text variant="caption" color="tertiary" align="center" style={styles.footnote}>
        {t('menuHome.tariffs.footnote')}
      </Text>
    </ScreenScrollView>
  );
}

function PlanCard({
  title,
  badge,
  price,
  per,
  note,
  features,
  missing = [],
  status,
  featured = false,
}: {
  title: string;
  badge?: string;
  price: string;
  per?: string;
  note: string;
  features: readonly string[];
  missing?: readonly string[];
  status: string;
  featured?: boolean;
}) {
  const ink = featured ? 'onAccent' : 'primary';
  return (
    <View style={[styles.card, featured && styles.cardFeatured]}>
      <View style={styles.head}>
        <Text variant="bodyStrong" color={ink}>
          {title}
        </Text>
        {badge ? (
          <View style={styles.badge}>
            <Text variant="caption2Strong" style={styles.badgeText}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.price}>
        <Text variant="title2" tabularNums color={ink}>
          {price}
        </Text>
        {per ? (
          <Text variant="subhead" color={ink} style={styles.muted}>
            {per}
          </Text>
        ) : null}
      </View>
      <Text variant="footnote" color={ink} style={styles.muted}>
        {note}
      </Text>
      <View style={styles.list}>
        {features.map((feature) => (
          <View key={feature} style={styles.feature}>
            <Icon name="check" size="sm" color={featured ? 'accent.onAccent' : 'tone.success.fg'} />
            <Text variant="subhead" color={ink} style={styles.featureText}>
              {feature}
            </Text>
          </View>
        ))}
        {missing.map((feature) => (
          <View key={feature} style={styles.feature}>
            <Text variant="subhead" color="tertiary" align="center" style={styles.dash}>
              —
            </Text>
            <Text variant="subhead" color="tertiary" style={styles.featureText}>
              {feature}
            </Text>
          </View>
        ))}
      </View>
      <View style={[styles.status, featured && styles.statusFeatured]}>
        <Text variant="subheadMedium" color={featured ? 'onAccent' : 'secondary'}>
          {status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.space[2],
    paddingBottom: theme.space[6],
    gap: theme.space[3],
  },
  card: {
    padding: theme.space[4.5],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.bg.surface,
  },
  cardFeatured: { backgroundColor: theme.colors.accent.default },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  badge: {
    height: 22,
    paddingHorizontal: 9,
    borderRadius: 11,
    justifyContent: 'center',
    backgroundColor: theme.colors.brand.default,
  },
  badgeText: { color: theme.colors.constant.white },
  price: { marginTop: theme.space[2], flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  muted: { opacity: 0.7 },
  list: { marginTop: theme.space[3.5], gap: 9 },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space[2] },
  featureText: { flex: 1 },
  dash: { width: 16 },
  status: {
    marginTop: theme.space[4],
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  statusFeatured: { borderColor: theme.colors.accent.onAccent, opacity: 0.6 },
  footnote: { marginHorizontal: theme.space[1] },
}));
