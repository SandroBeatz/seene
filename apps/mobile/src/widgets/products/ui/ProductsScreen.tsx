/**
 * "Товары и материалы" (design AppProdList). Selling to clients waits for its design, so the
 * hint under the list speaks only of purchases.
 */
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useMasterSettingsQuery, useMoneyContext } from '@/entities/master';
import { isLowStock, useProductsQuery, type Product } from '@/entities/product';
import { useUserId } from '@/entities/session';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { formatAmount } from '@/shared/lib/formats';
import { pluralCategory } from '@/shared/lib/i18n';
import {
  Chip,
  ChipRow,
  EmptyState,
  ErrorState,
  GroupedCard,
  Icon,
  IconButton,
  SearchField,
  SectionLabel,
  SkeletonList,
  Text,
} from '@/shared/ui';
import { filterProducts, type TypeFilter } from '../lib/products';

const openNew = () => router.push('/product/new');

export function ProductsScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const userId = useUserId() ?? '';
  const products = useProductsQuery(userId);
  const settings = useMasterSettingsQuery(userId);
  const { locale } = useMoneyContext(userId);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [lowOnly, setLowOnly] = useState(false);

  const addA11y = t('menuHome.products.addA11y');
  const addButton =
    process.env.EXPO_OS === 'ios' ? (
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="plus"
          variant="prominent"
          tintColor={theme.colors.content.primary}
          accessibilityLabel={addA11y}
          onPress={openNew}
        />
      </Stack.Toolbar>
    ) : (
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              icon="add"
              variant="accent"
              accessibilityLabel={addA11y}
              onPress={openNew}
            />
          ),
        }}
      />
    );

  if (products.isError) {
    return (
      <ErrorState
        message={t(errorMessageKey(normalizeError(products.error)))}
        onRetry={() => void products.refetch()}
      />
    );
  }

  const all = products.data ?? [];
  const lowCount = all.filter(isLowStock).length;
  // The last low product restocked: nothing left to narrow down to.
  const onlyLow = lowOnly && lowCount > 0;
  const visible = filterProducts(all, { query, type, lowOnly: onlyLow });
  const quantity = (value: number) => new Intl.NumberFormat(locale).format(value);
  const money = (value: number) =>
    formatAmount(value, { currency: settings.data?.currency ?? 'EUR', locale });
  const unit = (product: Product) => t(`menuHome.products.units.${product.unit}`);
  const stockText = (product: Product) => `${quantity(product.stock)} ${unit(product)}`;

  const subtitle = (product: Product) => {
    const price =
      product.type === 'sale'
        ? product.sell_price !== null &&
          t('menuHome.products.priceSell', { price: money(product.sell_price) })
        : product.buy_price !== null &&
          t('menuHome.products.priceBuy', { price: money(product.buy_price) });
    const stock = t('menuHome.products.stockOf', { stock: stockText(product) });
    return price ? `${stock} · ${price}` : stock;
  };

  const row = (product: Product, index: number) => (
    <Pressable
      key={product.id}
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: '/product/[productId]', params: { productId: product.id } })
      }
      style={({ pressed }) => [
        styles.row,
        index > 0 && styles.separator,
        pressed && styles.pressed,
      ]}>
      <View style={styles.rowText}>
        <View style={styles.title}>
          <Text variant="body" numberOfLines={1} style={styles.name}>
            {product.name}
          </Text>
          {isLowStock(product) ? (
            <View style={[styles.pill, styles.pillLow]}>
              <Text variant="caption2Strong" style={styles.pillLowText}>
                {t('menuHome.products.low')}
              </Text>
            </View>
          ) : product.type === 'sale' ? (
            <View style={[styles.pill, styles.pillSale]}>
              <Text variant="caption2Strong" style={styles.pillSaleText}>
                {t('menuHome.products.forSale')}
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="caption" color="tertiary" tabularNums numberOfLines={1}>
          {subtitle(product)}
        </Text>
      </View>
      <Text variant="subheadMedium" tabularNums>
        {stockText(product)}
      </Text>
      <Icon name="chevronRight" size="sm" color="content.tertiary" />
    </Pressable>
  );

  const section = (key: 'work' | 'sale') => {
    const rows = visible.filter((product) => product.type === key);
    if (!rows.length) return null;
    return (
      <View key={key} style={styles.section}>
        <SectionLabel label={t(`menuHome.products.types.${key}`)} />
        <GroupedCard variant="menu">{rows.map(row)}</GroupedCard>
      </View>
    );
  };

  const count = (key: 'work' | 'sale') => all.filter((product) => product.type === key).length;

  return (
    <>
      {addButton}
      <ScrollView
        style={styles.root}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {products.isPending ? (
          <SkeletonList rows={5} />
        ) : all.length === 0 ? (
          <EmptyState
            icon="services"
            title={t('menuHome.products.emptyTitle')}
            description={t('menuHome.products.emptyText')}
            actionLabel={t('menuHome.products.add')}
            onAction={openNew}
          />
        ) : (
          <>
            <SearchField
              accessibilityLabel={t('common.search')}
              placeholder={t('common.search')}
              value={query}
              onChangeText={setQuery}
            />
            <View style={styles.chips}>
              <ChipRow>
                <Chip
                  size="filter"
                  shape="pill"
                  label={`${t('menuHome.products.all')} ${all.length}`}
                  selected={type === 'all'}
                  onPress={() => setType('all')}
                />
                {(['work', 'sale'] as const).map((key) => (
                  <Chip
                    key={key}
                    size="filter"
                    shape="pill"
                    label={`${t(`menuHome.products.types.${key}`)} ${count(key)}`}
                    selected={type === key}
                    onPress={() => setType(key)}
                  />
                ))}
              </ChipRow>
            </View>
            {lowCount > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: onlyLow }}
                onPress={() => setLowOnly(!onlyLow)}
                style={({ pressed }) => [styles.banner, pressed && styles.pressed]}>
                <Icon name="warning" size="base" color="tone.warning.fg" />
                <Text variant="subheadMedium" style={styles.bannerText}>
                  {t(`menuHome.products.running_${pluralCategory(lowCount, locale)}`, {
                    count: lowCount,
                  })}
                </Text>
                <Text variant="footnoteStrong" style={styles.bannerAction}>
                  {t(onlyLow ? 'menuHome.products.showAll' : 'menuHome.products.show')}
                </Text>
              </Pressable>
            ) : null}
            {visible.length ? (
              <>
                {section('work')}
                {section('sale')}
              </>
            ) : (
              <Text variant="subhead" color="tertiary" align="center" style={styles.none}>
                {t('menuHome.products.nothingFound')}
              </Text>
            )}
            <Text variant="caption" color="tertiary" style={styles.hint}>
              {t('menuHome.products.hint')}
            </Text>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  content: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.space[2],
    paddingBottom: theme.space[6],
  },
  chips: { marginTop: theme.space[3] },
  banner: {
    marginTop: theme.space[3.5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2.5],
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.tone.warning.bg,
  },
  bannerText: { flex: 1, color: theme.colors.tone.warning.fg },
  bannerAction: { color: theme.colors.tone.warning.fg },
  section: { marginTop: theme.space[5], gap: theme.space[2] },
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  separator: { borderTopWidth: 1, borderTopColor: theme.colors.border.default },
  pressed: { opacity: 0.7 },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  title: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1 },
  pill: { height: 18, paddingHorizontal: 7, borderRadius: 9, justifyContent: 'center' },
  pillLow: { backgroundColor: theme.colors.tone.warning.bg },
  pillLowText: { color: theme.colors.tone.warning.fg },
  pillSale: { backgroundColor: theme.colors.tone.success.bg },
  pillSaleText: { color: theme.colors.tone.success.fg },
  none: { marginTop: theme.space[6] },
  hint: { marginTop: theme.space[2.5], marginHorizontal: theme.space[1] },
}));
