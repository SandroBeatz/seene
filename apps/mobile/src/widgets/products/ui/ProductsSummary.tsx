/**
 * Two numbers over the list: what went on purchases this month and what sits on the shelf.
 * Finances keep one "Материалы" line; the detail lives here. Not in the design.
 */
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useMoneyContext } from '@/entities/master';
import {
  monthChange,
  purchaseTotals,
  shelfValue,
  useProductPurchasesQuery,
  type Product,
} from '@/entities/product';
import { Text } from '@/shared/ui';

export function ProductsSummary({
  userId,
  products,
}: {
  userId: string;
  products: readonly Product[];
}) {
  const { t } = useTranslation();
  const { money, zone } = useMoneyContext(userId);
  const month = DateTime.now().setZone(zone).startOf('month');
  const purchases = useProductPurchasesQuery(userId, month.minus({ months: 1 }).toISO() ?? '');
  const { current, previous } = purchaseTotals(purchases.data ?? [], month.toISO() ?? '');
  const change = monthChange(current, previous);
  const changeText =
    change === null
      ? t('menuHome.products.sameBase')
      : t(change > 0 ? 'menuHome.products.up' : 'menuHome.products.down', {
          percent: Math.abs(change),
        });

  return (
    <View style={styles.row}>
      <Tile
        label={t('menuHome.products.boughtMonth')}
        value={purchases.data ? money(current) : '—'}
        note={changeText}
      />
      <Tile
        label={t('menuHome.products.shelf')}
        value={money(shelfValue(products))}
        note={t('menuHome.products.shelfHint')}
      />
    </View>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <View style={styles.tile}>
      <Text variant="caption" color="secondary" numberOfLines={2}>
        {label}
      </Text>
      <Text variant="title3" tabularNums numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="caption" color="tertiary" numberOfLines={1}>
        {note}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: theme.space[2.5], marginBottom: theme.space[3] },
  tile: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    padding: theme.space[3.5],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.bg.surface,
  },
}));
