/** A new product or an existing one (design AppProdNew, AppProdEdit). */
import { router, useLocalSearchParams } from 'expo-router';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useMoneyContext } from '@/entities/master';
import {
  contentUnitCost,
  fromPackages,
  linkedSummary,
  linksValid,
  parseQuantity,
  sameLinks,
  PRODUCT_CONTENT_UNITS,
  PRODUCT_TYPES,
  PRODUCT_UNITS,
  QuantityStepper,
  rebaseAmount,
  stockDelta,
  toPackages,
  useDeleteProductMutation,
  useProductsQuery,
  useSaveProductMutation,
  type Product,
  type ProductContentUnit,
  type ProductType,
  type ProductUnit,
} from '@/entities/product';
import { useServicesQuery } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import {
  Button,
  Chip,
  ChipRow,
  ErrorState,
  FormScreen,
  GroupedCard,
  Input,
  ListItem,
  MenuRow,
  SheetChrome,
  Skeleton,
  Switch,
  Text,
} from '@/shared/ui';
import { useProductLinks } from '../model/links.store';

/** The design's threshold on a new product. */
const DEFAULT_LOW_STOCK = 5;

export function ProductSheet() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const userId = useUserId() ?? '';
  const { t } = useTranslation();
  const products = useProductsQuery(userId);
  if (productId && !products.data) {
    return products.isError ? (
      <ErrorState
        message={t(errorMessageKey(normalizeError(products.error)))}
        onRetry={() => void products.refetch()}
      />
    ) : (
      <View style={styles.loading}>
        <Skeleton height={320} />
      </View>
    );
  }
  const product = products.data?.find((item) => item.id === productId);
  // Deleted while open: the sheet is on its way out.
  if (productId && !product) return null;
  return <ProductForm key={productId ?? 'new'} product={product} userId={userId} />;
}

