/**
 * "Товары и материалы" (design AppProdList). Selling to clients waits for its design, so the
 * hint under the list speaks only of purchases.
 */
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useMoneyContext } from '@/entities/master';
import {
  filterProducts,
  isLowStock,
  PRODUCT_TYPES,
  toPackages,
  useProductsQuery,
  visitsLeft,
  type Product,
  type ProductType,
  type TypeFilter,
} from '@/entities/product';
import { useUserId } from '@/entities/session';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
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
import { ProductsSummary } from './ProductsSummary';

const openNew = () => router.push('/product/new');

export function ProductsScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const userId = useUserId() ?? '';
  const products = useProductsQuery(userId);
  const { locale, money, number } = useMoneyContext(userId);
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

  if (products.isError && !products.data) {
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
  const showingLow = lowOnly && lowCount > 0;
  const visible = filterProducts(all, { query, type, lowOnly: showingLow });

  const priceText = (product: Product) => {
    if (product.type === 'sale') {
      return product.sell_price === null
        ? null
        : t('menuHome.products.priceSell', { price: money(product.sell_price) });
    }
    return product.buy_price === null
      ? null
      : t('menuHome.products.priceBuy', { price: money(product.buy_price) });
  };

  const row = (product: Product) => {
    const stockText = `${number(toPackages(product.stock, product.pack_size))} ${t(`menuHome.products.units.${product.unit}`)}`;
    const stock = t('menuHome.products.stockOf', { stock: stockText });
    const price = priceText(product);
    const visits = visitsLeft(product);
    const subtitle =
      visits === null
        ? price
          ? `${stock} · ${price}`
          : stock
        : visits > 0
          ? t(`menuHome.products.visitsLeft_${pluralCategory(visits, locale)}`, { count: visits })
          : t('menuHome.products.visitsNone');
    return (
      <Pressable
        key={product.id}
        accessibilityRole="button"
        onPress={() =>
          router.push({ pathname: '/product/[productId]', params: { productId: product.id } })
        }
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
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
            {subtitle}
          </Text>
        </View>
        <Text variant="subheadMedium" tabularNums>
          {stockText}
        </Text>
        <Icon name="chevronRight" size="sm" color="content.tertiary" />
      </Pressable>
    );
  };

  const section = (key: ProductType) => {
    const rows = visible.filter((product) => product.type === key);
    if (!rows.length) return null;
    return (
      <View key={key} style={styles.section}>
        <SectionLabel label={t(`menuHome.products.types.${key}`)} />
        <GroupedCard variant="menu">{rows.map(row)}</GroupedCard>
      </View>
    );
  };

  const count = (key: ProductType) => all.filter((product) => product.type === key).length;

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
            icon="tube"
            title={t('menuHome.products.emptyTitle')}
            description={t('menuHome.products.emptyText')}
            actionLabel={t('menuHome.products.add')}
            onAction={openNew}
          />
        ) : (
          <>
            <ProductsSummary userId={userId} products={all} />
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
                {PRODUCT_TYPES.map((key) => (
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
                accessibilityState={{ selected: showingLow }}
                onPress={() => setLowOnly(!showingLow)}
                style={({ pressed }) => [styles.banner, pressed && styles.pressed]}>
                <Icon name="warning" size="base" color="tone.warning.fg" />
                <Text variant="subheadMedium" style={styles.bannerText}>
                  {t(`menuHome.products.running_${pluralCategory(lowCount, locale)}`, {
                    count: lowCount,
                  })}
                </Text>
                <Text variant="footnoteStrong" style={styles.bannerAction}>
                  {t(showingLow ? 'menuHome.products.showAll' : 'menuHome.products.show')}
                </Text>
              </Pressable>
            ) : null}
            {visible.length ? (
              PRODUCT_TYPES.map(section)
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