function ProductForm({ product, userId }: { product?: Product; userId: string }) {
  const { t } = useTranslation();
  const { zone, currencyLabel, money, number } = useMoneyContext(userId);
  const services = useServicesQuery(userId);
  const save = useSaveProductMutation(userId);
  const remove = useDeleteProductMutation(userId);

  const [name, setName] = useState(product?.name ?? '');
  const [type, setType] = useState<ProductType>(product?.type ?? 'sale');
  const [unit, setUnit] = useState<ProductUnit>(product?.unit ?? 'pcs');
  const [contentUnit, setContentUnit] = useState<ProductContentUnit>(product?.content_unit ?? 'ml');
  const [partial, setPartial] = useState(!!product?.content_unit);
  const [content, setContent] = useState(product?.content_unit ? String(product.pack_size) : '');
  // In packages, as typed. Null until touched: the saved amount stays exact, 29 ml of 30 is
  // shown as 0.97 and must not save back as 29.1.
  const [stockEdit, setStockEdit] = useState<string | null>(null);
  const [lowEdit, setLowEdit] = useState<string | null>(null);
  const [buy, setBuy] = useState(product?.buy_price?.toString() ?? '');
  const [sell, setSell] = useState(product?.sell_price?.toString() ?? '');
  const [toExpense, setToExpense] = useState(product?.expense_on_restock ?? true);

  const links = useProductLinks((s) => s.links);
  const beginLinks = useProductLinks((s) => s.begin);
  const [linksBefore] = useState(() =>
    Object.fromEntries((product?.services ?? []).map((s) => [s.service_id, String(s.quantity)])),
  );
  useEffect(() => beginLinks(linksBefore), [linksBefore, beginLinks]);

  const failed = () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage'));
  const options = { onSuccess: () => router.back(), onError: failed };

  const packNow = partial ? parseQuantity(content) || null : null;
  const packSize = packNow ?? 1;
  const packBefore = product?.content_unit ? product.pack_size : null;
  const stockBase = rebaseAmount(product?.stock ?? 0, packBefore, packNow);
  const lowBase = rebaseAmount(product?.low_stock ?? DEFAULT_LOW_STOCK, packBefore, packNow);
  const stock = stockEdit ?? String(toPackages(stockBase, packSize));
  const lowStock = lowEdit ?? String(toPackages(lowBase, packSize));
  const stockValue = parseQuantity(stock);
  const lowValue = parseQuantity(lowStock);
  const priceOf = (text: string) => (text.trim() ? parseQuantity(text) : null);
  const forSale = type === 'sale';
  const buyValue = priceOf(buy);
  const sellValue = priceOf(sell);
  const contentValid = !partial || packNow !== null;
  const pricesValid =
    (!buy.trim() || buyValue !== null) && (!forSale || !sell.trim() || sellValue !== null);
  const canSave =
    !!name.trim() &&
    stockValue !== null &&
    lowValue !== null &&
    contentValid &&
    pricesValid &&
    linksValid(links);

  const submit = () => {
    if (stockValue === null || lowValue === null) return;
    save.mutate(
      {
        id: product?.id,
        name: name.trim(),
        type,
        unit,
        stockDelta: stockEdit === null ? 0 : stockDelta(stockValue, stockBase, packSize),
        lowStock:
          lowValue === toPackages(lowBase, packSize) ? lowBase : fromPackages(lowValue, packSize),
        contentUnit: packNow !== null ? contentUnit : null,
        packSize,
        buyPrice: buyValue,
        // Hidden on a product for work, and kept in case it goes on sale again.
        sellPrice: forSale ? sellValue : (product?.sell_price ?? null),
        expenseOnRestock: toExpense,
        // Content added or removed changes what the amounts mean, as with the stock. What was
        // typed after that is already in the new unit.
        services: Object.entries(links).map(([service_id, quantity]) => {
          const amount = parseQuantity(quantity) ?? 1;
          return {
            service_id,
            quantity: sameLinks(linksBefore, links)
              ? rebaseAmount(amount, packBefore, packNow)
              : amount,
          };
        }),
        today: DateTime.now().setZone(zone).toISODate() ?? '',
      },
      options,
    );
  };

  const confirmDelete = () =>
    Alert.alert(t('menuHome.products.deleteTitle'), t('menuHome.products.deleteText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => product && remove.mutate(product.id, options),
      },
    ]);

  const linkedNames = (services.data ?? [])
    .filter((service) => links[service.id] !== undefined)
    .map((service) => service.name);
  const unitLabel = t(`menuHome.products.units.${unit}`);
  const contentLabel = t(`menuHome.products.units.${contentUnit}`);
  const cost = contentUnitCost(buyValue, packNow);
  const costHint =
    cost !== null
      ? t('menuHome.products.contentUnitCost', { price: money(cost), unit: contentLabel })
      : undefined;
  const amountHint =
    packNow !== null && stockValue !== null
      ? t('menuHome.products.stockAmount', {
          amount: `${number(stockEdit === null ? stockBase : fromPackages(stockValue, packSize))} ${contentLabel}`,
        })
      : t('menuHome.products.stockHint');

  return (
    <FormScreen
      edges={['left', 'right', 'bottom']}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      footer={
        <Button
          label={product ? t('common.save') : t('menuHome.products.addSubmit')}
          disabled={!canSave}
          loading={save.isPending}
          onPress={submit}
          fullWidth
        />
      }>
      <SheetChrome
        title={product ? t('menuHome.products.editTitle') : t('menuHome.products.newTitle')}
        leadingLabel={t('common.close')}
        action={
          product
            ? {
                key: 'delete',
                label: t('common.delete'),
                sf: 'trash',
                icon: 'trash',
                destructive: true,
                onPress: confirmDelete,
              }
            : undefined
        }
      />
      <Input
        variant="filled"
        label={t('menuHome.products.name')}
        placeholder={t('menuHome.products.namePlaceholder')}
        value={name}
        onChangeText={setName}
        maxLength={120}
        autoCapitalize="sentences"
      />

      <ChipField
        label={t('menuHome.products.type')}
        options={PRODUCT_TYPES}
        labelOf={(key) => t(`menuHome.products.types.${key}`)}
        value={type}
        onChange={setType}
      />

      <ChipField
        label={t('menuHome.products.unit')}
        options={PRODUCT_UNITS}
        labelOf={(key) => t(`menuHome.products.units.${key}`)}
        value={unit}
        onChange={setUnit}
      />

      <GroupedCard variant="menu">
        <ListItem
          size="menu"
          inset={false}
          title={t('menuHome.products.partial')}
          subtitle={t('menuHome.products.partialHint')}
          right={
            <Switch
              value={partial}
              onValueChange={setPartial}
              accessibilityLabel={t('menuHome.products.partial')}
            />
          }
        />
      </GroupedCard>

      {partial ? (
        <View style={styles.block}>
          <Text variant="captionMedium" color="secondary" style={styles.caption}>
            {t(`menuHome.products.contentIn.${unit}`)}
          </Text>
          <View style={styles.contentRow}>
            <View style={styles.grow}>
              <Input
                variant="filled"
                accessibilityLabel={t(`menuHome.products.contentIn.${unit}`)}
                placeholder="10"
                keyboardType="decimal-pad"
                value={content}
                onChangeText={setContent}
              />
            </View>
            {PRODUCT_CONTENT_UNITS.map((key) => (
              <Chip
                key={key}
                size="filter"
                shape="pill"
                label={t(`menuHome.products.units.${key}`)}
                selected={contentUnit === key}
                onPress={() => setContentUnit(key)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <GroupedCard variant="menu">
        <StockRow
          title={t('menuHome.products.stock')}
          hint={amountHint}
          value={stock}
          unit={unitLabel}
          onChange={setStockEdit}
        />
        <StockRow
          title={t('menuHome.products.lowStock')}
          hint={t('menuHome.products.lowStockHint')}
          value={lowStock}
          unit={unitLabel}
          onChange={setLowEdit}
        />
      </GroupedCard>

      <View style={styles.prices}>
        <View style={styles.grow}>
          <Input
            variant="filled"
            label={t('menuHome.products.buyFor', { unit: unitLabel })}
            placeholder="0"
            keyboardType="decimal-pad"
            value={buy}
            onChangeText={setBuy}
            suffix={currencyLabel}
            helpText={costHint}
          />
        </View>
        {forSale ? (
          <View style={styles.grow}>
            <Input
              variant="filled"
              label={t('menuHome.products.sellFor', { unit: unitLabel })}
              placeholder="0"
              keyboardType="decimal-pad"
              value={sell}
              onChangeText={setSell}
              suffix={currencyLabel}
            />
          </View>
        ) : null}
      </View>

      <GroupedCard variant="menu">
        <MenuRow
          title={t('menuHome.products.useOn')}
          value={linkedSummary(linkedNames) || t('menuHome.products.useOnNone')}
          onPress={() =>
            router.push({
              pathname: '/product/services',
              params: { unit: packNow !== null ? contentUnit : unit },
            })
          }
        />
        <ListItem
          size="menu"
          inset={false}
          title={t('menuHome.products.toExpense')}
          subtitle={t('menuHome.products.toExpenseHint')}
          right={
            <Switch
              value={toExpense}
              onValueChange={setToExpense}
              accessibilityLabel={t('menuHome.products.toExpense')}
            />
          }
        />
      </GroupedCard>
    </FormScreen>
  );
}

function ChipField<T extends string>({
  label,
  options,
  labelOf,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  labelOf: (key: T) => string;
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={styles.block}>
      <Text variant="captionMedium" color="secondary" style={styles.caption}>
        {label}
      </Text>
      <ChipRow>
        {options.map((key) => (
          <Chip
            key={key}
            size="filter"
            shape="pill"
            label={labelOf(key)}
            selected={value === key}
            onPress={() => onChange(key)}
          />
        ))}
      </ChipRow>
    </View>
  );
}

function StockRow({
  title,
  hint,
  value,
  unit,
  onChange,
}: {
  title: string;
  hint: string;
  value: string;
  unit: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.stockRow}>
      <View style={styles.grow}>
        <Text variant="body">{title}</Text>
        <Text variant="caption" color="tertiary">
          {hint}
        </Text>
      </View>
      <QuantityStepper value={value} unit={unit} label={title} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  loading: { padding: theme.layout.gutter },
  content: { paddingTop: theme.space[2], gap: theme.space[4] },
  block: { gap: theme.space[2] },
  caption: { marginLeft: theme.space[1] },
  stockRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[2],
  },
  grow: { flex: 1, minWidth: 0 },
  prices: { flexDirection: 'row', gap: theme.space[2.5] },
  contentRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
}));
